import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Retry helper with exponential backoff + per-attempt timeout for FAL.AI calls
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { maxRetries = 2, baseDelayMs = 2000, timeoutMs = 25000, label = "API" } = {}
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (response.ok || attempt === maxRetries || (response.status < 500 && response.status !== 429)) {
        clearTimeout(timeout);
        return response;
      }
      const errText = await response.text();
      console.warn(`${label} attempt ${attempt + 1}/${maxRetries + 1} failed (${response.status}): ${errText.substring(0, 200)}`);
    } catch (err: any) {
      const isAbortError = err?.name === "AbortError";
      if (attempt === maxRetries) {
        clearTimeout(timeout);
        if (isAbortError) throw new Error(`${label} timeout após ${timeoutMs}ms`);
        throw err;
      }
      console.warn(`${label} attempt ${attempt + 1}/${maxRetries + 1} ${isAbortError ? "timeout" : "error"}: ${err}`);
    } finally {
      clearTimeout(timeout);
    }

    const delay = baseDelayMs * Math.pow(2, attempt);
    console.log(`${label}: retrying in ${delay}ms...`);
    await new Promise(r => setTimeout(r, delay));
  }

  throw new Error(`${label} failed after ${maxRetries + 1} attempts`);
}

interface ProductFidelityResult {
  score: number;
  pass: boolean;
  reason: string;
  personPresent: boolean;
  productMatch: boolean;
  onlySelectedProductVisible: boolean;
}

function tryParseJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

async function evaluateProductFidelity(
  generatedImageUrl: string,
  productImageUrl: string,
  productTitle: string,
  wearable = false,
): Promise<ProductFidelityResult | null> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.warn("LOVABLE_API_KEY ausente; pulando verificação de fidelidade do produto");
    return null;
  }

  const systemPrompt = wearable
    ? "Você é um auditor visual rigoroso de moda. Compare o resultado com a peça de roupa de referência e responda APENAS JSON válido: {\"score\":0-100,\"verdict\":\"pass|fail\",\"person_present\":true|false,\"product_match\":true|false,\"only_selected_product_visible\":true|false,\"reason\":\"...\"}. Critérios obrigatórios: 1) deve haver UMA PESSOA claramente visível VESTINDO a roupa; 2) a roupa deve ser IDÊNTICA à referência (cor, corte, tecido, logo, estampa, detalhes); 3) não pode haver outra roupa diferente em destaque. Se faltar pessoa, se a roupa não for idêntica, ou se a pessoa não estiver usando a peça, verdict=fail."
    : "Você é um auditor visual rigoroso de e-commerce. Compare o resultado com o produto de referência e responda APENAS JSON válido: {\"score\":0-100,\"verdict\":\"pass|fail\",\"person_present\":true|false,\"product_match\":true|false,\"only_selected_product_visible\":true|false,\"reason\":\"...\"}. Critérios obrigatórios: 1) deve haver UMA PESSOA claramente visível; 2) o produto principal deve ser idêntico ao de referência (formato, rótulo, marca, cor, tampa); 3) não pode haver outro produto diferente na imagem. Se faltar pessoa, se o produto não for idêntico, ou se houver produto extra, verdict=fail.";

  const userText = wearable
    ? `Roupa selecionada: ${productTitle}. Imagem 1 = resultado gerado. Imagem 2 = peça de referência. Avalie: (A) há pessoa visível na imagem 1? (B) a pessoa está VESTINDO a peça idêntica à imagem 2 (cor, corte, logo, detalhes)? (C) a roupa está no corpo da pessoa (não nas mãos, não em cabide)? Se qualquer item falhar, verdict=fail.`
    : `Produto selecionado: ${productTitle}. Imagem 1 = resultado gerado. Imagem 2 = produto de referência. Avalie estritamente: (A) há pessoa visível na imagem 1? (B) o produto principal na imagem 1 é IDÊNTICO ao da imagem 2? (C) existe APENAS esse produto selecionado (sem frascos/produtos extras diferentes)? (D) o produto está na mão direita da pessoa? Se qualquer item falhar, verdict=fail.`;

  const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userText,
            },
            {
              type: "image_url",
              image_url: { url: generatedImageUrl },
            },
            {
              type: "image_url",
              image_url: { url: productImageUrl },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 200,
    }),
  }, { maxRetries: 0, timeoutMs: 10000, label: "fidelity-check" });

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`fidelity-check failed (${response.status}): ${errText.substring(0, 300)}`);
    return null;
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string") return null;

  const parsed = tryParseJsonObject(rawContent);
  if (!parsed) return null;

  const rawScore = Number(parsed.score ?? 0);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 0;
  const verdict = String(parsed.verdict ?? "").toLowerCase();
  const reason = String(parsed.reason ?? "Sem detalhes");

  // Fail-safe estrito: só passa quando os campos críticos vierem explicitamente true.
  const personPresent = toBoolean(parsed.person_present) === true;
  const productMatch = toBoolean(parsed.product_match) === true;
  const onlySelectedProductVisible = toBoolean(parsed.only_selected_product_visible) === true;

  const strictPass =
    personPresent &&
    productMatch &&
    onlySelectedProductVisible &&
    score >= 65 &&
    verdict === "pass";

  return {
    score,
    pass: strictPass,
    reason,
    personPresent,
    productMatch,
    onlySelectedProductVisible,
  };
}

// ──────────────────────────────────────────────
// AVATAR FACE SIMILARITY CHECK
// ──────────────────────────────────────────────
interface FaceSimilarityResult {
  score: number;
  pass: boolean;
  reason: string;
}

async function evaluateFaceSimilarity(
  generatedImageUrl: string,
  avatarReferenceUrl: string,
  avatarName: string,
): Promise<FaceSimilarityResult | null> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) return null;

  const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            'Você é um especialista em reconhecimento facial. Compare o rosto da pessoa na imagem gerada (imagem 1) com o rosto de referência do avatar (imagem 2). Responda APENAS JSON válido: {"face_similarity_score":0-100,"same_person":true|false,"reason":"..."}. Avalie: tom de pele, formato do rosto, olhos, nariz, boca, cabelo, expressão. Score >= 70 = mesma pessoa. Se a imagem 1 não contiver uma pessoa com rosto visível, retorne score 0.',
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Avatar esperado: ${avatarName}. Imagem 1 = resultado gerado (deve conter o rosto deste avatar). Imagem 2 = foto de referência do avatar. A pessoa na imagem 1 é a MESMA pessoa da imagem 2? Avalie similaridade facial estritamente.`,
            },
            { type: "image_url", image_url: { url: generatedImageUrl } },
            { type: "image_url", image_url: { url: avatarReferenceUrl } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 200,
    }),
  }, { maxRetries: 0, timeoutMs: 10000, label: "face-similarity" });

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`face-similarity check failed (${response.status}): ${errText.substring(0, 300)}`);
    return null;
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string") return null;

  const parsed = tryParseJsonObject(rawContent);
  if (!parsed) return null;

  const rawScore = Number(parsed.face_similarity_score ?? 0);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 0;
  const samePerson = toBoolean(parsed.same_person) === true;
  const reason = String(parsed.reason ?? "Sem detalhes");

  return {
    score,
    pass: samePerson && score >= 60,
    reason,
  };
}

// ──────────────────────────────────────────────
// WEARABLE PRODUCT DETECTION
// ──────────────────────────────────────────────
function isWearableProduct(productName: string, productCategory: string): boolean {
  const text = `${productName} ${productCategory}`.toLowerCase();

  const wearableKeywords = [
    // Tops / outerwear
    "jaqueta", "casaco", "sobretudo", "parka", "bomber", "blazer", "colete",
    "blusa", "camiseta", "camisa", "regata", "cropped", "top", "suéter",
    "moletom", "cardigan", "cardigã", "tricô", "tricot", "polo",
    // Bottoms
    "calça", "short", "bermuda", "saia", "legging",
    // Dresses / jumpsuits
    "vestido", "macacão", "jumpsuit",
    // Footwear
    "tênis", "sapato", "sandália", "chinelo", "bota", "ankle boot",
    "sneaker", "scarpin", "tamanco",
    // Bags (worn/carried)
    "bolsa", "mochila", "pochete", "carteira", "clutch", "necessaire",
    // Accessories worn on body
    "óculos", "chapéu", "boné", "bone", "cachecol", "echarpe", "luvas",
    "meias", "cinto", "gravata", "lenço", "touca",
    // English fallbacks
    "jacket", "coat", "shirt", "dress", "pants", "skirt", "shoes",
    "bag", "hat", "scarf", "sneakers", "boots", "hoodie", "sweater",
    // Generic category terms
    "roupa", "vestuário", "moda feminina", "moda masculina", "fashion",
    "clothing", "apparel", "outfit",
  ];

  return wearableKeywords.some((kw) => text.includes(kw));
}

// ──────────────────────────────────────────────
// DETERMINISTIC PROMPT BUILDER
// ──────────────────────────────────────────────
interface PromptOptions {
  avatarGender: string;
  skinTone: string;
  avatarDescription: string;
  wardrobeDescription: string;
  productName: string;
  productColor: string;
  productVariant: string;
  productCategory: string;
  background: string;
  pose: string;
  format: string;
  additionalInfo: string;
  isWearable: boolean;
}

function buildImagePrompt(options: PromptOptions): string {
  const {
    avatarGender,
    skinTone,
    avatarDescription,
    wardrobeDescription,
    productName,
    productColor,
    productVariant,
    background,
    pose,
    format,
    additionalInfo,
    isWearable,
  } = options;

  const parts: string[] = [];

  const colorDesc = productColor ? ` in ${productColor} color` : "";
  const variantDesc = productVariant && productVariant !== "Padrão" ? ` (${productVariant})` : "";
  const fullProductName = `${productName}${colorDesc}${variantDesc}`;

  // [1] SUBJECT — Always first
  const genderLabel = avatarGender === "man" ? "brazilian man" : "brazilian woman";
  parts.push(`${genderLabel} with ${skinTone || "natural skin tone"}, ${avatarDescription}`);

  // [2] FACE — Always visible for face swap
  parts.push("face clearly visible and well-lit, looking at camera, sharp facial features, direct eye contact");

  if (isWearable) {
    // ── WEARABLE path ──────────────────────────────────────
    // [2.5] Avatar WEARING the product — replace wardrobe with product
    parts.push(
      `MUST be wearing the EXACT ${fullProductName} as their main clothing item, ` +
      `product is ON the body, properly fitted, fully visible from collar to hem, ` +
      `fabric texture and color identical to reference, garment NOT floating, NOT held in hand, ` +
      `outfit looks natural and well-fitted`
    );

    // [3] POSE for wearable (hands free, showing off the outfit)
    parts.push(pose || "standing naturally, hands relaxed at sides or slightly touching the clothing, showing off the outfit");

    // [5] BACKGROUND
    parts.push(background || "clean studio background");

    // [6] ADDITIONAL INFO
    if (additionalInfo) parts.push(additionalInfo);

    // [7] TECHNICAL
    const aspectLabel = format === "vertical" ? "9:16" : format === "square" ? "1:1" : format === "portrait" ? "3:4" : "16:9";
    parts.push(
      `UGC TikTok fashion photo ${aspectLabel}, ultra realistic, full-body or 3/4 shot, ` +
      `photorealistic, professional studio lighting, 8k resolution, ` +
      `sharp focus on clothing details, no wardrobe malfunction`
    );
  } else {
    // ── HOLDABLE path ──────────────────────────────────────
    // [2.3] HAND — Ensure right hand is visible for product placement
    parts.push("right hand clearly visible with fingers showing, arm extended naturally toward camera");

    // [2.5] WARDROBE — Avatar's default clothing, NEVER changed
    if (wardrobeDescription) {
      parts.push(`wearing ${wardrobeDescription}, do NOT change clothing, keep original outfit exactly as is`);
    } else {
      parts.push("wearing their own default clothing, do NOT change outfit");
    }

    // [3] POSE
    if (pose) parts.push(pose);

    // [4] PRODUCT INTERACTION — Held in right hand
    parts.push(
      `MUST be holding ${fullProductName} firmly in their right hand, ` +
      `product grip clearly visible with fingers wrapped tightly around the product, ` +
      `arm extended slightly toward camera, product label facing camera, product NOT floating, ` +
      `NOT on the ground, NOT on a table — ONLY gripped in the right hand. ` +
      `right arm bent at elbow, wrist at camera level, product prominently displayed in foreground`
    );

    // [5] BACKGROUND
    parts.push(background || "clean studio background");

    // [6] ADDITIONAL INFO
    if (additionalInfo) parts.push(additionalInfo);

    // [7] TECHNICAL
    const aspectLabel = format === "vertical" ? "9:16" : format === "square" ? "1:1" : format === "portrait" ? "3:4" : "16:9";
    parts.push(
      `UGC TikTok photo ${aspectLabel}, ultra realistic, smartphone camera quality, ` +
      `photorealistic, professional lighting, 8k resolution, ` +
      `no blurry hands, no floating product, sharp focus on product`
    );

    // Pose-specific hand emphasis
    const poseLower = (options.pose || "").toLowerCase();
    if (poseLower.includes("holding") || poseLower.includes("unboxing") || poseLower.includes("pov")) {
      return `Close-up UGC shot. Person's right hand in foreground prominently holding product. ` + parts.join(". ");
    }
  }

  return parts.join(". ");
}

// Hash options for seed/cache consistency
function hashOptions(options: Record<string, unknown>): string {
  // Use btoa for a deterministic hash
  const sorted = JSON.stringify(options, Object.keys(options).sort());
  // Simple hash using btoa (base64 encoding is deterministic)
  return btoa(unescape(encodeURIComponent(sorted)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.user.id;

    // Parse request
    const body = await req.json();
    const {
      avatar_id,
      scenario_id,
      scenario_name = "",
      pose_id,
      product_id,
      product_image_url,
      product_title,
      product_category,
      product_variant_label,
      product_variant_id = null,
      style,
      enhancements = [],
      format = "vertical",
      custom_pose_text = "",
      custom_scenario_text = "",
      additional_info = "",
      custom_avatar_url = null,
      custom_scenario_url = null,
      force_regenerate = false,
    } = body;

    console.log("=== GENERATE CREATIVE V14 (InstantID → Gemini x3 | wearable-aware | canonical portraits) ===");

    // ──────────────────────────────────────────────
    // STEP 1: Fetch all metadata from DB in parallel
    // ──────────────────────────────────────────────
    const fetchPromises: Promise<any>[] = [
      avatar_id ? supabaseAdmin.from("avatars").select("*").eq("id", avatar_id).single() : Promise.resolve({ data: null }),
      scenario_id ? supabaseAdmin.from("scenarios").select("*").eq("id", scenario_id).single() : Promise.resolve({ data: null }),
      pose_id ? supabaseAdmin.from("poses").select("*").eq("id", pose_id).single() : Promise.resolve({ data: null }),
      product_id ? supabaseAdmin.from("viral_products").select("*").eq("id", product_id).single() : Promise.resolve({ data: null }),
      supabaseAdmin.from("presets").select("type, value, prompt_modifier").eq("is_active", true),
    ];

    if (product_variant_id) {
      fetchPromises.push(supabaseAdmin.from("product_variants").select("*").eq("id", product_variant_id).single());
    } else {
      fetchPromises.push(Promise.resolve({ data: null }));
    }

    const [avatarRes, scenarioRes, poseRes, productRes, presetsRes, variantRes] = await Promise.all(fetchPromises);

    const avatar = avatarRes.data;
    const scenario = scenarioRes.data;
    const pose = poseRes.data;
    const product = productRes.data;
    const allPresets = presetsRes.data || [];
    const variantFromDb = variantRes.data;

    const resolvedProductTitle = product?.title || product_title || "";
    const resolvedProductCategory = product?.category || product_category || "";

    // Variant image fallback chain
    let resolvedProductImageUrl = product_image_url || null;
    if (!resolvedProductImageUrl && variantFromDb?.variant_image_url) {
      resolvedProductImageUrl = variantFromDb.variant_image_url;
    }
    if (!resolvedProductImageUrl && product?.image_url) {
      resolvedProductImageUrl = product.image_url;
    }

    const formatSizes: Record<string, string> = {};

    for (const p of allPresets) {
      if (!p.prompt_modifier) continue;
      if (p.type === "format") formatSizes[p.value] = p.prompt_modifier;
    }

    // ──────────────────────────────────────────────
    // STEP 2: VALIDATE required fields
    // ──────────────────────────────────────────────
    if (!resolvedProductTitle) {
      return new Response(
        JSON.stringify({ error: "Nome do produto é obrigatório para gerar o criativo." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!avatar_id && !custom_avatar_url) {
      return new Response(
        JSON.stringify({ error: "Selecione um avatar ou envie uma foto personalizada." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resolvedProductImageUrl) {
      return new Response(
        JSON.stringify({ error: "O produto selecionado não possui imagem válida para referência. Escolha outro produto/variante." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // ──────────────────────────────────────────────
    // STEP 3: Build DETERMINISTIC prompt
    // ──────────────────────────────────────────────
    const avatarGender = avatar?.gender || "woman";
    const skinTone = avatar?.ethnicity || "natural skin tone";
    const avatarDescription = avatar
      ? [avatar.prompt_base || `${avatar.name}, brazilian influencer`, avatar.consistency_prompt, avatar.identity_tokens?.join(", ")].filter(Boolean).join(", ")
      : custom_avatar_url
      ? "young attractive influencer, natural look, clear frontal face"
      : "young brazilian influencer, attractive, natural look";

    // Build background from scenario
    let background = "clean studio background";
    if (custom_scenario_url) {
      background = "natural environment, matching the reference background";
    } else if (scenario) {
      const bgParts = [scenario.environment_prompt || scenario.prompt_modifier];
      if (scenario.lighting_defaults) {
        const lighting = typeof scenario.lighting_defaults === "string"
          ? scenario.lighting_defaults : JSON.stringify(scenario.lighting_defaults);
        if (lighting && lighting !== "null" && lighting !== "{}") bgParts.push(`lighting: ${lighting}`);
      }
      background = bgParts.filter(Boolean).join(", ");
    } else if (scenario_name) {
      background = `${scenario_name.toLowerCase()}, natural environment`;
    }
    if (custom_scenario_text) background += `, ${custom_scenario_text}`;

    const poseText = pose?.prompt_modifier || custom_pose_text || "natural selfie pose";

    // Extract wardrobe defaults from avatar metadata
    let wardrobeDescription = "";
    if (avatar?.wardrobe_defaults) {
      const wd = avatar.wardrobe_defaults;
      wardrobeDescription = typeof wd === "string" ? wd : (wd.description || wd.outfit || JSON.stringify(wd));
    }

    const productIsWearable = isWearableProduct(resolvedProductTitle, resolvedProductCategory);
    console.log(`Product "${resolvedProductTitle}" isWearable=${productIsWearable}`);

    const promptOptions: PromptOptions = {
      avatarGender,
      skinTone,
      avatarDescription,
      wardrobeDescription,
      productName: resolvedProductTitle,
      productColor: variantFromDb?.variant_label || product_variant_label || "",
      productVariant: product_variant_label || "",
      productCategory: resolvedProductCategory,
      background,
      pose: poseText,
      format,
      additionalInfo: additional_info,
      isWearable: productIsWearable,
    };

    const finalPrompt = buildImagePrompt(promptOptions);

    console.log("Deterministic prompt:", finalPrompt.substring(0, 500));

    // ──────────────────────────────────────────────
    // STEP 4: HASH OPTIONS + CHECK CACHE
    // ──────────────────────────────────────────────
    const optionsForHash = {
      gender: avatarGender,
      skin: skinTone,
      avatarRef: avatar_id || custom_avatar_url || "custom",
      product: resolvedProductTitle,
      productId: product_id || "custom",
      productImageRef: resolvedProductImageUrl,
      color: variantFromDb?.variant_label || product_variant_label || "default",
      variant: product_variant_label || "default",
      variantId: product_variant_id || "default",
      category: resolvedProductCategory,
      scenarioRef: scenario_id || custom_scenario_url || scenario_name || "custom",
      background,
      pose: poseText,
      customPoseText: custom_pose_text,
      customScenarioText: custom_scenario_text,
      format,
      isWearable: productIsWearable,
    };

    const optionsHash = hashOptions(optionsForHash);
    console.log("Options hash:", optionsHash.substring(0, 60));

    // Check cache first — same combination = same image ALWAYS (unless force_regenerate)
    if (!force_regenerate) {
      const { data: cachedImage } = await supabaseAdmin
        .from("generation_cache")
        .select("image_url")
        .eq("options_hash", optionsHash)
        .maybeSingle();

      if (cachedImage?.image_url) {
        console.log("CACHE HIT — returning cached image");

        // Still save a record for tracking
        const { data: creative } = await supabaseAdmin.from("user_creatives").insert({
          user_id: userId,
          product_id: product_id || null,
          image_url: cachedImage.image_url,
          avatar_used: custom_avatar_url ? "Custom Upload" : (avatar?.name || null),
          pose: pose?.name || custom_pose_text || null,
          pose_id: pose_id || null,
          environment: scenario?.name || null,
          scenario_id: scenario_id || null,
          style: style || null,
          prompt_used: finalPrompt,
          enhancements,
          custom_pose_text: custom_pose_text || null,
          custom_scenario_text: custom_scenario_text || null,
          additional_info: additional_info || null,
          format,
        }).select().single();

        return new Response(
          JSON.stringify({
            image_url: cachedImage.image_url,
            creative_id: creative?.id || null,
            latency_ms: 0,
            cached: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log("FORCE REGENERATE — skipping cache lookup");
      // Delete old cache entry so the new result replaces it
      await supabaseAdmin.from("generation_cache").delete().eq("options_hash", optionsHash);
      // Delete old seed so a new one is generated
      await supabaseAdmin.from("generation_seeds").delete().eq("options_hash", optionsHash);
    }

    console.log("CACHE MISS — generating new image");

    // ──────────────────────────────────────────────
    // STEP 5: GET OR CREATE FIXED SEED
    // ──────────────────────────────────────────────
    let seed: number;
    const { data: existingSeed } = await supabaseAdmin
      .from("generation_seeds")
      .select("seed")
      .eq("options_hash", optionsHash)
      .maybeSingle();

    if (existingSeed?.seed) {
      seed = existingSeed.seed;
      console.log("Using existing seed:", seed);
    } else {
      seed = Math.floor(Math.random() * 9999999);
      await supabaseAdmin.from("generation_seeds").insert({
        options_hash: optionsHash,
        seed,
      });
      console.log("Created new seed:", seed);
    }

    // ──────────────────────────────────────────────
    // STEP 6: Resolve avatar reference image
    // ──────────────────────────────────────────────
    const falKey = Deno.env.get("FAL_AI_API_KEY");
    if (!falKey) throw new Error("FAL_AI_API_KEY not configured");

    const imageSize = formatSizes[format] || "portrait_4_3";
    const startTime = Date.now();

    // Map format to InstantID-compatible sizes (SDXL-friendly)
    const instantIdSizeMap: Record<string, string> = {
      vertical:  "672_1024",   // 9:16
      square:    "1024_1024",  // 1:1
      portrait:  "768_1024",   // 3:4
      landscape: "1024_576",   // 16:9
    };
    const instantIdSize = instantIdSizeMap[format] || "672_1024";

    let avatarImageSource = custom_avatar_url || null;

    if (!avatarImageSource && avatar) {
      const refImages = avatar.reference_images as string[] | null;
      if (refImages && refImages.length > 0 && refImages[0].startsWith("http")) {
        avatarImageSource = refImages[0];
      } else if (avatar.image_url) {
        avatarImageSource = avatar.image_url;
      }
    }

    // Resolve avatar URL
    let avatarImageUrl = avatarImageSource || "";
    if (avatarImageSource) {
      if (!avatarImageUrl.startsWith("http")) {
        const cleanPath = avatarImageUrl.replace(/^\/+/, "").replace(/^avatars\//, "");
        const { data: { publicUrl: pubUrl } } = supabaseAdmin.storage.from("avatars").getPublicUrl(cleanPath);
        avatarImageUrl = pubUrl;
      } else if (avatarImageUrl.includes("/storage/v1/") && avatarImageUrl.includes("token=")) {
        const match = avatarImageUrl.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/avatars\/(.+?)(?:\?|$)/);
        if (match) {
          const { data: { publicUrl: pubUrl } } = supabaseAdmin.storage.from("avatars").getPublicUrl(match[1]);
          avatarImageUrl = pubUrl;
        }
      }
    }

    // ──────────────────────────────────────────────
    // STEP 6+7: InstantID (primary) → face-swap fallback
    // InstantID generates the scene WITH the avatar's face identity baked in from the start.
    // No uncanny-valley post-swap artifacts; identity is preserved throughout the diffusion.
    // Fallback: flux-dev + face-swap if InstantID fails.
    // ──────────────────────────────────────────────
    let imageUrl = "";
    let baseLatency = 0;
    let faceSwapLatency = 0;
    let avatarApplied = false;

    const needsAvatar = !!(avatar_id || custom_avatar_url);

    // ── Flux-dev helper (fallback / no-avatar path) ──
    async function generateBaseImage(useSeed: number): Promise<{ url: string; latency: number }> {
      const t0 = Date.now();
      const falResponse = await fetchWithRetry("https://fal.run/fal-ai/flux/dev", {
        method: "POST",
        headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          seed: useSeed,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          image_size: imageSize,
          num_images: 1,
          enable_safety_checker: true,
        }),
      }, { maxRetries: 1, baseDelayMs: 2000, timeoutMs: 45000, label: "flux-dev" });

      if (!falResponse.ok) {
        const errText = await falResponse.text();
        if (falResponse.status === 403 || falResponse.status === 402) {
          throw new Error("Créditos FAL.AI esgotados. Recarregue em fal.ai/dashboard/billing");
        }
        throw new Error(`Erro na geração de imagem base (${falResponse.status}): ${errText.substring(0, 200)}`);
      }
      const falData = await falResponse.json();
      const url = falData.images?.[0]?.url;
      if (!url) throw new Error("Nenhuma imagem base gerada");
      return { url, latency: Date.now() - t0 };
    }

    if (!needsAvatar) {
      // ── No avatar: pure flux-dev ──
      console.log("STEP 6: No avatar selected — generating with flux-dev");
      const base = await generateBaseImage(seed);
      imageUrl = base.url;
      baseLatency = base.latency;
      avatarApplied = true;

    } else {
      // ── With avatar: try InstantID first (up to 2 attempts) ──
      console.log(`STEP 6+7 (InstantID): avatar="${avatar?.name || "custom"}" face_url=${avatarImageUrl.substring(0, 80)}...`);

      let instantIdSucceeded = false;

      for (let attempt = 0; attempt < 2 && !instantIdSucceeded; attempt++) {
        const currentSeed = seed + attempt;
        try {
          const instantIdResponse = await fetchWithRetry("https://fal.run/fal-ai/instant-id", {
            method: "POST",
            headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              face_image_url: avatarImageUrl,
              prompt: finalPrompt,
              negative_prompt:
                "blurry, low quality, distorted face, ugly, deformed, bad anatomy, " +
                "two heads, duplicate, extra limbs, cartoon, anime, painting, watermark",
              image_size: instantIdSize,
              num_inference_steps: 30,
              guidance_scale: 5.0,
              ip_adapter_scale: 0.8,
              controlnet_conditioning_scale: 0.8,
              seed: currentSeed,
              enable_safety_checker: true,
            }),
          }, { maxRetries: 0, timeoutMs: 60000, label: `instant-id#${attempt + 1}` });

          if (instantIdResponse.ok) {
            const idData = await instantIdResponse.json();
            const idUrl = idData.images?.[0]?.url;
            if (idUrl) {
              imageUrl = idUrl;
              baseLatency = Date.now() - startTime;
              avatarApplied = true;
              instantIdSucceeded = true;
              console.log(`InstantID succeeded (attempt ${attempt + 1}): ${baseLatency}ms`);
            } else {
              console.warn(`InstantID attempt ${attempt + 1}: no image in response`);
            }
          } else {
            const errText = await instantIdResponse.text();
            console.warn(`InstantID attempt ${attempt + 1} failed (${instantIdResponse.status}): ${errText.substring(0, 200)}`);
          }
        } catch (idErr: any) {
          console.warn(`InstantID attempt ${attempt + 1} error: ${idErr?.message}`);
        }
      }

      // ── Fallback: flux-dev + face-swap if InstantID failed ──
      if (!instantIdSucceeded) {
        console.log("InstantID failed — falling back to flux-dev + face-swap");
        let faceSwapDone = false;

        for (let attempt = 0; attempt < 3 && !faceSwapDone; attempt++) {
          const currentSeed = seed + attempt + 10; // offset seeds from InstantID attempts
          console.log(`Fallback attempt ${attempt + 1}: flux-dev (seed=${currentSeed})`);

          try {
            const base = await generateBaseImage(currentSeed);
            imageUrl = base.url;
            baseLatency += base.latency;

            const faceSwapResponse = await fetchWithRetry("https://fal.run/fal-ai/face-swap", {
              method: "POST",
              headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                base_image_url: imageUrl,
                swap_image_url: avatarImageUrl,
                include_faces: true,
              }),
            }, { maxRetries: 0, timeoutMs: 45000, label: `face-swap#${attempt + 1}` });

            if (faceSwapResponse.ok) {
              const swapData = await faceSwapResponse.json();
              const swappedUrl = swapData.image?.url;
              if (swappedUrl) {
                imageUrl = swappedUrl;
                faceSwapDone = true;
                avatarApplied = true;
                faceSwapLatency = Date.now() - startTime - baseLatency;
                console.log(`Face-swap fallback succeeded (attempt ${attempt + 1})`);
              }
            } else {
              const swapErr = await faceSwapResponse.text();
              console.warn(`Face-swap attempt ${attempt + 1} failed: ${faceSwapResponse.status} ${swapErr.substring(0, 100)}`);
            }
          } catch (err: any) {
            console.warn(`Fallback attempt ${attempt + 1} error: ${err?.message}`);
          }
        }

        if (!faceSwapDone) {
          throw new Error("Não foi possível aplicar o rosto do avatar (InstantID + face-swap falharam). Tente gerar novamente.");
        }
      }
    }

    if (!faceSwapLatency) faceSwapLatency = Date.now() - startTime - baseLatency;

    // ──────────────────────────────────────────────
    // STEP 8: Product Placement with Gemini Image Edit (replaces Kontext Multi — $0 FAL cost)
    // ──────────────────────────────────────────────
    let productPlacementApplied = false;
    let productPlacementAttempts = 0;
    let productFidelityScore: number | null = null;
    let productFidelityReason: string | null = null;

    console.log("STEP 8: Product placement with Gemini Image Edit (via Lovable AI Gateway)");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.warn("LOVABLE_API_KEY not available — skipping product placement, using base image");
      productPlacementApplied = true; // fail-open: use base image
    } else {
      const baseImageForEdit = imageUrl;
      const variantNote = (product_variant_label && product_variant_label !== "Padrão")
        ? `, specifically the ${product_variant_label} variant` : "";
      const productDesc = resolvedProductCategory
        ? `${resolvedProductCategory} product "${resolvedProductTitle}"`
        : `product "${resolvedProductTitle}"`;

      // Track best candidate across attempts
      let bestCandidateUrl: string | null = null;
      let bestCandidateScore = -1;
      const MIN_FALLBACK_SCORE = 30;

      for (let attempt = 1; attempt <= 3; attempt++) {
        productPlacementAttempts = attempt;

        let editPrompt: string;
        if (productIsWearable) {
          // Wearable path: person should be WEARING the product
          editPrompt = attempt === 3
            ? `FINAL ATTEMPT: Make ONLY one change — replace the person's clothing with the EXACT garment from reference image 2. The garment must be IDENTICAL: same colors, fabric, cut, logo, print. Keep face, hair, skin, background EXACTLY as-is. Nothing else changes.`
            : attempt === 2
            ? `REPAIR: The person must be WEARING the EXACT ${productDesc}${variantNote} from reference image 2. Replace current clothing with this garment while keeping the SAME person, face, hair, background. Garment must match image 2 precisely: colors, texture, fit, details. Photorealistic.`
            : `Edit this photo: dress the person in the EXACT ${productDesc}${variantNote} shown in reference image 2. The garment must be IDENTICAL to image 2 — same colors, fabric, cut, logo, buttons, zippers, print. Keep the person's face, hair, skin tone, and background UNCHANGED. Clothing fits naturally on the body. Do NOT put the garment in their hands. Photorealistic, commercial fashion photography quality.`;
        } else {
          // Holdable path: person should be HOLDING the product in right hand
          editPrompt = attempt === 3
            ? `FINAL ATTEMPT: Make ONLY one change to this photo — put the EXACT product from reference image 2 in this person's right hand. Product must be IDENTICAL to image 2 (same shape, colors, packaging, label). Fingers wrap around it. Keep face, hair, clothing, background exactly as-is. Nothing else changes.`
            : attempt === 2
            ? `REPAIR: The person in this photo must be holding the EXACT product shown in the reference image (image 2) firmly in their RIGHT HAND. Replace any incorrect product with the EXACT ${productDesc}${variantNote} from image 2. Keep the same person, face, clothing, and background. Product label must face camera. Fingers must grip the product visibly. Photorealistic result.`
            : `Edit this photo: make the person hold the EXACT ${productDesc}${variantNote} shown in image 2 firmly in their RIGHT HAND. The product must be IDENTICAL to image 2: same colors, logo, label, shape, packaging. The person's face, hair, clothing, and background must remain UNCHANGED. Product grip clearly visible with fingers wrapped around it, arm slightly extended toward camera, product label facing camera. Product is NOT worn, NOT floating — ONLY held in hand. Photorealistic, commercial product photography quality.`;
        }

        try {
          const geminiResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: editPrompt },
                    { type: "image_url", image_url: { url: baseImageForEdit } },
                    { type: "image_url", image_url: { url: resolvedProductImageUrl } },
                  ],
                },
              ],
              modalities: ["image", "text"],
            }),
          }, { maxRetries: 0, timeoutMs: 60000, label: `gemini-img-edit#${attempt}` });

          if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.warn(`Gemini image edit attempt ${attempt} failed (${geminiResponse.status}): ${errText.substring(0, 300)}`);
            continue;
          }

          const geminiData = await geminiResponse.json();
          const editedImageBase64 = geminiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!editedImageBase64) {
            console.warn(`Gemini image edit attempt ${attempt} returned no image`);
            continue;
          }

          // Upload base64 result to storage
          let candidateImageUrl: string;
          if (editedImageBase64.startsWith("data:image/")) {
            const base64Data = editedImageBase64.split(",")[1];
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

            const tmpFileName = `${userId}/tmp-${Date.now()}-attempt${attempt}.png`;
            const { error: tmpUploadErr } = await supabaseAdmin.storage
              .from("creatives").upload(tmpFileName, bytes, { contentType: "image/png", upsert: true });

            if (tmpUploadErr) {
              console.warn(`Failed to upload candidate image: ${tmpUploadErr.message}`);
              continue;
            }

            const { data: { publicUrl: tmpPubUrl } } = supabaseAdmin.storage.from("creatives").getPublicUrl(tmpFileName);
            candidateImageUrl = tmpPubUrl;
          } else {
            candidateImageUrl = editedImageBase64;
          }

          // Evaluate fidelity
          const fidelity = await evaluateProductFidelity(candidateImageUrl, resolvedProductImageUrl, resolvedProductTitle, productIsWearable);
          if (fidelity) {
            productFidelityScore = fidelity.score;
            productFidelityReason = fidelity.reason;
            console.log(`Product fidelity (attempt ${attempt}): score=${fidelity.score} person=${fidelity.personPresent} match=${fidelity.productMatch} pass=${fidelity.pass}`);

            if (fidelity.personPresent && fidelity.score > bestCandidateScore) {
              bestCandidateScore = fidelity.score;
              bestCandidateUrl = candidateImageUrl;
            }
          } else {
            if (!bestCandidateUrl) {
              bestCandidateUrl = candidateImageUrl;
              bestCandidateScore = 50;
            }
          }

          if (fidelity?.pass) {
            imageUrl = candidateImageUrl;
            productPlacementApplied = true;
            break;
          }

          console.warn(`Gemini edit attempt ${attempt} rejected by fidelity: ${fidelity?.reason || "N/A"}`);
        } catch (editErr: any) {
          console.warn(`Gemini image edit attempt ${attempt} error: ${editErr?.message || editErr}`);
        }
      }

      // Graceful fallback
      if (!productPlacementApplied && bestCandidateUrl && bestCandidateScore >= MIN_FALLBACK_SCORE) {
        imageUrl = bestCandidateUrl;
        productPlacementApplied = true;
        const fallbackNote = `Fallback: melhor candidata (score=${bestCandidateScore}) após ${productPlacementAttempts} tentativas`;
        console.warn(fallbackNote);
        productFidelityReason = fallbackNote;
      }

      if (!productPlacementApplied) {
        throw new Error("Não foi possível inserir o produto na imagem após 3 tentativas. Tente novamente ou escolha outro produto.");
      }
    }

    const productPlacementLatency = Date.now() - startTime - baseLatency - faceSwapLatency;

    // ──────────────────────────────────────────────
    // STEP 8.5+8.9: PARALLEL — Face Similarity + Double-Check Product Fidelity
    // ──────────────────────────────────────────────
    let faceSimilarityScore: number | null = null;
    let faceSimilarityReason: string | null = null;
    let faceSimilarityPass: boolean | null = null;
    let doubleCheckScore: number | null = null;
    let doubleCheckPass: boolean | null = null;
    let doubleCheckReason: string | null = null;

    const parallelAudits: Promise<void>[] = [];

    if (avatarImageSource && imageUrl) {
      parallelAudits.push((async () => {
        console.log("STEP 8.5: Face similarity check against avatar reference");
        const avatarLabel = custom_avatar_url ? "Custom Upload" : (avatar?.name || "Avatar");
        const faceSim = await evaluateFaceSimilarity(imageUrl, avatarImageSource, avatarLabel);
        if (faceSim) {
          faceSimilarityScore = faceSim.score;
          faceSimilarityReason = faceSim.reason;
          faceSimilarityPass = faceSim.pass;
          console.log(`Face similarity: score=${faceSim.score} pass=${faceSim.pass} reason=${faceSim.reason}`);
        } else {
          console.warn("Face similarity check returned null — skipping (fail-open)");
        }
      })());
    }

    const skipDoubleCheck = productFidelityScore !== null && productFidelityScore >= 98;
    if (imageUrl && resolvedProductImageUrl && !skipDoubleCheck) {
      parallelAudits.push((async () => {
        console.log("STEP 8.9: Double-check product fidelity (independent second audit)");
        const dc = await evaluateProductFidelity(imageUrl, resolvedProductImageUrl, resolvedProductTitle, productIsWearable);
        if (dc) {
          doubleCheckScore = dc.score;
          doubleCheckPass = dc.pass;
          doubleCheckReason = dc.reason;
          console.log(`Double-check fidelity: score=${dc.score} person=${dc.personPresent} product=${dc.productMatch} onlySelected=${dc.onlySelectedProductVisible} pass=${dc.pass}`);
        } else {
          console.warn("Double-check returned null — skipping (fail-open)");
        }
      })());
    } else if (skipDoubleCheck) {
      doubleCheckPass = true;
      doubleCheckScore = productFidelityScore;
      doubleCheckReason = "Skipped — first audit score >= 98";
      console.log("STEP 8.9: Skipped double-check (first audit score >= 98)");
    }

    await Promise.all(parallelAudits);

    // Face similarity and double-check are now INFORMATIONAL ONLY (fail-open).
    if (faceSimilarityPass === false) {
      console.warn("Face similarity FAILED (non-blocking) — logged for diagnostics only.");
    }
    if (doubleCheckPass === false) {
      console.warn(`Double-check FAILED (non-blocking): ${doubleCheckReason}`);
    }

    const latencyMs = Date.now() - startTime;

    // ──────────────────────────────────────────────
    // STEP 9: Download and upload to Supabase Storage
    // ──────────────────────────────────────────────
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error("Failed to download generated image");
    const imgBuffer = await imgResponse.arrayBuffer();

    const fileName = `${userId}/${Date.now()}-creative.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("creatives").upload(fileName, imgBuffer, { contentType: "image/png", upsert: false });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from("creatives").getPublicUrl(fileName);

    // ──────────────────────────────────────────────
    // STEP 10: Save to cache for future identical requests
    // ──────────────────────────────────────────────
    await supabaseAdmin.from("generation_cache").upsert({
      options_hash: optionsHash,
      image_url: publicUrl,
      prompt_used: finalPrompt,
      seed_used: seed,
    }, { onConflict: "options_hash" });

    console.log("Image cached for hash:", optionsHash.substring(0, 40));

    // ──────────────────────────────────────────────
    // STEP 11: Save records to both tables
    // ──────────────────────────────────────────────
    const { data: creative, error: insertError } = await supabaseAdmin.from("user_creatives").insert({
      user_id: userId,
      product_id: product_id || null,
      image_url: publicUrl,
      avatar_used: custom_avatar_url ? "Custom Upload" : (avatar?.name || null),
      pose: pose?.name || custom_pose_text || null,
      pose_id: pose_id || null,
      environment: scenario?.name || null,
      scenario_id: scenario_id || null,
      style: style || null,
      prompt_used: finalPrompt,
      enhancements,
      custom_pose_text: custom_pose_text || null,
      custom_scenario_text: custom_scenario_text || null,
      additional_info: additional_info || null,
      format,
    }).select().single();

    if (insertError) console.error("Insert creative error:", insertError);

    const { error: genError } = await supabaseAdmin.from("influencer_generations").insert({
      user_id: userId,
      avatar_id: avatar_id || null,
      product_id: product_id || null,
      product_variant_id: product_variant_id || null,
      scene_id: scenario_id || null,
      pose_id: pose_id || null,
      creative_id: creative?.id || null,
      prompt_final: finalPrompt,
      result_image_url: publicUrl,
      format,
      style_preset: style || null,
      enhancements,
      provider_model: "v12-gemini: flux-dev + face-swap x3 + gemini-flash-image x3",
      provider_params: {
        pipeline: "v12-gemini",
        seed,
        num_inference_steps: 20,
        base_model: "flux-dev",
        product_placement_model: "gemini-2.5-flash-image",
        face_swap_applied: avatarApplied,
        product_placement_applied: productPlacementApplied,
        product_placement_attempts: productPlacementAttempts,
        product_fidelity_score: productFidelityScore,
        product_fidelity_reason: productFidelityReason,
        product_image_provided: !!resolvedProductImageUrl,
        base_latency_ms: baseLatency,
        face_swap_latency_ms: faceSwapLatency,
        product_placement_latency_ms: productPlacementLatency,
        face_similarity_score: faceSimilarityScore,
        face_similarity_pass: faceSimilarityPass,
        face_similarity_reason: faceSimilarityReason,
        double_check_score: doubleCheckScore,
        double_check_pass: doubleCheckPass,
        double_check_reason: doubleCheckReason,
        options_hash: optionsHash,
        force_regenerated: force_regenerate,
      },
      latency_ms: latencyMs,
      status: "completed",
      resolved: {
        avatar: avatar ? { id: avatar.id, name: avatar.name } : custom_avatar_url ? { custom: true } : null,
        scenario: scenario ? { id: scenario.id, name: scenario.name } : null,
        pose: pose ? { id: pose.id, name: pose.name } : null,
        product: product ? { id: product.id, title: product.title, category: product.category } : null,
        product_variant_label: product_variant_label || null,
        product_variant_id: product_variant_id || null,
      },
      selection_payload: body,
      diagnostics: {
        pipeline: "v12-gemini",
        base_model: "flux-dev",
        product_placement_model: "gemini-2.5-flash-image",
        step1_base_generated: true,
        step2_face_swap_applied: avatarApplied,
        step3_product_placement_applied: productPlacementApplied,
        product_placement_attempts: productPlacementAttempts,
        product_fidelity_score: productFidelityScore,
        product_fidelity_reason: productFidelityReason,
        base_latency_ms: baseLatency,
        face_swap_latency_ms: faceSwapLatency,
        product_placement_latency_ms: productPlacementLatency,
        face_similarity_score: faceSimilarityScore,
        face_similarity_pass: faceSimilarityPass,
        face_similarity_reason: faceSimilarityReason,
        double_check_score: doubleCheckScore,
        double_check_pass: doubleCheckPass,
        double_check_reason: doubleCheckReason,
        total_latency_ms: latencyMs,
        force_regenerated: force_regenerate,
      },
    });

    if (genError) console.error("Insert generation error:", genError);

    console.log(`Creative V12 completed: seed=${seed} base=${baseLatency}ms faceSwap=${faceSwapLatency}ms productPlacement=${productPlacementLatency}ms total=${latencyMs}ms`);

    return new Response(
      JSON.stringify({
        image_url: publicUrl,
        creative_id: creative?.id,
        latency_ms: latencyMs,
        seed,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("generate-creative error:", error.message);
    const userMessage =
      error.message?.includes("FAL.AI") || error.message?.includes("Créditos")
        ? error.message
        : error.message?.includes("not configured")
        ? "Serviço de geração não configurado. Contate o administrador."
        : error.message?.includes("obrigatório") || error.message?.includes("Selecione") || error.message?.includes("fidelidade") || error.message?.includes("Não foi possível")
        ? error.message
        : "Erro ao gerar criativo. Tente novamente.";
    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
