'use client';

export function PlayerBootScreen({ message = 'Loading your career…' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-700 border-t-cyan-300" />
      <p className="mt-4 font-mono text-xs text-zinc-400">{message}</p>
    </div>
  );
}
