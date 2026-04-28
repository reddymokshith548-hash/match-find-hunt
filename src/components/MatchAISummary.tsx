import { useState } from "react";
import { ChevronDown, Sparkles, Lock, Loader2, Wand2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";

interface TraitData {
  thinking_style?: string;
  leadership_style?: string;
  risk_tolerance?: string;
}

export interface MatchAISummaryProps {
  matchId: string;
  matchName: string;
  matchScore: number;
  bio?: string;
  aiSummary?: string | null;
  viewerSkills?: string[];
  candidateSkills?: string[];
  viewerInterests?: string[];
  candidateInterests?: string[];
  viewerTraits?: TraitData | null;
  candidateTraits?: TraitData | null;
  hasFounderSyncTraits?: boolean;
  generating?: boolean;
  onGenerateSummary?: () => void;
  onOpenDeepBreakdown?: () => void;
}

/**
 * Per-card AI summary widget. Tier behaviour:
 *  - Free   → deterministic 1-line trait/skill overlap (no AI), upgrade CTA.
 *  - Starter → cached 2–3 sentence AI summary via generate-ai-summary.
 *  - Pro    → cached AI summary + "Open deep breakdown" button.
 */
export default function MatchAISummary({
  matchName,
  bio,
  aiSummary,
  viewerSkills = [],
  candidateSkills = [],
  viewerInterests = [],
  candidateInterests = [],
  hasFounderSyncTraits = false,
  generating = false,
  onGenerateSummary,
  onOpenDeepBreakdown,
}: MatchAISummaryProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { plan, isPaid, isPro } = usePlan();

  // Deterministic fallback / Free-tier teaser
  const sharedSkills = candidateSkills.filter((s) =>
    viewerSkills.map((x) => x.toLowerCase()).includes((s || "").toLowerCase())
  );
  const sharedInterests = candidateInterests.filter((i) =>
    viewerInterests.map((x) => x.toLowerCase()).includes((i || "").toLowerCase())
  );
  const deterministicLine = (() => {
    if (sharedSkills.length > 0) {
      return `You both bring ${sharedSkills.slice(0, 2).join(" & ")}${
        sharedSkills.length > 2 ? ` (+${sharedSkills.length - 2})` : ""
      } to the table.`;
    }
    if (sharedInterests.length > 0) {
      return `You share an interest in ${sharedInterests.slice(0, 2).join(" & ")}.`;
    }
    return `Complementary profiles — different skill sets that may pair well.`;
  })();

  const headerLabel =
    plan === "free"
      ? "Quick compatibility"
      : plan === "starter"
        ? "AI compatibility summary"
        : "Deep compatibility insight";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-primary/10 transition"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{headerLabel}</span>
            {plan === "free" && (
              <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px] border-primary/40 text-primary">
                <Lock className="w-2.5 h-2.5 mr-0.5" /> Pro
              </Badge>
            )}
            {isPro && hasFounderSyncTraits && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
                Pro
              </Badge>
            )}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-2">
        {/* FREE — deterministic line + CTA */}
        {plan === "free" && (
          <div
            className="rounded-lg border border-dashed border-primary/30 bg-background/60 p-3 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-foreground leading-relaxed">{deterministicLine}</p>
            {bio && (
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {bio}
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-[11px]"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/pricing");
              }}
            >
              <Lock className="w-3 h-3 mr-1" />
              Unlock AI summary for {matchName.split(" ")[0]}
            </Button>
          </div>
        )}

        {/* STARTER / PRO — cached AI summary */}
        {isPaid && (
          <div
            className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            {aiSummary ? (
              <p className="text-xs text-foreground leading-relaxed">{aiSummary}</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {deterministicLine}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-[11px]"
                  disabled={generating || !onGenerateSummary}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateSummary?.();
                  }}
                >
                  {generating ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3 mr-1" />
                  )}
                  Generate AI summary
                </Button>
              </>
            )}

            {isPro && hasFounderSyncTraits && onOpenDeepBreakdown && (
              <Button
                size="sm"
                variant="hero"
                className="w-full h-7 text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDeepBreakdown();
                }}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Open deep breakdown
              </Button>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}