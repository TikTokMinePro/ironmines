import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  RefreshCw, Loader2, Play, Download, Clock, CheckCircle2,
  XCircle, Timer, Package, Video, Users, Bell, Activity, Wallet, AlertTriangle
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Switch } from "@/components/ui/switch";

type JobFilter = { period: "today" | "7d" | "30d"; status: string; jobType: string };

const JOB_TYPE_LABELS: Record<string, string> = {
  products: "Produtos", videos: "Vídeos", creators: "Criadores",
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  done: { icon: CheckCircle2, color: "text-success", label: "Sucesso" },
  error: { icon: XCircle, color: "text-destructive", label: "Erro" },
  running: { icon: Timer, color: "text-warning", label: "Rodando" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pendente" },
};

export default function AdminMonitorApis() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<JobFilter>({ period: "7d", status: "all", jobType: "all" });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [page, setPage] = useState(0);

  // FAL.AI Balance
  const { data: falBalance, isLoading: loadingFal, refetch: refetchFal } = useQuery({
    queryKey: ["monitor", "fal-balance"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-fal-balance");
      if (error) throw error;
      return data;
    },
    refetchInterval: autoRefresh ? 60_000 : false,
    staleTime: 5 * 60_000,
  });
  const PAGE_SIZE = 20;

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["monitor"] });
    }, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, qc]);

  const periodStart = useMemo(() => {
    const d = new Date();
    if (filters.period === "today") d.setHours(0, 0, 0, 0);
    else if (filters.period === "7d") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, [filters.period]);

  // Last job per type
  const { data: lastJobs, isLoading: loadingCards } = useQuery({
    queryKey: ["monitor", "last-jobs"],
    queryFn: async () => {
      const types = ["products", "videos", "creators"] as const;
      const result: Record<string, any> = {};
      for (const t of types) {
        const { data } = await supabase
          .from("mining_jobs")
          .select("*")
          .eq("job_type", t)
          .not("triggered_by", "ilike", "%alerts%")
          .not("triggered_by", "ilike", "%subscriptions%")
          .order("started_at", { ascending: false })
          .limit(1)
          .single();
        result[t] = data;
      }
      return result;
    },
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  // Filtered jobs for table
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["monitor", "jobs-table", filters, page],
    queryFn: async () => {
      let query = supabase
        .from("mining_jobs")
        .select("*", { count: "exact" })
        .gte("started_at", periodStart)
        .order("started_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filters.status !== "all") query = query.eq("status", filters.status as any);
      if (filters.jobType !== "all") {
        if (filters.jobType === "alerts") {
          query = query.ilike("triggered_by", "%alerts%");
        } else if (filters.jobType === "subscriptions") {
          query = query.ilike("triggered_by", "%subscriptions%");
        } else {
          query = query.eq("job_type", filters.jobType as any)
            .not("triggered_by", "ilike", "%alerts%")
            .not("triggered_by", "ilike", "%subscriptions%");
        }
      }

      const { data, count } = await query;
      return { data: data || [], count: count || 0 };
    },
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  // Chart data (30 days)
  const { data: chartData } = useQuery({
    queryKey: ["monitor", "chart"],
    queryFn: async () => {
      const thirtyAgo = new Date();
      thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      const { data } = await supabase
        .from("mining_jobs")
        .select("started_at, status")
        .gte("started_at", thirtyAgo.toISOString())
        .order("started_at", { ascending: true });

      const days: Record<string, { date: string; done: number; error: number }> = {};
      for (const j of data || []) {
        const day = new Date(j.started_at!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        if (!days[day]) days[day] = { date: day, done: 0, error: 0 };
        if (j.status === "done") days[day].done++;
        else if (j.status === "error") days[day].error++;
      }
      return Object.values(days);
    },
  });

  // Force mine
  const forceMine = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("mine-data", {
        body: { triggered_by: "manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success("Mineração iniciada!"); qc.invalidateQueries({ queryKey: ["monitor"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Next run countdown
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0); // next midnight UTC
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const downloadCSV = () => {
    if (!jobs?.data?.length) return;
    const header = "ID,Tipo,Status,Registros,Início,Fim,Duração(ms),Erro\n";
    const rows = jobs.data.map((j: any) =>
      `${j.id},${j.job_type},${j.status},${j.records_fetched || 0},${j.started_at || ""},${j.finished_at || ""},${j.duration_ms || ""},${(j.error_message || "").replace(/,/g, ";")}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mining-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const getJobLabel = (j: any) => {
    if (j.triggered_by?.startsWith("alerts")) return "Alertas";
    if (j.triggered_by?.startsWith("subscriptions")) return "Assinaturas";
    return JOB_TYPE_LABELS[j.job_type] || j.job_type;
  };

  const totalPages = Math.ceil((jobs?.count || 0) / PAGE_SIZE);

  const cardTypes = [
    { key: "products", label: "Produtos", icon: Package },
    { key: "videos", label: "Vídeos", icon: Video },
    { key: "creators", label: "Criadores", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="page-hero flex items-center justify-between mb-6">
        <div className="relative z-10">
          <span className="chip-premium mb-2 inline-flex">Mineração</span>
          <h1 className="type-hero">
            <span className="text-foreground/90">Monitor </span>
            <span className="page-title-gradient">APIs</span>
          </h1>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardTypes.map(({ key, label, icon: Icon }) => {
          const job = lastJobs?.[key];
          const st = STATUS_CONFIG[job?.status || "pending"];
          const StIcon = st.icon;
          return (
            <Card key={key} className="glass hover:glow-sm transition-all duration-300">
              <CardContent className="p-4">
                {loadingCards ? (
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-20" /></div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <StIcon className={`w-4 h-4 ${st.color} ${job?.status === "running" ? "animate-pulse" : ""}`} />
                    </div>
                    <p className="type-overline text-muted-foreground mt-0.5">
                      {job?.started_at
                        ? new Date(job.started_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                        : "Nunca executado"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${st.color}`}>{st.label}</Badge>
                      <span className="type-overline text-muted-foreground mt-0.5">{job?.records_fetched || 0} itens</span>
                      {job?.duration_ms != null && (
                        <span className="type-overline text-muted-foreground mt-0.5">{(job.duration_ms / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Countdown card */}
        <Card className="glass hover:glow-sm transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Próxima Execução</span>
            </div>
            <p className="type-stat-lg text-primary">{countdown}</p>
            <p className="text-xs text-muted-foreground mt-1">Próximo cron: 00:00 UTC</p>
          </CardContent>
        </Card>
      </div>

      {/* FAL.AI Balance Card */}
      <Card className={`glass hover:glow-sm transition-all duration-300 ${falBalance?.is_locked ? 'border-destructive/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Wallet className="w-5 h-5 text-primary" />
                {falBalance?.is_locked && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Créditos FAL.AI</h3>
                <p className="type-overline text-muted-foreground mt-0.5">Saldo para geração de imagens Influencer IA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loadingFal ? (
                <Skeleton className="h-8 w-24" />
              ) : falBalance?.error ? (
                <Badge variant="outline" className="text-destructive">
                  <XCircle className="w-3 h-3 mr-1" /> Erro ao consultar
                </Badge>
              ) : (
                <>
                  <div className="text-right">
                    <p className={`type-stat-lg font-mono ${
                      falBalance?.is_locked ? 'text-destructive' :
                      (falBalance?.balance != null && falBalance.balance < 1) ? 'text-warning' :
                      'text-success'
                    }`}>
                      ${typeof falBalance?.balance === 'number' ? falBalance.balance.toFixed(2) : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {falBalance?.checked_at ? `Verificado ${new Date(falBalance.checked_at).toLocaleTimeString("pt-BR")}` : ''}
                    </p>
                  </div>
                  {falBalance?.is_locked ? (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Conta Bloqueada
                    </Badge>
                  ) : falBalance?.balance != null && falBalance.balance < 1 ? (
                    <Badge variant="outline" className="text-warning border-warning/30 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Saldo Baixo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-success border-success/30 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
                    </Badge>
                  )}
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => refetchFal()} className="h-8 w-8 p-0">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {falBalance?.is_locked && falBalance?.lock_reason && (
            <div className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {falBalance.lock_reason} — Recarregue em <a href="https://fal.ai/dashboard/billing" target="_blank" rel="noopener noreferrer" className="underline font-medium">fal.ai/dashboard/billing</a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData && chartData.length > 0 && (
        <Card className="glass">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-4">Jobs últimos 30 dias</h2>
            <ChartContainer config={{
              done: { label: "Sucesso", color: "hsl(var(--success))" },
              error: { label: "Erro", color: "hsl(var(--destructive))" },
            }} className="h-[200px]">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="done" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="error" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(["today", "7d", "30d"] as const).map((p) => (
          <Button key={p} size="sm" variant={filters.period === p ? "default" : "outline"}
            className={filters.period === p ? "gradient-primary text-primary-foreground" : ""}
            onClick={() => { setFilters((f) => ({ ...f, period: p })); setPage(0); }}>
            {p === "today" ? "Hoje" : p === "7d" ? "7 dias" : "30 dias"}
          </Button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        {[{ v: "all", l: "Todos" }, { v: "done", l: "✓" }, { v: "error", l: "✗" }, { v: "running", l: "▶" }].map((s) => (
          <Button key={s.v} size="sm" variant={filters.status === s.v ? "default" : "outline"}
            className={filters.status === s.v ? "gradient-primary text-primary-foreground" : ""}
            onClick={() => { setFilters((f) => ({ ...f, status: s.v })); setPage(0); }}>
            {s.l}
          </Button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        {[
          { v: "all", l: "Todos" }, { v: "products", l: "Produtos" }, { v: "videos", l: "Vídeos" },
          { v: "creators", l: "Criadores" }, { v: "alerts", l: "Alertas" }, { v: "subscriptions", l: "Assinaturas" },
        ].map((t) => (
          <Button key={t.v} size="sm" variant={filters.jobType === t.v ? "default" : "outline"}
            className={filters.jobType === t.v ? "gradient-primary text-primary-foreground" : ""}
            onClick={() => { setFilters((f) => ({ ...f, jobType: t.v })); setPage(0); }}>
            {t.l}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="glass">
        <CardContent className="p-0">
          {loadingJobs ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs?.data?.map((j: any, idx: number) => {
                  const st = STATUS_CONFIG[j.status] || STATUS_CONFIG.pending;
                  const StIcon = st.icon;
                  return (
                    <TableRow key={j.id} className="hover:bg-muted/30">
                      <TableCell className="text-muted-foreground text-xs">{page * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{getJobLabel(j)}</TableCell>
                      <TableCell className="type-overline text-muted-foreground mt-0.5">{j.triggered_by || "—"}</TableCell>
                      <TableCell className="type-overline text-muted-foreground mt-0.5">
                        {j.started_at ? new Date(j.started_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </TableCell>
                      <TableCell className="type-overline text-muted-foreground mt-0.5">
                        {j.finished_at ? new Date(j.finished_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {j.duration_ms != null ? `${(j.duration_ms / 1000).toFixed(1)}s` : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{j.records_fetched || 0}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${st.color} ${j.status === "running" ? "animate-pulse" : ""}`}>
                          <StIcon className="w-3 h-3 mr-1" />{st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => setSelectedJob(j)}>Ver</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {jobs?.data?.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum job encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button className="gradient-primary text-primary-foreground" onClick={() => forceMine.mutate()} disabled={forceMine.isPending}>
          {forceMine.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Forçar Mineração
        </Button>
        <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["monitor"] })}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
        <Button variant="outline" onClick={downloadCSV} disabled={!jobs?.data?.length}>
          <Download className="w-4 h-4 mr-2" /> CSV
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="type-overline text-muted-foreground mt-0.5">Auto-refresh 30s</span>
          <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
        </div>
      </div>

      {/* Job detail modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Job</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">ID:</span> <span className="font-mono text-foreground text-xs">{selectedJob.id}</span></div>
                <div><span className="text-muted-foreground">Tipo:</span> <span className="text-foreground">{getJobLabel(selectedJob)}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className={STATUS_CONFIG[selectedJob.status]?.color}>{STATUS_CONFIG[selectedJob.status]?.label}</Badge></div>
                <div><span className="text-muted-foreground">Origem:</span> <span className="text-foreground">{selectedJob.triggered_by || "—"}</span></div>
                <div><span className="text-muted-foreground">Registros:</span> <span className="text-foreground">{selectedJob.records_fetched || 0}</span></div>
                <div><span className="text-muted-foreground">Duração:</span> <span className="font-mono text-foreground">{selectedJob.duration_ms != null ? `${(selectedJob.duration_ms / 1000).toFixed(2)}s` : "—"}</span></div>
                <div><span className="text-muted-foreground">Início:</span> <span className="text-foreground">{selectedJob.started_at ? new Date(selectedJob.started_at).toLocaleString("pt-BR") : "—"}</span></div>
                <div><span className="text-muted-foreground">Fim:</span> <span className="text-foreground">{selectedJob.finished_at ? new Date(selectedJob.finished_at).toLocaleString("pt-BR") : "—"}</span></div>
              </div>
              {selectedJob.error_message && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Erro:</p>
                  <pre className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive font-mono whitespace-pre-wrap break-all">{selectedJob.error_message}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
