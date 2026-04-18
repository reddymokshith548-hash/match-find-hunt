import { useEffect, useState } from "react";

interface WireframeLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

const WireframeLoader = ({ onComplete, duration = 2000 }: WireframeLoaderProps) => {
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), duration);
    const doneTimer = setTimeout(() => {
      setHidden(true);
      onComplete?.();
    }, duration + 500);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onComplete]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Loading label */}
      <div
        className="absolute top-6 left-6 border border-red-600 px-3 py-1 text-xs font-mono text-red-600 tracking-widest opacity-0"
        style={{ animation: "wf-fade-in 0.4s ease-out 0.6s forwards" }}
      >
        LOADING...
      </div>

      {/* Blueprint lines - drawn from center outward */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        {/* Top line */}
        <line
          x1="50%" y1="50%" x2="50%" y2="0"
          stroke="hsl(0 0% 80%)" strokeWidth="1"
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: 1000,
            animation: "wf-draw 0.7s ease-out 0.7s forwards",
          }}
        />
        {/* Bottom line */}
        <line
          x1="50%" y1="50%" x2="50%" y2="100%"
          stroke="hsl(0 0% 80%)" strokeWidth="1"
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: 1000,
            animation: "wf-draw 0.7s ease-out 0.7s forwards",
          }}
        />
        {/* Left line */}
        <line
          x1="50%" y1="50%" x2="0" y2="50%"
          stroke="hsl(0 0% 80%)" strokeWidth="1"
          style={{
            strokeDasharray: 2000,
            strokeDashoffset: 2000,
            animation: "wf-draw 0.7s ease-out 0.8s forwards",
          }}
        />
        {/* Right line */}
        <line
          x1="50%" y1="50%" x2="100%" y2="50%"
          stroke="hsl(0 0% 80%)" strokeWidth="1"
          style={{
            strokeDasharray: 2000,
            strokeDashoffset: 2000,
            animation: "wf-draw 0.7s ease-out 0.8s forwards",
          }}
        />
        {/* Diagonal lines to corners */}
        <line
          x1="50%" y1="50%" x2="0" y2="0"
          stroke="hsl(0 0% 88%)" strokeWidth="1"
          style={{
            strokeDasharray: 2500,
            strokeDashoffset: 2500,
            animation: "wf-draw 0.8s ease-out 1s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="100%" y2="0"
          stroke="hsl(0 0% 88%)" strokeWidth="1"
          style={{
            strokeDasharray: 2500,
            strokeDashoffset: 2500,
            animation: "wf-draw 0.8s ease-out 1s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="0" y2="100%"
          stroke="hsl(0 0% 88%)" strokeWidth="1"
          style={{
            strokeDasharray: 2500,
            strokeDashoffset: 2500,
            animation: "wf-draw 0.8s ease-out 1.05s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="100%" y2="100%"
          stroke="hsl(0 0% 88%)" strokeWidth="1"
          style={{
            strokeDasharray: 2500,
            strokeDashoffset: 2500,
            animation: "wf-draw 0.8s ease-out 1.05s forwards",
          }}
        />
      </svg>

      {/* Central focal point */}
      <div className="relative">
        {/* Lexach text */}
        <div
          className="font-mono font-bold text-5xl md:text-6xl tracking-tight text-black px-8 py-4 opacity-0"
          style={{ animation: "wf-fade-in 0.4s ease-out forwards" }}
        >
          Lexach
        </div>

        {/* Red corner brackets */}
        {/* Top-left */}
        <div
          className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-red-600 opacity-0"
          style={{ animation: "wf-snap-tl 0.3s cubic-bezier(0.4,0,0.2,1) 0.35s forwards" }}
        />
        {/* Top-right */}
        <div
          className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-red-600 opacity-0"
          style={{ animation: "wf-snap-tr 0.3s cubic-bezier(0.4,0,0.2,1) 0.35s forwards" }}
        />
        {/* Bottom-left */}
        <div
          className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-red-600 opacity-0"
          style={{ animation: "wf-snap-bl 0.3s cubic-bezier(0.4,0,0.2,1) 0.45s forwards" }}
        />
        {/* Bottom-right */}
        <div
          className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-red-600 opacity-0"
          style={{ animation: "wf-snap-br 0.3s cubic-bezier(0.4,0,0.2,1) 0.45s forwards" }}
        />
        {/* Anchor lines (small ticks at midpoints) */}
        <div
          className="absolute top-1/2 -left-4 w-2 h-px bg-red-600 opacity-0"
          style={{ animation: "wf-fade-in 0.3s ease-out 0.55s forwards" }}
        />
        <div
          className="absolute top-1/2 -right-4 w-2 h-px bg-red-600 opacity-0"
          style={{ animation: "wf-fade-in 0.3s ease-out 0.55s forwards" }}
        />
        <div
          className="absolute -top-4 left-1/2 w-px h-2 bg-red-600 opacity-0"
          style={{ animation: "wf-fade-in 0.3s ease-out 0.55s forwards" }}
        />
        <div
          className="absolute -bottom-4 left-1/2 w-px h-2 bg-red-600 opacity-0"
          style={{ animation: "wf-fade-in 0.3s ease-out 0.55s forwards" }}
        />
      </div>

      <style>{`
        @keyframes wf-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wf-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes wf-snap-tl {
          from { opacity: 0; transform: translate(8px, 8px); }
          to { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes wf-snap-tr {
          from { opacity: 0; transform: translate(-8px, 8px); }
          to { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes wf-snap-bl {
          from { opacity: 0; transform: translate(8px, -8px); }
          to { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes wf-snap-br {
          from { opacity: 0; transform: translate(-8px, -8px); }
          to { opacity: 1; transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
};

export default WireframeLoader;
