import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Filter, Mail, AlertTriangle, CheckCircle2, XCircle, Clock, Users, DollarSign, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: "Ativa", color: "text-success", icon: CheckCircle2 },
  expired: { label: "Expirada", color: "text-warning", icon: AlertTriangle },
  cancelled: { label: "Cancelada", color: "text-destructive", icon: XCircle },
  pending: { label: "Pendente", color: "text-muted-foreground", icon: Clock },
};

const durationLabels: Record<number, string> = { 1: "1 Mês", 3: "3 Meses", 6: "6 Meses" };

export default function AdminSubscriptions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: subs, isLoading } = useQuery({
    queryKey: ["admin-subs-full"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, profiles:user_id(name, email)").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const now = new Date();
  const activeSubs = subs?.filter((s: any) => s.status === "active") || [];
  const cancelledSubs = subs?.filter((s: any) => s.status === "cancelled") || [];
  const expiredSubs = subs?.filter((s: any) => s.status === "expired") || [];
  const pendingRenewal = activeSubs.filter((s: any) => {
    if (!s.expires_at) return false;
    const daysLeft = Math.ceil((new Date(s.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  });
  const expiringIn3Days = activeSubs.filter((s: any) => {
    if (!s.expires_at) return false;
    const daysLeft = Math.ceil((new Date(s.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  });

  const mrr = activeSubs.reduce((sum: number, s: any) => sum + ((s.amount_cents || 0) / 100 / (s.duration_months || 1)), 0);

  const kpis = [
    { label: "Assinaturas Ativas", value: activeSubs.length, icon: Users, color: "text-success" },
    { label: "Renovação Pendente", value: pendingRenewal.length, icon: RefreshCw, color: "text-warning" },
    { label: "Expirando em 3 dias", value: expiringIn3Days.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Cancelamentos", value: cancelledSubs.length, icon: TrendingDown, color: "text-destructive" },
  ];

  const filtered = (subs || []).filter((s: any) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const profile = (s as any).profiles;
      const name = profile?.name?.toLowerCase() || "";
      const email = profile?.email?.toLowerCase() || "";
      return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    }
    return true;
  });

  const getDaysLeft = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    return Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const sendRenewalEmail = async (sub: any) => {
    try {
      const { error } = await supabase.functions.invoke("send-notification-email", {
        body: { user_id: sub.user_id, template_slug: "renewal_discount" },
      });
      if (error) throw error;
      toast.success("Email de renovação enviado!");
    } catch (e: any) {
      toast.error("Erro ao enviar email: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-hero flex items-center justify-between mb-6">
        <div className="relative z-10">
          <span className="chip-premium mb-2 inline-flex">Gestão</span>
          <h1 className="type-hero">
            <span className="text-foreground/90"> </span>
            <span className="page-title-gradient">Assinaturas</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="glass">
            <CardContent className="p-4">
              <k.icon className={`w-5 h-5 ${k.color} mb-2`} />
              <p className={`type-stat-lg ${k.color}`}>{k.value}</p>
              <p className="type-overline text-muted-foreground mt-0.5">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Dias restantes</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => {
                const profile = (s as any).profiles;
                const st = STATUS_MAP[s.status] || STATUS_MAP.pending;
                const StIcon = st.icon;
                const daysLeft = getDaysLeft(s.expires_at);
                const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft > 0;
                const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                return (
                  <TableRow key={s.id} className={isUrgent ? "bg-destructive/5" : isExpiringSoon ? "bg-warning/5" : ""}>
                    <TableCell className="font-medium text-foreground">{profile?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{profile?.email || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{durationLabels[s.duration_months] || s.duration_months}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">R$ {((s.amount_cents || 0) / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${st.color}`}>
                        <StIcon className="w-3 h-3 mr-1" />{st.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.expires_at ? new Date(s.expires_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      {daysLeft !== null ? (
                        <Badge variant={isUrgent ? "destructive" : isExpiringSoon ? "secondary" : "outline"} className="text-xs">
                          {daysLeft <= 0 ? "Expirado" : `${daysLeft}d`}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {s.status === "active" && isExpiringSoon && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => sendRenewalEmail(s)}>
                          <Mail className="w-3 h-3 mr-1" /> Enviar Oferta
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma assinatura encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
