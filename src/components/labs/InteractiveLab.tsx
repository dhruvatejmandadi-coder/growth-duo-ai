import { useState, useMemo } from "react";

type Parameter = {
  name: string;
  min: number;
  max: number;
  default: number;
};

type Threshold = {
  label: string;
  min_percent: number;
  message: string;
};

type DecisionChoice = {
  text: string;
  explanation?: string;
  set_state?: Record<string, number>;
};

type Decision = {
  question: string;
  choices: DecisionChoice[];
};

type Props = {
  data: {
    title?: string;
    description?: string;
    parameters: Parameter[];
    thresholds: Threshold[];
    decisions?: Decision[];
  };
};

export default function SimulationLab({ data }: Props) {
  const { title, description, parameters, thresholds, decisions = [] } = data;

  const [state, setState] = useState<Record<string, number>>(
    Object.fromEntries(parameters.map((p) => [p.name, p.default])),
  );

  const scorePercent = useMemo(() => {
    const total = parameters.reduce((sum, p) => sum + p.max, 0);
    const current = parameters.reduce((sum, p) => sum + (state[p.name] ?? 0), 0);
    return total === 0 ? 0 : Math.round((current / total) * 100);
  }, [state, parameters]);

  const currentThreshold =
    thresholds.sort((a, b) => b.min_percent - a.min_percent).find((t) => scorePercent >= t.min_percent) ||
    thresholds[0];

  const applyDecision = (decisionIndex: number, choiceIndex: number) => {
    const choice = decisions[decisionIndex].choices[choiceIndex];

    if (choice.set_state) {
      setState((prev) => {
        const updated = { ...prev };
        Object.entries(choice.set_state!).forEach(([key, val]) => {
          updated[key] = (updated[key] ?? 0) + val;
        });
        return updated;
      });
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}

      <h4>Parameters</h4>
      {parameters.map((param) => (
        <div key={param.name}>
          <label>
            {param.name}: {state[param.name]}
          </label>
          <input
            type="range"
            min={param.min}
            max={param.max}
            value={state[param.name]}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                [param.name]: parseInt(e.target.value),
              }))
            }
          />
        </div>
      ))}

      <h4>Score: {scorePercent}%</h4>
      <p>{currentThreshold?.message}</p>

      {decisions.map((decision, dIndex) => (
        <div key={dIndex} style={{ marginTop: 20 }}>
          <h4>{decision.question}</h4>
          {decision.choices.map((choice, cIndex) => (
            <button
              key={cIndex}
              onClick={() => applyDecision(dIndex, cIndex)}
              style={{ display: "block", margin: "5px 0" }}
            >
              {choice.text}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
