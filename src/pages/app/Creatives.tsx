import { Card, CardContent } from "@/components/ui/card";
import { PageTransition, PageSection, StaggerGrid, StaggerItem } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, User, Camera, Palette, Sparkles, RectangleHorizontal, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CreativesSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";

const FORMAT_LABELS: Record<string, string> = {
  vertical: "9:16",
  square: "1:1",
  portrait: "3:4",
  horizontal: "16:9",
};

export default function CreativesPage() {
  const qc = useQueryClient();

  const { data: creatives, isLoading } = useQuery({
    queryKey: ["user-creatives"],
    queryFn: async () => {
      const { data } = await supabase.from("user_creatives").select("*").order("generated_at", { ascending: false });
      return data || [];
    },
  });

  const deleteCreative = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_creatives").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Criativo removido");
      qc.invalidateQueries({ queryKey: ["user-creatives"] });
    },
    onError: (err: Error) => {
      console.error("Delete creative error:", err.message);
      toast.error("Erro ao remover criativo. Tente novamente.");
    },
  });

  return (
    <PageTransition className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Meus Criativos</h1>

      {isLoading ? (
        <CreativesSkeleton />
      ) : creatives?.length === 0 ? (
        <Card className="glass"><CardContent className="p-8 text-center text-muted-foreground">Nenhum criativo gerado ainda. Use o Influencer IA para criar seu primeiro!</CardContent></Card>
      ) : (
        <StaggerGrid className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {creatives?.map((c: any) => (
            <StaggerItem key={c.id} className="break-inside-avoid">
            <Card className="glass overflow-hidden group">
              <CardContent className="p-0">
                {c.image_url && (
                  <div className="relative">
                    <img src={c.image_url} alt="" className="w-full rounded-t-lg" />
                    {c.format && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 opacity-80">
                        <RectangleHorizontal className="w-2.5 h-2.5 mr-0.5" />
                        {FORMAT_LABELS[c.format] || c.format}
                      </Badge>
                    )}
                    {c.veo_video_url && (
                      <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-primary/80">
                        <Video className="w-2.5 h-2.5 mr-0.5" /> Vídeo
                      </Badge>
                    )}
                  </div>
                )}
                <div className="p-3 space-y-2">
                  {/* Tags de detalhes */}
                  <div className="flex flex-wrap gap-1">
                    {c.avatar_used && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        <User className="w-2.5 h-2.5 mr-0.5" /> {c.avatar_used}
                      </Badge>
                    )}
                    {c.pose && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        <Camera className="w-2.5 h-2.5 mr-0.5" /> {c.pose}
                      </Badge>
                    )}
                    {c.style && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        <Palette className="w-2.5 h-2.5 mr-0.5" /> {c.style}
                      </Badge>
                    )}
                    {c.environment && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" /> {c.environment}
                      </Badge>
                    )}
                  </div>

                  {/* Enhancements */}
                  {c.enhancements && c.enhancements.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.enhancements.map((e: string) => (
                        <Badge key={e} variant="secondary" className="text-[10px] px-1.5 py-0">{e}</Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground">
                    {new Date(c.generated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>

                  <div className="flex gap-2">
                    {c.image_url && (
                      <a href={c.image_url} download className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-xs"><Download className="w-3 h-3 mr-1" /> Download</Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCreative.mutate(c.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </PageTransition>
  );
}