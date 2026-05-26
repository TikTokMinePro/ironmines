import { useState, useEffect } from "react";
import { ChevronDown, Check, Package, Users, Camera, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const icons: Record<string, any> = {
  produto: Package,
  influencer: Users,
  cena: Camera,
  ajustes: Sliders,
};

interface Props {
  icon: string;
  title: string;
  subtitle: string | null;
  isComplete: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  locked?: boolean;
  autoHighlight?: boolean;
}

export function AccordionSection({ icon, title, subtitle, isComplete, isOpen, onToggle, children, locked, autoHighlight }: Props) {
  const Icon = icons[icon] || Package;
  const [highlight, setHighlight] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (autoHighlight && isOpen) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [autoHighlight, isOpen]);

  useEffect(() => {
    if (isComplete) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  return (
    <div className={`card-3d relative rounded-xl border transition-all duration-700 ${
      highlight ? "border-primary/60 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]" : "border-border/30"
    }`}>
      <button
        onClick={locked ? undefined : onToggle}
        className={`w-full flex items-center gap-3 p-3.5 transition-all duration-300 relative z-10 ${locked ? "cursor-default" : "hover:bg-muted/20"}`}
      >
        <div className={`relative w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
          isComplete 
            ? "bg-primary text-primary-foreground shadow-[0_0_12px_-2px_hsl(var(--primary)/0.5)]" 
            : "border border-muted-foreground/30"
        }`}>
          {isComplete ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />}
          {pulse && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/40"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </div>
        <Icon className={`w-4 h-4 shrink-0 transition-colors duration-300 ${isOpen ? "text-primary" : "text-muted-foreground"}`} />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {!locked && <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden", willChange: "height, opacity" }}
          >
            <div className="px-3.5 pb-3.5 pt-1 relative">
              <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Highlight glow overlay */}
      {highlight && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
          }}
        />
      )}
    </div>
  );
}
