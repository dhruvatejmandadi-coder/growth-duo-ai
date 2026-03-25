/**
 * React hook for running lab simulations via XState.
 * Bridges the simulation engine with React state.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useActor } from "@xstate/react";
import {
  buildSimulationMachine,
  createSimulationActor,
  blueprintToSimConfig,
  evaluateFormula,
  checkAnswer,
  type SimulationConfig,
  type SimVariable,
} from "@/lib/labSimulationEngine";

export type SimulationStatus = "idle" | "running" | "complete";

export function useLabSimulation(blueprint: any) {
  const [simConfig, setSimConfig] = useState<SimulationConfig | null>(null);
  const [status, setStatus] = useState<SimulationStatus>("idle");
  const [variables, setVariables] = useState<Record<string, number>>({});
  const [derivedValues, setDerivedValues] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<Array<{ event: string; from: string; to: string; feedback?: string }>>([]);
  const [firedRules, setFiredRules] = useState<Array<{ message: string }>>([]);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [currentStateName, setCurrentStateName] = useState<string>("intro");
  const actorRef = useRef<any>(null);

  // Initialize simulation from blueprint
  useEffect(() => {
    const config = blueprintToSimConfig(blueprint);
    if (!config) return;

    setSimConfig(config);
    const initialVars = Object.fromEntries(config.variables.map(v => [v.name, v.default]));
    setVariables(initialVars);
    setDerivedValues({});
    setHistory([]);
    setFiredRules([]);
    setLastFeedback(null);
    setCurrentStateName(config.initialState);
    setStatus("idle");

    // Build and start XState actor
    try {
      const machine = buildSimulationMachine(config);
      const actor = createSimulationActor(machine);
      
      actor.subscribe((snapshot) => {
        const ctx = snapshot.context as any;
        setVariables(ctx.variables || {});
        setDerivedValues(ctx.derivedValues || {});
        setHistory(ctx.history || []);
        setFiredRules(ctx.firedRules || []);
        setLastFeedback(ctx.lastFeedback || null);
        setCurrentStateName(String(snapshot.value));
        
        if (String(snapshot.value) === "complete") {
          setStatus("complete");
        }
      });

      actor.start();
      actorRef.current = actor;
      setStatus("running");
    } catch (e) {
      console.warn("Failed to build simulation machine:", e);
      setSimConfig(null);
    }

    return () => {
      if (actorRef.current) {
        actorRef.current.stop();
        actorRef.current = null;
      }
    };
  }, [blueprint]);

  const sendEvent = useCallback((event: string) => {
    if (actorRef.current) {
      actorRef.current.send({ type: event });
    }
  }, []);

  const reset = useCallback(() => {
    if (!simConfig) return;
    // Stop old actor
    if (actorRef.current) {
      actorRef.current.stop();
    }
    // Rebuild
    try {
      const machine = buildSimulationMachine(simConfig);
      const actor = createSimulationActor(machine);
      
      actor.subscribe((snapshot) => {
        const ctx = snapshot.context as any;
        setVariables(ctx.variables || {});
        setDerivedValues(ctx.derivedValues || {});
        setHistory(ctx.history || []);
        setFiredRules(ctx.firedRules || []);
        setLastFeedback(ctx.lastFeedback || null);
        setCurrentStateName(String(snapshot.value));
        
        if (String(snapshot.value) === "complete") {
          setStatus("complete");
        }
      });

      actor.start();
      actorRef.current = actor;

      const initialVars = Object.fromEntries(simConfig.variables.map(v => [v.name, v.default]));
      setVariables(initialVars);
      setDerivedValues({});
      setHistory([]);
      setFiredRules([]);
      setLastFeedback(null);
      setCurrentStateName(simConfig.initialState);
      setStatus("running");
    } catch (e) {
      console.warn("Failed to rebuild simulation:", e);
    }
  }, [simConfig]);

  // Math helpers exposed for task validation
  const evalFormula = useCallback((formula: string) => {
    return evaluateFormula(formula, variables);
  }, [variables]);

  const validateAnswer = useCallback((userAnswer: string, correctAnswer: string, tolerance?: number) => {
    return checkAnswer(userAnswer, correctAnswer, tolerance);
  }, []);

  return {
    isSimulation: simConfig !== null,
    status,
    variables,
    derivedValues,
    history,
    firedRules,
    lastFeedback,
    currentStateName,
    simConfig,
    sendEvent,
    reset,
    evalFormula,
    validateAnswer,
  };
}
