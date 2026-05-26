import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, TrendingDown, TrendingUp, ShoppingCart, BarChart3 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from "recharts";

export default function AdminSales() {
  const { data: subs } = useQuery({
    queryKey: ["admin-sales-data"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, profiles:user_id(name, email)").order("created_at", { ascending: false }).limit(1000);
      return data || [];
    },
  });

  const { data: profilesCount } = useQuery({
    queryKey: ["admin-total-users"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const now = new Date();
  const activeSubs = subs?.filter((s: any) => s.status === "active") || [];
  const cancelledSubs = subs?.filter((s: any) => s.status === "cancelled") || [];
  const mrr = activeSubs.reduce((sum: number, s: any) => sum + ((s.amount_cents || 0) / 100 / (s.duration_months || 1)), 0);

  // Revenue by period
  const getRevenue = (days: number) => {
    const start = new Date();
    start.setDate(start.getDate() - days);
    return subs?.filter((s: any) => new Date(s.created_at) >= start && s.status !== "pending")
      .reduce((sum: number, s: any) => sum + ((s.amount_cents || 0) / 100), 0) || 0;
  };

  const revenue7d = getRevenue(7);
  const revenue30d = getRevenue(30);
  const revenue90d = getRevenue(90);

  // Churn rate (cancelled in last 30d / active at start of period)
  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const cancelledLast30d = subs?.filter((s: any) => s.status === "cancelled" && s.cancelled_at && new Date(s.cancelled_at) >= thirtyAgo).length || 0;
  const churnRate = activeSubs.length > 0 ? ((cancelledLast30d / (activeSubs.length + cancelledLast30d)) * 100) : 0;

  // Revenue chart (last 30 days, grouped by day)
  const revenueChart = (() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      days[key] = 0;
    }
    subs?.filter((s: any) => {
      const created = new Date(s.created_at);
      return created >= thirtyAgo && s.status !== "pending";
    }).forEach((s: any) => {
      const key = new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (days[key] !== undefined) days[key] += (s.amount_cents || 0) / 100;
    });
    return Object.entries(days).map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));
  })();

  // Subscriptions by plan
  const planBreakdown = (() => {
    const plans: Record<string, number> = {};
    activeSubs.forEach((s: any) => {
      const key = s.duration_months === 1 ? "Mensal" : s.duration_months === 3 ? "Trimestral" : "Semestral";
      plans[key] = (plans[key] || 0) + 1;
    });
    return Object.entries(plans).map(([name, count]) => ({ name, count }));
  })();

  const kpis = [
    { label: "MRR", value: `R$ ${mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-success" },
    { label: "Receita 30d", value: `R$ ${revenue30d.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-primary" },
    { label: "Assinaturas Ativas", value: activeSubs.length, icon: Users, color: "text-secondary" },
    { label: "Total Usuários", value: profilesCount, icon: ShoppingCart, color: "text-muted-foreground" },
    { label: "Churn Rate 30d", value: `${churnRate.toFixed(1)}%`, icon: TrendingDown, color: churnRate > 10 ? "text-destructive" : "text-warning" },
    { label: "Receita 7d", value: `R$ ${revenue7d.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Vendas & Faturamento</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="glass">
            <CardContent className="p-4">
              <k.icon className={`w-5 h-5 ${k.color} mb-2`} />
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="glass">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Receita últimos 30 dias (R$)</h2>
          <ChartContainer config={{
            revenue: { label: "Receita", color: "hsl(var(--primary))" },
          }} className="h-[250px]">
            <AreaChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="revenue" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Plan Breakdown */}
      {planBreakdown.length > 0 && (
        <Card className="glass">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-4">Distribuição por Plano</h2>
            <ChartContainer config={{
              count: { label: "Assinaturas", color: "hsl(var(--secondary))" },
            }} className="h-[200px]">
              <BarChart data={planBreakdown}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
