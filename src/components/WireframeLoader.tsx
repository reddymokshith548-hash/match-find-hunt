import { useEffect, useState } from "react";

interface WireframeLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

const RED = "#E84040";

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
    // Percentage counter (starts after labels appear ~1.4s, ends at ~2.6s)
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
      {/* Full-viewport corner brackets — fade in step 1 */}
      <CornerBracket
        position="tl"
        size={28}
        className="absolute top-6 left-6 opacity-0"
        style={{ animation: "wf-fade 0.4s ease-out 0s forwards" }}
      />
      <CornerBracket
        position="tr"
        size={28}
        className="absolute top-6 right-6 opacity-0"
        style={{ animation: "wf-fade 0.4s ease-out 0s forwards" }}
      />
      <CornerBracket
        position="bl"
        size={28}
        className="absolute bottom-6 left-6 opacity-0"
        style={{ animation: "wf-fade 0.4s ease-out 0s forwards" }}
      />
      <CornerBracket
        position="br"
        size={28}
        className="absolute bottom-6 right-6 opacity-0"
        style={{ animation: "wf-fade 0.4s ease-out 0s forwards" }}
      />

      {/* Center stage: reticle + text + expanding rectangle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: 1, height: 1 }}>
          {/* Center reticle — small at first, then expands outward */}
          {/* TL */}
          <div
            className="absolute opacity-0"
            style={{
              top: 0,
              left: 0,
              transform: "translate(-50%, -50%)",
              animation:
                "wf-fade 0.35s ease-out 0.1s forwards, wf-bracket-tl 0.9s cubic-bezier(0.65,0,0.35,1) 1.0s forwards",
            }}
          >
            <CornerBracket position="tl" size={14} />
          </div>
          {/* TR */}
          <div
            className="absolute opacity-0"
            style={{
              top: 0,
              left: 0,
              transform: "translate(-50%, -50%)",
              animation:
                "wf-fade 0.35s ease-out 0.1s forwards, wf-bracket-tr 0.9s cubic-bezier(0.65,0,0.35,1) 1.0s forwards",
            }}
          >
            <CornerBracket position="tr" size={14} />
          </div>
          {/* BL */}
          <div
            className="absolute opacity-0"
            style={{
              top: 0,
              left: 0,
              transform: "translate(-50%, -50%)",
              animation:
                "wf-fade 0.35s ease-out 0.1s forwards, wf-bracket-bl 0.9s cubic-bezier(0.65,0,0.35,1) 1.0s forwards",
            }}
          >
            <CornerBracket position="bl" size={14} />
          </div>
          {/* BR */}
          <div
            className="absolute opacity-0"
            style={{
              top: 0,
              left: 0,
              transform: "translate(-50%, -50%)",
              animation:
                "wf-fade 0.35s ease-out 0.1s forwards, wf-bracket-br 0.9s cubic-bezier(0.65,0,0.35,1) 1.0s forwards",
            }}
          >
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

      {/* Connector lines + label boxes (appear ~1.4s after rectangle has expanded) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
        style={{ animation: "wf-fade 0.4s ease-out 1.4s forwards" }}
      >
        {/* Upper-left diagonal: from near center to label */}
        <line
          x1="50%" y1="50%" x2="14%" y2="14%"
          stroke="#9ca3af" strokeWidth="1"
          style={{
            strokeDasharray: 1500, strokeDashoffset: 1500,
            animation: "wf-draw 0.7s ease-out 1.5s forwards",
          }}
        />
        {/* Lower-right diagonal */}
        <line
          x1="50%" y1="50%" x2="86%" y2="86%"
          stroke="#9ca3af" strokeWidth="1"
          style={{
            strokeDasharray: 1500, strokeDashoffset: 1500,
            animation: "wf-draw 0.7s ease-out 1.5s forwards",
          }}
        />
      </svg>

      {/* Loading label (upper-left) */}
      <div
        className="absolute opacity-0 border border-neutral-400 bg-white px-3 py-1 text-[10px] font-mono tracking-[0.25em] text-neutral-700"
        style={{
          top: "10%",
          left: "10%",
          animation: "wf-fade 0.4s ease-out 1.7s forwards",
        }}
      >
        LOADING...
      </div>

      {/* Percentage label (lower-right) */}
      <div
        className="absolute opacity-0 border border-neutral-400 bg-white px-3 py-1 text-[10px] font-mono tracking-[0.25em]"
        style={{
          bottom: "10%",
          right: "10%",
          color: RED,
          animation: "wf-fade 0.4s ease-out 1.7s forwards",
        }}
      >
        {percent.toString().padStart(3, "0")}%
      </div>

      {/* Full-screen grid lines — draw outward to fill viewport */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        {/* Vertical grid lines */}
        {[20, 35, 50, 65, 80].map((x, i) => (
          <line
            key={`v-${x}`}
            x1={`${x}%`} y1="50%" x2={`${x}%`} y2="50%"
            stroke="#e5e7eb" strokeWidth="1"
            style={{
              animation: `wf-vline 1.0s cubic-bezier(0.65,0,0.35,1) ${2.0 + i * 0.05}s forwards`,
            }}
          />
        ))}
        {/* Horizontal grid lines */}
        {[20, 35, 50, 65, 80].map((y, i) => (
          <line
            key={`h-${y}`}
            x1="50%" y1={`${y}%`} x2="50%" y2={`${y}%`}
            stroke="#e5e7eb" strokeWidth="1"
            style={{
              animation: `wf-hline 1.0s cubic-bezier(0.65,0,0.35,1) ${2.0 + i * 0.05}s forwards`,
            }}
          />
        ))}
        {/* Outer frame */}
        <rect
          x="6%" y="6%" width="88%" height="88%"
          fill="none" stroke="#d1d5db" strokeWidth="1"
          style={{
            opacity: 0,
            animation: "wf-fade 0.5s ease-out 2.4s forwards",
          }}
        />
      </svg>

      <style>{`
        @keyframes wf-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wf-text-in {
          from { opacity: 0; letter-spacing: 0.15em; transform: translate(-50%, -50%) scale(0.96); }
          to { opacity: 1; letter-spacing: -0.02em; transform: translate(-50%, -50%) scale(1); }
        }
        /* Reticle expansion: from tight square (~80px wide) to medium rectangle (~360x140) */
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
        @keyframes wf-vline {
          from { y1: 50%; y2: 50%; }
          to   { y1: 0%;  y2: 100%; }
        }
        @keyframes wf-hline {
          from { x1: 50%; x2: 50%; }
          to   { x1: 0%;  x2: 100%; }
        }
        @keyframes wf-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default WireframeLoader;
