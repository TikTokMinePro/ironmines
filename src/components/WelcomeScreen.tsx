import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Pickaxe } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoIronmines from "@/assets/logo-ironmines.png";

/* ── Typing hook ── */
function useTypingEffect(text: string, speed = 80, delay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, done };
}

/* ── Particle generator ── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 1.5,
    duration: Math.random() * 5 + 4,
    drift: (Math.random() - 0.5) * 80,
    opacity: Math.random() * 0.6 + 0.15,
  }));
}

/* ── Animation variants ── */
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
  exit: {
    opacity: 0,
    scale: 1.06,
    filter: "blur(20px)",
    y: -40,
    transition: {
      duration: 0.9,
      ease: [0.36, 0, 0.66, -0.56] as const,
      opacity: { duration: 0.7, ease: "easeIn" },
      filter: { duration: 0.8 },
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const { profile } = useAuth();
  const firstName = profile?.name?.split(" ")[0] || "Minerador";
  const { displayed, done } = useTypingEffect(firstName, 90, 800);
  const particles = useMemo(() => generateParticles(28), []);

  return createPortal(
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      style={{ backgroundColor: "hsl(0 0% 2%)" }}
    >
      {/* ── Floating particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: `hsl(var(--primary) / ${p.opacity})`,
              boxShadow: `0 0 ${p.size * 4}px hsl(var(--primary) / ${p.opacity * 0.5})`,
            }}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
            animate={{
              opacity: [0, p.opacity, p.opacity * 0.5, 0],
              y: [0, -(60 + Math.random() * 120)],
              x: [0, p.drift],
              scale: [0, 1, 1.3, 0.4],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: Math.random() * 3 + 2,
            }}
          />
        ))}
      </div>

      {/* ── Layered ambient glows ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.18, scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 55%)" }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full blur-3xl"
          style={{ background: "hsl(var(--primary) / 0.25)" }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] rounded-full blur-3xl"
          style={{ background: "hsl(160 84% 39% / 0.35)" }}
        />
      </div>

      {/* ── Grid pattern overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Scan line effect ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)" }}
          initial={{ top: "0%" }}
          animate={{ top: "100%" }}
          transition={{ duration: 3, delay: 0.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      <div className="max-w-lg w-full text-center relative z-10">
        {/* Logo with scale-in */}
        <motion.div
          variants={itemVariants}
          className="mb-8"
        >
          <motion.img
            src={logoIronmines}
            alt="IronMines"
            className="h-16 mx-auto"
            initial={{ scale: 0.6, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>

        {/* Greeting with typing effect */}
        <motion.div variants={itemVariants} className="mb-3">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight leading-tight">
            Olá,{" "}
            <span className="text-primary relative">
              {displayed}
              {!done && (
                <motion.span
                  className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 align-middle"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              )}
              {done && (
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                  style={{ transformOrigin: "left", background: "linear-gradient(90deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.2))" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </span>
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-10">
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
            Sua central de mineração de dados está pronta para uso.
          </p>
        </motion.div>

        {/* Divider with icon */}
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 mb-10">
          <motion.div
            className="h-px w-16"
            style={{ transformOrigin: "right", background: "linear-gradient(to right, transparent, hsl(var(--border)))" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
          />
          <motion.div
            className="w-10 h-10 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 1, type: "spring", stiffness: 200 }}
          >
            <motion.div
              animate={{ rotate: [0, -12, 12, -6, 0] }}
              transition={{ duration: 1, delay: 1.6, ease: "easeInOut" }}
            >
              <Pickaxe className="w-4 h-4 text-primary" />
            </motion.div>
          </motion.div>
          <motion.div
            className="h-px w-16"
            style={{ transformOrigin: "left", background: "linear-gradient(to left, transparent, hsl(var(--border)))" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
          />
        </motion.div>

        {/* CTA with glow pulse */}
        <motion.div variants={itemVariants}>
          <motion.div
            className="inline-block relative"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Button glow */}
            <motion.div
              className="absolute -inset-1 rounded-lg opacity-0"
              style={{ background: "hsl(var(--primary) / 0.3)", filter: "blur(12px)" }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 2 }}
            />
            <Button
              size="lg"
              className="gap-2.5 px-10 h-12 text-sm font-semibold group relative overflow-hidden"
              onClick={onContinue}
            >
              <span className="relative z-10 flex items-center gap-2.5">
                Acessar Painel
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="mt-12">
          <p className="text-[11px] text-muted-foreground/40 tracking-wider uppercase font-medium">
            Mineração inteligente de produtos virais
          </p>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}
