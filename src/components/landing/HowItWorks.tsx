import { Bot, Calendar, Rocket, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Bot,
    title: "Learn with AI",
    description: "Start with our AI tutor to understand concepts, ask questions, and prepare for your mentor session.",
    color: "primary",
  },
  {
    icon: Calendar,
    title: "Book a Mentor",
    description: "Choose an expert mentor in your field. Book a session that fits your schedule for personalized guidance.",
    color: "accent",
  },
  {
    icon: Rocket,
    title: "Level Up",
    description: "Get personalized feedback from your mentor. Apply insights and track your progress over time.",
    color: "primary",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="container px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            How it works
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Three simple steps to success
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A proven process to accelerate your learning journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group"
            >
              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-4 lg:-right-6 z-10 transform -translate-y-1/2">
                  <ArrowRight className="w-6 h-6 text-border" />
                </div>
              )}
              
              <div className="relative bg-card border border-border rounded-2xl p-8 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-lg group-hover:-translate-y-1 card-elevated h-full">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-foreground flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-background">{index + 1}</span>
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                  step.color === "primary" ? "gradient-primary" : "gradient-accent"
                }`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="font-display text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI vs Mentor Note */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border border-border shadow-sm">
            <Bot className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              <span className="text-primary font-semibold">AI helps you learn.</span>{" "}
              <span className="text-accent font-semibold">Mentors help you improve.</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
