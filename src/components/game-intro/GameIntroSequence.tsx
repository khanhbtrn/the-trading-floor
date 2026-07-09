'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import './GameIntroSequence.css';

const MANAGER_NAME = 'Big Buck Bro';

const SLIDE = {
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -36 },
};

interface IntroStep {
  id: string;
  kind: 'card' | 'cta';
  title?: string;
  subtitle?: string;
  body?: string;
  emphasis?: string;
}

const STEPS: IntroStep[] = [
  {
    id: 'title',
    kind: 'card',
    title: 'THE TRADING FLOOR',
    subtitle: 'New York, September 2008.',
  },
  {
    id: 'backstory',
    kind: 'card',
    body:
      'Your first day as a junior trader. The phones are loud, the screens are red, and the senior guys won’t meet your eyes. ' +
      'Something is breaking in the market. Nobody will say what.',
  },
  {
    id: 'manager',
    kind: 'card',
    title: 'Your Manager',
    emphasis: MANAGER_NAME,
    body:
      'He runs the desk like a scoreboard. He will size your trades, push your conviction, and expect you to keep up when the tape turns ugly.',
  },
  {
    id: 'job',
    kind: 'card',
    title: 'Your Job',
    body:
      'Take the instruction. Execute when you can. When risk blocks a reckless ticket, how you respond — obey, escalate, or fight it — writes your career. Expect a violent gap-down early in the tape.',
  },
  {
    id: 'clock-in',
    kind: 'cta',
    title: 'The bell rings.',
    subtitle: 'The desk is waiting.',
  },
];

interface GameIntroSequenceProps {
  playerName: string;
  onComplete: () => void;
  onSkip: () => void;
  completing?: boolean;
}

export function GameIntroSequence({
  playerName,
  onComplete,
  onSkip,
  completing = false,
}: GameIntroSequenceProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = stepIndex >= STEPS.length - 1;

  const advance = () => {
    if (isLast) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  return (
    <div className="intro-root">
      <button
        type="button"
        className="intro-skip"
        onClick={onSkip}
        disabled={completing}
      >
        Skip intro
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="intro-card"
          variants={SLIDE}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onClick={step.kind === 'card' ? advance : undefined}
          role={step.kind === 'card' ? 'button' : undefined}
          tabIndex={step.kind === 'card' ? 0 : undefined}
          onKeyDown={(e) => {
            if (step.kind === 'card' && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              advance();
            }
          }}
        >
          {step.title && (
            <h1 className="intro-title font-pixel">{step.title}</h1>
          )}
          {step.subtitle && (
            <p className="intro-subtitle font-mono">{step.subtitle}</p>
          )}
          {step.emphasis && (
            <p className="intro-emphasis font-pixel">{step.emphasis}</p>
          )}
          {step.body && <p className="intro-body font-mono">{step.body}</p>}

          {step.kind === 'card' && (
            <p className="intro-hint font-mono">Tap to continue</p>
          )}

          {step.kind === 'cta' && (
            <div className="intro-cta-wrap">
              <p className="intro-welcome font-mono">
                Clock in, <span className="text-cyan-300">{playerName}</span>.
              </p>
              <button
                type="button"
                className="intro-clock-in font-pixel"
                disabled={completing}
                onClick={onComplete}
              >
                {completing ? 'Clocking in…' : 'Clock in'}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="intro-dots" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s.id} className={i === stepIndex ? 'active' : ''} />
        ))}
      </div>
    </div>
  );
}
