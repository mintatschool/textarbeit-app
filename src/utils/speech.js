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
    return exists;
};

let currentAudio = null;

export const speak = (text) => {
    if (!text) return;

    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    // Cancel any ongoing speech synthesis
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    // 1. Check if it's a syllable in our local MP3 list
    const normalized = text.toLowerCase().trim()
        .replace(/\u00AD/g, '') // Remove soft hyphens
        .replace(/[^a-zäöüß]/g, ''); // Match hasAudio logic

    if (syllableSet.has(normalized)) {
        const audioPath = `${BASE_PATH}audio/syllables/${normalized}.mp3`.replace(/\/+/g, '/');
        const audio = new Audio(audioPath);
        currentAudio = audio;

        audio.play().catch(err => {
            // Only fallback if it's NOT an interruption/abort error
            if (err.name === 'AbortError' || (err.message && err.message.includes('interrupted'))) {
                // Playback was interrupted by a new request or pause, do not fallback
                return;
            }
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
