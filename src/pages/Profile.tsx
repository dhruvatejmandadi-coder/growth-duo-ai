import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Bot, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Target,
  BookOpen,
  Clock,
  ArrowRight,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data - will be connected to backend
const userData = {
  name: "Guest User",
  email: "guest@example.com",
  memberSince: "January 2025",
  aiMessagesUsed: 7,
  aiMessagesLimit: 10,
  totalSessions: 0,
  learningStreak: 3,
  skills: [
    { name: "Coding", progress: 25, sessions: 0 },
    { name: "Writing", progress: 10, sessions: 0 },
  ],
};

const recentActivity = [
  { type: "ai", description: "Asked about recursion in programming", time: "2 hours ago" },
  { type: "ai", description: "Explored quadratic equations", time: "Yesterday" },
  { type: "ai", description: "Writing tips conversation", time: "2 days ago" },
];

export default function Profile() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container px-4 sm:px-6 max-w-5xl">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">{userData.name}</h1>
                <p className="text-muted-foreground">Member since {userData.memberSince}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">AI Messages</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{userData.aiMessagesUsed}/{userData.aiMessagesLimit}</span>
              </div>
              <Progress 
                value={(userData.aiMessagesUsed / userData.aiMessagesLimit) * 100} 
                className="h-1.5 mt-3"
              />
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Mentor Sessions</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{userData.totalSessions}</span>
                <span className="text-xs text-muted-foreground">coming soon</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Learning Streak</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{userData.learningStreak} days</span>
                <span className="text-xs text-primary">🔥</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">Skills Tracking</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{userData.skills.length}</span>
                <span className="text-xs text-muted-foreground">in progress</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Skills Progress */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Skill Progress
                </h2>
                <Button variant="ghost" size="sm">
                  Add Skill
                </Button>
              </div>

              {userData.skills.length > 0 ? (
                <div className="space-y-5">
                  {userData.skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-sm text-muted-foreground">{skill.progress}%</span>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {skill.sessions} mentor sessions
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No skills tracked yet</p>
                  <p className="text-sm text-muted-foreground">Start learning to track progress</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-accent" />
                Recent Activity
              </h2>

              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-secondary/30 rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" asChild>
                <Link to="/ai-tutor">
                  <Bot className="w-4 h-4" />
                  Continue Learning
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/mentors">
                  <Calendar className="w-4 h-4" />
                  Browse Mentors
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
