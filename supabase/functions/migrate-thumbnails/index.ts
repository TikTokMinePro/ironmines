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

  // Auth check - admin only
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const startTime = Date.now();
  let migrated = 0;
  let failed = 0;
  let oembedRecovered = 0;

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

  async function tryUploadFromUrl(url: string, videoId: string): Promise<string | null> {
    try {
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&w=360&h=640&fit=cover&q=70`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(proxyUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const blob = await res.blob();
      if (blob.size < 512) return null;
      const storagePath = `thumbnails/videos/${videoId}.jpeg`;
      const { error: upErr } = await supabase.storage.from("creatives").upload(storagePath, blob, {
        contentType: "image/jpeg", upsert: true,
      });
      if (upErr) return null;
      const { data: publicData } = supabase.storage.from("creatives").getPublicUrl(storagePath);
      return publicData?.publicUrl || null;
    } catch {
      return null;
    }
  }

  try {
    console.log("Starting thumbnail migration (null + expired CDN)...");

    // Phase 1: Videos with NULL thumbnails
    const { data: nullVideos, error: err1 } = await supabase
      .from("viral_videos")
      .select("id, tiktok_id, thumbnail_url, creator_username")
      .is("thumbnail_url", null)
      .limit(30);

    // Phase 2: Videos with non-persisted thumbnails (expired CDN URLs)
    const { data: expiredVideos, error: err2 } = await supabase
      .from("viral_videos")
      .select("id, tiktok_id, thumbnail_url, creator_username")
      .not("thumbnail_url", "is", null)
      .not("thumbnail_url", "like", `%${supabaseUrl.replace("https://", "")}%`)
      .limit(30);

    if (err1) console.error("Query null error:", err1.message);
    if (err2) console.error("Query expired error:", err2.message);

    const videos = [...(nullVideos || []), ...(expiredVideos || [])];
    console.log(`Found ${nullVideos?.length || 0} null + ${expiredVideos?.length || 0} expired = ${videos.length} total`);

    if (videos.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "All thumbnails already persisted", migrated: 0, remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const CONCURRENCY = 5;
    for (let i = 0; i < videos.length; i += CONCURRENCY) {
      if (Date.now() - startTime > 50000) {
        console.log(`Time budget reached after ${migrated} migrations`);
        break;
      }

      const batch = videos.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map(async (video) => {
        const videoId = video.tiktok_id || video.id;

        // Step 1: Try original/existing URL via proxy (might work for some CDN URLs)
        if (video.thumbnail_url) {
          const result = await tryUploadFromUrl(video.thumbnail_url, videoId);
          if (result) {
            await supabase.from("viral_videos").update({ thumbnail_url: result }).eq("id", video.id);
            migrated++;
            return;
          }
        }

        // Step 2: Try TikTok oembed API
        if (video.tiktok_id) {
          const oembedThumb = await getOembedThumbnail(video.tiktok_id, video.creator_username);
          if (oembedThumb) {
            const result = await tryUploadFromUrl(oembedThumb, videoId);
            if (result) {
              await supabase.from("viral_videos").update({ thumbnail_url: result }).eq("id", video.id);
              migrated++;
              oembedRecovered++;
              console.log(`✅ Recovered via oembed: ${videoId}`);
              return;
            }
          }
        }

        // Step 3: Try video cover from TikTok direct URL patterns
        if (video.tiktok_id) {
          const directCovers = [
            `https://p16-sign.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/${video.tiktok_id}`,
            `https://p77-sign.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/${video.tiktok_id}`,
          ];
          for (const coverUrl of directCovers) {
            const result = await tryUploadFromUrl(coverUrl, videoId);
            if (result) {
              await supabase.from("viral_videos").update({ thumbnail_url: result }).eq("id", video.id);
              migrated++;
              console.log(`✅ Recovered via direct CDN: ${videoId}`);
              return;
            }
          }
        }

        failed++;
      }));
    }

    // Count remaining
    const { count: nullCount } = await supabase
      .from("viral_videos")
      .select("id", { count: "exact", head: true })
      .is("thumbnail_url", null);

    const { count: expiredCount } = await supabase
      .from("viral_videos")
      .select("id", { count: "exact", head: true })
      .not("thumbnail_url", "is", null)
      .not("thumbnail_url", "like", `%${supabaseUrl.replace("https://", "")}%`);

    const remaining = (nullCount || 0) + (expiredCount || 0);

    console.log(`✅ Migration complete: ${migrated} migrated (${oembedRecovered} via oembed), ${failed} failed, ${remaining} remaining`);

    return new Response(JSON.stringify({
      success: true,
      migrated,
      oembed_recovered: oembedRecovered,
      failed,
      remaining,
      duration_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("migrate-thumbnails error:", e.message);
    return new Response(JSON.stringify({ error: "Erro interno na migração de thumbnails" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
