import React from 'react';
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
        && (settings.displayTrigger === 'always' || settings.displayTrigger === 'click')
        && settings.visualType !== 'none'
        && word.syllables;

    const handleCharClick = (e, absCharIndex, sylObj, cIdx) => {
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
            if (toggleHighlights) toggleHighlights(indicesToToggle);
        }
    };

    return (
        <div
            draggable
            onDragStart={(e) => { e.stopPropagation(); onDragStart(e, 'word', word, colId, idx); }}
            onDragEnd={onDragEnd}
            onDrop={(e) => onDrop(e, colId, idx)}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing group relative select-none touch-action-none"
            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
        >
            <div className="text-center pointer-events-auto">
                {showSyllables ? (
                    <span className="inline-block whitespace-nowrap">
                        {word.syllables.map((s, i) => {
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
                                // For Arcs: Text is slate-900 (Black), ONLY Arcs are colored.
                                // For Colored: Text IS colored.
                                if (settings.visualType === 'arc') {
                                    textClass = "text-slate-900";
                                } else {
                                    textClass = isEven ? "text-blue-700" : "text-red-600";
                                }
                            } else {
                                textClass = "text-slate-900";
                            }

                            return (
                                <span key={i} className={`inline-block relative leading-none ${styleClass}`}>
                                    <span className="relative z-10">
                                        {textContent.split('').map((char, cIdx) => {
                                            const absCharIndex = sylObj.absStartIndex !== undefined ? sylObj.absStartIndex + cIdx : null;
                                            // Specific Yellow check
                                            const isCharHighlighted = absCharIndex !== null && wordColors && wordColors[absCharIndex] === 'yellow';

                                            let rounded = 'rounded px-[2px]'; // Default for non-highlighted
                                            let customClasses = 'cursor-pointer hover:bg-slate-200 transition-colors';
                                            let style = {};

                                            if (isCharHighlighted) {
                                                // Exact styling match from Word.jsx
                                                style = { backgroundColor: '#feffc7', paddingTop: '0.02em', paddingBottom: '0.04em', marginTop: '-0.02em', marginBottom: '-0.02em' };
                                                customClasses = 'cursor-pointer bg-yellow-100'; // Remove transition-colors to fix "dimming"

                                                // Neighbor Check for Continuous Blocks
                                                const simpleLeft = wordColors && wordColors[absCharIndex - 1] === 'yellow';
                                                const simpleRight = wordColors && wordColors[absCharIndex + 1] === 'yellow';

                                                if (simpleLeft && simpleRight) {
                                                    rounded = 'rounded-none';
                                                    customClasses += ' shadow-border-yellow-mid';
                                                } else if (simpleLeft) {
                                                    rounded = 'rounded-r-md rounded-l-none';
                                                    customClasses += ' shadow-border-yellow-right';
                                                } else if (simpleRight) {
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
                                                >
                                                    {char}
                                                </span>
                                            );
                                        })}
                                    </span>
                                    {settings.visualType === 'arc' && !sylObj.isSpace && (
                                        <svg className="arc-svg pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 2 2 Q 50 20 98 2" fill="none" stroke={isEven ? '#2563eb' : '#dc2626'} strokeWidth="3" strokeLinecap="round" /></svg>
                                    )}
                                </span>
                            );
                        })}
                    </span>
                ) : (
                    <span>{word.word}</span>
                )}
            </div>

            <button onClick={(e) => { e.stopPropagation(); onRemoveWord(word.id); }} className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white min-touch-target cursor-pointer z-20">
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
    return true; // Props equal (enough), skip render
});
