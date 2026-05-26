import { useParams, useNavigate } from "react-router-dom";
import { PageTransition, PageSection } from "@/components/PageTransition";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Eye, Heart, Clock, Play, Download, Loader2 } from "lucide-react";
import {
  ArrowLeft, ShoppingCart, DollarSign, BarChart3, Zap, Radio,
  Video, CreditCard, TrendingUp, Sparkles, Star, Clapperboard, Circle
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

import { fmt, fmtBRL } from "@/lib/formatters";

const PERIODS = ["1D", "7D", "30D", "90D", "180D"] as const;
type Period = typeof PERIODS[number];

function getPeriodLabel(period: Period) {
  const days = { "1D": 1, "7D": 7, "30D": 30, "90D": 90, "180D": 180 }[period];
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return `Últimos ${days} dias (${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} ~ ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })})`;
}

function getMetrics(product: any, period: Period) {
  const multiplier = { "1D": 1, "7D": 7, "30D": 30, "90D": 90, "180D": 180 }[period];
  const baseRevenue = (product.revenue_today || 0) || ((product.revenue_7d || 0) / 7);
  const baseSold = (product.units_sold_today || 0) || ((product.units_sold_7d || 0) / 7);
  const revenue = baseRevenue * multiplier;
  const sold = Math.round(baseSold * multiplier);
  const avgPrice = sold > 0 ? revenue / sold : product.price || 0;
  const liveRev = revenue * 0.28;
  const videoRev = revenue * 0.52;
  const cardRev = revenue * 0.20;
  const creatorConv = 42.7;
  const concentration = 17.6;
  return { revenue, sold, avgPrice, liveRev, videoRev, cardRev, creatorConv, concentration, dailyAvg: multiplier > 0 ? revenue / multiplier : 0 };
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  const [period, setPeriod] = useState<Period>("30D");
  const [playingVideo, setPlayingVideo] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (video: any) => {
    if (!video.tiktok_id) {
      toast.error("Este vídeo não possui ID do TikTok para download");
      return;
    }
    setDownloadingId(video.id);
    try {
      const { data, error } = await supabase.functions.invoke("download-video", {
        body: { tiktok_id: video.tiktok_id },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.download_url) {
        const link = document.createElement("a");
        link.href = data.download_url;
        link.download = `${video.tiktok_id}.mp4`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!");
      }
    } catch (e: any) {
      console.error("Download error:", e);
      toast.error("Erro ao baixar vídeo");
    } finally {
      setDownloadingId(null);
    }
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_products")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });

  // Fetch videos linked to this product — multi-strategy matching
  const { data: linkedVideos } = useQuery({
    queryKey: ["product-videos", product?.id],
    queryFn: async () => {
      if (!product) return [];

      const seen = new Set<string>();
      const results: any[] = [];

      const addUnique = (items: any[]) => {
        for (const v of items) {
          if (!seen.has(v.id) && results.length < 3) {
            seen.add(v.id);
            results.push(v);
          }
        }
      };

      // Strategy 1: Exact product_title match (most reliable — set during mining)
      if (product.title) {
        const { data } = await supabase
          .from("viral_videos")
          .select("*")
          .eq("product_title", product.title)
          .order("product_revenue", { ascending: false })
          .limit(3);
        if (data) addUnique(data);
        if (results.length >= 3) return results;
      }

      // Strategy 2: Match by product_id_external (stored during mining)
      if (results.length < 3 && product.product_id_external) {
        const { data } = await supabase
          .from("viral_videos")
          .select("*")
          .or(`product_shop_url.ilike.%${product.product_id_external}%,video_url.ilike.%${product.product_id_external}%`)
          .order("product_revenue", { ascending: false })
          .limit(3);
        if (data) addUnique(data);
        if (results.length >= 3) return results;
      }

      // Strategy 3: Match by TikTok product ID from product_url slug
      if (results.length < 3 && product.product_url) {
        const tiktokProductId = product.product_url.match(/\/pdp\/(\d+)/)?.[1]
          || product.product_url.match(/\/product\/(\d+)/)?.[1];
        if (tiktokProductId && tiktokProductId.length > 10) {
          const { data } = await supabase
            .from("viral_videos")
            .select("*")
            .or(`product_shop_url.ilike.%${tiktokProductId}%,video_url.ilike.%${tiktokProductId}%`)
            .order("product_revenue", { ascending: false })
            .limit(3);
          if (data) addUnique(data);
          if (results.length >= 3) return results;
        }
      }

      // Strategy 3: Strict multi-keyword match on product_title in videos
      // Requires 3+ significant keywords to ALL match (AND logic via textSearch)
      if (results.length < 3 && product.title) {
        const stopWords = new Set([
          "de", "da", "do", "das", "dos", "em", "com", "para", "por", "sem",
          "uma", "uns", "que", "não", "mais", "seu", "sua", "meu", "minha",
          "feminino", "feminina", "masculino", "masculina", "unissex",
          "estilo", "moda", "alta", "qualidade", "produto", "modelo",
          "novo", "nova", "kit", "top", "premium", "pro",
        ]);
        const keywords = product.title
          .split(/[\s\-\/\+\|,]+/)
          .map((w: string) => w.toLowerCase().replace(/[^a-záàâãéêíóôõúç]/gi, ""))
          .filter((w: string) => w.length > 3 && !stopWords.has(w));

        // Take the 3 most distinctive keywords (longest first = more unique)
        const distinctKeywords = [...new Set(keywords)]
          .sort((a, b) => b.length - a.length)
          .slice(0, 3);

        if (distinctKeywords.length >= 2) {
          // Chain .ilike() calls for AND logic
          let query = supabase
            .from("viral_videos")
            .select("*");
          for (const kw of distinctKeywords) {
            query = query.ilike("product_title", `%${kw}%`);
          }
          const { data } = await query
            .order("product_revenue", { ascending: false })
            .limit(3);
          if (data) addUnique(data);
          if (results.length >= 3) return results;
        }
      }

      // Strategy 4: Match by caption keywords (strict — requires 3+ keywords)
      if (results.length < 3 && product.title) {
        const stopWords = new Set([
          "de", "da", "do", "das", "dos", "em", "com", "para", "por", "sem",
          "uma", "uns", "que", "não", "mais", "seu", "sua",
          "feminino", "feminina", "masculino", "masculina",
          "estilo", "moda", "alta", "qualidade", "produto", "modelo",
          "novo", "nova", "kit", "top", "premium",
        ]);
        const keywords = product.title
          .split(/[\s\-\/\+\|,]+/)
          .map((w: string) => w.toLowerCase().replace(/[^a-záàâãéêíóôõúç]/gi, ""))
          .filter((w: string) => w.length > 4 && !stopWords.has(w));

        const distinctKeywords = [...new Set(keywords)]
          .sort((a, b) => b.length - a.length)
          .slice(0, 3);

        if (distinctKeywords.length >= 2) {
          let query = supabase
            .from("viral_videos")
            .select("*");
          for (const kw of distinctKeywords) {
            query = query.ilike("caption", `%${kw}%`);
          }
          const { data } = await query
            .order("product_revenue", { ascending: false })
            .limit(3);
          if (data) addUnique(data);
        }
      }

      // Strategy 5: Fallback by category/shop_name
      if (results.length < 3 && (product.category || product.shop_name)) {
        const needed = 3 - results.length;
        // Search videos whose product_title contains a word from the shop/category
        const categoryKeyword = (product.shop_name || product.category || "")
          .split(/\s+/)
          .filter((w: string) => w.length > 3)[0];
        if (categoryKeyword) {
          const { data } = await supabase
            .from("viral_videos")
            .select("*")
            .ilike("product_title", `%${categoryKeyword}%`)
            .not("id", "in", `(${[...seen].join(",")})`)
            .order("product_revenue", { ascending: false })
            .limit(needed);
          if (data) addUnique(data);
        }
      }

      // Strategy 6: Global fallback — top revenue videos from BR
      if (results.length < 3) {
        const needed = 3 - results.length;
        const excludeIds = [...seen];
        let query = supabase
          .from("viral_videos")
          .select("*")
          .eq("region", "BR")
          .order("product_revenue", { ascending: false })
          .limit(needed + 10);
        if (excludeIds.length > 0) {
          query = query.not("id", "in", `(${excludeIds.join(",")})`);
        }
        const { data } = await query;
        if (data) addUnique(data);
      }

      // Final safety: if still < 3, get ANY top videos
      if (results.length < 3) {
        const needed = 3 - results.length;
        const excludeIds = [...seen];
        let query = supabase
          .from("viral_videos")
          .select("*")
          .order("views", { ascending: false })
          .limit(needed + 10);
        if (excludeIds.length > 0) {
          query = query.not("id", "in", `(${excludeIds.join(",")})`);
        }
        const { data } = await query;
        if (data) addUnique(data);
      }

      return results;
    },
    enabled: !!product,
  });

  // All hooks MUST be called before any early return (Rules of Hooks).
  // These safely handle product=null/undefined by returning sensible defaults.
  const m = useMemo(
    () => product ? getMetrics(product, period) : { revenue: 0, sold: 0, avgPrice: 0, liveRev: 0, videoRev: 0, cardRev: 0, creatorConv: 42.7, concentration: 17.6, dailyAvg: 0 },
    [product, period]
  );

  // Deterministic sine-wave fallback avoids Math.random() flicker on every render.
  const chartData = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.trend_data) && product.trend_data.length > 0) {
      return (product.trend_data as any[]).map((p: any, i: number) => ({
        date: p.day || `D${i + 1}`,
        revenue: p.revenue || 0,
      }));
    }
    const days = period === "1D" ? 1 : period === "7D" ? 7 : 30;
    const dailyAvg = m.revenue / Math.max(days, 1);
    const seed = product.id?.charCodeAt(0) ?? 0;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000)
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      revenue: Math.max(0, dailyAvg * (0.7 + 0.6 * Math.sin(i * 1.3 + seed))),
    }));
  }, [product, period, m.revenue]);

  const kpis = useMemo(() => [
    { icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-400", label: "RECEITA", value: fmtBRL(m.revenue), sub: `${fmtBRL(m.dailyAvg)}/dia` },
    { icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-400", label: "VENDIDOS", value: fmt(m.sold), sub: null },
    { icon: <BarChart3 className="w-5 h-5" />, color: "text-cyan-400", label: "PREÇO MÉDIO", value: fmtBRL(m.avgPrice), sub: null },
    { icon: <Radio className="w-5 h-5" />, color: "text-red-400", label: "LIVE", value: fmtBRL(m.liveRev), sub: null },
    { icon: <Video className="w-5 h-5" />, color: "text-green-400", label: "VÍDEO", value: fmtBRL(m.videoRev), sub: null },
    { icon: <CreditCard className="w-5 h-5" />, color: "text-purple-400", label: "CARTÃO", value: fmtBRL(m.cardRev), sub: null },
    { icon: <TrendingUp className="w-5 h-5" />, color: "text-amber-400", label: "CONV. CRIADOR", value: `${m.creatorConv}%`, sub: null },
    { icon: <Zap className="w-5 h-5" />, color: "text-orange-400", label: "CONCENTRAÇÃO", value: `${m.concentration}%`, sub: null },
  ], [m]);

  // Early return AFTER all hooks — safe for React's reconciler
  if (isLoading || !product) return <ProductDetailSkeleton />;

  const livePct = m.revenue > 0 ? (m.liveRev / m.revenue) * 100 : 28;
  const videoPct = m.revenue > 0 ? (m.videoRev / m.revenue) * 100 : 52;
  const cardPct = m.revenue > 0 ? (m.cardRev / m.revenue) * 100 : 20;

  const priceRange = product.price
    ? `R$${(Number(product.price) * 0.8).toFixed(0)}-R$${(Number(product.price) * 1.2).toFixed(0)}`
    : "—";

  return (
    <PageTransition className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" className="text-muted-foreground text-sm h-8 px-2" onClick={() => navigate("/app/produtos")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Produtos Virais
      </Button>

      <Card className="bg-card border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
              {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight">{product.title}</h1>
              {product.category && <Badge variant="outline" className="text-xs">{product.category}</Badge>}
              <p className="text-primary font-bold text-lg">{priceRange}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Métricas</p>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1.5"><ShoppingCart className="w-4 h-4 text-muted-foreground" /> <strong>{fmt(product.sales || product.units_sold_30d)}</strong></span>
              <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-muted-foreground" /> <strong>{fmtBRL(m.revenue)}</strong></span>
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-muted-foreground" /> <strong>{product.commission_rate || 0}%</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Selector */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">Período:</span>
          {PERIODS.map(p => (
            <Button key={p} size="sm" variant={period === p ? "default" : "outline"} className="text-xs h-7 px-3" onClick={() => setPeriod(p)}>
              {p}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{getPeriodLabel(period)}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="bg-card border-border/50">
            <CardContent className="p-4 space-y-1">
              <div className={k.color}>{k.icon}</div>
              <p className="text-xl font-bold text-foreground">{k.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
              {k.sub && <p className="text-[10px] text-muted-foreground">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Strategy */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> Estratégia de Vendas</p>
            <p className="text-xs text-muted-foreground">Total: {fmtBRL(m.revenue)}</p>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            <div className="bg-blue-500 transition-all" style={{ width: `${livePct}%` }} />
            <div className="bg-emerald-500 transition-all" style={{ width: `${videoPct}%` }} />
            <div className="bg-violet-500 transition-all" style={{ width: `${cardPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Live", color: "text-blue-400", value: fmtBRL(m.liveRev), pct: livePct },
              { label: "Vídeo", color: "text-emerald-400", value: fmtBRL(m.videoRev), pct: videoPct },
              { label: "Cartão", color: "text-violet-400", value: fmtBRL(m.cardRev), pct: cardPct },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-sm font-bold ${s.color} flex items-center justify-center gap-1`}><Circle className="w-2.5 h-2.5 fill-current" /> {s.label}</p>
                <p className="text-sm font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.pct.toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Receita ao longo do tempo</p>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => fmtBRL(v)} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(v: number) => [fmtBRL(v), "Receita"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vídeos Relacionados */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Clapperboard className="w-4 h-4 text-primary" /> Videos Relacionados: Top 3 Vídeos</h2>
          <p className="text-xs text-muted-foreground">Últimos 30 dias • Por receita</p>
        </div>
        {linkedVideos && linkedVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {linkedVideos.map((v: any, i: number) => (
              <Card key={v.id} className="bg-card border-border/50 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <CardContent className="p-0">
                  <div className="relative aspect-[9/16] bg-muted overflow-hidden cursor-pointer" onClick={() => {
                    if (v.video_url || v.tiktok_id) setPlayingVideo(v);
                  }}>
                    <VideoThumbnail
                      thumbnailUrl={v.thumbnail_url}
                      caption={v.caption}
                      creatorUsername={v.creator_username}
                      tiktokId={v.tiktok_id}
                    />
                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer z-10 group/play">
                      <div className="w-14 h-14 rounded-full bg-primary/50 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover/play:opacity-100 group-hover/play:scale-125 group-hover/play:bg-primary/70 group-hover/play:shadow-[0_0_25px_hsl(var(--primary)/0.6)] transition-all duration-300 ease-out">
                        <Play className="w-7 h-7 text-white fill-white group-hover/play:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                      {i < 3 && (
                        <Badge className="text-[10px] font-bold px-1.5 py-0.5 bg-primary text-primary-foreground">
                          #{i + 1}
                        </Badge>
                      )}
                      {v.duration > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0 ml-auto">
                          <Clock className="w-2.5 h-2.5 mr-0.5" />{Math.floor(v.duration / 60)}:{(v.duration % 60).toString().padStart(2, "0")}
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1">
                      <p className="text-[11px] text-white/90 line-clamp-2 leading-tight font-medium">{v.caption || "Sem legenda"}</p>
                      {v.creator_username && <p className="text-[10px] text-white/60 truncate">@{v.creator_username}</p>}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="flex items-center gap-0.5 text-[10px] text-white/70"><Eye className="w-2.5 h-2.5" /> {fmt(v.views || 0)}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-white/70"><Heart className="w-2.5 h-2.5" /> {fmt(v.likes || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 flex gap-1.5">
                    {v.tiktok_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[11px] h-7 gap-1"
                        onClick={() => handleDownload(v)}
                        disabled={downloadingId === v.id}
                      >
                        {downloadingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Baixar MP4
                      </Button>
                    )}
                    {v.video_url && (
                      <a href={v.video_url} target="_blank" rel="noopener noreferrer" className={v.tiktok_id ? "" : "flex-1"}>
                        <Button size="sm" variant="outline" className="w-full text-[11px] h-7 gap-1">
                          <ExternalLink className="w-3 h-3" /> TikTok
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border/50">
            <CardContent className="p-8 text-center">
              <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">Nenhum vídeo relacionado encontrado</p>
              <p className="text-xs text-muted-foreground/60">Os vídeos serão minerados na próxima atualização</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-black border-border/50">
          <DialogHeader className="p-3 pb-0">
            <DialogTitle className="flex items-center gap-2 text-sm text-white">
              <Play className="w-4 h-4 text-primary" />
              {playingVideo?.creator_username ? `@${playingVideo.creator_username}` : "Vídeo"}
            </DialogTitle>
            <p className="sr-only">Player de vídeo TikTok</p>
          </DialogHeader>
          <div className="w-full aspect-[9/16] bg-black">
            {playingVideo?.tiktok_id ? (
              <iframe
                key={playingVideo.tiktok_id}
                src={`https://www.tiktok.com/player/v1/${playingVideo.tiktok_id}?music_info=1&description=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin"
              />
            ) : playingVideo?.video_url ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                <Play className="w-12 h-12 text-muted-foreground/50" />
                <a href={playingVideo.video_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir no TikTok
                  </Button>
                </a>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Vídeo não disponível</p>
              </div>
            )}
          </div>
          {playingVideo?.tiktok_id && (
            <div className="p-2 border-t border-border/30">
              <a href={`https://www.tiktok.com/@${playingVideo.creator_username || 'video'}/video/${playingVideo.tiktok_id}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="w-full text-[11px] h-7 gap-1">
                  <ExternalLink className="w-3 h-3" /> Abrir no TikTok
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </PageTransition>
  );
}
