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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Determine best lab type based on topic
    const labTypes = ["simulation", "classification", "ethical_dilemma", "policy_optimization", "decision_lab"];

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
            content: `You are an interactive learning challenge generator. Given a topic, create an engaging challenge with an interactive lab experience.

Choose the BEST lab type for the topic from: ${labTypes.join(", ")}

Guidelines for lab type selection:
- "simulation": For causal/systemic topics (economics, environment, health systems). Uses 3 parameters (0-100 scale) and decision scenarios.
- "classification": For analytical/sorting topics (categorizing items, identifying patterns). Uses items and categories.
- "ethical_dilemma": For moral/ethical topics (medical ethics, business ethics, social issues). Uses dimensions and decisions with tradeoffs.
- "policy_optimization": For strategy/constraint topics (budgeting, resource allocation). Uses parameters, constraints, and targets.
- "decision_lab": For complex reasoning topics (case studies, strategic planning). Uses scenario, constraints, and decision prompts.

CRITICAL RULES FOR LAB DATA:

For "simulation" type:
- Exactly 3 parameters with name, icon (emoji), unit, min (0), max (100), default (40-60)
- Exactly 3 thresholds with label, min_percent, message
- 2-4 decisions, each with a question, emoji, and 2-3 choices
- EVERY choice MUST have set_state with ALL 3 parameter names as keys and values 0-100
- Every decision must create meaningful tradeoffs

For "classification" type:
- 5-8 items, each with name, description
- 2-4 categories with name, description
- correct_mapping object mapping item names to category names

For "ethical_dilemma" type:
- 3-4 dimensions with name, icon (emoji), description, initial_value (40-60)
- 2-4 decisions with scenario, emoji, and 2-3 options
- Each option has label, description, and impacts (object mapping dimension names to number changes like +15, -10)

For "policy_optimization" type:
- 3-4 parameters with name, icon (emoji), unit, min (0), max (100), default, step (5-10)
- 2-4 constraints with description and check logic description
- 2-3 targets with name, operator (">=", "<="), value, unit
- max_moves: 3-5

For "decision_lab" type:
- scenario: detailed scenario text
- 3-4 constraints (strings)
- decision_prompt: what the user must decide
- considerations: 3-4 key factors to think about

Return the result using the create_interactive_challenge function.`,
          },
          {
            role: "user",
            content: `Create an interactive learning challenge about: ${prompt.trim()}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_interactive_challenge",
              description: "Create an interactive challenge with lab data",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Challenge title, max 80 chars" },
                  description: { type: "string", description: "Challenge description, max 300 chars" },
                  lab_type: { type: "string", enum: labTypes, description: "The type of interactive lab" },
                  lab_data: { type: "object", description: "The structured lab data matching the lab_type schema" },
                },
                required: ["title", "description", "lab_type", "lab_data"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_interactive_challenge" } },
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

    let challengeData: { title: string; description: string; lab_type: string; lab_data: any };
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      challengeData = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      challengeData = JSON.parse(cleaned);
    }

    if (!challengeData.title || !challengeData.description || !challengeData.lab_type || !challengeData.lab_data) {
      throw new Error("AI returned incomplete challenge data");
    }

    // Validate lab_type
    if (!labTypes.includes(challengeData.lab_type)) {
      challengeData.lab_type = "simulation";
    }

    // Repair simulation lab data if needed
    if (challengeData.lab_type === "simulation" && challengeData.lab_data?.parameters) {
      const params = challengeData.lab_data.parameters;
      if (challengeData.lab_data.decisions) {
        for (const decision of challengeData.lab_data.decisions) {
          if (decision.choices) {
            for (const choice of decision.choices) {
              if (!choice.set_state) choice.set_state = {};
              for (const p of params) {
                if (typeof choice.set_state[p.name] !== "number") {
                  choice.set_state[p.name] = p.default ?? 50;
                }
              }
            }
          }
        }
      }
    }

    const { data: challenge, error: insertError } = await supabase
      .from("challenges")
      .insert({
        title: challengeData.title.slice(0, 80),
        description: challengeData.description.slice(0, 500),
        lab_type: challengeData.lab_type,
        lab_data: challengeData.lab_data,
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
