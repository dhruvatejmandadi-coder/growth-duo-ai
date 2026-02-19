
# Remove Standalone Labs, Fold Decisions Into Courses

## Overview

Delete the entire standalone Labs system (page, route, sidebar link, standalone lab data, runner, completion screen). Keep the **in-course interactive labs** (SimulationLab, DecisionLab, ClassificationLab) that are already embedded inside course modules -- these stay untouched. The `lab_results` database table remains (it stores per-user data) but is no longer actively written to from the standalone system.

## What Gets Deleted

### Files to delete entirely:
- `src/pages/Labs.tsx` -- standalone Labs page
- `src/data/labs.ts` -- standalone lab definitions (Startup Founder, Career Decision, Productivity)
- `src/components/labs/LabRunner.tsx` -- standalone lab engine
- `src/components/labs/LabCompletionScreen.tsx` -- standalone lab completion screen

### Files to modify:

**`src/App.tsx`**
- Remove the `/labs` route
- Remove the `Labs` import

**`src/components/layout/AppSidebar.tsx`**
- Remove "Labs" from `authedMainItems`
- Remove `FlaskConical` import

**`src/hooks/usePoints.ts`**
- Remove `LAB_COMPLETION: 75` from `POINTS_VALUES`

**`src/pages/ProgressPage.tsx`**
- Remove "Complete a lab" from the "How to Earn" list

**`src/components/landing/ValueProp.tsx`**
- Update copy to say "interactive decision modules" instead of "interactive labs"

## What Stays (No Changes)

These are the **in-course** lab components that render inside `CourseView.tsx` when viewing a module's "Lab" tab. They are not part of the standalone Labs system:

- `src/components/labs/InteractiveLab.tsx` -- router for in-course labs (stays)
- `src/components/labs/DecisionLab.tsx` -- decision scenarios inside courses (stays)
- `src/components/labs/SimulationLab.tsx` -- slider simulations inside courses (stays)
- `src/components/labs/ClassificationLab.tsx` -- sorting exercises inside courses (stays)
- `src/pages/CourseView.tsx` -- already has Lesson/Lab/Quiz tabs per module (stays as-is)
- `supabase/functions/generate-course/index.ts` -- already generates decision/simulation/classification labs per module (stays)

The course generation already creates decision labs tied to each module's topic. The screenshot you shared (Thrust Simulator with sliders) is an in-course simulation lab -- that stays.

## Database

- `lab_results` table stays in place (has existing user data). No migration needed.
- No new tables or schema changes required.

## Summary

This is purely a deletion/cleanup task. The in-course lab system is already fully functional with decision, simulation, and classification types generated per-module by the AI course generator. The standalone "Labs" feature was a parallel system that is now redundant.

## Technical Implementation Order

1. Delete the 4 standalone lab files
2. Update `App.tsx` (remove route + import)
3. Update `AppSidebar.tsx` (remove Labs nav item)
4. Update `usePoints.ts` (remove LAB_COMPLETION)
5. Update `ProgressPage.tsx` (remove lab entry from How to Earn)
6. Update `ValueProp.tsx` (update marketing copy)
