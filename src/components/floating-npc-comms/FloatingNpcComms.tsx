'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NpcChatView } from '@/components/npc-chat';
import type { SidebarNpcPanelProps } from '@/components/sidebar-npc-panel';
import { getNpcTheme, type NpcPersonaId } from '@/lib/npcThemes';
import './FloatingNpcComms.css';

/** Bottom = Manager (thumb reach), then Compliance, Tech on top. */
const DOCK_ORDER: NpcPersonaId[] = ['manager', 'compliance', 'tech'];

export interface FloatingNpcCommsProps {
  npcs: SidebarNpcPanelProps[];
  onChatInputActiveChange?: (active: boolean) => void;
}

function FloatingNpcAvatar({
  npc,
  isOpen,
  shakeKey,
  onClick,
}: {
  npc: SidebarNpcPanelProps;
  isOpen: boolean;
  shakeKey: number;
  onClick: () => void;
}) {
  const theme = getNpcTheme(npc.persona);
  const unread = npc.unreadCount ?? 0;
  const hasUnread = unread > 0;
  const waiting = hasUnread || npc.isUrgent;
  const urgent = !!npc.isUrgent;

  return (
    <motion.button
      key={shakeKey}
      type="button"
      className={[
        'floating-comms__avatar',
        `floating-comms__avatar--${npc.persona}`,
        isOpen ? 'floating-comms__avatar--open' : '',
        npc.highlighted ? 'floating-comms__avatar--highlighted' : '',
        waiting ? 'floating-comms__avatar--waiting' : '',
        urgent ? 'floating-comms__avatar--urgent' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--npc-accent': theme.accent,
          '--npc-accent-soft': theme.accentSoft,
          '--npc-glow': theme.glow,
        } as React.CSSProperties
      }
      disabled={npc.disabled && !isOpen}
      aria-label={`${npc.title}${hasUnread ? `, ${unread} unread` : ''}${urgent ? ', urgent' : ''}`}
      aria-expanded={isOpen}
      onClick={onClick}
      initial={false}
      animate={
        shakeKey > 0 && hasUnread
          ? { x: [0, -4, 4, -3, 3, 0], rotate: [0, -2, 2, 0] }
          : { x: 0, rotate: 0 }
      }
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      whileTap={{ scale: 0.92 }}
    >
      <span className="floating-comms__avatar-ring" aria-hidden />
      <span className="floating-comms__avatar-initial font-pixel">{theme.initial}</span>
      {hasUnread && (
        <span className="floating-comms__badge" aria-hidden>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
      {waiting && !hasUnread && <span className="floating-comms__notify-dot" aria-hidden />}
    </motion.button>
  );
}

export function FloatingNpcComms({ npcs, onChatInputActiveChange }: FloatingNpcCommsProps) {
  const [openPersona, setOpenPersona] = useState<NpcPersonaId | null>(null);
  const [shakeKeys, setShakeKeys] = useState<Record<NpcPersonaId, number>>({
    manager: 0,
    compliance: 0,
    tech: 0,
  });
  const prevUnread = useRef<Record<NpcPersonaId, number>>({
    manager: 0,
    compliance: 0,
    tech: 0,
  });

  useEffect(() => {
    for (const npc of npcs) {
      const count = npc.unreadCount ?? 0;
      const prev = prevUnread.current[npc.persona];
      if (count > prev) {
        setShakeKeys((keys) => ({
          ...keys,
          [npc.persona]: keys[npc.persona] + 1,
        }));
      }
      prevUnread.current[npc.persona] = count;
    }
  }, [npcs]);

  const openNpc = npcs.find((n) => n.persona === openPersona);
  const openTheme = openPersona ? getNpcTheme(openPersona) : null;

  const handleAvatarClick = (npc: SidebarNpcPanelProps) => {
    if (openPersona === npc.persona) {
      setOpenPersona(null);
      return;
    }
    setOpenPersona(npc.persona);
    if ((npc.unreadCount ?? 0) > 0) {
      npc.onClearUnread?.();
    }
  };

  const npcByPersona = (persona: NpcPersonaId) =>
    npcs.find((n) => n.persona === persona);

  return (
    <div className="floating-comms" aria-label="NPC communications">
      <AnimatePresence>
        {openPersona && openNpc && openTheme && (
          <>
            <motion.button
              type="button"
              className="floating-comms__backdrop"
              aria-label="Close chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpenPersona(null)}
            />
            <motion.section
              className={[
                'floating-comms__panel',
                `floating-comms__panel--${openPersona}`,
                openNpc.isUrgent ? 'floating-comms__panel--urgent' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                {
                  '--npc-accent': openTheme.accent,
                  '--npc-accent-soft': openTheme.accentSoft,
                  '--npc-glow': openTheme.glow,
                  '--npc-border': openTheme.border,
                  '--npc-bg': openTheme.bg,
                } as React.CSSProperties
              }
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              role="dialog"
              aria-label={`Chat with ${openNpc.title}`}
            >
              <header className="floating-comms__panel-header">
                <div>
                  <div className="floating-comms__panel-title font-pixel">
                    {openNpc.title}
                  </div>
                  <div className="floating-comms__panel-sub">
                    {openNpc.npcDisplayName ?? openTheme.displayName}
                  </div>
                </div>
                {openNpc.isUrgent && (
                  <span className="floating-comms__urgent-tag font-pixel">URGENT</span>
                )}
                <button
                  type="button"
                  className="floating-comms__close"
                  aria-label="Close"
                  onClick={() => setOpenPersona(null)}
                >
                  ×
                </button>
              </header>

              <div className="floating-comms__panel-body">
                {openNpc.statusLine && (
                  <p className="floating-comms__status font-mono">{openNpc.statusLine}</p>
                )}
                {openNpc.error && (
                  <p className="floating-comms__error font-mono">{openNpc.error}</p>
                )}
                <div className="floating-comms__chat">
                  <NpcChatView
                    variant="embedded"
                    persona={openPersona}
                    messages={openNpc.messages}
                    npcName={openNpc.npcDisplayName ?? openTheme.displayName}
                    isLoading={openNpc.isLoading}
                    showFreeTextInput={
                      openNpc.showFreeTextInput !== false && !openNpc.disabled
                    }
                    onSend={openNpc.onSend}
                    onMicPress={openNpc.onMicPress}
                    onUserReply={openNpc.onUserReply}
                    onInputActiveChange={onChatInputActiveChange}
                  />
                </div>
                {openNpc.footerExtra && (
                  <div className="floating-comms__footer-extra">{openNpc.footerExtra}</div>
                )}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <div className="floating-comms__dock">
        {DOCK_ORDER.map((persona) => {
          const npc = npcByPersona(persona);
          if (!npc) return null;
          return (
            <FloatingNpcAvatar
              key={persona}
              npc={npc}
              isOpen={openPersona === persona}
              shakeKey={shakeKeys[persona]}
              onClick={() => handleAvatarClick(npc)}
            />
          );
        })}
      </div>
    </div>
  );
}
