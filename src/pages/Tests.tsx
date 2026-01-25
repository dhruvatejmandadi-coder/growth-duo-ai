import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardCheck, 
  Clock, 
  Trophy, 
  Target,
  Play,
  CheckCircle2,
  Star
} from "lucide-react";

// Mock data
const availableQuizzes = [
  { id: 1, title: "JavaScript Fundamentals", questions: 20, time: "15 min", difficulty: "Beginner", category: "Coding" },
  { id: 2, title: "React Hooks Deep Dive", questions: 15, time: "12 min", difficulty: "Intermediate", category: "Coding" },
  { id: 3, title: "Algebra Basics", questions: 25, time: "20 min", difficulty: "Beginner", category: "Math" },
  { id: 4, title: "Essay Writing Techniques", questions: 10, time: "10 min", difficulty: "Beginner", category: "Writing" },
];

const completedQuizzes = [
  { id: 1, title: "Python Basics", score: 92, date: "Jan 20", badge: "gold" },
  { id: 2, title: "HTML & CSS", score: 85, date: "Jan 18", badge: "silver" },
  { id: 3, title: "Basic Math", score: 78, date: "Jan 15", badge: "bronze" },
];

const skillEvaluations = [
  { skill: "Problem Solving", level: 75, tests: 5 },
  { skill: "Code Quality", level: 60, tests: 3 },
  { skill: "Communication", level: 45, tests: 2 },
  { skill: "Critical Thinking", level: 80, tests: 4 },
];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Beginner": return "bg-green-500/10 text-green-500";
    case "Intermediate": return "bg-amber-500/10 text-amber-500";
    case "Advanced": return "bg-red-500/10 text-red-500";
    default: return "bg-secondary text-muted-foreground";
  }
}

function getBadgeIcon(badge: string) {
  switch (badge) {
    case "gold": return <Trophy className="w-4 h-4 text-amber-400" />;
    case "silver": return <Trophy className="w-4 h-4 text-slate-400" />;
    case "bronze": return <Trophy className="w-4 h-4 text-orange-600" />;
    default: return <Star className="w-4 h-4 text-muted-foreground" />;
  }
}

export default function Tests() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Tests & Assessments</h1>
            <p className="text-muted-foreground mt-1">
              Track your knowledge and skill progress
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Tests Taken</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Badges Earned</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.5h</p>
                <p className="text-xs text-muted-foreground">Time Spent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="quizzes" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="quizzes">Available Quizzes</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="skills">Skill Evaluation</TabsTrigger>
          </TabsList>

          {/* Available Quizzes */}
          <TabsContent value="quizzes" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {availableQuizzes.map((quiz) => (
                <Card key={quiz.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{quiz.title}</h3>
                        <p className="text-sm text-muted-foreground">{quiz.category}</p>
                      </div>
                      <Badge className={getDifficultyColor(quiz.difficulty)} variant="secondary">
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <ClipboardCheck className="w-4 h-4" />
                        {quiz.questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {quiz.time}
                      </span>
                    </div>
                    <Button variant="hero" className="w-full" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Completed */}
          <TabsContent value="completed" className="space-y-4">
            {completedQuizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground">Completed {quiz.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getBadgeIcon(quiz.badge)}
                    <span className="text-xl font-bold">{quiz.score}%</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Skill Evaluation */}
          <TabsContent value="skills" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Skill Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {skillEvaluations.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{skill.skill}</span>
                      <span className="text-muted-foreground">
                        Level {skill.level}% • {skill.tests} tests
                      </span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
