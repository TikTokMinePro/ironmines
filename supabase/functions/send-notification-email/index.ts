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

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Check if called from another edge function (internal) or from client
    const authHeader = req.headers.get("Authorization");
    const isInternalCall = req.headers.get("x-supabase-client-info") === null && !authHeader?.startsWith("Bearer eyJ");
    
    // If called from client, verify admin
    if (!isInternalCall && authHeader?.startsWith("Bearer ")) {
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
    }

    const body = await req.json();
    const { user_id, template_slug, test } = body;

    if (!template_slug || typeof template_slug !== "string" || template_slug.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid template_slug" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template
    const { data: template, error: tErr } = await supabase
      .from("email_templates")
      .select("*")
      .eq("slug", template_slug)
      .eq("is_active", true)
      .single();

    if (tErr || !template) {
      return new Response(JSON.stringify({ error: `Template '${template_slug}' not found or disabled` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recipientEmail: string;
    let variables: Record<string, string> = {};

    if (test) {
      const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@ironmines.com";
      recipientEmail = adminEmail;
      variables = {
        name: "Admin (Teste)",
        email: adminEmail,
        password: "••••••••",
        login_url: Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "#",
        renewal_url: "#",
        reset_url: "#",
        days_left: "3",
        expires_at: new Date().toLocaleDateString("pt-BR"),
      };
    } else {
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user_id).single();
      if (!profile?.email) {
        return new Response(JSON.stringify({ error: "User profile not found or no email" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      recipientEmail = profile.email;
      const daysLeft = profile.subscription_expires_at
        ? Math.ceil((new Date(profile.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      variables = {
        name: profile.name || profile.email.split("@")[0],
        email: profile.email,
        password: body.password || "••••••••",
        login_url: "https://cozy-companion-glow.lovable.app/login",
        renewal_url: "https://cozy-companion-glow.lovable.app/planos",
        reset_url: body.reset_url || "https://cozy-companion-glow.lovable.app/reset-password",
        days_left: String(Math.max(daysLeft, 0)),
        expires_at: profile.subscription_expires_at
          ? new Date(profile.subscription_expires_at).toLocaleDateString("pt-BR")
          : "—",
      };
    }

    // Replace variables in template
    let subject = template.subject;
    let htmlBody = template.body_html;
    for (const [key, value] of Object.entries(variables)) {
      const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(re, value);
      htmlBody = htmlBody.replace(re, value);
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Nunito Sans', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #0a0a0b; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #18181b 0%, #0a0a0b 100%); padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(224, 19, 147, 0.15);">
            <div style="display: inline-block; background: linear-gradient(135deg, rgba(224,19,147,0.15), rgba(224,19,147,0.05)); border: 1px solid rgba(224,19,147,0.2); border-radius: 12px; padding: 10px 24px;">
              <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Iron<span style="color: #E01393;">Mines</span></span>
            </div>
          </div>
          <div style="padding: 32px; color: #e5e5e5; font-size: 15px; line-height: 1.7;">
            ${htmlBody}
          </div>
          <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="font-size: 11px; color: #666; margin: 0;">IronMines — Mineração de dados e IA para TikTok Shop</p>
            <p style="font-size: 10px; color: #444; margin: 6px 0 0;">© ${new Date().getFullYear()} IronMines. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data: senderSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "resend_from_email")
      .single();
    const fromEmail = senderSetting?.value || "IronMines <noreply@ironmines.com>";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject,
        html: fullHtml,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Email sent: ${template_slug} to ${recipientEmail}`);
    return new Response(JSON.stringify({ success: true, email_id: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-notification-email error:", error.message);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
