import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerStatsModalProps {
  playerHands: any[][];
  currentPlayer: number;
  deckLength: number;
  discardLength: number;
}

export const PlayerStatsModal = ({ 
  playerHands, 
  currentPlayer, 
  deckLength, 
  discardLength 
}: PlayerStatsModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Game Statistics</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Players</h4>
            <div className="space-y-2">
              {playerHands.map((hand, index) => (
                <div key={index} className={cn(
                  "flex justify-between items-center p-2 rounded",
                  index === currentPlayer ? "bg-primary/10 border border-primary/20" : "bg-muted/20"
                )}>
                  <span className={cn(
                    "font-medium",
                    index === currentPlayer && "text-primary"
                  )}>
                    Player {index + 1}
                    {index === currentPlayer && " (Current)"}
                  </span>
                  <span className="text-sm">{hand.length} cards</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Game Info</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Cards in deck:</span>
                <span className="font-bold">{deckLength}</span>
              </div>
              <div className="flex justify-between">
                <span>Cards played:</span>
                <span className="font-bold">{discardLength}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};