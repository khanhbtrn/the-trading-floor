'use client';

import { motion, AnimatePresence } from 'framer-motion';
import './RankUpCelebration.css';

interface RankUpCelebrationProps {
  rank: string;
  show: boolean;
  onDone?: () => void;
}

export function RankUpCelebration({ rank, show, onDone }: RankUpCelebrationProps) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          className="rank-up-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="rank-up-card"
            initial={{ scale: 0.7, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <p className="rank-up-label font-pixel">RANK UP</p>
            <p className="rank-up-rank font-pixel">{rank}</p>
            <p className="rank-up-sub font-mono">Career milestone reached</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
