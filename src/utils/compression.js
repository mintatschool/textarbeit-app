
// Komprimiert ein Array von Zahlen zu einem String (RLE-ähnlich für Ranges)
// Bsp: [1, 2, 3, 5, 10, 11] -> "1-3,5,10-11"
export const compressIndices = (indicesArg) => {
    if (!indicesArg) return "";
    const indices = Array.from(indicesArg).sort((a, b) => a - b);
    if (indices.length === 0) return "";

    let result = [];
    let start = indices[0];
    let end = start;

    for (let i = 1; i < indices.length; i++) {
        if (indices[i] === end + 1) {
            end = indices[i];
        } else {
            result.push(start === end ? `${start}` : `${start}-${end}`);
            start = indices[i];
            end = start;
        }
    }
    result.push(start === end ? `${start}` : `${start}-${end}`);
    return result.join(",");
};

// Dekomprimiert den String zurück in ein Array
export const decompressIndices = (str) => {
    if (!str || typeof str !== 'string') return [];
    const result = [];
    const parts = str.split(',');

    parts.forEach(part => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) result.push(i);
        } else {
            const num = parseInt(part, 10);
            if (!isNaN(num)) result.push(num);
        }
    });
    return result;
};
// Komprimiert ein Objekt von { index: color } zu einem Range-String
// Bsp: { 0: "red", 1: "red", 2: "red", 5: "blue" } -> "0-2:red,5:blue"
export const compressColors = (colorMap) => {
    if (!colorMap) return "";
    const indices = Object.keys(colorMap).map(Number).sort((a, b) => a - b);
    if (indices.length === 0) return "";

    let result = [];
    let start = indices[0];
    let end = start;
    let color = colorMap[start];

    for (let i = 1; i < indices.length; i++) {
        const idx = indices[i];
        const nextColor = colorMap[idx];
        if (idx === end + 1 && nextColor === color) {
            end = idx;
        } else {
            result.push(start === end ? `${start}:${color}` : `${start}-${end}:${color}`);
            start = idx;
            end = start;
            color = nextColor;
        }
    }
    result.push(start === end ? `${start}:${color}` : `${start}-${end}:${color}`);
    return result.join(",");
};

export const decompressColors = (str) => {
    if (!str || typeof str !== 'string') return {};
    const result = {};
    const parts = str.split(',');

    parts.forEach(part => {
        const [range, color] = part.split(':');
        if (!color) return;

        if (range.includes('-')) {
            const [start, end] = range.split('-').map(Number);
            for (let i = start; i <= end; i++) result[i] = color;
        } else {
            const idx = parseInt(range, 10);
            if (!isNaN(idx)) result[idx] = color;
        }
    });
    return result;
};
