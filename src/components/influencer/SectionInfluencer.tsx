import { useState, useRef } from "react";
import { Users, Camera, Upload, X, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function ShimmerImage({ src, alt, className, fallbackText }: { src: string; alt: string; className?: string; fallbackText?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${className}`}>
        <span className="text-xs font-bold text-primary/60">{fallbackText || alt?.charAt(0) || "?"}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-[inherit]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] rounded-[inherit]" />
        </div>
      )}
      <img src={src} alt={alt} className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`} onLoad={() => setLoaded(true)} onError={() => setError(true)} />
    </div>
  );
}

interface Props {
  avatars: any[];
  selected: any;
  onSelect: (a: any) => void;
  customAvatarUrl?: string | null;
  onAvatarUpload?: (file: File) => void;
  onClearCustomAvatar?: () => void;
}

export function SectionInfluencer({ avatars, selected, onSelect, customAvatarUrl, onAvatarUpload, onClearCustomAvatar }: Props) {
  const [tab, setTab] = useState<"prontos" | "upload">("prontos");
  const [genderTab, setGenderTab] = useState<"female" | "male">("female");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = avatars.filter(a => !a.gender || a.gender === genderTab);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
    // Reset input so same file can be re-selected
    if (e.target) e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex rounded-lg border border-border/50 overflow-hidden">
        <button
          onClick={() => setTab("prontos")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            tab === "prontos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Avatares Prontos
        </button>
        <button
          onClick={() => setTab("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            tab === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* Selected avatar indicator */}
      {(selected || customAvatarUrl) && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          {customAvatarUrl ? (
            <img src={customAvatarUrl} alt="Custom avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <img src={selected.image_url} alt={selected.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div className="flex-1">
            <p className="text-[10px] text-primary font-medium">✓ Selecionado</p>
            <p className="text-sm font-semibold text-foreground">{customAvatarUrl ? "Avatar Personalizado" : selected?.name}</p>
          </div>
          {customAvatarUrl && onClearCustomAvatar && (
            <button onClick={onClearCustomAvatar} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {tab === "prontos" ? (
        <>
          {/* Gender tabs */}
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setGenderTab("female")}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                genderTab === "female" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              Mulheres
            </button>
            <button
              onClick={() => setGenderTab("male")}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                genderTab === "male" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              Homens
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {filtered.length === 0
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="w-full aspect-square rounded-full" />)
              : filtered.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all duration-300 ease-out active:scale-95 ${
                      selected?.id === a.id && !customAvatarUrl
                        ? "border-primary shadow-[0_0_20px_-2px_hsl(var(--primary)/0.6)] scale-105"
                        : "border-transparent group-hover:border-primary/50 group-hover:shadow-[0_0_16px_-4px_hsl(var(--primary)/0.4)] group-hover:scale-110"
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.06) 0%, transparent 60%, hsl(0 0% 0% / 0.15) 100%)',
                      boxShadow: selected?.id === a.id && !customAvatarUrl
                        ? '0 0 20px -2px hsl(var(--primary) / 0.6), inset 0 2px 4px hsl(0 0% 100% / 0.08)'
                        : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 2px hsl(0 0% 100% / 0.05)',
                    }}>
                      <ShimmerImage src={a.image_url} alt={a.name} fallbackText={a.name?.charAt(0)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/10 pointer-events-none" />
                      {selected?.id === a.id && !customAvatarUrl && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg animate-scale-in">
                            <span className="text-[9px] text-primary-foreground font-bold">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className={`text-[10px] font-medium truncate w-full text-center transition-all duration-300 ${
                      selected?.id === a.id && !customAvatarUrl ? "text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]" : "text-foreground group-hover:text-primary"
                    }`}>{a.name}</p>
                  </button>
                ))}
          </div>
        </>
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

          {customAvatarUrl ? (
            <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col items-center gap-3">
              <img src={customAvatarUrl} alt="Custom avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary/40" />
              <div className="flex items-center gap-1.5 text-primary">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Avatar carregado</span>
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
              <p className="text-xs text-muted-foreground">Clique para enviar sua foto</p>
              <p className="text-[10px] text-muted-foreground/60">PNG, JPG ou WEBP • Máx. 5MB</p>
            </button>
          )}

          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setGenderTab("female")}
              className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                genderTab === "female" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              👩 Feminino
            </button>
            <button
              onClick={() => setGenderTab("male")}
              className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                genderTab === "male" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              👨 Masculino
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">Isso define a voz e aparência nos prompts de vídeo</p>
        </div>
      )}
    </div>
  );
}
