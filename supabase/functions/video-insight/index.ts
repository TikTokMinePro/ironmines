import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { caption, productTitle } = await req.json();
    if (!caption && !productTitle) {
      return new Response(JSON.stringify({ error: "Caption ou título do produto é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const content = caption
      ? `Legenda do vídeo: "${caption}"${productTitle ? `\nProduto associado: "${productTitle}"` : ""}`
      : `Produto associado: "${productTitle}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em marketing digital e copywriting para TikTok Shop Brasil.
Analise a legenda/script do vídeo e extraia a estrutura persuasiva usada.
Responda SEMPRE em português brasileiro, de forma concisa e direta.`
          },
          { role: "user", content }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_video_structure",
            description: "Extrai a estrutura persuasiva de um vídeo viral do TikTok Shop",
            parameters: {
              type: "object",
              properties: {
                gancho: {
                  type: "string",
                  description: "O gancho usado para prender atenção nos primeiros segundos (1-2 frases)"
                },
                dor_explorada: {
                  type: "string",
                  description: "A dor ou problema que o vídeo explora para gerar identificação (1-2 frases)"
                },
                solucao_apresentada: {
                  type: "string",
                  description: "Como o produto é apresentado como solução para a dor (1-2 frases)"
                },
                call_to_action: {
                  type: "string",
                  description: "O call-to-action usado para converter (1 frase)"
                }
              },
              required: ["gancho", "dor_explorada", "solucao_apresentada", "call_to_action"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_video_structure" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No tool call response");

    const insight = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("video-insight error:", e);
    return new Response(JSON.stringify({ error: "Erro ao analisar vídeo. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
