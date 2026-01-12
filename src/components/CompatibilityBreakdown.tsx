import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Target, Flame, ArrowRight, Sparkles } from "lucide-react";

interface TraitData {
  thinking_style: string;
  leadership_style: string;
  risk_tolerance: string;
}

interface CompatibilityBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchName: string;
  matchScore: number;
  aiSummary?: string | null;
  viewerTraits?: TraitData | null;
  candidateTraits?: TraitData | null;
}

const traitLabels = {
  thinking_style: {
    analytical: { label: 'Analytical', description: 'Data-driven decision maker', color: 'bg-blue-500' },
    visionary: { label: 'Visionary', description: 'Big-picture strategist', color: 'bg-purple-500' },
    executional: { label: 'Executional', description: 'Action-oriented doer', color: 'bg-orange-500' },
  },
  leadership_style: {
    strategist: { label: 'Strategist', description: 'Plans and directs', color: 'bg-indigo-500' },
    operator: { label: 'Operator', description: 'Drives execution', color: 'bg-green-500' },
    collaborator: { label: 'Collaborator', description: 'Builds consensus', color: 'bg-cyan-500' },
  },
  risk_tolerance: {
    low: { label: 'Cautious', description: 'Prefers certainty', color: 'bg-slate-500' },
    medium: { label: 'Balanced', description: 'Weighs options carefully', color: 'bg-amber-500' },
    high: { label: 'Bold', description: 'Embraces uncertainty', color: 'bg-red-500' },
  },
};

type ThinkingStyle = 'analytical' | 'visionary' | 'executional';
type LeadershipStyle = 'strategist' | 'operator' | 'collaborator';
type RiskTolerance = 'low' | 'medium' | 'high';

const getTraitInfo = (traitType: 'thinking_style' | 'leadership_style' | 'risk_tolerance', value: string) => {
  const map = traitLabels[traitType] as Record<string, { label: string; description: string; color: string }>;
  return map[value] || { label: value, description: '', color: 'bg-gray-500' };
};

const TraitComparison = ({ 
  icon: Icon, 
  label, 
  viewerValue, 
  candidateValue,
  traitType 
}: { 
  icon: React.ElementType;
  label: string;
  viewerValue: string;
  candidateValue: string;
  traitType: 'thinking_style' | 'leadership_style' | 'risk_tolerance';
}) => {
  const viewerInfo = getTraitInfo(traitType, viewerValue);
  const candidateInfo = getTraitInfo(traitType, candidateValue);
  
  const isComplementary = viewerValue !== candidateValue;
  
  return (
    <div className="p-4 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="font-medium text-sm">{label}</span>
        {isComplementary && (
          <Badge variant="secondary" className="ml-auto text-xs bg-green-500/10 text-green-600 border-green-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Complementary
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Viewer trait */}
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">You</div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-white text-sm font-medium ${viewerInfo.color}`}>
            {viewerInfo.label}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{viewerInfo.description}</p>
        </div>
        
        {/* Arrow */}
        <div className="flex-shrink-0">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
        
        {/* Candidate trait */}
        <div className="flex-1 text-right">
          <div className="text-xs text-muted-foreground mb-1">Them</div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-white text-sm font-medium ${candidateInfo.color}`}>
            {candidateInfo.label}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{candidateInfo.description}</p>
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
}: CompatibilityBreakdownProps) {
  const hasTraitData = viewerTraits && candidateTraits;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Why You Match with {matchName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Overall Score */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30">
              <div>
                <span className="text-3xl font-bold text-primary">{matchScore}</span>
                <span className="text-sm text-primary">%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Compatibility Score</p>
          </div>
          
          {/* AI Summary */}
          {aiSummary && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm text-foreground/80 italic leading-relaxed">
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
                label="Thinking Style"
                viewerValue={viewerTraits.thinking_style}
                candidateValue={candidateTraits.thinking_style}
                traitType="thinking_style"
              />
              
              <TraitComparison
                icon={Target}
                label="Leadership Style"
                viewerValue={viewerTraits.leadership_style}
                candidateValue={candidateTraits.leadership_style}
                traitType="leadership_style"
              />
              
              <TraitComparison
                icon={Flame}
                label="Risk Tolerance"
                viewerValue={viewerTraits.risk_tolerance}
                candidateValue={candidateTraits.risk_tolerance}
                traitType="risk_tolerance"
              />
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Complete FounderSync to see detailed trait comparisons
              </p>
            </div>
          )}
          
          {/* Score Breakdown */}
          {hasTraitData && (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                What This Means
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getCompatibilityInsight(viewerTraits, candidateTraits)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getCompatibilityInsight(viewer: TraitData, candidate: TraitData): string {
  const insights: string[] = [];
  
  // Thinking style insight
  if (viewer.thinking_style !== candidate.thinking_style) {
    if (viewer.thinking_style === 'analytical' && candidate.thinking_style === 'executional') {
      insights.push("Your analytical approach pairs well with their action-oriented style—you plan, they execute.");
    } else if (viewer.thinking_style === 'visionary' && candidate.thinking_style === 'executional') {
      insights.push("Your big-picture thinking complements their hands-on execution.");
    } else if (viewer.thinking_style === 'analytical' && candidate.thinking_style === 'visionary') {
      insights.push("You bring data-driven rigor to their ambitious vision.");
    } else {
      insights.push("Your different thinking styles create a balanced perspective.");
    }
  }
  
  // Leadership insight
  if (viewer.leadership_style !== candidate.leadership_style) {
    if (viewer.leadership_style === 'strategist' && candidate.leadership_style === 'operator') {
      insights.push("Classic founder pairing: strategy meets execution.");
    } else if (viewer.leadership_style === 'collaborator') {
      insights.push("Your collaborative nature helps bridge different working styles.");
    }
  }
  
  // Risk tolerance insight
  const riskMap = { low: 0, medium: 1, high: 2 };
  const riskDiff = Math.abs(riskMap[viewer.risk_tolerance] - riskMap[candidate.risk_tolerance]);
  if (riskDiff === 1) {
    insights.push("Your risk tolerances balance each other—neither too cautious nor too reckless.");
  }
  
  return insights.length > 0 
    ? insights.join(" ") 
    : "You share complementary traits that could lead to a balanced partnership.";
}
