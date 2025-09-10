import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export const GameRulesModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>7-ate-9 Rules</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Basic Rules</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Play cards in sequence: 1→2→3→4→5→6→7→8→9→1</li>
              <li>• First player to empty their hand wins</li>
              <li>• Can't play? Draw a card and skip turn</li>
              <li>• Use wild cards strategically</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Wild Cards</h4>
            <div className="grid gap-2 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">ATE</span>
                <span className="text-muted-foreground">Substitute for any number</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ADD</span>
                <span className="text-muted-foreground">Add chosen number to sequence</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">÷ (Divide)</span>
                <span className="text-muted-foreground">Give half your cards to next player</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">3🇬🇧 (British 3)</span>
                <span className="text-muted-foreground">All players draw 1 card</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">π (Slice of Pi)</span>
                <span className="text-muted-foreground">Discard all 1s, 2s, 3s, and 4s</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">NU-UH</span>
                <span className="text-muted-foreground">Skip, cancel, or avoid drawing</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">🍽️ (Cannibal)</span>
                <span className="text-muted-foreground">Discard 2 cards, others draw 1</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">-1 (Mr Negativity)</span>
                <span className="text-muted-foreground">Play 3 cards lower than sequence</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">2👋 (Two Tickles)</span>
                <span className="text-muted-foreground">Choose 2 players to draw 2 cards</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};