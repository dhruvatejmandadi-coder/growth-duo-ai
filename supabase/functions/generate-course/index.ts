import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ===============================
   🔧 ZOD SCHEMAS (FLEXIBLE)
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
      lab_type: z.string(), // ANY lab type — no enum restriction
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

/* ===============================
   🔧 NORMALIZATION UTILITIES
   These NEVER replace AI content — only fill missing fields
================================ */

function normalizeParameters(params: any[]): any[] {
  if (!Array.isArray(params)) return [];
  return params.map((p: any) => ({
    name: String(p.name || p.label || "Variable"),
    icon: String(p.icon || p.emoji || "📊"),
    unit: String(p.unit || "%"),
    min: typeof p.min === "number" ? p.min : 0,
    max: typeof p.max === "number" ? p.max : 100,
    default: Math.max(0, Math.min(100, typeof p.default === "number" ? p.default : (typeof p.initial === "number" ? p.initial : 50))),
    ...(p.description ? { description: p.description } : {}),
  }));
}

function normalizeSetState(setState: any, paramNames: string[]): Record<string, number> {
  if (!setState || typeof setState !== "object") {
    const result: Record<string, number> = {};
    for (const pn of paramNames) result[pn] = 50;
    return result;
  }
  const result: Record<string, number> = {};
  for (const pn of paramNames) {
    result[pn] = Math.max(0, Math.min(100, typeof setState[pn] === "number" ? setState[pn] : 50));
  }
  return result;
}

function normalizeDecisions(decisions: any[], paramNames: string[]): any[] {
  if (!Array.isArray(decisions)) return [];
  return decisions.map((d: any) => ({
    ...d,
    question: String(d.question || d.prompt || d.scenario || "What do you decide?"),
    emoji: d.emoji || "🔬",
    choices: Array.isArray(d.choices) ? d.choices.map((c: any) => {
      const choice: any = {
        text: String(c.text || c.label || c.option || "Choice"),
        explanation: String(c.explanation || c.result || c.outcome || c.feedback || ""),
      };
      // Normalize set_state from various field names
      const rawState = c.set_state || c.effects || c.impacts || c.state || c.outcomes;
      if (rawState && typeof rawState === "object") {
        choice.set_state = normalizeSetState(rawState, paramNames);
      } else {
        choice.set_state = normalizeSetState(null, paramNames);
      }
      // Preserve impacts separately for ethical dilemma style
      if (c.impacts && typeof c.impacts === "object") {
        choice.impacts = c.impacts;
      }
      // Preserve is_best for decision labs
      if (typeof c.is_best === "boolean") choice.is_best = c.is_best;
      if (c.consequence) choice.consequence = c.consequence;
      if (c.id) choice.id = c.id;
      return choice;
    }) : [],
  }));
}

/* ===============================
   🔧 LAB TYPE NORMALIZERS
   Normalize AI output to renderable structures
   NEVER replace content — only ensure required fields exist
================================ */

function normalizeSimulationLab(ld: any, title: string): any {
  const normalized = { ...ld };
  normalized.title = normalized.title || title;
  normalized.parameters = normalizeParameters(normalized.parameters || normalized.variables || normalized.metrics || []);
  
  if (!normalized.thresholds || !Array.isArray(normalized.thresholds) || normalized.thresholds.length === 0) {
    normalized.thresholds = [
      { label: "Excellent", min_percent: 75, message: "Outstanding performance — your decisions created strong outcomes." },
      { label: "Good", min_percent: 50, message: "Solid understanding — some tradeoffs could be managed better." },
      { label: "Needs Work", min_percent: 0, message: "Review the tradeoffs and try a different strategy." },
    ];
  }
  
  const paramNames = normalized.parameters.map((p: any) => p.name);
  
  // Convert effects/impacts to set_state
  if (Array.isArray(normalized.decisions)) {
    normalized.decisions = normalizeDecisions(normalized.decisions, paramNames);
  }
  
  return normalized;
}

function normalizeClassificationLab(ld: any, title: string): any {
  const normalized = { ...ld };
  normalized.title = normalized.title || `${title} Classification`;
  normalized.description = normalized.description || `Categorize items related to ${title}.`;
  
  if (Array.isArray(normalized.categories)) {
    normalized.categories = normalized.categories.map((cat: any) => {
      if (typeof cat === "string") return { name: cat, description: "", color: "#4CAF50" };
      return { name: String(cat.name || "Category"), description: cat.description || "", color: cat.color || "#4CAF50" };
    });
  }
  
  if (Array.isArray(normalized.items)) {
    normalized.items = normalized.items.map((item: any) => ({
      content: String(item.content || item.name || item.text || item.label || "Item"),
      correctCategory: String(item.correctCategory || item.correct_category || item.correct || item.category || ""),
      explanation: String(item.explanation || item.reason || item.feedback || ""),
    }));
  }
  
  return normalized;
}

function normalizePolicyLab(ld: any, title: string): any {
  const normalized = { ...ld };
  normalized.title = normalized.title || `${title} Optimization`;
  normalized.parameters = normalizeParameters(normalized.parameters || normalized.variables || []);
  
  if (!Array.isArray(normalized.constraints) || normalized.constraints.length === 0) {
    const pName = normalized.parameters?.[0]?.name || "Variable";
    normalized.constraints = [{ parameter: pName, operator: ">=", value: 60, label: `Keep ${pName} above 60%` }];
  } else {
    normalized.constraints = normalized.constraints.map((c: any) => ({
      parameter: String(c.parameter || c.name || "Variable"),
      operator: String(c.operator || ">="),
      value: typeof c.value === "number" ? c.value : 50,
      label: String(c.label || c.description || `Constraint on ${c.parameter}`),
    }));
  }
  
  if (typeof normalized.max_decisions !== "number") normalized.max_decisions = 3;
  
  const paramNames = normalized.parameters.map((p: any) => p.name);
  if (Array.isArray(normalized.decisions)) {
    normalized.decisions = normalizeDecisions(normalized.decisions, paramNames);
  }
  
  return normalized;
}

function normalizeEthicalLab(ld: any, title: string): any {
  const normalized = { ...ld };
  normalized.title = normalized.title || `${title} Ethical Dilemma`;
  
  if (Array.isArray(normalized.dimensions)) {
    normalized.dimensions = normalized.dimensions.map((dim: any) => ({
      name: String(dim.name || "Dimension"),
      icon: String(dim.icon || "⚖️"),
      description: String(dim.description || ""),
      default: typeof dim.default === "number" ? dim.default : 50,
    }));
  }
  
  const dimNames = (normalized.dimensions || []).map((d: any) => d.name);
  if (Array.isArray(normalized.decisions)) {
    for (const d of normalized.decisions) {
      if (!d.choices) d.choices = [];
      for (const c of d.choices) {
        if (!c.impacts) c.impacts = {};
        for (const dn of dimNames) {
          if (typeof c.impacts[dn] !== "number") c.impacts[dn] = 0;
        }
      }
    }
  }
  
  return normalized;
}

function normalizeDecisionLab(ld: any, title: string): any {
  const normalized = { ...ld };
  
  if (!normalized.concept_knowledge) {
    normalized.concept_knowledge = {
      definition: normalized.definition || `${title} concept and principles.`,
      key_ideas: normalized.key_ideas || [`Understanding ${title} involves balancing multiple factors.`],
      examples: normalized.examples || [`Applying ${title.toLowerCase()} in practice.`],
    };
  }
  
  if (!normalized.real_world_relevance) {
    normalized.real_world_relevance = {
      explanation: normalized.relevance || `${title} is relevant in real-world decision-making.`,
      domain: normalized.domain || "General",
    };
  }
  
  if (typeof normalized.scenario !== "string" || normalized.scenario.length < 10) {
    normalized.scenario = normalized.scenario_context || normalized.description || normalized.context || `You are facing a decision related to ${title.toLowerCase()}.`;
  }
  
  if (!normalized.decision_challenge) {
    // Try to construct from other fields
    if (normalized.question && Array.isArray(normalized.options)) {
      normalized.decision_challenge = {
        question: normalized.question,
        options: normalized.options.map((opt: any, i: number) => ({
          id: String(opt.id || String.fromCharCode(97 + i)),
          text: String(opt.text || opt.label || `Option ${i + 1}`),
          consequence: String(opt.consequence || opt.result || opt.outcome || ""),
          is_best: typeof opt.is_best === "boolean" ? opt.is_best : i === 0,
        })),
      };
    } else if (Array.isArray(normalized.choices)) {
      normalized.decision_challenge = {
        question: normalized.prompt || `What approach would you take for ${title.toLowerCase()}?`,
        options: normalized.choices.map((opt: any, i: number) => ({
          id: String(opt.id || String.fromCharCode(97 + i)),
          text: String(opt.text || opt.label || `Option ${i + 1}`),
          consequence: String(opt.consequence || opt.result || ""),
          is_best: typeof opt.is_best === "boolean" ? opt.is_best : i === 0,
        })),
      };
    }
  }
  
  if (normalized.decision_challenge) {
    if (!Array.isArray(normalized.decision_challenge.options)) normalized.decision_challenge.options = [];
    normalized.decision_challenge.options = normalized.decision_challenge.options.map((opt: any, i: number) => ({
      id: String(opt.id || String.fromCharCode(97 + i)),
      text: String(opt.text || opt.label || `Option ${i + 1}`),
      consequence: String(opt.consequence || opt.result || opt.outcome || ""),
      is_best: typeof opt.is_best === "boolean" ? opt.is_best : i === 0,
    }));
    const hasBest = normalized.decision_challenge.options.some((o: any) => o.is_best);
    if (!hasBest && normalized.decision_challenge.options.length > 0) normalized.decision_challenge.options[0].is_best = true;
  }
  
  if (typeof normalized.best_decision_explanation !== "string") {
    normalized.best_decision_explanation = normalized.explanation || `The best approach balances the key factors of ${title.toLowerCase()}.`;
  }
  
  return normalized;
}

/* ===============================
   🔧 MATH LAB NORMALIZER
================================ */

const MATH_VISUAL_TYPES = ["graph", "chart", "geometry", "solution_steps"] as const;

function isMathVisualType(v: any): boolean {
  return typeof v === "string" && (MATH_VISUAL_TYPES as readonly string[]).includes(v);
}

function normalizeMathLabData(ld: any, title: string, moduleIndex: number): any {
  if (!ld || typeof ld !== "object") return createMinimalMathLab(title, moduleIndex);
  
  const normalized = { ...ld };
  normalized.title = normalized.title || `${title} Lab`;
  normalized.objective = normalized.objective || `Explore ${title} through interactive visualization.`;
  normalized.concept_overview = normalized.concept_overview || `This lab covers key aspects of ${title}.`;
  
  if (!isMathVisualType(normalized.visual_type)) {
    normalized.visual_type = MATH_VISUAL_TYPES[moduleIndex % MATH_VISUAL_TYPES.length];
  }
  
  if (!normalized.scenario) normalized.scenario = `Apply ${title} concepts to solve the following problem.`;
  if (!normalized.instructions) normalized.instructions = `Read the problem and complete each task.`;
  
  if (!Array.isArray(normalized.tasks) || normalized.tasks.length === 0) {
    normalized.tasks = [{
      id: "t1",
      description: `Calculate or determine the answer for the ${title.toLowerCase()} problem.`,
      type: "input",
      correct_answer: "See solution",
    }];
  } else {
    normalized.tasks = normalized.tasks.map((t: any, i: number) => ({
      id: t.id || `t${i + 1}`,
      description: String(t.description || t.question || t.prompt || "Solve the problem"),
      type: t.type || "input",
      correct_answer: t.correct_answer || t.answer || t.solution || "See solution",
      ...(t.options ? { options: t.options } : {}),
    }));
  }
  
  if (!normalized.hints) normalized.hints = [`Think about the key variables in ${title.toLowerCase()}.`];
  if (!normalized.solution) normalized.solution = normalized.answer || "See the solution explanation.";
  if (!normalized.solution_explanation) normalized.solution_explanation = normalized.explanation || `This solution applies ${title} principles.`;
  
  // Ensure visual-type-specific data
  if ((normalized.visual_type === "graph" || normalized.visual_type === "chart") && !normalized.graph_data) {
    normalized.graph_data = {
      type: "line",
      xLabel: "X",
      yLabel: "Y",
      datasets: [{ label: title, data: [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 75 }] }],
    };
  }
  
  if (normalized.visual_type === "graph" && (!Array.isArray(normalized.interactive_params) || normalized.interactive_params.length === 0)) {
    normalized.interactive_params = [{ name: "parameter", min: 0, max: 100, default: 50, step: 1 }];
  }
  
  if (normalized.visual_type === "geometry" && (!Array.isArray(normalized.geometry) || normalized.geometry.length === 0)) {
    normalized.geometry = [{ type: "circle", cx: 200, cy: 200, r: 80, label: "Shape" }];
  }
  
  if (normalized.visual_type === "solution_steps" && (!Array.isArray(normalized.solution_steps) || normalized.solution_steps.length === 0)) {
    normalized.solution_steps = [
      { step: 1, description: "Identify the given values", expression: "Given: values from problem" },
      { step: 2, description: "Apply the formula", expression: "Calculate the result" },
      { step: 3, description: "Final answer", expression: "Result" },
    ];
  }
  
  return normalized;
}

function createMinimalMathLab(title: string, moduleIndex: number): any {
  return {
    title: `${title} Lab`,
    objective: `Explore ${title} through interactive visualization.`,
    concept_overview: `This lab covers key aspects of ${title}.`,
    visual_type: MATH_VISUAL_TYPES[moduleIndex % MATH_VISUAL_TYPES.length],
    scenario: `Apply ${title} concepts.`,
    instructions: "Solve the following tasks.",
    tasks: [{ id: "t1", description: `Solve the ${title.toLowerCase()} problem.`, type: "input", correct_answer: "See solution" }],
    hints: [`Consider the key variables.`],
    solution: "See explanation.",
    solution_explanation: `Apply ${title} principles.`,
    graph_data: { type: "line", xLabel: "X", yLabel: "Y", datasets: [{ label: title, data: [{ x: 0, y: 0 }, { x: 100, y: 100 }] }] },
    interactive_params: [{ name: "parameter", min: 0, max: 100, default: 50, step: 1 }],
  };
}

/* ===============================
   🔧 DYNAMIC LAB NORMALIZER
   For any lab_type not in the known set
================================ */

function normalizeDynamicLab(ld: any, labType: string, title: string): any {
  if (!ld || typeof ld !== "object") return ld;
  const normalized = { ...ld };
  normalized.title = normalized.title || title;
  normalized.lab_type_hint = labType; // Preserve the AI's intended type
  
  // If it has parameters/decisions, normalize them like a simulation
  if (Array.isArray(normalized.parameters) || Array.isArray(normalized.variables)) {
    normalized.parameters = normalizeParameters(normalized.parameters || normalized.variables || []);
    const paramNames = normalized.parameters.map((p: any) => p.name);
    if (Array.isArray(normalized.decisions)) {
      normalized.decisions = normalizeDecisions(normalized.decisions, paramNames);
    }
    if (!normalized.thresholds) {
      normalized.thresholds = [
        { label: "Excellent", min_percent: 75, message: "Outstanding performance." },
        { label: "Good", min_percent: 50, message: "Solid understanding." },
        { label: "Needs Work", min_percent: 0, message: "Try a different approach." },
      ];
    }
  }
  
  // If it has categories/items, normalize them like a classification
  if (Array.isArray(normalized.categories) && Array.isArray(normalized.items)) {
    normalized.categories = normalized.categories.map((cat: any) =>
      typeof cat === "string" ? { name: cat, description: "", color: "#4CAF50" } : cat
    );
    normalized.items = normalized.items.map((item: any) => ({
      content: String(item.content || item.name || item.text || "Item"),
      correctCategory: String(item.correctCategory || item.correct_category || item.correct || item.category || ""),
      explanation: String(item.explanation || ""),
    }));
  }
  
  // If it has dimensions, normalize like ethical dilemma
  if (Array.isArray(normalized.dimensions)) {
    normalized.dimensions = normalized.dimensions.map((dim: any) => ({
      name: String(dim.name || "Dimension"),
      icon: String(dim.icon || "⚖️"),
      description: String(dim.description || ""),
      default: typeof dim.default === "number" ? dim.default : 50,
    }));
  }
  
  // If it has tasks (like math labs or custom labs)
  if (Array.isArray(normalized.tasks)) {
    normalized.tasks = normalized.tasks.map((t: any, i: number) => ({
      id: t.id || `t${i + 1}`,
      description: String(t.description || t.question || t.prompt || "Complete this task"),
      type: t.type || "input",
      correct_answer: t.correct_answer || t.answer || "See solution",
      ...(t.options ? { options: t.options } : {}),
      ...(t.hints ? { hints: t.hints } : {}),
    }));
  }
  
  return normalized;
}

/* ===============================
   🔧 MODULE REPAIR (NO FALLBACKS)
================================ */

// Map of known lab types to their normalizers
const KNOWN_LAB_TYPES: Record<string, string> = {
  simulation: "simulation",
  classification: "classification",
  policy_optimization: "policy_optimization",
  policy: "policy_optimization",
  optimization: "policy_optimization",
  ethical_dilemma: "ethical_dilemma",
  ethical: "ethical_dilemma",
  dilemma: "ethical_dilemma",
  decision_lab: "decision_lab",
  decision: "decision_lab",
  math_lab: "math_lab",
  math: "math_lab",
};

function detectLabType(ld: any): string | null {
  if (!ld || typeof ld !== "object") return null;
  if (Array.isArray(ld.categories) && Array.isArray(ld.items)) return "classification";
  if (Array.isArray(ld.dimensions) && Array.isArray(ld.decisions)) return "ethical_dilemma";
  if (Array.isArray(ld.constraints) && Array.isArray(ld.parameters)) return "policy_optimization";
  if (ld.decision_challenge || (ld.scenario && ld.choices)) return "decision_lab";
  if (Array.isArray(ld.tasks) && ld.visual_type) return "math_lab";
  if (Array.isArray(ld.parameters) && Array.isArray(ld.decisions)) return "simulation";
  return null;
}

function repairModules(parsed: any) {
  if (!parsed?.modules || !Array.isArray(parsed.modules)) return parsed;

  for (let moduleIndex = 0; moduleIndex < parsed.modules.length; moduleIndex++) {
    const mod = parsed.modules[moduleIndex];
    mod.lab_data = mod.lab_data ?? {};
    const title = mod.title || "Topic";

    // Fix lesson content
    if (!mod.lesson_content) {
      mod.lesson_content = mod.content || mod.lesson || mod.text || "## Lesson Content\n\nContent is being prepared.";
    }

    if (mod.lesson_content && !mod.lesson_content.includes("\n---\n")) {
      const sections = mod.lesson_content.split(/(?=^## )/m).filter(Boolean);
      if (sections.length > 1) {
        mod.lesson_content = sections.join("\n\n---\n\n");
      }
    }

    // Slide repair
    if (mod.lesson_content) {
      const slides = mod.lesson_content.split(/\n---\n/).map((s: string) => s.trim()).filter(Boolean);
      const repairedSlides: string[] = [];

      for (let si = 0; si < slides.length; si++) {
        let slide = slides[si];
        
        // Add slide type comment if missing
        if (!slide.includes("<!-- type:")) {
          if (si === slides.length - 1 && slide.toLowerCase().includes("takeaway")) {
            slide = `<!-- type: key_takeaways -->\n${slide}`;
          } else {
            slide = `<!-- type: concept -->\n${slide}`;
          }
        }
        repairedSlides.push(slide);
      }

      // Ensure last slide is key_takeaways
      if (repairedSlides.length > 0) {
        const last = repairedSlides[repairedSlides.length - 1];
        if (!last.includes("<!-- type: key_takeaways -->")) {
          repairedSlides[repairedSlides.length - 1] = last.replace(/<!-- type: \w+ -->/, "<!-- type: key_takeaways -->");
        }
      }

      // Cap at 8 slides
      while (repairedSlides.length > 8) {
        let minLen = Infinity, minIdx = 0;
        for (let i = 0; i < repairedSlides.length - 1; i++) {
          const combined = repairedSlides[i].length + repairedSlides[i + 1].length;
          if (combined < minLen) { minLen = combined; minIdx = i; }
        }
        repairedSlides[minIdx] = repairedSlides[minIdx] + "\n" + repairedSlides[minIdx + 1];
        repairedSlides.splice(minIdx + 1, 1);
      }

      mod.lesson_content = repairedSlides.join("\n\n---\n\n");
    }

    // Fix quiz
    if (!mod.quiz || !Array.isArray(mod.quiz)) {
      mod.quiz = [{
        question: `What is a key concept from "${title}"?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct: 0,
        explanation: "Review the lesson content for details.",
      }];
    }

    // === LAB NORMALIZATION (NO FALLBACKS) ===
    const ld = mod.lab_data;
    let resolvedType = mod.lab_type || "";
    
    // Map aliases to canonical types
    const canonical = KNOWN_LAB_TYPES[resolvedType.toLowerCase().replace(/[\s-]/g, "_")];
    
    // Auto-detect type from lab_data structure if type is unknown
    if (!canonical) {
      const detected = detectLabType(ld);
      if (detected) {
        console.log(`[RepairModules] Auto-detected lab type "${detected}" from structure for: "${title}" (was "${resolvedType}")`);
        resolvedType = detected;
      }
    } else {
      resolvedType = canonical;
    }
    
    mod.lab_type = resolvedType || "simulation";

    // Normalize based on resolved type
    if (resolvedType === "simulation") {
      if (ld && typeof ld === "object" && (Array.isArray(ld.parameters) || Array.isArray(ld.variables) || Array.isArray(ld.decisions))) {
        console.log(`[RepairModules] Normalizing AI simulation for: "${title}"`);
        mod.lab_data = normalizeSimulationLab(ld, title);
      } else {
        console.log(`[RepairModules] Simulation lab_data sparse for: "${title}" — preserving as-is`);
      }
    } else if (resolvedType === "classification") {
      if (ld && typeof ld === "object") {
        console.log(`[RepairModules] Normalizing AI classification for: "${title}"`);
        mod.lab_data = normalizeClassificationLab(ld, title);
      }
    } else if (resolvedType === "policy_optimization") {
      if (ld && typeof ld === "object") {
        console.log(`[RepairModules] Normalizing AI policy_optimization for: "${title}"`);
        mod.lab_data = normalizePolicyLab(ld, title);
      }
    } else if (resolvedType === "ethical_dilemma") {
      if (ld && typeof ld === "object") {
        console.log(`[RepairModules] Normalizing AI ethical_dilemma for: "${title}"`);
        mod.lab_data = normalizeEthicalLab(ld, title);
      }
    } else if (resolvedType === "decision_lab") {
      if (ld && typeof ld === "object") {
        console.log(`[RepairModules] Normalizing AI decision_lab for: "${title}"`);
        mod.lab_data = normalizeDecisionLab(ld, title);
      }
    } else if (resolvedType === "math_lab") {
      console.log(`[RepairModules] Normalizing math_lab for: "${title}"`);
      mod.lab_data = normalizeMathLabData(ld, title, moduleIndex);
    } else {
      // DYNAMIC LAB — unknown type, normalize generically
      console.log(`[RepairModules] Dynamic lab type "${resolvedType}" for: "${title}" — normalizing generically`);
      mod.lab_data = normalizeDynamicLab(ld, resolvedType, title);
      
      // Map to closest renderable type for the frontend
      const detected = detectLabType(mod.lab_data);
      if (detected) {
        mod.lab_type = detected;
        console.log(`[RepairModules] Mapped dynamic lab to renderable type: "${detected}"`);
      }
    }

    // FINAL CHECK — if lab_data is completely empty, log but do NOT replace with fallback
    const finalLD = mod.lab_data;
    const hasContent = finalLD && typeof finalLD === "object" && Object.keys(finalLD).length > 1;
    if (!hasContent) {
      console.warn(`[RepairModules] Lab data empty after normalization for: "${title}" (type: ${mod.lab_type})`);
      // Set minimal structure so frontend can show something
      mod.lab_data = { title, description: `Interactive lab for ${title}`, empty: true };
    }
  }

  // Ensure math lab visual type variety
  const mathModules = parsed.modules
    .filter((mod: any) => mod.lab_type === "math_lab" && mod.lab_data)
    .map((mod: any, idx: number) => ({ mod, idx }));

  if (mathModules.length > 1) {
    const uniqueVisualTypes = new Set(
      mathModules.map(({ mod }: any) => mod.lab_data?.visual_type).filter((v: any) => isMathVisualType(v)),
    );
    if (uniqueVisualTypes.size <= 1) {
      mathModules.forEach(({ mod, idx }: any) => {
        const forcedVisual = MATH_VISUAL_TYPES[idx % MATH_VISUAL_TYPES.length];
        mod.lab_data = normalizeMathLabData({ ...mod.lab_data, visual_type: forcedVisual }, mod.title || "Math Topic", idx);
      });
    }
  }

  return parsed;
}

/* ===============================
   📄 FILE CONTENT EXTRACTION
================================ */

async function extractFileContent(filePath: string, supabaseAdmin: any): Promise<{ text?: string; imageBase64?: string; mimeType?: string }> {
  const { data, error } = await supabaseAdmin.storage.from("course-uploads").download(filePath);
  if (error || !data) {
    console.error("Failed to download file:", error);
    return {};
  }

  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["png", "jpg", "jpeg", "webp"];
  const textExts = ["txt", "md", "csv"];

  if (imageExts.includes(ext)) {
    const buffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const mimeMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
    return { imageBase64: base64, mimeType: mimeMap[ext] || "image/png" };
  }

  if (textExts.includes(ext)) {
    const text = await data.text();
    return { text: text.slice(0, 50000) };
  }

  if (ext === "pdf") {
    try {
      const text = await data.text();
      const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
      if (cleaned.length > 100) return { text: cleaned.slice(0, 50000) };
      const buffer = await data.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      return { imageBase64: base64, mimeType: "application/pdf" };
    } catch {
      return {};
    }
  }

  return {};
}

/* ===============================
   🚀 MAIN HANDLER
================================ */

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { topic, filePath } = await req.json();
    if (!topic?.trim()) throw new Error("Topic is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Extract file content if provided
    let fileContent: { text?: string; imageBase64?: string; mimeType?: string } = {};
    if (filePath) {
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      fileContent = await extractFileContent(filePath, supabaseAdmin);
      console.log(`[FileUpload] Extracted content from: ${filePath}, hasText: ${!!fileContent.text}, hasImage: ${!!fileContent.imageBase64}`);
    }

    // Create course row
    const { data: course } = await supabase
      .from("courses")
      .insert({ user_id: user.id, title: topic.trim(), topic: topic.trim(), status: "generating" })
      .select()
      .single();

    // Build user message content
    let userContent: any;
    const topicMessage = fileContent.text
      ? `Create a course on: ${topic}\n\nSOURCE MATERIAL:\n\n${fileContent.text}`
      : `Create a course on: ${topic}`;

    if (fileContent.imageBase64 && fileContent.mimeType) {
      userContent = [
        { type: "image_url", image_url: { url: `data:${fileContent.mimeType};base64,${fileContent.imageBase64}` } },
        { type: "text", text: `Create a course on: ${topic}\n\nThe attached image/document is the SOURCE MATERIAL.` },
      ];
    } else {
      userContent = topicMessage;
    }

    const systemPrompt = `You are an expert educational designer for Repend, a dynamic cognitive simulation learning platform.

CRITICAL: You are DESIGNING unique lab engines from scratch for each concept. You are NOT filling templates. Each lab must have unique mechanics, variables, and interactions specific to the topic domain.

Generate structured JSON via the function tool.

=== LESSON FORMAT ===
Slides separated by "---". Use emoji headers (🔥🎯📊💡🧪🧠✅⚡🛠📈🌎🎭), tables, short paragraphs, bullet points.
7-slide sequence: 🎯Objective → 🧠Core Concept → 📊Visual Summary → 🌎Real-World → 🧪Lab Preview → 🧠Challenge → ✅Takeaways

=== LAB DESIGN PHILOSOPHY ===
Labs are SYSTEM EXPLORATIONS, not worksheets. Each lab MUST:
1. Use domain-specific variables (Chemistry: Temperature/pH/Pressure, NOT Efficiency/Quality)
2. Create real tradeoffs — no choice improves everything
3. Feel like exploring a real system
4. Have unique mechanics per module
5. Connect to real-world applications

=== LAB TYPES ===
You may use ANY of these lab types — choose what fits the concept best:

SIMULATION: Interactive system with parameters and decisions that shift state
{ "parameters": [{"name": "domain-specific", "icon", "unit", "min", "max", "default"}], "decisions": [{"question", "emoji", "choices": [{"text", "explanation", "set_state": {all params}}]}], "thresholds": [{label, min_percent, message}], "repend_intro": {...}, "key_insight": "..." }

CLASSIFICATION: Sort items into categories
{ "categories": [{"name", "description", "color"}], "items": [{"content", "correctCategory", "explanation"}], "repend_intro": {...}, "key_insight": "..." }

POLICY_OPTIMIZATION: Achieve goals within constraints
{ "parameters": [...], "constraints": [{"parameter", "operator", "value", "label"}], "max_decisions": 3, "decisions": [...], "repend_intro": {...}, "key_insight": "..." }

ETHICAL_DILEMMA: Navigate moral tradeoffs across dimensions
{ "dimensions": [{"name", "icon", "description"}], "decisions": [{"question", "choices": [{"text", "explanation", "impacts": {dim: delta}}]}], "repend_intro": {...}, "key_insight": "..." }

DECISION_LAB: Scenario-based strategic choice
{ "concept_knowledge": {"definition", "key_ideas", "examples"}, "real_world_relevance": {"explanation", "domain"}, "scenario", "decision_challenge": {"question", "options": [{"id", "text", "consequence", "is_best"}]}, "best_decision_explanation" }

MATH_LAB: Visual math exploration
{ "visual_type": "graph"|"geometry"|"solution_steps"|"chart", "tasks": [{"id", "description", "type", "correct_answer"}], "graph_data", "hints", "solution", "solution_explanation" }

You can also use creative lab types like: "systems_modeling", "data_analysis", "logic_puzzle", "engineering_design", "genetics_lab", "economics_sim", "physics_model", etc. — as long as the lab_data has parameters+decisions OR categories+items OR dimensions+decisions OR tasks structure.

=== REPEND INTRO (required for all non-math labs) ===
{ "repend_intro": { "relevance": "WHERE used in real life", "role": "Specific role", "scenario_context": "2-3 sentence scene", "information": ["Fact 1", "Fact 2", "Fact 3"], "objective": "1 sentence skill" }, "key_insight": "Core lesson" }

=== QUIZ RULES ===
8-10 questions per module. Mix: conceptual, applied, scenario-based, advanced challenge. No "all of the above".

=== ANTI-REPETITION ===
- Each module MUST use a DIFFERENT lab mechanic and scenario
- Domain-specific variables ONLY (NOT generic "Efficiency", "Quality", "Cost")
- For 4-6 modules, use AT LEAST 3 different lab_types
- Each lab must feel like a completely different experience

${filePath ? "IMPORTANT: Base ALL content on the uploaded SOURCE MATERIAL." : ""}
Generate 4-6 modules with diverse lab types.`;

    const aiRequestBody = JSON.stringify({
      model: "google/gemini-3-flash-preview",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      tools: [{
        type: "function",
        function: {
          name: "create_course",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              modules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    lesson_content: { type: "string", description: "Markdown lesson with --- slide separators" },
                    youtube_query: { type: "string" },
                    youtube_title: { type: "string" },
                    lab_type: { type: "string", description: "Lab type: simulation, classification, policy_optimization, ethical_dilemma, decision_lab, math_lab, or any creative type" },
                    lab_data: { type: "object", description: "Lab configuration — structure depends on lab_type" },
                    quiz: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          options: { type: "array", items: { type: "string" } },
                          correct: { type: "number" },
                          explanation: { type: "string" },
                        },
                        required: ["question", "options", "correct", "explanation"],
                      },
                    },
                  },
                  required: ["title", "lesson_content", "lab_type", "lab_data", "quiz"],
                },
              },
            },
            required: ["title", "description", "modules"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "create_course" } },
    });

    // Retry logic
    const MAX_RETRIES = 2;
    let aiData: any = null;
    let lastError = "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = attempt * 3000;
        console.log(`[AI Retry] Attempt ${attempt + 1} after ${delay}ms delay...`);
        await new Promise(r => setTimeout(r, delay));
      }

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: aiRequestBody,
        });

        if (response.status === 429) { lastError = "Rate limit exceeded."; continue; }
        if (response.status === 402) throw new Error("AI credits exhausted.");

        const responseText = await response.text();
        if (!response.ok) { lastError = `AI gateway error (${response.status}).`; continue; }

        let parsed: any;
        try { parsed = JSON.parse(responseText); } catch {
          lastError = "AI returned invalid response."; continue;
        }

        if (!parsed.choices?.length) { lastError = "Empty AI response."; continue; }
        aiData = parsed;
        break;
      } catch (fetchErr: any) {
        if (fetchErr.message?.includes("credits")) throw fetchErr;
        lastError = fetchErr.message || "Network error.";
      }
    }

    if (!aiData) throw new Error(lastError || "Failed after retries.");

    const message = aiData.choices[0].message;
    const toolCall = message?.tool_calls?.[0];

    if (!toolCall) {
      const finishReason = aiData.choices[0]?.finish_reason;
      throw new Error(`AI did not return course data (reason: ${finishReason || "unknown"}).`);
    }

    // Parse and repair truncated JSON
    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      let raw = toolCall.function.arguments || "";
      raw = raw.replace(/,\s*$/, "");
      const closers = ["]}]}", "]}}", "]}", "}", "]"];
      let repaired = false;
      for (const closer of closers) {
        try { parsed = JSON.parse(raw + closer); repaired = true; break; } catch { /* next */ }
      }
      if (!repaired) throw new Error("AI response was truncated. Try a simpler topic.");
    }

    const repaired = repairModules(parsed);
    const courseData = CourseSchema.parse(repaired);

    await supabase
      .from("courses")
      .update({ title: courseData.title, description: courseData.description, status: "ready" })
      .eq("id", course.id);

    const modules = courseData.modules.map((mod: any, index: number) => {
      let lessonContent = mod.lesson_content || "";
      if (!lessonContent.includes("\n---\n")) {
        const sections = lessonContent.split(/(?=^## )/m).filter(Boolean);
        if (sections.length > 1) lessonContent = sections.join("\n\n---\n\n");
      }
      return {
        course_id: course.id,
        module_order: index + 1,
        title: mod.title,
        lesson_content: lessonContent,
        youtube_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(mod.youtube_query || mod.title)}`,
        youtube_title: mod.youtube_title || mod.title,
        lab_type: mod.lab_type,
        lab_data: mod.lab_data,
        quiz: mod.quiz,
      };
    });

    await supabase.from("course_modules").insert(modules);

    // Track file-based generation
    if (filePath) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: existing } = await supabaseAdmin.from("usage_tracking").select("id, file_courses_generated").eq("user_id", user.id).eq("month", currentMonth).single();
      if (existing) {
        await supabaseAdmin.from("usage_tracking").update({ file_courses_generated: (existing.file_courses_generated || 0) + 1 }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("usage_tracking").insert({ user_id: user.id, month: currentMonth, file_courses_generated: 1, courses_generated: 1 });
      }
    }

    return new Response(JSON.stringify({ courseId: course.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("COURSE GENERATION ERROR:", error);

    if (error instanceof z.ZodError) {
      console.error("ZOD VALIDATION DETAILS:", JSON.stringify(error.issues, null, 2));
      return new Response(
        JSON.stringify({ error: "Course generation produced invalid data. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
