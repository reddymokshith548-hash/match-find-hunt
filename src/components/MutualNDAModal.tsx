import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, FileDown, Download, CheckCircle2 } from 'lucide-react';
import SignaturePad from './SignaturePad';

interface MutualNDAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserName: string;
  connectionId: string;
  onAccept: () => void;
  isInitiator?: boolean;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [signature, setSignature] = useState<string | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  // Check if the user has already signed the NDA and if both have signed
  useEffect(() => {
    const checkNDAStatus = async () => {
      if (!user || !open) {
        setCheckingStatus(false);
        return;
      }
      
      try {
        setCheckingStatus(true);
        
        // Get user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (!profile) {
          setCheckingStatus(false);
          return;
        }
        
        // Get connection details
        const { data: connection } = await supabase
          .from('connections')
          .select('user1_id, user2_id, nda_signed_by_user1, nda_signed_by_user2, status')
          .eq('id', connectionId)
          .single();
        
        if (!connection) {
          setCheckingStatus(false);
          return;
        }
        
        const isUser1 = connection.user1_id === profile.id;
        const userHasSigned = isUser1 ? connection.nda_signed_by_user1 : connection.nda_signed_by_user2;
        const otherHasSigned = isUser1 ? connection.nda_signed_by_user2 : connection.nda_signed_by_user1;
        
        // If both have signed, navigate directly to chat
        if (userHasSigned && otherHasSigned && connection.status === 'accepted') {
          toast({
            title: "✅ NDA Already Signed",
            description: "Both parties have signed. Opening chat..."
          });
          onOpenChange(false);
          navigate(`/messages?connection=${connectionId}`);
          return;
        }
        
        // If user has already signed but waiting for other party
        if (userHasSigned && !otherHasSigned) {
          setAlreadySigned(true);
        }
        
      } catch (error) {
        console.error('Error checking NDA status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkNDAStatus();
  }, [open, user, connectionId]);


  const generateNDADocument = (): string => {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return `
MUTUAL NON-DISCLOSURE AGREEMENT

Effective Date: ${currentDate}

This Mutual Non-Disclosure Agreement ("Agreement") is entered into between the parties connected through the FounderMatch platform.

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by either party to the other, including but not limited to:
- Business ideas, strategies, and startup plans
- Technical information, code, designs, and prototypes
- Financial information and projections
- Customer and user data
- Personal and contact information
- Any information marked as confidential or that would reasonably be understood to be confidential

2. OBLIGATIONS
Both parties agree to:
a) Keep all Confidential Information strictly confidential
b) Not disclose Confidential Information to any third party without prior written consent
c) Not use Confidential Information for any purpose other than evaluating potential collaboration
d) Protect Confidential Information with the same degree of care used for their own confidential information
e) Not copy, reproduce, or reverse engineer any Confidential Information

3. EXCLUSIONS
This Agreement does not apply to information that:
a) Is or becomes publicly available through no fault of the receiving party
b) Was known to the receiving party prior to disclosure
c) Is independently developed by the receiving party
d) Is disclosed with the prior written approval of the disclosing party

4. TERM
This Agreement shall remain in effect for three (3) years from the date of signing.

5. LEGAL COMPLIANCE
This Agreement is governed by the laws of India and is enforceable under:
- The Indian Contract Act, 1872
- The Information Technology Act, 2000
- The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011

6. ELECTRONIC SIGNATURE
Both parties acknowledge that electronic signatures are legally binding under the Information Technology Act, 2000, Section 5.

7. REMEDIES
Both parties acknowledge that breach of this Agreement may cause irreparable harm, and the non-breaching party shall be entitled to seek equitable relief including injunctive relief.

8. MISCELLANEOUS
- This Agreement constitutes the entire agreement between the parties regarding confidentiality
- Any amendments must be in writing and signed by both parties
- If any provision is found unenforceable, the remaining provisions shall remain in effect

By signing below, both parties agree to be bound by the terms of this Agreement.

---
Generated by FounderMatch Platform
Document ID: NDA-${connectionId.slice(0, 8).toUpperCase()}
`;
  };

  const handleDownloadNDA = () => {
    const ndaContent = generateNDADocument();
    const blob = new Blob([ndaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FounderMatch_NDA_${connectionId.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setHasDownloaded(true);
    toast({
      title: "📄 NDA Downloaded",
      description: "Please review the full document before signing."
    });
  };

  const handleAgree = async () => {
    if (!user) return;

    if (!hasDownloaded) {
      toast({
        title: "Download Required",
        description: "Please download and review the full NDA document first.",
        variant: "destructive"
      });
      return;
    }

    if (!signature) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please check the box to confirm you agree to the terms.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get user's profile information
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('name, id')
        .eq('user_id', user.id)
        .single();

      if (profileErr || !profile?.id) {
        throw profileErr ?? new Error('Profile not found');
      }

      // Sign the NDA (treat duplicates as success)
      const { error: ndaError } = await supabase
        .from('nda_signatures')
        .insert({
          user_id: user.id,
          connection_id: connectionId,
          full_name: profile.name || 'Unknown',
          email: user.email || '',
          profile_id: profile.id,
          signature_data: signature,
        });

      // PostgREST returns HTTP 409 on unique constraint conflicts; Supabase error code is usually 23505
      if (ndaError && ndaError.code !== '23505' && (ndaError as any).status !== 409) {
        throw ndaError;
      }

      // Determine which side we are and update the connection
      const { data: connection, error: connErr } = await supabase
        .from('connections')
        .select('user1_id, user2_id, nda_signed_by_user1, nda_signed_by_user2, status')
        .eq('id', connectionId)
        .single();

      if (connErr || !connection) {
        throw connErr ?? new Error('Connection not found');
      }

      const isUser1 = connection.user1_id === profile.id;
      const updateField = isUser1 ? 'nda_signed_by_user1' : 'nda_signed_by_user2';
      const timestampField = isUser1 ? 'user1_accepted_at' : 'user2_accepted_at';

      const { error: updateErr } = await supabase
        .from('connections')
        .update({
          [updateField]: true,
          [timestampField]: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (updateErr) throw updateErr;

      // Re-check after update to avoid stale "otherSigned" races
      const { data: updatedConn, error: recheckErr } = await supabase
        .from('connections')
        .select('nda_signed_by_user1, nda_signed_by_user2, status')
        .eq('id', connectionId)
        .single();

      if (recheckErr || !updatedConn) throw recheckErr ?? new Error('Failed to verify NDA status');

      const bothSigned = !!updatedConn.nda_signed_by_user1 && !!updatedConn.nda_signed_by_user2;

      if (bothSigned) {
        // Ensure accepted status
        if (updatedConn.status !== 'accepted') {
          const { error: acceptErr } = await supabase
            .from('connections')
            .update({ status: 'accepted' })
            .eq('id', connectionId);
          if (acceptErr) throw acceptErr;
        }

        toast({
          title: "🎉 NDA Complete",
          description: `You and ${targetUserName} can now chat securely.`,
        });

        onOpenChange(false);
        onAccept();
        navigate(`/messages?connection=${connectionId}`);
        return;
      }

      toast({
        title: "🤝 NDA Signed!",
        description: `Waiting for ${targetUserName} to sign before chat unlocks.`,
      });

      onOpenChange(false);
      onAccept();
    } catch (error) {
      console.error('Error signing NDA:', error);
      const e = error as any;
      const msg =
        typeof e?.message === 'string'
          ? e.message
          : typeof e?.error?.message === 'string'
            ? e.error.message
            : 'Failed to sign NDA. Please try again.';

      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisagree = () => {
    toast({
      title: "NDA declined",
      description: "You must sign the NDA to start messaging."
    });
    onOpenChange(false);
  };

  const canAgree = hasDownloaded && signature && agreedToTerms;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        {checkingStatus ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking NDA status...</p>
          </div>
        ) : alreadySigned ? (
          <div className="p-8 text-center">
            <div className="mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">
              ✅ You've Already Signed
            </DialogTitle>
            <p className="text-muted-foreground mb-6">
              You've signed the NDA. Waiting for {targetUserName} to sign before you can chat.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl font-bold text-center">
                🤝 Mutual NDA Required
              </DialogTitle>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Sign this NDA to start chatting with {targetUserName}
              </p>
            </DialogHeader>

        <ScrollArea className="max-h-[55vh] px-6">
          <div className="space-y-5 text-sm leading-relaxed pb-4">
            {/* What's Covered */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                🔐 What's Covered:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                <li>Business ideas, startup plans, code, designs, and personal details shared in chat.</li>
                <li>Anything marked confidential or clearly not meant to be public.</li>
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
                🕒 Duration:
              </h4>
              <p className="text-muted-foreground pl-2">
                Keep it private for 3 years after this chat ends.
              </p>
            </div>

            {/* Legal */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                🛡️ Legal:
              </h4>
              <p className="text-muted-foreground pl-2">
                This is legally binding under the Indian IT Act, 2000.
              </p>
            </div>

            {/* Download NDA - REQUIRED */}
            <div className="p-4 bg-muted/50 rounded-lg border border-muted-foreground/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-primary" />
                  <span className="font-medium">Download Full NDA *</span>
                </div>
                {hasDownloaded ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Downloaded</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadNDA}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
              {!hasDownloaded && (
                <p className="text-xs text-muted-foreground mt-2">
                  You must download and review the full NDA before signing.
                </p>
              )}
            </div>

            {/* Signature Pad */}
            <div className="pt-2">
              <SignaturePad 
                onSignatureChange={setSignature}
                disabled={loading}
              />
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                disabled={loading}
              />
              <Label htmlFor="agree-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I have read and understood the full NDA document, and I agree to be legally bound by its terms.
              </Label>
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
            Cancel
          </Button>
          <Button 
            onClick={handleAgree} 
            disabled={loading || !canAgree}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              'Sign & Agree'
            )}
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
