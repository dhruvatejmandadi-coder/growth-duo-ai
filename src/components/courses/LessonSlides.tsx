import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Youtube } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface LessonSlidesProps {
  content: string;
  youtubeUrl?: string | null;
  youtubeTitle?: string | null;
}

export default function LessonSlides({ content, youtubeUrl, youtubeTitle }: LessonSlidesProps) {
  const slides = content
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const [current, setCurrent] = useState(0);
  const total = slides.length;
  const isLast = current === total - 1;

  const goNext = useCallback(() => setCurrent((c) => Math.min(c + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    setCurrent(0);
  }, [content]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const progressPercent = total > 1 ? ((current + 1) / total) * 100 : 100;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <Progress value={progressPercent} className="h-1.5 rounded-none" />
        <CardContent className="p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-accent prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border min-h-[200px]">
            <ReactMarkdown>{slides[current] || ""}</ReactMarkdown>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={current === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground font-medium">
              {current + 1} of {total}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              disabled={isLast}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLast && youtubeUrl && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Youtube className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold">Recommended Video</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{youtubeTitle}</p>
            <Button variant="outline" size="sm" asChild>
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                <Youtube className="w-4 h-4 mr-1" /> Search on YouTube
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
