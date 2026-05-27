import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Users, Camera, MapPin, BarChart3, Sparkles, Sliders } from "lucide-react";

export default function AdminInfluencer() {
  const qc = useQueryClient();

  const { data: avatars } = useQuery({
    queryKey: ["admin-avatars"],
    queryFn: async () => {
      const { data } = await supabase.from("avatars").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: poses } = useQuery({
    queryKey: ["admin-poses"],
    queryFn: async () => {
      const { data } = await supabase.from("poses").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: scenarios } = useQuery({
    queryKey: ["admin-scenarios"],
    queryFn: async () => {
      const { data } = await supabase.from("scenarios").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: presets } = useQuery({
    queryKey: ["admin-presets"],
    queryFn: async () => {
      const { data } = await supabase.from("presets").select("*").order("type", { ascending: true }).order("label", { ascending: true });
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-creative-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count: todayCount } = await supabase.from("user_creatives").select("*", { count: "exact", head: true }).gte("generated_at", today);
      const { count: totalCount } = await supabase.from("user_creatives").select("*", { count: "exact", head: true });
      return { today: todayCount || 0, total: totalCount || 0 };
    },
  });

  const toggleActive = async (table: string, id: string, active: boolean) => {
    await supabase.from(table as any).update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: [`admin-${table}`] });
    toast.success("Atualizado!");
  };

  const formatPresets = presets?.filter(p => p.type === "format") || [];
  const posePresets = presets?.filter(p => p.type === "pose") || [];
  const environmentPresets = presets?.filter(p => p.type === "environment") || [];

  return (
    <div className="space-y-6">
      <div className="page-hero flex items-center justify-between mb-6">
        <div className="relative z-10">
          <span className="chip-premium mb-2 inline-flex">IA</span>
          <h1 className="type-hero">
            <span className="text-foreground/90">Influencer IA — </span>
            <span className="page-title-gradient">Admin</span>
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Criativos Hoje" value={stats?.today || 0} />
        <StatCard icon={BarChart3} label="Total Criativos" value={stats?.total || 0} />
        <StatCard icon={Users} label="Avatares Ativos" value={avatars?.filter((a: any) => a.is_active).length || 0} />
        <StatCard icon={Camera} label="Poses Ativas" value={poses?.filter((p: any) => p.is_active).length || 0} />
      </div>

      <Tabs defaultValue="avatars">
        <TabsList className="glass">
          <TabsTrigger value="avatars"><Users className="w-4 h-4 mr-2" /> Avatares</TabsTrigger>
          <TabsTrigger value="poses"><Camera className="w-4 h-4 mr-2" /> Poses</TabsTrigger>
          <TabsTrigger value="scenarios"><MapPin className="w-4 h-4 mr-2" /> Cenários</TabsTrigger>
          <TabsTrigger value="presets"><Sliders className="w-4 h-4 mr-2" /> Presets</TabsTrigger>
        </TabsList>

        <TabsContent value="avatars" className="mt-4">
          <AdminAvatarSection avatars={avatars || []} onToggle={(id, v) => toggleActive("avatars", id, v)} qc={qc} />
        </TabsContent>
        <TabsContent value="poses" className="mt-4">
          <AdminPoseSection poses={poses || []} onToggle={(id, v) => toggleActive("poses", id, v)} qc={qc} />
        </TabsContent>
        <TabsContent value="scenarios" className="mt-4">
          <AdminScenarioSection scenarios={scenarios || []} onToggle={(id, v) => toggleActive("scenarios", id, v)} qc={qc} />
        </TabsContent>
        <TabsContent value="presets" className="mt-4">
          <AdminPresetsSection presets={presets || []} onToggle={(id, v) => toggleActive("presets", id, v)} qc={qc} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="glass">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="type-stat-lg text-foreground">{value}</p>
          <p className="type-overline text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminAvatarSection({ avatars, onToggle, qc }: { avatars: any[]; onToggle: (id: string, v: boolean) => void; qc: any }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", image_url: "", gender: "", age_range: "", ethnicity: "", prompt_base: "", tags: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("avatars").insert({
        name: form.name, image_url: form.image_url, gender: form.gender || null,
        age_range: form.age_range || null, ethnicity: form.ethnicity || null,
        prompt_base: form.prompt_base || null,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Avatar criado!"); qc.invalidateQueries({ queryKey: ["admin-avatars"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Novo Avatar</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Novo Avatar</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Field label="Nome" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="URL Imagem" value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} />
              <Field label="Gênero (female/male)" value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} />
              <Field label="Faixa Etária" value={form.age_range} onChange={v => setForm(f => ({ ...f, age_range: v }))} />
              <Field label="Etnia" value={form.ethnicity} onChange={v => setForm(f => ({ ...f, ethnicity: v }))} />
              <Field label="Prompt Base" value={form.prompt_base} onChange={v => setForm(f => ({ ...f, prompt_base: v }))} placeholder="young brazilian woman, casual style" />
              <Field label="Tags (vírgula)" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="feminino, jovem, casual" />
              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => create.mutate()}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {avatars.map((a: any) => (
          <Card key={a.id} className="glass">
            <CardContent className="p-3">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
                <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground text-sm">{a.name}</p>
                <Switch checked={a.is_active} onCheckedChange={v => onToggle(a.id, v)} />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {a.gender && <Badge variant="outline" className="text-[10px]">{a.gender}</Badge>}
                {a.tags?.map((t: string) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
              </div>
              {a.wardrobe_defaults ? (
                <div className="mt-2 p-2 rounded-md bg-muted/50 space-y-0.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vestimenta</p>
                  <p className="text-[10px] text-foreground">{(a.wardrobe_defaults as any).style?.replace(/_/g, ' ')}</p>
                  {(a.wardrobe_defaults as any).colors && (
                    <div className="flex flex-wrap gap-0.5">
                      {(a.wardrobe_defaults as any).colors.map((c: string) => (
                        <Badge key={c} variant="secondary" className="text-[9px] px-1 py-0">{c.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-destructive mt-2">⚠ Sem vestimenta padrão</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminPoseSection({ poses, onToggle, qc }: { poses: any[]; onToggle: (id: string, v: boolean) => void; qc: any }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", prompt_modifier: "", category: "", image_url: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("poses").insert({ name: form.name, prompt_modifier: form.prompt_modifier, category: form.category || null, image_url: form.image_url || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pose criada!"); qc.invalidateQueries({ queryKey: ["admin-poses"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Nova Pose</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Nova Pose</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Nome" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="URL Imagem" value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} />
              <Field label="Prompt Modifier" value={form.prompt_modifier} onChange={v => setForm(f => ({ ...f, prompt_modifier: v }))} />
              <Field label="Categoria" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => create.mutate()}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {poses.map((p: any) => (
          <Card key={p.id} className="glass">
            <CardContent className="p-3">
              {p.image_url && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-2">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-foreground text-sm">{p.name}</p>
                <Switch checked={p.is_active} onCheckedChange={v => onToggle(p.id, v)} />
              </div>
              {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{p.prompt_modifier}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminScenarioSection({ scenarios, onToggle, qc }: { scenarios: any[]; onToggle: (id: string, v: boolean) => void; qc: any }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", prompt_modifier: "", image_url: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scenarios").insert({ name: form.name, prompt_modifier: form.prompt_modifier, image_url: form.image_url || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cenário criado!"); qc.invalidateQueries({ queryKey: ["admin-scenarios"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Novo Cenário</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Novo Cenário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Nome" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="URL Imagem" value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} />
              <Field label="Prompt Modifier" value={form.prompt_modifier} onChange={v => setForm(f => ({ ...f, prompt_modifier: v }))} />
              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => create.mutate()}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((s: any) => (
          <Card key={s.id} className="glass">
            <CardContent className="p-3">
              {s.image_url && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-2">
                  <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-foreground text-sm">{s.name}</p>
                <Switch checked={s.is_active} onCheckedChange={v => onToggle(s.id, v)} />
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{s.prompt_modifier}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminPresetsSection({ presets, onToggle, qc }: { presets: any[]; onToggle: (id: string, v: boolean) => void; qc: any }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", value: "", type: "pose" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("presets").insert(form as any);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Preset criado!"); qc.invalidateQueries({ queryKey: ["admin-presets"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = presets.reduce((acc: Record<string, any[]>, p) => {
    const key = p.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    pose: "Poses",
    environment: "Ambientes",
    format: "Formatos",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Novo Preset</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Novo Preset</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Label" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} />
              <Field label="Value" value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} />
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="format">Formato</option>
                  <option value="pose">Pose</option>
                  <option value="environment">Ambiente</option>
                </select>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => create.mutate()}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">{typeLabels[type] || type}</h3>
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(items as any[]).map((p: any) => (
              <Card key={p.id} className="glass">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground">{p.value}</p>
                  </div>
                  <Switch checked={p.is_active} onCheckedChange={v => onToggle(p.id, v)} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
