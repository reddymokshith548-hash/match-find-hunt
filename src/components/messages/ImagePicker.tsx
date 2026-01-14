import { useRef, useState } from 'react';
import { Image, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export function ImagePicker({ onImageSelected, disabled }: ImagePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setIsLoading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);

    onImageSelected(file);
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="h-16 w-16 object-cover rounded-lg"
          />
          <button
            onClick={clearPreview}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-10 w-10 rounded-full', disabled && 'opacity-50')}
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Image className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}
