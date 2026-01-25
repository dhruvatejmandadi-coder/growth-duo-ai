import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Flame, 
  Target,
  Trophy,
  Calendar,
  BookOpen,
  ClipboardCheck,
  Bot
} from "lucide-react";

// Mock data
const overallStats = {
  streak: 7,
  totalHours: 24,
  testsCompleted: 12,
  coursesCompleted: 2,
};

const skillProgress = [
  { name: "JavaScript", level: 72, category: "Coding" },
  { name: "React", level: 45, category: "Coding" },
  { name: "Python", level: 30, category: "Coding" },
  { name: "Essay Writing", level: 85, category: "Writing" },
  { name: "Algebra", level: 60, category: "Math" },
  { name: "Critical Thinking", level: 55, category: "General" },
];

const weeklyActivity = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 1.5 },
  { day: "Wed", hours: 3 },
  { day: "Thu", hours: 2 },
  { day: "Fri", hours: 1 },
  { day: "Sat", hours: 4 },
  { day: "Sun", hours: 2 },
];

const achievements = [
  { id: 1, title: "First Steps", description: "Complete your first lesson", earned: true },
  { id: 2, title: "Quick Learner", description: "Complete 5 quizzes", earned: true },
  { id: 3, title: "Week Warrior", description: "7-day learning streak", earned: true },
  { id: 4, title: "Course Master", description: "Complete 5 courses", earned: false },
  { id: 5, title: "Perfect Score", description: "Get 100% on a quiz", earned: false },
];

const maxHours = Math.max(...weeklyActivity.map(d => d.hours));

export default function ProgressPage() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold">Your Progress</h1>
          <p className="text-muted-foreground mt-1">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.totalHours}h</p>
                <p className="text-xs text-muted-foreground">Total Time</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.testsCompleted}</p>
                <p className="text-xs text-muted-foreground">Tests Done</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.coursesCompleted}</p>
                <p className="text-xs text-muted-foreground">Courses Done</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-40 gap-2">
                {weeklyActivity.map((day) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-secondary rounded-lg overflow-hidden flex-1 flex flex-col justify-end">
                      <div 
                        className="w-full gradient-primary rounded-lg transition-all"
                        style={{ height: `${(day.hours / maxHours) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.day}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground">This week</span>
                <span className="font-semibold">
                  {weeklyActivity.reduce((acc, d) => acc + d.hours, 0)} hours
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    achievement.earned ? "bg-amber-500/10" : "bg-secondary/50 opacity-60"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    achievement.earned ? "bg-amber-500/20" : "bg-secondary"
                  }`}>
                    <Trophy className={`w-5 h-5 ${
                      achievement.earned ? "text-amber-500" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <span className="text-xs text-amber-500">Earned!</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Skill Progress */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Skill Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {skillProgress.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-xs text-muted-foreground">({skill.category})</span>
                    </div>
                    <span className="text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
