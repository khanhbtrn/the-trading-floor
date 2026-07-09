'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { NpcChatView, type ChatMessage } from '@/components/npc-chat';
import type { NpcPersonaId } from '@/lib/npcThemes';
import { getNpcTheme } from '@/lib/npcThemes';
import './SidebarNpcPanel.css';

export interface SidebarNpcPanelProps {
  persona: NpcPersonaId;
  title: string;
  npcDisplayName?: string;
  messages: ChatMessage[];
  isLoading?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  unreadCount?: number;
  isUrgent?: boolean;
  statusLine?: string;
  error?: string | null;
  showFreeTextInput?: boolean;
  onSend?: (text: string) => void;
  onMicPress?: () => void;
  showCallButton?: boolean;
  onCallPress?: () => void;
  callListening?: boolean;
  callLabel?: string;
  onClearUnread?: () => void;
  onUserReply?: () => void;
  onInputActiveChange?: (active: boolean) => void;
  footerExtra?: ReactNode;
}

export function SidebarNpcPanel({
  persona,
  title,
  npcDisplayName,
  messages,
  isLoading = false,
  disabled = false,
  highlighted = false,
  unreadCount = 0,
  isUrgent = false,
  statusLine,
  error,
  showFreeTextInput = true,
  onSend,
  onMicPress,
  showCallButton,
  onCallPress,
  callListening,
  callLabel,
  onClearUnread,
  onUserReply,
  onInputActiveChange,
  footerExtra,
}: SidebarNpcPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const prevUnread = useRef(unreadCount);
  const theme = getNpcTheme(persona);
  const hasUnread = unreadCount > 0;
  const displayName = npcDisplayName ?? theme.displayName;

  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setShakeKey((k) => k + 1);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      if (!next && hasUnread) {
        onClearUnread?.();
      }
      return next;
    });
  };

  return (
    <motion.section
      key={shakeKey}
      className={[
        'sidebar-npc',
        `sidebar-npc--${persona}`,
        highlighted ? 'sidebar-npc--highlighted' : '',
        disabled ? 'sidebar-npc--disabled' : '',
        isUrgent ? 'sidebar-npc--urgent' : '',
        hasUnread ? 'sidebar-npc--unread' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--npc-accent': theme.accent,
          '--npc-accent-soft': theme.accentSoft,
          '--npc-glow': theme.glow,
          '--npc-border': theme.border,
          '--npc-bg': theme.bg,
        } as React.CSSProperties
      }
      initial={false}
      animate={
        hasUnread
          ? { x: [0, -3, 3, -2, 2, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      <button
        type="button"
        className="sidebar-npc__header"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
      >
        <span className="sidebar-npc__dot" aria-hidden />
        <span className="sidebar-npc__title font-pixel">{title}</span>
        {isUrgent && (
          <span className="sidebar-npc__urgent font-pixel">URGENT</span>
        )}
        <span className="sidebar-npc__meta">
          {hasUnread && (
            <span className="sidebar-npc__badge" aria-label={`${unreadCount} unread`}>
              <span className="sidebar-npc__badge-pulse" aria-hidden />
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sidebar-npc__chevron">{collapsed ? '▼' : '▲'}</span>
        </span>
      </button>

      {!collapsed && (
        <div className="sidebar-npc__body">
          {statusLine && (
            <p className="sidebar-npc__status font-mono">{statusLine}</p>
          )}
          {error && (
            <p className="sidebar-npc__error font-mono">{error}</p>
          )}
          <div className="sidebar-npc__chat">
            <NpcChatView
              variant="embedded"
              persona={persona}
              messages={messages}
              npcName={displayName}
              isLoading={isLoading}
              showFreeTextInput={showFreeTextInput && !disabled}
              onSend={onSend}
              onMicPress={onMicPress}
              showCallButton={showCallButton}
              onCallPress={onCallPress}
              callListening={callListening}
              callLabel={callLabel}
              onUserReply={onUserReply}
              onInputActiveChange={onInputActiveChange}
            />
          </div>
          {footerExtra}
        </div>
      )}
    </motion.section>
  );
}
