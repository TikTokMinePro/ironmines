import { Textarea } from "@/components/ui/textarea";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Square, Pencil, Lightbulb } from "lucide-react";

const formatLabels: Record<string, string> = {
  vertical: "9:16",
  square: "1:1",
  portrait: "3:4",
  horizontal: "16:9",
};

function getIcon(name?: string | null): LucideIcon {
  if (!name) return Square;
  const pascal = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  return (icons as Record<string, LucideIcon>)[pascal] || Square;
}

interface Preset {
  id: string;
  value: string;
  label: string;
  icon_name?: string | null;
  prompt_modifier?: string | null;
}

interface Props {
  posePresets: Preset[];
  formatPresets: Preset[];
  selectedPose: string | null;
  onPoseSelect: (v: string) => void;
  selectedFormat: string;
  onFormatSelect: (v: string) => void;
  customPoseText: string;
  onCustomPoseTextChange: (v: string) => void;
  additionalInfo: string;
  onAdditionalInfoChange: (v: string) => void;
}

export function SectionAdjustments({
  posePresets,
  formatPresets,
  selectedPose,
  onPoseSelect,
  selectedFormat,
  onFormatSelect,
  customPoseText,
  onCustomPoseTextChange,
  additionalInfo,
  onAdditionalInfoChange,
}: Props) {
  const chipClass = (active: boolean) =>
    `flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-colors duration-150 ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border/40 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5"
    }`;

  return (
    <div className="space-y-4">
      {/* POSE */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          POSE
        </p>
        <div className="grid grid-cols-3 gap-2">
          {posePresets.map((p) => {
            const Icon = getIcon(p.icon_name);
            return (
              <button
                key={p.id}
                onClick={() => onPoseSelect(p.value)}
                className={chipClass(selectedPose === p.value)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{p.label}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Pose personalizada (opcional)
          </p>
          <Textarea
            value={customPoseText}
            onChange={(e) => onCustomPoseTextChange(e.target.value)}
            placeholder="Ex: Segurando o produto na altura do peito com as duas mãos"
            className="text-xs min-h-[50px] resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* FORMAT */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          FORMATO
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {formatPresets.map((p) => {
            const Icon = getIcon(p.icon_name);
            return (
              <button
                key={p.id}
                onClick={() => onFormatSelect(p.value)}
                className={chipClass(selectedFormat === p.value)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold">{p.label}</span>
                <span className="text-[8px] text-muted-foreground">
                  {formatLabels[p.value] || ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ADDITIONAL INFO */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Lightbulb className="w-3 h-3" /> Informações Adicionais (opcional)
        </p>
        <Textarea
          value={additionalInfo}
          onChange={(e) => onAdditionalInfoChange(e.target.value)}
          placeholder={
            "Ex: Sorriso natural, olhando para o produto\nEx: Luz do sol entrando pela janela\nEx: Fundo desfocado destacando o influencer"
          }
          className="text-xs min-h-[70px] resize-none"
          rows={3}
        />
        <p className="text-[9px] text-muted-foreground/60">
          Adicione instruções extras para personalizar a geração da imagem
        </p>
      </div>
    </div>
  );
}
