import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGameScoring = () => {
  const { toast } = useToast();

  const awardPointsForWin = useCallback(async (gameMode: string, userId?: string) => {
    if (!userId || gameMode === 'local') {
      return; // No points for local games or non-authenticated users
    }

    try {
      // Call the award_points function
      const { error } = await supabase.rpc('award_points', {
        p_user_id: userId,
        p_points: 1
      });

      if (error) {
        console.error('Error awarding points:', error);
        return;
      }

      toast({
        title: "🎉 You earned 1 point!",
        description: "Great win! Check the leaderboard to see your ranking.",
      });
    } catch (error) {
      console.error('Error in awardPointsForWin:', error);
    }
  }, [toast]);

  const recordGamePlayed = useCallback(async (gameMode: string, userId?: string) => {
    if (!userId || gameMode === 'local') {
      return; // No recording for local games or non-authenticated users
    }

    try {
      // Call the record_game_played function
      const { error } = await supabase.rpc('record_game_played', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error recording game played:', error);
      }
    } catch (error) {
      console.error('Error in recordGamePlayed:', error);
    }
  }, []);

  return {
    awardPointsForWin,
    recordGamePlayed
  };
};