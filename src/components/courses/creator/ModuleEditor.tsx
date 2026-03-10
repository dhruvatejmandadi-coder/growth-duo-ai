import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Beaker, ClipboardList } from "lucide-react";
import type { CreatorModule, QuizQuestion } from "@/pages/CourseCreator";
import LabEditor from "./LabEditor";
import QuizEditor from "./QuizEditor";

interface Props {
  module: CreatorModule;
  onChange: (updates: Partial<CreatorModule>) => void;
}

export default function ModuleEditor({ module, onChange }: Props) {
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Module Title</Label>
        <Input
          placeholder="e.g. Understanding Supply & Demand"
          value={module.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <Tabs defaultValue="lesson" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="lesson" className="flex-1 text-xs gap-1">
            <FileText className="w-3 h-3" /> Lesson
          </TabsTrigger>
          <TabsTrigger value="lab" className="flex-1 text-xs gap-1">
            <Beaker className="w-3 h-3" /> Lab
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex-1 text-xs gap-1">
            <ClipboardList className="w-3 h-3" /> Quiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lesson" className="space-y-3 mt-3">
          <div className="space-y-2">
            <Label>Lesson Content (Markdown)</Label>
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-secondary px-1 rounded">---</code> to separate slides. Use <code className="bg-secondary px-1 rounded">## Heading</code> for slide titles.
            </p>
            <Textarea
              placeholder={`## What is Supply?\n\n- Supply is the quantity of a good...\n- Key factors include...\n\n---\n\n## What is Demand?\n\n- Demand represents...\n- Price affects demand through...`}
              value={module.lesson_content}
              onChange={(e) => onChange({ lesson_content: e.target.value })}
              rows={12}
              className="font-mono text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>YouTube URL (optional)</Label>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={module.youtube_url || ""}
                onChange={(e) => onChange({ youtube_url: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Video Title</Label>
              <Input
                placeholder="Video title..."
                value={module.youtube_title || ""}
                onChange={(e) => onChange({ youtube_title: e.target.value || null })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lab" className="mt-3">
          <LabEditor module={module} onChange={onChange} />
        </TabsContent>

        <TabsContent value="quiz" className="mt-3">
          <QuizEditor
            questions={module.quiz}
            onChange={(quiz) => onChange({ quiz })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
