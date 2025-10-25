import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NDAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  connectionId: string;
  onAccept: () => void;
}

export default function NDAModal({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  connectionId,
  onAccept
}: NDAModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAgree = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get user's profile information
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, id')
        .eq('user_id', user.id)
        .single();

      // Sign the NDA
      const { error: ndaError } = await supabase
        .from('nda_signatures')
        .insert({
          user_id: user.id,
          connection_id: connectionId,
          full_name: profile?.name || 'Unknown',
          email: user.email || '',
          profile_id: profile?.id || '',
        });

      if (ndaError && ndaError.code !== '23505') {
        throw ndaError;
      }

      // Get connection details to determine which user we are
      const { data: connection } = await supabase
        .from('connections')
        .select('user1_id, user2_id')
        .eq('id', connectionId)
        .single();

      if (connection) {
        const isUser1 = connection.user1_id === user.id;
        const updateField = isUser1 ? 'nda_signed_by_user1' : 'nda_signed_by_user2';
        const timestampField = isUser1 ? 'user1_accepted_at' : 'user2_accepted_at';

        // Update connection with NDA signature
        await supabase
          .from('connections')
          .update({ 
            [updateField]: true,
            [timestampField]: new Date().toISOString()
          })
          .eq('id', connectionId);
      }

      toast({
        title: "NDA Signed",
        description: `You've agreed to keep conversations with ${targetUserName} confidential`
      });

      onOpenChange(false);
      onAccept();
    } catch (error) {
      console.error('Error signing NDA:', error);
      toast({
        title: "Error",
        description: "Failed to sign NDA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisagree = () => {
    toast({
      title: "Connection cancelled",
      description: "You must agree to the NDA to connect"
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            Lexach Confidentiality Agreement
          </DialogTitle>
          <DialogDescription>
            Please read and accept the NDA before connecting with {targetUserName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-lg mb-2">LEXACH PROTOTYPE NDA</h3>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Purpose:</h4>
              <p className="text-muted-foreground">
                By entering this messaging chat or SparkRoom or connecting with another user, 
                you agree to keep all ideas, discussions, and shared information completely confidential.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">What's confidential:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Startup ideas, product concepts, or business strategies</li>
                <li>Designs, mockups, prototypes, or screenshots</li>
                <li>Any private messages, plans, or files shared within Lexach</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Your obligations:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Do not share, copy, or post any info outside this conversation</li>
                <li>Only use information to evaluate collaboration with LEXACH</li>
                <li>Treat all shared info as strictly private and confidential</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Ownership:</h4>
              <p className="text-muted-foreground">
                All ideas and content belong to the person sharing them. You gain no rights 
                to any idea or content.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Duration:</h4>
              <p className="text-muted-foreground">
                This NDA lasts indefinitely. Even if you stop using LEXACH, your confidentiality 
                obligation continues permanently.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Breach:</h4>
              <p className="text-muted-foreground mb-2">Violating this NDA may result in:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Immediate suspension or banning from LEXACH</li>
                <li>Legal action if the affected user chooses to pursue it</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Acceptance:</h4>
              <p className="text-muted-foreground mb-2">By clicking "I Agree", you confirm that:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>You understand and accept these terms</li>
                <li>You are legally agreeing to keep all shared information confidential</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDisagree} disabled={loading}>
            Disagree
          </Button>
          <Button onClick={handleAgree} disabled={loading} variant="hero">
            {loading ? 'Signing...' : 'I Agree'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
