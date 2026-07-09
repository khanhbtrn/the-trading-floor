'use client';

import { useState } from 'react';

interface PlayerLoginProps {
  onSubmit: (name: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  initialName?: string;
}

export function PlayerLogin({
  onSubmit,
  loading = false,
  error,
  initialName = '',
}: PlayerLoginProps) {
  const [name, setName] = useState(initialName);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-sm rounded border border-cyan-900/40 bg-zinc-900/80 p-6">
        <h1 className="font-pixel text-sm text-cyan-300">THE TRADING FLOOR</h1>
        <p className="mt-2 font-mono text-xs text-zinc-400">
          Enter your name to resume your career or start fresh on the desk.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = name.trim();
            if (!trimmed || loading) return;
            void onSubmit(trimmed);
          }}
        >
          <input
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-200"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          {error && (
            <p className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 font-mono text-xs text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full rounded border border-cyan-700 py-2 font-mono text-sm text-cyan-300 disabled:opacity-40"
          >
            {loading ? 'Connecting…' : 'Enter the Floor'}
          </button>
        </form>
      </div>
    </div>
  );
}
