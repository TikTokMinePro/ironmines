import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Upload, Image, Home, Building2, Sun, Dumbbell, UtensilsCrossed, MoreHorizontal, Pencil, CheckCircle, X } from "lucide-react";

const fixedScenarios = [
  { key: "casa", name: "Casa", icon: Home, matchTerms: ["quarto", "casa", "sala"] },
  { key: "estudio", name: "Estúdio", icon: Building2, matchTerms: ["estúdio", "estudio", "studio", "clean", "neutro", "minimalista"] },
  { key: "ar-livre", name: "Ar livre", icon: Sun, matchTerms: ["praia", "parque", "jardim", "piscina", "varanda", "ar livre", "urbano", "rua"] },
  { key: "academia", name: "Academia", icon: Dumbbell, matchTerms: ["academia", "fitness", "gym"] },
  { key: "cozinha", name: "Cozinha", icon: UtensilsCrossed, matchTerms: ["cozinha", "gourmet", "café", "cafe"] },
  { key: "outros", name: "Outros", icon: MoreHorizontal, matchTerms: ["loja", "escritório", "escritorio", "trendy"] },
];

interface Props {
  scenarios: any[];
  selected: any;
  onSelect: (s: any) => void;
  customText: string;
  onCustomTextChange: (v: string) => void;
  customScenarioUrl?: string | null;
  onSceneUpload?: (file: File) => void;
  onClearCustomScene?: () => void;
}

export function SectionScene({ scenarios, selected, onSelect, customText, onCustomTextChange, customScenarioUrl, onSceneUpload, onClearCustomScene }: Props) {
  const [tab, setTab] = useState<"prontos" | "upload">("prontos");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDbScenario = (fixed: typeof fixedScenarios[0]) => {
    for (const term of fixed.matchTerms) {
      const match = scenarios.find((s: any) =>
        s.name.toLowerCase().includes(term.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  };

  const handleSelect = (fixed: typeof fixedScenarios[0]) => {
    const dbMatch = getDbScenario(fixed);
    if (dbMatch) {
      onSelect(dbMatch);
    } else {
      onSelect({ id: null, name: fixed.name, prompt_modifier: fixed.name.toLowerCase() });
    }
  };

  const isActive = (fixed: typeof fixedScenarios[0]) => {
    if (customScenarioUrl) return false;
    if (!selected) return false;
    const dbMatch = getDbScenario(fixed);
    if (dbMatch) return selected.id === dbMatch.id;
    return selected.id === null && selected.name === fixed.name;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSceneUpload) {
      onSceneUpload(file);
    }
    if (e.target) e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">AMBIENTE</p>

      {/* Tabs */}
      <div className="flex rounded-lg border border-border/50 overflow-hidden">
        <button
          onClick={() => setTab("prontos")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            tab === "prontos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Image className="w-3.5 h-3.5" /> Prontos
        </button>
        <button
          onClick={() => setTab("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            tab === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* Custom scene indicator */}
      {customScenarioUrl && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <img src={customScenarioUrl} alt="Cenário personalizado" className="w-10 h-10 rounded-lg object-cover" />
          <div className="flex-1">
            <p className="text-[10px] text-primary font-medium">✓ Selecionado</p>
            <p className="text-sm font-semibold text-foreground">Cenário Personalizado</p>
          </div>
          {onClearCustomScene && (
            <button onClick={onClearCustomScene} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {tab === "prontos" ? (
        <div className="grid grid-cols-3 gap-2.5">
          {fixedScenarios.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleSelect(item)}
                className={`group flex flex-col items-center justify-center gap-2 rounded-xl border py-4 px-2 cursor-pointer transition-all duration-200 ${
                  active
                    ? "border-primary bg-primary/10 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.4)]"
                    : "border-border/40 bg-card hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  }`}
                />
                <span
                  className={`text-[11px] font-medium transition-colors duration-200 ${
                    active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {customScenarioUrl ? (
            <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col items-center gap-3">
              <img src={customScenarioUrl} alt="Cenário personalizado" className="w-full h-32 rounded-lg object-cover border border-primary/20" />
              <div className="flex items-center gap-1.5 text-primary">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Cenário carregado</span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Trocar imagem
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border/40 rounded-xl p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Clique para enviar cenário</p>
              <p className="text-[10px] text-muted-foreground/60">PNG, JPG ou WEBP • Máx. 5MB</p>
            </button>
          )}
        </div>
      )}

      {/* Custom scenario text */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Pencil className="w-3 h-3" /> Cenário personalizado (opcional)</p>
        <Input
          value={customText}
          onChange={e => onCustomTextChange(e.target.value)}
          placeholder="Ex: Quarto minimalista com luz natural..."
          className="text-xs"
        />
      </div>
    </div>
  );
}
