import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AdminAI() {
  const { data: creatives } = useQuery({
    queryKey: ["admin-creatives"],
    queryFn: async () => {
      const { data } = await supabase.from("user_creatives").select("*, profiles(name, email)").order("generated_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const totalThisMonth = creatives?.filter((c: any) => {
    const d = new Date(c.generated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="page-hero flex items-center justify-between mb-6">
        <div className="relative z-10">
          <span className="chip-premium mb-2 inline-flex">IA</span>
          <h1 className="type-hero">
            <span className="text-foreground/90">IA & </span>
            <span className="page-title-gradient">Criativos</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass"><CardContent className="p-4"><p className="type-stat-lg text-primary">{totalThisMonth}</p><p className="type-overline text-muted-foreground mt-0.5">Criativos este mês</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4"><p className="type-stat-lg text-secondary">{creatives?.length || 0}</p><p className="type-overline text-muted-foreground mt-0.5">Total de criativos</p></CardContent></Card>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Avatar</TableHead>
                <TableHead>Pose</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatives?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="text-foreground">{(c as any).profiles?.name || (c as any).profiles?.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.avatar_used || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.pose || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(c.generated_at).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
