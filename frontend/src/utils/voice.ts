// Voice utilities for text-to-speech
export const speak = (text: string, options?: { rate?: number; pitch?: number }) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate || 0.9;
  utterance.pitch = options?.pitch || 1;
  utterance.lang = 'en-US';

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

