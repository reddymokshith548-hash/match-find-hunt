import { useEffect, useState } from "react";

interface WireframeLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

const RED = "#E84040";

// Reticle final size (matches wf-bracket-* keyframes end state)
// Brackets end at top:±70px, left:±200px from center → reticle = 400w × 140h
const RETICLE_HALF_W = 200;
const RETICLE_HALF_H = 70;

const CornerBracket = ({
  position,
  size = 16,
  thickness = 2,
  className = "",
  style,
}: {
  position: "tl" | "tr" | "bl" | "br";
  size?: number;
  thickness?: number;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const borders: Record<string, React.CSSProperties> = {
    tl: { borderTop: `${thickness}px solid ${RED}`, borderLeft: `${thickness}px solid ${RED}` },
    tr: { borderTop: `${thickness}px solid ${RED}`, borderRight: `${thickness}px solid ${RED}` },
    bl: { borderBottom: `${thickness}px solid ${RED}`, borderLeft: `${thickness}px solid ${RED}` },
    br: { borderBottom: `${thickness}px solid ${RED}`, borderRight: `${thickness}px solid ${RED}` },
  };
  return (
    <div
      className={className}
      style={{ width: size, height: size, ...borders[position], ...style }}
    />
  );
};

const WireframeLoader = ({ onComplete, duration = 3000 }: WireframeLoaderProps) => {
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const counterStart = 1400;
    const counterDuration = 1200;
    let raf = 0;
    const tickStart = performance.now();
    const tick = (now: number) => {
      const elapsed = now - tickStart;
      if (elapsed < counterStart) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, (elapsed - counterStart) / counterDuration);
      setPercent(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const exitTimer = setTimeout(() => setExiting(true), duration);
    const doneTimer = setTimeout(() => {
      setHidden(true);
      onComplete?.();
    }, duration + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onComplete]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white overflow-hidden transition-opacity duration-[600ms] ease-out ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Full-viewport corner brackets */}
      <CornerBracket position="tl" size={28} className="absolute top-6 left-6 opacity-0" style={{ animation: "wf-fade 0.4s ease-out 0s forwards" }} />
      <CornerBracket position="tr" size={28} className="absolute top-6 right-6 opacity-0" style={{ animation: "wf-fade 0.4s ease-out 0s forwards" }} />
      <CornerBracket position="bl" size={28} className="absolute bottom-6 left-6 opacity-0" style={{ animation: "wf-fade 0.4s ease-out 0s forwards" }} />
      <CornerBracket position="br" size={28} className="absolute bottom-6 right-6 opacity-0" style={{ animation: "wf-fade 0.4s ease-out 0s forwards" }} />

      {/* Center stage: reticle + text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: 1, height: 1 }}>
          {/* Reticle TL */}
          <div className="absolute opacity-0" style={{ top: 0, left: 0, transform: "translate(-50%, -50%)", animation: "wf-fade 0.35s ease-out 0.1s forwards, wf-bracket-tl 0.9s cubic-bezier(0.65,0,0.35,1) 1.0s forwards" }}>
            <CornerBracket position="tl" size={14} />
          </div>
          {/* Reticle TR */}
          <div className="absolute opacity-0" style={{ top: 0, left: 0, transform: "translate(-50%, -50%)", animation: "wf-fade 0.35s ease-out 0.1s forwards, wf-bracket-tr 0.9s cubic-bezier(0.65,0,0.35,1) 1.0s forwards" }}>
            <CornerBracket position="tr" size={14} />
          </div>
          {/* Reticle BL */}
          <div className="absolute opacity-0" style={{ top: 0, left: 0, transform: "translate(-50%, -50%)", animation: "wf-fade 0.35s ease-out 0.1s forwards, wf-bracket-bl 0.9s cubic-bezier(0.65,0,0.35,1) 1.0s forwards" }}>
            <CornerBracket position="bl" size={14} />
          </div>
          {/* Reticle BR */}
          <div className="absolute opacity-0" style={{ top: 0, left: 0, transform: "translate(-50%, -50%)", animation: "wf-fade 0.35s ease-out 0.1s forwards, wf-bracket-br 0.9s cubic-bezier(0.65,0,0.35,1) 1.0s forwards" }}>
            <CornerBracket position="br" size={14} />
          </div>

          {/* Center text */}
          <div
            className="absolute opacity-0 whitespace-nowrap font-sans font-bold text-neutral-900 text-5xl md:text-6xl tracking-tight"
            style={{
              top: 0,
              left: 0,
              transform: "translate(-50%, -50%)",
              fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
              animation: "wf-text-in 0.6s cubic-bezier(0.22,1,0.36,1) 0.5s forwards",
            }}
          >
            Lexach
          </div>
        </div>
      </div>

      {/* Diagonal connector lines — split so they stop at reticle box edges */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
        style={{ animation: "wf-fade 0.4s ease-out 1.4s forwards" }}
      >
        {/* Upper-left diagonal: from label area to top-left corner of reticle */}
        <line
          x1="14%" y1="14%"
          x2={`calc(50% - ${RETICLE_HALF_W}px)`}
          y2={`calc(50% - ${RETICLE_HALF_H}px)`}
          stroke="#9ca3af" strokeWidth="1"
          style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "wf-draw 0.8s ease-out 1.5s forwards" }}
        />
        {/* Lower-right diagonal: from bottom-right corner of reticle to percentage label */}
        <line
          x1={`calc(50% + ${RETICLE_HALF_W}px)`}
          y1={`calc(50% + ${RETICLE_HALF_H}px)`}
          x2="86%" y2="86%"
          stroke="#9ca3af" strokeWidth="1"
          style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "wf-draw 0.8s ease-out 1.5s forwards" }}
        />

        {/* Cross grid lines — extend from reticle edges to screen edges */}
        {/* Vertical UP: from top-center of reticle up to y=0 */}
        <line
          x1="50%" y1={`calc(50% - ${RETICLE_HALF_H}px)`}
          x2="50%" y2="0%"
          stroke="#d1d5db" strokeWidth="1"
          style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "wf-draw 0.7s cubic-bezier(0.65,0,0.35,1) 1.7s forwards" }}
        />
        {/* Vertical DOWN: from bottom-center of reticle down to y=100% */}
        <line
          x1="50%" y1={`calc(50% + ${RETICLE_HALF_H}px)`}
          x2="50%" y2="100%"
          stroke="#d1d5db" strokeWidth="1"
          style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "wf-draw 0.7s cubic-bezier(0.65,0,0.35,1) 1.7s forwards" }}
        />
        {/* Horizontal LEFT: from left-center of reticle to x=0 */}
        <line
          x1={`calc(50% - ${RETICLE_HALF_W}px)`} y1="50%"
          x2="0%" y2="50%"
          stroke="#d1d5db" strokeWidth="1"
          style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "wf-draw 0.7s cubic-bezier(0.65,0,0.35,1) 1.7s forwards" }}
        />
        {/* Horizontal RIGHT: from right-center of reticle to x=100% */}
        <line
          x1={`calc(50% + ${RETICLE_HALF_W}px)`} y1="50%"
          x2="100%" y2="50%"
          stroke="#d1d5db" strokeWidth="1"
          style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "wf-draw 0.7s cubic-bezier(0.65,0,0.35,1) 1.7s forwards" }}
        />

        {/* Outer frame */}
        <rect
          x="6%" y="6%" width="88%" height="88%"
          fill="none" stroke="#d1d5db" strokeWidth="1"
          style={{ opacity: 0, animation: "wf-fade 0.5s ease-out 2.4s forwards" }}
        />
      </svg>

      {/* Loading label (upper-left) */}
      <div
        className="absolute opacity-0 border border-neutral-400 bg-white px-3 py-1 text-[10px] font-mono tracking-[0.25em] text-neutral-700"
        style={{ top: "10%", left: "10%", animation: "wf-fade 0.4s ease-out 1.7s forwards" }}
      >
        LOADING...
      </div>

      {/* Percentage label (lower-right) */}
      <div
        className="absolute opacity-0 border border-neutral-400 bg-white px-3 py-1 text-[10px] font-mono tracking-[0.25em]"
        style={{ bottom: "10%", right: "10%", color: RED, animation: "wf-fade 0.4s ease-out 1.7s forwards" }}
      >
        {percent.toString().padStart(3, "0")}%
      </div>

      <style>{`
        @keyframes wf-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wf-text-in {
          from { opacity: 0; letter-spacing: 0.15em; transform: translate(-50%, -50%) scale(0.96); }
          to { opacity: 1; letter-spacing: -0.02em; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes wf-bracket-tl {
          from { top: -40px; left: -120px; opacity: 1; }
          to   { top: -70px; left: -200px; opacity: 1; }
        }
        @keyframes wf-bracket-tr {
          from { top: -40px; left: 120px; opacity: 1; }
          to   { top: -70px; left: 200px; opacity: 1; }
        }
        @keyframes wf-bracket-bl {
          from { top: 40px; left: -120px; opacity: 1; }
          to   { top: 70px; left: -200px; opacity: 1; }
        }
        @keyframes wf-bracket-br {
          from { top: 40px; left: 120px; opacity: 1; }
          to   { top: 70px; left: 200px; opacity: 1; }
        }
        @keyframes wf-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default WireframeLoader;
