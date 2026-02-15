export const DIPHTHONGS_REGEX = /^(eu|äu|au|ei|ie|ai)/i;
export const DIGRAPHS_REGEX = /^(ch|sch|ph|th|ck|qu|pf)/i;
export const VOWEL_REGEX = /[aeiouyäöü]/i;
export const CLUSTERS = ['sch', 'chs', 'ch', 'ck', 'ph', 'pf', 'th', 'qu', 'ei', 'ie', 'eu', 'au', 'äu', 'ai', 'sp', 'st', 'ng', 'nk', 'tz'];
export const MONOSYLLABIC_EXCEPTIONS = ['Text', 'text', 'Wort', 'wort', 'Haus', 'haus', 'Kind', 'kind', 'Buch', 'buch', 'dich', 'sich', 'mir', 'dir', 'ihn', 'sie', 'es'];

export const CUSTOM_SYLLABLES = {
    'fahne': ['fah', 'ne'], 'tasse': ['tas', 'se'], 'wasser': ['was', 'ser'], 'mutter': ['mut', 'ter'], 'butter': ['but', 'ter'], 'hallo': ['hal', 'lo'], 'sonne': ['son', 'ne'], 'wolle': ['wol', 'le'], 'tonne': ['ton', 'ne'], 'kanne': ['kan', 'ne'], 'suppe': ['sup', 'pe'], 'puppe': ['pup', 'pe'], 'zimmer': ['zim', 'mer'], 'nummer': ['num', 'mer'], 'sommer': ['som', 'mer']
};

const SYLLABLE_CACHE = new Map();

export const isVowel = (char) => VOWEL_REGEX.test(char);

export const syllabifyImproved = (word) => {
    // Removed length check to allow "Oma" -> "O-ma"
    // if (word.length <= 3) return [word];
    const result = [];
    let buffer = "";

    // Helper to identify letters vs separators
    const isLetter = (c) => /[a-zA-ZäöüÄÖÜß]/.test(c);

    for (let i = 0; i < word.length; i++) {
        buffer += word[i];
        if (i >= word.length - 1) break;

        const c0 = word[i];
        const c1 = word[i + 1];
        const c2 = word[i + 2] || "";

        // Strict split on non-letter boundaries (e.g. hyphen)
        if (!isLetter(c0) || !isLetter(c1)) {
            result.push(buffer);
            buffer = "";
            continue;
        }

        const v0 = isVowel(c0);
        const v1 = isVowel(c1);
        const v2 = isVowel(c2);

        let split = false;
        const pair = c0 + c1;
        if (DIPHTHONGS_REGEX.test(pair)) {
        } else if (DIGRAPHS_REGEX.test(pair)) {
        } else if (c0.toLowerCase() === 's' && c1.toLowerCase() === 'c' && c2.toLowerCase() === 'h') {
        } else if (v0 && !v1 && v2) {
            split = true;
        } else if (v0 && DIGRAPHS_REGEX.test(c1 + c2)) {
            split = true;
        } else if (!v0 && !v1) {
            split = true;
        }
        if (split) { result.push(buffer); buffer = ""; }
    }
    result.push(buffer);
    return result.filter(s => s.length > 0);
};

export const enforceVowelRule = (word, generatedSyllables) => {
    if (!generatedSyllables || generatedSyllables.length <= 1) return generatedSyllables;
    const corrected = [];
    let buffer = generatedSyllables[0] || "";
    for (let i = 1; i < generatedSyllables.length; i++) {
        const nextSyllable = generatedSyllables[i];
        // Original Logic: Merge if next syllable has no vowel? Or previous?
        // This function seems to try to ensure every syllable has a vowel.
        // If nextSyllable has no vowel, append to buffer.

        // Wait, standard `enforceVowelRule` logic check:
        // "buffer" is previous syllable. "nextSyllable" is current.

        if (!VOWEL_REGEX.test(nextSyllable)) {
            // Next part has no vowel, attach it to previous (buffer)
            buffer += nextSyllable;
        } else if (!VOWEL_REGEX.test(buffer)) {
            // Previous part (buffer) has no vowel? This shouldn't happen usually if we iterate properly,
            // but if it does, attach current to it.
            buffer += nextSyllable;
        } else {
            // Both have vowels, push buffer and start new
            corrected.push(buffer);
            buffer = nextSyllable;
        }
    }
    corrected.push(buffer);
    if (corrected.join('') !== word) return [word];
    return corrected.filter(s => s.length > 0);
};

export const COMMON_PREFIXES = ['be', 'ge', 'er', 'ver', 'zer', 'ent', 'emp', 'um', 'an', 'auf', 'aus', 'ein', 'vor', 'zu'];

export const getCachedSyllables = (word, hyphenator) => {
    const cacheKey = word + (hyphenator ? '_hypher' : '_heuristic');
    if (SYLLABLE_CACHE.has(cacheKey)) return SYLLABLE_CACHE.get(cacheKey);

    if (CUSTOM_SYLLABLES[word.toLowerCase()]) {
        const override = CUSTOM_SYLLABLES[word.toLowerCase()];
        let start = 0;
        const caseCorrected = override.map(part => {
            const segment = word.substring(start, start + part.length);
            start += part.length;
            return segment;
        });
        SYLLABLE_CACHE.set(cacheKey, caseCorrected);
        return caseCorrected;
    }

    let s = [];
    if (MONOSYLLABIC_EXCEPTIONS.includes(word) || MONOSYLLABIC_EXCEPTIONS.includes(word.toLowerCase())) {
        s = [word];
    } else if (hyphenator) {
        try {
            // 1. Get Standard Hyphenation
            const standardParts = hyphenator.hyphenate(word);

            // 2. Get Heuristic Hyphenation (which now allows O-ma)
            const heuristicParts = syllabifyImproved(word);

            // 3. Merge Strategy: Prefer Heuristic for Single-Vowel-Start
            // Only if heuristic starts with a single vowel and standard doesn't?
            // Or if heuristic splits a vowel at start.

            // Example: O-ma (Heuristic) vs Oma (Standard)
            // Example: O-ran-ge (Heuristic) vs Oran-ge (Standard - maybe?)

            // Check if heuristic has a single-letter first syllable that is a vowel
            if (heuristicParts.length > 0 &&
                heuristicParts[0].length === 1 &&
                isVowel(heuristicParts[0])) {

                // CHECK FOR PREFIX CONFLICT
                // If the word starts with a common prefix, and the heuristic breaks it (e.g. u-mar-men vs um-ar-men),
                // we should trust the standard hyphenation (which usually gets prefixes right) or at least reject the heuristic here.
                const matchingPrefix = COMMON_PREFIXES.find(p => word.toLowerCase().startsWith(p));
                const heuristicConflictsWithPrefix = matchingPrefix && heuristicParts[0].length < matchingPrefix.length;

                if (heuristicConflictsWithPrefix) {
                    s = standardParts;
                } else if (standardParts.length === 1 && heuristicParts.length > 1) {
                    s = heuristicParts;
                } else if (standardParts.length > 1 && standardParts[0].toLowerCase() !== heuristicParts[0].toLowerCase()) {
                    // Standard: O-ran-ge (Wait, Hypher might do O-range or Or-ange?)
                    // If Hypher does Or-ange and Heuristic does O-ran-ge.
                    // We prefer O-ran-ge.

                    // Use heuristic if it starts with vowel?
                    s = heuristicParts;
                } else {
                    s = standardParts;
                }
            } else {
                s = standardParts;
            }

            // Allow override if resulting standard parts are weirdly joined? 
            // User specifically asked for "O-ma", "O-ran-ge".
            // The check above: if heuristic starts with single vowel, use heuristic.

        } catch { s = syllabifyImproved(word); }
    } else {
        s = syllabifyImproved(word);
    }
    s = enforceVowelRule(word, s);
    s = mergeDiphthongs(s);

    // Final Post-Processing: Strict Hyphen Split
    // Ensure no syllable contains a hyphen mixed with letters.
    // Must be done AFTER enforceVowelRule, otherwise the hyphen (having no vowel) gets merged back!
    s = s.flatMap(part => {
        if (part === '-') return [part];
        if (part.includes('-')) {
            return part.split(/(-)/).filter(p => p.length > 0);
        }
        return [part];
    });

    SYLLABLE_CACHE.set(cacheKey, s);
    return s;
};

export const getChunks = (text, useClusters, activeClusters = CLUSTERS) => {
    if (!useClusters) return text.split('');
    const clustersToUse = activeClusters || CLUSTERS;
    // Normalize text and clusters to ensure consistency (e.g., composed vs decomposed umlauts)
    const normalizedText = text.normalize('NFC');
    const normalizedClusters = clustersToUse.map(c => c.normalize('NFC'));

    const result = [];
    let i = 0;
    while (i < normalizedText.length) {
        let match = null;
        for (const cluster of normalizedClusters) {
            // "st" and "sp" are only clusters at the beginning of a syllable (Anlaut)
            // Note: simple syllable start check is imperfect on raw text without full syllabification context here, 
            // but consistent with previous implementation.
            if ((cluster.toLowerCase() === 'st' || cluster.toLowerCase() === 'sp') && i !== 0) continue;

            const lowSub = normalizedText.substring(i).toLowerCase();
            if (lowSub.startsWith(cluster.toLowerCase())) {
                match = normalizedText.substring(i, i + cluster.length);
                break;
            }
        }
        if (match) { result.push(match); i += match.length; }
        else { result.push(normalizedText[i]); i++; }
    }
    return result;
};

export const mergeDiphthongs = (syllables) => {
    if (!syllables || syllables.length < 2) return syllables;
    // Diphthongs that should not be split
    const diphthongs = ['eu', 'äu', 'au', 'ei', 'ie', 'ai'];

    // Check if a character pair forms a diphthong
    const isD = (pair) => diphthongs.includes(pair.toLowerCase());

    const merged = [];
    let buffer = syllables[0];

    for (let i = 1; i < syllables.length; i++) {
        const next = syllables[i];
        if (!buffer || !next) {
            merged.push(buffer);
            buffer = next;
            continue;
        }

        const lastChar = buffer.slice(-1);
        const firstChar = next.charAt(0);
        const pair = lastChar + firstChar;

        let shouldMerge = false;
        if (isD(pair)) {
            // Check if the last char of buffer is ALREADY part of a diphthong?
            // "Fei" -> last 'i'. prev 'e'. 'ei' is diphthong.
            const prevChar = buffer.length > 1 ? buffer.slice(-2, -1) : '';
            const prevPair = prevChar + lastChar;

            if (prevChar && isD(prevPair)) {
                // Already part of a diphthong pattern ending the buffer
                shouldMerge = false;
            } else {
                shouldMerge = true;
            }
        }

        if (shouldMerge) {
            buffer += next;
        } else {
            merged.push(buffer);
            buffer = next;
        }
    }
    merged.push(buffer);
    return merged;
};
