import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  BookOpen,
  FileText,
  Video,
  ClipboardCheck,
  Save,
  Eye
} from "lucide-react";
import { useState } from "react";

type LessonType = "text" | "video" | "quiz";

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
}

const lessonTypeConfig: Record<LessonType, { icon: React.ElementType; label: string; color: string }> = {
  text: { icon: FileText, label: "Text Lesson", color: "bg-blue-500/10 text-blue-500" },
  video: { icon: Video, label: "Video", color: "bg-purple-500/10 text-purple-500" },
  quiz: { icon: ClipboardCheck, label: "Quiz", color: "bg-green-500/10 text-green-500" },
};

export default function CourseBuilder() {
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([
    { id: "1", title: "Introduction", type: "text" },
    { id: "2", title: "Getting Started", type: "video" },
  ]);

  const addLesson = (type: LessonType) => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: `New ${lessonTypeConfig[type].label}`,
      type,
    };
    setLessons([...lessons, newLesson]);
  };

  const removeLesson = (id: string) => {
    setLessons(lessons.filter((l) => l.id !== id));
  };

  const updateLessonTitle = (id: string, title: string) => {
    setLessons(lessons.map((l) => (l.id === id ? { ...l, title } : l)));
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Create New Course</h1>
            <p className="text-muted-foreground mt-1">
              Build your own learning path
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="hero">
              <Save className="w-4 h-4 mr-2" />
              Save Course
            </Button>
          </div>
        </div>

        {/* Course Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="e.g., Complete JavaScript Guide"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What will students learn in this course?"
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {["Coding", "Math", "Writing", "Design", "Business", "Other"].map((cat) => (
                  <Badge 
                    key={cat} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Structure */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Course Structure</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addLesson("text")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Add Text
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addLesson("video")}
              >
                <Video className="w-4 h-4 mr-2" />
                Add Video
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addLesson("quiz")}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Add Quiz
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No lessons yet. Add your first lesson above!</p>
              </div>
            ) : (
              lessons.map((lesson, index) => {
                const config = lessonTypeConfig[lesson.type];
                const Icon = config.icon;
                return (
                  <div 
                    key={lesson.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 group"
                  >
                    <div className="cursor-grab text-muted-foreground hover:text-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <Input
                      value={lesson.title}
                      onChange={(e) => updateLessonTitle(lesson.id, e.target.value)}
                      className="flex-1 bg-transparent border-none focus-visible:ring-1"
                    />
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLesson(lesson.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}

            {/* Add More */}
            <button
              onClick={() => addLesson("text")}
              className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-5 h-5" />
              <span>Add Lesson</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
