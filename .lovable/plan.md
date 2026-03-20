

# Fix Lab Blueprint Generation — Root Cause & Plan

## Problem Diagnosis

The 3-stage architecture is correctly wired. Phase 2 already uses `google/gemini-2.5-pro`. But the blueprint tool call schema is **too vague**:

```typescript
// Current — line 347-349
parameters: {
  properties: {
    blueprint: { type: "object", description: "The complete lab blueprint" },
  }
}
```

The model receives `{ type: "object" }` with zero property definitions. It has no structured guidance on what fields to return, so it either:
- Returns a shallow/empty object
- Returns fields that don't match what `extractToolArgs` expects
- Gets truncated because there's no `max_tokens` set

The system prompt describes the schema in natural language, but **tool calling works best when the schema itself defines the structure**.

## Plan (3 changes, all in one file)

### 1. Define full blueprint schema in tool parameters

Replace the vague `{ type: "object" }` with explicit property definitions for `blocks`, `variables`, `title`, `kind`, `scenario`, etc. This gives the model a concrete contract to fill. The key arrays (`blocks`, `variables`) will have `items` definitions with all supported block types.

### 2. Add retry on empty blocks

After `extractToolArgs`, if `blueprint.blocks` is empty or missing after repair, retry the call once with a shorter, more direct prompt: "You MUST return at least 3 blocks. Return a choice_set, a step_task, and an insight block minimum."

### 3. Set `max_tokens: 8192`

The blueprint response is large structured JSON. Without `max_tokens`, the model may truncate. Add explicit `max_tokens: 8192` to the Phase 2 AI call.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-course/index.ts` | (1) Expand tool schema for `create_lab_blueprint` with full property definitions, (2) add retry-on-empty-blocks loop, (3) add `max_tokens: 8192` to Phase 2 call |

## Technical Details

The expanded tool schema will define:
- `title` (string, required)
- `kind` (string, required)  
- `scenario` (string, required)
- `variables` (array of objects with name/icon/unit/min/max/default)
- `blocks` (array of objects with type + type-specific fields)
- `completion_rule` (string)
- `intro` (object with relevance/role/scenario_context/information/objective)

The retry logic:
```
attempt 1: full prompt + full schema
if blocks.length === 0:
  attempt 2: simplified prompt demanding minimum 3 blocks
if still empty:
  mark as failed (no silent empty saves)
```

