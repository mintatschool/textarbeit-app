import React, { useRef, useEffect } from 'react';
import { Icons } from './Icons'; // Assuming Icons exists here if needed, or remove if unused. Used for X button.
import { CLUSTERS, getChunks } from '../utils/syllables';

export const WordListCell = React.memo(({
    word,
    colId,
    idx,
    settings,
    wordColors,
    interactionMode,
    isMarkerActive,
    toggleHighlights,
    onWordUpdate,
    onRemoveWord,
    highlightedIndices,
    onUpdateWordColor,
    colorPalette,
    pointerDrag,
    draggables,
    hideYellowLetters,
    onEditMode
}, ref) => {
    const { onDragStart, onDragEnd, onDrop, onDragOver } = draggables;
    const { onPointerDown, isDragging: isBeingDragged } = pointerDrag || {};

    // Helper: Find Cluster indices (adapted from Word.jsx)
    const findClusterIndices = (clickedGlobalIndex, syllables, startIndex) => {
        if (!settings.smartSelection) return [clickedGlobalIndex];

        const relativeIndex = clickedGlobalIndex - startIndex;
        const activeClusters = settings.clusters || CLUSTERS;

        // Reconstruct the full word from syllables (if present) to perform a whole-word search
        // This ensures "sch" across syllables or at any position is found consistently.
        const wordText = syllables.join('').toLowerCase();

        // Calculate Syllable Start Indices (for st/sp rule)
        const syllableStarts = new Set();
        let acc = 0;
        syllables.forEach(s => { syllableStarts.add(acc); acc += s.length; });

        // Iterate over all clusters to see if the click falls into one
        for (let cluster of activeClusters) {
            let idx = wordText.indexOf(cluster);
            while (idx !== -1) {
                // Special Rule for 'st' and 'sp': Only valid if at the START of a syllable
                if ((cluster === 'st' || cluster === 'sp') && !syllableStarts.has(idx)) {
                    idx = wordText.indexOf(cluster, idx + 1);
                    continue;
                }

                // Check if click is within this occurrence
                if (relativeIndex >= idx && relativeIndex < idx + cluster.length) {
                    return Array.from({ length: cluster.length }, (_, k) => startIndex + idx + k);
                }

                idx = wordText.indexOf(cluster, idx + 1);
            }
        }
        return [clickedGlobalIndex];
    };

    const hasLetters = /[a-zA-Z\u00C0-\u017F]/.test(word.word);

    // Syllable Show Logic mirroring Word.jsx
    // In WordList, "isHighlighted" (Selection intent) is different.
    // We treat "click" display trigger as: Show if interactionMode is 'mark' (which acts like selection)?
    // OR we assume in list we usually default to show unless "never".
    // For now: Always show if 'always'. Show if 'click' (user can see it). Never if 'never'.
    // "Click" in WordListView usually means "Show".
    const showSyllables = hasLetters
        && (settings.displayTrigger === 'always' || settings.displayTrigger === 'click' || interactionMode === 'mark')
        && settings.visualType !== 'none'
        && word.syllables;

    const handleCharClick = (e, absCharIndex, sylObj, cIdx) => {
        // console.log('Cell Click:', { mode: interactionMode, idx: absCharIndex, wordIndex: word.index, toggleHighlights: !!toggleHighlights });
        e.stopPropagation();

        if (interactionMode === 'mark' && absCharIndex !== null && isMarkerActive) {
            // Smart Selection Logic
            const sylStrings = word.syllables.map(s => typeof s === 'string' ? s : s.text);
            const wordStartIndex = word.index;
            const indicesToToggle = findClusterIndices(absCharIndex, sylStrings, wordStartIndex);

            // Fix: Use persistent coloring instead of selection/highlighting for Table View
            if (onUpdateWordColor) {
                // Determine if we are adding or removing based on the clicked char
                const isCurrentlyYellow = wordColors && wordColors[absCharIndex] === 'yellow';
                const targetColor = isCurrentlyYellow ? null : 'yellow';

                indicesToToggle.forEach(idx => {
                    onUpdateWordColor(idx, targetColor);
                });
            } else if (toggleHighlights) {
                // Fallback (Legacy)
                toggleHighlights(indicesToToggle);
            }
        } else if (interactionMode === 'correct') {
            if (onEditMode) {
                const syls = word.syllables ? word.syllables.map(s => typeof s === 'string' ? s : s.text) : [word.word];
                onEditMode(word.word, word.id, syls);
            }
        } else {
            console.log("Ignored click:", { interactionMode, absCharIndex });
        }
    };

    const resolveColor = (colorCode) => {
        if (!colorCode) return 'transparent';
        if (colorCode === 'yellow') return 'yellow';
        if (typeof colorCode === 'string' && colorCode.startsWith('palette-')) {
            const idx = parseInt(colorCode.split('-')[1], 10);
            return colorPalette && colorPalette[idx] ? colorPalette[idx] : 'transparent';
        }
        return colorCode; // Legacy hex
    };

    const containerRef = useRef(null);
    const holdTimerRef = useRef(null);
    const pendingStartRef = useRef(null);
    const HOLD_DURATION = 200; // ms
    const MOVE_THRESHOLD = 8; // px

    // Cleanup hold timer on unmount
    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        };
    }, []);

    const cancelHold = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        pendingStartRef.current = null;
    };

    const handleContainerPointerDown = (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button') || e.target.closest('input')) return;

        const isOnHandle = e.target.closest('.drag-handle');

        if (isOnHandle) {
            // Instant drag from handle
            if (onPointerDown) onPointerDown(e, word, colId, idx, containerRef.current);
            return;
        }

        // Hold-to-drag on body: start timer
        const startPos = { x: e.clientX, y: e.clientY };
        pendingStartRef.current = { event: e, startPos };

        // Track movement and lift during hold phase
        const onMoveWhileHolding = (moveE) => {
            if (!pendingStartRef.current) return;
            const dx = moveE.clientX - startPos.x;
            const dy = moveE.clientY - startPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
                // Scrolling detected, cancel hold
                cleanup();
            }
        };

        const onUpWhileHolding = () => {
            // Lifted before hold completed = tap
            cleanup();
        };

        const cleanup = () => {
            cancelHold();
            window.removeEventListener('pointermove', onMoveWhileHolding);
            window.removeEventListener('pointerup', onUpWhileHolding);
            window.removeEventListener('pointercancel', onUpWhileHolding);
        };

        window.addEventListener('pointermove', onMoveWhileHolding);
        window.addEventListener('pointerup', onUpWhileHolding);
        window.addEventListener('pointercancel', onUpWhileHolding);

        holdTimerRef.current = setTimeout(() => {
            // Hold completed! Start drag.
            cleanup();
            if (onPointerDown) onPointerDown(e, word, colId, idx, containerRef.current);
        }, HOLD_DURATION);
    };

    return (
        <div
            ref={containerRef}
            onPointerDown={handleContainerPointerDown}
            onTouchStart={(e) => {
                // Block mobile-drag-drop polyfill from intercepting only on handle
                if (e.target.closest('.drag-handle') && !e.target.closest('button') && !e.target.closest('input')) {
                    e.stopPropagation();
                }
            }}
            className={`p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 group relative select-none transition-transform cursor-grab active:cursor-grabbing ${isBeingDragged ? 'opacity-40' : ''}`}
            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
        >
            {/* Drag Handle - Top Left */}
            <div
                className="drag-handle absolute top-0 left-0 p-2 text-slate-300 hover:text-slate-500 z-20"
                style={{ touchAction: 'none' }}
            >
                <Icons.Move size={16} />
            </div>

            <div className="text-center pointer-events-auto mt-2 cursor-default prevent-pan"> {/* Added margin-top to avoid clicking handle overlap if needed, or text centering relies on padding */}
                {(() => {
                    const renderSyllable = (s, i, currentGlobalIndex) => {
                        const isEven = i % 2 === 0;
                        let styleClass = "";
                        let textClass = "";

                        const sylObj = (typeof s === 'object' && s !== null) ? s : { text: String(s || "") };
                        const textContent = sylObj.text;

                        // VISUAL TYPE LOGIC (Aligned with Word.jsx)
                        if (sylObj.isSpace) {
                            styleClass = "bg-transparent mx-1 border-none inline-block w-5";
                            textClass = "text-transparent select-none";
                        } else if (showSyllables && settings.visualType === 'block') {
                            styleClass = isEven ? 'bg-blue-100 border-blue-200' : 'bg-blue-200 border-blue-300';
                            styleClass += " border rounded px-1 mx-[1px]";
                            textClass = "text-slate-900";
                        } else if (showSyllables && settings.visualType === 'black_gray') {
                            textClass = isEven ? "text-black" : "text-gray-400";
                        } else if (showSyllables && (settings.visualType === 'arc' || settings.visualType === 'colored')) {
                            if (settings.visualType === 'arc') {
                                textClass = "text-slate-900";
                            } else {
                                textClass = isEven ? "text-blue-700" : "text-red-600";
                            }
                        } else {
                            textClass = "text-slate-900";
                        }

                        return (
                            <span key={i} className={`inline-block relative leading-none ${styleClass}`} style={{ overflow: 'visible' }}>
                                <span className="relative z-30">
                                    {(() => {
                                        const chunks = getChunks(textContent, settings.smartSelection, settings.clusters || CLUSTERS);

                                        let charOffset = 0;
                                        return chunks.map((chunk, cIdx) => {
                                            const baseIndex = (typeof sylObj.absStartIndex === 'number') ? sylObj.absStartIndex : currentGlobalIndex;
                                            const absCharIndex = baseIndex + charOffset;
                                            charOffset += chunk.length;

                                            // Check Highlight/Color
                                            const getNormalizedColor = (idx) => {
                                                const code = wordColors && wordColors[idx];
                                                const resolved = resolveColor(code);
                                                if (code === 'yellow' || resolved === 'yellow') return '#fef08a';
                                                return resolved;
                                            };

                                            let resolvedChunkColor = 'transparent';
                                            for (let k = 0; k < chunk.length; k++) {
                                                const c = getNormalizedColor(absCharIndex + k);
                                                if (c && c !== 'transparent' && c !== 'rgba(0,0,0,0)') {
                                                    resolvedChunkColor = c;
                                                    break;
                                                }
                                            }

                                            let rounded = 'rounded';
                                            let customClasses = '!cursor-pointer transition-none duration-0 active:bg-slate-300 prevent-pan';
                                            // Desktop hover only
                                            if (window.matchMedia('(hover: hover)').matches) {
                                                customClasses += ' hover:bg-slate-200';
                                            }

                                            let style = {
                                                transition: 'none',
                                                paddingTop: '0.05em',
                                                paddingBottom: '0.10em',
                                                marginTop: '-0.05em',
                                                marginBottom: '-0.10em',
                                                paddingLeft: '0em',
                                                paddingRight: '0em',
                                                marginLeft: '0em',
                                                marginRight: '0em',
                                                zIndex: 0,
                                                position: 'relative',
                                                verticalAlign: 'middle'
                                            };

                                            if (resolvedChunkColor && resolvedChunkColor !== 'transparent') {
                                                // AGGRESSIVE MERGING STRATEGY (Matched with Word.jsx)
                                                style = {
                                                    ...style,
                                                    backgroundColor: resolvedChunkColor,
                                                    paddingLeft: '1px',
                                                    paddingRight: '1px',
                                                    marginLeft: '-1px',
                                                    marginRight: '-1px',
                                                    zIndex: 10
                                                };

                                                if (resolvedChunkColor === '#fef08a' || resolvedChunkColor === 'yellow') {
                                                    customClasses += ' bg-yellow-200';
                                                }

                                                // Neighbor check for same color connections
                                                const colorLeft = getNormalizedColor(absCharIndex - 1);
                                                const colorRight = getNormalizedColor(absCharIndex + chunk.length);

                                                const matchLeft = colorLeft !== 'transparent' && colorLeft === resolvedChunkColor;
                                                const matchRight = colorRight !== 'transparent' && colorRight === resolvedChunkColor;

                                                if (matchLeft && matchRight) {
                                                    rounded = 'rounded-none';
                                                    if (resolvedChunkColor === '#fef08a' || resolvedChunkColor === 'yellow') customClasses += ' shadow-border-yellow-mid';
                                                } else if (matchLeft) {
                                                    rounded = 'rounded-r-md rounded-l-none';
                                                    if (resolvedChunkColor === '#fef08a' || resolvedChunkColor === 'yellow') customClasses += ' shadow-border-yellow-right';
                                                } else if (matchRight) {
                                                    rounded = 'rounded-l-md rounded-r-none';
                                                    if (resolvedChunkColor === '#fef08a' || resolvedChunkColor === 'yellow') customClasses += ' shadow-border-yellow-left';
                                                } else {
                                                    rounded = 'rounded-md';
                                                    if (resolvedChunkColor === '#fef08a' || resolvedChunkColor === 'yellow') customClasses += ' shadow-border-yellow';
                                                }
                                            }

                                            const shouldHideLetter = (resolvedChunkColor === '#fef08a' || resolvedChunkColor === 'yellow') && hideYellowLetters;
                                            return (
                                                <span
                                                    key={cIdx}
                                                    className={`${textClass} ${customClasses} ${rounded} inline-block leading-none select-none touch-manipulation ${shouldHideLetter ? 'blur-letter' : ''}`}
                                                    style={style}
                                                    onClick={(e) => handleCharClick(e, absCharIndex, sylObj, charOffset)}
                                                    onPointerDown={(e) => {
                                                        if (interactionMode === 'mark') {
                                                            e.stopPropagation();
                                                        }
                                                    }}
                                                    role="button"
                                                    title={`Index: ${absCharIndex}`}
                                                >
                                                    {chunk}
                                                </span>
                                            );
                                        });
                                    })()}
                                </span>
                                {showSyllables && settings.visualType === 'arc' && !sylObj.isSpace && (
                                    <svg className="arc-svg pointer-events-none" style={{ zIndex: 20 }} viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 2 2 Q 50 20 98 2" fill="none" stroke={isEven ? '#2563eb' : '#dc2626'} strokeWidth="3" strokeLinecap="round" /></svg>
                                )}
                            </span>
                        );
                    };

                    let currentGlobalIndex = word.index;
                    const content = word.syllables ? word.syllables : word.word.split('').map((char, i) => ({ text: char, absStartIndex: word.index + i }));

                    return (
                        <span className="inline-block whitespace-nowrap">
                            {content.map((s, i) => {
                                const rendered = renderSyllable(s, i, currentGlobalIndex);
                                currentGlobalIndex += (typeof s === 'string' ? s.length : (s.text ? s.text.length : 1));
                                return rendered;
                            })}
                        </span>
                    );
                })()}
            </div>

            <button onClick={(e) => { e.stopPropagation(); onRemoveWord(word.id); }} className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white min-touch-target cursor-pointer z-20 shadow-sm border border-red-200">
                <Icons.X size={14} />
            </button>
        </div>
    );
}, (prev, next) => {
    // Custom Comparator for Optimization
    if (prev.word !== next.word) return false;
    if (prev.colId !== next.colId) return false;
    if (prev.idx !== next.idx) return false;
    if (prev.settings !== next.settings) return false;
    if (prev.interactionMode !== next.interactionMode) return false;
    if (prev.toggleHighlights !== next.toggleHighlights) return false;
    if (prev.onWordUpdate !== next.onWordUpdate) return false;
    if (prev.onRemoveWord !== next.onRemoveWord) return false;
    if (prev.onUpdateWordColor !== next.onUpdateWordColor) return false;
    if (prev.isMarkerActive !== next.isMarkerActive) return false;
    if (prev.hideYellowLetters !== next.hideYellowLetters) return false;

    // Check Colors - Only return false (re-render) if relevant colors changed
    if (prev.wordColors !== next.wordColors) {
        if (!prev.wordColors || !next.wordColors) return false;

        const start = prev.word.index;
        if (prev.word.syllables) {
            for (const s of prev.word.syllables) {
                if (s.absStartIndex !== undefined) {
                    for (let i = 0; i < s.text.length; i++) {
                        const idx = s.absStartIndex + i;
                        if (prev.wordColors[idx] !== next.wordColors[idx]) return false;
                    }
                }
            }
        } else {
            const len = prev.word.word.length;
            for (let i = 0; i < len; i++) {
                if (prev.wordColors[start + i] !== next.wordColors[start + i]) return false;
            }
        }
    }

    // Check highlightedIndices (Transient)
    // Only return false if relevant indices changed
    if (prev.highlightedIndices !== next.highlightedIndices) {
        if (!prev.highlightedIndices || !next.highlightedIndices) return false;

        // Range check
        const start = prev.word.index;
        // Approximation: Check range for this word
        // WordListCell only cares about its own chars
        // We need to know the length.
        let length = 0;
        if (prev.word.syllables) {
            prev.word.syllables.forEach(s => length += (s.text ? s.text.length : s.length));
        } else {
            length = prev.word.word.length;
        }

        const end = start + length;
        let changed = false;
        // Check neighbors (glue) too? List view glue logic?
        // Let's just check strict range for now + neighbors for rounded corners
        for (let i = start - 1; i <= end + 1; i++) {
            if (prev.highlightedIndices.has(i) !== next.highlightedIndices.has(i)) {
                changed = true;
                break;
            }
        }
        if (changed) return false;
    }
    return true; // Props equal (enough), skip render
});
