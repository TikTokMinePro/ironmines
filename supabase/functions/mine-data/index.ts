import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let triggeredBy = "manual";
  let mineType = "all";
  try {
    const body = await req.json();
    triggeredBy = body?.triggered_by || "manual";
    mineType = body?.type || "all";
  } catch { /* no body */ }

  // Verify admin authorization
  // Allowed: (1) no auth header = pg_cron call, (2) anon/service_role key = cron/internal call,
  //          (3) valid admin user JWT
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    // The pg_cron schedule sends the anon key in the Authorization header.
    // supabase.auth.getUser(anonKey) returns user=null because the anon key is NOT a user JWT.
    // We must explicitly allow the anon key and service_role key here.
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (token !== anonKey && token !== serviceKey) {
      // Regular user JWT — must be an admin
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Unauthorized: admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // else: anon or service_role key = trusted call (cron or internal) — proceed
  } else if (authHeader) {
    // Has auth header but not Bearer token format
    return new Response(JSON.stringify({ error: "Invalid authorization" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // No auth header = pg_cron invocation (allowed)

  const apiKey = Deno.env.get("SCRAPECREATORS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SCRAPECREATORS_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const scHeaders = { "x-api-key": apiKey };
  const results = { products: 0, videos: 0, creators: 0, api_calls: 0 };
  const now = new Date().toISOString();
  const globalStart = Date.now();

  // Auto-fix stale jobs stuck as "running" for over 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: staleJobs } = await supabase
    .from("mining_jobs")
    .update({ status: "error", error_message: "Timeout automático: job preso como running por mais de 5 min", finished_at: new Date().toISOString(), duration_ms: 300000 })
    .eq("status", "running")
    .lt("started_at", fiveMinAgo)
    .select("id");
  if (staleJobs?.length) console.log(`🧹 Auto-fixed ${staleJobs.length} stale jobs`);

  // Auto-fix stale mining_runs stuck as "running" for over 5 minutes
  const { data: staleRuns } = await supabase
    .from("mining_runs")
    .update({ status: "error", error_message: "Timeout automático: run presa como running por mais de 5 min", finished_at: new Date().toISOString(), duration_ms: 300000 })
    .eq("status", "running")
    .lt("run_date", fiveMinAgo)
    .select("id");
  if (staleRuns?.length) console.log(`🧹 Auto-fixed ${staleRuns.length} stale runs`);

  // Create mining_run record
  const { data: miningRun } = await supabase
    .from("mining_runs")
    .insert({ status: "running" })
    .select("id")
    .single();

  // ============ HELPERS ============
  const PT_WORDS = ["tiktok shop", "produto", "comprei", "viral", "loja", "unboxing", "resenha", "receita", "brasil", "barato", "entrega", "frete", "nota", "avaliação", "afiliado", "vendas", "criador", "shop brasil", "maquiagem", "skincare", "beleza", "cabelo", "como usar", "testei", "aprovado", "top", "dica", "oferta", "promoção", "desconto", "melhor", "chegou", "encomenda", "favorito", "amei", "incrível", "perfeito", "funciona", "vale a pena", "compra", "pedido", "tiktokshopbrasil", "achado", "fy", "fyp"];
  const EN_WORDS = ["buy now", "link in bio", "must have", "game changer", "you need this", "this is amazing", "i found", "best thing", "go get it", "don't miss", "check it out", "shop now", "order now", "love this", "obsessed", "so good", "literally", "honestly", "definitely", "absolutely", "the best", "holy grail", "life changing", "worth it", "highly recommend", "reposting my", "best amazon", "type big", "fold small", "with this", "my neck feels", "foldable bluetooth", "water spray hairbrush"];

  function hasEnglishCaption(caption: string | null): boolean {
    if (!caption) return false;
    const lower = caption.toLowerCase();
    for (const w of EN_WORDS) {
      if (lower.includes(w)) return true;
    }
    const enBasic = ["this", "the", "you", "it's", "i found", "amazing", "perfect", "works", "love", "need", "best", "just", "really", "your"];
    let enBasicCount = 0;
    for (const w of enBasic) {
      if (lower.includes(w)) enBasicCount++;
    }
    if (enBasicCount >= 2 && !/[àáâãçéêíóôõúü]/.test(lower)) {
      if (lower.includes("tiktokshopbrasil") || lower.includes("brasil")) return false;
      return true;
    }
    return false;
  }

  function isBrazilianContent(caption: string | null, author: any): boolean {
    if (!caption) return false;
    if (hasEnglishCaption(caption)) return false;
    const lower = caption.toLowerCase();
    let matches = 0;
    for (const w of PT_WORDS) {
      if (lower.includes(w)) matches++;
      if (matches >= 2) return true;
    }
    const region = (author?.region || "").toLowerCase();
    if (region === "br" || region === "brasil") return matches >= 1;
    return false;
  }

  async function safeFetch(url: string): Promise<any | null> {
    try {
      results.api_calls++;
      const res = await fetch(url, { headers: scHeaders });
      if (!res.ok) {
        console.error(`API ${res.status} for ${url.substring(0, 80)}...`);
        return null;
      }
      return await res.json();
    } catch (e: any) {
      console.error(`Fetch error: ${e.message}`);
      return null;
    }
  }

  function isValidUrl(url: string | null): boolean {
    if (!url) return false;
    try { new URL(url); return true; } catch { return false; }
  }

  async function getOembedThumbnail(tiktokId: string, username?: string | null): Promise<string | null> {
    try {
      const videoUrl = username 
        ? `https://www.tiktok.com/@${username}/video/${tiktokId}`
        : `https://www.tiktok.com/video/${tiktokId}`;
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(oembedUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.thumbnail_url || null;
    } catch {
      return null;
    }
  }

  async function persistThumbnail(originalUrl: string | null, videoId: string, username?: string | null): Promise<string | null> {
    if (Date.now() - globalStart > 45000) return null;
    const urlsToTry: string[] = [];
    if (originalUrl && isValidUrl(originalUrl)) urlsToTry.push(originalUrl);

    for (const srcUrl of urlsToTry) {
      try {
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(srcUrl)}&output=jpg&w=270&h=480&fit=cover&q=60`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(proxyUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) continue;
        const blob = await res.blob();
        if (blob.size < 512) continue;
        const storagePath = `thumbnails/videos/${videoId}.jpeg`;
        const { error: upErr } = await supabase.storage.from("creatives").upload(storagePath, blob, {
          contentType: "image/jpeg", upsert: true,
        });
        if (upErr) continue;
        const { data: publicData } = supabase.storage.from("creatives").getPublicUrl(storagePath);
        return publicData?.publicUrl || null;
      } catch {
        continue;
      }
    }

    const oembedThumb = await getOembedThumbnail(videoId, username);
    if (oembedThumb && isValidUrl(oembedThumb)) {
      try {
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(oembedThumb)}&output=jpg&w=270&h=480&fit=cover&q=60`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(proxyUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size >= 512) {
            const storagePath = `thumbnails/videos/${videoId}.jpeg`;
            const { error: upErr } = await supabase.storage.from("creatives").upload(storagePath, blob, {
              contentType: "image/jpeg", upsert: true,
            });
            if (!upErr) {
              const { data: publicData } = supabase.storage.from("creatives").getPublicUrl(storagePath);
              return publicData?.publicUrl || null;
            }
          }
        }
      } catch { /* oembed fallback also failed */ }
    }

    return null;
  }

  async function batchPersistThumbnails(items: { url: string | null; videoId: string; username?: string | null }[]): Promise<Map<string, string>> {
    const thumbResults = new Map<string, string>();
    const CONCURRENCY = 5;
    for (let i = 0; i < items.length; i += CONCURRENCY) {
      if (Date.now() - globalStart > 45000) {
        console.log(`Time budget reached, persisted ${thumbResults.size}/${items.length} thumbnails`);
        break;
      }
      const batch = items.slice(i, i + CONCURRENCY);
      const promises = batch.map(async ({ url, videoId, username }) => {
        const persisted = await persistThumbnail(url, videoId, username);
        if (persisted) thumbResults.set(videoId, persisted);
      });
      await Promise.all(promises);
    }
    return thumbResults;
  }

  function smoothScore(oldScore: number | null, newScore: number): number {
    if (oldScore == null || oldScore === 0) return newScore;
    // 40% old / 60% new — ranks converge fast enough to reflect fresh data each cycle
    return oldScore * 0.4 + newScore * 0.6;
  }

  // ============ MINE PRODUCTS (INCREMENTAL MERGE) ============
  if (mineType === "all" || mineType === "products") {
    const { data: job } = await supabase
      .from("mining_jobs")
      .insert({ job_type: "products", status: "running", triggered_by: triggeredBy })
      .select("id").single();
    const t0 = Date.now();

    try {
      console.log("Mining products (incremental merge)...");
      // 3 category-specific Portuguese queries per day (rotating by day-of-week)
      // Using PT queries avoids spurious matches like books with "popular" in title
      const PRODUCT_QUERY_SETS: string[][] = [
        ["maquiagem viral", "skincare tiktok", "protetor solar facial"],    // Sun
        ["acessórios moda", "bolsa feminina", "roupa feminina viral"],       // Mon
        ["fone bluetooth", "smartwatch barato", "carregador portátil"],      // Tue
        ["cuidados cabelo", "escova alisadora", "shampoo keratina"],         // Wed
        ["limpeza facial", "creme hidratante", "sérum vitamina c"],          // Thu
        ["cozinha gadget", "air fryer mini", "organizador cozinha"],         // Fri
        ["fitness academia", "suplemento proteína", "roupa esportiva"],      // Sat
      ];
      const daySet = PRODUCT_QUERY_SETS[new Date().getDay()];
      console.log(`Product queries for today: ${daySet.join(", ")}`);

      // Fetch all 3 queries and merge results
      const allRawProducts: any[] = [];
      let anyFetchSucceeded = false;
      for (const productQuery of daySet) {
        const data = await safeFetch(
          `https://api.scrapecreators.com/v1/tiktok/shop/search?query=${encodeURIComponent(productQuery)}&amount=30&region=BR`
        );
        if (data) {
          anyFetchSucceeded = true;
          const items = Array.isArray(data?.products) ? data.products : [];
          allRawProducts.push(...items);
          console.log(`  "${productQuery}": ${items.length} products`);
        } else {
          console.log(`  "${productQuery}": API failed`);
        }
      }

      if (!anyFetchSucceeded) {
        console.log("All product API calls failed. Keeping existing data intact.");
        await supabase.from("mining_jobs").update({
          status: "error", error_message: "API unavailable or no credits",
          finished_at: now, duration_ms: Date.now() - t0,
        }).eq("id", job?.id);
      } else {
        const allProducts = allRawProducts;
        console.log(`Products fetched: ${allProducts.length}`);

        const seen = new Set<string>();
        const unique: any[] = [];
        for (const p of allProducts) {
          const title = (p.title || "").toLowerCase().trim();
          if (!title || seen.has(title)) continue;
          seen.add(title);
          unique.push(p);
        }

        let merged = 0;
        for (const p of unique) {
          let title = (p.title || "Produto sem título").replace(/\s+/g, " ").trim();
          if (title.length > 60) {
            title = title.substring(0, 60).replace(/\s+\S*$/, "").trim();
          }

          const priceInfo = p.product_price_info || p.price_info || {};
          const rawDecimal = parseFloat(priceInfo.sale_price_decimal || "0") || 0;
          const rawOriginal = parseFloat(priceInfo.original_price_decimal || "0") || 0;
          const rawSalePrice = parseFloat(priceInfo.sale_price || "0") || 0;
          const rawOrigPrice = parseFloat(priceInfo.original_price || "0") || 0;
          let price: number | null = null;
          if (rawDecimal > 0) price = rawDecimal / 100;
          else if (rawOriginal > 0) price = rawOriginal / 100;
          else if (rawSalePrice > 0) price = rawSalePrice / 100;
          else if (rawOrigPrice > 0) price = rawOrigPrice / 100;

          const imageUrl = p.image?.url_list?.[0] || p.cover || null;
          const sourceUrl = p.seo_url?.canonical_url || p.product_url || null;
          const shopName = p.seller_info?.shop_name || null;
          const shopLogo = p.seller_info?.shop_logo || null;

          // Extract product_id_external from various API fields
          const productIdExternal = p.product_id || p.id || p.item_id
            || (sourceUrl?.match(/\/pdp\/(\d+)/)?.[1])
            || (sourceUrl?.match(/\/product\/(\d+)/)?.[1])
            || null;
          const commission = parseFloat(p.commission_rate || "0") || 0;
          const sales = parseInt(p.sold_info?.sold_count || p.sold_count || "0") || 0;
          const rating = parseFloat(p.rate_info?.score || "0");
          const reviews = parseInt(p.rate_info?.review_count || p.review_count || "0") || Math.max(Math.floor(sales * 0.03), 0);
          const videoCount = parseInt(p.video_count || "0") || 0;
          const creatorCount = parseInt(p.creator_count || "0") || 0;

          if (!title || title === "produto sem título") continue;

          const dailySales = Math.max(Math.floor(sales / 30), 1);
          const unitsSold7d = Math.floor(sales / 4);
          const revenueToday = Math.floor((price || 50) * dailySales);
          const revenue7d = Math.floor((price || 50) * unitsSold7d);
          const revenue30d = Math.floor((price || 50) * sales);

          const trendData = Array.from({ length: 7 }, (_, i) => ({
            day: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i],
            units: Math.floor(dailySales * (0.7 + Math.random() * 0.6)),
            revenue: Math.floor((price || 50) * dailySales * (0.7 + Math.random() * 0.6)),
          }));

          const newViralScore =
            (unitsSold7d / 5000) * 100 * 0.4 +
            (sales / 5000) * 100 * 0.3 +
            (revenue7d / 500000) * 100 * 0.2 +
            (Math.min(sales > 0 ? (unitsSold7d / (sales / 4.3)) * 100 - 100 : 0, 100) / 100) * 100 * 0.1;

          const growth = newViralScore > 70 ? Math.floor(Math.random() * 60 + 20) : Math.floor(Math.random() * 20);
          const trend = newViralScore > 70 ? "up" : newViralScore > 40 ? "stable" : "down";

          const skus = p.skus || p.sku_list || [];
          const variations = skus.map((sku: any) => ({
            name: sku.title || sku.name || sku.sku_name || "",
            image: sku.cover?.url_list?.[0] || sku.image?.url_list?.[0] || sku.thumb_url || null,
            price: parseFloat(sku.price?.sale_price_decimal || sku.sale_price || "0") || null,
          })).filter((v: any) => v.image);

          const { data: existing } = await supabase
            .from("viral_products")
            .select("id, viral_score, image_url, first_seen_at, units_sold_30d, revenue_30d")
            .eq("title", title)
            .eq("shop_name", shopName || "")
            .limit(1);

          const existingProduct = existing?.[0];

          if (existingProduct) {
            const smoothedScore = smoothScore(existingProduct.viral_score, newViralScore);
            const finalImageUrl = isValidUrl(imageUrl) ? imageUrl : existingProduct.image_url;

            await supabase.from("viral_products").update({
              price, image_url: finalImageUrl,
              trend_direction: trend, growth_rate: growth,
              views: sales * 10, sales,
              engagement_rate: rating || 0,
              source_url: sourceUrl, shop_logo_url: shopLogo,
              commission_rate: commission,
              product_id_external: productIdExternal || undefined,
              units_sold_today: dailySales, units_sold_7d: unitsSold7d,
              units_sold_30d: Math.max(sales, existingProduct.units_sold_30d || 0),
              revenue_today: revenueToday, revenue_7d: revenue7d,
              revenue_30d: Math.max(revenue30d, existingProduct.revenue_30d || 0),
              product_url: sourceUrl, rating: rating || 0, review_count: reviews,
              video_count: videoCount || undefined,
              creator_count: creatorCount || undefined,
              trend_data: trendData, viral_score: smoothedScore,
              last_seen_at: now, scraped_at: now,
              raw_data: p, variations: variations.length > 0 ? variations : [],
            }).eq("id", existingProduct.id);

            console.log(`📦 MERGED product: "${title}" (score: ${smoothedScore.toFixed(1)})`);
          } else {
            await supabase.from("viral_products").insert({
              title, category: shopName, price, image_url: imageUrl,
              trend_direction: trend,
              views: sales * 10, sales, engagement_rate: rating || 0,
              source_url: sourceUrl, shop_name: shopName, shop_logo_url: shopLogo,
              commission_rate: commission,
              product_id_external: productIdExternal || null,
              units_sold_today: dailySales, units_sold_7d: unitsSold7d, units_sold_30d: sales,
              revenue_today: revenueToday, revenue_7d: revenue7d, revenue_30d: revenue30d,
              growth_rate: growth,
              product_url: sourceUrl, rating: rating || 0, review_count: reviews,
              video_count: videoCount || Math.floor(Math.random() * 200 + 10),
              creator_count: creatorCount || Math.floor(Math.random() * 80 + 5),
              trend_data: trendData, country: "BR", is_blacklisted: false,
              scraped_at: now, raw_data: p,
              variations: variations.length > 0 ? variations : [],
              viral_score: newViralScore,
              first_seen_at: now, last_seen_at: now,
            });
            console.log(`📦 NEW product: "${title}" (score: ${newViralScore.toFixed(1)})`);
          }
          merged++;
        }

        // Recalculate rank_position
        const { data: allRanked } = await supabase
          .from("viral_products")
          .select("id, viral_score")
          .eq("is_blacklisted", false)
          .order("viral_score", { ascending: false })
          .limit(100);

        if (allRanked && allRanked.length > 0) {
          const BATCH = 10;
          for (let i = 0; i < allRanked.length; i += BATCH) {
            const batch = allRanked.slice(i, i + BATCH);
            await Promise.all(
              batch.map((item, j) =>
                supabase.from("viral_products")
                  .update({ rank_position: i + j + 1 })
                  .eq("id", item.id)
              )
            );
          }
        }

        // Decay viral_score of products NOT seen in this mining run (2+ days stale)
        // Without decay, old high-score products stay at rank #1 forever even when the API stops returning them
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const { data: staleProducts } = await supabase
          .from("viral_products")
          .select("id, viral_score")
          .eq("is_blacklisted", false)
          .lt("last_seen_at", twoDaysAgo);

        if (staleProducts && staleProducts.length > 0) {
          const DECAY = 0.85; // 15% score reduction per missing cycle
          const DECAY_BATCH = 10;
          for (let i = 0; i < staleProducts.length; i += DECAY_BATCH) {
            const batch = staleProducts.slice(i, i + DECAY_BATCH);
            await Promise.all(batch.map((p) =>
              supabase.from("viral_products")
                .update({ viral_score: Math.max((p.viral_score || 0) * DECAY, 1) })
                .eq("id", p.id)
            ));
          }
          console.log(`📉 Decayed scores for ${staleProducts.length} stale products`);
        }

        // Mark products not seen in 60+ days as blacklisted
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("viral_products")
          .update({ is_blacklisted: true })
          .lt("last_seen_at", sixtyDaysAgo)
          .eq("is_blacklisted", false);

        results.products = merged;
        console.log(`✅ Merged ${results.products} products (incremental, no data loss)`);
        await supabase.from("mining_jobs").update({
          status: "done", records_fetched: results.products,
          finished_at: now, duration_ms: Date.now() - t0,
        }).eq("id", job?.id);

        // ---- SYNC PRODUCT VARIANTS (top 5 per run) ----
        if (Date.now() - globalStart < 40000) {
          try {
            console.log("Syncing product variants...");
            const { data: topProducts } = await supabase
              .from("viral_products")
              .select("id, title, product_url")
              .eq("is_blacklisted", false)
              .order("viral_score", { ascending: false })
              .limit(5);

            let variantsSynced = 0;
            for (const prod of (topProducts || [])) {
              if (Date.now() - globalStart > 50000) break;
              if (!prod.product_url) continue;

              const variantData = await safeFetch(
                `https://api.scrapecreators.com/v1/tiktok/product?url=${encodeURIComponent(prod.product_url)}&region=BR&get_related_videos=false`
              );
              if (!variantData) continue;

              const productInfo = variantData.product_info || variantData;
              const saleProps = productInfo?.sale_props || variantData?.sale_props || [];
              const skus = productInfo?.skus || variantData?.skus || [];

              const variants: { label: string; image_url: string | null; is_default: boolean }[] = [];
              const primaryProp = saleProps.find((sp: any) => sp.has_image) || saleProps[0];

              if (primaryProp?.sale_prop_values?.length > 0) {
                for (let i = 0; i < primaryProp.sale_prop_values.length; i++) {
                  const val = primaryProp.sale_prop_values[i];
                  variants.push({
                    label: val.prop_value || `Variante ${i + 1}`,
                    image_url: val.image?.url_list?.[0] || val.image?.thumb_url_list?.[0] || null,
                    is_default: i === 0,
                  });
                }
              }

              if (variants.length === 0 && skus.length > 0) {
                for (let i = 0; i < skus.length; i++) {
                  const sku = skus[i];
                  const label = (sku.sku_sale_props || []).map((p: any) => p.prop_value).join(" / ") || `SKU ${i + 1}`;
                  variants.push({ label, image_url: null, is_default: i === 0 });
                }
              }

              if (variants.length === 0) {
                const productImage = productInfo?.product_base?.images?.[0]?.url_list?.[0] || null;
                variants.push({ label: "Padrão", image_url: productImage, is_default: true });
              }

              await supabase.from("product_variants").delete().eq("product_id", prod.id);
              const insertData = variants.map((v) => ({
                product_id: prod.id,
                variant_label: v.label,
                variant_image_url: v.image_url,
                is_default: v.is_default,
              }));
              await supabase.from("product_variants").insert(insertData);

              const variationsJson = variants.map(v => ({ name: v.label, image: v.image_url }));
              await supabase.from("viral_products").update({ variations: variationsJson }).eq("id", prod.id);

              variantsSynced += variants.length;
              console.log(`🎨 Variants synced for "${prod.title}": ${variants.length}`);
              await new Promise(r => setTimeout(r, 200));
            }
            console.log(`✅ Total variants synced: ${variantsSynced}`);
          } catch (e: any) {
            console.error("Variant sync error:", e.message);
          }
        }
      }
    } catch (e: any) {
      console.error("Products error:", e.message);
      await supabase.from("mining_jobs").update({
        status: "error", error_message: e.message,
        finished_at: now, duration_ms: Date.now() - t0,
      }).eq("id", job?.id);
    }
  }

  // ============ MINE PRODUCT VIDEOS (INCREMENTAL) ============
  if (mineType === "all" || mineType === "products") {
    try {
      const { data: products } = await supabase
        .from("viral_products")
        .select("id, title, price, product_url, product_id_external, image_url")
        .eq("is_blacklisted", false)
        .order("viral_score", { ascending: false })
        .limit(25);

      if (products && products.length > 0) {
        console.log(`Mining videos for ${products.length} products...`);
        let totalProductVideos = 0;
        const allThumbsToUpload: { url: string | null; videoId: string; dbId: string; username?: string | null }[] = [];

        for (const product of products) {
          const keywords = product.title
            .split(/\s+/)
            .filter((w: string) => w.length > 3)
            .slice(0, 3)
            .join(" ");
          if (!keywords) continue;

          const searchQuery = `tiktok shop ${keywords}`;
          const data = await safeFetch(
            `https://api.scrapecreators.com/v1/tiktok/search/keyword?query=${encodeURIComponent(searchQuery)}&region=BR`
          );
          if (!data) continue;

          const items = Array.isArray(data?.search_item_list) ? data.search_item_list : [];
          const scored = items.map((item: any) => {
            const aweme = item?.aweme_info || item;
            const stats = aweme?.statistics || {};
            const views = parseInt(stats.play_count || aweme?.play_count || "0") || 0;
            const likes = parseInt(stats.digg_count || aweme?.digg_count || "0") || 0;
            const shares = parseInt(stats.share_count || aweme?.share_count || "0") || 0;
            const comments = parseInt(stats.comment_count || aweme?.comment_count || "0") || 0;
            const revenue = Math.floor(views * 0.0015 * (product.price || 59.9));
            return { aweme, views, likes, shares, comments, revenue };
          });
          scored.sort((a: any, b: any) => b.revenue - a.revenue);

          for (const { aweme, views, likes, shares, comments } of scored.slice(0, 5)) {
            const author = aweme?.author || {};
            const creatorUsername = author?.unique_id || author?.nickname || null;
            const videoId = aweme?.aweme_id || aweme?.id || "";
            if (!videoId) continue;

            const caption = aweme?.desc || aweme?.title || null;
            if (hasEnglishCaption(caption)) {
              console.log(`⏭️ Skipping English video: ${videoId}`);
              continue;
            }

            const videoUrl = creatorUsername && videoId ? `https://www.tiktok.com/@${creatorUsername}/video/${videoId}` : null;
            const cover = aweme?.video?.cover?.url_list?.[0] || aweme?.video?.dynamic_cover?.url_list?.[0] || null;
            const duration = Math.floor((parseInt(aweme?.video?.duration || "0") || 0) / 1000);

            const salesEstimated = Math.max(Math.floor(views * 0.001 + comments * 0.02 + shares * 0.03), 1);
            const revenueEstimated = salesEstimated * (product.price || 59.9);

            const { data: existingVideo } = await supabase
              .from("viral_videos")
              .select("id, thumbnail_url")
              .eq("tiktok_id", videoId)
              .limit(1);

            if (existingVideo?.[0]) {
              await supabase.from("viral_videos").update({
                views, likes, shares, comments,
                product_title: product.title,
                product_shop_url: product.product_url || null,
                product_price: product.price || null,
                product_image_url: product.image_url || null,
                product_sales: salesEstimated, product_revenue: revenueEstimated,
                sales_estimated: salesEstimated, revenue_estimated: revenueEstimated,
                last_seen_at: now, scraped_at: now,
              }).eq("id", existingVideo[0].id);
              if (!existingVideo[0].thumbnail_url?.includes("supabase.co")) {
                allThumbsToUpload.push({ url: cover, videoId, dbId: existingVideo[0].id, username: creatorUsername });
              }
            } else {
              const { data: inserted } = await supabase.from("viral_videos").insert({
                video_url: videoUrl, thumbnail_url: cover, caption,
                views, likes, shares, comments, duration, region: "BR",
                tiktok_id: videoId, creator_username: creatorUsername,
                product_title: product.title,
                product_shop_url: product.product_url || null,
                product_price: product.price || null,
                product_image_url: product.image_url || null,
                product_sales: salesEstimated, product_revenue: revenueEstimated,
                sales_estimated: salesEstimated, revenue_estimated: revenueEstimated,
                scraped_at: now, first_seen_at: now, last_seen_at: now,
              }).select("id").single();
              if (inserted) allThumbsToUpload.push({ url: cover, videoId, dbId: inserted.id, username: creatorUsername });
            }
            totalProductVideos++;
          }
        }

        if (allThumbsToUpload.length > 0) {
          console.log(`Persisting ${allThumbsToUpload.length} product video thumbnails...`);
          const thumbMap = await batchPersistThumbnails(allThumbsToUpload.map(t => ({ url: t.url, videoId: t.videoId, username: t.username })));
          for (const t of allThumbsToUpload) {
            const persisted = thumbMap.get(t.videoId);
            if (persisted) {
              await supabase.from("viral_videos").update({ thumbnail_url: persisted }).eq("id", t.dbId);
            }
          }
          console.log(`Persisted ${thumbMap.size}/${allThumbsToUpload.length} product video thumbnails`);
        }

        console.log(`Merged ${totalProductVideos} product-specific videos`);
      }
    } catch (e: any) {
      console.error("Product videos mining error:", e.message);
    }
  }

  // ============ MINE VIDEOS + CREATORS (INCREMENTAL MERGE) ============
  if (mineType === "all" || mineType === "videos" || mineType === "creators") {
    const mineVideos = mineType === "all" || mineType === "videos";
    const mineCreators = mineType === "all" || mineType === "creators";

    const videoJob = mineVideos ? (await supabase.from("mining_jobs")
      .insert({ job_type: "videos", status: "running", triggered_by: triggeredBy })
      .select("id").single()).data : null;
    const creatorJob = mineCreators ? (await supabase.from("mining_jobs")
      .insert({ job_type: "creators", status: "running", triggered_by: triggeredBy })
      .select("id").single()).data : null;
    const t0 = Date.now();

    try {
      const seenVideoIds = new Set<string>();
      const seenCreatorUsernames = new Set<string>();
      const allVideoData: any[] = [];
      const allCreatorsData: any[] = [];

      // 4th query rotates daily so each run discovers different content
      const EXTRA_VIDEO_QUERIES = [
        "unboxing tiktok shop brasil",
        "testei produto tiktok shop",
        "compra do tiktok shop chegou",
        "produto barato tiktok shop",
        "maquiagem tiktok shop brasil",
        "skincare tiktok shop brasil",
        "beleza tiktok shop brasil",
      ];
      const rotatingQuery = EXTRA_VIDEO_QUERIES[new Date().getDay() % EXTRA_VIDEO_QUERIES.length];
      const queries = [
        "tiktok shop brasil produto",
        "tiktokshopbrasil comprei",
        "produto viral tiktok shop",
        rotatingQuery,
      ];
      console.log(`Video rotating query: "${rotatingQuery}"`);

      for (const query of queries) {
        console.log(`Searching: "${query}"`);
        const data = await safeFetch(
          `https://api.scrapecreators.com/v1/tiktok/search/keyword?query=${encodeURIComponent(query)}&region=BR`
        );
        if (!data) continue;

        const items = Array.isArray(data?.search_item_list) ? data.search_item_list : [];
        console.log(`Got ${items.length} results for "${query}"`);

        for (const item of items) {
          const aweme = item?.aweme_info || item;
          const videoId = aweme?.aweme_id || aweme?.id || "";
          const caption = aweme?.desc || aweme?.title || "";
          const author = aweme?.author || {};

          if (!isBrazilianContent(caption, author)) continue;

          if (mineVideos && videoId && !seenVideoIds.has(videoId)) {
            seenVideoIds.add(videoId);
            allVideoData.push(aweme);
          }

          if (mineCreators) {
            const username = author?.unique_id || author?.nickname || "";
            if (username && !seenCreatorUsernames.has(username.toLowerCase())) {
              seenCreatorUsernames.add(username.toLowerCase());
              const stats = aweme?.statistics || {};
              const views = parseInt(stats.play_count || aweme?.play_count || "0") || 0;
              const likes = parseInt(stats.digg_count || aweme?.digg_count || "0") || 0;
              const followers = parseInt(author?.follower_count || "0") || 0;
              const avatarUrl = author?.avatar_larger?.url_list?.[0] || author?.avatar_medium?.url_list?.[0] || author?.avatar_thumb?.url_list?.[0] || null;
              const engagementRate = views > 0 ? ((likes) / views) * 100 : 0;

              allCreatorsData.push({
                username,
                display_name: author?.nickname || username,
                avatar_url: avatarUrl,
                followers,
                avg_views: views,
                engagement_rate: Math.round(engagementRate * 10) / 10,
                niche: "TikTok Shop BR",
                profile_url: `https://www.tiktok.com/@${username}`,
                projected_revenue: Math.floor(views * 0.001 * 45),
              });
            }
          }
        }
      }

      // ---- Process Videos (INCREMENTAL) ----
      if (mineVideos) {
        console.log(`Total unique BR videos: ${allVideoData.length}`);

        const scoredVideos = allVideoData.map(aweme => {
          const stats = aweme?.statistics || {};
          const views = parseInt(stats.play_count || aweme?.play_count || "0") || 0;
          const likes = parseInt(stats.digg_count || aweme?.digg_count || "0") || 0;
          const shares = parseInt(stats.share_count || aweme?.share_count || "0") || 0;
          const comments = parseInt(stats.comment_count || aweme?.comment_count || "0") || 0;

          const salesEstimated = Math.max(Math.floor(views * 0.001 + comments * 0.02 + shares * 0.03), 1);
          const revenueEstimated = salesEstimated * 59.9;

          const viralScore =
            (views / 5000000) * 100 * 0.3 +
            (likes / 500000) * 100 * 0.2 +
            (comments / 50000) * 100 * 0.1 +
            (shares / 50000) * 100 * 0.1 +
            (salesEstimated / 5000) * 100 * 0.3;

          return { aweme, views, likes, shares, comments, salesEstimated, revenueEstimated, viralScore };
        });

        scoredVideos.sort((a, b) => b.viralScore - a.viralScore);
        const top40 = scoredVideos.slice(0, 40);

        let total = 0;
        const thumbsToUpload: { url: string | null; videoId: string; dbId: string; username?: string | null }[] = [];

        for (const { aweme, views, likes, shares, comments, salesEstimated, revenueEstimated, viralScore } of top40) {
          const author = aweme?.author || {};
          const creatorUsername = author?.unique_id || author?.nickname || null;
          const videoId = aweme?.aweme_id || aweme?.id || "";
          if (!videoId) continue;

          const videoUrl = aweme?.url || (creatorUsername && videoId ? `https://www.tiktok.com/@${creatorUsername}/video/${videoId}` : null);
          const cover = aweme?.video?.cover?.url_list?.[0] || aweme?.video?.dynamic_cover?.url_list?.[0] || aweme?.video?.origin_cover?.url_list?.[0] || null;
          const videoCaption = aweme?.desc || aweme?.title || null;
          const duration = Math.floor((parseInt(aweme?.video?.duration || aweme?.duration || "0") || 0) / 1000);

          const { data: existingVideo } = await supabase
            .from("viral_videos")
            .select("id, viral_score, thumbnail_url")
            .eq("tiktok_id", videoId)
            .limit(1);

          if (existingVideo?.[0]) {
            const smoothedScore = smoothScore(existingVideo[0].viral_score, viralScore);
            await supabase.from("viral_videos").update({
              views, likes, shares, comments,
              product_sales: salesEstimated, product_revenue: revenueEstimated,
              sales_estimated: salesEstimated, revenue_estimated: revenueEstimated,
              viral_score: smoothedScore,
              last_seen_at: now, scraped_at: now,
            }).eq("id", existingVideo[0].id);
            if (!existingVideo[0].thumbnail_url?.includes("supabase.co")) {
              thumbsToUpload.push({ url: cover, videoId, dbId: existingVideo[0].id, username: creatorUsername });
            }
          } else {
            const { data: inserted } = await supabase.from("viral_videos").insert({
              video_url: videoUrl, thumbnail_url: cover, caption: videoCaption,
              views, likes, shares, comments, duration, region: "BR",
              tiktok_id: videoId, creator_username: creatorUsername,
              product_sales: salesEstimated, product_revenue: revenueEstimated,
              sales_estimated: salesEstimated, revenue_estimated: revenueEstimated,
              viral_score: viralScore,
              scraped_at: now, first_seen_at: now, last_seen_at: now,
            }).select("id").single();
            if (inserted) thumbsToUpload.push({ url: cover, videoId, dbId: inserted.id, username: creatorUsername });
          }
          total++;
        }

        if (thumbsToUpload.length > 0) {
          console.log(`Persisting ${thumbsToUpload.length} video thumbnails...`);
          const thumbMap = await batchPersistThumbnails(thumbsToUpload.map(t => ({ url: t.url, videoId: t.videoId, username: t.username })));
          for (const t of thumbsToUpload) {
            const persisted = thumbMap.get(t.videoId);
            if (persisted) {
              await supabase.from("viral_videos").update({ thumbnail_url: persisted }).eq("id", t.dbId);
            }
          }
          console.log(`Persisted ${thumbMap.size}/${thumbsToUpload.length} video thumbnails`);
        }

        results.videos = total;

        // Decay scores for videos not refreshed in 2+ days
        const twoDaysAgoV = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const { data: staleVideos } = await supabase
          .from("viral_videos")
          .select("id, viral_score")
          .lt("last_seen_at", twoDaysAgoV);
        if (staleVideos && staleVideos.length > 0) {
          for (let i = 0; i < staleVideos.length; i += 10) {
            const batch = staleVideos.slice(i, i + 10);
            await Promise.all(batch.map((v) =>
              supabase.from("viral_videos")
                .update({ viral_score: Math.max((v.viral_score || 0) * 0.85, 0.5) })
                .eq("id", v.id)
            ));
          }
          console.log(`📉 Decayed scores for ${staleVideos.length} stale videos`);
        }

        console.log(`✅ Merged ${results.videos} BR viral videos`);
        await supabase.from("mining_jobs").update({
          status: "done", records_fetched: results.videos,
          finished_at: now, duration_ms: Date.now() - t0,
        }).eq("id", videoJob?.id);
      }

      // ---- Process Creators (INCREMENTAL MERGE) ----
      if (mineCreators) {
        console.log(`Creators extracted: ${allCreatorsData.length}`);
        allCreatorsData.sort((a, b) => b.projected_revenue - a.projected_revenue);
        const top15 = allCreatorsData.slice(0, 15);

        for (const c of top15) {
          let uploaded = false;
          if (c.avatar_url) {
            try {
              const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(c.avatar_url)}&output=jpg&w=256&h=256&fit=cover&q=85`;
              const avatarRes = await fetch(proxyUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
              if (avatarRes.ok) {
                const contentType = (avatarRes.headers.get("content-type") || "").toLowerCase();
                const blob = await avatarRes.blob();
                if (blob.size > 512 && (contentType.includes("jpeg") || contentType.includes("jpg") || contentType.includes("png") || contentType.includes("webp"))) {
                  const storagePath = `avatars/creators/${c.username.toLowerCase()}.jpeg`;
                  const { error: upErr } = await supabase.storage.from("creatives").upload(storagePath, blob, {
                    contentType: "image/jpeg", upsert: true,
                  });
                  if (!upErr) {
                    const { data: publicData } = supabase.storage.from("creatives").getPublicUrl(storagePath);
                    c.avatar_url = publicData?.publicUrl || c.avatar_url;
                    uploaded = true;
                  }
                }
              }
            } catch (e: any) {
              console.error(`Avatar error @${c.username}:`, e.message);
            }
          }
          if (!uploaded && !isValidUrl(c.avatar_url)) {
            c.avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.display_name || c.username)}&background=E01393&color=fff&size=128&bold=true&format=svg`;
          }
        }

        for (const c of top15) {
          const { data: existingCreator } = await supabase
            .from("viral_creators")
            .select("id, viral_score, avatar_url, projected_revenue, total_sales_estimated, total_revenue_estimated")
            .eq("username", c.username)
            .limit(1);

          const newCreatorScore =
            (c.projected_revenue / 50000) * 100 * 0.5 +
            (c.avg_views * 0.001 / 100) * 100 * 0.3 +
            (c.engagement_rate / 5) * 100 * 0.2;

          if (existingCreator?.[0]) {
            const existing = existingCreator[0];
            const smoothedScore = smoothScore(existing.viral_score, newCreatorScore);
            const bestAvatar = c.avatar_url?.includes("supabase.co")
              ? c.avatar_url
              : (existing.avatar_url?.includes("supabase.co") ? existing.avatar_url : c.avatar_url);

            await supabase.from("viral_creators").update({
              display_name: c.display_name,
              avatar_url: bestAvatar,
              followers: c.followers,
              avg_views: c.avg_views,
              engagement_rate: c.engagement_rate,
              projected_revenue: Math.max(c.projected_revenue, Number(existing.projected_revenue) || 0),
              total_sales_estimated: (Number(existing.total_sales_estimated) || 0) + Math.floor(c.avg_views * 0.001),
              total_revenue_estimated: (Number(existing.total_revenue_estimated) || 0) + c.projected_revenue,
              viral_score: smoothedScore,
              last_seen_at: now, scraped_at: now,
            }).eq("id", existing.id);
            console.log(`👤 MERGED creator: @${c.username} (score: ${smoothedScore.toFixed(1)})`);
          } else {
            await supabase.from("viral_creators").insert({
              username: c.username,
              display_name: c.display_name,
              avatar_url: c.avatar_url,
              followers: c.followers,
              avg_views: c.avg_views,
              engagement_rate: c.engagement_rate,
              niche: c.niche,
              profile_url: c.profile_url,
              projected_revenue: c.projected_revenue,
              total_sales_estimated: Math.floor(c.avg_views * 0.001),
              total_revenue_estimated: c.projected_revenue,
              viral_score: newCreatorScore,
              first_seen_at: now, last_seen_at: now, scraped_at: now,
            });
            console.log(`👤 NEW creator: @${c.username} (score: ${newCreatorScore.toFixed(1)})`);
          }
          results.creators++;
        }

        // Decay scores for creators not refreshed in 2+ days
        const twoDaysAgoC = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const { data: staleCreators } = await supabase
          .from("viral_creators")
          .select("id, viral_score")
          .lt("last_seen_at", twoDaysAgoC);
        if (staleCreators && staleCreators.length > 0) {
          for (let i = 0; i < staleCreators.length; i += 10) {
            const batch = staleCreators.slice(i, i + 10);
            await Promise.all(batch.map((c) =>
              supabase.from("viral_creators")
                .update({ viral_score: Math.max((c.viral_score || 0) * 0.85, 0.5) })
                .eq("id", c.id)
            ));
          }
          console.log(`📉 Decayed scores for ${staleCreators.length} stale creators`);
        }

        console.log(`✅ Merged ${results.creators} BR creators`);
        await supabase.from("mining_jobs").update({
          status: "done", records_fetched: results.creators,
          finished_at: now, duration_ms: Date.now() - t0,
        }).eq("id", creatorJob?.id);
      }
    } catch (e: any) {
      console.error("Videos/Creators error:", e.message);
      if (mineVideos) {
        await supabase.from("mining_jobs").update({
          status: "error", error_message: e.message,
          finished_at: now, duration_ms: Date.now() - t0,
        }).eq("id", videoJob?.id);
      }
      if (mineCreators) {
        await supabase.from("mining_jobs").update({
          status: "error", error_message: e.message,
          finished_at: now, duration_ms: Date.now() - t0,
        }).eq("id", creatorJob?.id);
      }
    }
  }

  // Update mining_run
  await supabase.from("mining_runs").update({
    status: "done",
    products_fetched: results.products,
    videos_fetched: results.videos,
    creators_fetched: results.creators,
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - globalStart,
  }).eq("id", miningRun?.id);

  console.log(`Mining complete in ${Date.now() - globalStart}ms:`, results);

  // Auto-trigger thumbnail migration after complete mining
  if (mineType === "all" || mineType === "videos") {
    try {
      console.log("🖼️ Auto-triggering thumbnail migration...");
      const migrationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/migrate-thumbnails`;
      const migRes = await fetch(migrationUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
      });
      if (migRes.ok) {
        const migData = await migRes.json();
        console.log(`🖼️ Thumbnail migration done: migrated=${migData?.migrated || 0}, remaining=${migData?.remaining || 0}`);
      } else {
        console.error(`🖼️ Thumbnail migration failed: ${migRes.status}`);
      }
    } catch (e: any) {
      console.error(`🖼️ Thumbnail migration error: ${e.message}`);
    }
  }

  return new Response(
    JSON.stringify({ success: true, ...results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
