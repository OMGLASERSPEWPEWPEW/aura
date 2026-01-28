// src/hooks/useElementHighlight.ts
// Track element positions dynamically via data-tutorial selectors
// Updates on resize/scroll to keep spotlight aligned

import { useState, useEffect, useCallback } from 'react';

export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseElementHighlightResult {
  rect: ElementRect | null;
  isVisible: boolean;
}

/**
 * Hook to track a DOM element's position for spotlight highlighting.
 * @param selector - CSS selector for the element to track (e.g., '[data-tutorial="nav-analyze"]')
 * @param padding - Extra padding around the element (default: 8px)
 */
export function useElementHighlight(
  selector: string | null | undefined,
  padding: number = 8
): UseElementHighlightResult {
  const [rect, setRect] = useState<ElementRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateRect = useCallback(() => {
    if (!selector) {
      setRect(null);
      setIsVisible(false);
      return;
    }

    const element = document.querySelector(selector);
    if (!element) {
      setRect(null);
      setIsVisible(false);
      return;
    }

    const domRect = element.getBoundingClientRect();

    // Check if element is visible in viewport
    const visible = domRect.width > 0 && domRect.height > 0;
    setIsVisible(visible);

    if (visible) {
      setRect({
        x: domRect.x - padding,
        y: domRect.y - padding,
        width: domRect.width + padding * 2,
        height: domRect.height + padding * 2,
      });
    } else {
      setRect(null);
    }
  }, [selector, padding]);

  useEffect(() => {
    // Initial measurement
    updateRect();

    // Set up listeners for resize and scroll
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true); // capture phase for all scrolls

    // Use ResizeObserver if available for better performance
    let resizeObserver: ResizeObserver | null = null;
    if (selector && typeof ResizeObserver !== 'undefined') {
      const element = document.querySelector(selector);
      if (element) {
        resizeObserver = new ResizeObserver(updateRect);
        resizeObserver.observe(element);
      }
    }

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [selector, updateRect]);

  return { rect, isVisible };
}
