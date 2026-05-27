import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Search, Users, Loader2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "text-success",
  trial: "text-primary",
  expired: "text-warning",
  cancelled: "text-destructive",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = (users || []).filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.name?.toLowerCase() || "").includes(s) || (u.email?.toLowerCase() || "").includes(s);
  });

  const handleResetPassword = async (userId: string, email: string) => {
    setResettingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Link de redefinição enviado para ${email}`);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-hero flex items-center justify-between mb-6">
        <div className="relative z-10">
          <span className="chip-premium mb-2 inline-flex">Gestão</span>
          <h1 className="type-hero">
            <span className="text-foreground/90">Gestão de </span>
            <span className="page-title-gradient">Usuários</span>
          </h1>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">{users?.length || 0}</Badge>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">{u.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${STATUS_COLORS[u.subscription_status] || ""}`}>
                      {u.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1"
                      disabled={resettingId === u.id}
                      onClick={() => handleResetPassword(u.id, u.email)}
                    >
                      {resettingId === u.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <KeyRound className="w-3 h-3" />
                      )}
                      Resetar Senha
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}