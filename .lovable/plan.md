# Fix Fallback Parameters and Update Plan

## The Problem

The current fallback parameters use "Factor A/B/C" which are generic and meaningless. Using `${mod.title} Factor 1` would produce something like "Introduction to Economics Factor 1" -- still not real topic-specific names like "Inflation" or "GDP Growth".

The AI prompt already instructs the model to generate domain-specific parameter names. This fallback only triggers when the AI completely fails to produce parameters, which is rare.

## The Fix

### 1. `.lovable/plan.md` -- Full Rewrite

Replace with the comprehensive topic-based state model document provided earlier, covering:

- Core principles (deterministic, topic-driven, strict structure)
- Simulation schema with parameter and decision formats
- AI generation rules (derive 3-5 topic variables, no abstract metrics)
- Backend validation and frontend assumptions
- Example topics (Physics, Cybersecurity, Climate Policy)

### 2. `supabase/functions/generate-course/index.ts` -- Fallback Parameters (lines 81-85)

Replace "Factor A/B/C" with module-title-derived names that at least give context:

```
ld.parameters = [
  { name: `${mod.title} Variable 1`, ... default: 0 },
  { name: `${mod.title} Variable 2`, ... default: 0 },
  { name: `${mod.title} Variable 3`, ... default: 0 },
];
```

This is a last-resort fallback. In practice, the AI generates proper names like "Inflation", "GDP Growth", etc. from the prompt instructions. The fallback only fires if the AI returns no parameters at all. It won't show truly meaningful names because the backend can't intelligently derive domain variables without AI -- but it will at least include the module title for context.

### 3. Error Handling Improvement (catch block, ~line 366)

Detect Zod validation errors and return a cleaner user-facing message instead of dumping the raw JSON issues array.

## Important Note

The **real** topic-specific slider names come from the AI generation prompt, which already has strict rules like:

> "Parameter names MUST be relevant to the course topic (e.g. for Economics: GDP Growth, Inflation Rate, Employment)"

The fallback is just a safety net. If the AI is consistently producing generic names, the fix is in the prompt wording, not the fallback -- and the current prompt already handles this correctly.