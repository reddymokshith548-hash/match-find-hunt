import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, FileDown } from 'lucide-react';

interface MutualNDAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserName: string;
  connectionId: string;
  onAccept: () => void;
  isInitiator?: boolean; // true if sender, false if receiver accepting
}

export default function MutualNDAModal({
  open,
  onOpenChange,
  targetUserName,
  connectionId,
  onAccept,
  isInitiator = false
}: MutualNDAModalProps) {
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

      // Ignore duplicate key error (user already signed)
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
        // Determine which field to update based on profile ID
        const isUser1 = connection.user1_id === profile?.id;
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
        title: "🤝 NDA Signed!",
        description: isInitiator 
          ? `Your request has been sent to ${targetUserName}. They'll sign when they accept.`
          : `You and ${targetUserName} are now bound by mutual confidentiality.`
      });

      onOpenChange(false);
      onAccept();
    } catch (error) {
      console.error('Error signing NDA:', error);
      toast({
        title: "Error",
        description: "Failed to sign NDA. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisagree = () => {
    toast({
      title: "Connection cancelled",
      description: "You must agree to the NDA to connect with other users."
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-center">
            🤝 Mutual NDA: Let's Keep Things Private
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6">
          <div className="space-y-5 text-sm leading-relaxed pb-4">
            <p className="text-muted-foreground text-center">
              Before you start chatting, both users agree to keep things private.
            </p>
            
            <p className="font-medium text-foreground">
              By clicking "I Agree", both of you promise:
            </p>

            {/* What's Covered */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                🔐 What's Covered:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                <li>Business ideas, startup plans, code, designs, and personal details shared in this chat.</li>
                <li>Anything marked confidential or that clearly isn't meant to be public.</li>
              </ul>
            </div>

            {/* Agreements */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                🚫 You both agree:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                <li>Don't share anything from this chat with others.</li>
                <li>Don't copy or reuse each other's ideas without permission.</li>
                <li>Use what's shared here only to collaborate, not for competition.</li>
              </ul>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                🕒 How long?
              </h4>
              <p className="text-muted-foreground pl-2">
                Keep it private for 3 years after this chat ends.
              </p>
            </div>

            {/* Legal Stuff */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                🛡️ Legal Stuff:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                <li>This is a legal agreement under Indian law.</li>
                <li>If someone breaks it, the other person can take legal action.</li>
                <li>You're signing this electronically under the Indian IT Act, 2000.</li>
              </ul>
            </div>

            {/* Read Full NDA Link */}
            <div className="pt-2">
              <Button
                variant="link"
                className="p-0 h-auto text-primary flex items-center gap-1"
                onClick={() => {
                  // In a real app, this would download a PDF
                  toast({
                    title: "Full NDA",
                    description: "Full NDA document will be available for download soon."
                  });
                }}
              >
                <FileDown className="h-4 w-4" />
                Read Full NDA
              </Button>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 bg-muted/30 border-t gap-2 flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={handleDisagree} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Disagree
          </Button>
          <Button 
            onClick={handleAgree} 
            disabled={loading} 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              'I Agree'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
