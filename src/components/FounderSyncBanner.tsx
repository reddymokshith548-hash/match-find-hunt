import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FounderSyncBannerProps {
  onDismiss: () => void;
}

export default function FounderSyncBanner({ onDismiss }: FounderSyncBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-medium">Complete FounderSync</span> — Take a quick assessment to get better co-founder recommendations tailored to your working style.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline"
              className="bg-amber-50 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/50 text-amber-800 dark:text-amber-200"
              onClick={() => navigate('/settings?foundersync=true')}
            >
              Take Assessment
            </Button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
