import { useState } from "react";
import { PageTransition, PageSection, StaggerGrid, StaggerItem } from "@/components/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Eye, Heart, Play, Video, FileText, User,
  Star, DollarSign, ShoppingCart, ChevronDown, Sparkles, Loader2,
  Target, AlertCircle, Lightbulb, Megaphone, Flame, MessageCircle, Share2,
  Download
} from "lucide-react";
import { MiningStatusBar } from "@/components/MiningStatusBar";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { VideosSkeleton } from "@/components/LoadingSkeletons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { formatNumber, fmtBRL } from "@/lib/formatters";

type SortOption = "views" | "revenue" | "sales" | "likes";

const SORT_LABELS: Record<SortOption, string> = {
  views: "Mais Vistos",
  revenue: "Faturamento",
  sales: "Vendas",
  likes: "Mais Curtidos",
};

// Map UI sort option → DB column (static, defined once at module scope)
const SORT_COLUMN: Record<SortOption, string> = {
  views: "views",
  revenue: "product_revenue",
  sales: "product_sales",
  likes: "likes",
};

export default function VideosPage() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [dialogType, setDialogType] = useState<"transcription" | "insight" | "player" | null>(null);
  const [insightData, setInsightData] = useState<any>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("views");
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

  const { data: filteredVideos, isLoading } = useQuery({
    queryKey: ["viral-videos", sortBy],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_videos")
        .select("id, tiktok_id, video_url, thumbnail_url, caption, views, likes, comments, shares, duration, region, creator_username, product_title, product_sales, product_revenue, viral_score")
        .eq("region", "BR")
        .order(SORT_COLUMN[sortBy], { ascending: false })
        .limit(40);
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });

  const openDialog = (video: any, type: "transcription" | "insight") => {
    setSelectedVideo(video);
    setDialogType(type);
    if (type === "insight") fetchInsight(video);
  };

  const closeDialog = () => {
    setSelectedVideo(null);
    setDialogType(null);
    setInsightData(null);
  };

  const fetchInsight = async (video: any) => {
    setInsightLoading(true);
    setInsightData(null);
    try {
      const { data, error } = await supabase.functions.invoke("video-insight", {
        body: { caption: video.caption || "", productTitle: video.product_title || "" },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setInsightData(data.insight);
    } catch (e: any) {
      console.error("Insight error:", e);
      toast.error("Erro ao gerar insight IA");
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-5">
      {/* Premium Hero Header */}
      <PageSection>
        <div className="page-hero">
          <div className="relative z-10 flex items-center gap-3">
            <div className="section-icon-box w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 flex items-center justify-center border border-primary/25 shadow-[0_2px_12px_rgba(0,224,0,0.25),0_0_22px_rgba(0,224,0,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
              <Video className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(0,224,0,0.6)] relative z-10" />
            </div>
            <div>
              <span className="chip-premium mb-1.5 inline-flex">Top BR · 14 dias</span>
              <h1 className="type-hero">
                <span className="text-foreground/90">Vídeos </span>
                <span className="page-title-gradient">Virais</span>
              </h1>
              <p className="type-caption text-muted-foreground/80 mt-1.5">
                Top 40 vídeos mais virais do TikTok Shop Brasil
              </p>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Status Bar */}
      <MiningStatusBar
        countLabel={`${filteredVideos?.length ?? 0} vídeos minerados`}
      />

      {/* Sort */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
              <Star className="w-3 h-3" />
              {SORT_LABELS[sortBy]}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {Object.entries(SORT_LABELS).map(([k, label]) => (
              <DropdownMenuItem key={k} onClick={() => setSortBy(k as SortOption)}>
                {sortBy === k && "✓ "}{label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <VideosSkeleton />
      ) : (filteredVideos?.length ?? 0) === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-12 text-center">
            <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum vídeo viral encontrado.</p>
            <p className="text-xs text-muted-foreground mt-1">Os dados serão minerados automaticamente à meia-noite.</p>
          </CardContent>
        </Card>
      ) : (
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" stagger={0.08}>
          {filteredVideos.map((v: any, index: number) => (
            <StaggerItem key={v.id}>
            <Card className="relative bg-card border-border/50 group hover:scale-[1.03] hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.25),0_0_60px_-15px_hsl(var(--primary)/0.15)] transition-all duration-300 ease-out overflow-hidden">
              <span className="pointer-events-none absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_12px_hsl(var(--primary)/0.6),0_0_24px_hsl(var(--primary)/0.3)]" />
              <CardContent className="p-0">
                {/* Thumbnail */}
               <div className="relative aspect-square bg-muted overflow-hidden">
                  <VideoThumbnail
                    thumbnailUrl={v.thumbnail_url}
                    caption={v.caption}
                    creatorUsername={v.creator_username}
                    tiktokId={v.tiktok_id}
                  />

                  {/* Play overlay - clickable */}
                  <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group/play"
                    onClick={() => {
                      if (v.video_url || v.tiktok_id) {
                        setSelectedVideo(v);
                        setDialogType("player");
                      }
                    }}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/40 backdrop-blur-sm flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover/play:scale-110 group-hover/play:bg-primary/70 group-hover/play:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300 ease-out">
                      <Play className="w-7 h-7 text-white fill-white group-hover/play:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Ranking badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <Badge className={`text-xs font-bold px-2 py-1 ${
                      index < 3 ? "bg-primary text-primary-foreground" :
                      "bg-muted/80 text-foreground backdrop-blur-sm"
                    }`}>
                      #{index + 1} {index < 3 && <Flame className="w-3 h-3 inline fill-current" />}
                    </Badge>
                  </div>

                  {/* Views badge top-right */}
                  <div className="absolute top-2.5 right-2.5">
                    <Badge className="bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm">
                      <Eye className="w-3 h-3 mr-1" /> {formatNumber(v.views || 0)}
                    </Badge>
                  </div>

                  {/* Creator username bottom */}
                  {v.creator_username && (
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <span className="text-xs text-white/90 font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                        @{v.creator_username}
                      </span>
                    </div>
                  )}
                </div>

                {/* Projected Sales & Revenue */}
                <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <div className="bg-muted/50 rounded-lg p-1.5 sm:p-2 text-center">
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">Projeção Vendas</p>
                      <p className="text-[11px] sm:text-sm font-bold text-foreground flex items-center justify-center gap-0.5 sm:gap-1">
                        <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success" />
                        {formatNumber(v.product_sales || 0)}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-1.5 sm:p-2 text-center">
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">Faturamento</p>
                      <p className="text-[11px] sm:text-sm font-bold text-primary flex items-center justify-center gap-0.5 sm:gap-1">
                        <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {fmtBRL(v.product_revenue || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Engagement metrics - hidden on very small, compact on mobile */}
                  <div className="hidden sm:flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-destructive fill-current" /> {formatNumber(v.likes || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {formatNumber(v.comments || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3" /> {formatNumber(v.shares || 0)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - 2x2 grid on mobile, 4 cols on desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 border-t border-border/30">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none text-[10px] sm:text-[11px] h-8 sm:h-9 gap-0.5 sm:gap-1 text-muted-foreground hover:text-foreground min-h-0 min-w-0 px-1"
                    onClick={() => openDialog(v, "transcription")}
                  >
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Legenda
                  </Button>
                  {v.video_url ? (
                    <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="contents">
                      <Button size="sm" variant="ghost" className="rounded-none text-[10px] sm:text-[11px] h-8 sm:h-9 gap-0.5 sm:gap-1 text-muted-foreground hover:text-foreground min-h-0 min-w-0 px-1">
                        <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> TikTok
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" variant="ghost" className="rounded-none text-[10px] sm:text-[11px] h-8 sm:h-9 gap-0.5 sm:gap-1 text-muted-foreground min-h-0 min-w-0 px-1" disabled>
                      <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> TikTok
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none text-[10px] sm:text-[11px] h-8 sm:h-9 gap-0.5 sm:gap-1 text-muted-foreground hover:text-primary min-h-0 min-w-0 px-1"
                    onClick={() => handleDownload(v)}
                    disabled={downloadingId === v.id || !v.tiktok_id}
                  >
                    {downloadingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} Baixar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none text-[10px] sm:text-[11px] h-8 sm:h-9 gap-0.5 sm:gap-1 text-muted-foreground hover:text-primary min-h-0 min-w-0 px-1"
                    onClick={() => openDialog(v, "insight")}
                  >
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Insight
                  </Button>
                </div>

              </CardContent>
            </Card>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}

      {/* Legenda Dialog */}
      <Dialog open={dialogType === "transcription"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Legenda do Vídeo
            </DialogTitle>
            <DialogDescription>Texto da legenda original do vídeo no TikTok</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/50 p-4 min-h-[80px]">
            {selectedVideo?.caption ? (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selectedVideo.caption}</p>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-6">
                <FileText className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Este vídeo não possui legenda.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Insight IA Dialog */}
      <Dialog open={dialogType === "insight"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Insight IA: Estrutura Milionária
            </DialogTitle>
            <DialogDescription>
              Análise da estrutura persuasiva do vídeo
            </DialogDescription>
          </DialogHeader>

          {insightLoading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Analisando estrutura do vídeo...</p>
            </div>
          ) : insightData ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Gancho</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{insightData.gancho}</p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-bold text-rose-400">Dor Explorada</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{insightData.dor_explorada}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">Solução Apresentada</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{insightData.solucao_apresentada}</p>
              </div>
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Megaphone className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-bold text-violet-400">Call-to-Action</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{insightData.call_to_action}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <Sparkles className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum insight disponível.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog open={dialogType === "player"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-black border-border/50">
          <DialogHeader className="p-3 pb-0">
            <DialogTitle className="flex items-center gap-2 text-sm text-white">
              <Play className="w-4 h-4 text-primary" />
              {selectedVideo?.creator_username ? `@${selectedVideo.creator_username}` : "Vídeo Viral"}
            </DialogTitle>
            <DialogDescription className="sr-only">Player de vídeo TikTok</DialogDescription>
          </DialogHeader>
          <div className="w-full aspect-[9/16] bg-black flex flex-col">
            {selectedVideo?.tiktok_id ? (
              <iframe
                key={selectedVideo.tiktok_id}
                src={`https://www.tiktok.com/player/v1/${selectedVideo.tiktok_id}?music_info=1&description=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin"
              />
            ) : selectedVideo?.video_url ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                <Play className="w-12 h-12 text-muted-foreground/50" />
                <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer">
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
          {selectedVideo?.tiktok_id && (
            <div className="p-2 border-t border-border/30">
              <a
                href={`https://www.tiktok.com/@${selectedVideo.creator_username || 'video'}/video/${selectedVideo.tiktok_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
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
