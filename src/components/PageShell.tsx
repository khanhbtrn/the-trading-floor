'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <motion.main
      className="min-h-screen"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.main>
  );
}
