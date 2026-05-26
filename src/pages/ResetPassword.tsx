import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import logoIronmines from "@/assets/logo-ironmines.png";
import { GridBackground } from "@/components/ui/grid-background";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    if (window.location.hash.includes("type=recovery")) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (error.message.toLowerCase().includes("same password")) {
          toast.error("A nova senha deve ser diferente da senha atual.");
        } else {
          toast.error("Erro ao redefinir senha. Tente novamente.");
        }
      } else {
        toast.success("Senha redefinida com sucesso!");
        navigate("/login");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <GridBackground />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <img src={logoIronmines} alt="IronMines" className="h-20 w-auto" />
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">Mineração inteligente de produtos virais</p>
        </div>

        <Card className="border-border/20 bg-card/80 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground text-sm">Redefinir Senha</CardTitle>
            <CardDescription className="text-xs">
              {ready ? "Digite sua nova senha" : "Aguardando validação do link..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ready ? (
              <form onSubmit={handleReset} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nova Senha</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirmar Senha</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Salvando..." : "Redefinir Senha"}
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Se o link não carregar, tente clicar novamente no email.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
