import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ticket, Plus, Trash2, Copy } from "lucide-react";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "IRON";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    code: generateCode(),
    discount_percent: 10,
    max_uses: "",
    description: "",
    valid_until: "",
  });

  const { data: coupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createCoupon = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase().trim(),
        discount_percent: form.discount_percent,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        description: form.description || null,
        valid_until: form.valid_until || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cupom criado!");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setCreateOpen(false);
      setForm({ code: generateCode(), discount_percent: 10, max_uses: "", description: "", valid_until: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleCoupon = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ is_active: active } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    toast.success("Cupom excluído");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Cupons de Desconto</h1>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Novo Cupom
        </Button>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons?.map((c: any) => {
                const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
                const isMaxed = c.max_uses && c.uses_count >= c.max_uses;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-primary text-sm">{c.code}</code>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyCode(c.code)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/15 text-primary border-0 font-bold">{c.discount_percent}%</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.uses_count}{c.max_uses ? `/${c.max_uses}` : " / ∞"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{c.description || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {c.valid_until ? (
                        <span className={isExpired ? "text-destructive" : ""}>
                          {new Date(c.valid_until).toLocaleDateString("pt-BR")}
                          {isExpired && " (expirado)"}
                        </span>
                      ) : "Sem limite"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={c.is_active && !isExpired && !isMaxed} onCheckedChange={v => toggleCoupon(c.id, v)} disabled={!!isExpired || !!isMaxed} />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteCoupon(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!coupons || coupons.length === 0) && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum cupom criado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader><DialogTitle>Criar Cupom de Desconto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código do Cupom</Label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="font-mono" />
                <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, code: generateCode() }))}>Gerar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Desconto (%)</Label>
              <Input type="number" min={1} max={100} value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Máximo de Usos (vazio = ilimitado)</Label>
              <Input type="number" min={1} value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Ilimitado" />
            </div>
            <div className="space-y-2">
              <Label>Válido até (opcional)</Label>
              <Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Promoção de lançamento" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => createCoupon.mutate()} disabled={!form.code || !form.discount_percent}>
                Criar Cupom
              </Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}