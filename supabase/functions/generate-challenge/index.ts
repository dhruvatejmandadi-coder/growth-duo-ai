import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Please provide a topic or prompt (at least 3 characters)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate challenge via AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a learning challenge generator. Given a topic or prompt, create an engaging, actionable learning challenge. Return ONLY a JSON object with exactly these fields:
- "title": A concise, compelling challenge title (max 80 chars)
- "description": A detailed description of the challenge with clear steps and goals (2-4 sentences, max 300 chars)

The challenge should be:
- Specific and actionable (not vague)
- Completable in 1-3 hours
- Focused on hands-on practice, not just reading
- Related to the user's topic

Return ONLY valid JSON, no markdown, no code blocks.`,
          },
          {
            role: "user",
            content: `Create a learning challenge about: ${prompt.trim()}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_challenge",
              description: "Create a structured learning challenge",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Challenge title, max 80 chars" },
                  description: { type: "string", description: "Challenge description with clear steps, max 300 chars" },
                },
                required: ["title", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_challenge" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Failed to generate challenge");
    }

    const aiData = await aiResponse.json();
    
    // Extract from tool call
    let challengeData: { title: string; description: string };
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      challengeData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content
      const content = aiData.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      challengeData = JSON.parse(cleaned);
    }

    if (!challengeData.title || !challengeData.description) {
      throw new Error("AI returned incomplete challenge data");
    }

    // Insert challenge
    const { data: challenge, error: insertError } = await supabase
      .from("challenges")
      .insert({
        title: challengeData.title.slice(0, 80),
        description: challengeData.description.slice(0, 500),
        user_id: user.id,
        is_daily: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save challenge");
    }

    return new Response(JSON.stringify({ challenge }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-challenge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
