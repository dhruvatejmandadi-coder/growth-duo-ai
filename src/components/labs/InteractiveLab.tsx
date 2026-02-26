import { useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, MessageCircleQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ClassificationLab from "./ClassificationLab";

/* ================= TYPES ================= */

type Parameter = {
  name: string;
  icon: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  weight?: number; // NEW: weighted impact
  description?: string;
};

type Decision = {
  question: string;
  emoji?: string;
  choices: {
    text: string;
    explanation?: string;
    set_state: Record<string, number>;
    effects?: Record<string, number>; // legacy support
  }[];
};

type SimulationData = {
  title?: string;
  description?: string;
  parameters: Parameter[];
  thresholds: { label: string; min_percent: number; message: string }[];
  decisions?: Decision[];
};

type Props = {
  labType?: string | null;
  labData?: any;
  labTitle?: string | null;
  labDescription?: string | null;
};

/* ================= HELPERS ================= */

function getParamLevel(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100;
  if (pct >= 75) return { level: "high", color: "text-green-500", icon: TrendingUp };
  if (pct >= 35) return { level: "mid", color: "text-yellow-500", icon: Minus };
  return { level: "low", color: "text-red-500", icon: TrendingDown };
}

/* ================= ENSURE SET_STATE ================= */

function ensureDecisionSetState(decisions: Decision[], parameters: Parameter[]): Decision[] {
  if (!decisions?.length || !parameters?.length) return decisions ?? [];

  return decisions.map((decision) => ({
    ...decision,
    choices: decision.choices.map((choice) => {
      const filled: Record<string, number> = {};

      for (const p of parameters) {
        const raw =
          choice.set_state?.[p.name] ?? (choice.effects ? p.default + (choice.effects[p.name] ?? 0) : p.default);

        filled[p.name] = Math.max(p.min, Math.min(p.max, raw ?? p.default));
      }

      return { ...choice, set_state: filled };
    }),
  }));
}

/* ================= SIMULATION ================= */

function SimulationLabInline({ data }: { data: SimulationData }) {
  const parameters = useMemo(() => data.parameters ?? [], [data]);
  const thresholds = useMemo(() => data.thresholds ?? [], [data]);
  const rawDecisions = useMemo(() => data.decisions ?? [], [data]);
  const decisions = useMemo(() => ensureDecisionSetState(rawDecisions, parameters), [rawDecisions, parameters]);

  const [values, setValues] = useState<Record<string, number>>({});
  const [currentDecision, setCurrentDecision] = useState(0);
  const [answered, setAnswered] = useState<Record<number, number>>({});

  /* RESET WHEN LAB CHANGES */
  useEffect(() => {
    const initial = Object.fromEntries(parameters.map((p) => [p.name, p.default]));
    setValues(initial);
    setCurrentDecision(0);
    setAnswered({});
  }, [data, parameters]);

  /* ================= WEIGHTED TOTAL ================= */

  const totalPercent = useMemo(() => {
    if (!parameters.length) return 0;

    const totalWeight = parameters.reduce((sum, p) => sum + (p.weight ?? 1), 0);

    const weightedScore = parameters.reduce((sum, p) => {
      const normalized = ((values[p.name] ?? p.default) - p.min) / (p.max - p.min);

      return sum + normalized * (p.weight ?? 1);
    }, 0);

    return Math.round((weightedScore / totalWeight) * 100);
  }, [values, parameters]);

  const threshold = useMemo(() => {
    if (!thresholds.length) return null;
    const sorted = [...thresholds].sort((a, b) => b.min_percent - a.min_percent);
    return sorted.find((t) => totalPercent >= t.min_percent) || sorted[sorted.length - 1];
  }, [totalPercent, thresholds]);

  /* ================= DECISION HANDLER ================= */

  const handleDecision = (dIdx: number, cIdx: number) => {
    if (answered[dIdx] !== undefined) return;

    const choice = decisions[dIdx]?.choices[cIdx];
    if (!choice) return;

    setValues((prev) => {
      const next: Record<string, number> = {};
      for (const p of parameters) {
        next[p.name] = Math.max(p.min, Math.min(p.max, choice.set_state[p.name] ?? prev[p.name] ?? p.default));
      }
      return next;
    });

    setAnswered((prev) => ({ ...prev, [dIdx]: cIdx }));

    // Auto-advance scenario
    setTimeout(() => {
      setCurrentDecision((prev) => prev + 1);
    }, 600);
  };

  const allDone = currentDecision >= decisions.length;

  /* ================= API CALLBACK ================= */

  useEffect(() => {
    if (!parameters.length) return;

    const controller = new AbortController();

    const syncState = async () => {
      try {
        await fetch("/api/simulation/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            values,
            totalPercent,
            scenario: currentDecision,
          }),
          signal: controller.signal,
        });
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Simulation sync failed:", err);
        }
      }
    };

    syncState();
    return () => controller.abort();
  }, [values, totalPercent, currentDecision, parameters]);

  /* ================= UI ================= */

  return (
    <div className="space-y-5">
      {/* SCENARIOS */}
      {decisions.length > 0 && !allDone && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5 text-primary" />
              <h3 className="font-bold">
                Scenario {currentDecision + 1} of {decisions.length}
              </h3>
            </div>

            <p>
              {decisions[currentDecision].emoji ?? "🔬"} {decisions[currentDecision].question}
            </p>

            {decisions[currentDecision].choices.map((c, i) => {
              const isChosen = answered[currentDecision] === i;
              const isAnswered = answered[currentDecision] !== undefined;

              return (
                <button
                  key={i}
                  onClick={() => handleDecision(currentDecision, i)}
                  disabled={isAnswered}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                    isChosen ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  {c.text}
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* SLIDERS */}
      {parameters.map((p) => {
        const value = values[p.name] ?? p.default;
        const { color, icon: Icon } = getParamLevel(value, p.min, p.max);

        return (
          <Card key={p.name}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <Badge variant="outline">
                    {value} {p.unit}
                  </Badge>
                </div>
              </div>

              <Slider
                value={[value]}
                min={p.min}
                max={p.max}
                step={1}
                onValueChange={([v]) =>
                  setValues((prev) => ({
                    ...prev,
                    [p.name]: v,
                  }))
                }
              />
            </CardContent>
          </Card>
        );
      })}

      {/* OUTCOME */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between mb-2">
            <span className="font-bold">{threshold?.label ?? "Outcome"}</span>
            <Badge>{totalPercent}%</Badge>
          </div>

          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${totalPercent}%` }} />
          </div>

          <p className="text-sm text-muted-foreground mt-2">{threshold?.message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= MAIN ================= */

export default function InteractiveLab({ labType, labData, labTitle, labDescription }: Props) {
  if (!labData || Object.keys(labData).length === 0) {
    return null;
  }

  if (labType === "classification") {
    return <ClassificationLab data={labData} />;
  }

  return <SimulationLabInline data={labData} />;
}
