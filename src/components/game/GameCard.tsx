import { cn } from "@/lib/utils";

export interface Card {
  id: string;
  type: "number" | "wild";
  value?: number; // 1-9 for numbered cards
  wildType?: "ate" | "addy" | "divide" | "british3" | "slicepi" | "nuuh" | "cannibal" | "negativity" | "tickles";
  isVisible?: boolean;
}

interface GameCardProps {
  card: Card;
  className?: string;
  onClick?: () => void;
  isDraggable?: boolean;
  isSelected?: boolean;
  size?: "sm" | "md" | "lg";
}

export const GameCard = ({ 
  card, 
  className, 
  onClick, 
  isDraggable = false,
  isSelected = false,
  size = "md"
}: GameCardProps) => {
  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-16 h-24", 
    lg: "w-20 h-28"
  };

  const getCardColor = () => {
    if (card.type === "wild") return "bg-gradient-accent";
    // Color coding for numbered cards by value ranges
    if (card.value! <= 3) return "bg-gradient-primary";
    if (card.value! <= 6) return "bg-destructive";
    return "bg-gradient-secondary";
  };

  const getCardDisplay = () => {
    if (card.type === "number") {
      return card.value;
    }
    
    // Wild card display names
    const wildDisplays = {
      ate: "ATE",
      addy: "ADD",
      divide: "÷",
      british3: "3🇬🇧",
      slicepi: "π",
      nuuh: "NU-UH",
      cannibal: "🍽️",
      negativity: "-1",
      tickles: "2👋"
    };
    
    return wildDisplays[card.wildType!] || "?";
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-card-border bg-card shadow-card cursor-pointer select-none",
        "card-hover transition-all duration-300",
        sizeClasses[size],
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDraggable && "cursor-grab active:cursor-grabbing",
        className
      )}
      onClick={onClick}
      draggable={isDraggable}
    >
      {card.isVisible ? (
        <div className="flex flex-col items-center justify-center h-full p-1">
          {/* Card Value */}
          <div className={cn(
            "flex items-center justify-center text-white font-bold rounded-full min-w-8 h-8 px-1 text-xs",
            getCardColor()
          )}>
            {getCardDisplay()}
          </div>
          
          {/* Corner Values */}
          <div className="absolute top-1 left-1 text-xs font-bold text-card-foreground">
            {getCardDisplay()}
          </div>
          <div className="absolute bottom-1 right-1 text-xs font-bold text-card-foreground transform rotate-180">
            {getCardDisplay()}
          </div>
        </div>
      ) : (
        // Card Back
        <div className="h-full w-full bg-gradient-primary rounded-lg flex items-center justify-center">
          <div className="text-primary-foreground font-bold text-lg opacity-80">?</div>
        </div>
      )}
    </div>
  );
};