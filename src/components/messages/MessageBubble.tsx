import { useState } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, Play, Pause, Download, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MessageBubbleProps {
  id: string;
  content: string;
  messageType: 'text' | 'image' | 'voice';
  mediaUrl?: string | null;
  mediaDuration?: number | null;
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'failed';
  isSender: boolean;
  timestamp: string;
  onRetry?: () => void;
}

export function MessageBubble({
  id,
  content,
  messageType,
  mediaUrl,
  mediaDuration,
  deliveryStatus,
  isSender,
  timestamp,
  onRetry,
}: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayVoice = () => {
    if (!mediaUrl) return;
    
    const audio = new Audio(mediaUrl);
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
      };
    }
  };

  const DeliveryIndicator = () => {
    if (!isSender) return null;

    switch (deliveryStatus) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      case 'failed':
        return (
          <button onClick={onRetry} className="flex items-center gap-1 text-destructive">
            <AlertCircle className="h-3 w-3" />
            <RefreshCw className="h-3 w-3" />
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex mb-3', isSender ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl p-3 shadow-sm',
          isSender
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {/* Text Message */}
        {messageType === 'text' && (
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        )}

        {/* Image Message */}
        {messageType === 'image' && mediaUrl && (
          <div className="relative">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            <img
              src={mediaUrl}
              alt="Shared image"
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: '300px' }}
              onClick={() => setImagePreviewOpen(true)}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
            {content && <p className="text-sm mt-2">{content}</p>}
            
            {/* Full-screen image preview */}
            <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
              <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
                <img
                  src={mediaUrl}
                  alt="Full size"
                  className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 right-4"
                  onClick={() => window.open(mediaUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Voice Message */}
        {messageType === 'voice' && mediaUrl && (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10 rounded-full shrink-0',
                isSender ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30' : 'bg-background'
              )}
              onClick={handlePlayVoice}
            >
              {isPlaying ? (
                <Pause className={cn('h-5 w-5', isSender ? 'text-primary-foreground' : '')} />
              ) : (
                <Play className={cn('h-5 w-5', isSender ? 'text-primary-foreground' : '')} />
              )}
            </Button>
            
            <div className="flex-1">
              {/* Audio waveform visualization (simplified) */}
              <div className="h-8 flex items-center gap-[2px]">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1 rounded-full transition-all',
                      i < (audioProgress / 100) * 30
                        ? isSender ? 'bg-primary-foreground' : 'bg-primary'
                        : isSender ? 'bg-primary-foreground/30' : 'bg-muted-foreground/30'
                    )}
                    style={{
                      height: `${Math.random() * 60 + 40}%`,
                    }}
                  />
                ))}
              </div>
              <span className={cn('text-xs', isSender ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {mediaDuration ? formatDuration(mediaDuration) : '0:00'}
              </span>
            </div>
          </div>
        )}

        {/* Timestamp and delivery status */}
        <div className={cn('flex items-center gap-1 mt-1', isSender ? 'justify-end' : 'justify-start')}>
          <span className={cn('text-xs', isSender ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {formatTime(timestamp)}
          </span>
          <DeliveryIndicator />
        </div>
      </div>
    </div>
  );
}
