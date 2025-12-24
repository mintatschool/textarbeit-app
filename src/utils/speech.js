import availableSyllables from './available_syllables.json';

const syllableSet = new Set(availableSyllables);
const BASE_PATH = import.meta.env.BASE_URL;

/**
 * Enhanced speak function that prioritizes local MP3 files for syllables.
 * Falls back to Web Speech API if no file is found or for non-syllable text.
 */
export const speak = (text) => {
    if (!text) return;

    // 1. Check if it's a syllable in our local MP3 list
    const normalized = text.toLowerCase().trim()
        .replace(/[.,!?;:]/g, ''); // Basic punctuation removal

    if (syllableSet.has(normalized)) {
        const audioPath = `${BASE_PATH}audio/syllables/${normalized}.mp3`.replace(/\/+/g, '/');
        const audio = new Audio(audioPath);

        audio.play().catch(err => {
            console.warn(`Local audio play failed for "${normalized}", falling back to speech synthesis`, err);
            speakSynthesis(text);
        });
        return;
    }

    // 2. Fallback to speech synthesis
    speakSynthesis(text);
};

const speakSynthesis = (text) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'de-DE';
        u.rate = 0.8;

        // Try to find a good German voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang.includes('de') && (v.name.includes('Google') || v.name.includes('Female'))
        ) || voices.find(v => v.lang.includes('de')) || null;

        u.voice = preferredVoice;
        window.speechSynthesis.speak(u);
    }
};
