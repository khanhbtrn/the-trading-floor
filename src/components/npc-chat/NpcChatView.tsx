'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NpcPersonaId } from '@/lib/npcThemes';
import { getNpcTheme } from '@/lib/npcThemes';
import { playNpcMessageSound } from '@/lib/playNpcMessageSound';
import './NpcChatView.css';

export interface ChatMessage {
  role: 'user' | 'npc';
  text: string;
}

export interface ChatChoice {
  id: string;
  label: string;
}

export interface NpcChatViewProps {
  persona?: NpcPersonaId;
  messages: ChatMessage[];
  npcName: string;
  isLoading?: boolean;
  variant?: 'standalone' | 'embedded';
  choices?: ChatChoice[];
  onChoice?: (choice: ChatChoice) => void;
  instructionPreview?: string;
  onProceed?: () => void;
  proceedLabel?: string;
  onSend?: (text: string) => void;
  onMicPress?: () => void;
  showFreeTextInput?: boolean;
  onUserReply?: () => void;
}

function displayNpcName(speaker: string): string {
  return speaker.split('(')[0].trim() || speaker;
}

export function NpcChatView({
  persona = 'manager',
  messages,
  npcName,
  isLoading = false,
  variant = 'embedded',
  choices = [],
  onChoice,
  instructionPreview,
  onProceed,
  proceedLabel = 'Proceed',
  onSend,
  onMicPress,
  showFreeTextInput = false,
  onUserReply,
}: NpcChatViewProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(messages.length);
  const theme = getNpcTheme(persona);

  const npcDisplay = displayNpcName(npcName);
  const npcInitial = (npcDisplay.trim()[0] || 'N').toUpperCase();
  const npcTag = npcDisplay.toUpperCase();
  const canSend = text.trim().length > 0 && !isLoading;

  useEffect(() => {
    const el = logRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const last = messages[messages.length - 1];
      if (last?.role === 'npc') {
        playNpcMessageSound(persona);
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, persona]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend?.(trimmed);
    onUserReply?.();
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showChoices = choices.length > 0;
  const showProceed = !!instructionPreview && !!onProceed;
  const showFooter = showChoices || showProceed || showFreeTextInput;
  const isEmbedded = variant === 'embedded';

  const bubbleLog = (
    <div className="npc-log npc-scroll" ref={logRef}>
      <AnimatePresence initial={false}>
        {messages.map((m, i) => (
          <motion.div
            key={`${i}-${m.role}-${m.text.slice(0, 20)}`}
            className={`npc-bubble-row ${m.role}`}
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          >
            <div className={`npc-bubble-col ${m.role}`}>
              <span className={`npc-pixel npc-bubble-tag ${m.role}`}>
                {m.role === 'user' ? 'YOU' : npcTag}
              </span>
              <div className={`npc-mono npc-bubble ${m.role}`}>{m.text}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          className="npc-bubble-row npc"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="npc-bubble-col npc">
            <span className="npc-pixel npc-bubble-tag npc">{npcTag}</span>
            <div className="npc-typing">
              <span className="npc-type-dot" />
              <span className="npc-type-dot" />
              <span className="npc-type-dot" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const footer = showFooter && (
    <div className="npc-footer">
      {instructionPreview && (
        <div className="npc-instruction-preview">
          <strong>Instruction issued:</strong> {instructionPreview}
        </div>
      )}

      {showProceed && (
        <button type="button" className="npc-proceed-btn" onClick={onProceed}>
          {proceedLabel}
        </button>
      )}

      {showChoices && (
        <div className="npc-choices">
          {choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className="npc-choice-btn"
              onClick={() => onChoice?.(choice)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}

      {showFreeTextInput && !showChoices && !showProceed && (
        <div className="npc-input-bar">
          {onMicPress && (
            <button
              type="button"
              title="Voice input"
              className="npc-mic-btn"
              onClick={onMicPress}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}

          <div className={`npc-input-wrap ${focused ? 'focused' : ''}`}>
            <textarea
              className="npc-textarea"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Transmit message…"
            />
          </div>

          <button
            type="button"
            title="Send"
            className={`npc-send-btn ${canSend ? 'enabled' : 'disabled'}`}
            disabled={!canSend}
            onClick={handleSend}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return (
      <div
        className={`npc-embed npc-embed--${persona}`}
        style={
          {
            '--npc-accent': theme.accent,
            '--npc-accent-soft': theme.accentSoft,
            '--npc-bubble-bg': theme.bubbleBg,
            '--npc-bubble-border': theme.bubbleBorder,
            '--npc-tag': theme.tagColor,
          } as React.CSSProperties
        }
      >
        {bubbleLog}
        {footer}
      </div>
    );
  }

  return (
    <div
      className={`npc-root standalone npc-root--${persona}`}
      style={
        {
          '--npc-accent': theme.accent,
          '--npc-accent-soft': theme.accentSoft,
          '--npc-bubble-bg': theme.bubbleBg,
          '--npc-bubble-border': theme.bubbleBorder,
          '--npc-tag': theme.tagColor,
          '--npc-glow': theme.glow,
        } as React.CSSProperties
      }
    >
      <div className="npc-scanlines" />
      <div className="npc-scan-beam">
        <div />
      </div>

      <div className="npc-panel">
        <div className="npc-corner" style={{ top: -1, left: -1, borderTop: '2px solid', borderLeft: '2px solid' }} />
        <div className="npc-corner" style={{ top: -1, right: -1, borderTop: '2px solid', borderRight: '2px solid' }} />
        <div className="npc-corner" style={{ bottom: -1, left: -1, borderBottom: '2px solid', borderLeft: '2px solid' }} />
        <div className="npc-corner" style={{ bottom: -1, right: -1, borderBottom: '2px solid', borderRight: '2px solid' }} />

        <div className="npc-header">
          <div className="npc-header-left">
            <div className="npc-avatar">
              <span className="npc-pixel npc-avatar-initial">{npcInitial}</span>
              <div className="npc-online-dot" />
            </div>
            <div>
              <div className="npc-pixel npc-name">{npcDisplay}</div>
              <div className="npc-mono npc-status">
                {isLoading ? '// TRANSMITTING' : '// ONLINE'}
              </div>
            </div>
          </div>
          <div className="npc-pixel npc-link-label">NPC//LINK</div>
        </div>

        {bubbleLog}
        {footer}
      </div>
    </div>
  );
}
