import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";

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
    y: Math.random() * 100 + 20,
    size: Math.random() * 3 + 1.5,
    delay: Math.random() * 2,
    duration: Math.random() * 4 + 3,
    drift: (Math.random() - 0.5) * 60,
    opacity: Math.random() * 0.5 + 0.15,
  }));
}

export const DashboardParticles = memo(function DashboardParticles() {
  const [particles] = useState(() => generateParticles(18));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
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
            boxShadow: `0 0 ${p.size * 3}px hsl(var(--primary) / ${p.opacity * 0.6})`,
            willChange: "transform, opacity",
          }}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
          animate={{
            opacity: [0, p.opacity, p.opacity * 0.6, 0],
            y: [0, -(40 + Math.random() * 80)],
            x: [0, p.drift],
            scale: [0, 1, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
            repeat: 0,
          }}
        />
      ))}
    </div>
  );
});
