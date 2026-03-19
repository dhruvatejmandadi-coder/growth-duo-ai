import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, ChevronRight, RotateCcw, Lightbulb, MessageCircleQuestion, TrendingUp, TrendingDown, Minus } from "lucide-react";
import LabIntro from "./LabIntro";
import type { LabIntroData } from "./LabIntro";

/**
 * DynamicLab — Primitive block renderer for AI-generated lab blueprints.
 * 
 * Renders labs from a "blocks" array where each block is a UI primitive:
 * - text: markdown/text display
 * - choice_set: decision with multiple options + effects on variables
 * - slider: interactive variable adjustment
 * - table: data comparison table
 * - step_task: sequential tasks (input or choice)
 * - chart: visual data display
 * - insight: key takeaway
 */

type Variable = {
  name: string;
  icon: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  description?: string;
};

type Choice = {
  text: string;
  feedback?: string;
  effects?: Record<string, number>;
  is_best?: boolean;
};

type Block =
  | { type: "text"; content: string }
  | { type: "choice_set"; question: string; emoji?: string; choices: Choice[] }
  | { type: "slider"; variable: string; prompt?: string; interactive?: boolean }
  | { type: "table"; title?: string; headers: string[]; rows: string[][] }
  | { type: "step_task"; tasks: TaskItem[] }
  | { type: "chart"; chart_type?: string; title?: string; x_label?: string; y_label?: string; datasets?: any[] }
  | { type: "insight"; content: string };

type TaskItem = {
  id: string;
  prompt: string;
  type: "input" | "choice";
  correct_answer?: string;
  options?: string[];
  hint?: string;
  explanation?: string;
};

type LabBlueprint = {
  title?: string;
  kind?: string;
  scenario?: string;
  learning_goal?: string;
  variables?: Variable[];
  blocks?: Block[];
  completion_rule?: string;
  intro?: LabIntroData;
  repend_intro?: LabIntroData;
  key_insight?: string;
};

type Props = {
  data: LabBlueprint;
  onComplete?: () => void;
  isCompleted?: boolean;
};

function getParamLevel(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100;
  if (pct >= 75) return { color: "text-green-500", icon: TrendingUp };
  if (pct >= 35) return { color: "text-yellow-500", icon: Minus };
  return { color: "text-red-500", icon: TrendingDown };
}

export default function DynamicLab({ data, onComplete, isCompleted }: Props) {
  const variables = useMemo(() => data?.variables ?? [], [data]);
  const blocks = useMemo(() => data?.blocks ?? [], [data]);
  const introData = data?.intro || data?.repend_intro;

  const [showIntro, setShowIntro] = useState(true);
  const [values, setValues] = useState<Record<string, number>>({});
  const [choiceAnswers, setChoiceAnswers] = useState<Record<number, number>>({});
  const [currentChoiceBlock, setCurrentChoiceBlock] = useState(0);
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({});
  const [showTaskResults, setShowTaskResults] = useState<Record<number, boolean>>({});
  const [completionFired, setCompletionFired] = useState(false);

  // Initialize values
  useEffect(() => {
    const initial = Object.fromEntries(variables.map(v => [v.name, v.default ?? 50]));
    setValues(initial);
    setChoiceAnswers({});
    setCurrentChoiceBlock(0);
    setTaskAnswers({});
    setShowTaskResults({});
    setCompletionFired(false);
    setShowIntro(true);
  }, [data]);

  // Count choice_set blocks and step_task blocks for completion tracking
  const choiceBlockIndices = useMemo(() =>
    blocks.map((b, i) => b.type === "choice_set" ? i : -1).filter(i => i >= 0),
    [blocks]
  );
  const taskBlockIndices = useMemo(() =>
    blocks.map((b, i) => b.type === "step_task" ? i : -1).filter(i => i >= 0),
    [blocks]
  );

  // Completion check
  const allChoicesDone = choiceBlockIndices.length === 0 || choiceBlockIndices.every(i => choiceAnswers[i] !== undefined);
  const allTasksDone = taskBlockIndices.length === 0 || taskBlockIndices.every(blockIdx => {
    const block = blocks[blockIdx] as any;
    if (!block.tasks) return true;
    return block.tasks.every((t: TaskItem) => taskAnswers[t.id] !== undefined && taskAnswers[t.id] !== "");
  });
  const isComplete = allChoicesDone && allTasksDone && (choiceBlockIndices.length > 0 || taskBlockIndices.length > 0);

  useEffect(() => {
    if (isComplete && !completionFired && onComplete) {
      onComplete();
      setCompletionFired(true);
    }
  }, [isComplete, completionFired, onComplete]);

  const handleChoice = useCallback((blockIdx: number, choiceIdx: number) => {
    if (choiceAnswers[blockIdx] !== undefined) return;
    const block = blocks[blockIdx] as any;
    const choice = block?.choices?.[choiceIdx];
    if (!choice) return;

    // Apply effects to variables
    if (choice.effects && typeof choice.effects === "object") {
      setValues(prev => {
        const next = { ...prev };
        for (const v of variables) {
          if (typeof choice.effects[v.name] === "number") {
            next[v.name] = Math.max(v.min, Math.min(v.max, choice.effects[v.name]));
          }
        }
        return next;
      });
    }

    setChoiceAnswers(prev => ({ ...prev, [blockIdx]: choiceIdx }));
  }, [choiceAnswers, blocks, variables]);

  const reset = () => {
    const initial = Object.fromEntries(variables.map(v => [v.name, v.default ?? 50]));
    setValues(initial);
    setChoiceAnswers({});
    setCurrentChoiceBlock(0);
    setTaskAnswers({});
    setShowTaskResults({});
    setCompletionFired(false);
    setShowIntro(true);
  };

  // Already completed state
  if (isCompleted && !isComplete) {
    return (
      <Card className="border-green-500/20 bg-green-500/[0.04]">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
          <h3 className="font-bold text-lg">Lab Complete</h3>
          <p className="text-sm text-muted-foreground">You've already completed this lab.</p>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Replay Lab
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Intro screen
  if (showIntro && introData) {
    return (
      <LabIntro
        title={data.title || "Interactive Lab"}
        intro={introData}
        labType={data.kind || "dynamic"}
        onStart={() => setShowIntro(false)}
      />
    );
  }

  if (showIntro && !introData) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            <h3 className="font-bold text-lg">{data.title || "Interactive Lab"}</h3>
          </div>
          {data.scenario && <p className="text-sm leading-relaxed">{data.scenario}</p>}
          {data.learning_goal && (
            <p className="text-xs text-muted-foreground">🎯 {data.learning_goal}</p>
          )}
          {variables.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variables</span>
              <div className="flex flex-wrap gap-2">
                {variables.map(v => (
                  <Badge key={v.name} variant="outline" className="text-xs">
                    {v.icon} {v.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <Button onClick={() => setShowIntro(false)} className="w-full">
            Start Lab <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Track which choice_set block we're currently showing
  const activeChoiceBlockIdx = choiceBlockIndices.find(i => choiceAnswers[i] === undefined) ?? -1;

  return (
    <div className="space-y-5">
      {/* Variable Gauges */}
      {variables.length > 0 && (
        <div className="grid gap-3">
          {variables.map(v => {
            const value = values[v.name] ?? v.default;
            const { color, icon: Icon } = getParamLevel(value, v.min, v.max);
            return (
              <Card key={v.name}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center text-sm">
                      <span>{v.icon}</span>
                      <span className="font-medium">{v.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <Badge variant="outline" className="text-xs">{value} {v.unit}</Badge>
                    </div>
                  </div>
                  <Slider value={[value]} min={v.min} max={v.max} step={1} disabled className="pointer-events-none" />
                  {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Render blocks in order */}
      {blocks.map((block, blockIdx) => {
        switch (block.type) {
          case "text":
            return (
              <Card key={blockIdx}>
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{block.content}</p>
                </CardContent>
              </Card>
            );

          case "choice_set": {
            // Only show the current active choice_set, or show answered ones
            const isAnswered = choiceAnswers[blockIdx] !== undefined;
            const isActive = blockIdx === activeChoiceBlockIdx;
            if (!isAnswered && !isActive) return null;

            const choiceSetBlock = block as any;
            const choiceSetIdx = choiceBlockIndices.indexOf(blockIdx);
            return (
              <Card key={blockIdx} className={isActive ? "border-primary/30 bg-primary/5" : "border-border/50"}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageCircleQuestion className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-sm">
                      Decision {choiceSetIdx + 1} of {choiceBlockIndices.length}
                    </h3>
                  </div>
                  <p className="text-sm">{choiceSetBlock.emoji || "🔬"} {choiceSetBlock.question}</p>
                  {choiceSetBlock.choices.map((c: Choice, i: number) => {
                    const isChosen = choiceAnswers[blockIdx] === i;
                    return (
                      <div key={i} className="space-y-1">
                        <button
                          onClick={() => handleChoice(blockIdx, i)}
                          disabled={isAnswered}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                            isChosen ? "border-primary bg-primary/10" : isAnswered ? "opacity-50 border-border" : "border-border hover:border-primary/40"
                          }`}
                        >
                          {c.text}
                        </button>
                        {isChosen && c.feedback && (
                          <p className="text-xs text-muted-foreground px-4 py-2 bg-muted/50 rounded-md">
                            ⚡ {c.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          }

          case "slider": {
            const sliderBlock = block as any;
            const v = variables.find(v => v.name === sliderBlock.variable);
            if (!v) return null;
            const value = values[v.name] ?? v.default;
            return (
              <Card key={blockIdx}>
                <CardContent className="p-4 space-y-3">
                  {sliderBlock.prompt && <p className="text-sm font-medium">{sliderBlock.prompt}</p>}
                  <Slider
                    value={[value]}
                    min={v.min}
                    max={v.max}
                    step={1}
                    disabled={!sliderBlock.interactive}
                    onValueChange={sliderBlock.interactive ? (val) => setValues(prev => ({ ...prev, [v.name]: val[0] })) : undefined}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{v.min} {v.unit}</span>
                    <span className="font-medium text-foreground">{value} {v.unit}</span>
                    <span>{v.max} {v.unit}</span>
                  </div>
                </CardContent>
              </Card>
            );
          }

          case "table": {
            const tableBlock = block as any;
            return (
              <Card key={blockIdx}>
                <CardContent className="p-4 space-y-2">
                  {tableBlock.title && <h4 className="text-sm font-bold">{tableBlock.title}</h4>}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {tableBlock.headers?.map((h: string, i: number) => (
                            <th key={i} className="text-left py-2 px-3 font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableBlock.rows?.map((row: string[], i: number) => (
                          <tr key={i} className="border-b border-border/50">
                            {row.map((cell: string, j: number) => (
                              <td key={j} className="py-2 px-3">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          }

          case "step_task": {
            const stepBlock = block as any;
            const tasks: TaskItem[] = stepBlock.tasks || [];
            const resultsVisible = showTaskResults[blockIdx];

            if (resultsVisible) {
              return (
                <Card key={blockIdx} className="border-green-500/20">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-bold text-sm">📋 Results</h3>
                    {tasks.map((task) => {
                      const userAnswer = taskAnswers[task.id] || "";
                      const correct = String(task.correct_answer || "").toLowerCase().trim();
                      const isCorrect = userAnswer.toLowerCase().trim() === correct;
                      return (
                        <div key={task.id} className="space-y-1">
                          <p className="text-sm font-medium">{task.prompt}</p>
                          <p className="text-xs">
                            Your answer: <span className={isCorrect ? "text-green-500 font-medium" : "text-red-500"}>{userAnswer}</span>
                            {!isCorrect && <span className="text-muted-foreground"> (Correct: {task.correct_answer})</span>}
                          </p>
                          {task.explanation && <p className="text-xs text-muted-foreground">{task.explanation}</p>}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={blockIdx} className="border-primary/20">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-sm">📋 Tasks</h3>
                  {tasks.map((task) => (
                    <div key={task.id} className="space-y-2">
                      <p className="text-sm font-medium">{task.prompt}</p>
                      {task.hint && <p className="text-xs text-muted-foreground">💡 {task.hint}</p>}
                      {task.type === "choice" && Array.isArray(task.options) ? (
                        <div className="space-y-1">
                          {task.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => setTaskAnswers(prev => ({ ...prev, [task.id]: opt }))}
                              className={`w-full text-left px-3 py-2 rounded border text-sm transition ${
                                taskAnswers[task.id] === opt ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Your answer..."
                          value={taskAnswers[task.id] || ""}
                          onChange={(e) => setTaskAnswers(prev => ({ ...prev, [task.id]: e.target.value }))}
                          className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
                        />
                      )}
                    </div>
                  ))}
                  {tasks.every(t => taskAnswers[t.id] !== undefined && taskAnswers[t.id] !== "") && (
                    <Button onClick={() => setShowTaskResults(prev => ({ ...prev, [blockIdx]: true }))} className="w-full">
                      Check Answers
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          }

          case "chart": {
            const chartBlock = block as any;
            return (
              <Card key={blockIdx}>
                <CardContent className="p-4 space-y-2">
                  {chartBlock.title && <h4 className="text-sm font-bold">{chartBlock.title}</h4>}
                  <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center border border-border/50">
                    <div className="text-center text-sm text-muted-foreground">
                      <p>📊 {chartBlock.chart_type || "line"} chart</p>
                      {chartBlock.x_label && chartBlock.y_label && (
                        <p className="text-xs">{chartBlock.x_label} vs {chartBlock.y_label}</p>
                      )}
                      {chartBlock.datasets?.[0]?.data && (
                        <div className="mt-2 flex items-end gap-1 justify-center h-16">
                          {chartBlock.datasets[0].data.slice(0, 8).map((d: any, i: number) => {
                            const maxY = Math.max(...chartBlock.datasets[0].data.map((p: any) => p.y || 0));
                            const h = maxY > 0 ? ((d.y || 0) / maxY) * 100 : 50;
                            return (
                              <div
                                key={i}
                                className="bg-primary/60 rounded-t w-4 transition-all"
                                style={{ height: `${Math.max(4, h)}%` }}
                                title={`${d.x}: ${d.y}`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          case "insight":
            if (!isComplete) return null;
            return (
              <Card key={blockIdx} className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-sm">✅ Key Insight</h3>
                  </div>
                  <p className="text-sm leading-relaxed">{block.content}</p>
                </CardContent>
              </Card>
            );

          default:
            return null;
        }
      })}

      {/* Outcome summary when all choices done */}
      {allChoicesDone && variables.length > 0 && choiceBlockIndices.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-sm">Outcome</span>
              <Badge variant="outline">
                {Math.round(variables.reduce((sum, v) => {
                  const pct = ((values[v.name] ?? v.default) - v.min) / (v.max - v.min);
                  return sum + pct;
                }, 0) / variables.length * 100)}%
              </Badge>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.round(variables.reduce((sum, v) => {
                    const pct = ((values[v.name] ?? v.default) - v.min) / (v.max - v.min);
                    return sum + pct;
                  }, 0) / variables.length * 100)}%`
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key insight fallback */}
      {isComplete && data.key_insight && !blocks.some(b => b.type === "insight") && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm">✅ Key Insight</h3>
            </div>
            <p className="text-sm leading-relaxed">{data.key_insight}</p>
          </CardContent>
        </Card>
      )}

      {/* Reset */}
      {isComplete && (
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="w-4 h-4 mr-1" /> Replay Lab
        </Button>
      )}
    </div>
  );
}
