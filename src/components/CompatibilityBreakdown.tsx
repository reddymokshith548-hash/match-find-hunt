import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Flame, Users, Sparkles, ArrowRight } from "lucide-react";

interface TraitData {
  founder_archetype?: string;
  decision_style?: string;
  values_profile?: string;
  leadership_style?: string;
  risk_tolerance?: string;
  thinking_style?: string; // Legacy support
}

interface CompatibilityBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchName: string;
  matchScore: number;
  aiSummary?: string | null;
  viewerTraits?: TraitData | null;
  candidateTraits?: TraitData | null;
  partnershipType?: string | null;
  modelDominance?: string | null;
}

const traitColors: Record<string, string> = {
  'Builder': 'bg-blue-500',
  'Visionary': 'bg-purple-500',
  'Operator': 'bg-orange-500',
  'Decisive': 'bg-red-500',
  'Collaborative': 'bg-green-500',
  'Analytical': 'bg-cyan-500',
  'Delegative': 'bg-indigo-500',
  'Directive': 'bg-rose-500',
  'Integrity-Focused': 'bg-emerald-500',
  'Mission-Driven': 'bg-violet-500',
  'Pragmatic': 'bg-amber-500',
  'Conservative': 'bg-slate-500',
  'Calculated': 'bg-blue-400',
  'Adaptive': 'bg-teal-500',
  // Legacy
  'analytical': 'bg-blue-500',
  'visionary': 'bg-purple-500',
  'executional': 'bg-orange-500',
  'strategist': 'bg-indigo-500',
  'operator': 'bg-green-500',
  'collaborator': 'bg-cyan-500',
  'low': 'bg-slate-500',
  'medium': 'bg-amber-500',
  'high': 'bg-red-500',
};

const partnershipTypeDescriptions: Record<string, string> = {
  'Visionary & Builder': 'Classic complementary pairing like Steve Jobs & Steve Wozniak',
  'Builder & Operator': 'Technical excellence meets business execution',
  'Visionary & Operator': 'Big-picture thinking with operational excellence',
  'Complementary Partners': 'Different strengths that balance each other',
  'Technical Power Pair': 'Deep technical collaboration like Page & Brin',
  'Vision Alignment Duo': 'Shared vision amplifies impact',
  'Operations Power Pair': 'Execution powerhouse partnership',
  'Peer Founders': 'Equal partners with shared working style',
  'Balanced Partnership': 'Best of both complementary and overlapping traits',
};

const TraitBadge = ({ value, label }: { value: string; label: string }) => {
  const color = traitColors[value] || 'bg-gray-500';
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge className={`${color} text-white text-xs`}>{value}</Badge>
    </div>
  );
};

const TraitComparison = ({ 
  icon: Icon, 
  label, 
  viewerValue, 
  candidateValue,
}: { 
  icon: React.ElementType;
  label: string;
  viewerValue: string;
  candidateValue: string;
}) => {
  const isComplementary = viewerValue !== candidateValue;
  const viewerColor = traitColors[viewerValue] || 'bg-gray-500';
  const candidateColor = traitColors[candidateValue] || 'bg-gray-500';
  
  return (
    <div className="p-3 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-medium text-sm">{label}</span>
        {isComplementary && (
          <Badge variant="secondary" className="ml-auto text-xs bg-green-500/10 text-green-600 border-green-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Complementary
          </Badge>
        )}
        {!isComplementary && (
          <Badge variant="secondary" className="ml-auto text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Users className="w-3 h-3 mr-1" />
            Aligned
          </Badge>
        )}
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">You</div>
          <Badge className={`${viewerColor} text-white text-xs`}>{viewerValue}</Badge>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 text-right">
          <div className="text-xs text-muted-foreground mb-1">Them</div>
          <Badge className={`${candidateColor} text-white text-xs`}>{candidateValue}</Badge>
        </div>
      </div>
    </div>
  );
};

export function CompatibilityBreakdown({
  open,
  onOpenChange,
  matchName,
  matchScore,
  aiSummary,
  viewerTraits,
  candidateTraits,
  partnershipType,
  modelDominance,
}: CompatibilityBreakdownProps) {
  const hasTraitData = viewerTraits && candidateTraits;
  
  // Normalize trait names for display
  const getViewerArchetype = () => viewerTraits?.founder_archetype || viewerTraits?.thinking_style || 'Unknown';
  const getCandidateArchetype = () => candidateTraits?.founder_archetype || candidateTraits?.thinking_style || 'Unknown';
  const getViewerLeadership = () => viewerTraits?.leadership_style || 'Unknown';
  const getCandidateLeadership = () => candidateTraits?.leadership_style || 'Unknown';
  const getViewerRisk = () => viewerTraits?.risk_tolerance || 'Unknown';
  const getCandidateRisk = () => candidateTraits?.risk_tolerance || 'Unknown';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Why You Match with {matchName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Overall Score */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30">
              <div>
                <span className="text-2xl font-bold text-primary">{matchScore}</span>
                <span className="text-sm text-primary">%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Compatibility Score</p>
          </div>
          
          {/* Partnership Type */}
          {partnershipType && (
            <div className="text-center">
              <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/5 border-primary/20">
                {partnershipType}
              </Badge>
              {partnershipTypeDescriptions[partnershipType] && (
                <p className="text-xs text-muted-foreground mt-2">
                  {partnershipTypeDescriptions[partnershipType]}
                </p>
              )}
            </div>
          )}
          
          {/* Model Dominance Indicator */}
          {modelDominance && (
            <div className="flex justify-center gap-2">
              <Badge 
                variant={modelDominance === 'complementary' ? 'default' : 'outline'}
                className={modelDominance === 'complementary' ? 'bg-green-500' : ''}
              >
                Complementary
              </Badge>
              <Badge 
                variant={modelDominance === 'overlapping' ? 'default' : 'outline'}
                className={modelDominance === 'overlapping' ? 'bg-blue-500' : ''}
              >
                Overlapping
              </Badge>
              <Badge 
                variant={modelDominance === 'balanced' ? 'default' : 'outline'}
                className={modelDominance === 'balanced' ? 'bg-purple-500' : ''}
              >
                Balanced
              </Badge>
            </div>
          )}
          
          {/* AI Summary */}
          {aiSummary && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm text-foreground/80 leading-relaxed">
                "{aiSummary}"
              </p>
            </div>
          )}
          
          {/* Trait Comparisons */}
          {hasTraitData ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Trait Breakdown
              </h4>
              
              <TraitComparison
                icon={Brain}
                label="Founder Archetype"
                viewerValue={getViewerArchetype()}
                candidateValue={getCandidateArchetype()}
              />
              
              <TraitComparison
                icon={Target}
                label="Leadership Style"
                viewerValue={getViewerLeadership()}
                candidateValue={getCandidateLeadership()}
              />
              
              <TraitComparison
                icon={Flame}
                label="Risk Tolerance"
                viewerValue={getViewerRisk()}
                candidateValue={getCandidateRisk()}
              />
              
              {viewerTraits?.values_profile && candidateTraits?.values_profile && (
                <TraitComparison
                  icon={Users}
                  label="Values Profile"
                  viewerValue={viewerTraits.values_profile}
                  candidateValue={candidateTraits.values_profile}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Complete the Founder Sync Test to see detailed trait comparisons
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
