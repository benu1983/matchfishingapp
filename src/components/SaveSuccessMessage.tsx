import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SaveSuccessMessageProps {
  show: boolean;
  onHide: () => void;
}

export function SaveSuccessMessage({ show, onHide }: SaveSuccessMessageProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-2 text-green-600">
      <Check size={20} />
      <span>Opgeslagen!</span>
    </div>
  );
}