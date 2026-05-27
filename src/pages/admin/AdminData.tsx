import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Loader2, Play, Database, Package, Video, Users, Clock, CheckCircle2, XCircle, Timer, Image, Pickaxe } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  done: { icon: CheckCircle2, color: "text-success", label: "Sucesso" },
  error: { icon: XCircle, color: "text-destructive", label: "Erro" },
  running: { icon: Timer, color: "text-warning", label: "Rodando" },
};

export default function AdminData() {
  const qc = useQueryClient();

  // Mining jobs (existing)
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["mining-jobs"],
    queryFn: async () => {
      const { data } = await supabase.from("mining_jobs").select("*").order("started_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  // Mining runs (new history)
  const { data: runs, isLoading: loadingRuns } = useQuery({
    queryKey: ["mining-runs"],
    queryFn: async () => {
      const { data } = await supabase.from("mining_runs").select("*").order("run_date", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const forceMine = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("mine-data", { body: { triggered_by: "manual" } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success("Mineração iniciada!"); qc.invalidateQueries({ queryKey: ["mining-jobs"] }); qc.invalidateQueries({ queryKey: ["mining-runs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const mineProducts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("mine-data", { body: { type: "products", triggered_by: "manual" } });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => { toast.success(`Produtos minerados: ${d?.results?.products || 0}`); qc.invalidateQueries({ queryKey: ["mining-jobs"] }); qc.invalidateQueries({ queryKey: ["mining-runs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const mineVideos = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("mine-data", { body: { type: "videos", triggered_by: "manual" } });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => { toast.success(`Vídeos minerados: ${d?.results?.videos || 0}`); qc.invalidateQueries({ queryKey: ["mining-jobs"] }); qc.invalidateQueries({ queryKey: ["mining-runs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const mineCreators = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("mine-data", { body: { type: "creators", triggered_by: "manual" } });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => { toast.success(`Criadores minerados: ${d?.results?.creators || 0}`); qc.invalidateQueries({ queryKey: ["mining-jobs"] }); qc.invalidateQueries({ queryKey: ["mining-runs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const migrateThumbs = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("migrate-thumbnails");
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => { toast.success(`Thumbnails migradas: ${d?.migrated || 0} | Restantes: ${d?.remaining || 0}`); },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = {
    done: "text-success", running: "text-warning", error: "text-destructive", pending: "text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="page-hero flex items-center justify-between mb-6">
        <div className="relative z-10">
          <span className="chip-premium mb-2 inline-flex">Mineração</span>
          <h1 className="type-hero">
            <span className="text-foreground/90">Dados & </span>
            <span className="page-title-gradient">Mineração</span>
          </h1>
        </div>
        <Button className="gradient-primary text-primary-foreground shrink-0 relative z-10" onClick={() => forceMine.mutate()} disabled={forceMine.isPending}>
          {forceMine.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Mineração Completa
        </Button>
      </div>

      {/* Individual Mining Controls */}
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => mineProducts.mutate()} disabled={mineProducts.isPending}>
                {mineProducts.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Package className="w-3.5 h-3.5 mr-1.5" />}
                Minerar Produtos
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs max-w-[220px]">Busca os produtos mais vendidos no TikTok Shop e atualiza o ranking de produtos virais</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => mineVideos.mutate()} disabled={mineVideos.isPending}>
                {mineVideos.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Video className="w-3.5 h-3.5 mr-1.5" />}
                Minerar Vídeos
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs max-w-[220px]">Coleta vídeos virais do TikTok e vincula aos produtos do ranking para calcular receita por vídeo</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => mineCreators.mutate()} disabled={mineCreators.isPending}>
                {mineCreators.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Users className="w-3.5 h-3.5 mr-1.5" />}
                Minerar Criadores
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs max-w-[220px]">Busca os criadores de conteúdo com maior engajamento e vendas no TikTok Shop</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => migrateThumbs.mutate()} disabled={migrateThumbs.isPending}>
                {migrateThumbs.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Image className="w-3.5 h-3.5 mr-1.5" />}
                Migrar Thumbnails
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs max-w-[220px]">Salva as miniaturas dos vídeos no Banco de Dados para evitar expiração das URLs do TikTok CDN. Execução automática diária.</p></TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Mining Runs History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Histórico de Execuções (mining_runs)
        </h2>
        <Card className="glass">
          <CardContent className="p-0">
            {loadingRuns ? (
              <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead><Package className="w-3.5 h-3.5 inline mr-1" />Produtos</TableHead>
                    <TableHead><Video className="w-3.5 h-3.5 inline mr-1" />Vídeos</TableHead>
                    <TableHead><Users className="w-3.5 h-3.5 inline mr-1" />Criadores</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs?.map((r: any) => {
                    const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.running;
                    const StIcon = st.icon;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-foreground text-xs">
                          {r.run_date ? new Date(r.run_date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${st.color} ${r.status === "running" ? "animate-pulse" : ""}`}>
                            <StIcon className="w-3 h-3 mr-1" />{st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">{r.products_fetched || 0}</TableCell>
                        <TableCell className="text-foreground font-medium">{r.videos_fetched || 0}</TableCell>
                        <TableCell className="text-foreground font-medium">{r.creators_fetched || 0}</TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {r.duration_ms != null ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}
                        </TableCell>
                        <TableCell className="text-destructive text-xs max-w-[200px] truncate">{r.error_message || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {(!runs || runs.length === 0) && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma execução registrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mining Jobs (existing) */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Jobs Individuais</h2>
        <Card className="glass">
          <CardContent className="p-0">
            {loadingJobs ? (
              <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs?.map((j: any) => (
                    <TableRow key={j.id}>
                      <TableCell className="capitalize text-foreground">{j.job_type}</TableCell>
                      <TableCell><Badge variant="outline" className={`capitalize ${statusColor[j.status]}`}>{j.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{j.records_fetched || 0}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{j.started_at ? new Date(j.started_at).toLocaleString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{j.finished_at ? new Date(j.finished_at).toLocaleString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-destructive text-xs max-w-[200px] truncate">{j.error_message || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
