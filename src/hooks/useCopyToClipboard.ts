// src/hooks/useCopyToClipboard.ts
import { useState, useCallback } from 'react';

interface UseCopyToClipboardReturn {
  copiedIndex: number | null;
  handleCopy: (text: string, index: number) => void;
}

/**
 * Hook for managing copy-to-clipboard functionality with visual feedback.
 * Tracks which item was copied and automatically clears after timeout.
 */
export function useCopyToClipboard(timeoutMs = 2000): UseCopyToClipboardReturn {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = useCallback(
    (text: string, index: number) => {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), timeoutMs);
    },
    [timeoutMs]
  );

  return { copiedIndex, handleCopy };
}
