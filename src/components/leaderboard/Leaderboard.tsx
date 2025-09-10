import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';

interface LeaderboardEntry {
  user_id: string;
  points: number;
  games_won: number;
  games_played: number;
  display_name: string;
  rank: number;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      // Get top 10 players with separate queries to avoid join issues
      const { data: topScores } = await supabase
        .from('user_scores')
        .select('user_id, points, games_won, games_played')
        .order('points', { ascending: false })
        .limit(10);

      if (!topScores) {
        setLoading(false);
        return;
      }

      // Get profiles for these users
      const userIds = topScores.map(score => score.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      // Get current user's rank if logged in
      let currentUserRank = null;
      if (user) {
        const { data: allScores } = await supabase
          .from('user_scores')
          .select('user_id, points, games_won, games_played')
          .order('points', { ascending: false });

        if (allScores) {
          const userIndex = allScores.findIndex(entry => entry.user_id === user.id);
          if (userIndex !== -1) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', user.id)
              .single();

            currentUserRank = {
              ...allScores[userIndex],
              display_name: userProfile?.display_name || 'Anonymous',
              rank: userIndex + 1
            };
          }
        }
      }

      // Combine scores with profiles
      const formattedLeaderboard = topScores.map((score, index) => {
        const profile = profiles?.find(p => p.id === score.user_id);
        return {
          user_id: score.user_id,
          points: score.points,
          games_won: score.games_won,
          games_played: score.games_played,
          display_name: profile?.display_name || 'Anonymous',
          rank: index + 1
        };
      });

      setLeaderboard(formattedLeaderboard);
      setUserRank(currentUserRank);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getWinRate = (won: number, played: number) => {
    if (played === 0) return '0%';
    return `${Math.round((won / played) * 100)}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>
          Top players by points earned (online & AI games only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                entry.user_id === user?.id 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank)}
                <div>
                  <div className="font-medium">{entry.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.games_won}W / {entry.games_played}P • {getWinRate(entry.games_won, entry.games_played)} win rate
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="font-bold">
                {entry.points} pts
              </Badge>
            </div>
          ))}

          {userRank && userRank.rank > 10 && (
            <>
              <div className="border-t pt-3 mt-6">
                <div className="text-sm text-muted-foreground mb-2">Your Rank:</div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground">#{userRank.rank}</span>
                    <div>
                      <div className="font-medium">{userRank.display_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {userRank.games_won}W / {userRank.games_played}P • {getWinRate(userRank.games_won, userRank.games_played)} win rate
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {userRank.points} pts
                  </Badge>
                </div>
              </div>
            </>
          )}

          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No players on the leaderboard yet. Be the first to win a game!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};