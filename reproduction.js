function analyze(t, label) {
    console.log(`--- ${label} ---`);
    console.log(`Raw: ${JSON.stringify(t)}`);
    const segments = t.split(/(\s+)/);
    segments.forEach((seg, i) => {
        console.log(`Seg ${i}: "${seg.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u00A0/g, 'NBSP').replace(/\u200B/g, 'ZWSP').replace(/\uFEFF/g, 'BOM')}"`);
        if (seg.match(/^\s+$/)) {
            if (seg.includes('\n')) {
                console.log("  -> Newline Type (Space Consumed)");
            } else {
                console.log("  -> Space Type");
            }
        } else if (seg.length > 0) {
            console.log("  -> Text Type");
        }
    });
}

analyze("Word\n\u200B Word", "ZWSP between Newline and Space");
analyze("Word\n\uFEFF Word", "BOM between Newline and Space");
analyze("Word\n \u200BWord", "Space then ZWSP then Word");
