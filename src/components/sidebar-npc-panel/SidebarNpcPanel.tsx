'use client';

import { useState, type ReactNode } from 'react';
import { NpcChatView, type ChatMessage } from '@/components/npc-chat';

export interface SidebarNpcPanelProps {
  title: string;
  messages: ChatMessage[];
  isLoading?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  badge?: boolean;
  statusLine?: string;
  error?: string | null;
  showFreeTextInput?: boolean;
  onSend?: (text: string) => void;
  onMicPress?: () => void;
  footerExtra?: ReactNode;
}

export function SidebarNpcPanel({
  title,
  messages,
  isLoading = false,
  disabled = false,
  highlighted = false,
  badge = false,
  statusLine,
  error,
  showFreeTextInput = true,
  onSend,
  onMicPress,
  footerExtra,
}: SidebarNpcPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`rounded border ${
        highlighted
          ? 'border-amber-400/70 bg-amber-950/20'
          : disabled
            ? 'border-zinc-800 bg-zinc-950/60 opacity-60'
            : 'border-cyan-900/40 bg-zinc-950/40'
      }`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-2 py-2 text-left"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="font-pixel text-[8px] text-cyan-300">{title}</span>
        <span className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
          {badge && (
            <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] text-black">
              !
            </span>
          )}
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      {!collapsed && (
        <div className="sidebar-npc-body max-h-[min(280px,38vh)] overflow-hidden px-1 pb-1 sm:max-h-[280px]">
          {statusLine && (
            <p className="mb-2 px-2 font-mono text-[10px] text-zinc-400">{statusLine}</p>
          )}
          {error && (
            <p className="mb-2 px-2 font-mono text-[10px] text-red-400">{error}</p>
          )}
          <div className="max-h-[min(200px,30vh)] overflow-y-auto sm:max-h-[240px]">
            <NpcChatView
              variant="embedded"
              messages={messages}
              npcName={title}
              isLoading={isLoading}
              showFreeTextInput={showFreeTextInput && !disabled}
              onSend={onSend}
              onMicPress={onMicPress}
            />
          </div>
          {footerExtra}
        </div>
      )}
    </div>
  );
}
