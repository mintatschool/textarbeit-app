const CLUSTERS = ['au'];

function getChunks(text, useClusters, activeClusters = CLUSTERS) {
    if (!useClusters) return text.split('');
    const clustersToUse = activeClusters || CLUSTERS;
    const result = [];
    let i = 0;
    while (i < text.length) {
        let match = null;
        for (const cluster of clustersToUse) {
            // "st" and "sp" are only clusters at the beginning of a syllable (Anlaut)
            if ((cluster.toLowerCase() === 'st' || cluster.toLowerCase() === 'sp') && i !== 0) continue;

            const lowSub = text.substring(i).toLowerCase();
            if (lowSub.startsWith(cluster.toLowerCase())) {
                match = text.substring(i, i + cluster.length);
                break;
            }
        }
        if (match) { result.push(match); i += match.length; }
        else { result.push(text[i]); i++; }
    }
    return result;
}

console.log("Test 1 (['a', 'au']):", getChunks("Maus", true, ['a', 'au']));
console.log("Test 2 (['au', 'a']):", getChunks("Maus", true, ['au', 'a']));
console.log("Test 3 (Sort by length):", getChunks("Maus", true, ['a', 'au'].sort((a, b) => b.length - a.length)));
