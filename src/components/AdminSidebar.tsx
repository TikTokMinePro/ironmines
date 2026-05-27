import React, { useCallback, useRef } from "react";
import {
  Users, Database, Sparkles, Activity, Wand2, CreditCard,
  Mail, BarChart3, Receipt, Shield, Ticket, Stethoscope, ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type MenuItem = { title: string; url: string; icon: React.ElementType };

const sections: { label: string; items: MenuItem[] }[] = [
  {
    label: "Gestão",
    items: [
      { title: "Usuários",      url: "/admin/usuarios",    icon: Users    },
      { title: "Assinaturas",   url: "/admin/assinaturas", icon: Receipt  },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Vendas & Faturamento", url: "/admin/vendas",   icon: BarChart3  },
      { title: "Gateway Pagamento",    url: "/admin/gateway",  icon: CreditCard },
      { title: "Cupons de Desconto",   url: "/admin/cupons",   icon: Ticket     },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { title: "Modelos de Email", url: "/admin/emails", icon: Mail },
    ],
  },
  {
    label: "Mineração & IA",
    items: [
      { title: "Dados & Mineração", url: "/admin/dados",        icon: Database     },
      { title: "Monitor APIs",      url: "/admin/monitor-apis", icon: Activity     },
      { title: "Influencer IA",     url: "/admin/influencer",   icon: Wand2        },
      { title: "IA & Criativos",    url: "/admin/ia",           icon: Sparkles     },
      { title: "Diagnóstico IA",    url: "/admin/diagnosticos", icon: Stethoscope  },
    ],
  },
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

/* ── Spotlight hook ── */
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

/* ── Single nav link ── */
function AdminNavLink({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  const { ref, onMouseMove } = useSpotlight();

  return (
    <NavLink
      ref={ref}
      to={item.url}
      onMouseMove={onMouseMove}
      onClick={() => onNavigate?.()}
      className="sidebar-link-hover group/link relative flex w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left text-sidebar-foreground/70 transition-all duration-300 hover:text-sidebar-foreground"
      activeClassName="sidebar-item-active"
    >
      {/* Spotlight radial glow */}
      <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover/link:opacity-100 sidebar-spotlight" />
      {/* Shimmer sweep */}
      <span className="pointer-events-none absolute inset-0 rounded-lg sidebar-shimmer-sweep" />
      {/* Active left bar */}
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-all duration-300 group-[.sidebar-item-active]/link:h-5 z-10" />
      {/* Active bg */}
      <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-[.sidebar-item-active]/link:opacity-100 bg-gradient-to-r from-primary/12 via-primary/6 to-transparent" />

      {/* Icon */}
      <span className="sidebar-icon-tint relative z-10 shrink-0 flex items-center justify-center w-7 h-7 rounded-[8px] bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent border border-white/[0.06] shadow-[0_1px_4px_rgba(255,255,255,0.04)] backdrop-blur-sm transition-all duration-300 group-hover/link:border-white/[0.18] group-hover/link:shadow-[0_2px_10px_hsl(var(--primary)/0.15)] mr-0.5">
        <item.icon className="h-[15px] w-[15px] text-white/55 transition-all duration-300 group-[.sidebar-item-active]/link:text-primary group-[.sidebar-item-active]/link:drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)] group-hover/link:text-white/85 group-hover/link:scale-110" />
      </span>

      <span className="relative z-10 transition-all duration-300 group-[.sidebar-item-active]/link:text-foreground group-[.sidebar-item-active]/link:font-semibold group-hover/link:translate-x-0.5">
        {item.title}
      </span>

      <ChevronRight className="relative z-10 ml-auto h-3 w-3 text-muted-foreground/20 opacity-0 transition-all duration-300 group-[.sidebar-item-active]/link:opacity-100 group-[.sidebar-item-active]/link:text-primary/60 group-hover/link:opacity-100 group-hover/link:translate-x-0.5" />
    </NavLink>
  );
}

// Static particles — generated once
const ADMIN_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  left:              `${10 + (i * 9) % 80}%`,
  animationDelay:    `${i * 0.8}s`,
  animationDuration: `${7 + (i % 4) * 1.5}s`,
  width:             `${2 + (i % 2)}px`,
  height:            `${2 + (i % 2)}px`,
  opacity:           0.12 + (i % 3) * 0.06,
}));

export function AdminSidebar() {
  const { setOpenMobile } = useSidebar();
  const closeMobile = useCallback(() => setOpenMobile(false), [setOpenMobile]);

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarContent className="sidebar-premium px-1 sm:px-0">
        {/* Ambient orbs */}
        <div className="sidebar-orb sidebar-orb-1" aria-hidden="true" />
        <div className="sidebar-orb sidebar-orb-2" aria-hidden="true" />

        {/* Admin badge header */}
        <div className="flex items-center gap-2.5 px-4 pt-6 pb-3 sidebar-item-enter relative z-10">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 shadow-[0_0_14px_-2px_hsl(var(--primary)/0.4)]">
            <Shield className="w-4 h-4 text-primary relative z-10" />
            <span className="absolute inset-0 rounded-lg bg-primary/5 animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <p className="sidebar-account-name text-foreground/90">Admin Panel</p>
            <p className="sidebar-account-plan text-primary/70">IronMines</p>
          </div>
        </div>

        {/* Nav sections */}
        <SidebarGroup className="px-3 sm:px-2 relative z-10 flex-1">
          <SidebarGroupContent>
            {sections.map((section, idx) => (
              <React.Fragment key={section.label}>
                <GroupLabel>{section.label}</GroupLabel>
                <SidebarMenu>
                  {section.items.map((item, i) => (
                    <SidebarMenuItem
                      key={item.title}
                      className="sidebar-item-enter"
                      style={{ animationDelay: `${(idx * 10 + i) * 45}ms` } as React.CSSProperties}
                    >
                      <SidebarMenuButton asChild>
                        <AdminNavLink item={item} onNavigate={closeMobile} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
                {idx < sections.length - 1 && <SidebarDivider />}
              </React.Fragment>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
          {ADMIN_PARTICLES.map((p, i) => (
            <span key={i} className="sidebar-particle" style={p} />
          ))}
        </div>

        {/* Bottom ambient glow */}
        <div className="sidebar-bottom-glow" aria-hidden="true" />
      </SidebarContent>
    </Sidebar>
  );
}
