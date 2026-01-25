import React, { useEffect, useState, useRef } from 'react';

export const ConnectionOverlay = ({ groups, wordRefs, containerRef, currentSelection }) => {
    const [paths, setPaths] = useState([]);
    const svgRef = useRef(null);

    const updatePaths = () => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const scrollTop = containerRef.current.scrollTop;

        const newPaths = [];

        // Helper to generate path for a pair
        const generatePairPath = (idA, idB, color = '#3b82f6', isSelection = false) => {
            const elA = wordRefs.current[idA];
            const elB = wordRefs.current[idB];

            if (!elA || !elB) return null;

            const rectA = elA.getBoundingClientRect();
            const rectB = elB.getBoundingClientRect();

            // Coordinates relative to the scroll container
            // We want bottom-center of words
            const x1 = rectA.left - containerRect.left + rectA.width / 2 + scrollLeft;
            const y1 = rectA.bottom - containerRect.top + scrollTop - 4; // -4 to start slightly inside/at padding
            const x2 = rectB.left - containerRect.left + rectB.width / 2 + scrollLeft;
            const y2 = rectB.bottom - containerRect.top + scrollTop - 4;

            // Difference check
            const dy = Math.abs(y1 - y2);
            const dx = Math.abs(x1 - x2);

            // Standard spacing assumption (line height ~ 2.8em ~ 60-100px depending on font size)
            // If dy > 20, we assume different lines.

            let d = "";

            if (dy < 20) {
                // Same line: Simple Arc
                // Control point: mid x, lower y
                const midX = (x1 + x2) / 2;
                const drop = Math.min(50, dx * 0.2 + 20); // Dynamic drop based on distance
                const midY = Math.max(y1, y2) + drop;

                d = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
            } else {
                // Different lines: S-Curve
                // Curve down from A, then to B
                // We want it to look like a "loose string"
                // Control Point 1: Below A
                // Control Point 2: Below B

                // Direction logic: A is usually earlier in text text, but let's just use geometry
                // Actually if words are sorted by reading order, A is first.
                // But x1 could be > x2 (end of line 1 vs start of line 2)

                const dropA = 40;
                const dropB = 40;

                // M Start C cp1x cp1y, cp2x cp2y, endx endy
                d = `M ${x1} ${y1} C ${x1} ${y1 + dropA}, ${x2} ${y2 + dropB}, ${x2} ${y2}`;
            }

            if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return null;

            return { d, color, isSelection };
        };

        // Render Groups
        groups.forEach(group => {
            if (group.ids.length < 2) return;
            // Connect sequentially or all-to-all? Usually pairs in sequence or chain.
            // "hat ... gespielt" -> usually just specific words.
            // Let's connect 0->1, 1->2 selected words.
            for (let i = 0; i < group.ids.length - 1; i++) {
                const path = generatePairPath(group.ids[i], group.ids[i + 1], '#cbd5e1');
                if (path) newPaths.push(path);
            }
        });

        // Render Current Selection (pulsing/temporary)
        if (currentSelection.length >= 2) {
            for (let i = 0; i < currentSelection.length - 1; i++) {
                const path = generatePairPath(currentSelection[i], currentSelection[i + 1], '#94a3b8', true);
                if (path) newPaths.push(path);
            }
        }

        setPaths(newPaths);
    };

    useEffect(() => {
        updatePaths();
        // Resize observer
        const ro = new ResizeObserver(updatePaths);
        if (containerRef.current) ro.observe(containerRef.current);
        ro.observe(document.body);

        // Add MutationObserver to detect when words are added/removed from DOM
        const mo = new MutationObserver(updatePaths);
        if (containerRef.current) {
            mo.observe(containerRef.current, { childList: true, subtree: true });
        }

        window.addEventListener('resize', updatePaths);
        window.addEventListener('scroll', updatePaths, true);

        // Force an initial update after a short delay
        const timeout = setTimeout(updatePaths, 100);

        // Polling for layout shifts (font loads etc)
        const interval = setInterval(updatePaths, 500);

        return () => {
            ro.disconnect();
            mo.disconnect();
            window.removeEventListener('resize', updatePaths);
            window.removeEventListener('scroll', updatePaths, true);
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [groups, currentSelection, wordRefs]); // Dependency on refs? Refs object stable, content changes. 

    // Force update on scroll?
    // If we use position absolute inside a relative scroll container, it moves WITH the content.
    // Ensure parent has position: relative.

    return (
        <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
            </defs>
            {paths.map((p, i) => (
                <path
                    key={i}
                    d={p.d}
                    fill="none"
                    stroke={p.color}
                    strokeWidth={p.isSelection ? "3" : "2"}
                    strokeLinecap="round"
                    strokeDasharray={p.isSelection ? "6 4" : "none"}
                    className={p.isSelection ? "animate-pulse" : ""}
                    style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))' }}
                />
            ))}

        </svg>
    );
};
