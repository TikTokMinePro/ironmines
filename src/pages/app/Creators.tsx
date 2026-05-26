import { Card, CardContent } from "@/components/ui/card";
import { PageTransition, PageSection, StaggerGrid, StaggerItem } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ExternalLink, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatorsSkeleton } from "@/components/LoadingSkeletons";
import { MiningStatusBar } from "@/components/MiningStatusBar";
import { useState } from "react";

function CreatorAvatar({ username, displayName, avatarUrl }: { username: string; displayName?: string; avatarUrl?: string | null }) {
  const name = displayName || username;
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  
  // Use DB URL if available, otherwise generate one
  const imgSrc = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00E000&color=fff&size=128&bold=true&format=svg`;
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="h-12 w-12 flex-shrink-0 rounded-full ring-2 ring-primary/20 overflow-hidden bg-primary flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">{initials}</span>
      </div>
    );
  }

  return (
    <div className="h-12 w-12 flex-shrink-0 rounded-full ring-2 ring-primary/20 overflow-hidden bg-primary/20">
      <img
        src={imgSrc}
        alt={username}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

import { fmtBRLWhole as fmtBRL, formatNumber as fmtNum } from "@/lib/formatters";

export default function CreatorsPage() {
  const { data: creators, isLoading } = useQuery({
    queryKey: ["viral-creators"],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_creators")
        .select("id, username, display_name, avatar_url, followers, avg_views, engagement_rate, projected_revenue, profile_url, viral_score")
        .order("viral_score", { ascending: false })
        .limit(15);
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });

  // Mining cycle info now handled by MiningStatusBar component

  const rankLabels = ["#1", "#2", "#3"];

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <PageSection>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 flex items-center justify-center border border-primary/20 shadow-[0_2px_12px_rgba(0,224,0,0.2),0_0_20px_rgba(0,224,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
              <Users className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(0,224,0,0.5)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Criadores <span className="text-primary">Virais</span>
              </h1>
              <p className="text-sm text-muted-foreground">Ranking por projeção de faturamento</p>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Status bar */}
      <MiningStatusBar
        countLabel={`${creators?.length || 0} criadores minerados`}
      />

      {/* Creator list */}
      {isLoading ? (
        <CreatorsSkeleton />
      ) : creators?.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum criador viral encontrado.</p>
            <p className="text-sm text-muted-foreground/70">Os dados serão minerados automaticamente à meia-noite.</p>
          </CardContent>
        </Card>
      ) : (
        <StaggerGrid className="space-y-2" stagger={0.07}>
          {creators?.map((c: any, i: number) => {
            const revenue = Number((c as any).projected_revenue) || (Number(c.avg_views) || 0) * 0.015 * 45;
            return (
              <StaggerItem key={c.id}>
                <Card className={`glass hover:border-primary/30 hover:shadow-[0_4px_30px_-8px_hsl(var(--primary)/0.2)] hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 ease-out ${i < 3 ? "border-primary/10" : ""}`}>
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                    {i < 3 ? (
                      <span className="text-[11px] font-bold bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center">{rankLabels[i]}</span>
                    ) : (
                      <span className="text-[11px] font-bold text-muted-foreground">#{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <CreatorAvatar username={c.username} displayName={c.display_name} avatarUrl={c.avatar_url} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm font-display">@{c.username}</p>
                    <p className="text-xs text-muted-foreground">{c.display_name || c.username}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <DollarSign className="w-3 h-3 text-success" />
                      <span className="text-sm font-bold text-success">{fmtBRL(revenue)}</span>
                      <span className="text-[10px] text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  {/* Link */}
                  <a
                    href={c.profile_url || `https://www.tiktok.com/@${c.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      )}
    </PageTransition>
  );
}
