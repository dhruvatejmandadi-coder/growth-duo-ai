import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

/* ===============================
   CORS
================================ */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ===============================
   ZOD VALIDATION
================================ */
const CourseSchema = z.object({
  title: z.string(),
  description: z.string(),
  modules: z.array(
    z.object({
      title: z.string(),
      lesson_content: z.string(),
      youtube_query: z.string().optional(),
      youtube_title: z.string().optional(),
      lab_type: z.enum(["simulation", "classification"]),
      lab_data: z.any(),
      quiz: z.array(
        z.object({
          question: z.string(),
          options: z.array(z.string()),
          correct: z.number(),
          explanation: z.string(),
        }),
      ),
    }),
  ),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    const { topic } = await req.json();
    if (!topic?.trim()) throw new Error("Topic is required");

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

    /* ===============================
       CREATE COURSE ROW
    ================================= */
    const { data: course } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        title: topic.trim(),
        topic: topic.trim(),
        status: "generating",
      })
      .select()
      .single();

    /* ===============================
       CALL OPENAI
    ================================= */
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `
You are an expert course architect.

CRITICAL RULES:

1. EVERY MODULE MUST INCLUDE A LAB.
2. Labs must appear in EVERY module (not just the last one).
3. For simulation labs:
   - Use ONLY "set_state"
   - set_state MUST include ALL parameters
   - All values must be integers 0-100
   - Each choice must modify at least 2 parameters
4. Lesson must have EXACTLY 4 slides separated by "\\n---\\n"
5. No commentary outside JSON.
6. Return only valid JSON.
              `,
          },
          {
            role: "user",
            content: `Create a complete course on "${topic}" with 4-6 modules. 
Each module must include:
- Lesson (4 slides)
- One lab
- 3-5 question quiz

Make difficulty progressive.`,
          },
        ],
      }),
    });

    const aiData = await response.json();

    if (!aiData.choices?.length) {
      throw new Error("Empty AI response");
    }

    const content = aiData.choices[0].message.content;

    /* ===============================
       PARSE JSON
    ================================= */
    const parsed = JSON.parse(content);

    /* ===============================
       VALIDATE STRUCTURE
    ================================= */
    const courseData = CourseSchema.parse(parsed);

    /* ===============================
       REPAIR LABS (CRITICAL FIX)
    ================================= */
    courseData.modules.forEach((mod: any) => {
      if (!mod.lab_type) {
        mod.lab_type = "classification";
      }

      if (!mod.lab_data) {
        mod.lab_data = {};
      }

      if (mod.lab_type === "simulation") {
        const parameters = mod.lab_data.parameters || [];

        mod.lab_data.decisions?.forEach((decision: any) => {
          decision.choices?.forEach((choice: any) => {
            if (!choice.set_state) {
              choice.set_state = {};
            }

            parameters.forEach((p: any) => {
              if (choice.set_state[p.name] === undefined) {
                choice.set_state[p.name] = 50;
              }

              choice.set_state[p.name] = Math.max(0, Math.min(100, Math.round(choice.set_state[p.name])));
            });
          });
        });
      }
    });

    /* ===============================
       UPDATE COURSE
    ================================= */
    await supabase
      .from("courses")
      .update({
        title: courseData.title,
        description: courseData.description,
        status: "ready",
      })
      .eq("id", course.id);

    /* ===============================
       INSERT MODULES
    ================================= */
    const modules = courseData.modules.map((mod: any, index: number) => ({
      course_id: course.id,
      module_order: index + 1,
      title: mod.title,
      lesson_content: mod.lesson_content,
      youtube_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(mod.youtube_query || mod.title)}`,
      youtube_title: mod.youtube_title || mod.title,
      lab_type: mod.lab_type,
      lab_data: mod.lab_data,
      quiz: mod.quiz,
    }));

    await supabase.from("course_modules").insert(modules);

    return new Response(JSON.stringify({ courseId: course.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("COURSE GENERATION ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
