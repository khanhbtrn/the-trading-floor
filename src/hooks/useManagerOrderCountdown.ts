'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ORDER_COUNTDOWN_SEC } from '@/lib/gameReducer';

const ORDER_COUNTDOWN_MS = ORDER_COUNTDOWN_SEC * 1000;
const TICK_MS = 100;

export function useManagerOrderCountdown({
  active,
  paused,
  instructionKey,
  onExpire,
}: {
  active: boolean;
  paused: boolean;
  instructionKey: string | null;
  onExpire: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(ORDER_COUNTDOWN_MS);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const reset = useCallback(() => {
    setRemainingMs(ORDER_COUNTDOWN_MS);
    expiredRef.current = false;
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
