import {
  LayoutDashboard, Flame, Clapperboard, Crown, Wand2, Image,
  Calculator, Settings
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import logoIronmines from "@/assets/logo-ironmines.png";
import { useAuth } from "@/contexts/AuthContext";
import React, { useCallback, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

const group1 = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
];

const viralUrls = new Set(["/app/produtos", "/app/videos", "/app/criadores", "/app/influencer", "/app/criativos", "/app/calculadora"]);

const group2 = [
  { title: "Produtos Virais", url: "/app/produtos", icon: Flame },
  { title: "Vídeos Virais", url: "/app/videos", icon: Clapperboard },
  { title: "Criadores Virais", url: "/app/criadores", icon: Crown },
];

const group3 = [
  { title: "Influencer IA", url: "/app/influencer", icon: Wand2 },
  { title: "Meus Criativos", url: "/app/criativos", icon: Image },
  { title: "Calculadora", url: "/app/calculadora", icon: Calculator },
];

function SidebarDivider() {
  return (
    <div className="relative my-3 mx-3">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-primary/8 to-transparent blur-sm" />
    </div>
  );
}

function GlowIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="relative z-10 shrink-0 flex items-center justify-center w-7 h-7 rounded-[8px] bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent border border-white/[0.06] shadow-[0_1px_4px_rgba(255,255,255,0.04)] backdrop-blur-sm transition-all duration-300 group-hover/link:border-white/[0.12] mr-2.5">
      <Icon className="sidebar-icon-pulse-target h-4 w-4 text-white/55 transition-all duration-300 group-[.sidebar-item-active]/link:text-primary group-[.sidebar-item-active]/link:drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)] group-hover/link:text-white/80" />
    </span>
  );
}

/** Tracks mouse position for the spotlight hover effect */
function useSpotlight() {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);

  return { ref, onMouseMove };
}

const SidebarLink = React.forwardRef<HTMLAnchorElement, {
  item: { title: string; url: string; icon: React.ElementType };
  isDashboard: boolean;
  isViral: boolean;
  onNavigate?: () => void;
  index: number;
} & Omit<React.ComponentPropsWithoutRef<typeof NavLink>, "to" | "children">>(
  ({
    item,
    isDashboard,
    isViral,
    onNavigate,
    index,
    className,
    onClick,
    onMouseMove,
    style,
    ...props
  }, forwardedRef) => {
    const { ref, onMouseMove: onSpotlightMouseMove } = useSpotlight();

    const setRefs = (node: HTMLAnchorElement | null) => {
      ref.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        onNavigate?.();
      }
    };

    const handleMouseMove: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
      onMouseMove?.(event);
      onSpotlightMouseMove(event);
    };

    if (isDashboard) {
      return (
        <NavLink
          ref={setRefs}
          to={item.url}
          end
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          className={cn(
            "sidebar-link-hover group/link relative flex w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left text-[13px] transition-all duration-300 bg-primary/10 text-foreground font-semibold border border-primary/20",
            className,
          )}
          activeClassName=""
          style={{ ...style, animationDelay: `${index * 50}ms` }}
          {...props}
        >
          {/* Spotlight radial glow following cursor */}
          <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover/link:opacity-100 sidebar-spotlight" />
          {/* Shimmer sweep */}
          <span className="pointer-events-none absolute inset-0 rounded-lg sidebar-shimmer-sweep" />
          {/* Gradient background */}
          <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-primary/12 via-primary/6 to-transparent" />
          {/* Left active indicator */}
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)] sidebar-indicator" />

          <item.icon className="relative z-10 mr-2.5 h-[16px] w-[16px] shrink-0 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)] transition-all duration-300 group-hover/link:drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)] group-hover/link:scale-110" />
          <span className="relative z-10 text-foreground transition-all duration-300 group-hover/link:tracking-wide">
            {item.title}
          </span>
        </NavLink>
      );
    }

    return (
      <NavLink
        ref={setRefs}
        to={item.url}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className={cn(
          "sidebar-link-hover group/link relative flex w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left text-[13px] text-sidebar-foreground/70 transition-all duration-300 hover:text-sidebar-foreground",
          className,
        )}
        activeClassName="sidebar-item-active"
        style={{ ...style, animationDelay: `${index * 50}ms` }}
        {...props}
      >
        {/* Spotlight radial glow following cursor */}
        <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover/link:opacity-100 sidebar-spotlight" />
        {/* Shimmer sweep on hover */}
        <span className="pointer-events-none absolute inset-0 rounded-lg sidebar-shimmer-sweep" />
        {/* No active glow bar for non-dashboard items */}

        {isViral ? (
          <GlowIcon icon={item.icon} />
        ) : (
          <item.icon className="sidebar-icon-pulse-target relative z-10 mr-2.5 h-[16px] w-[16px] shrink-0 transition-all duration-300 group-[.sidebar-item-active]/link:text-primary group-[.sidebar-item-active]/link:drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)] group-hover/link:text-white/80 group-hover/link:scale-110" />
        )}
        <span className="relative z-10 transition-all duration-300 group-hover/link:translate-x-0.5">
          {item.title}
        </span>
      </NavLink>
    );
  },
);
SidebarLink.displayName = "SidebarLink";

function MenuGroup({ items, onNavigate, startIndex = 0 }: { items: typeof group1; onNavigate?: () => void; startIndex?: number }) {
  return (
    <SidebarMenu>
      {items.map((item, i) => {
        const isDashboard = item.url === "/app/dashboard";
        const isViral = viralUrls.has(item.url);
        return (
          <SidebarMenuItem key={item.title} className="sidebar-item-enter">
            <SidebarMenuButton asChild>
              <SidebarLink
                item={item}
                isDashboard={isDashboard}
                isViral={isViral}
                onNavigate={onNavigate}
                index={startIndex + i}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

// Static — generated once at module load, never changes between renders
const SIDEBAR_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${8 + (i * 7) % 84}%`,
  animationDelay: `${i * 0.7}s`,
  animationDuration: `${6 + (i % 4) * 2}s`,
  width: `${2 + (i % 3)}px`,
  height: `${2 + (i % 3)}px`,
  opacity: 0.15 + (i % 3) * 0.08,
}));

const planLabels: Record<string, string> = {
  active: "Pro",
  trial: "Trial",
  expired: "Expirado",
  cancelled: "Cancelado",
};

export function AppSidebar() {
  const { profile, isAdmin } = useAuth();
  const { setOpenMobile } = useSidebar();
  const { ref, onMouseMove } = useSpotlight();

  const closeMobile = useCallback(() => setOpenMobile(false), [setOpenMobile]);

  const planName = isAdmin ? "Admin" : (planLabels[profile?.subscription_status] || "Basic");

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarContent className="sidebar-premium px-1 sm:px-0">
        {/* Logo area */}
        <div className="flex justify-center pt-6 pb-3 sidebar-item-enter" style={{ animationDelay: '0ms' }}>
          <img src={logoIronmines} alt="IronMines" className="h-20 w-auto" />
        </div>

        <SidebarGroup className="px-3 sm:px-2">
          <div className="px-2 mb-1 sidebar-item-enter" style={{ animationDelay: '30ms' }}>
            <span className="text-[9px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/40">
              Menu
            </span>
          </div>
          <SidebarGroupContent>
            <MenuGroup items={group1} onNavigate={closeMobile} startIndex={1} />
            <SidebarDivider />
            <MenuGroup items={group2} onNavigate={closeMobile} startIndex={2} />
            <SidebarDivider />
            <MenuGroup items={group3} onNavigate={closeMobile} startIndex={5} />
            <SidebarDivider />
            <SidebarMenu>
              <SidebarMenuItem className="sidebar-item-enter" style={{ animationDelay: '400ms' }}>
                <SidebarMenuButton asChild>
                  <NavLink
                    ref={ref}
                    to="/app/configuracoes"
                    onClick={closeMobile}
                    onMouseMove={onMouseMove}
                    className="sidebar-link-hover group/link relative overflow-hidden rounded-lg text-[13px] text-sidebar-foreground/70 transition-all duration-300 hover:text-sidebar-foreground"
                    activeClassName="sidebar-item-active"
                  >
                    {/* Spotlight radial glow */}
                    <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover/link:opacity-100 sidebar-spotlight" />
                    <span className="pointer-events-none absolute inset-0 rounded-lg sidebar-shimmer-sweep" />
                    {/* No glow bar for settings */}

                    <GlowIcon icon={Settings} />
                    <div className="relative z-10 flex items-center gap-2 flex-1">
                      <span className="transition-all duration-300 group-[.sidebar-item-active]/link:text-foreground group-[.sidebar-item-active]/link:font-semibold group-hover/link:translate-x-0.5">Conta</span>
                      <Badge className="ml-auto text-[8px] px-1.5 py-0 h-[16px] border-0 bg-primary/15 text-primary/80 font-semibold tracking-wide">
                        {planName}
                      </Badge>
                    </div>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Floating particles — static array defined at module scope, no Array.from() on each render */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {SIDEBAR_PARTICLES.map((p, i) => (
            <span key={i} className="sidebar-particle" style={p} />
          ))}
        </div>

        {/* Bottom ambient glow */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/[0.03] to-transparent" />
      </SidebarContent>
    </Sidebar>
  );
}
