/** Browser TTS for NPC voice-call replies. */
export function speakNpcReply(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = 'en-US';
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
}

export function stopNpcSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
