import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  points: number;
  games_won: number;
  games_played: number;
  profiles: {
    display_name: string;
  };
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('user_scores')
        .select(`
          user_id,
          points,
          games_won,
          games_played,
          profiles (
            display_name
          )
        `)
        .order('points', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      setLeaderboard(data || []);
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
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getWinRate = (won: number, played: number) => {
    if (played === 0) return '0%';
    return `${Math.round((won / played) * 100)}%`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
          <CardDescription>Top players by points earned</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard
        </CardTitle>
        <CardDescription>
          Top players by points earned in online and AI games
        </CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No scores yet. Be the first to play and earn points!
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index < 3 ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div>
                    <p className="font-medium">
                      {entry.profiles.display_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.games_won} wins • {getWinRate(entry.games_won, entry.games_played)} win rate
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-bold">
                    {entry.points} pts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};