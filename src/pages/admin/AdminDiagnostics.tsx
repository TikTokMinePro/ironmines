import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Eye, UserCheck, CheckCircle2, XCircle } from "lucide-react";

function ScoreBadge({ score, pass }: { score?: number; pass?: boolean }) {
  if (score == null && pass == null) return <span className="text-muted-foreground text-xs">—</span>;
  const s = score ?? 0;
  const variant = pass === false ? "destructive" : s >= 90 ? "default" : s >= 70 ? "secondary" : "destructive";
  return (
    <Badge variant={variant} className="tabular-nums text-[11px] gap-1">
      {pass === false ? <XCircle className="w-3 h-3" /> : pass === true ? <CheckCircle2 className="w-3 h-3" /> : null}
      {score != null ? score : pass ? "OK" : "FAIL"}
    </Badge>
  );
}

export default function AdminDiagnostics() {
  const { data: generations, isLoading } = useQuery({
    queryKey: ["admin-diagnostics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("influencer_generations")
        .select("id, created_at, status, diagnostics, latency_ms, provider_model, fallback_notes")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const withDiag = generations?.filter((g: any) => {
    const d = g.diagnostics as any;
    return d && (d.product_fidelity_score != null || d.face_similarity_score != null || d.double_check_score != null);
  }) || [];

  const doneCount = withDiag.filter((g: any) => g.status === "completed" || g.status === "done").length;
  const passRate = withDiag.length ? Math.round((doneCount / withDiag.length) * 100) : 0;
  const avgLatency = withDiag.length
    ? Math.round(withDiag.reduce((sum: number, g: any) => sum + ((g.diagnostics as any)?.total_latency_ms || g.latency_ms || 0), 0) / withDiag.length)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Diagnóstico de Auditorias</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass"><CardContent className="p-4"><p className="text-2xl font-bold text-primary">{generations?.length || 0}</p><p className="text-xs text-muted-foreground">Total gerações</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4"><p className="text-2xl font-bold text-secondary">{withDiag.length}</p><p className="text-xs text-muted-foreground">Com diagnóstico</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4"><p className="text-2xl font-bold text-primary">{passRate}%</p><p className="text-xs text-muted-foreground">Taxa de aprovação</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4"><p className="text-2xl font-bold text-secondary">{(avgLatency / 1000).toFixed(1)}s</p><p className="text-xs text-muted-foreground">Latência média</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Audit 1 — Fidelidade do Produto</span>
        <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-secondary" /> Audit 2 — Similaridade Facial</span>
        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-muted-foreground" /> Audit 3 — Double-Check</span>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center"><span className="flex items-center gap-1 justify-center"><ShieldCheck className="w-3.5 h-3.5" />Produto</span></TableHead>
                    <TableHead className="text-center"><span className="flex items-center gap-1 justify-center"><UserCheck className="w-3.5 h-3.5" />Facial</span></TableHead>
                    <TableHead className="text-center"><span className="flex items-center gap-1 justify-center"><Eye className="w-3.5 h-3.5" />Double</span></TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Latência</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generations?.map((g: any) => {
                    const d = (g.diagnostics || {}) as any;
                    const totalMs = d.total_latency_ms || g.latency_ms;
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(g.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={g.status === "completed" || g.status === "done" ? "default" : g.status === "error" ? "destructive" : "secondary"} className="text-[11px]">
                            {g.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <ScoreBadge score={d.product_fidelity_score} pass={d.product_fidelity_score != null ? d.product_fidelity_score >= 70 : undefined} />
                        </TableCell>
                        <TableCell className="text-center">
                          <ScoreBadge score={d.face_similarity_score} pass={d.face_similarity_pass} />
                        </TableCell>
                        <TableCell className="text-center">
                          <ScoreBadge score={d.double_check_score} pass={d.double_check_pass} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{g.provider_model || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs tabular-nums">
                          {totalMs ? `${(totalMs / 1000).toFixed(1)}s` : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate" title={d.product_fidelity_reason || g.fallback_notes || ""}>
                          {g.fallback_notes || (d.kontext_attempts > 1 ? `${d.kontext_attempts} tentativas` : "—")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
