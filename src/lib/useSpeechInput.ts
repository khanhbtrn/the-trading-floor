'use client';

import { useCallback, useMemo } from 'react';

type OnTranscript = (text: string) => void;

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
};

export function useSpeechInput(onTranscript: OnTranscript) {
  const ctor = useMemo<SpeechRecognitionCtor | null>(() => {
    if (typeof window === 'undefined') return null;
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }, []);

  const startListening = useCallback(() => {
    if (!ctor) return;
    const recognition = new ctor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim();
      if (text) onTranscript(text);
    };
    recognition.start();
  }, [ctor, onTranscript]);

  return {
    speechSupported: !!ctor,
    startListening,
  };
}
