import React, { useRef } from 'react';
import { Icons } from './Icons'; // Assuming Icons exists here if needed, or remove if unused. Used for X button.

const CLUSTERS = ['sch', 'ei', 'ie', 'au', 'eu', 'ch', 'pf', 'st', 'sp', 'qu', 'ai', 'oi', 'äu'];

export const WordListCell = React.memo(({
    word,
    colId,
    idx,
    settings,
    wordColors,
    interactionMode,
    toggleHighlights,
    onWordUpdate,
    onRemoveWord,
    highlightedIndices,
    onUpdateWordColor, // New prop
    draggables
}, ref) => {
    const { onDragStart, onDragEnd, onDrop, onDragOver } = draggables;

    // Helper: Find Cluster indices (adapted from Word.jsx)
    const findClusterIndices = (clickedGlobalIndex, syllables, startIndex) => {
        if (!settings.smartSelection) return [clickedGlobalIndex];

        const relativeIndex = clickedGlobalIndex - startIndex;
        let currentSylStart = 0;
        let targetSylIndex = -1;
        let indexInSyl = -1;

        for (let i = 0; i < syllables.length; i++) {
            const sylLen = syllables[i].length;
            if (relativeIndex >= currentSylStart && relativeIndex < currentSylStart + sylLen) {
                targetSylIndex = i;
                indexInSyl = relativeIndex - currentSylStart;
                break;
            }
            currentSylStart += sylLen;
        }

        if (targetSylIndex === -1) return [clickedGlobalIndex];

        const sylText = syllables[targetSylIndex].toLowerCase();
        const activeClusters = settings.clusters || CLUSTERS;

        for (let cluster of activeClusters) {
            const len = cluster.length;
            for (let offset = 0; offset < len; offset++) {
                const start = indexInSyl - offset;
                if (start < 0 || start + len > sylText.length) continue;

                if ((cluster === 'st' || cluster === 'sp') && start !== 0) continue;

                if (sylText.substring(start, start + len) === cluster) {
                    return Array.from({ length: len }, (_, k) => startIndex + currentSylStart + start + k);
                }
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
        && (settings.displayTrigger === 'always' || settings.displayTrigger === 'click' || interactionMode === 'mark' || interactionMode === 'case')
        && settings.visualType !== 'none'
        && word.syllables;

    const handleCharClick = (e, absCharIndex, sylObj, cIdx) => {
        // console.log('Cell Click:', { mode: interactionMode, idx: absCharIndex, wordIndex: word.index, toggleHighlights: !!toggleHighlights });
        e.stopPropagation();

        if (interactionMode === 'case') {
            // Logic copied from WordListView
            if (cIdx === 0 && sylObj.sourceId && !sylObj.isSpace) {
                const firstChar = sylObj.sourceWord.charAt(0);
                const isUpper = firstChar === firstChar.toUpperCase();
                const newWord = (isUpper ? firstChar.toLowerCase() : firstChar.toUpperCase()) + sylObj.sourceWord.slice(1);
                if (onWordUpdate) onWordUpdate(sylObj.sourceId, newWord);
            }
        } else if (interactionMode === 'mark' && absCharIndex !== null) {
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
        } else {
            console.log("Ignored click:", { interactionMode, absCharIndex });
        }
    };

    const containerRef = useRef(null);

    return (
        <div
            ref={containerRef}
            onDrop={(e) => onDrop(e, colId, idx)}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 group relative select-none active:scale-[0.98] transition-transform"
            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
        >
            {/* Drag Handle - Top Left */}
            <div
                className="absolute top-0 left-0 p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 z-20"
                draggable={true}
                onDragStart={(e) => {
                    e.stopPropagation();
                    if (containerRef.current) {
                        e.dataTransfer.setDragImage(containerRef.current, 10, 10);
                    }
                    onDragStart(e, 'word', word, colId, idx);
                }}
                onDragEnd={onDragEnd}
            >
                <Icons.Move size={16} />
            </div>

            <div className="text-center pointer-events-auto mt-2 cursor-default prevent-pan"> {/* Added margin-top to avoid clicking handle overlap if needed, or text centering relies on padding */}
                {showSyllables ? (
                    <span className="inline-block whitespace-nowrap">
                        {(() => {
                            let currentGlobalIndex = word.index; // Initialize with word start index
                            return word.syllables.map((s, i) => {
                                const isEven = i % 2 === 0;
                                let styleClass = "";
                                let textClass = "";

                                const sylObj = (typeof s === 'object' && s !== null) ? s : { text: String(s || "") };
                                const textContent = sylObj.text;

                                // VISUAL TYPE LOGIC (Aligned with Word.jsx)
                                if (sylObj.isSpace) {
                                    styleClass = "bg-transparent mx-1 border-none inline-block w-5";
                                    textClass = "text-transparent select-none";
                                } else if (settings.visualType === 'block') {
                                    styleClass = isEven ? 'bg-blue-100 border-blue-200' : 'bg-blue-200 border-blue-300';
                                    styleClass += " border rounded px-1 mx-[1px]";
                                    textClass = "text-slate-900";
                                } else if (settings.visualType === 'black_gray') {
                                    textClass = isEven ? "text-black" : "text-gray-400";
                                } else if (settings.visualType === 'arc' || settings.visualType === 'colored') {
                                    if (settings.visualType === 'arc') {
                                        textClass = "text-slate-900";
                                    } else {
                                        textClass = isEven ? "text-blue-700" : "text-red-600";
                                    }
                                } else {
                                    textClass = "text-slate-900";
                                }

                                const renderedSyllable = (
                                    <span key={i} className={`inline-block relative leading-none ${styleClass}`}>
                                        <span className="relative z-10">
                                            {textContent.split('').map((char, cIdx) => {
                                                // Calculate absolute index: Prefer sylObj.absStartIndex (from WordListView), fallback to running counter
                                                const baseIndex = (typeof sylObj.absStartIndex === 'number') ? sylObj.absStartIndex : currentGlobalIndex;
                                                const absCharIndex = baseIndex + cIdx;
                                                const isNaNIndex = isNaN(absCharIndex);

                                                // Specific Yellow check (Persistent ONLY)
                                                // Fix: Do NOT use highlightedIndices (Selection) for yellow background in table
                                                const isCharHighlighted = (wordColors && wordColors[absCharIndex] === 'yellow');

                                                let rounded = 'rounded px-[2px]'; // Default for non-highlighted
                                                let customClasses = '!cursor-pointer hover:bg-slate-200 transition-colors active:bg-slate-300 prevent-pan';
                                                let style = { transition: 'none' };

                                                if (isNaNIndex) {
                                                    style.border = '2px solid red';
                                                    style.backgroundColor = '#fee2e2';
                                                }

                                                if (isCharHighlighted) {
                                                    style = { ...style, transition: 'none', backgroundColor: '#fef08a', paddingTop: '0em', paddingBottom: '0.10em', marginTop: '0em', marginBottom: '-0.10em' };
                                                    customClasses = '!cursor-pointer bg-yellow-200 prevent-pan';

                                                    // Neighbor Check for Continuous Blocks
                                                    const hasLeft = (wordColors && wordColors[absCharIndex - 1] === 'yellow');
                                                    const hasRight = (wordColors && wordColors[absCharIndex + 1] === 'yellow');

                                                    if (hasLeft && hasRight) {
                                                        rounded = 'rounded-none';
                                                        customClasses += ' shadow-border-yellow-mid';
                                                    } else if (hasLeft) {
                                                        rounded = 'rounded-r-md rounded-l-none';
                                                        customClasses += ' shadow-border-yellow-right';
                                                    } else if (hasRight) {
                                                        rounded = 'rounded-l-md rounded-r-none';
                                                        customClasses += ' shadow-border-yellow-left';
                                                    } else {
                                                        rounded = 'rounded-md';
                                                        customClasses += ' shadow-border-yellow';
                                                    }
                                                }

                                                return (
                                                    <span
                                                        key={cIdx}
                                                        className={`${textClass} ${customClasses} ${rounded} inline-block leading-none`}
                                                        style={style}
                                                        onClick={(e) => handleCharClick(e, absCharIndex, sylObj, cIdx)}
                                                        onMouseDown={(e) => e.stopPropagation()} // Prevent Pan Logic
                                                        onTouchStart={(e) => e.stopPropagation()} // Prevent Touch Logic
                                                        title={`Index: ${absCharIndex}, WordStart: ${word.index}`}
                                                    >
                                                        {char}
                                                    </span>
                                                );
                                            })}
                                        </span>
                                        {settings.visualType === 'arc' && !sylObj.isSpace && (
                                            <svg className="arc-svg pointer-events-none" style={{ zIndex: 20 }} viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 2 2 Q 50 20 98 2" fill="none" stroke={isEven ? '#2563eb' : '#dc2626'} strokeWidth="3" strokeLinecap="round" /></svg>
                                        )}
                                    </span>
                                );

                                // Advance running counter by syllable length
                                currentGlobalIndex += textContent.length;
                                return renderedSyllable;
                            });
                        })()}
                        {/* DEBUG TEXT */}

                    </span>
                ) : (
                    <span>{word.word}</span>
                )}
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
    if (prev.onUpdateWordColor !== next.onUpdateWordColor) return false; // New prop comparison

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
