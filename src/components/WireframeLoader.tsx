import { useEffect, useState } from "react";

interface WireframeLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

const WireframeLoader = ({ onComplete, duration = 4200 }: WireframeLoaderProps) => {
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), duration);
    const doneTimer = setTimeout(() => {
      setHidden(true);
      onComplete?.();
    }, duration + 900);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onComplete]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden transition-opacity duration-[900ms] ease-in-out ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Loading label with progress bar */}
      <div
        className="absolute top-8 left-8 opacity-0 flex flex-col gap-2"
        style={{ animation: "wf-fade-in 0.8s ease-out 1.4s forwards" }}
      >
        <div className="border border-red-600 px-3 py-1 text-[10px] font-mono text-red-600 tracking-[0.3em]">
          LOADING...
        </div>
        <div className="w-32 h-[2px] bg-neutral-200 overflow-hidden">
          <div
            className="h-full bg-red-600 origin-left"
            style={{
              transform: "scaleX(0)",
              animation: "wf-progress 2.4s cubic-bezier(0.4,0,0.2,1) 1.6s forwards",
            }}
          />
        </div>
      </div>

      {/* Blueprint lines - drawn slowly outward */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <line
          x1="50%" y1="50%" x2="50%" y2="0"
          stroke="hsl(0 0% 82%)" strokeWidth="1"
          style={{
            strokeDasharray: 2000, strokeDashoffset: 2000,
            animation: "wf-draw 1.6s cubic-bezier(0.4,0,0.2,1) 2s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="50%" y2="100%"
          stroke="hsl(0 0% 82%)" strokeWidth="1"
          style={{
            strokeDasharray: 2000, strokeDashoffset: 2000,
            animation: "wf-draw 1.6s cubic-bezier(0.4,0,0.2,1) 2s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="0" y2="50%"
          stroke="hsl(0 0% 82%)" strokeWidth="1"
          style={{
            strokeDasharray: 3000, strokeDashoffset: 3000,
            animation: "wf-draw 1.6s cubic-bezier(0.4,0,0.2,1) 2.15s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="100%" y2="50%"
          stroke="hsl(0 0% 82%)" strokeWidth="1"
          style={{
            strokeDasharray: 3000, strokeDashoffset: 3000,
            animation: "wf-draw 1.6s cubic-bezier(0.4,0,0.2,1) 2.15s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="0" y2="0"
          stroke="hsl(0 0% 90%)" strokeWidth="1"
          style={{
            strokeDasharray: 3500, strokeDashoffset: 3500,
            animation: "wf-draw 1.8s cubic-bezier(0.4,0,0.2,1) 2.4s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="100%" y2="0"
          stroke="hsl(0 0% 90%)" strokeWidth="1"
          style={{
            strokeDasharray: 3500, strokeDashoffset: 3500,
            animation: "wf-draw 1.8s cubic-bezier(0.4,0,0.2,1) 2.4s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="0" y2="100%"
          stroke="hsl(0 0% 90%)" strokeWidth="1"
          style={{
            strokeDasharray: 3500, strokeDashoffset: 3500,
            animation: "wf-draw 1.8s cubic-bezier(0.4,0,0.2,1) 2.55s forwards",
          }}
        />
        <line
          x1="50%" y1="50%" x2="100%" y2="100%"
          stroke="hsl(0 0% 90%)" strokeWidth="1"
          style={{
            strokeDasharray: 3500, strokeDashoffset: 3500,
            animation: "wf-draw 1.8s cubic-bezier(0.4,0,0.2,1) 2.55s forwards",
          }}
        />
      </svg>

      {/* Central focal point */}
      <div className="relative">
        {/* Lexach text — slow rise + fade */}
        <div
          className="font-mono font-bold text-5xl md:text-6xl tracking-tight text-black px-8 py-4 opacity-0"
          style={{
            transform: "translateY(20px)",
            animation: "wf-rise 1.4s cubic-bezier(0.22,1,0.36,1) 0.2s forwards",
          }}
        >
          Lexach
        </div>

        {/* Red corner brackets — snap in after text settles */}
        <div
          className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-red-600 opacity-0"
          style={{ animation: "wf-snap-tl 0.5s cubic-bezier(0.4,0,0.2,1) 1.5s forwards" }}
        />
        <div
          className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-red-600 opacity-0"
          style={{ animation: "wf-snap-tr 0.5s cubic-bezier(0.4,0,0.2,1) 1.5s forwards" }}
        />
        <div
          className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-red-600 opacity-0"
          style={{ animation: "wf-snap-bl 0.5s cubic-bezier(0.4,0,0.2,1) 1.7s forwards" }}
        />
        <div
          className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-red-600 opacity-0"
          style={{ animation: "wf-snap-br 0.5s cubic-bezier(0.4,0,0.2,1) 1.7s forwards" }}
        />
        <div
          className="absolute top-1/2 -left-4 w-2 h-px bg-red-600 opacity-0"
          style={{ animation: "wf-fade-in 0.5s ease-out 1.9s forwards" }}
        />
        <div
          className="absolute top-1/2 -right-4 w-2 h-px bg-red-600 opacity-0"
          style={{ animation: "wf-fade-in 0.5s ease-out 1.9s forwards" }}
        />
        <div
          className="absolute -top-4 left-1/2 w-px h-2 bg-red-600 opacity-0"
          style={{ animation: "wf-fade-in 0.5s ease-out 1.9s forwards" }}
        />
        <div
          className="absolute -bottom-4 left-1/2 w-px h-2 bg-red-600 opacity-0"
          style={{ animation: "wf-fade-in 0.5s ease-out 1.9s forwards" }}
        />
      </div>

      <style>{`
        @keyframes wf-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wf-rise {
          from { opacity: 0; transform: translateY(20px); letter-spacing: 0.1em; }
          to { opacity: 1; transform: translateY(0); letter-spacing: -0.02em; }
        }
        @keyframes wf-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes wf-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes wf-snap-tl {
          from { opacity: 0; transform: translate(10px, 10px); }
          to { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes wf-snap-tr {
          from { opacity: 0; transform: translate(-10px, 10px); }
          to { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes wf-snap-bl {
          from { opacity: 0; transform: translate(10px, -10px); }
          to { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes wf-snap-br {
          from { opacity: 0; transform: translate(-10px, -10px); }
          to { opacity: 1; transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
};

export default WireframeLoader;
