import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Users, Bell, ArrowRight, Code, GraduationCap, Briefcase, Palette, Video, PenTool } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const categories = [
  { icon: Code, name: "Coding", description: "Web dev, mobile apps, data science" },
  { icon: GraduationCap, name: "School", description: "Math, science, languages, test prep" },
  { icon: Briefcase, name: "Professional", description: "Career, leadership, interviews" },
  { icon: Palette, name: "Creative", description: "Design, art, music production" },
  { icon: Video, name: "Video", description: "Editing, filming, content creation" },
  { icon: PenTool, name: "Writing", description: "Copywriting, storytelling, blogging" },
];

export default function Mentors() {
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);
  const { toast } = useToast();

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email to get notified.",
        variant: "destructive",
      });
      return;
    }
    setNotified(true);
    toast({
      title: "You're on the list! 🎉",
      description: "We'll notify you when mentors are available.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container px-4 sm:px-6">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Coming Soon</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">
              Find Your <span className="gradient-text">Perfect Mentor</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              We're building a marketplace of expert mentors across every skill imaginable. 
              Get notified when we launch so you can be first to book.
            </p>

            {/* Notify Form */}
            {!notified ? (
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button variant="hero" type="submit">
                  <Bell className="w-4 h-4" />
                  Notify Me
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Bell className="w-5 h-5" />
                <span className="font-medium">We'll email you when mentors are ready!</span>
              </div>
            )}
          </div>

          {/* Categories Preview */}
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-sm text-muted-foreground mb-6">
              Mentors coming for these categories:
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="bg-card border border-border rounded-xl p-6 transition-all duration-300 hover:border-primary/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                    <cat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-1">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-2xl mx-auto text-center mt-16">
            <p className="text-muted-foreground mb-4">
              Want to start learning right now?
            </p>
            <Button variant="accent" size="lg" asChild>
              <Link to="/ai-tutor">
                Try AI Tutor Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
