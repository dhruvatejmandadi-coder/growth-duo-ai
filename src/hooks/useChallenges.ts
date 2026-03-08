import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  youtube_url: string | null;
  is_daily: boolean;
  expires_at: string | null;
  created_at: string;
  user_id: string | null;
  lab_type: string | null;
  lab_data: any;
}

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchChallenges = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setChallenges(data as Challenge[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const dailyChallenge = challenges.find((c) => c.is_daily);
  const regularChallenges = challenges.filter((c) => !c.is_daily);
  const myChallenges = challenges.filter((c) => c.user_id && c.user_id === user?.id);
  const communityChallenges = challenges.filter((c) => !c.user_id || c.user_id !== user?.id);

  return { challenges, dailyChallenge, regularChallenges, myChallenges, communityChallenges, loading, refetch: fetchChallenges };
}
