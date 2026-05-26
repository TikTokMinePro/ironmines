import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { GridBackground } from "@/components/ui/grid-background";
import { AnimatePresence, motion } from "framer-motion";

export default function AdminLayout() {
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background relative">
        <GridBackground />
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="h-14 flex items-center border-b border-border/30 px-4 glass-strong">
            <SidebarTrigger className="md:hidden" />
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.key}
                initial={{ opacity: 0, y: 16, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.995 }}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{ willChange: "transform, opacity" }}
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
