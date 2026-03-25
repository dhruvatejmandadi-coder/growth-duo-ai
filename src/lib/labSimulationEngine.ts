/**
 * Lab Simulation Engine
 * 
 * Uses XState for state machine logic and mathjs for calculations.
 * AI generates structured state/rules/variables → this engine RUNS them.
 */
import { createMachine, createActor, assign, type AnyStateMachine } from "xstate";
import { evaluate } from "mathjs";

// ── Types ──

export type SimVariable = {
  name: string;
  icon: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  description?: string;
};

export type SimRule = {
  condition: string;   // mathjs expression, e.g. "temperature > 80"
  effects: Record<string, string | number>; // variable name → new value or formula
  message?: string;    // feedback shown when rule fires
};

export type SimTransition = {
  event: string;       // e.g. "SELECT_OPTION_A", "ADJUST_SLIDER"
  effects?: Record<string, string | number>;
  target?: string;     // next state name
  feedback?: string;
};

export type SimState = {
  id: string;
  label: string;
  transitions: SimTransition[];
  onEntry?: {
    effects?: Record<string, string | number>;
    message?: string;
  };
};

export type SimulationConfig = {
  initialState: string;
  states: SimState[];
  variables: SimVariable[];
  rules?: SimRule[];        // Global rules checked after every transition
  formulas?: Record<string, string>; // Derived values, e.g. "efficiency": "output / input * 100"
};

export type SimulationSnapshot = {
  currentState: string;
  variables: Record<string, number>;
  derivedValues: Record<string, number>;
  history: Array<{ event: string; from: string; to: string; feedback?: string }>;
  firedRules: Array<{ message: string }>;
};

// ── Math evaluation (safe) ──

function safeEval(expr: string, vars: Record<string, number>): number {
  try {
    const result = evaluate(expr, vars);
    if (typeof result === "number" && isFinite(result)) return result;
    return 0;
  } catch {
    return 0;
  }
}

function evalCondition(expr: string, vars: Record<string, number>): boolean {
  try {
    const result = evaluate(expr, vars);
    return Boolean(result);
  } catch {
    return false;
  }
}

function applyEffects(
  effects: Record<string, string | number>,
  currentVars: Record<string, number>,
  variables: SimVariable[]
): Record<string, number> {
  const next = { ...currentVars };
  const varMap = Object.fromEntries(variables.map(v => [v.name, v]));

  for (const [key, val] of Object.entries(effects)) {
    const v = varMap[key];
    if (!v) continue;
    let newVal: number;
    if (typeof val === "number") {
      newVal = val;
    } else if (typeof val === "string") {
      // Could be a formula like "temperature + 10" or a relative "+15"
      if (val.startsWith("+") || val.startsWith("-")) {
        newVal = (currentVars[key] ?? v.default) + safeEval(val, currentVars);
      } else {
        newVal = safeEval(val, currentVars);
      }
    } else {
      continue;
    }
    next[key] = Math.max(v.min, Math.min(v.max, Math.round(newVal * 100) / 100));
  }
  return next;
}

// ── Create XState machine from SimulationConfig ──

export function buildSimulationMachine(config: SimulationConfig) {
  const statesConfig: Record<string, any> = {};

  for (const state of config.states) {
    const onConfig: Record<string, any> = {};

    for (const t of state.transitions) {
      onConfig[t.event] = {
        target: t.target || state.id,
        actions: assign(({ context }: any) => {
          let vars = { ...context.variables };
          if (t.effects) {
            vars = applyEffects(t.effects, vars, config.variables);
          }
          // Check global rules
          const firedRules: Array<{ message: string }> = [];
          if (config.rules) {
            for (const rule of config.rules) {
              if (evalCondition(rule.condition, vars)) {
                vars = applyEffects(rule.effects, vars, config.variables);
                if (rule.message) firedRules.push({ message: rule.message });
              }
            }
          }
          // Calculate derived values
          const derivedValues: Record<string, number> = {};
          if (config.formulas) {
            for (const [key, formula] of Object.entries(config.formulas)) {
              derivedValues[key] = safeEval(formula, vars);
            }
          }
          return {
            variables: vars,
            derivedValues,
            history: [
              ...context.history,
              { event: t.event, from: state.id, to: t.target || state.id, feedback: t.feedback },
            ],
            firedRules: [...context.firedRules, ...firedRules],
            lastFeedback: t.feedback || (firedRules.length > 0 ? firedRules.map(r => r.message).join(" ") : null),
          };
        }),
      };
    }

    statesConfig[state.id] = {
      on: onConfig,
      entry: state.onEntry
        ? assign(({ context }: any) => {
            let vars = { ...context.variables };
            if (state.onEntry?.effects) {
              vars = applyEffects(state.onEntry.effects, vars, config.variables);
            }
            return {
              variables: vars,
              lastFeedback: state.onEntry?.message || context.lastFeedback,
            };
          })
        : undefined,
    };
  }

  const initialVars = Object.fromEntries(
    config.variables.map(v => [v.name, v.default])
  );

  const machine = createMachine({
    id: "labSimulation",
    initial: config.initialState,
    context: {
      variables: initialVars,
      derivedValues: {} as Record<string, number>,
      history: [] as any[],
      firedRules: [] as any[],
      lastFeedback: null as string | null,
    },
    states: statesConfig,
  });

  return machine;
}

// ── Create actor from machine ──

export function createSimulationActor(machine: AnyStateMachine) {
  return createActor(machine);
}

// ── Extract simulation config from blueprint blocks ──
// Converts existing blueprint format into SimulationConfig

export function blueprintToSimConfig(blueprint: any): SimulationConfig | null {
  const variables: SimVariable[] = blueprint.variables || [];
  const blocks = blueprint.blocks || [];

  if (variables.length === 0 || blocks.length < 2) return null;

  const states: SimState[] = [];
  const choiceBlocks = blocks.filter((b: any) => b.type === "choice_set");

  if (choiceBlocks.length === 0) return null;

  // Create a state for each choice_set block + an intro state + a final state
  states.push({
    id: "intro",
    label: "Introduction",
    transitions: [{ event: "START", target: choiceBlocks.length > 0 ? `decision_0` : "complete" }],
  });

  for (let i = 0; i < choiceBlocks.length; i++) {
    const cb = choiceBlocks[i];
    const nextTarget = i < choiceBlocks.length - 1 ? `decision_${i + 1}` : "complete";
    const transitions: SimTransition[] = (cb.choices || []).map((c: any, ci: number) => ({
      event: `CHOOSE_${i}_${ci}`,
      effects: c.effects || {},
      target: nextTarget,
      feedback: c.feedback || c.text,
    }));
    states.push({
      id: `decision_${i}`,
      label: cb.question || `Decision ${i + 1}`,
      transitions,
    });
  }

  states.push({
    id: "complete",
    label: "Lab Complete",
    transitions: [],
  });

  // Extract rules from blueprint if present
  const rules: SimRule[] = [];
  if (blueprint.rules) {
    for (const r of blueprint.rules) {
      rules.push({
        condition: r.condition || "false",
        effects: r.effects || {},
        message: r.message,
      });
    }
  }

  return {
    initialState: "intro",
    states,
    variables,
    rules,
    formulas: blueprint.formulas,
  };
}

// ── Math utilities for lab tasks ──

export function evaluateFormula(formula: string, vars: Record<string, number>): number {
  return safeEval(formula, vars);
}

export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  tolerance: number = 0.01
): boolean {
  // Try numeric comparison first
  const userNum = parseFloat(userAnswer);
  const correctNum = parseFloat(correctAnswer);
  if (!isNaN(userNum) && !isNaN(correctNum)) {
    return Math.abs(userNum - correctNum) <= Math.abs(correctNum * tolerance);
  }
  // String comparison
  return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
}
