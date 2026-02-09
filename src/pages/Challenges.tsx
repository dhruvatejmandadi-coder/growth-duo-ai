import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Clock, Users, Play, MessageCircle, Send, Star } from "lucide-react";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { DailyChallengeCard } from "@/components/challenges/DailyChallengeCard";

// Mock data for challenges
const mockChallenges = [
  {
    id: "1",
    title: "30-Day Consistency Challenge",
    description: "Complete one small task every day for 30 days. Track your progress and stay accountable.",
    youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    is_daily: false,
    participants: 234,
    comments_count: 45,
  },
  {
    id: "2", 
    title: "Learn Something New",
    description: "Pick a skill you've always wanted to learn and dedicate 15 minutes daily to it.",
    youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    is_daily: false,
    participants: 156,
    comments_count: 23,
  },
  {
    id: "3",
    title: "Morning Routine Reset",
    description: "Build a better morning routine. Wake up earlier, journal, and start your day with intention.",
    youtube_url: null,
    is_daily: false,
    participants: 312,
    comments_count: 67,
  },
];

const dailyChallenge = {
  id: "daily-1",
  title: "Today's Quick Win",
  description: "Write down 3 things you're grateful for and share one with someone.",
  youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  expires_in: "16 hours",
  participants: 89,
};

export default function Challenges() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-accent" />
            Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Take on challenges, grow with the community
          </p>
        </div>

        {/* Daily Challenge Highlight */}
        <DailyChallengeCard challenge={dailyChallenge} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Challenges</TabsTrigger>
            <TabsTrigger value="active">My Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No active challenges</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Join a challenge to start tracking your progress!
                </p>
                <Button variant="outline" onClick={() => setActiveTab("all")}>
                  Browse Challenges
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Star className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No completed challenges yet</h3>
                <p className="text-muted-foreground text-sm">
                  Complete your first challenge to see it here!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
