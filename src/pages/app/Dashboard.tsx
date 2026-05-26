import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, Video, Sparkles, ArrowRight, Clock, Package, Star,
  DollarSign, ChevronUp, ChevronDown, Eye, Users, BarChart3, Flame, Play, Hand, Heart
} from "lucide-react";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { AnimatePresence, motion } from "framer-motion";
import { PageTransition, PageSection, StaggerGrid, StaggerItem } from "@/components/PageTransition";
import { DashboardParticles } from "@/components/DashboardParticles";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

import { fmt, fmtBRL } from "@/lib/formatters";

export default function Dashboard() {
  const { profile, justLoggedIn, clearJustLoggedIn } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome overlay on first login — content renders behind it
  useEffect(() => {
    if (justLoggedIn) setShowWelcome(true);
  }, [justLoggedIn]);

  const dismissWelcome = () => {
    clearJustLoggedIn();
    setShowWelcome(false);
  };

  // Top 5 products
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_products")
        .select("id, title, price, image_url, shop_name, shop_logo_url, rating, review_count, units_sold_today, revenue_today, revenue_30d, trend_direction, growth_rate")
        .eq("is_blacklisted", false)
        .order("revenue_30d", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [
        { count: productsCount },
        { count: creativesCount },
        { count: videosCount },
        { count: creatorsCount },
      ] = await Promise.all([
        supabase.from("viral_products").select("*", { count: "exact", head: true }).eq("is_blacklisted", false),
        supabase.from("user_creatives").select("*", { count: "exact", head: true }),
        supabase.from("viral_videos").select("*", { count: "exact", head: true }).eq("region", "BR"),
        supabase.from("viral_creators").select("*", { count: "exact", head: true }),
      ]);
      return {
        products: productsCount || 0,
        videos: videosCount || 0,
        creatives: creativesCount || 0,
        creators: creatorsCount || 0,
      };
    },
  });

  // Revenue aggregates from products
  const { data: revenueStats } = useQuery({
    queryKey: ["dashboard-revenue-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_products")
        .select("revenue_today, revenue_30d, price, units_sold_today, shop_name")
        .eq("is_blacklisted", false);
      if (!data) return { totalRevenue30d: 0, totalRevenueToday: 0, avgPrice: 0, totalUnitsSoldToday: 0, shops: {} as Record<string, number> };
      
      const totalRevenue30d = data.reduce((s, p) => s + (p.revenue_30d || 0), 0);
      const totalRevenueToday = data.reduce((s, p) => s + (p.revenue_today || 0), 0);
      const totalUnitsSoldToday = data.reduce((s, p) => s + (p.units_sold_today || 0), 0);
      const prices = data.filter(p => p.price && p.price > 0).map(p => p.price!);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      
      const shops: Record<string, number> = {};
      data.forEach(p => {
        const shop = p.shop_name || "Sem loja";
        shops[shop] = (shops[shop] || 0) + (p.revenue_30d || 0);
      });
      
      return { totalRevenue30d, totalRevenueToday, avgPrice, totalUnitsSoldToday, shops };
    },
  });

  // Top creators
  const { data: topCreators } = useQuery({
    queryKey: ["dashboard-top-creators"],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_creators")
        .select("*")
        .order("projected_revenue", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Trending videos
  const { data: trendingVideos } = useQuery({
    queryKey: ["dashboard-trending-videos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_videos")
        .select("*")
        .eq("region", "BR")
        .order("views", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const firstName = profile?.name?.split(" ")[0] || "Minerador";
  const medalLabels = ["#1", "#2", "#3", "#4", "#5"];

  // Category chart data
  const shopChart = useMemo(() => 
    Object.entries(revenueStats?.shops || {})
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 6)
      .map(([name, revenue]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, revenue: Math.round(revenue as number) })),
    [revenueStats?.shops]
  );

  const kpis = useMemo(() => [
    { label: "Produtos Virais", subtitle: null, value: stats?.products ?? 0, icon: TrendingUp, color: "text-primary", bg: "bg-primary/8", tooltip: "Total de produtos virais sendo monitorados do TikTok Shop" },
    { label: "Vídeos Virais", subtitle: null, value: stats?.videos ?? 0, icon: Video, color: "text-secondary", bg: "bg-secondary/8", tooltip: "Total de vídeos virais sendo monitorados do TikTok Shop Brasil" },
    { label: "Criadores", subtitle: null, value: stats?.creators ?? 0, icon: Users, color: "text-warning", bg: "bg-warning/8", tooltip: "Total de criadores virais sendo monitorados" },
    { label: "Criativos Gerados", subtitle: null, value: stats?.creatives ?? 0, icon: Sparkles, color: "text-success", bg: "bg-success/8", tooltip: "Total de criativos que você gerou com a Influencer IA" },
  ], [stats]);

  const revenueKpis = useMemo(() => [
    { label: "Faturamento Hoje", value: fmtBRL(revenueStats?.totalRevenueToday), icon: DollarSign, color: "text-success", tooltip: "Soma do faturamento estimado de todos os produtos minerados hoje" },
    { label: "Faturamento 30d", value: fmtBRL(revenueStats?.totalRevenue30d), icon: BarChart3, color: "text-primary", tooltip: "Soma do faturamento estimado dos últimos 30 dias de todos os produtos" },
    { label: "Ticket Médio", value: fmtBRL(revenueStats?.avgPrice), icon: DollarSign, color: "text-secondary", tooltip: "Preço médio dos produtos ativos no banco de dados" },
    { label: "Vendas Hoje", value: fmt(revenueStats?.totalUnitsSoldToday), icon: Flame, color: "text-warning", tooltip: "Total de unidades vendidas hoje em todos os produtos minerados" },
  ], [revenueStats]);

  return (
    <>
      <AnimatePresence>
        {showWelcome && <WelcomeScreen onContinue={dismissWelcome} />}
      </AnimatePresence>
      <PageTransition className="space-y-5 relative" delay={0.1}>
          <DashboardParticles />
          {/* Header */}
          <PageSection>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-lg sm:text-xl font-display font-bold text-foreground tracking-tight">
                  Olá, <span className="text-primary">{firstName}</span> <Hand className="w-5 h-5 inline-block text-primary/70" />
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">Resumo da sua mineração</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 bg-muted/30 rounded-md px-2.5 py-1">
                <Clock className="w-3 h-3" />
                Atualizado agora
              </div>
            </div>
          </PageSection>

          {/* KPI Cards */}
          <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-3" stagger={0.08}>
              {kpis.map((kpi) => (
                <StaggerItem key={kpi.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="hover:border-primary/20 transition-all duration-300 group cursor-help">
                      <CardContent className="p-4">
                        <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform`}>
                          <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                        {loadingStats ? (
                          <Skeleton className="h-7 w-16 mb-1" />
                        ) : (
                          <AnimatedNumber value={kpi.value} className={`text-2xl font-display font-bold ${kpi.color} tabular-nums`} />
                        )}
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">{kpi.label}</p>
                          {kpi.subtitle && <span className="text-[9px] text-muted-foreground/50 mt-0.5">({kpi.subtitle})</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-center">
                    <p className="text-xs">{kpi.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
                </StaggerItem>
              ))}
          </StaggerGrid>

          {/* Revenue KPIs */}
          <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-3" stagger={0.08}>
              {revenueKpis.map((kpi) => (
                <StaggerItem key={kpi.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="hover:border-primary/20 transition-all duration-300 cursor-help">
                      <CardContent className="p-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{kpi.label}</p>
                        </div>
                        <p className={`text-lg font-bold ${kpi.color} tabular-nums`}>{kpi.value}</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="z-[60] max-w-[200px] text-center">
                    <p className="text-xs">{kpi.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
                </StaggerItem>
              ))}
          </StaggerGrid>

          {/* Quick Actions */}
          <PageSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-sm">
              <Link to="/app/influencer">
                <Button className="w-full gap-1.5" size="sm">
                  <Sparkles className="w-3.5 h-3.5" /> Criar Influencer IA
                </Button>
              </Link>
              <Link to="/app/criativos">
                <Button variant="outline" className="w-full gap-1.5 border-white/70 hover:border-white" size="sm">
                  <Sparkles className="w-3.5 h-3.5" /> Meus Criativos
                </Button>
              </Link>
            </div>
          </PageSection>

          {/* Main grid: Products + Category Chart */}
          <PageSection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Top 5 Produtos do Dia</h2>
                    <p className="text-[10px] text-muted-foreground">Maior faturamento 30d</p>
                  </div>
                </div>
                <Link to="/app/produtos">
                  <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground hover:text-primary gap-1 h-7">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {loadingProducts ? (
                <div className="space-y-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-7 h-7 rounded-full" />
                      <Skeleton className="w-11 h-11 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {products?.map((p: any, i: number) => (
                    <Link
                      key={p.id}
                      to={`/app/produtos/${p.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-all duration-150 group/item"
                    >
                      <div className="w-7 text-center shrink-0">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${i < 3 ? "bg-primary text-primary-foreground" : "text-muted-foreground/60"}`}>
                          {medalLabels[i]}
                        </span>
                      </div>
                      <div className="w-11 h-11 rounded-lg bg-muted/50 overflow-hidden shrink-0 ring-1 ring-border/20 group-hover/item:ring-primary/20 transition-all">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-[13px] font-medium text-foreground truncate group-hover/item:text-primary transition-colors">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground/80">{fmtBRL(p.price)}</span>
                          {p.shop_name && <span className="truncate max-w-[100px] opacity-60">{p.shop_name}</span>}
                          {(p.rating ?? 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-warning shrink-0">
                              <Star className="w-2.5 h-2.5 fill-warning" /> {p.rating?.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-foreground/80 tabular-nums">{fmt(p.units_sold_today)}</p>
                          <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">Vendas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-foreground/80 tabular-nums">{fmtBRL(p.revenue_today)}</p>
                          <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">Faturamento</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover/item:text-primary group-hover/item:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Revenue Chart */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-secondary/8 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Por Loja</h2>
                  <p className="text-[10px] text-muted-foreground">Faturamento 30d</p>
                </div>
              </div>
              {shopChart.length > 0 ? (
                <ChartContainer config={{ revenue: { label: "Receita", color: "hsl(var(--primary))" } }} className="h-[220px]">
                  <BarChart data={shopChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9 }} className="fill-muted-foreground" tickFormatter={(v) => fmt(v, "R$")} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Sem dados</div>
              )}
            </CardContent>
            </Card>
            </div>
          </PageSection>

          {/* Bottom grid: Top Creators + Trending Videos */}
          <PageSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Creators */}
            <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-warning/8 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-warning" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Top Criadores</h2>
                    <p className="text-[10px] text-muted-foreground">Maior receita projetada</p>
                  </div>
                </div>
                <Link to="/app/criadores">
                  <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground hover:text-primary gap-1 h-7">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-1">
                {topCreators?.map((c: any, i: number) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-all">
                    <span className={`text-xs font-bold w-5 text-center ${i < 3 ? "text-primary" : "text-muted-foreground/50"}`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-muted/50 overflow-hidden shrink-0 ring-1 ring-border/20">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.username} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {c.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">@{c.username}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{fmt(c.followers)} seg.</span>
                        <span className="text-primary">{c.engagement_rate?.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-semibold text-success tabular-nums">{fmtBRL(Number(c.projected_revenue))}</p>
                      <p className="text-[8px] text-muted-foreground/50 uppercase">projetado</p>
                    </div>
                  </div>
                ))}
                {(!topCreators || topCreators.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhum criador minerado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trending Videos */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-destructive/8 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Vídeos em Alta</h2>
                    <p className="text-[10px] text-muted-foreground">Mais visualizações</p>
                  </div>
                </div>
                <Link to="/app/videos">
                  <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground hover:text-primary gap-1 h-7">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-1">
                {trendingVideos?.map((v: any, i: number) => (
                  <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-all">
                    <div className="w-10 h-14 rounded-md bg-muted/50 overflow-hidden shrink-0 ring-1 ring-border/20 relative">
                      <VideoThumbnail
                        thumbnailUrl={v.thumbnail_url}
                        caption={v.caption}
                        creatorUsername={v.creator_username}
                        tiktokId={v.tiktok_id}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">
                        {v.product_title || v.caption?.slice(0, 50) || "Sem título"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {v.creator_username && <span>@{v.creator_username}</span>}
                        {v.duration && <span>{Math.round(v.duration)}s</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground/80">
                        <Eye className="w-3 h-3 text-muted-foreground/50" />
                        <span className="tabular-nums">{fmt(v.views)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Heart className="w-3 h-3 text-primary/60" />
                        <span>{fmt(v.likes)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!trendingVideos || trendingVideos.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhum vídeo minerado</p>
                )}
              </div>
            </CardContent>
          </Card>
            </div>
          </PageSection>
        </PageTransition>
    </>
  );
}
