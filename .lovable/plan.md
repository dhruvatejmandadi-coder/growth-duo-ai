

# Seamless Login + Decision Labs Feature

## Part 1: Fix Login Experience

### Problem
After signing in, the auth state change triggers a redirect to `/courses`, but the `useAuth` listener and component re-renders may not sync instantly, causing a brief "logged out" flash.

### Solution
- Ensure `Login.tsx` and `Signup.tsx` only redirect after the auth context confirms the user is set (the `useEffect` already does this, but the manual `navigate("/courses")` in `handleSubmit` can fire before `onAuthStateChange` updates)
- Remove the duplicate `navigate("/courses")` from `handleSubmit` success handlers -- let the `useEffect([user])` handle all redirects consistently
- For Google OAuth, the `redirect_uri` is set to `window.location.origin` (landing page `/`), which shows the guest landing page briefly. Change it so after OAuth callback, the user is redirected to `/courses` if authenticated
- Add a loading state in `Index.tsx` (landing page) that checks auth and redirects authenticated users to `/courses` immediately, preventing the "guest landing page flash"

### Files Changed
- `src/pages/Login.tsx` -- remove manual navigate in handleSubmit, rely on useEffect
- `src/pages/Signup.tsx` -- same cleanup
- `src/pages/Index.tsx` -- add auth check to redirect logged-in users to `/courses`

---

## Part 2: Decision Labs Feature

### Database
Create a `lab_results` table to store lab completion data:

```text
lab_results
-----------
id              uuid (PK, default gen_random_uuid())
user_id         text (NOT NULL, references auth.users pattern)
lab_id          text (NOT NULL) -- e.g. "startup-founder"
metrics         jsonb -- {growth, skill, stress, confidence}
decisions       jsonb -- array of decision records
decision_style  text -- computed label like "Strategic Planner"
completed_at    timestamptz (default now())
created_at      timestamptz (default now())
```

RLS: Users can only read/insert their own results.

### Lab Data Structure
Each lab is defined as static data with:
- Title, description, icon
- Array of scenarios (reusing the existing `DecisionLab` component pattern)
- Each choice modifies internal metrics (growth, skill, stress, confidence)
- Completion logic computes a "Decision Style" label based on final metrics

### 3 Starter Labs
1. **Startup Founder Lab** -- decisions about product, hiring, fundraising
2. **Career Decision Lab** -- job offers, skill pivots, networking
3. **Productivity Optimization Lab** -- time management, focus, delegation

### New Files
- `src/pages/Labs.tsx` -- main Labs page showing lab cards, locked for guests
- `src/data/labs.ts` -- static lab definitions (scenarios, choices, metric impacts)
- `src/components/labs/LabRunner.tsx` -- enhanced lab engine with metric tracking, hints (adaptive), and animated transitions
- `src/components/labs/LabCompletionScreen.tsx` -- shows decision style, metrics summary, course recommendations, awards points + badge

### Adaptive Logic
- Read user survey data from `localStorage` (skill_level, interests, time_commitment)
- If beginner: show hint text on choices
- If advanced: hide hints, add time pressure indicator
- Sort lab cards by relevance to user interests (e.g., business interest shows Startup Lab first)

### Navigation
- Add "Labs" to the sidebar (`AppSidebar.tsx`) for authenticated users, between Courses and Challenges
- Add `/labs` route to `App.tsx`
- Icon: `FlaskConical` from lucide-react

### Points Integration
- Award 75 points on lab completion via existing `usePoints` hook
- Add a "Lab Master" achievement (complete 3 labs)
- Show points animation on completion screen

### Completion Screen
After finishing a lab:
- Animated metrics visualization (growth, skill, confidence, stress bars)
- Decision style label (computed from metrics pattern)
- 2-3 recommended course topics based on lab theme
- "Start a Course" button that pre-fills the course generator
- Badge unlock notification

---

## Implementation Order

1. Fix login redirect behavior (Part 1) -- quick fix across 3 files
2. Create `lab_results` database table with RLS
3. Create lab data definitions (`src/data/labs.ts`)
4. Build `LabRunner` component with metric tracking
5. Build `LabCompletionScreen` component
6. Create `Labs.tsx` page
7. Add Labs to sidebar navigation and router
8. Wire up points and achievements
9. Add adaptive logic based on survey responses

