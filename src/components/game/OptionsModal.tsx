import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({ isOpen, onClose }) => {
  console.log('OptionsModal render - isOpen:', isOpen, 'typeof isOpen:', typeof isOpen);
  
  if (!isOpen) {
    console.log('OptionsModal not rendering because isOpen is false');
    return null;
  }
  
  console.log('OptionsModal rendering with isOpen true');
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md z-[9999] bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-2xl fixed inset-0 m-auto h-fit">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Game Options
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Color Theme</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Theme selection is temporarily disabled for debugging.
            </p>
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