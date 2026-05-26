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

  // Auth check - admin only (required)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
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

  try {
  const apiKey = Deno.env.get("SCRAPECREATORS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SCRAPECREATORS_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let productId: string | null = null;
  let batchSize = 5;
  let offset = 0;
  try {
    const body = await req.json();
    productId = body?.product_id || null;
    batchSize = body?.batch_size || 5;
    offset = body?.offset || 0;
  } catch { /* no body */ }

  // Get products to sync
  let query = supabase
    .from("viral_products")
    .select("id, title, product_url, product_id_external")
    .eq("is_blacklisted", false)
    .order("viral_score", { ascending: false });

  if (productId) {
    query = query.eq("id", productId);
  } else {
    query = query.range(offset, offset + batchSize - 1);
  }

  const { data: products, error: prodErr } = await query;
  if (prodErr || !products?.length) {
    return new Response(JSON.stringify({ error: "No products found", details: prodErr?.message }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: { product: string; variants_synced: number; error?: string }[] = [];
  let totalApiCalls = 0;

  for (const product of products) {
    if (!product.product_url) {
      results.push({ product: product.title, variants_synced: 0, error: "No product_url" });
      continue;
    }

    try {
      // Fetch product details from ScrapeCreators
      const url = `https://api.scrapecreators.com/v1/tiktok/product?url=${encodeURIComponent(product.product_url)}&region=BR&get_related_videos=false`;
      totalApiCalls++;
      
      const res = await fetch(url, { headers: { "x-api-key": apiKey } });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`API ${res.status} for "${product.title}": ${errText.substring(0, 200)}`);
        results.push({ product: product.title, variants_synced: 0, error: `API ${res.status}` });
        continue;
      }

      const data = await res.json();
      
      // Debug: log key fields
      const productInfo = data.product_info || data;
      const saleProps = productInfo?.sale_props || data?.sale_props || [];
      const skus = productInfo?.skus || data?.skus || [];
      
      console.log(`🔍 "${product.title}": sale_props=${saleProps.length}, skus=${skus.length}, keys=${Object.keys(data).slice(0, 10).join(",")}`);
      if (saleProps.length > 0) {
        console.log(`   sale_props[0]: prop_name=${saleProps[0].prop_name}, values=${saleProps[0].sale_prop_values?.length || 0}`);
      }
      if (skus.length > 0) {
        console.log(`   skus[0] props: ${JSON.stringify(skus[0].sku_sale_props || []).substring(0, 200)}`);
      }

      // Extract variants from sale_props (the ones with images are color/model variants)
      const variants: { label: string; image_url: string | null; is_default: boolean }[] = [];

      // Find the primary sale prop (usually Color or the one with images)
      const primaryProp = saleProps.find((sp: any) => sp.has_image) || saleProps[0];

      if (primaryProp && primaryProp.sale_prop_values?.length > 0) {
        for (let i = 0; i < primaryProp.sale_prop_values.length; i++) {
          const val = primaryProp.sale_prop_values[i];
          const imageUrl = val.image?.url_list?.[0] || val.image?.thumb_url_list?.[0] || null;
          variants.push({
            label: val.prop_value || `Variante ${i + 1}`,
            image_url: imageUrl,
            is_default: i === 0,
          });
        }
      }

      // If no sale_props variants found, try extracting from SKUs directly
      if (variants.length === 0 && skus.length > 0) {
        for (let i = 0; i < skus.length; i++) {
          const sku = skus[i];
          const skuProps = sku.sku_sale_props || [];
          const label = skuProps.map((p: any) => p.prop_value).join(" / ") || `SKU ${i + 1}`;
          variants.push({
            label,
            image_url: null,
            is_default: i === 0,
          });
        }
      }

      // If still no variants, create a single "Padrão" variant with product image
      if (variants.length === 0) {
        const productImage = productInfo?.product_base?.images?.[0]?.url_list?.[0] || null;
        variants.push({
          label: "Padrão",
          image_url: productImage,
          is_default: true,
        });
      }

      // Delete existing variants for this product
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", product.id);

      // Insert new real variants
      const insertData = variants.map((v) => ({
        product_id: product.id,
        variant_label: v.label,
        variant_image_url: v.image_url,
        is_default: v.is_default,
      }));

      const { error: insertErr } = await supabase
        .from("product_variants")
        .insert(insertData);

      if (insertErr) {
        console.error(`Insert error for "${product.title}":`, insertErr);
        results.push({ product: product.title, variants_synced: 0, error: insertErr.message });
      } else {
        // Also update the variations field on viral_products
        const variationsJson = variants.map(v => ({
          name: v.label,
          image: v.image_url,
        }));
        await supabase
          .from("viral_products")
          .update({ variations: variationsJson })
          .eq("id", product.id);

        console.log(`✅ "${product.title}": ${variants.length} variants synced (${variants.map(v => v.label).join(", ")})`);
        results.push({ product: product.title, variants_synced: variants.length });
      }

      // Rate limit: wait 200ms between API calls
      await new Promise(r => setTimeout(r, 200));

    } catch (e: any) {
      console.error(`Error for "${product.title}":`, e.message);
      results.push({ product: product.title, variants_synced: 0, error: e.message });
    }
  }

  const totalSynced = results.reduce((s, r) => s + r.variants_synced, 0);

  return new Response(JSON.stringify({
    success: true,
    api_calls: totalApiCalls,
    products_processed: results.length,
    total_variants_synced: totalSynced,
    details: results,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  } catch (error: any) {
    console.error("sync-product-variants error:", error.message);
    return new Response(JSON.stringify({ error: "Erro interno ao sincronizar variantes" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
