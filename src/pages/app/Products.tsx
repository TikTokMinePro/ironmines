import React from "react";
import { PageTransition, PageSection, StaggerGrid, StaggerItem } from "@/components/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductsSkeleton } from "@/components/LoadingSkeletons";
import { Tooltip as ShadTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TrendingUp, TrendingDown, Minus, ArrowRight,
  Palette, ExternalLink, Users, Video, Eye,
  Star, Store, Sparkles, ArrowUpRight,
  ShoppingCart, DollarSign, BarChart3, Package
} from "lucide-react";
import { MiningStatusBar } from "@/components/MiningStatusBar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Product = {
  id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  category: string | null;
  subcategory: string | null;
  shop_name: string | null;
  shop_logo_url: string | null;
  commission_rate: number | null;
  units_sold_today: number | null;
  units_sold_7d: number | null;
  units_sold_30d: number | null;
  revenue_today: number | null;
  revenue_7d: number | null;
  revenue_30d: number | null;
  growth_rate: number | null;
  rank_position: number | null;
  
  product_url: string | null;
  affiliate_url: string | null;
  rating: number | null;
  review_count: number | null;
  video_count: number | null;
  creator_count: number | null;
  
  trend_direction: string | null;
  trend_data: any;
  tags: string[] | null;
  views: number | null;
  sales: number | null;
  engagement_rate: number | null;
  scraped_at: string | null;
  source_url: string | null;
  is_blacklisted: boolean | null;
  country: string | null;
};

import { fmt, fmtBRL, fmtPrice } from "@/lib/formatters";


function TrendBadge({ direction, rate }: { direction: string | null; rate: number | null }) {
  if (!direction && !rate) return null;
  const isUp = direction === "up" || (rate ?? 0) > 0;
  const isDown = direction === "down" || (rate ?? 0) < 0;
  return (
    <ShadTooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold cursor-help ${isUp ? "text-success" : isDown ? "text-destructive" : "text-muted-foreground"}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {rate != null ? `${Math.abs(rate).toFixed(0)}%` : direction}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        <p className="font-semibold">Taxa de Crescimento</p>
        <p className="text-muted-foreground">Variação percentual de vendas em relação ao período anterior.</p>
      </TooltipContent>
    </ShadTooltip>
  );
}

const MiniSparkline = React.memo(function MiniSparkline({ data }: { data: any }) {
  const chartData = React.useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data;
    return Array.from({ length: 7 }, (_, i) => ({ day: i, revenue: 50 + i * 10 }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// ─── Product Card (Large Image Style) ───
function ProductCard({ product, index, isTop3, onClick }: { product: Product; index: number; isTop3: boolean; onClick: () => void }) {
  const navigate = useNavigate();


  const top3Colors = [
    "ring-2 ring-primary shadow-[0_0_20px_-4px_hsl(120,100%,44%,0.4)]",
    "ring-2 ring-primary/70 shadow-[0_0_20px_-4px_hsl(120,100%,44%,0.3)]",
    "ring-2 ring-primary/50 shadow-[0_0_20px_-4px_hsl(120,100%,44%,0.2)]",
  ];
  const top3Labels = ["#1 TOP", "#2 TOP", "#3 TOP"];

  return (
    <Card
      className={`bg-card border-border/40 hover:border-primary/50 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.25),0_0_60px_-15px_hsl(var(--primary)/0.15)] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group overflow-hidden ${isTop3 ? top3Colors[index] || "" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Large Image */}
        <div
          className="relative aspect-[3/2] bg-muted overflow-hidden"
          onClick={(e) => { e.stopPropagation(); navigate(`/app/produtos/${product.id}`); }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Position badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <Badge className={`border-0 text-xs px-2.5 py-1 shadow-lg font-bold ${isTop3 ? "bg-primary text-primary-foreground" : "bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-[0_0_10px_-2px_hsl(var(--primary)/0.5)]"}`}>
              #{index + 1}{isTop3 ? " TOP" : ""}
            </Badge>
          </div>

          {/* Hover CTA */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <Button size="sm" className="bg-white/90 text-black hover:bg-white text-xs h-8 shadow-lg backdrop-blur-sm">
              Ver detalhes <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
          {/* Title + Price */}
          <div className="space-y-1 sm:space-y-1.5">
            <h3 className="font-semibold text-foreground text-[11px] sm:text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-lg font-bold text-foreground">{fmtPrice(product.price)}</span>
              <TrendBadge direction={product.trend_direction} rate={product.growth_rate} />
            </div>
          </div>

          {/* Shop + Rating */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              {product.shop_logo_url ? (
                <img src={product.shop_logo_url} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full" alt="" />
              ) : (
                <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              )}
              <span className="truncate">{product.shop_name || "Loja"}</span>
            </div>
            {(product.rating ?? 0) > 0 && (
              <span className="hidden sm:flex items-center gap-0.5 text-warning shrink-0">
                <Star className="w-3 h-3 fill-warning" /> {product.rating?.toFixed(1)}
                <span className="text-muted-foreground ml-0.5">({fmt(product.review_count)})</span>
              </span>
            )}
          </div>

          {/* Commission - hidden on mobile */}
          {(product.commission_rate ?? 0) > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <DollarSign className="w-3 h-3 text-success" />
              <span className="text-success font-medium">Comissão {product.commission_rate}%</span>
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            <div className="bg-muted/50 rounded-md sm:rounded-lg p-1.5 sm:p-2 text-center">
              <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">Vendas/dia</p>
              <p className="text-[10px] sm:text-sm font-bold text-foreground">{fmt(product.units_sold_today)}</p>
            </div>
            <div className="bg-muted/50 rounded-md sm:rounded-lg p-1.5 sm:p-2 text-center">
              <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">Vendas 7d</p>
              <p className="text-[10px] sm:text-sm font-bold text-foreground">{fmt(product.units_sold_7d)}</p>
            </div>
            <div className="bg-muted/50 rounded-md sm:rounded-lg p-1.5 sm:p-2 text-center">
              <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">Receita 30d</p>
              <p className="text-[10px] sm:text-sm font-bold text-foreground">{fmtBRL(product.revenue_30d)}</p>
            </div>
          </div>

          {/* Sparkline */}
          <MiniSparkline data={product.trend_data} />

          {/* Stats row - hidden on mobile */}
          <div className="hidden sm:flex items-center justify-between text-[11px] text-muted-foreground">
            <ShadTooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help"><Users className="w-3 h-3" /> {fmt(product.creator_count)}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[180px]">
                <p className="font-semibold">Criadores</p>
                <p className="text-muted-foreground">Quantidade de influenciadores que promoveram este produto.</p>
              </TooltipContent>
            </ShadTooltip>
            <ShadTooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help"><Video className="w-3 h-3" /> {fmt(product.video_count)}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[180px]">
                <p className="font-semibold">Vídeos</p>
                <p className="text-muted-foreground">Quantidade de vídeos feitos sobre este produto.</p>
              </TooltipContent>
            </ShadTooltip>
            <ShadTooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help"><Eye className="w-3 h-3" /> {fmt(product.views)}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[180px]">
                <p className="font-semibold">Visualizações</p>
                <p className="text-muted-foreground">Total de visualizações que o produto acumulou.</p>
              </TooltipContent>
            </ShadTooltip>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
            <Link to="/app/influencer" state={{ product }} className="flex-1" onClick={e => e.stopPropagation()}>
              <div className="btn-animated-border w-full">
                <Button size="sm" className="w-full bg-primary text-primary-foreground text-[10px] sm:text-xs h-7 sm:h-8 border-0 hover:bg-primary/90 px-1.5 sm:px-3">
                  <Palette className="w-3 h-3 mr-0.5 sm:mr-1 shrink-0" /> <span className="truncate">Criar Influencer IA</span>
                </Button>
              </div>
            </Link>
            {product.product_url && (
              <a href={product.product_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="text-xs h-7 sm:h-8 w-7 sm:w-auto px-1.5 sm:px-3">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Detail Modal ───
function ProductDetailModal({ product, open, onClose }: { product: Product | null; open: boolean; onClose: () => void }) {
  const [chartTab, setChartTab] = useState<"vendas" | "receita">("vendas");
  if (!product) return null;

  const chartData = Array.isArray(product.trend_data) && product.trend_data.length > 0
    ? product.trend_data
    : Array.from({ length: 7 }, (_, i) => ({
        day: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i],
        units: Math.floor(Math.random() * 500 + 100),
        revenue: Math.floor(Math.random() * 50000 + 5000),
      }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-sm leading-tight">{product.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
              {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="space-y-1 flex-1">
              {product.shop_name && <p className="text-sm text-muted-foreground flex items-center gap-1"><Store className="w-3 h-3" /> {product.shop_name}</p>}
              {(product.rating ?? 0) > 0 && (
                <p className="text-sm flex items-center gap-1 text-warning">
                  <Star className="w-3 h-3 fill-warning" /> {product.rating?.toFixed(1)} ({fmt(product.review_count)} avaliações)
                </p>
              )}
              {product.category && <p className="text-xs text-muted-foreground">📂 {product.category}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">{fmtPrice(product.price)}</span>
                  {(product.commission_rate ?? 0) > 0 && <span className="text-xs text-success">Comissão: {product.commission_rate}%</span>}
                </div>
                {product.product_url && (
                  <a href={product.product_url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="text-xs h-7"><ExternalLink className="w-3 h-3 mr-1" /> TikTok Shop</Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "Vendas Hoje", v: fmt(product.units_sold_today) },
              { l: "Receita Hoje", v: fmtBRL(product.revenue_today) },
              { l: "Vendas 7d", v: fmt(product.units_sold_7d) },
              { l: "Receita 7d", v: fmtBRL(product.revenue_7d) },
              { l: "Vendas 30d", v: fmt(product.units_sold_30d) },
              { l: "Receita 30d", v: fmtBRL(product.revenue_30d) },
            ].map(m => (
              <div key={m.l} className="bg-muted/50 rounded-lg p-2">
                <p className="text-[9px] text-muted-foreground uppercase">{m.l}</p>
                <p className="font-bold text-sm text-foreground">{m.v}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button size="sm" variant={chartTab === "vendas" ? "default" : "outline"} className="text-xs h-6" onClick={() => setChartTab("vendas")}>Vendas</Button>
              <Button size="sm" variant={chartTab === "receita" ? "default" : "outline"} className="text-xs h-6" onClick={() => setChartTab("receita")}>Receita</Button>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey={chartTab === "vendas" ? "units" : "revenue"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-2">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {fmt(product.creator_count)}</span>
            <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {fmt(product.video_count)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {fmt(product.views)}</span>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───
export default function ProductsPage() {
  const [selected, setSelected] = useState<Product | null>(null);

  const { data: products, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["viral-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_products")
        .select("id, title, price, image_url, category, subcategory, shop_name, shop_logo_url, commission_rate, units_sold_today, units_sold_7d, units_sold_30d, revenue_today, revenue_7d, revenue_30d, growth_rate, rank_position, product_url, affiliate_url, rating, review_count, video_count, creator_count, trend_direction, trend_data, tags, views, sales, engagement_rate, scraped_at, source_url, is_blacklisted, country")
        .eq("is_blacklisted", false)
        .order("viral_score", { ascending: false })
        .limit(20);
      return (data || []) as Product[];
    },
    staleTime: 30 * 60 * 1000,
  });


  // Mining cycle info now handled by MiningStatusBar component

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <PageSection>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 flex items-center justify-center border border-primary/20 shadow-[0_2px_12px_rgba(0,224,0,0.2),0_0_20px_rgba(0,224,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
               <TrendingUp className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(0,224,0,0.5)]" />
             </div>
            Produtos <span className="text-primary">Virais</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-[46px]">Os mais vendidos do TikTok Shop</p>
        </div>
      </PageSection>

      {/* Status Card */}
      <MiningStatusBar
        countLabel={`${products?.length ?? 0} produtos em destaque`}
      />

      {/* Content */}
      {isLoading ? (
        <ProductsSkeleton />
      ) : (
        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5" stagger={0.08}>
          {products?.map((p, i) => (
            <StaggerItem key={p.id}>
              <ProductCard product={p} index={i} isTop3={i < 3} onClick={() => setSelected(p)} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}

      <ProductDetailModal product={selected} open={!!selected} onClose={() => setSelected(null)} />
    </PageTransition>
  );
}
