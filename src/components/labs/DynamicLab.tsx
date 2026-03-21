import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  CheckCircle2, ChevronRight, ChevronLeft, RotateCcw, Lightbulb,
  MessageCircleQuestion, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import LabIntro from "./LabIntro";
import type { LabIntroData } from "./LabIntro";

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

/* ── Step-based renderer ─────────────────────────────────────── */

export default function DynamicLab({ data, onComplete, isCompleted }: Props) {
  const variables = useMemo(() => data?.variables ?? [], [data]);
  const blocks = useMemo(() => data?.blocks ?? [], [data]);
  const introData = data?.intro || data?.repend_intro;

  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, number>>({});
  const [choiceAnswers, setChoiceAnswers] = useState<Record<number, number>>({});
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({});
  const [taskSubmitted, setTaskSubmitted] = useState<Record<string, boolean>>({});
  const [completionFired, setCompletionFired] = useState(false);

  const totalSteps = blocks.length;

  // Init
  useEffect(() => {
    const initial = Object.fromEntries(variables.map(v => [v.name, v.default ?? 50]));
    setValues(initial);
    setChoiceAnswers({});
    setTaskAnswers({});
    setTaskSubmitted({});
    setCompletionFired(false);
    setShowIntro(true);
    setCurrentStep(0);
  }, [data]);

  // ── helpers ──
  const isStepCompleted = useCallback((idx: number): boolean => {
    const block = blocks[idx];
    if (!block) return false;
    switch (block.type) {
      case "choice_set":
        return choiceAnswers[idx] !== undefined;
      case "step_task": {
        const tasks: TaskItem[] = (block as any).tasks || [];
        return tasks.length > 0 && tasks.every(t => taskSubmitted[t.id]);
      }
      case "slider":
        return true; // sliders are always "complete" – they're exploratory
      case "text":
      case "table":
      case "chart":
      case "insight":
        return true; // passive blocks
      default:
        return true;
    }
  }, [blocks, choiceAnswers, taskSubmitted]);

  const canAdvance = isStepCompleted(currentStep);

  // Completion
  const allDone = useMemo(() => blocks.every((_, i) => isStepCompleted(i)), [blocks, isStepCompleted]);

  useEffect(() => {
    if (allDone && currentStep === totalSteps - 1 && !completionFired && onComplete) {
      onComplete();
      setCompletionFired(true);
    }
  }, [allDone, currentStep, totalSteps, completionFired, onComplete]);

  // ── handlers ──
  const handleChoice = useCallback((blockIdx: number, choiceIdx: number) => {
    if (choiceAnswers[blockIdx] !== undefined) return;
    const block = blocks[blockIdx] as any;
    const choice = block?.choices?.[choiceIdx];
    if (!choice) return;
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

  const submitTask = useCallback((taskId: string) => {
    setTaskSubmitted(prev => ({ ...prev, [taskId]: true }));
  }, []);

  const reset = () => {
    const initial = Object.fromEntries(variables.map(v => [v.name, v.default ?? 50]));
    setValues(initial);
    setChoiceAnswers({});
    setTaskAnswers({});
    setTaskSubmitted({});
    setCompletionFired(false);
    setShowIntro(true);
    setCurrentStep(0);
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && canAdvance && currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
      if (e.key === "ArrowLeft" && currentStep > 0) setCurrentStep(s => s - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canAdvance, currentStep, totalSteps]);

  // ── Already completed ──
  if (isCompleted && !allDone) {
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

  // ── Intro ──
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
          {data.learning_goal && <p className="text-xs text-muted-foreground">🎯 {data.learning_goal}</p>}
          {variables.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variables</span>
              <div className="flex flex-wrap gap-2">
                {variables.map(v => (
                  <Badge key={v.name} variant="outline" className="text-xs">{v.icon} {v.name}</Badge>
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

  // ── No blocks ──
  if (totalSteps === 0) {
    return (
      <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No lab blocks available.</CardContent></Card>
    );
  }

  // ── Lab finished screen ──
  if (allDone && currentStep >= totalSteps) {
    return (
      <div className="space-y-4">
        <Card className="border-green-500/20 bg-green-500/[0.04]">
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <h3 className="font-bold text-lg">Lab Complete!</h3>
            {data.key_insight && (
              <div className="text-left mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Key Insight</span>
                </div>
                <p className="text-sm leading-relaxed">{data.key_insight}</p>
              </div>
            )}
            {variables.length > 0 && (
              <div className="text-left mt-3 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Final Outcomes</span>
                {variables.map(v => {
                  const value = values[v.name] ?? v.default;
                  const { color, icon: Icon } = getParamLevel(value, v.min, v.max);
                  return (
                    <div key={v.name} className="flex items-center justify-between text-sm">
                      <span>{v.icon} {v.name}</span>
                      <div className="flex items-center gap-1">
                        <Icon className={`w-3 h-3 ${color}`} />
                        <span className="font-medium">{value} {v.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button variant="outline" onClick={reset} className="mt-4">
              <RotateCcw className="w-4 h-4 mr-1" /> Replay Lab
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const block = blocks[currentStep];
  const progressPercent = totalSteps > 1 ? ((currentStep + 1) / totalSteps) * 100 : 100;

  // ── Render current step ──
  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
        {/* Step dots */}
        <div className="flex items-center gap-1 justify-center pt-1">
          {blocks.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (i <= currentStep || isStepCompleted(i)) setCurrentStep(i); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? "bg-primary scale-125" :
                isStepCompleted(i) ? "bg-primary/40" : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Variable gauges (persistent across steps) */}
      {variables.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {variables.map(v => {
            const value = values[v.name] ?? v.default;
            const { color, icon: Icon } = getParamLevel(value, v.min, v.max);
            return (
              <div key={v.name} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-sm">{v.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{v.name}</p>
                </div>
                <Icon className={`w-3 h-3 ${color}`} />
                <span className="text-xs font-semibold">{value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Current block */}
      <Card className="overflow-hidden">
        <CardContent className="p-5 min-h-[250px]">
          <div key={currentStep} className="animate-fade-in space-y-4">
            {block.type === "text" && (
              <div>
                <Badge variant="outline" className="mb-3 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">📖 Information</Badge>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{block.content}</p>
              </div>
            )}

            {block.type === "choice_set" && (() => {
              const isAnswered = choiceAnswers[currentStep] !== undefined;
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageCircleQuestion className="w-5 h-5 text-primary" />
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">🔮 Decision</Badge>
                  </div>
                  <p className="text-sm font-medium">{(block as any).emoji || "🔬"} {(block as any).question}</p>
                  <div className="space-y-2">
                    {(block as any).choices.map((c: Choice, i: number) => {
                      const isChosen = choiceAnswers[currentStep] === i;
                      return (
                        <div key={i} className="space-y-1">
                          <button
                            onClick={() => handleChoice(currentStep, i)}
                            disabled={isAnswered}
                            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                              isChosen
                                ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                : isAnswered
                                  ? "opacity-40 border-border"
                                  : "border-border hover:border-primary/40 hover:bg-primary/5"
                            }`}
                          >
                            {c.text}
                          </button>
                          {isChosen && c.feedback && (
                            <p className="text-xs px-4 py-2 bg-muted/50 rounded-md text-muted-foreground animate-fade-in">
                              ⚡ {c.feedback}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {block.type === "slider" && (() => {
              const sliderBlock = block as any;
              const v = variables.find(vr => vr.name === sliderBlock.variable);
              if (!v) return <p className="text-sm text-muted-foreground">Variable not found.</p>;
              const value = values[v.name] ?? v.default;
              return (
                <div className="space-y-4">
                  <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">🎚️ Adjust</Badge>
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
                    <span className="font-semibold text-foreground text-sm">{value} {v.unit}</span>
                    <span>{v.max} {v.unit}</span>
                  </div>
                  {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
                </div>
              );
            })()}

            {block.type === "table" && (() => {
              const tableBlock = block as any;
              return (
                <div className="space-y-3">
                  <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">📊 Data</Badge>
                  {tableBlock.title && <h4 className="text-sm font-bold">{tableBlock.title}</h4>}
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {tableBlock.headers?.map((h: string, i: number) => (
                            <th key={i} className="text-left py-2 px-3 font-semibold text-xs text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableBlock.rows?.map((row: string[], i: number) => (
                          <tr key={i} className="border-b border-border/50">
                            {row.map((cell: string, j: number) => (
                              <td key={j} className="py-2 px-3 text-sm">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {block.type === "step_task" && (() => {
              const tasks: TaskItem[] = (block as any).tasks || [];
              return (
                <div className="space-y-4">
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">📋 Challenge</Badge>
                  {tasks.map((task) => {
                    const submitted = taskSubmitted[task.id];
                    const userAnswer = taskAnswers[task.id] || "";
                    const correct = String(task.correct_answer || "").toLowerCase().trim();
                    const isCorrect = userAnswer.toLowerCase().trim() === correct;

                    return (
                      <div key={task.id} className="space-y-3 p-4 rounded-lg border border-border bg-card">
                        <p className="text-sm font-medium">{task.prompt}</p>

                        {!submitted && task.hint && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" /> {task.hint}
                          </p>
                        )}

                        {task.type === "choice" && Array.isArray(task.options) ? (
                          <div className="space-y-1.5">
                            {task.options.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (!submitted) setTaskAnswers(prev => ({ ...prev, [task.id]: opt }));
                                }}
                                disabled={submitted}
                                className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                                  submitted && taskAnswers[task.id] === opt
                                    ? (opt.toLowerCase().trim() === correct ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10")
                                    : taskAnswers[task.id] === opt
                                      ? "border-primary bg-primary/10"
                                      : submitted ? "opacity-40 border-border" : "border-border hover:border-primary/40"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <Input
                            placeholder="Type your answer..."
                            value={taskAnswers[task.id] || ""}
                            onChange={(e) => {
                              if (!submitted) setTaskAnswers(prev => ({ ...prev, [task.id]: e.target.value }));
                            }}
                            disabled={submitted}
                            className={submitted ? (isCorrect ? "border-green-500" : "border-red-500") : ""}
                          />
                        )}

                        {!submitted && userAnswer && (
                          <Button size="sm" onClick={() => submitTask(task.id)} className="w-full">
                            Submit Answer
                          </Button>
                        )}

                        {submitted && (
                          <div className={`text-sm p-3 rounded-lg animate-fade-in ${isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                            {isCorrect ? (
                              <p className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="font-medium text-green-600 dark:text-green-400">Correct!</span>
                              </p>
                            ) : (
                              <p className="text-red-600 dark:text-red-400">
                                ❌ Incorrect — correct answer: <span className="font-medium">{task.correct_answer}</span>
                              </p>
                            )}
                            {task.explanation && (
                              <p className="text-xs text-muted-foreground mt-1">{task.explanation}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {block.type === "chart" && (() => {
              const chartBlock = block as any;
              return (
                <div className="space-y-3">
                  <Badge variant="outline" className="text-xs bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">📈 Chart</Badge>
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
                </div>
              );
            })()}

            {block.type === "insight" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">✅ Key Insight</Badge>
                </div>
                <p className="text-sm leading-relaxed">{(block as any).content}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <span className="text-xs text-muted-foreground">
          {canAdvance ? "" : "Complete this step to continue"}
        </span>

        {currentStep < totalSteps - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={!canAdvance}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setCurrentStep(totalSteps)}
            disabled={!canAdvance}
          >
            Finish Lab <CheckCircle2 className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
