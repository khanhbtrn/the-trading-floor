'use client';

import { useCallback, useMemo, useState } from 'react';

type OnTranscript = (text: string) => void;

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
};

export function useSpeechInput(onTranscript: OnTranscript) {
  const [listening, setListening] = useState(false);

  const ctor = useMemo<SpeechRecognitionCtor | null>(() => {
    if (typeof window === 'undefined') return null;
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }, []);

  const startListening = useCallback(() => {
    if (!ctor || listening) return;
    const recognition = new ctor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim();
      if (text) onTranscript(text);
    };
    recognition.start();
  }, [ctor, listening, onTranscript]);

  return {
    speechSupported: !!ctor,
    startListening,
    listening,
  };
}
