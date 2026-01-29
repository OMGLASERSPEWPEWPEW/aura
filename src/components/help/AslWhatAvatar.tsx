// src/components/help/AslWhatAvatar.tsx
// Frame-by-frame ASL fingerspelling "W-H-A-T" avatar
// Default: Blair Witch chaos (fast random jitter)
// Press-and-hold: slow mode (1 letter/sec, clean display)

import { useState, useEffect, useRef, useCallback } from 'react';

const FRAMES = ['/asl-w.png', '/asl-h.png', '/asl-a.png', '/asl-t.png'] as const;

export function AslWhatAvatar() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [jitter, setJitter] = useState({ rotate: 0, x: 0, y: 0 });

  // Preload all frames on mount
  useEffect(() => {
    FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Frame cycling — recursive setTimeout for variable timing
  useEffect(() => {
    timerRef.current = setTimeout(
      () => {
        setCurrentFrame((prev) => (prev + 1) % FRAMES.length);

        if (!holdingRef.current) {
          setJitter({
            rotate: Math.random() * 6 - 3,
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
          });
        } else {
          setJitter({ rotate: 0, x: 0, y: 0 });
        }
      },
      holdingRef.current ? 1000 : Math.random() * 120 + 80,
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentFrame, isHolding]);

  const handlePointerDown = useCallback(() => {
    setIsHolding(true);
    holdingRef.current = true;
    setJitter({ rotate: 0, x: 0, y: 0 });
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsHolding(false);
    holdingRef.current = false;
  }, []);

  const transform = `rotate(${jitter.rotate}deg) translate(${jitter.x}px, ${jitter.y}px)`;

  return (
    <div
      data-testid="asl-what-avatar"
      role="img"
      aria-label="ASL fingerspelling: W-H-A-T"
      className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 flex-shrink-0 cursor-pointer select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <img
        src={FRAMES[currentFrame]}
        alt=""
        className="w-full h-full object-cover"
        style={{ transform }}
        draggable={false}
      />
      <span className="sr-only">Press and hold to slow down</span>
    </div>
  );
}
