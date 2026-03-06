# Simulation Lab Architecture – Topic-Based State Model

## Overview

Simulation labs use a deterministic `set_state` model.
Each decision sets topic-specific sliders to exact values (0–100).
This is NOT based on learner understanding, application, or confidence.
Sliders represent variables intrinsic to the topic being simulated.

---

## Core Principles

1. **Deterministic**
   - No deltas.
   - No additive effects.
   - Each decision sets the full state snapshot.

2. **Topic-Driven**
   - Slider names are derived from the course topic.
   - Example:
     - Economics → Inflation, Employment, GDP
     - Biology → Population, Resources, Predators
     - Programming → Performance, Readability, Memory Usage

3. **Strict Structure**
   - Every choice must include `set_state`.
   - `set_state` must define ALL sliders.
   - Values must be integers 0–100.
   - At least 2 sliders must change per choice.

---

## Simulation Lab Schema

Each simulation module must include:
- `parameters`: array of sliders
- `decisions`: array of decision scenarios

### Parameter Format

```json
{
  "name": "Inflation",
  "default": 50
}
```

### Decision Format

```json
{
  "prompt": "You increase interest rates.",
  "choices": [
    {
      "text": "Raise rates aggressively",
      "explanation": "This slows spending but stabilizes inflation.",
      "set_state": {
        "Inflation": 40,
        "Employment": 45,
        "GDP": 55
      }
    }
  ]
}
```

---

## AI Generation Rules

When generating a simulation lab:

- Derive 3–5 meaningful topic variables.
- Each variable must represent a measurable system dimension.
- **Avoid** abstract learning metrics (e.g., Understanding, Confidence).
- Decisions must reflect realistic cause-and-effect within the topic domain.
- All choices must:
  - Include `set_state`
  - Set ALL sliders
  - Use integer values 0–100

---

## Backend Validation

Before Zod validation:
- Ensure `lab_type === "simulation"` includes `parameters` + `decisions`.
- If a choice is missing `set_state`, generation fails.
- If a slider is missing from `set_state`, generation fails.
- Clamp values 0–100.
- No legacy `effects` support.

---

## Frontend Assumptions

Frontend expects:
- Fully populated `set_state`
- Complete slider coverage
- No partial states
- No deltas
- If a slider is missing, throw error.

---

## Example Topics

### Physics – Projectile Motion
Sliders: Velocity, Angle, Air Resistance

### Cybersecurity – Network Defense
Sliders: Vulnerability, Detection Speed, System Stability

### Climate Policy
Sliders: Carbon Emissions, Economic Output, Public Approval

---

## Why This Model

Topic-based sliders:
- Make labs feel real.
- Improve immersion.
- Create logical cause-and-effect.
- Avoid artificial "learning score" gamification.
- Produce consistent deterministic behavior.

---

# File-Based Course Generation

Allow users to drag-and-drop files (PDF, TXT, MD, PNG, JPG) into the course creation flow. The AI reads the file content and generates a structured slide-based course from it.

## Flow
User drops file → Upload to `course-uploads` bucket → Edge function fetches file → Convert to base64 → Send to Gemini as document input → Same slide/lab/quiz output as topic-based generation.

## Changes
1. Storage bucket `course-uploads` (done — private, 10MB max, RLS per user)
2. Update `src/pages/Courses.tsx` — add drag-and-drop zone below topic input
3. Update `supabase/functions/generate-course/index.ts` — accept `fileUrl`, fetch from storage, send as multimodal content to Gemini

---

# Pricing Model & Stripe Integration

## 3-Tier Pricing

| | Starter (Free) | Pro ($7.99/mo) | Elite ($11.99/mo) |
|---|---|---|---|
| AI Course Generation | 2/month | 10/month | 15/month |
| Modules per Course | Up to 5 | Up to 10 | Unlimited |
| File Upload Courses | No | 3/month | Unlimited |
| Interactive Labs | Basic only | All lab types | All + priority |
| Community | Full access (free) | Full access | Enhanced (TBD) |
| Daily Challenges | View only | Full participation | Full + exclusive (TBD) |
| Quizzes | Limited retries | Unlimited | Unlimited + analytics |
| Certificates | No | Yes | Yes + shareable |
| Progress Analytics | Basic | Detailed | Advanced behavioral |

## Implementation
1. Stripe products: Pro ($7.99/mo), Elite ($11.99/mo)
2. Database: `subscriptions` + `usage_tracking` tables (done)
3. Edge functions: `create-checkout`, `check-subscription`, `customer-portal`
4. Frontend: `useSubscription` hook, Pricing page, UpgradePrompt component
5. Feature gating across Courses, Community, Challenges, Profile
6. Navigation: Pricing link in Header, Upgrade button in Sidebar above Sign Out
