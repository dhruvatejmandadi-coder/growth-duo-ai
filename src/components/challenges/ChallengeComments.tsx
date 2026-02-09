import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface ChallengeCommentsProps {
  challengeId: string;
}

// Mock comments
const mockComments: Comment[] = [
  {
    id: "1",
    author_name: "Alex M.",
    content: "This challenge really helped me stay consistent! Day 15 and going strong 💪",
    created_at: "2 hours ago",
  },
  {
    id: "2",
    author_name: "Sarah K.",
    content: "Just joined! Excited to start this journey with everyone.",
    created_at: "5 hours ago",
  },
];

export function ChallengeComments({ challengeId }: ChallengeCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    if (!user && !guestName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to comment.",
      });
      return;
    }

    const comment: Comment = {
      id: Date.now().toString(),
      author_name: user ? "You" : guestName,
      content: newComment,
      created_at: "Just now",
    };

    setComments([comment, ...comments]);
    setNewComment("");
    
    toast({
      title: "Comment added!",
      description: "Your comment has been posted.",
    });
  };

  return (
    <div className="pt-4 border-t border-border space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {!user && (
          <Input
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="text-sm"
          />
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="text-sm"
          />
          <Button type="submit" size="icon" variant="hero">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {comment.author_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.author_name}</span>
                <span className="text-xs text-muted-foreground">{comment.created_at}</span>
              </div>
              <p className="text-sm text-muted-foreground">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
