import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let triggeredBy = "cron";
  try { const b = await req.json(); triggeredBy = b?.triggered_by || "cron"; } catch {}

  // Verify admin authorization - always require auth when Bearer token is present
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
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
  } else if (authHeader) {
    return new Response(JSON.stringify({ error: "Invalid authorization" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // No auth header = Supabase cron invocation (allowed)

  try {
    const now = new Date();
    const results = { expiring_warned: 0, expired_updated: 0, renewal_sent: 0 };

    // 1. Send expiring warning (3 days before)
    const threeDays = new Date(now);
    threeDays.setDate(threeDays.getDate() + 3);

    const { data: expiringIn3 } = await supabase
      .from("profiles")
      .select("id, email, name, subscription_expires_at")
      .eq("subscription_status", "active")
      .gte("subscription_expires_at", now.toISOString())
      .lte("subscription_expires_at", threeDays.toISOString());

    for (const profile of expiringIn3 || []) {
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: { user_id: profile.id, template_slug: "expiring_warning" },
        });
        results.expiring_warned++;
      } catch (e: any) {
        console.error(`Failed to send expiring warning to ${profile.email}:`, e.message);
      }
    }

    // 2. Send renewal discount (7 days before)
    const sevenDays = new Date(now);
    sevenDays.setDate(sevenDays.getDate() + 7);

    const { data: expiringIn7 } = await supabase
      .from("profiles")
      .select("id, email, name, subscription_expires_at")
      .eq("subscription_status", "active")
      .gt("subscription_expires_at", threeDays.toISOString())
      .lte("subscription_expires_at", sevenDays.toISOString());

    for (const profile of expiringIn7 || []) {
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: { user_id: profile.id, template_slug: "renewal_discount" },
        });
        results.renewal_sent++;
      } catch (e: any) {
        console.error(`Failed to send renewal offer to ${profile.email}:`, e.message);
      }
    }

    // 3. Expire overdue subscriptions
    const { data: expiredProfiles } = await supabase
      .from("profiles")
      .select("id, email, name, subscription_expires_at")
      .eq("subscription_status", "active")
      .lt("subscription_expires_at", now.toISOString());

    for (const profile of expiredProfiles || []) {
      await supabase.from("profiles").update({ subscription_status: "expired" }).eq("id", profile.id);
      await supabase.from("subscriptions").update({ status: "expired" }).eq("user_id", profile.id).eq("status", "active");

      try {
        await supabase.functions.invoke("send-notification-email", {
          body: { user_id: profile.id, template_slug: "subscription_expired" },
        });
      } catch (e: any) {
        console.error(`Failed to send expiry email to ${profile.email}:`, e.message);
      }
      results.expired_updated++;
    }

    const totalProcessed = results.expiring_warned + results.expired_updated + results.renewal_sent;

    console.log("Subscription check results:", results);
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("check-expiring-subscriptions error:", error.message);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
