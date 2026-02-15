const CLUSTERS = ['sch', 'chs', 'ch', 'ck', 'ph', 'pf', 'th', 'qu', 'ei', 'ie', 'eu', 'au', 'äu', 'ai', 'sp', 'st'];

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

            if (text.substring(i).toLowerCase().startsWith(cluster.toLowerCase())) {
                match = text.substring(i, i + cluster.length);
                break;
            }
        }
        if (match) { result.push(match); i += match.length; }
        else { result.push(text[i]); i++; }
    }
    return result;
}

console.log("Test 1 (Default Clusters):", getChunks("ie", true));
console.log("Test 2 (Mixed Case text):", getChunks("Ie", true));
console.log("Test 3 (Word with ie):", getChunks("Lied", true));
console.log("Test 4 (Custom Clusters):", getChunks("ie", true, ['ie']));
console.log("Test 5 (Uppercase Cluster):", getChunks("ie", true, ['IE']));
