import { cn } from '@/lib/utils';

interface OnlineStatusProps {
  isOnline: boolean;
  showText?: boolean;
  className?: string;
}

export function OnlineStatus({ isOnline, showText = true, className }: OnlineStatusProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-muted-foreground/50'
        )}
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}
