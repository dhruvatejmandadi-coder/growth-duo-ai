import { FlaskConical } from "lucide-react";
import SimulationLab from "./SimulationLab";
import ClassificationLab from "./ClassificationLab";
import { useMemo } from "react";

type Props = {
  labType?: string | null;
  labData?: any;
  labTitle?: string | null;
  labDescription?: string | null;
};

function isValidLabData(labType: string | null | undefined, labData: any): boolean {
  if (!labType || !labData || typeof labData !== "object") return false;

  try {
    if (labType === "simulation") {
      return Array.isArray(labData.parameters) && labData.parameters.length > 0;
    }

    if (labType === "classification") {
      return (
        Array.isArray(labData.items) &&
        labData.items.length > 0 &&
        Array.isArray(labData.categories) &&
        labData.categories.length > 0
      );
    }
  } catch (e) {
    console.warn("[InteractiveLab] Validation error:", e);
  }

  return false;
}

/* ================================
   AUTO-GENERATE DECISIONS FIX
================================ */

function generateDecisionsFromParameters(parameters: any[]) {
  if (!Array.isArray(parameters) || parameters.length === 0) return [];

  return [
    {
      question: "You need to improve overall performance. What do you focus on?",
      emoji: "⚡",
      choices: parameters.slice(0, 3).map((p, i) => ({
        text: `Increase ${p.name}`,
        explanation: `Boosting ${p.name} will positively impact the outcome.`,
        effects: {
          [p.name]: Math.round((p.max - p.min) * 0.2),
        },
      })),
    },
    {
      question: "You're facing constraints. What do you reduce?",
      emoji: "⚠️",
      choices: parameters.slice(0, 3).map((p) => ({
        text: `Reduce ${p.name}`,
        explanation: `Lowering ${p.name} may negatively affect the result.`,
        effects: {
          [p.name]: -Math.round((p.max - p.min) * 0.15),
        },
      })),
    },
  ];
}

/* ================================
   MAIN COMPONENT
================================ */

export default function InteractiveLab({ labType, labData, labTitle, labDescription }: Props) {
  const resolved = useMemo(() => {
    if (!isValidLabData(labType, labData)) {
      console.warn(`[InteractiveLab] Invalid lab data for "${labTitle}", returning empty fallback.`);
      return {
        type: "simulation",
        data: {
          title: labTitle || "Simulation Lab",
          description: labDescription || "",
          parameters: [],
          thresholds: [],
          decisions: [],
        },
      };
    }

    let data = { ...labData };

    /* ==========================================
       🔥 KEY FIX: ENSURE DECISIONS EXIST
    ========================================== */

    if (
      labType === "simulation" &&
      Array.isArray(data.parameters) &&
      data.parameters.length > 0 &&
      (!Array.isArray(data.decisions) || data.decisions.length === 0)
    ) {
      console.info("[InteractiveLab] No decisions found — auto-generating from parameters.");

      data.decisions = generateDecisionsFromParameters(data.parameters);
    }

    return {
      type: labType!,
      data,
    };
  }, [labType, labData, labTitle, labDescription]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-lg">{resolved.data.title || labTitle}</h3>
      </div>

      {resolved.data.description && <p className="text-sm text-muted-foreground">{resolved.data.description}</p>}

      {resolved.type === "simulation" && <SimulationLab data={resolved.data} />}

      {resolved.type === "classification" && <ClassificationLab data={resolved.data} />}
    </div>
  );
}
