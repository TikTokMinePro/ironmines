import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CreditCard, ExternalLink, Shield, CheckCircle2, Link2, Loader2, Save, Pencil, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CHECKOUT_KEYS = {
  "1mes": "checkout_url_1m",
  "3meses": "checkout_url_3m",
  "6meses": "checkout_url_6m",
} as const;

type PlanConfig = {
  name: string;
  price_cents: number;
  duration_months: number;
  discount_label: string;
  popular: boolean;
};

type PlansConfig = Record<string, PlanConfig>;

const DEFAULT_PLANS: PlansConfig = {
  "1mes": { name: "1 Mês", price_cents: 6990, duration_months: 1, discount_label: "", popular: false },
  "3meses": { name: "3 Meses", price_cents: 18990, duration_months: 3, discount_label: "9% OFF", popular: true },
  "6meses": { name: "6 Meses", price_cents: 39990, duration_months: 6, discount_label: "4% OFF", popular: false },
};

import { fmtCents as fmtBRL } from "@/lib/formatters";

export default function AdminPaymentGateway() {
  const [config, setConfig] = useState({
    apiUrl: "https://api.ironpayapp.com.br/",
    checkoutEnabled: true,
  });

  const [checkoutUrls, setCheckoutUrls] = useState({
    "1mes": "",
    "3meses": "",
    "6meses": "",
  });

  const [plansConfig, setPlansConfig] = useState<PlansConfig>(DEFAULT_PLANS);
  const [editingPlans, setEditingPlans] = useState(false);
  const [savingPlans, setSavingPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [...Object.values(CHECKOUT_KEYS), "plan_config"]);

      if (data) {
        const urls = { ...checkoutUrls };
        data.forEach((row) => {
          if (row.key === "plan_config") {
            try {
              const parsed = JSON.parse(row.value);
              setPlansConfig(parsed);
            } catch { /* keep defaults */ }
          } else {
            const entry = Object.entries(CHECKOUT_KEYS).find(([, v]) => v === row.key);
            if (entry) urls[entry[0] as keyof typeof urls] = row.value;
          }
        });
        setCheckoutUrls(urls);
      }
    } catch {
      console.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const saveCheckoutUrls = async () => {
    setSaving(true);
    try {
      for (const [planKey, settingKey] of Object.entries(CHECKOUT_KEYS)) {
        const url = checkoutUrls[planKey as keyof typeof checkoutUrls];
        await supabase
          .from("app_settings")
          .upsert({ key: settingKey, value: url || "" }, { onConflict: "key" });
      }
      toast.success("URLs de checkout salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar URLs de checkout");
    } finally {
      setSaving(false);
    }
  };

  const savePlansConfig = async () => {
    setSavingPlans(true);
    try {
      await supabase
        .from("app_settings")
        .upsert({ key: "plan_config", value: JSON.stringify(plansConfig) }, { onConflict: "key" });
      toast.success("Planos atualizados com sucesso! As alterações já estão visíveis para os usuários.");
      setEditingPlans(false);
    } catch {
      toast.error("Erro ao salvar planos");
    } finally {
      setSavingPlans(false);
    }
  };

  const updatePlan = (key: string, field: keyof PlanConfig, value: any) => {
    setPlansConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const planKeys = ["1mes", "3meses", "6meses"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-primary" />
      <div className="page-hero flex items-center justify-between mb-6">
        <div className="relative z-10">
          <span className="chip-premium mb-2 inline-flex">Financeiro</span>
          <h1 className="type-hero">
            <span className="text-foreground/90">Gateway de </span>
            <span className="page-title-gradient">Pagamento</span>
          </h1>
        </div>
      </div>
      </div>

      {/* Gateway Config */}
      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">IronPay - Configuração</h2>
            <Badge variant="outline" className="text-success"><CheckCircle2 className="w-3 h-3 mr-1" />Conectado</Badge>
          </div>

          <div className="space-y-2">
            <Label>URL da API</Label>
            <Input value={config.apiUrl} onChange={e => setConfig(c => ({ ...c, apiUrl: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Bearer Token</Label>
            <Input type="password" placeholder="Gerenciado via Banco de Dados (IRONPAY_TOKEN)" disabled className="bg-muted" />
            <p className="type-overline text-muted-foreground mt-0.5">Configure em Banco de Dados → Edge Functions → Secrets</p>
          </div>

          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input type="password" placeholder="Gerenciado via Banco de Dados" disabled className="bg-muted" />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={config.checkoutEnabled} onCheckedChange={v => setConfig(c => ({ ...c, checkoutEnabled: v }))} />
            <Label>Checkout ativo</Label>
          </div>

          <div className="flex gap-2">
            <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Configurações salvas!")}>Salvar Configurações</Button>
            <Button variant="outline" asChild>
              <a href="https://app.ironpayapp.com.br" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Dashboard IronPay
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checkout URLs */}
      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">URLs de Checkout (IronPay)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Cole aqui os links de checkout gerados na dashboard IronPay. Cada link deve corresponder ao plano configurado lá.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="space-y-4">
              {planKeys.map((key) => {
                const plan = plansConfig[key];
                if (!plan) return null;
                return (
                  <div key={key} className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      {plan.name} ({plan.duration_months} {plan.duration_months === 1 ? "mês" : "meses"}) — {fmtBRL(plan.price_cents)}
                      {plan.discount_label && <Badge variant="secondary" className="text-xs">{plan.discount_label}</Badge>}
                    </Label>
                    <Input
                      placeholder={`https://pay.ironpayapp.com.br/checkout/...`}
                      value={checkoutUrls[key as keyof typeof checkoutUrls]}
                      onChange={(e) => setCheckoutUrls(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                );
              })}

              <Button
                className="gradient-primary text-primary-foreground"
                onClick={saveCheckoutUrls}
                disabled={saving}
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</> : "Salvar URLs de Checkout"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editable Plans Config */}
      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Planos Configurados</h2>
            {!editingPlans ? (
              <Button variant="outline" size="sm" onClick={() => setEditingPlans(true)} className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editar Planos
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditingPlans(false); loadAll(); }}>
                  Cancelar
                </Button>
                <Button size="sm" className="gradient-primary text-primary-foreground gap-1.5" onClick={savePlansConfig} disabled={savingPlans}>
                  {savingPlans ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar Planos
                </Button>
              </div>
            )}
          </div>

          {editingPlans ? (
            <div className="space-y-6">
              {planKeys.map((key) => {
                const plan = plansConfig[key];
                if (!plan) return null;
                return (
                  <Card key={key} className="border border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{key}</h3>
                        <div className="flex items-center gap-2">
                          <Label className="type-overline text-muted-foreground mt-0.5">Popular</Label>
                          <Switch
                            checked={plan.popular}
                            onCheckedChange={(v) => updatePlan(key, "popular", v)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome do plano</Label>
                          <Input
                            value={plan.name}
                            onChange={(e) => updatePlan(key, "name", e.target.value)}
                            placeholder="Ex: 1 Mês"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Preço (centavos)</Label>
                          <Input
                            type="number"
                            value={plan.price_cents}
                            onChange={(e) => updatePlan(key, "price_cents", Number(e.target.value))}
                            min={0}
                          />
                          <p className="text-[10px] text-muted-foreground">{fmtBRL(plan.price_cents)}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duração (meses)</Label>
                          <Input
                            type="number"
                            value={plan.duration_months}
                            onChange={(e) => updatePlan(key, "duration_months", Number(e.target.value))}
                            min={1}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Badge de desconto</Label>
                          <Input
                            value={plan.discount_label}
                            onChange={(e) => updatePlan(key, "discount_label", e.target.value)}
                            placeholder="Ex: 9% OFF"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <p className="type-overline text-muted-foreground mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> As alterações serão aplicadas imediatamente na página de planos visível para os usuários.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {planKeys.map(key => {
                const plan = plansConfig[key];
                if (!plan) return null;
                return (
                  <Card key={key} className={`border border-border/50 ${plan.popular ? "border-primary" : ""}`}>
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      <p className="type-stat-lg text-primary mt-2">{fmtBRL(plan.price_cents)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{plan.duration_months} {plan.duration_months === 1 ? "mês" : "meses"}</p>
                      {plan.discount_label && <Badge variant="secondary" className="mt-2 text-xs">{plan.discount_label} desconto</Badge>}
                      {plan.popular && <Badge className="mt-2 text-xs gradient-primary text-primary-foreground ml-1">Popular</Badge>}
                      {checkoutUrls[key as keyof typeof checkoutUrls] && (
                        <Badge variant="outline" className="mt-2 text-success text-xs block w-fit mx-auto"><CheckCircle2 className="w-3 h-3 mr-1" />URL configurada</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Info */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Webhook</h2>
          </div>
          <div className="space-y-2">
            <div>
              <Label className="type-overline text-muted-foreground mt-0.5">URL do Webhook</Label>
              <Input value={`https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/ironpay-webhook`} readOnly className="font-mono text-xs bg-muted" />
            </div>
            <p className="type-overline text-muted-foreground mt-0.5">Configure esta URL no painel IronPay para receber notificações de pagamento.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}