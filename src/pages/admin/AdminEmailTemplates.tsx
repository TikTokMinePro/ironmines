import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Edit, Eye, Send, Settings2 } from "lucide-react";

export default function AdminEmailTemplates() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [previewing, setPreviewing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", subject: "", body_html: "", description: "" });
  const [senderModalOpen, setSenderModalOpen] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const [savingSender, setSavingSender] = useState(false);

  const { data: senderSetting } = useQuery({
    queryKey: ["app-settings", "resend_from_email"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "resend_from_email").single();
      return data?.value || "";
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("email_templates").select("*").order("slug");
      return data || [];
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("email_templates").update({
        name: form.name,
        subject: form.subject,
        body_html: form.body_html,
        description: form.description,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template atualizado!");
      qc.invalidateQueries({ queryKey: ["admin-email-templates"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleTemplate = async (id: string, active: boolean) => {
    await supabase.from("email_templates").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-email-templates"] });
  };

  const sendTestEmail = async (slug: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-notification-email", {
        body: { template_slug: slug, test: true },
      });
      if (error) throw error;
      toast.success("Email de teste enviado para o admin!");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  const openEdit = (t: any) => {
    setForm({ name: t.name, subject: t.subject, body_html: t.body_html, description: t.description || "" });
    setEditing(t);
  };

  const VARIABLES_HELP: Record<string, string[]> = {
    welcome_credentials: ["{{name}}", "{{email}}", "{{password}}", "{{login_url}}"],
    renewal_discount: ["{{name}}", "{{days_left}}", "{{renewal_url}}"],
    expiring_warning: ["{{name}}", "{{days_left}}", "{{renewal_url}}"],
    subscription_expired: ["{{name}}", "{{renewal_url}}"],
    subscription_cancelled: ["{{name}}", "{{expires_at}}", "{{renewal_url}}"],
    password_reset: ["{{name}}", "{{reset_url}}"],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-6 h-6 text-primary" />
      <div className="page-hero flex items-center justify-between mb-6">
        <div className="relative z-10">
          <span className="chip-premium mb-2 inline-flex">Comunicação</span>
          <h1 className="type-hero">
            <span className="text-foreground/90">Modelos de </span>
            <span className="page-title-gradient">Mensagens</span>
          </h1>
        </div>
      </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gerencie os templates de emails automáticos enviados aos usuários. Use variáveis como {"{{name}}"} nos templates.
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { setSenderEmail(senderSetting || ""); setSenderModalOpen(true); }}>
          <Settings2 className="w-4 h-4" /> Remetente
        </Button>
      </div>

      {senderSetting && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Mail className="w-3 h-3" /> Remetente atual: <span className="font-mono text-foreground">{senderSetting}</span>
        </div>
      )}

      <div className="grid gap-4">
        {templates?.map((t: any) => (
          <Card key={t.id} className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{t.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{t.slug}</Badge>
                    {!t.is_active && <Badge variant="destructive" className="text-[10px]">Desativado</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Assunto: {t.subject}</p>
                  {t.description && <p className="type-overline text-muted-foreground mt-0.5">{t.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {VARIABLES_HELP[t.slug]?.map(v => (
                      <Badge key={v} variant="secondary" className="text-[10px] font-mono">{v}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={t.is_active} onCheckedChange={v => toggleTemplate(t.id, v)} />
                  <Button size="sm" variant="outline" onClick={() => setPreviewing(t)}><Eye className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Edit className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => sendTestEmail(t.slug)}><Send className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="glass-strong max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Template: {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Assunto do Email</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Corpo do Email (HTML)</Label>
              <Textarea value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))} rows={12} className="font-mono text-xs" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => updateTemplate.mutate()}>Salvar</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewing} onOpenChange={() => setPreviewing(null)}>
        <DialogContent className="glass-strong max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview: {previewing?.name}</DialogTitle></DialogHeader>
          <div className="bg-white rounded-lg p-6 text-black" dangerouslySetInnerHTML={{ __html: previewing?.body_html || "" }} />
        </DialogContent>
      </Dialog>

      {/* Sender Email Modal */}
      <Dialog open={senderModalOpen} onOpenChange={setSenderModalOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader><DialogTitle>Configurar Email Remetente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure o email profissional com domínio próprio que será usado como remetente nos envios via Resend.
            </p>
            <div className="space-y-2">
              <Label>Email Remetente</Label>
              <Input
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                placeholder="Nome <email@seudominio.com>"
              />
              <p className="type-overline text-muted-foreground mt-0.5">Formato: Nome {"<email@dominio.com>"} — Ex: IronMines {"<no-reply@ironmines.com>"}</p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                disabled={savingSender || !senderEmail.trim()}
                onClick={async () => {
                  setSavingSender(true);
                  const { error } = await supabase.from("app_settings" as any).upsert({ key: "resend_from_email", value: senderEmail.trim(), updated_at: new Date().toISOString() } as any);
                  if (error) toast.error(error.message);
                  else {
                    toast.success("Remetente atualizado!");
                    qc.invalidateQueries({ queryKey: ["app-settings", "resend_from_email"] });
                    setSenderModalOpen(false);
                  }
                  setSavingSender(false);
                }}
              >
                {savingSender ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setSenderModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
