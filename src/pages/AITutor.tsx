import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Sparkles, Info, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const MAX_FREE_MESSAGES = 10;

const suggestedQuestions = [
  "Explain recursion in programming",
  "How do I solve quadratic equations?",
  "Tips for improving my writing",
  "What makes a good portfolio?",
];

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your AI tutor. I can help you learn about coding, school subjects, creative skills, professional development, and much more. What would you like to explore today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const remainingMessages = MAX_FREE_MESSAGES - messageCount;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    if (remainingMessages <= 0) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setMessageCount((prev) => prev + 1);

    // Simulate AI response (will be replaced with real AI later)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimulatedResponse(userMessage.content),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const getSimulatedResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes("recursion") || q.includes("programming") || q.includes("code")) {
      return "Great question! **Recursion** is when a function calls itself to solve a problem by breaking it into smaller pieces.\n\nHere's a simple example:\n```\nfunction countdown(n) {\n  if (n <= 0) return; // Base case\n  console.log(n);\n  countdown(n - 1); // Recursive call\n}\n```\n\nKey parts:\n1. **Base case** - When to stop\n2. **Recursive case** - The function calling itself\n\nWant me to explain with more examples?";
    }
    if (q.includes("quadratic") || q.includes("equation") || q.includes("math")) {
      return "For quadratic equations (ax² + bx + c = 0), you can use the **quadratic formula**:\n\nx = (-b ± √(b² - 4ac)) / 2a\n\n**Steps:**\n1. Identify a, b, and c from your equation\n2. Calculate the discriminant: b² - 4ac\n3. Plug into the formula\n\n**Example:** x² + 5x + 6 = 0\n- a=1, b=5, c=6\n- Solutions: x = -2 and x = -3\n\nShould I walk through a specific problem?";
    }
    if (q.includes("writing") || q.includes("essay") || q.includes("content")) {
      return "Here are my top tips for better writing:\n\n1. **Start with an outline** - Know your main points before writing\n2. **Write first, edit later** - Don't perfectionism slow you down\n3. **Use active voice** - \"The dog bit the man\" vs \"The man was bitten\"\n4. **Cut unnecessary words** - Every word should earn its place\n5. **Read it aloud** - You'll catch awkward phrases\n\nWhat type of writing are you working on? I can give more specific advice!";
    }
    if (q.includes("portfolio") || q.includes("career") || q.includes("job")) {
      return "A strong portfolio should:\n\n**1. Show quality over quantity**\n- 3-5 best projects > 20 mediocre ones\n\n**2. Tell the story**\n- What problem did you solve?\n- What was your process?\n- What were the results?\n\n**3. Be easy to navigate**\n- Clear categories\n- Fast loading\n- Mobile-friendly\n\n**4. Include context**\n- Your role in team projects\n- Tools and skills used\n\nWhat field is your portfolio for?";
    }
    
    return "That's a great question! I'd love to help you explore this topic further.\n\nCould you tell me a bit more about:\n- What you already know about this\n- What specifically you're trying to learn or accomplish\n\nThis will help me give you the most relevant guidance. Or if you'd like more personalized feedback, our mentor marketplace is coming soon!";
  };

  const handleSuggestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-16 flex flex-col">
        <div className="container px-4 sm:px-6 flex-1 flex flex-col max-w-4xl py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold">AI Tutor</h1>
                <p className="text-sm text-muted-foreground">Your 24/7 learning companion</p>
              </div>
            </div>
            
            {/* Credits Display */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              remainingMessages <= 3 ? "bg-destructive/10 text-destructive" : "bg-secondary"
            }`}>
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">{remainingMessages} messages left</span>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl border border-border mb-6">
            <Info className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="text-accent font-medium">AI helps you learn.</span>{" "}
              <span className="text-primary font-medium">Mentors help you improve.</span>{" "}
              Use me to understand concepts, then book a mentor for personalized feedback on your work.
            </p>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-4">
                <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestion(q)}
                      className="text-xs px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Limit Reached Banner */}
            {remainingMessages <= 0 && (
              <div className="p-4 bg-destructive/10 border-t border-destructive/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">Free messages used up</p>
                    <p className="text-sm text-muted-foreground">Sign up to continue learning</p>
                  </div>
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/signup">Get More</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={remainingMessages > 0 ? "Ask anything..." : "Sign up to continue..."}
                  className="flex-1"
                  disabled={isLoading || remainingMessages <= 0}
                />
                <Button 
                  variant="hero" 
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || remainingMessages <= 0}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
