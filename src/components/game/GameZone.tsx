import { cn } from "@/lib/utils";
import { GameCard, Card } from "./GameCard";

interface GameZoneProps {
  title: string;
  cards: Card[];
  className?: string;
  maxCards?: number;
  isDropZone?: boolean;
  isActive?: boolean;
  onCardClick?: (card: Card, index: number) => void;
  cardSize?: "sm" | "md" | "lg";
  layout?: "stack" | "spread" | "fan";
}

export const GameZone = ({
  title,
  cards,
  className,
  maxCards,
  isDropZone = false,
  isActive = false,
  onCardClick,
  cardSize = "md",
  layout = "stack"
}: GameZoneProps) => {
  const getLayoutClasses = () => {
    switch (layout) {
      case "spread":
        return "flex flex-wrap gap-1";
      case "fan":
        return "flex -space-x-8";
      case "stack":
      default:
        return "relative flex items-center justify-center";
    }
  };

  const renderCards = () => {
    if (layout === "stack" && cards.length > 0) {
      // Show only the top card with stack effect
      return (
        <div className="relative">
          {/* Stack shadow effect */}
          {cards.length > 1 && (
            <>
              <div className="absolute top-1 left-1 w-16 h-24 bg-muted/30 rounded-lg" />
              <div className="absolute top-0.5 left-0.5 w-16 h-24 bg-muted/20 rounded-lg" />
            </>
          )}
          {/* Top card */}
          <GameCard
            card={cards[cards.length - 1]}
            size={cardSize}
            onClick={() => onCardClick?.(cards[cards.length - 1], cards.length - 1)}
          />
          {/* Card count badge */}
          {cards.length > 1 && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cards.length}
            </div>
          )}
        </div>
      );
    }

    // Regular layout for spread and fan
    return cards.map((card, index) => (
      <GameCard
        key={card.id}
        card={card}
        size={cardSize}
        onClick={() => onCardClick?.(card, index)}
        className={layout === "fan" ? `hover:z-10 hover:-translate-y-2` : ""}
      />
    ));
  };

  return (
    <div className={cn(
      "game-zone p-4 min-h-32",
      isActive && "active",
      className
    )}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-2 text-center">
        {title}
      </h3>
      
      <div className={cn(
        "min-h-24 flex items-center justify-center",
        getLayoutClasses()
      )}>
        {cards.length > 0 ? (
          renderCards()
        ) : (
          <div className="text-muted-foreground/50 text-xs text-center">
            {isDropZone ? "Drop cards here" : "Empty"}
          </div>
        )}
      </div>
    </div>
  );
};