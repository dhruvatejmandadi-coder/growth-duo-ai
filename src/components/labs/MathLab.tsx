import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type Parameter = {
  name: string;
  min: number;
  max: number;
  default: number;
  step?: number;
};

type Props = {
  data: {
    title?: string;
    description?: string;

    // IMPORTANT: pure JS expression using x
    // Example:
    // "m * x + b"
    // "a * x * x + b * x + c"
    // "A * Math.sin(B * x + C) + D"
    // "A * Math.exp(k * x)"
    equation: string;

    parameters: Parameter[];

    domain?: {
      min: number;
      max: number;
      step?: number;
    };
  };
};

export default function GraphMathLab({ data }: Props) {
  const { title, description, equation, parameters, domain = { min: -10, max: 10, step: 0.2 } } = data;

  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(parameters.map((p) => [p.name, p.default])),
  );

  // Replace parameters in equation string for display
  const displayEquation = useMemo(() => {
    let eq = equation;
    Object.entries(values).forEach(([key, val]) => {
      eq = eq.split(key).join(val.toString());
    });
    return `y = ${eq}`;
  }, [equation, values]);

  // Generate graph points
  const graphData = useMemo(() => {
    const points = [];

    for (let x = domain.min; x <= domain.max; x += domain.step ?? 0.2) {
      let y = 0;

      try {
        let evalExpr = equation;

        Object.entries(values).forEach(([key, val]) => {
          evalExpr = evalExpr.split(key).join(`(${val})`);
        });

        const fn = new Function("x", `return ${evalExpr}`);
        y = fn(x);
      } catch {
        y = 0;
      }

      if (Number.isFinite(y)) {
        points.push({ x, y });
      }
    }

    return points;
  }, [equation, values, domain]);

  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="font-bold text-lg">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <Badge variant="outline">{displayEquation}</Badge>

      <Card>
        <CardContent className="p-4 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={[domain.min, domain.max]} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {parameters.map((param) => (
          <div key={param.name} className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>{param.name}</span>
              <span>{values[param.name]}</span>
            </div>

            <Slider
              min={param.min}
              max={param.max}
              step={param.step ?? 0.1}
              value={[values[param.name]]}
              onValueChange={(val) =>
                setValues((prev) => ({
                  ...prev,
                  [param.name]: val[0],
                }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
