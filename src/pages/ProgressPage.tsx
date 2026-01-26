import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Flame, 
  Target,
  Trophy,
  Calendar,
  BookOpen,
  ClipboardCheck
} from "lucide-react";

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

        {/* Stats Grid - Empty Placeholders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">--</p>
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
                <p className="text-2xl font-bold text-muted-foreground">--</p>
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
                <p className="text-2xl font-bold text-muted-foreground">--</p>
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
                <p className="text-2xl font-bold text-muted-foreground">--</p>
                <p className="text-xs text-muted-foreground">Courses Done</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Activity Placeholder */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Activity tracking coming soon
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Placeholder */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Earn badges as you learn
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Progress Placeholder */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Skill Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Complete tests and courses to track your skill levels
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
