import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, RotateCcw, Download, Loader2, X, Calendar } from "lucide-react";
import { GeneratingOverlay } from "@/components/influencer/GeneratingOverlay";
import { PageTransition } from "@/components/PageTransition";
import { SectionProduct } from "@/components/influencer/SectionProduct";
import { SectionInfluencer } from "@/components/influencer/SectionInfluencer";
import { SectionScene } from "@/components/influencer/SectionScene";
import { SectionAdjustments } from "@/components/influencer/SectionAdjustments";
import { AccordionSection } from "@/components/influencer/AccordionSection";

export default function InfluencerPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const SECTION_ORDER = ["produto", "influencer", "cena", "ajustes"];

  const goToNextSection = useCallback((current: string) => {
    const idx = SECTION_ORDER.indexOf(current);
    const next = SECTION_ORDER[idx + 1];
    if (!next) return;
    setOpenSections(prev => prev.includes(next) ? prev : [...prev, next]);
    setTimeout(() => {
      const el = document.getElementById(`section-${next}`);
      const container = scrollRef.current;
      if (el && container) {
        const elTop = el.offsetTop - container.offsetTop;
        container.scrollTo({ top: elTop - 8, behavior: "smooth" });
      }
    }, 200);
  }, []);

  // Selections
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [selectedPose, setSelectedPose] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("vertical");
  const [customPoseText, setCustomPoseText] = useState("");
  const [customScenarioText, setCustomScenarioText] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [productName, setProductName] = useState("");

  // BUG 5 FIX: Upload state for custom avatar and scene
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [customScenarioUrl, setCustomScenarioUrl] = useState<string | null>(null);

  // Generation state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [creativeId, setCreativeId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Accordion open state
  const [openSections, setOpenSections] = useState<string[]>(["produto"]);

  // Pre-select product from navigation state
  useEffect(() => {
    const state = location.state as { product?: any } | null;
    if (state?.product) {
      setSelectedProduct(state.product);
      setOpenSections(["influencer"]);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const { data: products } = useQuery({
    queryKey: ["products-for-creative"],
    queryFn: async () => {
      const { data } = await supabase.from("viral_products").select("*").eq("is_blacklisted", false).order("revenue_30d", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: productVariants } = useQuery({
    queryKey: ["product-variants", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct?.id) return [];
      const { data } = await supabase.from("product_variants").select("*").eq("product_id", selectedProduct.id);
      return data || [];
    },
    enabled: !!selectedProduct?.id,
  });

  const { data: avatars } = useQuery({
    queryKey: ["avatars-active"],
    queryFn: async () => {
      const { data } = await supabase.from("avatars").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: scenarios } = useQuery({
    queryKey: ["scenarios-active"],
    queryFn: async () => {
      const { data } = await supabase.from("scenarios").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: presets } = useQuery({
    queryKey: ["influencer-presets"],
    queryFn: async () => {
      const { data } = await supabase.from("presets").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: posesFromDb } = useQuery({
    queryKey: ["influencer-poses"],
    queryFn: async () => {
      const { data } = await supabase.from("poses").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: todayCount } = useQuery({
    queryKey: ["today-creative-count"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase.from("influencer_generations").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "completed").gte("created_at", today);
      return count || 0;
    },
    enabled: !!user,
  });

  const posePresets = presets?.filter(p => p.type === "pose") || [];
  const formatPresets = presets?.filter(p => p.type === "format") || [];

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const POSE_VALUE_TO_NAME: Record<string, string[]> = {
    selfie: ["Selfie Natural", "Selfie"],
    mirror_selfie: ["Mirror Selfie"],
    pov_holding: ["POV Unboxing", "POV"],
    lifestyle: ["Lifestyle Casual", "Lifestyle"],
    unboxing: ["Unboxing Reaction", "Unboxing"],
    front_facing: ["De Frente", "Front Facing"],
    sitting: ["Sentada", "Sitting"],
    product_only: ["Product Close-up", "Produto"],
  };

  const findPoseId = (): string | null => {
    if (!selectedPose || !posesFromDb?.length) return null;
    const possibleNames = POSE_VALUE_TO_NAME[selectedPose] || [];
    const match = posesFromDb.find(p =>
      possibleNames.some(n => p.name.toLowerCase().includes(n.toLowerCase()))
    );
    return match?.id || null;
  };

  const productSummary = selectedProduct?.title || productName || null;
  // BUG 5: Avatar summary includes custom upload
  const avatarSummary = customAvatarUrl ? "Avatar Personalizado" : (selectedAvatar?.name || null);
  const sceneSummary = customScenarioUrl ? "Cenário Personalizado" : (selectedScenario?.name || null);
  const poseSummary = selectedPose ? (posePresets.find(p => p.value === selectedPose)?.label || selectedPose) : null;

  const allSelectionsComplete = !!productSummary && !!avatarSummary && !!sceneSummary && !!poseSummary;

  const adjustSummary = poseSummary
    ? `${poseSummary} • ${formatPresets.find(p => p.value === selectedFormat)?.label || "9:16"}`.trim()
    : null;

  const handleGenerate = async (forceRegenerate = false) => {
    if (!allSelectionsComplete) {
      toast.error("Selecione Produto, Influencer, Cena e Pose antes de gerar");
      return;
    }

    // BUG 2 FIX: Auto-select first variant if product has variants but none selected
    let variantInfo = selectedProduct?._selectedVariant;
    if (!variantInfo && productVariants && productVariants.length > 0) {
      const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0];
      variantInfo = defaultVariant;
      setSelectedProduct((prev: any) => prev ? { ...prev, _selectedVariant: defaultVariant, image_url: defaultVariant.variant_image_url || prev.image_url } : prev);
    }

    setGenerating(true);
    setGenElapsed(0);
    const controller = new AbortController();
    abortRef.current = controller;
    genTimerRef.current = setInterval(() => setGenElapsed(prev => prev + 1), 1000);
    try {
      const invokeOptions: any = {
        body: {
          avatar_id: customAvatarUrl ? null : (selectedAvatar?.id || null),
          scenario_id: customScenarioUrl ? null : (selectedScenario?.id || null),
          scenario_name: selectedScenario?.name || "",
          pose_id: findPoseId(),
          product_id: selectedProduct?.id || null,
          product_image_url: variantInfo?.variant_image_url || uploadedImage || selectedProduct?.image_url || null,
          product_title: selectedProduct?.title || productName || null,
          product_category: selectedProduct?.category || selectedProduct?.shop_name || null,
          product_variant_label: variantInfo?.variant_label || null,
          product_variant_id: variantInfo?.id || null,
          style: null,
          enhancements: [],
          format: selectedFormat,
          custom_pose_text: customPoseText || posePresets.find(p => p.value === selectedPose)?.label || "",
          custom_scenario_text: customScenarioText || "",
          additional_info: additionalInfo || "",
          custom_avatar_url: customAvatarUrl || null,
          custom_scenario_url: customScenarioUrl || null,
          force_regenerate: forceRegenerate,
        },
      };
      // Pass AbortController signal if supported
      if (controller.signal) {
        invokeOptions.signal = controller.signal;
      }
      const { data, error } = await supabase.functions.invoke("generate-creative", invokeOptions);
      if (error) {
        const msg = typeof error === "object" && error.message ? error.message : String(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setGeneratedImage(data.image_url);
      setCreativeId(data.creative_id);
      toast.success("Criativo gerado com sucesso!");
      qc.invalidateQueries({ queryKey: ["user-creatives"] });
      qc.invalidateQueries({ queryKey: ["today-creative-count"] });
    } catch (e: any) {
      if (e.name === "AbortError" || controller.signal.aborted) {
        toast.info("Geração cancelada");
      } else {
        toast.error(e.message || "Erro ao gerar criativo");
      }
    }
    abortRef.current = null;
    if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
    setGenerating(false);
  };

  const handleCancelGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = null;
    if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
    setCancelled(true);
    setTimeout(() => {
      setGenerating(false);
      setCancelled(false);
    }, 600);
  };

  // Auto-advance if product has no variants or only 1 variant; auto-select default variant for multi-variant products
  useEffect(() => {
    if (selectedProduct && !selectedProduct._selectedVariant) {
      if (!selectedProduct.id) {
        goToNextSection("produto");
      } else if (productVariants !== undefined && productVariants.length === 0) {
        goToNextSection("produto");
      } else if (productVariants !== undefined && productVariants.length === 1) {
        const v = productVariants[0];
        setSelectedProduct((prev: any) => prev ? { ...prev, _selectedVariant: v, image_url: v.variant_image_url || prev.image_url } : prev);
        goToNextSection("produto");
      } else if (productVariants !== undefined && productVariants.length > 1) {
        const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0];
        setSelectedProduct((prev: any) => prev ? { ...prev, _selectedVariant: defaultVariant, image_url: defaultVariant.variant_image_url || prev.image_url } : prev);
      }
    }
  }, [selectedProduct, productVariants, goToNextSection]);


  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG, WEBP ou GIF.");
      return;
    }
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo de ${MAX_SIZE_MB}MB.`);
      return;
    }
    if (!user?.id) {
      toast.error("Você precisa estar logado para enviar imagens.");
      return;
    }

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/uploads/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("creatives").upload(path, file);
      if (error) {
        console.error("Upload error:", error.message);
        toast.error("Erro no upload. Tente novamente.");
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("creatives").getPublicUrl(path);
      setUploadedImage(publicUrl);
      setSelectedProduct({ title: file.name, id: null });
      toast.success("Imagem enviada!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Erro inesperado no upload. Tente novamente.");
    }
  };

  // BUG 5 FIX: Upload handler for custom avatar
  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para enviar imagens.");
      return;
    }
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo de 5MB.");
      return;
    }
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `references/${user.id}-custom-${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) {
        toast.error("Erro no upload do avatar.");
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setCustomAvatarUrl(publicUrl);
      setSelectedAvatar(null); // Clear DB avatar selection
      toast.success("Avatar personalizado enviado!");
      goToNextSection("influencer");
    } catch (err) {
      toast.error("Erro inesperado no upload.");
    }
  };

  // BUG 5 FIX: Upload handler for custom scene
  const handleSceneUpload = async (file: File) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para enviar imagens.");
      return;
    }
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo de 5MB.");
      return;
    }
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/scenes/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("creatives").upload(path, file, { upsert: true });
      if (error) {
        toast.error("Erro no upload do cenário.");
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("creatives").getPublicUrl(path);
      setCustomScenarioUrl(publicUrl);
      setSelectedScenario(null); // Clear DB scenario selection
      toast.success("Cenário personalizado enviado!");
      goToNextSection("cena");
    } catch (err) {
      toast.error("Erro inesperado no upload.");
    }
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setUploadedImage(null);
    setSelectedAvatar(null);
    setSelectedScenario(null);
    setSelectedPose(null);
    setSelectedFormat("vertical");
    setCustomPoseText("");
    setCustomScenarioText("");
    setAdditionalInfo("");
    setProductName("");
    setGeneratedImage(null);
    setCreativeId(null);
    setCustomAvatarUrl(null);
    setCustomScenarioUrl(null);
  };


  const missingItems = [
    !productSummary && "Produto",
    !avatarSummary && "Influencer",
    !sceneSummary && "Cena",
    !poseSummary && "Pose",
  ].filter(Boolean);

  const [showMobilePreview, setShowMobilePreview] = useState(false);

  useEffect(() => {
    if (generatedImage) setShowMobilePreview(true);
  }, [generatedImage]);

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]">
      {/* Left Sidebar */}
      <div className="w-full lg:w-[330px] lg:min-w-[330px] flex flex-col border-r border-border/20 min-h-0 flex-1 lg:flex-initial lg:h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20 shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              Studio
              <span className="text-[8px] px-1 py-0.5 rounded bg-primary/20 text-primary font-semibold">IA</span>
            </h1>
            <p className="text-[9px] text-muted-foreground leading-tight">Crie imagens UGC ultra-realistas</p>
          </div>
        </div>

        {/* Scrollable Sections */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2.5">
          <div id="section-produto">
          <AccordionSection
            icon="produto"
            title="Produto"
            subtitle={productSummary}
            isComplete={!!productSummary}
            isOpen={openSections.includes("produto")}
            onToggle={() => toggleSection("produto")}
            autoHighlight
          >
            <SectionProduct
              products={products || []}
              selected={selectedProduct}
              onSelect={(p) => {
                // BUG 7 FIX: Clear _selectedVariant when selecting a new product
                setSelectedProduct({ ...p, _selectedVariant: undefined });
                setUploadedImage(null);
                setProductName("");
              }}
              uploadedImage={uploadedImage}
              onUpload={handleUpload}
              productName={productName}
              onProductNameChange={setProductName}
              variants={productVariants || []}
              selectedVariant={selectedProduct?._selectedVariant || null}
              onVariantSelect={(v) => { setSelectedProduct((prev: any) => prev ? { ...prev, _selectedVariant: v, image_url: v.variant_image_url || prev.image_url } : prev); goToNextSection("produto"); }}
            />
          </AccordionSection>
          </div>

          <div id="section-influencer">
          <AccordionSection
            icon="influencer"
            title="Influencer"
            subtitle={avatarSummary}
            isComplete={!!avatarSummary}
            isOpen={openSections.includes("influencer")}
            onToggle={() => toggleSection("influencer")}
          >
            <SectionInfluencer
              avatars={avatars || []}
              selected={selectedAvatar}
              onSelect={(a) => { setSelectedAvatar(a); setCustomAvatarUrl(null); goToNextSection("influencer"); }}
              customAvatarUrl={customAvatarUrl}
              onAvatarUpload={handleAvatarUpload}
              onClearCustomAvatar={() => setCustomAvatarUrl(null)}
            />
          </AccordionSection>
          </div>

          <div id="section-cena">
          <AccordionSection
            icon="cena"
            title="Cena"
            subtitle={sceneSummary}
            isComplete={!!sceneSummary}
            isOpen={openSections.includes("cena")}
            onToggle={() => toggleSection("cena")}
          >
            <SectionScene
              scenarios={scenarios || []}
              selected={selectedScenario}
              onSelect={(s) => { setSelectedScenario(s); setCustomScenarioUrl(null); goToNextSection("cena"); }}
              customText={customScenarioText}
              onCustomTextChange={setCustomScenarioText}
              customScenarioUrl={customScenarioUrl}
              onSceneUpload={handleSceneUpload}
              onClearCustomScene={() => setCustomScenarioUrl(null)}
            />
          </AccordionSection>
          </div>

          <div id="section-ajustes">
          <AccordionSection
            icon="ajustes"
            title="Ajustes"
            subtitle={adjustSummary}
            isComplete={!!poseSummary}
            isOpen={openSections.includes("ajustes")}
            onToggle={() => toggleSection("ajustes")}
          >
            <SectionAdjustments
              posePresets={posePresets}
              formatPresets={formatPresets}
              selectedPose={selectedPose}
              onPoseSelect={setSelectedPose}
              selectedFormat={selectedFormat}
              onFormatSelect={setSelectedFormat}
              customPoseText={customPoseText}
              onCustomPoseTextChange={setCustomPoseText}
              additionalInfo={additionalInfo}
              onAdditionalInfoChange={setAdditionalInfo}
            />
          </AccordionSection>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-4 py-2 border-t border-border/20 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Hoje:</span>
            <span className="text-[10px] font-bold text-foreground bg-muted/30 px-2 py-0.5 rounded">{todayCount || 0} / 30</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${(todayCount || 0) >= 25 ? 'animate-pulse-glow' : ''}`}
              style={{
                width: `${Math.min(((todayCount || 0) / 30) * 100, 100)}%`,
                background: (todayCount || 0) >= 30
                  ? 'hsl(0 72% 51%)'
                  : (todayCount || 0) >= 24
                    ? 'hsl(38 92% 50%)'
                    : 'linear-gradient(90deg, hsl(120 100% 44%), hsl(120 70% 54%))',
                boxShadow: (todayCount || 0) >= 25
                  ? `0 0 8px ${(todayCount || 0) >= 30 ? 'hsl(0 72% 51% / 0.6)' : (todayCount || 0) >= 24 ? 'hsl(38 92% 50% / 0.6)' : 'hsl(120 100% 44% / 0.6)'}`
                  : 'none',
              }}
            />
          </div>
          {(() => {
            const dailyLimitReached = (todayCount || 0) >= 30;
            const isDisabled = generating || !allSelectionsComplete || dailyLimitReached;
            const buttonEl = (
              <button
                className={`w-full h-12 text-sm font-bold tracking-wide rounded-full transition-all duration-300 ease-out disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed disabled:scale-100 active:scale-[0.97] ${!isDisabled ? 'hover:scale-[1.03] hover:brightness-110' : ''}`}
                style={{
                  background: 'linear-gradient(180deg, hsl(120 100% 48%) 0%, hsl(120 100% 40%) 50%, hsl(120 90% 32%) 100%)',
                  color: '#fff',
                  boxShadow: isDisabled
                    ? 'none'
                    : '0 0 24px rgba(0, 224, 0, 0.25), 0 0 48px rgba(0, 224, 0, 0.1), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.15)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  letterSpacing: '0.04em',
                  // @ts-ignore -- CSS custom property for hover glow via inline + class
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.boxShadow = '0 0 32px rgba(0, 224, 0, 0.4), 0 0 64px rgba(0, 224, 0, 0.18), 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 224, 0, 0.25), 0 0 48px rgba(0, 224, 0, 0.1), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.15)';
                  }
                }}
                onClick={() => handleGenerate(false)}
                disabled={isDisabled}
              >
                {generating ? (
                  <span className="inline-flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</span>
                ) : dailyLimitReached ? (
                  <span className="inline-flex items-center">Limite diário atingido (30/30)</span>
                ) : (
                  <span className="inline-flex items-center"><Sparkles className="w-4 h-4 mr-2" /> Gerar Imagem</span>
                )}
              </button>
            );
            return dailyLimitReached ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="w-full"
                      onClickCapture={() => {
                        toast.info("Limite diário atingido", {
                          description: "Você atingiu o limite de 30 criações por dia. Volte amanhã para gerar novas imagens!",
                        });
                      }}
                    >
                      {buttonEl}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px] text-center">
                    <p className="text-xs">Você atingiu o limite de 30 criações por dia. Volte amanhã para gerar novas imagens!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : buttonEl;
          })()}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[10px] text-muted-foreground hover:text-foreground h-7"
            onClick={handleReset}
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Reiniciar
          </Button>
        </div>
      </div>

      {/* Right Preview Area */}
      <div className={`${showMobilePreview ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:flex'} flex-1 flex flex-col min-h-0 h-full lg:rounded-2xl lg:m-4 lg:ml-2 overflow-hidden bg-[hsl(240,5%,8%)] border-0 lg:border border-white/5 relative`}>
        {showMobilePreview && (
          <button
            onClick={() => setShowMobilePreview(false)}
            className="lg:hidden absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/30 flex items-center justify-center text-foreground"
          >
            ✕
          </button>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(0 0% 100% / 0.06) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, hsl(240 5% 8% / 0.7) 70%, hsl(240 5% 8%) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.04) 0%, transparent 50%)",
          }}
        />
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 relative z-[1]">
          {generating ? (
            <GeneratingOverlay
              elapsed={genElapsed}
              cancelled={cancelled}
              onCancel={handleCancelGeneration}
            />
          ) : generatedImage ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-lg">
              <div className="relative rounded-2xl overflow-hidden border border-border/20 shadow-2xl w-full">
                <img src={generatedImage} alt="Criativo gerado" className="w-full h-auto object-contain" />
              </div>
              {/* Selection summary strip */}
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {[
                  { label: productSummary, icon: "📦" },
                  { label: avatarSummary, icon: "👤" },
                  { label: sceneSummary, icon: "🌄" },
                  { label: poseSummary, icon: "🎯" },
                ].filter(item => !!item.label).map((item) => (
                  <span
                    key={item.label}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground/60 flex items-center gap-1"
                  >
                    {item.icon} {item.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center relative">
              <div className="absolute w-64 h-64 rounded-full border border-primary/5 animate-pulse" />
              <div className="absolute w-48 h-48 rounded-full border border-primary/10" style={{ animation: "pulse 3s ease-in-out infinite 0.5s" }} />
              <div className="absolute w-32 h-32 rounded-full border border-primary/15" style={{ animation: "pulse 3s ease-in-out infinite 1s" }} />
              
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)] border border-primary/20">
                <Sparkles className="w-9 h-9 text-primary/60" />
              </div>
              
              <h3 className="text-base font-semibold text-foreground/80 mb-1 relative z-10">Seu conteúdo aparecerá aqui</h3>
              <p className="text-xs text-muted-foreground/50 max-w-[200px] relative z-10">Selecione produto, influencer e cena para gerar sua imagem</p>
              
              <div className="flex flex-wrap justify-center gap-2 mt-5 relative z-10">
                {[
                  { label: "Produto", done: !!productSummary },
                  { label: "Influencer", done: !!avatarSummary },
                  { label: "Cena", done: !!sceneSummary },
                  { label: "Pose", done: !!poseSummary },
                ].map((item) => (
                  <span
                    key={item.label}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-300 ${
                      item.done
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/5 text-muted-foreground/40"
                    }`}
                  >
                    {item.done ? "✓" : "○"} {item.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {generatedImage && !generating && (
          <div className="border-t border-border/30 px-4 py-3 shrink-0 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-[11px] font-semibold border-border/50 hover:bg-muted/40 text-foreground"
                onClick={() => { setGeneratedImage(null); }}
                title="Voltar e ajustar seleções"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-[11px] font-semibold border-primary/40 hover:bg-primary/10 text-primary"
                onClick={() => { setGeneratedImage(null); handleGenerate(true); }}
                title="Gerar novamente com force_regenerate=true"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Gerar Novamente
              </Button>
              <a href={generatedImage} download target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button
                  size="sm"
                  className="w-full h-9 text-[11px] font-semibold gradient-primary text-primary-foreground shadow-[0_0_16px_-4px_hsl(var(--primary)/0.5)]"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
