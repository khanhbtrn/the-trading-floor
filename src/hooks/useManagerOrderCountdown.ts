'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ORDER_COUNTDOWN_SEC } from '@/lib/gameReducer';

const ORDER_COUNTDOWN_MS = ORDER_COUNTDOWN_SEC * 1000;
const TICK_MS = 100;
/** Remaining ms thresholds for impatient nudges (max 2 per countdown). */
const NUDGE_THRESHOLDS_MS = [7500, 3750];

export function useManagerOrderCountdown({
  active,
  paused,
  instructionKey,
  onExpire,
  onNudge,
}: {
  active: boolean;
  paused: boolean;
  instructionKey: string | null;
  onExpire: () => void;
  onNudge?: (index: number) => void;
}) {
  const [remainingMs, setRemainingMs] = useState(ORDER_COUNTDOWN_MS);
  const expiredRef = useRef(false);
  const nudgesFiredRef = useRef(0);
  const onExpireRef = useRef(onExpire);
  const onNudgeRef = useRef(onNudge);
  onExpireRef.current = onExpire;
  onNudgeRef.current = onNudge;

  const reset = useCallback(() => {
    setRemainingMs(ORDER_COUNTDOWN_MS);
    expiredRef.current = false;
    nudgesFiredRef.current = 0;
  }, []);

  useEffect(() => {
    if (active && instructionKey) {
      reset();
    }
  }, [active, instructionKey, reset]);

  useEffect(() => {
    if (!active || paused) return;

    const id = window.setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - TICK_MS;

        if (
          onNudgeRef.current &&
          nudgesFiredRef.current < NUDGE_THRESHOLDS_MS.length
        ) {
          const threshold = NUDGE_THRESHOLDS_MS[nudgesFiredRef.current];
          if (prev > threshold && next <= threshold) {
            onNudgeRef.current(nudgesFiredRef.current);
            nudgesFiredRef.current += 1;
          }
        }

        if (next <= 0) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return next;
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [active, paused, instructionKey]);

  return {
    remainingMs,
    totalMs: ORDER_COUNTDOWN_MS,
    reset,
    clear: () => {
      expiredRef.current = true;
    },
  };
}
