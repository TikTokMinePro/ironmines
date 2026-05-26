import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Upload, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function ShimmerImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 ${className}`}>
        <Globe className="w-6 h-6 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
      )}
      <img src={src} alt={alt} className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`} onLoad={() => setLoaded(true)} onError={() => setError(true)} />
    </div>
  );
}

interface Variant {
  id: string;
  variant_label: string;
  variant_image_url: string | null;
  is_default: boolean;
}

interface Props {
  products: any[];
  selected: any;
  onSelect: (p: any) => void;
  uploadedImage: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  productName: string;
  onProductNameChange: (v: string) => void;
  variants: Variant[];
  selectedVariant: Variant | null;
  onVariantSelect: (v: Variant) => void;
}

export function SectionProduct({ products, selected, onSelect, uploadedImage, onUpload, productName, onProductNameChange, variants, selectedVariant, onVariantSelect }: Props) {
  const [tab, setTab] = useState<"viral" | "upload">("viral");

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex rounded-lg border border-border/50 overflow-hidden">
        <button
          onClick={() => setTab("viral")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            tab === "viral" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Produtos Virais
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

      {/* Selected product card with variants */}
      {selected && (
        <div className="space-y-2.5">
          <div
            className="rounded-xl border border-primary/30 p-3 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--primary) / 0.03) 100%)',
            }}
          >
            {(selectedVariant?.variant_image_url || selected.image_url || uploadedImage) && (
              <img
                src={selectedVariant?.variant_image_url || selected.image_url || uploadedImage}
                alt=""
                className="w-14 h-14 rounded-lg object-cover border border-border/20"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary font-medium flex items-center gap-1">✓ Selecionado</p>
              <p className="text-xs font-semibold text-foreground truncate">{selected.title}</p>
              {selected.price && (
                <p className="text-xs text-primary font-bold">R$ {Number(selected.price).toFixed(2).replace('.', ',')}</p>
              )}
            </div>
          </div>

          {/* Variants row — only show when 2+ variants */}
          {variants.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium">Selecione a variação:</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin flex-wrap">
                {variants.map((v) => {
                  const isActive = selectedVariant?.id === v.id || (!selectedVariant && v.is_default);
                  const hasImage = !!v.variant_image_url;
                  return (
                    <button
                      key={v.id}
                      onClick={() => onVariantSelect(v)}
                      className={`relative flex-shrink-0 overflow-hidden transition-all duration-200 ${
                        hasImage
                          ? "w-12 h-12 rounded-full border-2"
                          : "h-9 px-3 rounded-lg border"
                      } ${
                        isActive
                          ? "border-primary ring-2 ring-primary/30 shadow-[0_0_12px_-2px_hsl(var(--primary)/0.5)] bg-primary/10"
                          : "border-border/40 hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      title={v.variant_label}
                    >
                      {hasImage ? (
                        <ShimmerImage src={v.variant_image_url!} alt={v.variant_label} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`text-xs font-medium whitespace-nowrap ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                          {v.variant_label}
                        </span>
                      )}
                      {isActive && hasImage && (
                        <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "viral" ? (
        <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2 -m-2">
          {products.length === 0
            ? Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)
            : products.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 ease-out ${
                    selected?.id === p.id
                      ? "border-primary ring-2 ring-primary/30 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.5)]"
                      : "border-border/30 hover:border-primary/50 hover:shadow-[0_0_16px_-4px_hsl(var(--primary)/0.35)]"
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.03) 0%, transparent 50%, hsl(0 0% 0% / 0.08) 100%), hsl(var(--card))',
                    boxShadow: selected?.id === p.id
                      ? '0 0 20px -4px hsl(var(--primary) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.05), inset 0 -1px 0 hsl(0 0% 0% / 0.2)'
                      : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 hsl(0 0% 100% / 0.04), inset 0 -1px 0 hsl(0 0% 0% / 0.15)',
                  }}
                >
                  <div className="aspect-square bg-muted overflow-hidden">
                    {p.image_url ? (
                      <ShimmerImage src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 group-hover:text-primary/40 transition-colors duration-300">
                        <Globe className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  {/* Glow overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
                  {/* Gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                    <p className="text-[10px] text-white font-medium truncate leading-tight">{p.title}</p>
                    {p.price && (
                      <p className="text-[11px] text-primary font-bold mt-0.5 group-hover:drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)] transition-all duration-300">R$ {Number(p.price).toFixed(0)}</p>
                    )}
                  </div>
                  {selected?.id === p.id && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg animate-scale-in">
                      <span className="text-[9px] text-primary-foreground font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Upload area */}
          <label className="block cursor-pointer">
            <Input type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <div className="border-2 border-dashed border-border/40 rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
              {uploadedImage ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={uploadedImage} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <p className="text-[11px] text-foreground">Clique ou arraste para trocar</p>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Arraste uma imagem ou clique para enviar</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">PNG, JPG ou WEBP até 10MB</p>
                </>
              )}
            </div>
          </label>

          {/* Product name */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">📍 Nome do Produto</p>
            <Input
              value={productName}
              onChange={e => onProductNameChange(e.target.value)}
              placeholder="Ex: Sérum Vitamina C 30ml"
              className="text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
