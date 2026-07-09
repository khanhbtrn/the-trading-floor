'use client';

import { motion, AnimatePresence } from 'framer-motion';
import './MarketShockBanner.css';

interface MarketShockBannerProps {
  active: boolean;
}

export function MarketShockBanner({ active }: MarketShockBannerProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="market-shock-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          role="alert"
        >
          <span className="market-shock-banner__icon" aria-hidden>
            ⚠
          </span>
          <span className="market-shock-banner__text font-pixel">MARKET SHOCK</span>
          <span className="market-shock-banner__sub font-mono">Gap down — feed accelerating</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
