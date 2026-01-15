import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-start gap-2 mb-3', className)}>
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span 
              className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" 
              style={{ animationDelay: '0ms', animationDuration: '600ms' }} 
            />
            <span 
              className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" 
              style={{ animationDelay: '150ms', animationDuration: '600ms' }} 
            />
            <span 
              className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" 
              style={{ animationDelay: '300ms', animationDuration: '600ms' }} 
            />
          </div>
          {userName && (
            <span className="text-xs text-muted-foreground ml-1">{userName} is typing</span>
          )}
        </div>
      </div>
    </div>
  );
}
