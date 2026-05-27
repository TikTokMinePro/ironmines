import { Outlet, useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { GridBackground } from "@/components/ui/grid-background";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { Shield } from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  // Cursor spotlight for all .card-3d elements (same as AppLayout)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const card = target.closest<HTMLElement>(".card-3d");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--card-mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--card-my", `${e.clientY - rect.top}px`);
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="app-shell min-h-screen flex w-full bg-background relative">
        <GridBackground />

        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Premium header — matches AppLayout */}
          <header className="app-header-premium h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-20">
            <span className="app-header-pulse" aria-hidden="true" />
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger className="md:hidden shrink-0" aria-label="Abrir menu admin" />
            </div>
            <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="admin-header-badge hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary/80 bg-primary/[0.07] border border-primary/20 rounded-full px-3 py-1">
                <Shield className="w-3 h-3" />
                Admin Panel
              </span>
              <Link
                to="/app/dashboard"
                className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors"
              >
                ← Voltar ao App
              </Link>
            </nav>
          </header>

          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.key}
                initial={{ opacity: 0, y: 16, scale: 0.99, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, scale: 0.995, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ willChange: "transform, opacity, filter" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
