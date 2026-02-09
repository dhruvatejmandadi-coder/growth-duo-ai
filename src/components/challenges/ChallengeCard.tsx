import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Play, ChevronDown, ChevronUp } from "lucide-react";
import { ChallengeComments } from "./ChallengeComments";

interface Challenge {
  id: string;
  title: string;
  description: string;
  youtube_url: string | null;
  is_daily: boolean;
  participants: number;
  comments_count: number;
}

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* YouTube Embed */}
      {challenge.youtube_url && (
        <div className="aspect-video w-full bg-muted">
          <iframe
            src={challenge.youtube_url}
            title={challenge.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {challenge.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {challenge.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{challenge.participants} joined</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{challenge.comments_count}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant={isJoined ? "secondary" : "hero"}
            size="sm"
            className="flex-1"
            onClick={() => setIsJoined(!isJoined)}
          >
            {isJoined ? "Joined ✓" : "Join Challenge"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <ChallengeComments challengeId={challenge.id} />
        )}
      </CardContent>
    </Card>
  );
}
