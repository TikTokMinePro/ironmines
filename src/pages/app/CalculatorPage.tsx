import { Card, CardContent } from "@/components/ui/card";
import { PageTransition, PageSection } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowRight, Calculator } from "lucide-react";
import { Link } from "react-router-dom";

export default function CalculatorPage() {
  const [accounts, setAccounts] = useState(3);
  const [videos, setVideos] = useState(5);
  const [ticket, setTicket] = useState(79.9);
  const [conversion, setConversion] = useState(2);
  const [days, setDays] = useState(30);

  const base = accounts * videos * days * ticket * (conversion / 100);
  const data = [
    { name: "Conservador", value: base * 0.5, fill: "hsl(var(--muted-foreground))" },
    { name: "Realista", value: base, fill: "hsl(var(--primary))" },
    { name: "Otimista", value: base * 2, fill: "hsl(var(--secondary))" },
  ];

  return (
    <PageTransition className="space-y-6 max-w-3xl mx-auto">
      <div className="page-hero">
        <div className="relative z-10 flex items-center gap-3">
          <div className="section-icon-box w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 flex items-center justify-center border border-primary/25 shadow-[0_2px_12px_rgba(0,224,0,0.25),0_0_22px_rgba(0,224,0,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
            <Calculator className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(0,224,0,0.6)] relative z-10" />
          </div>
          <div>
            <span className="chip-premium mb-1.5 inline-flex">Simulador</span>
            <h1 className="type-hero">
              <span className="text-foreground/90">Calculadora de </span>
              <span className="page-title-gradient">Ganhos</span>
            </h1>
            <p className="type-caption text-muted-foreground/80 mt-1.5">Projeção realista do seu potencial mensal</p>
          </div>
        </div>
      </div>

      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contas TikTok</Label>
              <Input type="number" value={accounts} onChange={e => setAccounts(Number(e.target.value))} min={1} />
            </div>
            <div className="space-y-2">
              <Label>Vídeos por dia</Label>
              <Input type="number" value={videos} onChange={e => setVideos(Number(e.target.value))} min={1} />
            </div>
            <div className="space-y-2">
              <Label>Ticket médio (R$)</Label>
              <Input type="number" value={ticket} onChange={e => setTicket(Number(e.target.value))} min={1} step={0.01} />
            </div>
            <div className="space-y-2">
              <Label>Taxa de conversão (%)</Label>
              <Input type="number" value={conversion} onChange={e => setConversion(Number(e.target.value))} min={0.1} step={0.1} />
            </div>
            <div className="space-y-2">
              <Label>Dias no mês</Label>
              <Input type="number" value={days} onChange={e => setDays(Number(e.target.value))} min={1} max={31} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {data.map(d => (
          <Card key={d.name} className="glass text-center">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{d.name}</p>
              <p className="text-xl font-bold text-foreground">
                R$ {d.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass">
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, "Receita"]}
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </PageTransition>
  );
}
