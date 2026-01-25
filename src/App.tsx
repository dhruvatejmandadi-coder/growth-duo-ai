import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Mentors from "./pages/Mentors";
import AITutor from "./pages/AITutor";
import Dashboard from "./pages/Dashboard";
import Tests from "./pages/Tests";
import Messages from "./pages/Messages";
import Courses from "./pages/Courses";
import CourseBuilder from "./pages/CourseBuilder";
import ProgressPage from "./pages/ProgressPage";
import Waitlist from "./pages/Waitlist";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/ai-tutor" element={<AITutor />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/new" element={<CourseBuilder />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
