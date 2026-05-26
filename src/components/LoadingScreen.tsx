import { motion } from "framer-motion";
import logoIronmines from "@/assets/logo-ironmines.png";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      {/* Ambient background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.04) 0%, transparent 60%)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
        className="relative z-10 text-center px-4"
      >
        {/* Logo with gentle pulse */}
        <motion.div
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-5"
        >
          <img
            src={logoIronmines}
            alt="IronMines"
            className="h-20 sm:h-24 w-auto mx-auto drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
          />
        </motion.div>

        {/* Smooth loading bar */}
        <div className="relative w-28 h-[3px] bg-muted/20 rounded-full mx-auto overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-y-0 w-1/2 gradient-primary rounded-full"
            style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.4)" }}
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-xs text-muted-foreground mt-4"
        >
          Carregando...
        </motion.p>
      </motion.div>
    </div>
  );
}
