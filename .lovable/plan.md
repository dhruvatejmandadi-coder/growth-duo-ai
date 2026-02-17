# Repend AI -- Major Platform Upgrade

This is a large upgrade covering 10 feature areas. To avoid breaking existing features and keep quality high, the implementation is split into **3 phases**. Each phase builds on the previous one.

---

## Phase 1: Core Infrastructure (This Implementation)

These are the foundational changes that everything else depends on.

### 1A. Course Completion System

**Database changes:**

- Create `course_progress` table: tracks `user_id`, `course_id`, `completed_lessons` (jsonb array of module IDs), `completed` (boolean), `completed_at`
- Create `badges` table: `name`, `description`, `icon`, `course_id` (nullable for non-course badges)
- Create `user_badges` table: `user_id`, `badge_id`, `earned_at`
- All tables get RLS policies (users can only read/write their own data)

**Code changes:**

- Update `CourseView.tsx`: When all modules are marked complete, auto-set course as completed, trigger badge award, show animated completion screen
- Create `CourseCompletionScreen` component: animated confetti/metrics, badge display, points awarded
- Create `useCourseProgress` hook: manages course progress state, syncs with database
- Award configurable points on course completion (default 150 pts)

### 1B. Certificate System

**Database changes:**

- Create `certificates` table: `user_id`, `course_id`, `certificate_id` (unique string), `issued_at`
- RLS: users can read their own certificates

**Code changes:**

- Create `CertificateCard` component: displays certificate with course name, user name, date, unique ID
- Add "Download PDF" button (generates client-side PDF using canvas/html rendering)
- Add "Share" button (copies shareable link or opens share dialog)
- Certificates auto-generated when course is completed
- Add certificates section to Profile page

### 1C. Quiz Upgrade

**Database changes:**

- Create `quiz_attempts` table: `user_id`, `module_id`, `answers` (jsonb), `score`, `created_at`

**Code changes:**

- Update quiz rendering in `CourseView.tsx` to show explanations after each answer (read from existing quiz data `explanation` field)
- Save quiz attempts to database
- Store best score per module

### 1D. UX Improvements (Auth Redirect)

- Ensure `Index.tsx` redirect for authenticated users works reliably (already partially done)
- Add inline validation error messages to Login/Signup forms (required fields)
- Ensure no guest landing page flash for authenticated users

---

## Phase 2: Engagement Features (Next Implementation)

### 2A. Recommended Courses After Survey

- Create `RecommendedCoursesScreen` component shown after survey completion
- Display top 3 recommended course topics based on `interests`, `skill_level`, `working_toward`
- Save recommendations to a `survey_recommendations` table
- Add "Start Course" CTA that pre-fills the course generator

### 2B. Points Page Upgrade

- Revamp `ProgressPage.tsx` to show points breakdown by source (courses, labs, quizzes)
- Add level system with progress bar
- Show next milestone preview with visual indicator
- Add "Lab completion" and "Course completion" to the "How to Earn" section

### 2C. Labs Integration Into Lessons

- Link standalone labs to course topics (add `related_course_topic` field to lab definitions)
- Labs unlock only after lesson completion (check `course_progress.completed_lessons`)
- Lab completion contributes toward course completion percentage
- Remove Simulation Labs
- Add decision making labs related to the chosen topic and decisions much impact sliders or a score

### 2D. Lesson Structure Improvement

- Add clear learning objectives at top of each lesson
- Integrated quiz and lab indicators within lesson view
- Per-module completion progress indicator in sidebar

---

## Phase 3: Social and Access Control (Future Implementation)

### 3A. Community Upgrade

- Add like/comment/share to posts (new `post_likes`, `post_comments` tables)
- Auto-generated achievement posts when course/badge/certificate earned
- Private messaging system (`direct_messages` table)

---

## Technical Details -- Phase 1 Implementation

### Database Migration SQL

```text
-- course_progress table
CREATE TABLE public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_lessons jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- badges table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'trophy',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- user_badges table
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- certificates table
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_id text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '[]'::jsonb,
  score integer DEFAULT 0,
  total integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for all tables (users can read/insert their own data)
```

### New Files

- `src/hooks/useCourseProgress.ts` -- hook for tracking/syncing course progress
- `src/components/courses/CourseCompletionScreen.tsx` -- animated completion overlay
- `src/components/courses/CertificateCard.tsx` -- certificate display + download/share

### Modified Files

- `src/pages/CourseView.tsx` -- integrate completion tracking, quiz saving, completion screen
- `src/pages/Profile.tsx` -- add certificates section
- `src/pages/Login.tsx` / `src/pages/Signup.tsx` -- inline validation errors
- `src/hooks/usePoints.ts` -- add COURSE_COMPLETION point type (150 pts)
- `src/pages/ProgressPage.tsx` -- add course completion and lab entries to "How to Earn"

### Implementation Order

1. Run database migration (create all 5 tables with RLS)
2. Create `useCourseProgress` hook
3. Update `CourseView.tsx` with completion tracking + quiz saving
4. Create `CourseCompletionScreen` component
5. Create `CertificateCard` component
6. Update Profile page with certificates
7. Add inline validation to Login/Signup
8. Update points system

### Important Rules Followed

- No existing features removed
- Modular code structure maintained
- Existing `usePoints` hook extended (not replaced)
- shadcn + Tailwind styling preserved
- All database tables fully wired with RLS
- No placeholder systems -- everything connected end-to-end