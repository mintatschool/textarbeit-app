/**
 * Randomizes the order of elements in an array using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @param {Object} [options] - Options for shuffling.
 * @param {boolean} [options.avoidOriginal=false] - If true, attempts to ensure the result is not identical to the input.
 * @returns {Array} - A new shuffled array.
 */
export const shuffleArray = (array, options = {}) => {
    if (!array || !Array.isArray(array)) return [];
    const { avoidOriginal = false } = options;

    // Helper to check if arrays are identical
    const isSameOrder = (a, b) => {
        if (a.length !== b.length) return false;
        return a.every((val, index) => val === b[index]);
    };

    let shuffled = [...array];

    // If array has 0 or 1 element, shuffling doesn't change anything
    if (shuffled.length <= 1) return shuffled;

    const maxRetries = 10;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // If we don't care about original order, or if correct, we are done
        if (!avoidOriginal || !isSameOrder(array, shuffled)) {
            return shuffled;
        }

        // If we fall through here, it means we shuffled but got the original order somehow (rare for large arrays, possible for small ones)
        // Retry...
    }

    return shuffled;
};
