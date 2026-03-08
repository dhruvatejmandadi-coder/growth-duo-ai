import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Trophy, CheckCircle2 } from "lucide-react";
import InteractiveLab from "@/components/labs/InteractiveLab";
import { ChallengeComments } from "@/components/challenges/ChallengeComments";
import { usePoints } from "@/hooks/usePoints";
import { useToast } from "@/hooks/use-toast";
import type { Challenge } from "@/hooks/useChallenges";

export default function ChallengeView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<(Challenge & { lab_type?: string | null; lab_data?: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const { completeChallenge, completedChallenges } = usePoints();
  const { toast } = useToast();

  const isCompleted = challenge ? completedChallenges.includes(challenge.id) : false;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        setChallenge(data as any);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleLabComplete = () => {
    if (!challenge || isCompleted) return;
    completeChallenge(challenge.id, challenge.is_daily);
    toast({ title: "Challenge completed! 🎉", description: `+${challenge.is_daily ? 100 : 50} points earned!` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-xl font-bold mb-2">Challenge not found</h2>
        <Button variant="outline" onClick={() => navigate("/challenges")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Challenges
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/challenges")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{challenge.title}</h1>
            {isCompleted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">{challenge.description}</p>
        </div>
        {challenge.lab_type && (
          <Badge variant="outline" className="capitalize text-xs">
            {challenge.lab_type.replace(/_/g, " ")}
          </Badge>
        )}
      </div>

      {/* Interactive Lab */}
      {challenge.lab_data && challenge.lab_type ? (
        <InteractiveLab
          labType={challenge.lab_type}
          labData={challenge.lab_data}
          labTitle={challenge.title}
          labDescription={challenge.description}
          onComplete={handleLabComplete}
          isCompleted={isCompleted}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              This challenge doesn't have an interactive lab. It's a text-based challenge.
            </p>
            {!isCompleted && (
              <Button onClick={handleLabComplete}>Mark as Complete (+50 pts)</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Discussion</h2>
        <ChallengeComments challengeId={challenge.id} />
      </div>
    </div>
  );
}
