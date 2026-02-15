import { FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SimulationLab from "./SimulationLab";
import DecisionLab from "./DecisionLab";
import ClassificationLab from "./ClassificationLab";
import ReactMarkdown from "react-markdown";
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
    if (labType === "decision") {
      return Array.isArray(labData.scenarios) && labData.scenarios.length > 0;
    }
    if (labType === "classification") {
      return Array.isArray(labData.items) && labData.items.length > 0 &&
             Array.isArray(labData.categories) && labData.categories.length > 0;
    }
  } catch (e) {
    console.warn("[InteractiveLab] Validation error:", e);
  }
  return false;
}

function generateFallbackSimulation(title?: string | null): { type: string; data: any } {
  const labTitle = title || "Exploration Lab";
  console.info(`[InteractiveLab] Generating fallback simulation for: "${labTitle}"`);
  return {
    type: "simulation",
    data: {
      title: labTitle,
      description: "Explore how different factors interact in this hands-on simulation. Adjust the sliders to see their combined effect!",
      equation_label: "Factor Interaction Model",
      equation_template: "Factor A + Factor B + Factor C → Output",
      output_label: "Overall Effectiveness",
      parameters: [
        { name: "Understanding", icon: "🧠", unit: "%", min: 0, max: 100, default: 50, description: "How well the core concepts are grasped" },
        { name: "Practice", icon: "✏️", unit: "%", min: 0, max: 100, default: 30, description: "Amount of hands-on practice applied" },
        { name: "Application", icon: "🚀", unit: "%", min: 0, max: 100, default: 40, description: "Real-world application of knowledge" },
      ],
      thresholds: [
        { label: "🌟 Mastery Level", min_percent: 80, message: "Excellent! All factors are working together effectively." },
        { label: "📈 Building Momentum", min_percent: 50, message: "Good progress — keep pushing the weaker areas to level up." },
        { label: "🔰 Getting Started", min_percent: 0, message: "Increase each factor to see how they compound together." },
      ],
    },
  };
}

export default function InteractiveLab({ labType, labData, labTitle, labDescription }: Props) {
  const resolved = useMemo(() => {
    if (isValidLabData(labType, labData)) {
      return { type: labType!, data: labData };
    }
    // Log why we're falling back
    if (labType && !isValidLabData(labType, labData)) {
      console.warn(`[InteractiveLab] Invalid ${labType} lab data, using fallback.`, { labData });
    } else if (!labType) {
      console.info("[InteractiveLab] No lab type specified, using fallback simulation.");
    }
    return generateFallbackSimulation(labTitle);
  }, [labType, labData, labTitle]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-lg">{resolved.data.title || labTitle}</h3>
      </div>
      {resolved.data.description && (
        <p className="text-sm text-muted-foreground">{resolved.data.description}</p>
      )}

      {resolved.type === "simulation" && <SimulationLab data={resolved.data} />}
      {resolved.type === "decision" && <DecisionLab data={resolved.data} />}
      {resolved.type === "classification" && <ClassificationLab data={resolved.data} />}
    </div>
  );
}
