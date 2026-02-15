

# Mix Lab Types: Add Decision & Classification Labs

## Problem
The system prompt and schema already support all three lab types (simulation, decision, classification), but the AI defaults to generating only simulation labs. The server-side fallback also only produces simulation labs. The result: every module gets sliders, no variety.

## Changes

### File: `supabase/functions/generate-course/index.ts`

**1. Add explicit variety instruction to the system prompt**

Add to the system prompt (around line 54-74):

```
CRITICAL: LAB TYPE VARIETY
- A course with 4-6 modules MUST use a MIX of lab types. Use at least 2 different lab_type values across the course.
- Suggested distribution: 2 simulation labs, 2 decision labs, 1-2 classification labs.
- Decision labs work great for modules about processes, trade-offs, real-world applications, ethics, or strategy.
- Classification labs work great for modules about categorization, terminology, identifying types, or sorting concepts.
- Simulation labs work great for modules about measurable variables, cause-and-effect, or quantitative relationships.
- Pick the lab_type that best fits each module's content — do NOT default everything to simulation.
```

**2. Improve the server-side fallback to rotate lab types**

Currently lines 261-309 always fall back to `labType = "simulation"`. Change the fallback to rotate through types based on the module index:

- Module index % 3 === 0 --> simulation fallback (existing logic with key-term extraction)
- Module index % 3 === 1 --> decision fallback: generate 2-3 scenarios from the lesson content key terms, each with 3 choices (positive/negative/neutral)
- Module index % 3 === 2 --> classification fallback: extract 3 categories from key terms and create 6 items to sort

This ensures even when the AI fails, users still see varied lab types.

**3. No changes to frontend**

`InteractiveLab.tsx` already handles all three lab types and has frontend fallbacks. `DecisionLab.tsx` and `ClassificationLab.tsx` already render properly. No frontend changes needed.

## Summary
- One file changed: `supabase/functions/generate-course/index.ts`
- Prompt update to force lab type variety
- Fallback logic expanded from simulation-only to all three types
- Zero new API calls, zero new dependencies

