import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { Palette, Check } from 'lucide-react';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme, themes } = useTheme();

  const themePreviewColors: Record<Theme, { primary: string; secondary: string; accent: string }> = {
    vibrant: { primary: '#C084FC', secondary: '#22D3EE', accent: '#FDE047' },
    forest: { primary: '#34D399', secondary: '#A78BFA', accent: '#FBBF24' },
    ocean: { primary: '#38BDF8', secondary: '#10B981', accent: '#F59E0B' },
    sunset: { primary: '#FB7185', secondary: '#FB923C', accent: '#FBBF24' },
    cosmic: { primary: '#A855F7', secondary: '#C084FC', accent: '#22D3EE' }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Game Options
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Color Theme</h3>
            <div className="grid gap-3">
              {(Object.keys(themes) as Theme[]).map((themeKey) => {
                const colors = themePreviewColors[themeKey];
                const isSelected = currentTheme === themeKey;
                
                return (
                  <Button
                    key={themeKey}
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-between h-auto p-4"
                    onClick={() => setTheme(themeKey)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: colors.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: colors.accent }}
                        />
                      </div>
                      <span className="font-medium">{themes[themeKey]}</span>
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="ml-2">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};