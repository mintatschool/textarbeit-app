export const DIPHTHONGS_REGEX = /^(eu|äu|au|ei|ie|ai)/i;
export const DIGRAPHS_REGEX = /^(ch|sch|ph|th|ck|qu|pf)/i;
export const VOWEL_REGEX = /[aeiouyäöü]/i;
export const CLUSTERS = ['sch', 'chs', 'ch', 'ck', 'ph', 'pf', 'th', 'qu', 'ei', 'ie', 'eu', 'au', 'äu', 'ai', 'sp', 'st'];
export const MONOSYLLABIC_EXCEPTIONS = ['Text', 'text', 'Wort', 'wort', 'Haus', 'haus', 'Kind', 'kind', 'Buch', 'buch', 'dich', 'sich', 'mir', 'dir', 'ihn', 'sie', 'es'];

export const CUSTOM_SYLLABLES = {
    'fahne': ['fah', 'ne'], 'tasse': ['tas', 'se'], 'wasser': ['was', 'ser'], 'mutter': ['mut', 'ter'], 'butter': ['but', 'ter'], 'hallo': ['hal', 'lo'], 'sonne': ['son', 'ne'], 'wolle': ['wol', 'le'], 'tonne': ['ton', 'ne'], 'kanne': ['kan', 'ne'], 'suppe': ['sup', 'pe'], 'puppe': ['pup', 'pe'], 'zimmer': ['zim', 'mer'], 'nummer': ['num', 'mer'], 'sommer': ['som', 'mer']
};

const SYLLABLE_CACHE = new Map();

export const isVowel = (char) => VOWEL_REGEX.test(char);

export const syllabifyImproved = (word) => {
    if (word.length <= 3) return [word];
    const result = [];
    let buffer = "";
    for (let i = 0; i < word.length; i++) {
        buffer += word[i];
        if (i >= word.length - 1) break;

        const c0 = word[i];
        const c1 = word[i + 1];
        const c2 = word[i + 2] || "";

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
        if (!VOWEL_REGEX.test(nextSyllable)) buffer += nextSyllable;
        else if (!VOWEL_REGEX.test(buffer)) buffer += nextSyllable;
        else { corrected.push(buffer); buffer = nextSyllable; }
    }
    corrected.push(buffer);
    if (corrected.join('') !== word) return [word];
    return corrected.filter(s => s.length > 0);
};

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
        try { s = hyphenator.hyphenate(word); } catch { s = syllabifyImproved(word); }
    } else {
        s = syllabifyImproved(word);
    }
    s = enforceVowelRule(word, s);

    SYLLABLE_CACHE.set(cacheKey, s);
    return s;
};

export const getChunks = (text, useClusters, activeClusters = CLUSTERS) => {
    if (!useClusters) return text.split('');
    const clustersToUse = activeClusters || CLUSTERS;
    const result = [];
    let i = 0;
    while (i < text.length) {
        let match = null;
        for (const cluster of clustersToUse) {
            // "st" and "sp" are only clusters at the beginning of a syllable (Anlaut)
            if ((cluster.toLowerCase() === 'st' || cluster.toLowerCase() === 'sp') && i !== 0) continue;

            if (text.substring(i).toLowerCase().startsWith(cluster)) {
                match = text.substring(i, i + cluster.length);
                break;
            }
        }
        if (match) { result.push(match); i += match.length; }
        else { result.push(text[i]); i++; }
    }
    return result;
};
