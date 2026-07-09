'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <motion.main
      className="mx-auto min-h-screen max-w-3xl px-6 py-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="mb-8 border-b border-cyan-900/40 pb-6">
        <h1 className="font-pixel text-sm tracking-wide text-cyan-300">{title}</h1>
        {subtitle && (
          <p className="mt-2 font-mono text-sm text-zinc-400">{subtitle}</p>
        )}
      </header>
      {children}
    </motion.main>
  );
}
