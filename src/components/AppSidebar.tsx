import {
  LayoutDashboard, Flame, Clapperboard, Crown, Wand2, Image,
  Calculator, Settings, ChevronRight
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import logoIronmines from "@/assets/logo-ironmines.png";
import { useAuth } from "@/contexts/AuthContext";
import React, { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type MenuItem = { title: string; url: string; icon: React.ElementType };

const groupAnalise: MenuItem[] = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Produtos Virais", url: "/app/produtos", icon: Flame },
  { title: "Vídeos Virais", url: "/app/videos", icon: Clapperboard },
  { title: "Criadores Virais", url: "/app/criadores", icon: Crown },
];

const groupIA: MenuItem[] = [
  { title: "Influencer IA", url: "/app/influencer", icon: Wand2 },
  { title: "Meus Criativos", url: "/app/criativos", icon: Image },
  { title: "Calculadora", url: "/app/calculadora", icon: Calculator },
];

/* ── Group section header ── */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sidebar-group-label sidebar-item-enter">
      <span className="sidebar-group-label-dot" />
      <span className="sidebar-group-label-text">{children}</span>
      <span className="sidebar-group-label-line" />
    </div>
  );
}

/* ── Animated divider ── */
function SidebarDivider() {
  return <div className="sidebar-divider-v2" aria-hidden="true" />;
}

/* ── Icon container with group tint ── */
function GlowIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="sidebar-icon-tint relative z-10 shrink-0 flex items-center justify-center w-7 h-7 rounded-[8px] bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent border border-white/[0.06] shadow-[0_1px_4px_rgba(255,255,255,0.04)] backdrop-blur-sm transition-all duration-300 group-hover/link:border-white/[0.18] group-hover/link:shadow-[0_2px_10px_hsl(var(--primary)/0.15)] mr-2.5">
      <Icon className="sidebar-icon-pulse-target h-4 w-4 text-white/55 transition-all duration-300 group-[.sidebar-item-active]/link:text-primary group-[.sidebar-item-active]/link:drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)] group-hover/link:text-white/85 group-hover/link:scale-110" />
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
  item: MenuItem;
  isDashboard: boolean;
  onNavigate?: () => void;
  index: number;
} & Omit<React.ComponentPropsWithoutRef<typeof NavLink>, "to" | "children">>(
  ({ item, isDashboard, onNavigate, index, className, onClick, onMouseMove, style, ...props }, forwardedRef) => {
    const { ref, onMouseMove: onSpotlightMouseMove } = useSpotlight();

    const setRefs = (node: HTMLAnchorElement | null) => {
      ref.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
      onClick?.(event);
      if (!event.defaultPrevented) onNavigate?.();
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
            "sidebar-dashboard-active-v2 sidebar-link-hover group/link relative flex w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left text-[13px] transition-all duration-300 text-foreground font-semibold",
            className,
          )}
          activeClassName=""
          style={{ ...style, animationDelay: `${index * 50}ms` }}
          {...props}
        >
          {/* Conic-gradient animated border (via ::before in CSS) */}
          {/* Pulse ring around icon */}
          <span className="sidebar-pulse-ring" aria-hidden="true" />
          {/* Spotlight radial glow following cursor */}
          <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover/link:opacity-100 sidebar-spotlight" />
          {/* Shimmer sweep */}
          <span className="pointer-events-none absolute inset-0 rounded-lg sidebar-shimmer-sweep" />
          {/* Left active indicator (still here, brighter) */}
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)] sidebar-indicator z-10" />

          <item.icon className="relative z-10 ml-1 mr-2.5 h-[16px] w-[16px] shrink-0 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-all duration-300 group-hover/link:drop-shadow-[0_0_14px_hsl(var(--primary)/0.85)] group-hover/link:scale-110" />
          <span className="relative z-10 text-foreground transition-all duration-300 group-hover/link:tracking-wide">
            {item.title}
          </span>
          <ChevronRight className="relative z-10 ml-auto h-3 w-3 text-primary/60 transition-all duration-300 group-hover/link:translate-x-0.5 group-hover/link:text-primary" />
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

        <GlowIcon icon={item.icon} />
        <span className="relative z-10 transition-all duration-300 group-hover/link:translate-x-0.5">
          {item.title}
        </span>
      </NavLink>
    );
  },
);
SidebarLink.displayName = "SidebarLink";

function MenuGroup({ items, onNavigate, startIndex = 0 }: { items: MenuItem[]; onNavigate?: () => void; startIndex?: number }) {
  return (
    <SidebarMenu>
      {items.map((item, i) => {
        const isDashboard = item.url === "/app/dashboard";
        return (
          <SidebarMenuItem key={item.title} className="sidebar-item-enter">
            <SidebarMenuButton asChild>
              <SidebarLink
                item={item}
                isDashboard={isDashboard}
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

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export function AppSidebar() {
  const { user, profile, isAdmin } = useAuth();
  const { setOpenMobile } = useSidebar();

  const closeMobile = useCallback(() => setOpenMobile(false), [setOpenMobile]);

  const planName = isAdmin ? "Admin" : (planLabels[profile?.subscription_status] || "Basic");
  const displayName: string = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = getInitials(profile?.name, user?.email);

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarContent className="sidebar-premium px-1 sm:px-0">
        {/* Ambient orbs */}
        <div className="sidebar-orb sidebar-orb-1" aria-hidden="true" />
        <div className="sidebar-orb sidebar-orb-2" aria-hidden="true" />

        {/* Logo */}
        <div className="flex justify-center pt-6 pb-4 sidebar-item-enter relative z-10" style={{ animationDelay: '0ms' }}>
          <div className="sidebar-logo-wrap">
            <span className="sidebar-logo-glow" aria-hidden="true" />
            <img src={logoIronmines} alt="IronMines" className="h-20 w-auto" />
          </div>
        </div>

        <SidebarGroup className="px-3 sm:px-2 relative z-10">
          <SidebarGroupContent>
            {/* Análise group */}
            <GroupLabel>Análise Viral</GroupLabel>
            <MenuGroup items={groupAnalise} onNavigate={closeMobile} startIndex={1} />

            <SidebarDivider />

            {/* IA group */}
            <GroupLabel>Ferramentas IA</GroupLabel>
            <MenuGroup items={groupIA} onNavigate={closeMobile} startIndex={6} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer pushes account card to bottom */}
        <div className="flex-1" />

        {/* Premium Account Card at bottom */}
        <div className="relative z-10 sidebar-item-enter" style={{ animationDelay: '500ms' }}>
          <NavLink
            to="/app/configuracoes"
            onClick={closeMobile}
            className="sidebar-account-card group/acc"
            activeClassName="ring-1 ring-primary/40"
          >
            <div className="sidebar-account-avatar">
              {initials}
              <span className="sidebar-account-status" aria-hidden="true" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="sidebar-account-name" title={displayName}>{displayName}</span>
              <span className="sidebar-account-plan">{planName}</span>
            </div>
            <Settings className="sidebar-account-gear h-4 w-4" />
          </NavLink>
        </div>

        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
          {SIDEBAR_PARTICLES.map((p, i) => (
            <span key={i} className="sidebar-particle" style={p} />
          ))}
        </div>

        {/* Bottom ambient glow */}
        <div className="sidebar-bottom-glow" aria-hidden="true" />
      </SidebarContent>
    </Sidebar>
  );
}
