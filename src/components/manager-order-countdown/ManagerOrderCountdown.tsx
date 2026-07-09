'use client';

import './ManagerOrderCountdown.css';

const MANAGER_ACCENT = '#f97316';

interface ManagerOrderCountdownProps {
  remainingMs: number;
  totalMs: number;
  visible: boolean;
}

export function ManagerOrderCountdown({
  remainingMs,
  totalMs,
  visible,
}: ManagerOrderCountdownProps) {
  if (!visible) return null;

  const progress = totalMs > 0 ? remainingMs / totalMs : 0;
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div
      className="manager-countdown"
      style={{ '--manager-accent': MANAGER_ACCENT } as React.CSSProperties}
      role="timer"
      aria-live="polite"
      aria-label={`${seconds} seconds to act on manager order`}
    >
      <div className="manager-countdown__header">
        <span className="manager-countdown__label font-pixel">ORDER TIMER</span>
        <span className="manager-countdown__time font-mono">{seconds}s</span>
      </div>
      <div className="manager-countdown__track">
        <div
          className="manager-countdown__bar"
          style={{ width: `${Math.max(0, progress * 100)}%` }}
        />
      </div>
      <p className="manager-countdown__hint font-mono">
        Execute or escalate to Compliance before time runs out.
      </p>
    </div>
  );
}
