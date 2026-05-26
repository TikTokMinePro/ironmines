import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Portrait prompts: clean, studio, front-facing for best InstantID compatibility
const PORTRAIT_PROMPT_TEMPLATE = (description: string, gender: string) =>
  `Professional studio headshot photograph of a ${description}. ` +
  `${gender === "male" ? "He" : "She"} is looking directly at the camera with a natural, confident expression. ` +
  `Clean white studio background, soft professional lighting, sharp focus on face, ` +
  `ultra-realistic commercial portrait, 8k resolution, photorealistic, ` +
  `no glasses, no hat, full face visible, shoulders included, neutral background, ` +
  `high detail skin texture, natural makeup, no filters, raw photo quality`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth — require service role or admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const falKey = Deno.env.get("FAL_AI_API_KEY");
    if (!falKey) throw new Error("FAL_AI_API_KEY not configured");

    // Fetch all active avatars
    const { data: avatars, error: avatarsError } = await supabaseAdmin
      .from("avatars")
      .select("id, name, gender, ethnicity, prompt_base, consistency_prompt");

    if (avatarsError) throw avatarsError;
    if (!avatars || avatars.length === 0) {
      return new Response(JSON.stringify({ error: "No avatars found" }), { status: 404, headers: corsHeaders });
    }

    console.log(`Generating canonical portraits for ${avatars.length} avatars...`);

    const results: { name: string; status: string; url?: string; error?: string }[] = [];

    for (const avatar of avatars) {
      console.log(`\n=== Generating portrait for ${avatar.name} ===`);

      try {
        const genderLabel = avatar.gender === "male" || avatar.gender === "man" ? "man" : "woman";
        const description = [
          avatar.prompt_base,
          avatar.consistency_prompt ? avatar.consistency_prompt.replace(/CRITICAL IDENTITY:/gi, "").trim() : null,
        ].filter(Boolean).join(", ").substring(0, 300);

        const prompt = PORTRAIT_PROMPT_TEMPLATE(description, genderLabel);
        console.log(`Prompt: ${prompt.substring(0, 200)}...`);

        // Fixed seed per avatar for reproducibility (hash of avatar ID)
        const seedStr = avatar.id.replace(/-/g, "").substring(0, 8);
        const seed = parseInt(seedStr, 16) % 9999999;

        // Generate with flux-dev for high quality canonical portrait
        // NOTE: flux/dev does NOT support negative_prompt — omit it
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        let falResponse: Response;
        try {
          falResponse = await fetch("https://fal.run/fal-ai/flux/dev", {
            method: "POST",
            headers: {
              "Authorization": `Key ${falKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              seed,
              num_inference_steps: 28,
              guidance_scale: 8.0,
              image_size: "portrait_4_3",
              num_images: 1,
              enable_safety_checker: true,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!falResponse.ok) {
          const errText = await falResponse.text();
          console.error(`FAL error for ${avatar.name}: ${falResponse.status} ${errText}`);
          results.push({ name: avatar.name, status: "error", error: `FAL ${falResponse.status}: ${errText.substring(0, 200)}` });
          continue;
        }

        const falData = await falResponse.json();
        const generatedUrl = falData.images?.[0]?.url;
        if (!generatedUrl) {
          results.push({ name: avatar.name, status: "error", error: "No image URL in response" });
          continue;
        }

        // Download the generated image
        const imgRes = await fetch(generatedUrl);
        if (!imgRes.ok) {
          results.push({ name: avatar.name, status: "error", error: "Failed to download image" });
          continue;
        }
        const imgBuffer = await imgRes.arrayBuffer();

        // Upload to Supabase Storage: avatars/canonical/{avatar.id}.jpg
        const storagePath = `canonical/${avatar.id}.jpg`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from("avatars")
          .upload(storagePath, imgBuffer, { contentType: "image/jpeg", upsert: true });

        if (uploadError) {
          console.error(`Storage upload error for ${avatar.name}: ${uploadError.message}`);
          results.push({ name: avatar.name, status: "error", error: uploadError.message });
          continue;
        }

        const { data: { publicUrl } } = supabaseAdmin.storage.from("avatars").getPublicUrl(storagePath);
        console.log(`Uploaded canonical portrait for ${avatar.name}: ${publicUrl}`);

        // Update the avatar's reference_images with the canonical portrait as first item
        const { error: updateError } = await supabaseAdmin
          .from("avatars")
          .update({ reference_images: [publicUrl] })
          .eq("id", avatar.id);

        if (updateError) {
          console.error(`DB update error for ${avatar.name}: ${updateError.message}`);
          results.push({ name: avatar.name, status: "uploaded_but_db_error", url: publicUrl, error: updateError.message });
          continue;
        }

        console.log(`✅ ${avatar.name} done`);
        results.push({ name: avatar.name, status: "success", url: publicUrl });

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));

      } catch (err: any) {
        console.error(`Error processing ${avatar.name}: ${err.message}`);
        results.push({ name: avatar.name, status: "error", error: err.message });
      }
    }

    const succeeded = results.filter(r => r.status === "success").length;
    const failed = results.filter(r => r.status === "error").length;

    console.log(`\n=== DONE: ${succeeded} succeeded, ${failed} failed ===`);

    return new Response(
      JSON.stringify({ success: true, total: avatars.length, succeeded, failed, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("generate-avatar-portraits error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
