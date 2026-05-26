import React from "react";
import { Users, Database, Image, Sliders, Sparkles, Activity, Wand2, CreditCard, Mail, BarChart3, Receipt, Shield, Ticket, Stethoscope } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const sections = [
  {
    label: "Gestão",
    items: [
      { title: "Usuários", url: "/admin/usuarios", icon: Users },
      { title: "Assinaturas", url: "/admin/assinaturas", icon: Receipt },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Vendas & Faturamento", url: "/admin/vendas", icon: BarChart3 },
      { title: "Gateway Pagamento", url: "/admin/gateway", icon: CreditCard },
      { title: "Cupons de Desconto", url: "/admin/cupons", icon: Ticket },
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
      { title: "Dados & Mineração", url: "/admin/dados", icon: Database },
      { title: "Monitor APIs", url: "/admin/monitor-apis", icon: Activity },
      { title: "Influencer IA", url: "/admin/influencer", icon: Wand2 },
      { title: "IA & Criativos", url: "/admin/ia", icon: Sparkles },
      { title: "Diagnóstico IA", url: "/admin/diagnosticos", icon: Stethoscope },
    ],
  },
];

function SidebarDivider() {
  return (
    <div className="mx-3 my-0.5">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
    </div>
  );
}

export function AdminSidebar() {
  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarContent className="sidebar-premium">
        {/* Admin badge */}
        <div className="px-4 pt-5 pb-1">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Shield className="w-4 h-4 text-primary" />
              <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary/80">
              Admin Panel
            </span>
          </div>
        </div>

        {sections.map((section, idx) => (
          <React.Fragment key={section.label}>
            <SidebarGroup className="px-2 py-0.5">
              <div className="px-1 pb-0">
                <span className="text-[9px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/35">
                  {section.label}
                </span>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className="group/link relative overflow-hidden rounded-lg text-[13px] text-sidebar-foreground/70 transition-all duration-300 hover:text-sidebar-foreground hover:bg-primary/8"
                          activeClassName="sidebar-item-active"
                        >
                          <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-[.sidebar-item-active]/link:opacity-100 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent" />
                          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-all duration-300 group-[.sidebar-item-active]/link:h-5" />
                          <item.icon className="relative z-10 mr-2 h-[15px] w-[15px] shrink-0 transition-all duration-300 group-[.sidebar-item-active]/link:text-primary group-[.sidebar-item-active]/link:drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                          <span className="relative z-10 transition-all duration-300 group-[.sidebar-item-active]/link:text-foreground group-[.sidebar-item-active]/link:font-semibold">
                            {item.title}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {idx < sections.length - 1 && <SidebarDivider />}
          </React.Fragment>
        ))}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/[0.03] to-transparent" />
      </SidebarContent>
    </Sidebar>
  );
}
