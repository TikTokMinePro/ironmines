import { useEffect, useState } from "react";
import { X, Search, Paintbrush, Sparkles, CloudUpload, Rocket, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratingOverlayProps {
  elapsed: number;
  cancelled: boolean;
  onCancel: () => void;
}

const STEPS = [
  { min: 0, label: "Analisando produto e referências", Icon: Search },
  { min: 8, label: "Gerando imagem base (flux-dev)", Icon: Paintbrush },
  { min: 40, label: "Aplicando face swap", Icon: Sparkles },
  { min: 60, label: "Inserindo produto na cena", Icon: PackageCheck },
  { min: 100, label: "Processando upload", Icon: CloudUpload },
  { min: 115, label: "Finalizando criativo", Icon: Rocket },
];

function getCurrentStep(elapsed: number) {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (elapsed >= STEPS[i].min) return i;
  }
  return 0;
}

export function GeneratingOverlay({ elapsed, cancelled, onCancel }: GeneratingOverlayProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);
  
  useEffect(() => {
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 3,
    }));
    setParticles(p);
  }, []);

  const progress = Math.min((elapsed / 130) * 100, 95);
  const currentStepIndex = getCurrentStep(elapsed);
  const currentStep = STEPS[currentStepIndex];
  const remainingSeconds = elapsed < 40 ? 90 : elapsed < 80 ? 50 : elapsed < 110 ? 25 : 10;


  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: cancelled ? 0 : 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(12px)" }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full gen-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: `hsl(120 100% ${40 + p.size * 10}%)`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Central ring pulse effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="gen-ring-1" />
        <div className="gen-ring-2" />
        <div className="gen-ring-3" />
      </div>

      {/* Main orb */}
      <motion.div
        className="relative w-28 h-28 mb-8"
        animate={{
          scale: cancelled ? 0.5 : [1, 1.06, 1],
          rotate: cancelled ? 180 : 0,
        }}
        transition={{
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 0.6 },
        }}
      >
        {/* Outer glow ring */}
        <div className="gen-orb-glow" />
        
        {/* Main sphere */}
        <div className="gen-orb-sphere">
          {/* Inner light refraction */}
          <div className="gen-orb-refraction" />
          {/* Highlight */}
          <div className="gen-orb-highlight" />
        </div>

        {/* Orbiting dot */}
        <div className="gen-orbit-dot" />
      </motion.div>

      {/* Title */}
      <motion.h3
        className="text-xl font-extrabold mb-2 relative z-10"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-foreground">Ger</span>
        <span className="gen-gradient-text">ando...</span>
      </motion.h3>

      {/* Step indicator with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          className="flex items-center gap-2 mb-6 relative z-10"
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -6, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <currentStep.Icon className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground/80 font-medium">
            {cancelled ? "Geração cancelada" : currentStep.label}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Step dots */}
      <div className="flex items-center gap-1.5 mb-5 relative z-10">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: i === currentStepIndex ? 20 : 6,
              height: 6,
              backgroundColor: i <= currentStepIndex
                ? "hsl(120 100% 44%)"
                : "hsl(240 4% 20%)",
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ borderRadius: 3 }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[280px] mb-3 relative z-10">
        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden relative backdrop-blur-sm border border-white/[0.04]">
          {/* Shimmer background */}
          <div className="gen-progress-shimmer" />
          {/* Fill bar */}
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            initial={{ width: "0%" }}
            animate={{ width: cancelled ? "0%" : `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              background: cancelled
                ? "hsl(0 72% 51%)"
                : "linear-gradient(90deg, hsl(120 100% 44%), hsl(140 70% 50%), hsl(120 100% 50%))",
              backgroundSize: "200% 100%",
              animation: "gen-progress-gradient 3s ease infinite",
              boxShadow: cancelled
                ? "none"
                : "0 0 12px hsl(120 100% 44% / 0.6), 0 0 24px hsl(140 70% 50% / 0.3)",
            }}
          >
            {/* Moving shine */}
            <div className="gen-progress-shine" />
          </motion.div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-2">
          <motion.span
            className="text-[11px] font-mono text-primary/80 font-semibold tabular-nums"
            key={Math.round(progress)}
          >
            {Math.round(progress)}%
          </motion.span>
          {!cancelled && (
            <span className="text-[10px] text-muted-foreground/40 tabular-nums">
              ~{remainingSeconds}s restantes
            </span>
          )}
        </div>
      </div>

      {/* Info text */}
      <motion.p
        className="text-[10px] text-muted-foreground/30 mt-2 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        A geração leva de 60 a 130 segundos. Não feche a tela.
      </motion.p>

      {/* Cancel button */}
      {!cancelled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="mt-5 text-[11px] h-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
            onClick={onCancel}
          >
            <X className="w-3.5 h-3.5 mr-1.5" /> Cancelar geração
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
