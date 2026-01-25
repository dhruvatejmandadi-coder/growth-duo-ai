import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Bot, 
  ClipboardCheck, 
  MessageSquare, 
  TrendingUp,
  Flame,
  Target,
  BookOpen,
  ArrowRight
} from "lucide-react";

// Mock data
const stats = {
  streak: 7,
  testsCompleted: 12,
  coursesInProgress: 3,
  messagesUnread: 2,
};

const recentActivity = [
  { type: "test", title: "JavaScript Basics Quiz", score: 85, date: "Today" },
  { type: "ai", title: "AI Tutor Session", topic: "React Hooks", date: "Yesterday" },
  { type: "course", title: "Python for Beginners", progress: 45, date: "2 days ago" },
];

const skillProgress = [
  { name: "JavaScript", level: 72, color: "from-amber-500 to-orange-500" },
  { name: "React", level: 45, color: "from-cyan-500 to-blue-500" },
  { name: "Python", level: 30, color: "from-green-500 to-emerald-500" },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome back! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Here's your learning progress overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.streak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.testsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Tests Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.coursesInProgress}</p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.messagesUnread}</p>
                  <p className="text-xs text-muted-foreground">New Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Skill Progress */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Skill Progress</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/progress" className="text-muted-foreground">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillProgress.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.level}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${skill.color}`}
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link to="/ai-tutor">
                  <Bot className="w-4 h-4" />
                  Start AI Session
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link to="/tests">
                  <Target className="w-4 h-4" />
                  Take a Quiz
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link to="/courses/new">
                  <BookOpen className="w-4 h-4" />
                  Create Course
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === "test" ? "bg-primary/10" :
                    activity.type === "ai" ? "gradient-accent" :
                    "bg-accent/10"
                  }`}>
                    {activity.type === "test" && <ClipboardCheck className="w-5 h-5 text-primary" />}
                    {activity.type === "ai" && <Bot className="w-5 h-5 text-accent-foreground" />}
                    {activity.type === "course" && <BookOpen className="w-5 h-5 text-accent" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.score && `Score: ${activity.score}%`}
                      {activity.topic && `Topic: ${activity.topic}`}
                      {activity.progress && `Progress: ${activity.progress}%`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
