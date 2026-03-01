

# Slide-Based Content Generation Overhaul

## What Changes

Two areas need updating to enforce the new structured slide format with bullet-only content, slide type rotation, and higher-quality quizzes.

---

## 1. Update AI System Prompt (Edge Function)

**File:** `supabase/functions/generate-course/index.ts` (lines 437-535)

Replace the `lesson_content` instructions in the system prompt with the full slide specification:

- Each slide separated by `---`
- Each slide must start with `<!-- type: [concept|example|case_study|comparison|quick_think|myth_vs_reality|process|interactive_predict|key_takeaways] -->`
- Followed by `## Slide Title`
- Then 4-7 bullet points only (no paragraphs, under 15 words each)
- 4-8 slides per module
- Mandatory rotation: no more than 2 of same type, at least 1 applied slide, 1 interactive slide
- Final slide must be `key_takeaways` that synthesizes the module and connects to the course goal
- Topic relevance enforcement: every slide must directly relate to the module title and support the broader course objective
- Interactive slides must use module-specific terminology and scenarios

Update quiz instructions to require 6-8 questions per module with a specific mix:
- 2 conceptual questions
- 2 applied reasoning questions
- 2 scenario-based questions
- 1 optional advanced challenge
- No definition-only, no trivia, no "All of the above", no verbatim bullet repetition

### Key Prompt Sections to Add

```text
LESSON CONTENT FORMAT -- CRITICAL:
Each slide is separated by "---". Each slide MUST follow this exact format:

<!-- type: [concept|example|case_study|comparison|quick_think|myth_vs_reality|process|interactive_predict|key_takeaways] -->
## Slide Title

- Bullet point 1
- Bullet point 2
- Bullet point 3
- Bullet point 4

SLIDE RULES:
- 4-8 slides per module
- 4-7 bullets per slide, each under 15 words
- NO paragraphs -- bullets ONLY
- Do NOT repeat the slide title in bullets
- No more than 2 slides of the same type per module
- At least 1 applied slide (example, case_study, comparison)
- At least 1 interactive slide (quick_think or interactive_predict)
- Final slide MUST be <!-- type: key_takeaways --> and must synthesize the module

TOPIC RELEVANCE:
- Every slide must directly relate to the module title
- Every bullet must progress the learner toward the course objective
- Avoid generic filler, unrelated examples, or repeated ideas

QUIZ RULES:
- 6-8 questions per module
- Include 2 conceptual, 2 applied reasoning, 2 scenario-based
- No definition-only questions, no trivia, no "All of the above"
- Each question must connect to the module's learning objective
```

---

## 2. Enhance Slide Repair Logic (Edge Function)

**File:** `supabase/functions/generate-course/index.ts` -- update `repairModules`

Add slide-level repair after the existing `lesson_content` recovery:

- Convert any paragraph text (lines without `- ` prefix under a heading) into bullet points
- Inject `<!-- type: concept -->` if a slide is missing a type comment
- Ensure the last slide has `<!-- type: key_takeaways -->`
- Validate slide count is 4-8: if under 4, keep as-is (minimal content); if over 8, merge the smallest adjacent slides

---

## 3. Upgrade Frontend Slide Viewer

**File:** `src/components/courses/LessonSlides.tsx`

Parse the `<!-- type: X -->` comment from each slide to extract the slide type and display it:

- Extract slide type from comment and `## title` from heading
- Render a colored badge for the slide type (e.g., "Concept", "Case Study", "Quick Think") at the top of each slide
- Render the title as a styled heading outside the prose block
- Strip the comment and heading from the markdown before passing to ReactMarkdown
- Add progress dots below the slide navigation
- Increase min-height to 300px
- Add a subtle fade transition between slides using CSS

### Slide Type Badge Colors
- concept: blue
- example: green
- case_study: purple
- comparison: orange
- quick_think: yellow
- myth_vs_reality: red
- process: teal
- interactive_predict: indigo
- key_takeaways: emerald

---

## Summary of Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-course/index.ts` | Rewrite system prompt for slide format + quiz rules; enhance repair logic |
| `src/components/courses/LessonSlides.tsx` | Parse slide types, render badges/titles, progress dots, fade transitions |

