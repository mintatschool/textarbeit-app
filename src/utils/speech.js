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

        // Ensure voices are loaded (Chrome/Safari sometimes need a moment or an event)
        let voices = window.speechSynthesis.getVoices();

        // Retry getting voices if empty (sometimes happens on first load)
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                doSpeak(text, voices);
            };
            return;
        }

        doSpeak(text, voices);
    }
};

const doSpeak = (text, voices) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.8; // Default rate

    // Filter for German voices
    const germanVoices = voices.filter(v => v.lang.startsWith('de'));

    if (germanVoices.length > 0) {
        // defined priority via keywords
        // 1. "Google" often sounds good on Android/Desktop Chrome
        // 2. "Siri" or "Enhanced" or "Premium" are usually high quality on iOS/macOS
        // 3. Avoid "Compact" if possible

        const highQualityVoice = germanVoices.find(v =>
            (v.name.includes('Google') || v.name.includes('Anna') || v.name.includes('Siri') || v.name.includes('Premium') || v.name.includes('Enhanced'))
            && !v.name.includes('Compact')
        );

        const standardVoice = germanVoices.find(v => !v.name.includes('Compact'));

        // Fallback to any German voice
        u.voice = highQualityVoice || standardVoice || germanVoices[0];

        // Slight rate adjustment if we are forced to use a compact voice or if on iOS to be safe?
        // Actually, keeping 0.8 is fine if the voice is good. 
        // If we only found a compact voice, maybe 0.9 is safer to avoid artifacts, but let's stick to the better selection first.
    }

    window.speechSynthesis.speak(u);
};
