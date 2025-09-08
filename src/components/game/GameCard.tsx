import { cn } from "@/lib/utils";

export interface Card {
  id: string;
  value: number | "skip";
  color?: "blue" | "red" | "green" | "yellow";
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
    if (card.value === "skip") return "bg-gradient-accent";
    switch (card.color) {
      case "blue": return "bg-gradient-primary";
      case "red": return "bg-destructive";
      case "green": return "bg-green-500";
      case "yellow": return "bg-yellow-500";
      default: return "bg-gradient-secondary";
    }
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
            "flex items-center justify-center text-white font-bold rounded-full w-8 h-8 text-sm",
            getCardColor()
          )}>
            {card.value === "skip" ? "S" : card.value}
          </div>
          
          {/* Corner Values */}
          <div className="absolute top-1 left-1 text-xs font-bold text-card-foreground">
            {card.value === "skip" ? "S" : card.value}
          </div>
          <div className="absolute bottom-1 right-1 text-xs font-bold text-card-foreground transform rotate-180">
            {card.value === "skip" ? "S" : card.value}
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