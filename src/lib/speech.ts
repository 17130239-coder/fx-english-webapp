export function speakWord(text: string, rate = 0.95) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;

  try {
    window.speechSynthesis.cancel();

    // Clean text: strip residual HTML tags, music notes, and audio effect brackets
    const clean = String(text)
      .replace(/<[^>]+>/g, ' ')
      .replace(/[♪♫#]/g, ' ')
      .replace(/\[[^\]]+\]/g, ' ')
      .replace(/\([^)]+\)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang === 'en-US' && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[FX Speech] Synthesis warning:', err);
  }
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}
}
