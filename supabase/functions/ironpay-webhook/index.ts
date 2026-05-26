import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS: Record<number, { duration: number; label: string }> = {
  6990: { duration: 1, label: "1 Mês" },
  18990: { duration: 3, label: "3 Meses" },
  39990: { duration: 6, label: "6 Meses" },
};

// Match plan by finding the base price that, after discount, equals the paid amount
function findPlan(amountCents: number, couponCode?: string): { plan: { duration: number; label: string }; originalCents: number } | null {
  // Exact match first (no coupon or 0% discount)
  if (PLANS[amountCents]) {
    return { plan: PLANS[amountCents], originalCents: amountCents };
  }

  // Try matching with discount: paid = original * (1 - discount/100)
  // We check all plans and see if any could produce this amount with a reasonable discount (1-99%)
  for (const [baseCentsStr, plan] of Object.entries(PLANS)) {
    const baseCents = parseInt(baseCentsStr);
    // If amountCents < baseCents, it could be a discounted version
    if (amountCents < baseCents && amountCents > 0) {
      const impliedDiscount = Math.round((1 - amountCents / baseCents) * 100);
      if (impliedDiscount >= 1 && impliedDiscount <= 99) {
        return { plan, originalCents: baseCents };
      }
    }
  }

  return null;
}

async function verifyHmacSignature(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== signatureHeader.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    mismatch |= expectedSignature.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return mismatch === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- HMAC Signature Verification ---
    const webhookSecret = Deno.env.get("IRONPAY_WEBHOOK_SECRET");
    const rawBody = await req.text();

    if (webhookSecret) {
      // Check common signature header names
      const signature =
        req.headers.get("x-webhook-signature") ||
        req.headers.get("x-ironpay-signature") ||
        req.headers.get("x-signature");

      const isValid = await verifyHmacSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("HMAC signature verification failed");
        return new Response(
          JSON.stringify({ error: "Assinatura inválida" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("HMAC signature verified successfully");
    } else {
      console.warn("IRONPAY_WEBHOOK_SECRET not set — skipping signature verification");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = JSON.parse(rawBody);
    const event = body.event || body.type || body.event_type;
    const data = body.data || body.payload || body;

    console.log("IronPay webhook received:", event, JSON.stringify(data).substring(0, 200));

    const orderId = data.order_id || data.orderId || data.id;
    const email = data.customer?.email || data.email || data.buyer_email;
    const couponCode = data.metadata?.coupon_code || null;
    const amountRaw = parseFloat(data.amount || data.total || data.value || "0");
    const amountCents = amountRaw > 1000 ? Math.round(amountRaw) : Math.round(amountRaw * 100);

    // Find user by email
    let userId: string | null = null;
    if (email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      userId = profile?.id || null;
    }

    if (!userId && data.metadata?.user_id) {
      userId = data.metadata.user_id;
    }

    const result = findPlan(amountCents, couponCode);

    switch (event) {
      case "payment.approved":
      case "payment_approved":
      case "charge.completed":
      case "order.paid": {
        if (!userId) {
          console.error("User not found for email:", email);
          break;
        }

        if (!result) {
          console.error("Unknown amount_cents:", amountCents);
          break;
        }

        const { plan } = result;

        // Create subscription record
        await supabase.from("subscriptions").insert({
          user_id: userId,
          duration_months: plan.duration,
          amount_cents: amountCents,
          ironpay_order_id: orderId,
          status: "active",
          started_at: new Date().toISOString(),
        });

        // Get the created subscription to read expires_at
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("expires_at")
          .eq("ironpay_order_id", orderId)
          .single();

        // Update profile
        await supabase.from("profiles").update({
          subscription_status: "active",
          subscription_expires_at: sub?.expires_at,
        }).eq("id", userId);

        // Increment coupon uses_count if coupon was used
        if (couponCode) {
          await supabase.rpc("increment_coupon_uses", { _code: couponCode });
        }

        console.log(`Subscription activated for ${email}: ${plan.label} (paid: ${amountCents}, coupon: ${couponCode || "none"})`);
        break;
      }

      case "subscription.cancelled":
      case "subscription_cancelled": {
        if (!userId) break;

        await supabase.from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("status", "active");

        await supabase.from("profiles").update({
          subscription_status: "cancelled",
        }).eq("id", userId);

        console.log(`Subscription cancelled for ${email}`);
        break;
      }

      case "subscription.expired":
      case "subscription_expired": {
        if (!userId) break;

        await supabase.from("subscriptions")
          .update({ status: "expired" })
          .eq("user_id", userId)
          .eq("status", "active");

        await supabase.from("profiles").update({
          subscription_status: "expired",
        }).eq("id", userId);

        console.log(`Subscription expired for ${email}`);
        break;
      }

      default:
        console.log("Unhandled webhook event:", event);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("ironpay-webhook error:", error.message);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
