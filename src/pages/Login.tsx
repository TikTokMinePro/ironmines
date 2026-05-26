import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Mail, Lock, Eye, EyeClosed, ArrowRight } from "lucide-react";
import logoIronmines from "@/assets/logo-ironmines.png";
import { GridBackground } from "@/components/ui/grid-background";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";

const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email ou senha incorretos. Verifique e tente novamente.",
  "Email not confirmed": "Email ainda não confirmado. Verifique sua caixa de entrada.",
  "User not found": "Nenhuma conta encontrada com esse email.",
  "Too many requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "Email rate limit exceeded": "Limite de envios atingido. Aguarde alguns minutos.",
};

function friendlyAuthError(message: string): string {
  for (const [key, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return friendly;
  }
  return "Ocorreu um erro. Tente novamente mais tarde.";
}

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const navigate = useNavigate();

  // 3D card tilt — hooks MUST be called before any early return (Rules of Hooks)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  // Early returns AFTER all hooks
  if (authLoading) return <LoadingScreen />;
  if (user) return <Navigate to="/app/dashboard" replace />;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast.error(friendlyAuthError(error.message));
      } else {
        navigate("/app/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Insira seu email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(friendlyAuthError(error.message));
      } else {
        toast.success("Link de redefinição enviado para seu email!");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-background relative overflow-hidden flex items-center justify-center">
      <GridBackground />

      {/* Top radial glow - brand green */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] rounded-b-[50%] bg-primary/15 blur-[80px]" />
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] rounded-b-full bg-primary/10 blur-[60px]"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }}
      />

      {/* Ambient glow spots */}
      <div className="absolute left-1/4 top-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px] animate-pulse opacity-40" />
      <div className="absolute right-1/4 bottom-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px] animate-pulse opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10 px-5 sm:px-4"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div className="relative group">
            {/* Card glow effect */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px hsl(var(--primary) / 0.05)",
                  "0 0 15px 5px hsl(var(--primary) / 0.1)",
                  "0 0 10px 2px hsl(var(--primary) / 0.05)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
            />

            {/* Traveling light beam border */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              {/* Top beam */}
              <motion.div
                className="absolute top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"
                animate={{ left: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                }}
              />
              {/* Right beam */}
              <motion.div
                className="absolute top-0 right-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-primary to-transparent opacity-70"
                animate={{ top: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  top: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 0.6 },
                }}
              />
              {/* Bottom beam */}
              <motion.div
                className="absolute bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"
                animate={{ right: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.2 },
                }}
              />
              {/* Left beam */}
              <motion.div
                className="absolute bottom-0 left-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-primary to-transparent opacity-70"
                animate={{ bottom: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  bottom: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.8 },
                }}
              />

              {/* Corner glow dots */}
              {[
                "top-0 left-0",
                "top-0 right-0",
                "bottom-0 right-0",
                "bottom-0 left-0",
              ].map((pos, i) => (
                <motion.div
                  key={pos}
                  className={`absolute ${pos} h-[6px] w-[6px] rounded-full bg-primary/50 blur-[2px]`}
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2 + i * 0.2, repeat: Infinity, repeatType: "mirror", delay: i * 0.4 }}
                />
              ))}
            </div>

            {/* Glass card */}
            <div className="relative bg-background/20 backdrop-blur-2xl rounded-2xl p-6 sm:p-7 border border-primary/10 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)] overflow-hidden">
              {/* Inner subtle pattern */}
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: "30px 30px",
                }}
              />

              {/* Logo */}
              <div className="text-center mb-6 relative z-10">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="flex items-center justify-center mb-2"
                >
                  <img src={logoIronmines} alt="IronMines" className="h-20 w-auto" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground text-xs"
                >
                  Mineração inteligente de produtos virais
                </motion.p>
              </div>

              {/* Form */}
              <div className="relative z-10">
                {!forgotMode ? (
                  <form onSubmit={handleLogin} className="space-y-4" aria-label="Formulário de login">
                    {/* Email */}
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center rounded-lg overflow-hidden">
                        <label htmlFor="email" className="sr-only">Email</label>
                        <Mail className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "email" ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedInput("email")}
                          onBlur={() => setFocusedInput(null)}
                          className="pl-10 bg-muted/20 border-border/30 focus:border-primary/50 focus:bg-muted/30 h-11 transition-all duration-300 placeholder:text-muted-foreground/50"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </motion.div>

                    {/* Password */}
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center rounded-lg overflow-hidden">
                        <label htmlFor="password" className="sr-only">Senha</label>
                        <Lock className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "password" ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedInput("password")}
                          onBlur={() => setFocusedInput(null)}
                          className="pl-10 pr-10 bg-muted/20 border-border/30 focus:border-primary/50 focus:bg-muted/30 h-11 transition-all duration-300 placeholder:text-muted-foreground/50"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 p-1 rounded-md hover:bg-muted/30 transition-colors"
                          tabIndex={-1}
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? (
                            <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                          ) : (
                            <EyeClosed className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                          )}
                        </button>
                      </div>
                    </motion.div>

                    {/* Forgot password link */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    {/* Submit button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full relative group/button"
                    >
                      <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />
                      <div className="relative overflow-hidden gradient-primary text-primary-foreground font-semibold h-11 rounded-xl transition-all duration-300 flex items-center justify-center">
                        {/* Shimmer on loading */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                          style={{ opacity: loading ? 1 : 0, transition: "opacity 0.3s ease" }}
                        />
                        <AnimatePresence mode="wait">
                          {loading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <div className="w-4 h-4 border-2 border-primary-foreground/70 border-t-transparent rounded-full animate-spin" />
                            </motion.div>
                          ) : (
                            <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-sm font-semibold">
                              Entrar <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-1 transition-transform duration-300" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4" aria-label="Recuperar senha">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center rounded-lg overflow-hidden">
                        <label htmlFor="forgot-email" className="sr-only">Email para recuperação</label>
                        <Mail className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "email" ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedInput("email")}
                          onBlur={() => setFocusedInput(null)}
                          className="pl-10 bg-muted/20 border-border/30 focus:border-primary/50 focus:bg-muted/30 h-11 transition-all duration-300 placeholder:text-muted-foreground/50"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </motion.div>
                    <p className="text-xs text-muted-foreground">
                      Enviaremos um link de redefinição para o email cadastrado.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full relative group/button"
                    >
                      <div className="relative overflow-hidden gradient-primary text-primary-foreground font-semibold h-11 rounded-xl transition-all duration-300 flex items-center justify-center text-sm">
                        {loading ? "Enviando..." : "Enviar Link"}
                      </div>
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setForgotMode(false)}
                      className="text-[11px] text-primary hover:underline w-full text-center"
                    >
                      Voltar ao login
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
