import { useEffect, useState } from "react";

interface IntroAnimationProps {
  /** Unique key used in sessionStorage so it only plays once per tab session. Pass null to always play. */
  storageKey?: string | null;
  /** Called when the animation finishes and unmounts. */
  onComplete?: () => void;
  /** Total duration in ms. Default 2800ms. */
  duration?: number;
}

/**
 * Full-screen brand intro inspired by an "open_slate"-style boot sequence:
 * crosshair guide-lines sweep in, corner brackets snap to a center frame,
 * a loading % counts up, then the brand name "Lexach" reveals inside the frame
 * before the whole overlay wipes away.
 */
const IntroAnimation = ({
  storageKey = "lexach-intro-played",
  onComplete,
  duration = 2800,
}: IntroAnimationProps) => {
  const [shouldPlay, setShouldPlay] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (!storageKey) return true;
    try {
      return sessionStorage.getItem(storageKey) !== "1";
    } catch {
      return true;
    }
  });
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"scan" | "reveal" | "exit">("scan");

  useEffect(() => {
    if (!shouldPlay) return;

    // Lock body scroll while playing
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / (duration * 0.7)) * 100));
      setProgress(pct);
      if (elapsed < duration * 0.55) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    const t1 = window.setTimeout(() => setPhase("reveal"), duration * 0.55);
    const t2 = window.setTimeout(() => setPhase("exit"), duration * 0.85);
    const t3 = window.setTimeout(() => {
      setShouldPlay(false);
      document.body.style.overflow = prevOverflow;
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, "1");
        } catch {
          /* ignore */
        }
      }
      onComplete?.();
    }, duration);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      document.body.style.overflow = prevOverflow;
    };
  }, [shouldPlay, duration, onComplete, storageKey]);

  if (!shouldPlay) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-background overflow-hidden ${
        phase === "exit" ? "intro-exit" : ""
      }`}
      aria-hidden="true"
    >
      {/* Full-screen crosshair guide lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="intro-line-h absolute left-0 right-0 top-1/2 h-px bg-border" />
        <div className="intro-line-v absolute top-0 bottom-0 left-1/2 w-px bg-border" />
        <div
          className="intro-line-diag absolute top-0 left-0 w-[160%] h-px bg-border origin-top-left"
          style={{ transform: "rotate(32deg)" }}
        />
        <div
          className="intro-line-diag2 absolute bottom-0 right-0 w-[160%] h-px bg-border origin-bottom-right"
          style={{ transform: "rotate(32deg)" }}
        />
      </div>

      {/* Outer corner brackets (full viewport) */}
      <CornerBrackets className="intro-outer-brackets" size={28} inset={16} />

      {/* Center brand frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="intro-frame relative px-10 py-8 sm:px-16 sm:py-10">
            {/* Inner brackets snap onto the brand */}
            <CornerBrackets className="intro-inner-brackets" size={18} inset={-2} />

            <div className="overflow-hidden">
              <h1
                className={`text-5xl sm:text-7xl font-bold tracking-tight text-foreground intro-text ${
                  phase !== "scan" ? "intro-text-show" : ""
                }`}
              >
                Lexach
              </h1>
            </div>
          </div>

          {/* "Loading..." chip top-left of frame */}
          <div className="intro-chip absolute -top-12 -left-2 sm:-left-12 border border-border bg-background px-4 py-2 text-sm font-mono text-foreground">
            Loading...
          </div>

          {/* Percentage chip bottom-right of frame */}
          <div className="intro-chip-2 absolute -bottom-12 -right-2 sm:-right-12 border border-border bg-background px-4 py-2 text-sm font-mono text-foreground tabular-nums">
            {progress}%
          </div>
        </div>
      </div>

      <style>{`
        @keyframes intro-line-grow-h {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes intro-line-grow-v {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes intro-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes intro-bracket-in {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes intro-text-rise {
          from { transform: translateY(110%); }
          to { transform: translateY(0); }
        }
        @keyframes intro-exit-anim {
          from { clip-path: inset(0 0 0 0); opacity: 1; }
          to { clip-path: inset(50% 0 50% 0); opacity: 0; }
        }
        .intro-line-h { transform-origin: center; transform: scaleX(0); animation: intro-line-grow-h 0.55s cubic-bezier(0.7,0,0.2,1) 0.05s forwards; }
        .intro-line-v { transform-origin: center; transform: scaleY(0); animation: intro-line-grow-v 0.55s cubic-bezier(0.7,0,0.2,1) 0.15s forwards; }
        .intro-line-diag { transform-origin: top left; transform: rotate(32deg) scaleX(0); animation: intro-line-grow-h 0.7s cubic-bezier(0.7,0,0.2,1) 0.25s forwards; }
        .intro-line-diag2 { transform-origin: bottom right; transform: rotate(32deg) scaleX(0); animation: intro-line-grow-h 0.7s cubic-bezier(0.7,0,0.2,1) 0.3s forwards; }
        .intro-outer-brackets { animation: intro-bracket-in 0.4s ease-out 0s both; }
        .intro-inner-brackets { animation: intro-bracket-in 0.45s ease-out 0.6s both; }
        .intro-chip { opacity: 0; animation: intro-fade-in 0.4s ease-out 0.7s forwards; }
        .intro-chip-2 { opacity: 0; animation: intro-fade-in 0.4s ease-out 1.1s forwards; }
        .intro-text { display: inline-block; transform: translateY(110%); }
        .intro-text-show { animation: intro-text-rise 0.7s cubic-bezier(0.7,0,0.2,1) forwards; }
        .intro-exit { animation: intro-exit-anim 0.5s cubic-bezier(0.7,0,0.2,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .intro-line-h, .intro-line-v, .intro-line-diag, .intro-line-diag2,
          .intro-outer-brackets, .intro-inner-brackets, .intro-chip, .intro-chip-2,
          .intro-text-show, .intro-exit { animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
};

const CornerBrackets = ({
  className = "",
  size = 24,
  inset = 16,
}: {
  className?: string;
  size?: number;
  inset?: number;
}) => {
  const s = `${size}px`;
  const thickness = "2px";
  const color = "hsl(var(--primary))";
  const common: React.CSSProperties = { position: "absolute", width: s, height: s };
  return (
    <div className={`pointer-events-none ${className}`}>
      {/* TL */}
      <div style={{ ...common, top: inset, left: inset, borderTop: `${thickness} solid ${color}`, borderLeft: `${thickness} solid ${color}` }} />
      {/* TR */}
      <div style={{ ...common, top: inset, right: inset, borderTop: `${thickness} solid ${color}`, borderRight: `${thickness} solid ${color}` }} />
      {/* BL */}
      <div style={{ ...common, bottom: inset, left: inset, borderBottom: `${thickness} solid ${color}`, borderLeft: `${thickness} solid ${color}` }} />
      {/* BR */}
      <div style={{ ...common, bottom: inset, right: inset, borderBottom: `${thickness} solid ${color}`, borderRight: `${thickness} solid ${color}` }} />
    </div>
  );
};

export default IntroAnimation;
