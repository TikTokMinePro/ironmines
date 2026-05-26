import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "FAL_AI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.fal.ai/v1/account/billing?expand=credits", {
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const body = await res.text();

    if (!res.ok) {
      console.error(`FAL billing API error [${res.status}]:`, body);
      return new Response(
        JSON.stringify({ error: `FAL API returned ${res.status}`, details: body }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(body);
    console.log("FAL billing response:", JSON.stringify(data));

    // Extract balance from response
    const credits = data.credits;
    const balance = credits?.balance ?? credits?.amount ?? null;
    const currency = credits?.currency ?? "USD";
    const isLocked = data.is_locked ?? false;
    const lockReason = data.lock_reason ?? null;

    return new Response(
      JSON.stringify({
        balance,
        currency,
        is_locked: isLocked,
        lock_reason: lockReason,
        raw: data,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error checking FAL balance:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
