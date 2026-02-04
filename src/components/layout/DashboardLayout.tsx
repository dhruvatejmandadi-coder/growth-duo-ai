import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Top header */}
          <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-background/95 backdrop-blur-md">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                MentorAI
              </span>
            </Link>
          </header>
          
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
