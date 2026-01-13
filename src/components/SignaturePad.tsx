import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eraser, Upload, Pencil } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureData: string | null) => void;
  disabled?: boolean;
}

export default function SignaturePad({ onSignatureChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set drawing style
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setUploadedImage(null);
    onSignatureChange(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setUploadedImage(imageData);
      setHasSignature(true);
      onSignatureChange(imageData);

      // Also draw on canvas for visual consistency
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scale image to fit
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Your Signature *</Label>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Draw
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="draw" className="mt-3">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className={`w-full border-2 border-dashed rounded-lg cursor-crosshair touch-none ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'border-muted-foreground/30 hover:border-primary/50'
              }`}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground text-sm">Sign here using your trackpad or mouse</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="mt-3">
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={disabled}
              className="cursor-pointer"
            />
            {uploadedImage && (
              <div className="border rounded-lg p-2 bg-background">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded signature" 
                  className="max-h-32 mx-auto object-contain"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {hasSignature && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={disabled}
          className="w-full"
        >
          <Eraser className="h-4 w-4 mr-2" />
          Clear Signature
        </Button>
      )}
    </div>
  );
}
