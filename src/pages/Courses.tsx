import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  Plus, 
  BookOpen, 
  Clock, 
  BarChart3,
  Play,
  CheckCircle2
} from "lucide-react";

// Mock data
const myCourses = [
  { 
    id: 1, 
    title: "JavaScript Fundamentals", 
    progress: 65, 
    lessons: 12, 
    completedLessons: 8,
    category: "Coding",
    image: "🟨"
  },
  { 
    id: 2, 
    title: "React for Beginners", 
    progress: 30, 
    lessons: 15, 
    completedLessons: 5,
    category: "Coding",
    image: "⚛️"
  },
  { 
    id: 3, 
    title: "Essay Writing Mastery", 
    progress: 100, 
    lessons: 8, 
    completedLessons: 8,
    category: "Writing",
    image: "✍️"
  },
];

const createdCourses = [
  { id: 1, title: "My Python Guide", lessons: 5, views: 23, status: "draft" },
];

export default function Courses() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Track your learning journey
            </p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/courses/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Learning Progress */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCourses.map((course) => (
            <Card key={course.id} className="bg-card border-border hover:border-primary/50 transition-colors group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                    {course.image}
                  </div>
                  {course.progress === 100 ? (
                    <Badge className="bg-green-500/10 text-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{course.category}</Badge>
                  )}
                </div>
                
                <h3 className="font-semibold mb-2">{course.title}</h3>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.completedLessons}/{course.lessons} lessons
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>

                <Button 
                  variant={course.progress === 100 ? "outline" : "hero"} 
                  className="w-full" 
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {course.progress === 100 ? "Review" : "Continue"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Created Courses */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Courses You Created</CardTitle>
          </CardHeader>
          <CardContent>
            {createdCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>You haven't created any courses yet.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/courses/new">Create your first course</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {createdCourses.map((course) => (
                  <div 
                    key={course.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {course.lessons} lessons • {course.views} views
                      </p>
                    </div>
                    <Badge variant={course.status === "draft" ? "secondary" : "default"}>
                      {course.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
