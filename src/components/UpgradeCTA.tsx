import { Sparkles, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/usePlan";
import { useGoToPricing } from "@/hooks/useGoToPricing";

export interface UpgradeCTAProps {
  /** Short reason this CTA is showing — e.g. "Daily swipes used up" */
  reason?: string;
  /** Optional swipe context */
  swipesRemaining?: number;
  /** Optional locked-filter count */
  lockedFilters?: number;
  /** Optional "you have N likes waiting" */
  pendingLikes?: number;
  /** Required when used inline; defaults to "default" full card */
  variant?: "card" | "inline" | "banner";
  className?: string;
  /** Override for which plan to push (defaults to /pricing#pro on Free, /pricing#pro otherwise) */
  ctaLabel?: string;
}

/**
 * Consistent upgrade CTA. Always routes to /pricing and surfaces context
 * (remaining swipes / locked filter count / pending likes) so the user knows
 * exactly what they unlock. Hidden for paid users by default.
 */
export default function UpgradeCTA({
  reason,
  swipesRemaining,
  lockedFilters,
  pendingLikes,
  variant = "card",
  className,
  ctaLabel,
}: UpgradeCTAProps) {
  const goPricing = useGoToPricing();
  const { isPaid, plan } = usePlan();

  if (isPaid) return null;

  const contextBadges: { label: string; tone: "warn" | "info" }[] = [];
  if (typeof swipesRemaining === "number") {
    contextBadges.push({
      label:
        swipesRemaining <= 0
          ? "0 swipes left today"
          : `${swipesRemaining} swipe${swipesRemaining === 1 ? "" : "s"} left today`,
      tone: swipesRemaining <= 0 ? "warn" : "info",
    });
  }
  if (typeof lockedFilters === "number" && lockedFilters > 0) {
    contextBadges.push({
      label: `${lockedFilters} filter${lockedFilters === 1 ? "" : "s"} locked`,
      tone: "info",
    });
  }
  if (typeof pendingLikes === "number" && pendingLikes > 0) {
    contextBadges.push({
      label: `${pendingLikes} ${pendingLikes === 1 ? "person likes" : "people like"} you`,
      tone: "info",
    });
  }

  const label = ctaLabel ?? (plan === "free" ? "Upgrade to unlock" : "See plans");

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={goPricing}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline",
          className
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {reason ?? label}
        <ArrowRight className="w-3 h-3" />
      </button>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">
            {reason ?? "Upgrade to unlock paid features"}
          </span>
          {contextBadges.map((b) => (
            <Badge
              key={b.label}
              variant={b.tone === "warn" ? "destructive" : "secondary"}
              className="ml-1 shrink-0"
            >
              {b.label}
            </Badge>
          ))}
        </div>
        <Button size="sm" variant="hero" onClick={goPricing} className="shrink-0">
          {label}
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <Card
      variant="profile"
      className={cn(
        "p-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/30",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary/15 p-2.5">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1">
            {reason ?? "Unlock the full Lexach experience"}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Upgrade to Starter or Pro for unlimited matches, deeper compatibility insights,
            and to see who liked you.
          </p>
          {contextBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {contextBadges.map((b) => (
                <Badge
                  key={b.label}
                  variant={b.tone === "warn" ? "destructive" : "secondary"}
                >
                  {b.label}
                </Badge>
              ))}
            </div>
          )}
          <Button variant="hero" onClick={goPricing}>
            <Sparkles className="w-4 h-4 mr-2" />
            {label}
          </Button>
        </div>
      </div>
    </Card>
  );
}