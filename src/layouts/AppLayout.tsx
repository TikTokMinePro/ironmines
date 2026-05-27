import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GridBackground } from "@/components/ui/grid-background";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  // Cursor-following spotlight for all .card-3d elements (global)
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

        {/* Skip to content - accessibility */}
        <a href="#main-content" className="skip-to-content">
          Pular para o conteúdo
        </a>

        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="app-header-premium h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-20">
            <span className="app-header-pulse" aria-hidden="true" />
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger className="md:hidden shrink-0" aria-label="Abrir menu de navegação">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
            </div>
            <nav className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Ações do usuário">
              <span className="app-user-chip hidden sm:inline-flex max-w-[220px]">
                <span className="app-user-chip-dot" aria-hidden="true" />
                <span className="truncate">{profile?.name || profile?.email || "Usuário"}</span>
              </span>
              <span className="sm:hidden text-[11px] text-muted-foreground truncate max-w-[140px]">
                {profile?.name || profile?.email || "Usuário"}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="app-logout-btn h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={signOut}
                aria-label="Sair da conta"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
              </Button>
            </nav>
          </header>

          <main
            id="main-content"
            className={`flex-1 min-h-0 relative z-10 ${location.pathname === '/app/influencer' ? 'flex flex-col overflow-hidden' : 'p-3 sm:p-4 md:p-6 overflow-auto'}`}
            role="main"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.key}
                className={location.pathname === '/app/influencer' ? 'flex-1 min-h-0 flex flex-col' : ''}
                initial={{ opacity: 0, y: 16, scale: 0.99, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, scale: 0.995, filter: "blur(4px)" }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
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
