# Bulletproof Lab Repair: Implementation Plan

## Problem

The `repairModules` function in `supabase/functions/generate-course/index.ts` only partially patches simulation labs and barely touches the other 3 lab types. When the AI returns empty arrays or missing fields, labs show "Lab Data Unavailable" on the frontend.

## Solution

Replace the entire `repairModules` function (lines 41-167) with a new architecture consisting of:

- 4 dedicated **validator** functions (deep shape checks, not just emptiness)
- 4 dedicated **fallback generator** functions (context-aware, using `mod.title`)
- A **final guard** that forces a valid simulation if everything else fails
- **Telemetry logging** on every repair trigger

## File Changed

Only `supabase/functions/generate-course/index.ts` -- no frontend changes needed.

---

## Validator Functions (Deep Shape Checks)

### `isValidSimulation(ld)`

- `parameters` is array of exactly 3 items
- Each parameter has `name` (string), `min` (number), `max` (number), `default` (number)
- `decisions` is array with length >= 2
- Every choice has `set_state` object containing ALL 3 parameter names as keys with numeric values
- `thresholds` is array with length === 3

### `isValidClassification(ld)`

- `categories` is array with length >= 3, each has `name` (string)
- `items` is array with length >= 5, each has `content` or `name` (string) and `correctCategory` or `correct_category` (string)

### `isValidPolicyOptimization(ld)`

- `parameters` is array with length >= 3, each has `name`, `min`, `max`, `default`
- `constraints` is array with length >= 2, each has `parameter` (string), `operator` (string), `value` (number), `label` (string)
- `decisions` is array with length >= 2, every choice has `set_state` covering all param names
- `max_decisions` is a number

### `isValidEthicalDilemma(ld)`

- `dimensions` is array with length >= 3, each has `name` (string), `icon` (string), `description` (string)
- `decisions` is array with length >= 3, every choice has `impacts` object covering all dimension names with numeric values

---

## Fallback Generator Functions

### `generateSimulationFallback(title: string)`

Returns complete lab_data with:

- 3 parameters named contextually (e.g., for "Supply Chain": "Logistics Efficiency", "Cost Control", "Delivery Speed")
- Uses a keyword-matching approach: extract words from `title` to create `"[Title] Factor A"`, `"[Title] Factor B"`, `"[Title] Factor C"` as parameter names
- 3 thresholds: Excellent (75+), Good (50+), Needs Work (0+)
- 2 decisions with 2 choices each, all `set_state` values cover all 3 params as integers 0-100

### `generateClassificationFallback(title: string)`

Returns complete lab_data with:

- `title` and `description` derived from module title
- 3 categories: "Core Concepts", "Supporting Factors", "Common Misconceptions" with hex colors
- 6 items with `content`, `correctCategory`, `explanation` -- distributed across categories (2 per category)

### `generatePolicyOptimizationFallback(title: string)`

Returns complete lab_data with:

- 3 parameters with defaults at 50
- 2 constraints with exact shape: `{ parameter, operator: ">", value: 60, label }`
- `max_decisions: 3`
- 2 decisions with 2 choices each, all `set_state` covering all 3 params

### `generateEthicalDilemmaFallback(title: string)`

Returns complete lab_data with:

- 3 dimensions: "Effectiveness", "Fairness", "Sustainability" with icons and descriptions
- 3 decisions with 2 choices each
- Impacts use a rotating tradeoff pattern, programmatically enforced:
  - Decision 1: Choice A = `{+15, -10, 0}`, Choice B = `{-10, +15, 0}`
  - Decision 2: Choice A = `{0, +15, -10}`, Choice B = `{0, -10, +15}`
  - Decision 3: Choice A = `{-10, 0, +15}`, Choice B = `{+15, 0, -10}`

---

## Repair Flow

```text
for each module:
  1. mod.lab_data = mod.lab_data ?? {}
  2. Repair lesson_content, lab_type, quiz (keep existing logic)
  3. Run type-specific validator:
     if !isValidSimulation(ld) -> mod.lab_data = generateSimulationFallback(title)
     if !isValidClassification(ld) -> mod.lab_data = generateClassificationFallback(title)
     if !isValidPolicyOptimization(ld) -> mod.lab_data = generatePolicyOptimizationFallback(title)
     if !isValidEthicalDilemma(ld) -> mod.lab_data = generateEthicalDilemmaFallback(title)
  4. If AI returned partial-but-valid data, ALSO patch individual fields:
     - Simulation: clamp values, fill missing set_state keys, convert effects->set_state
     - PolicyOpt: clamp param values, ensure constraint shape
     - EthicalDilemma: ensure dimension icons/descriptions
  5. Final guard: if STILL invalid -> force simulation + error-level log
```

## Telemetry

- `console.warn("[RepairModules] <lab_type> fallback generated for: <title>")` on type-specific fallback
- `console.error("[RepairModules] FINAL GUARD - Forced simulation for: <title>")` on final guard (error level because this means total AI failure)

## What This Guarantees

After deployment, no lab will ever show "Lab Data Unavailable" again. Worst case: students get a contextual fallback lab. But never a broken one.