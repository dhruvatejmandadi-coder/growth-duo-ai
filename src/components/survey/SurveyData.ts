export const surveyQuestions = {
  goals: {
    title: "Your Goal",
    question: "What do you want help with right now?",
    type: "multi" as const,
    options: [
      "Understanding a school subject",
      "Choosing a career path",
      "Learning a new skill",
      "Building a project",
      "Preparing for tests/exams",
      "College applications",
      "Resume / interviews",
      "Starting a business",
      "Improving productivity / focus",
      "Motivation / accountability",
    ],
  },
  challenges: {
    title: "Where You're Struggling",
    question: "What is your biggest challenge at the moment?",
    type: "multi" as const,
    options: [
      "I don't know where to start",
      "I get confused by concepts",
      "I need step-by-step guidance",
      "I start but don't finish",
      "I lack confidence",
      "I need real-world advice",
      "I need feedback on my work",
      "I need someone to keep me accountable",
    ],
  },
  subject_area: {
    title: "Subject / Field",
    question: "What area do you want help in most?",
    type: "single" as const,
    options: [
      "Math",
      "Science",
      "Programming / Tech",
      "Business / Entrepreneurship",
      "Writing",
      "Public Speaking",
      "Design / Creative",
      "Career Guidance",
      "Personal Growth",
      "Study Skills",
    ],
  },
  skill_level: {
    title: "Your Level",
    question: "How would you describe your level in this area?",
    type: "single" as const,
    options: [
      "Complete beginner",
      "Basic understanding",
      "Intermediate",
      "Advanced",
      "I just need expert guidance",
    ],
  },
  help_types: {
    title: "Type of Help You Prefer",
    question: "What type of help works best for you?",
    type: "multi" as const,
    options: [
      "Someone to explain concepts clearly",
      "Someone to give practical real-world advice",
      "Someone to review my work",
      "Someone to give me tasks and challenges",
      "Someone to answer questions when I'm stuck",
      "Someone to motivate and push me",
    ],
  },
  mentor_personality: {
    title: "Mentor Personality Match",
    question: "What type of mentor do you work best with?",
    type: "multi" as const,
    options: [
      "Friendly and patient",
      "Straightforward and direct",
      "Highly structured",
      "Encouraging and motivational",
      "Experienced professional (real-world focus)",
      "Academic / theory focused",
    ],
  },
  learning_styles: {
    title: "How You Like to Learn",
    question: "How do you learn best?",
    type: "multi" as const,
    options: [
      "Step-by-step instructions",
      "Examples and demonstrations",
      "Practice problems",
      "Conversations / discussion",
      "Visual explanations",
      "Short summaries",
    ],
  },
  time_commitment: {
    title: "Time Commitment",
    question: "How much time can you spend per week on this?",
    type: "single" as const,
    options: [
      "Less than 1 hour",
      "1–3 hours",
      "3–5 hours",
      "5+ hours",
    ],
  },
  urgency: {
    title: "Urgency",
    question: "How urgent is this for you?",
    type: "single" as const,
    options: [
      "Just exploring",
      "Important but not urgent",
      "Need progress soon",
      "Very urgent (deadline)",
    ],
  },
};

export type SurveyResponses = {
  goals: string[];
  goals_other: string;
  challenges: string[];
  challenges_other: string;
  subject_area: string;
  subject_other: string;
  skill_level: string;
  help_types: string[];
  help_other: string;
  mentor_personality: string[];
  mentor_other: string;
  learning_styles: string[];
  learning_other: string;
  time_commitment: string;
  urgency: string;
  success_definition: string;
};

export const initialSurveyResponses: SurveyResponses = {
  goals: [],
  goals_other: "",
  challenges: [],
  challenges_other: "",
  subject_area: "",
  subject_other: "",
  skill_level: "",
  help_types: [],
  help_other: "",
  mentor_personality: [],
  mentor_other: "",
  learning_styles: [],
  learning_other: "",
  time_commitment: "",
  urgency: "",
  success_definition: "",
};
