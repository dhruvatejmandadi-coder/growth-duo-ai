
# Merge Decision + Simulation Into One Unified Module

## What Changes

**Delete** `DecisionLab.tsx` -- its functionality gets absorbed into `SimulationLab.tsx` (which already has decision scenarios that move sliders).

**Update** `InteractiveLab.tsx`:
- Remove the `DecisionLab` import and rendering branch
- Route ALL lab types (`"simulation"` and `"decision"`) to `SimulationLab`
- When AI generates a `"decision"` type lab, convert its `scenarios` data into the simulation format (parameters + decisions that affect them)

**Update** `InteractiveLab.tsx` fallback logic:
- All fallbacks produce simulation-with-decisions format (already mostly done)
- Add decision scenarios to the existing topic-based fallbacks (currently they only have sliders, no decisions)

**Update** `generate-course` edge function:
- Remove the separate `"decision"` lab type from AI generation
- All labs generate as `"simulation"` with both `parameters` (sliders) and `decisions` (scenarios that move sliders)
- Update the prompt to always produce the combined format

**Update** `ClassificationLab` -- stays as-is (it's a different mechanic entirely: drag-and-sort)

## The Unified Flow

1. User sees scenario questions first (AI-generated, topic-specific)
2. Each choice adjusts slider values with visible effect badges
3. After answering, user can fine-tune sliders manually
4. Live outcome bar updates in real-time
5. All scenarios done -> summary banner, sliders still editable

This is exactly what `SimulationLab.tsx` already does. The only work is removing the separate `DecisionLab` path and ensuring the AI never generates standalone decision labs.

## Files

### Delete
- `src/components/labs/DecisionLab.tsx`

### Modify
- `src/components/labs/InteractiveLab.tsx` -- remove DecisionLab import/branch, convert any incoming `"decision"` data to simulation format, add decision scenarios to all topic fallbacks
- `supabase/functions/generate-course/index.ts` -- remove `"decision"` as a separate lab type, always generate combined simulation+decisions format, update fallback logic

### No Changes
- `src/components/labs/SimulationLab.tsx` -- already has the full decision+slider UI
- `src/components/labs/ClassificationLab.tsx` -- separate mechanic, stays

## Technical Details

### InteractiveLab.tsx Changes

In `isValidLabData`: remove the `"decision"` branch. Incoming `"decision"` type data gets converted to simulation format via a converter function:

```text
function convertDecisionToSimulation(data): SimulationData
  - Extract unique "effect" keys from all scenario choices to build parameters
  - Map scenarios to the decisions array format SimulationLab expects
  - Generate thresholds automatically
```

In `generateTopicFallback`: add 2-3 decision scenarios to each topic category (economics gets budget decisions, science gets experiment decisions, etc.)

### Edge Function Changes

Update the AI prompt to only generate `"simulation"` labs with both `parameters` and `decisions` arrays. Remove the `"decision"` fallback branch. The validation check for `"decision"` type gets removed since it's no longer generated.

## Implementation Order

1. Update `generate-course` edge function (remove decision type, always generate combined)
2. Deploy edge function
3. Add decision scenarios to all topic fallbacks in `InteractiveLab.tsx`
4. Add converter function for legacy `"decision"` data in `InteractiveLab.tsx`
5. Remove `DecisionLab` import/branch from `InteractiveLab.tsx`
6. Delete `DecisionLab.tsx`
