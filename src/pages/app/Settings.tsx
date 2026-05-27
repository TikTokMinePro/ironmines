import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition, PageSection } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const { profile, user, isAdmin, signOut } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Sync name when profile loads asynchronously
  useEffect(() => {
    if (profile?.name !== undefined && profile?.name !== null) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const updateProfile = async () => {
    if (!name.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }
    if (name.trim().length > 100) {
      toast.error("O nome deve ter no máximo 100 caracteres");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", user!.id);
      if (error) {
        toast.error("Erro ao salvar perfil. Tente novamente.");
        console.error("Profile update error:", error.message);
      } else {
        toast.success("Perfil atualizado!");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword.length > 72) {
      toast.error("A senha deve ter no máximo 72 caracteres");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        if (error.message.toLowerCase().includes("same password")) {
          toast.error("A nova senha deve ser diferente da atual");
        } else {
          toast.error("Erro ao alterar senha. Tente novamente.");
          console.error("Password change error:", error.message);
        }
      } else {
        toast.success("Senha alterada com sucesso!");
        setNewPassword("");
      }
    } catch (err) {
      console.error("Password change error:", err);
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    }
  };

  return (
    <PageTransition className="space-y-6 max-w-2xl mx-auto">
      <div className="page-hero">
        <div className="relative z-10 flex items-center gap-3">
          <div className="section-icon-box w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 flex items-center justify-center border border-primary/25 shadow-[0_2px_12px_rgba(0,224,0,0.25),0_0_22px_rgba(0,224,0,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
            <SettingsIcon className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(0,224,0,0.6)] relative z-10" />
          </div>
          <div>
            <span className="chip-premium mb-1.5 inline-flex">Sua Conta</span>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              <span className="page-title-gradient">Configurações</span>
            </h1>
            <p className="text-sm text-muted-foreground/85 mt-0.5">Perfil, segurança e preferências</p>
          </div>
        </div>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-foreground">Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <Button onClick={updateProfile} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card className="glass">
          <CardHeader><CardTitle className="text-foreground">Assinatura</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">Admin</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Acesso total ao sistema sem restrições.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass">
          <CardHeader><CardTitle className="text-foreground">Assinatura</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="capitalize">{profile?.subscription_status || "trial"}</Badge>
            </div>
            {profile?.subscription_expires_at && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Expira em:</span>
                <span className="text-foreground">{new Date(profile.subscription_expires_at).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            <div className="pt-1">
              <p className="text-xs text-muted-foreground">Para renovar ou alterar seu plano, entre em contato com o suporte.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass">
        <CardHeader><CardTitle className="text-foreground">Alterar Senha</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" maxLength={72} />
          </div>
          <Button onClick={changePassword} variant="outline">Alterar Senha</Button>
        </CardContent>
      </Card>

      <Card className="glass border-destructive/30">
        <CardContent className="p-4">
          <Button variant="destructive" onClick={signOut}>Sair da Conta</Button>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
