import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: authError } = await anonClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { tiktok_id } = await req.json();
    if (!tiktok_id || typeof tiktok_id !== "string" || tiktok_id.length > 30 || !/^[\d]+$/.test(tiktok_id)) {
      return new Response(JSON.stringify({ error: "ID do vídeo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use tikwm API to get the video download URL
    const apiUrl = `https://www.tikwm.com/api/?url=https://www.tiktok.com/@video/video/${tiktok_id}&hd=1`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!apiRes.ok) {
      throw new Error(`TikWM API error: ${apiRes.status}`);
    }

    const apiData = await apiRes.json();

    if (apiData.code !== 0 || !apiData.data) {
      // Fallback: try without hd
      const fallbackUrl = `https://www.tikwm.com/api/?url=https://www.tiktok.com/@video/video/${tiktok_id}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const fallbackData = await fallbackRes.json();

      if (fallbackData.code !== 0 || !fallbackData.data) {
        return new Response(JSON.stringify({ error: "Não foi possível obter o vídeo. Tente abrir no TikTok." }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        download_url: fallbackData.data.hdplay || fallbackData.data.play,
        title: fallbackData.data.title || "",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const downloadUrl = apiData.data.hdplay || apiData.data.play;

    return new Response(JSON.stringify({
      download_url: downloadUrl,
      title: apiData.data.title || "",
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Download video error:", error);
    return new Response(JSON.stringify({ error: "Erro ao processar download do vídeo" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
