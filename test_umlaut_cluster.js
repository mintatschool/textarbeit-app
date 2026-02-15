const CLUSTERS = ['äu'];

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

const text = "läuft";
const textNFD = text.normalize("NFD");
const textNFC = text.normalize("NFC");

console.log("Text NFC:", textNFC, textNFC.length);
console.log("Text NFD:", textNFD, textNFD.length);

const clusters = ['ä', 'u', 'äu'].sort((a, b) => b.length - a.length);
console.log("Clusters sorted:", clusters);

console.log("Test NFC with ['äu', 'ä', 'u']:", getChunks(textNFC, true, clusters));
console.log("Test NFD with ['äu', 'ä', 'u']:", getChunks(textNFD, true, clusters));
