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

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) throw new Error("Invalid token");

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) throw new Error("Unauthorized: admin only");

    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id required");

    // Get user profile for email
    const { data: profile } = await supabase.from("profiles").select("email, name").eq("id", user_id).single();
    if (!profile?.email) throw new Error("User not found or no email");

    // Generate a password reset link via Supabase Auth Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: profile.email,
      options: {
        redirectTo: "https://id-preview--97364bfd-d4d8-44fa-8c64-a5fda2fcd6c8.lovable.app/reset-password",
      },
    });

    if (linkError) throw linkError;

    // Send email via our notification system
    const { error: emailError } = await supabase.functions.invoke("send-notification-email", {
      body: {
        user_id,
        template_slug: "password_reset",
        reset_url: linkData.properties?.action_link || "#",
      },
    });

    if (emailError) {
      console.error("Email error (non-blocking):", emailError);
    }

    return new Response(JSON.stringify({ success: true, message: `Reset link sent to ${profile.email}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("admin-reset-password error:", error.message);
    const safeMessages: Record<string, string> = {
      "No authorization header": "Não autorizado",
      "Invalid token": "Token inválido",
      "Unauthorized: admin only": "Acesso restrito a administradores",
      "user_id required": "ID do usuário é obrigatório",
      "User not found or no email": "Usuário não encontrado",
    };
    const userMessage = safeMessages[error.message] || "Erro ao redefinir senha. Tente novamente.";
    return new Response(JSON.stringify({ error: userMessage }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});