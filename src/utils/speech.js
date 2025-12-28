import availableSyllables from './available_syllables.json';

const rawSyllables = (availableSyllables && Array.isArray(availableSyllables) ? availableSyllables : (availableSyllables?.default || []));
const syllableSet = new Set(Array.isArray(rawSyllables) ? rawSyllables.map(s => s.toLowerCase().trim()) : []);

const BASE_PATH = import.meta.env.BASE_URL;

export const getAudioListSize = () => syllableSet.size;

/**
 * Checks if a syllable has a local MP3 file available.
 */
export const hasAudio = (text) => {
    if (!text || typeof text !== 'string') return false;
    // Replace soft hyphens and other non-alphabetical characters
    const normalized = text.toLowerCase().trim()
        .replace(/\u00AD/g, '') // Remove soft hyphens
        .replace(/[^a-zäöüß]/g, '');

    const exists = syllableSet.has(normalized);
    if (!exists && text.length > 0) {
        console.log(`hasAudio: "${text}" -> "${normalized}" [NOT FOUND]`);
    } else if (exists) {
        // console.log(`hasAudio: "${text}" -> "${normalized}" [FOUND]`);
    }
    return exists;
};

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
