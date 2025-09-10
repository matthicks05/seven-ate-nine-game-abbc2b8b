import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { ArrowLeft } from 'lucide-react';

const LeaderboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              7-ate-9 Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Compete for the top spot by winning online and AI games!
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;