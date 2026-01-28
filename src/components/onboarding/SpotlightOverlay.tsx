// src/components/onboarding/SpotlightOverlay.tsx
// SVG-based overlay with cutout for highlighted element and animated pulse ring

import { motion } from 'framer-motion';
import { useElementHighlight, type ElementRect } from '../../hooks/useElementHighlight';

interface SpotlightOverlayProps {
  highlightSelector?: string | null;
  onClick?: () => void;
}

export default function SpotlightOverlay({ highlightSelector, onClick }: SpotlightOverlayProps) {
  const { rect, isVisible } = useElementHighlight(highlightSelector);

  // If no selector or element not found, show plain dark backdrop
  if (!highlightSelector || !rect || !isVisible) {
    return (
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClick}
      />
    );
  }

  return (
    <div className="absolute inset-0" onClick={onClick}>
      {/* SVG with mask to create spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Mask: white = visible, black = hidden */}
          <mask id="spotlight-mask">
            {/* White background (shows dark overlay everywhere) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rounded rect (cuts hole in overlay) */}
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx="12"
              ry="12"
              fill="black"
            />
          </mask>
        </defs>

        {/* Dark overlay with mask applied */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Animated pulse ring around highlighted area */}
      <PulseRing rect={rect} />
    </div>
  );
}

interface PulseRingProps {
  rect: ElementRect;
}

function PulseRing({ rect }: PulseRingProps) {
  return (
    <>
      {/* Inner glow border */}
      <motion.div
        className="absolute pointer-events-none rounded-xl border-2 border-violet-400"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(139, 92, 246, 0.4)',
            '0 0 0 8px rgba(139, 92, 246, 0)',
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />

      {/* Outer expanding pulse */}
      <motion.div
        className="absolute pointer-events-none rounded-xl border-2 border-violet-500/50"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }}
        animate={{
          scale: [1, 1.08],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    </>
  );
}
