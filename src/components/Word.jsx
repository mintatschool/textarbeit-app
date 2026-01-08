import React, { useMemo, useCallback } from 'react';
import { Icons } from './Icons';
import { getCachedSyllables, CLUSTERS } from '../utils/syllables';

const Word = React.memo(({ word, prefix, suffix, startIndex, isHighlighted, highlightedIndices, isHidden, toggleHighlights, toggleHidden, hideYellowLetters, activeTool, activeColor, onEditMode, manualSyllables, hyphenator, settings, isReadingMode, wordColors, colorPalette, domRef, isGrouped, isSelection, hidePunctuation }) => {
    const wordKey = `${word}_${startIndex}`;
    const syllables = useMemo(() => manualSyllables || getCachedSyllables(word, hyphenator), [word, manualSyllables, hyphenator]);

    // Attach ref to span
    const refForWord = useCallback((node) => {
        if (domRef) {
            domRef(startIndex, node);
        }
    }); // Remove dependency array to update on every render? Or just [domRef]
    // Actually, if we remove deps, it updates every time.
    // If domRef changes (it does in App.jsx), we need to update.
    // So [domRef, startIndex] is correct IF domRef identity changes.
    // App.jsx creates new domRef function every render.
    // So this IS updating.
    // But maybe we need to be deeper?

    // Helpers
    const resolveColor = (colorCode) => {
        if (!colorCode) return 'transparent';
        if (colorCode === 'yellow') return 'yellow';
        if (typeof colorCode === 'string' && colorCode.startsWith('palette-')) {
            const idx = parseInt(colorCode.split('-')[1], 10);
            return colorPalette && colorPalette[idx] ? colorPalette[idx] : 'transparent';
        }
        return colorCode; // Legacy hex fallback
    };

    // 4. Logik: Visuelle Verbindung (Visual Glue)
    const clusterConnections = useMemo(() => {
        const bindsRight = new Set();
        if (!settings.smartSelection) return bindsRight;
        const activeClusters = settings.clusters || CLUSTERS;
        let currentSyllableStartIndex = 0;
        syllables.forEach(syl => {
            const lowerSyl = syl.toLowerCase();
            for (const cluster of activeClusters) {
                let idx = lowerSyl.indexOf(cluster);
                while (idx !== -1) {
                    if ((cluster === 'st' || cluster === 'sp') && idx !== 0) {
                        idx = lowerSyl.indexOf(cluster, idx + 1);
                        continue;
                    }
                    for (let k = 0; k < cluster.length - 1; k++) bindsRight.add(startIndex + currentSyllableStartIndex + idx + k);
                    idx = lowerSyl.indexOf(cluster, idx + 1);
                }
            }
            currentSyllableStartIndex += syl.length;
        });
        return bindsRight;
    }, [word, syllables, settings.smartSelection, startIndex]);

    // 3. Logik: Intelligente Auswahl (findClusterIndices)
    const findClusterIndices = (clickedGlobalIndex) => {
        if (!settings.smartSelection) return [clickedGlobalIndex];
        const relativeIndex = clickedGlobalIndex - startIndex;
        let currentSylStart = 0; let targetSylIndex = -1; let indexInSyl = -1;
        for (let i = 0; i < syllables.length; i++) { const sylLen = syllables[i].length; if (relativeIndex >= currentSylStart && relativeIndex < currentSylStart + sylLen) { targetSylIndex = i; indexInSyl = relativeIndex - currentSylStart; break; } currentSylStart += sylLen; }
        if (targetSylIndex === -1) return [clickedGlobalIndex];
        const sylText = syllables[targetSylIndex].toLowerCase();
        const activeClusters = settings.clusters || CLUSTERS;
        for (let cluster of activeClusters) {
            const len = cluster.length;
            for (let offset = 0; offset < len; offset++) {
                const start = indexInSyl - offset;
                if (start < 0 || start + len > sylText.length) continue;
                if ((cluster === 'st' || cluster === 'sp') && start !== 0) continue;
                if (sylText.substring(start, start + len) === cluster) return Array.from({ length: len }, (_, k) => startIndex + currentSylStart + start + k);
            }
        }
        return [clickedGlobalIndex];
    };

    const handleInteraction = useCallback((e, globalIndex) => {
        e.stopPropagation();
        if (isReadingMode) return;
        if (activeTool === 'split') {
            onEditMode(word, wordKey, syllables);
            return;
        } else if (activeTool === 'blur') {
            if (isHighlighted) {
                toggleHidden(wordKey);
            }
            return;
        }

        const isWrapperClick = typeof globalIndex !== 'number';

        if (isWrapperClick) {
            // This block should basically NEVER be reached if activeColor === 'yellow'
            // because we disabled the onClick in the JSX.
            // But we keep the safety check just in case.
            if (activeColor === 'yellow') return;

            // Standard/Neutral/Color Mode -> Toggle Whole Word
            const wordIndices = Array.from({ length: word.length }, (_, i) => startIndex + i);
            toggleHighlights(wordIndices);
        } else {
            // Clicked a Specific Character
            if (activeColor === 'yellow') {
                const indicesToToggle = findClusterIndices(globalIndex);
                // FIX: Allow multiple markings in same word (Removed clearColors/unmarkIndices)
                toggleHighlights(indicesToToggle);
            } else {
                const wordIndices = Array.from({ length: word.length }, (_, i) => startIndex + i);
                toggleHighlights(wordIndices);
            }
        }
    }, [isReadingMode, activeTool, activeColor, settings.smartSelection, word, wordKey, syllables, startIndex, onEditMode, toggleHidden, toggleHighlights]);

    const showSyllables = (settings.displayTrigger === 'always' || (isHighlighted && settings.displayTrigger === 'click') || isGrouped) && settings.visualType !== 'none';
    let cursorClass = isReadingMode ? 'cursor-default' : (activeTool === 'split' ? 'cursor-alias' : (activeTool === 'blur' ? 'cursor-not-allowed' : 'cursor-pointer'));

    // Safety: If Yellow mode and wrapper hovered, show default cursor to indicate non-interactivity of wrapper
    if (activeColor === 'yellow' && cursorClass === 'cursor-pointer') {
        // Logic refined in wrapperCursorClass
    }
    const wrapperCursorClass = (activeColor === 'yellow' && !activeTool && !isReadingMode) ? 'cursor-default' : cursorClass;

    const isZoomed = !activeTool && !isReadingMode && settings.zoomActive && isHighlighted;

    // Fix: Calculate firstCharColor robustly
    let firstCharColor = 'transparent';
    if (wordColors && Object.keys(wordColors).length > 0) {
        for (let i = 0; i < word.length; i++) {
            const idx = startIndex + i;
            const colorCode = wordColors[idx]; // Could be 'yellow', 'palette-0', or '#hex'
            const resolved = resolveColor(colorCode);

            if (resolved && resolved !== 'transparent' && colorCode !== 'yellow') {
                firstCharColor = resolved;
                break;
            }
        }
    }
    const zoomScale = settings.zoomScale || 1.2;

    const currentFontSize = isZoomed ? settings.fontSize * zoomScale : settings.fontSize;

    const wordSpacingStyle = {
        marginRight: `${(settings.wordSpacing ?? 0)}em`,
        zIndex: isZoomed ? 20 : 'auto',
        fontSize: `${currentFontSize}px`,
        lineHeight: 1,
        transition: 'font-size 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s ease'
    };
    const renderPrefix = () => !hidePunctuation && prefix ? <span className="text-slate-900 pointer-events-none">{prefix}</span> : null;
    const renderSuffix = () => !hidePunctuation && suffix ? <span className="text-slate-900 pointer-events-none">{suffix}</span> : null;

    if (isHidden) return <span onClick={() => !isReadingMode && (activeTool === 'blur' || !activeTool) && toggleHidden(wordKey)} className={`blur-container transition-all ${cursorClass}`} style={wordSpacingStyle}><span className="blur-content" style={{ lineHeight: 1 }}>{prefix}{word}{suffix}</span></span>;

    const isNeutralMarked = (isHighlighted && firstCharColor === 'transparent') || (isGrouped && activeColor === 'neutral');
    const isColorMarked = isHighlighted && firstCharColor !== 'transparent';

    const markerBase = (isHighlighted || isGrouped) && (isNeutralMarked || isColorMarked || (isGrouped && activeColor === 'neutral')) ? 'border-2 rounded-lg pt-0.5 pb-1 px-1' : '';
    const markerBorder = isNeutralMarked ? 'border-slate-300/80' : 'border-transparent';
    const markerClass = `${markerBase} ${markerBorder}`;
    const backgroundColor = isColorMarked ? firstCharColor : 'transparent';

    // Unified Rendering - use when syllables shouldn't be shown OR when color marked (but NOT when neutral marked)
    if (!showSyllables || (isColorMarked && !isNeutralMarked)) {
        return (
            <span
                ref={refForWord}
                className={`inline-block select-none transition-all origin-center ${wrapperCursorClass}`}
                style={{
                    ...wordSpacingStyle,
                    backgroundColor: 'transparent',
                }}
                // DISABLE WRAPPER CLICK IN YELLOW MODE
                onClick={(e) => !isReadingMode && (activeTool === 'split' || activeTool === 'blur' || activeColor !== 'yellow') && handleInteraction(e)}
            >
                {renderPrefix()}
                <span
                    className={`inline-block ${markerClass} ${isNeutralMarked || isColorMarked ? 'mx-0.5' : ''} ${isSelection && !isNeutralMarked ? 'animate-pulse bg-slate-100 rounded-lg' : ''}`}
                    style={{
                        backgroundColor: isNeutralMarked ? 'transparent' : (isSelection ? '#e2e8f0' : backgroundColor),
                        color: isColorMarked ? 'black' : undefined
                    }}
                >
                    {word.split('').map((char, i) => {
                        const globalIndex = startIndex + i;
                        const isYellow = wordColors && wordColors[globalIndex] === 'yellow';

                        const glueLeft = highlightedIndices.has(globalIndex - 1) && clusterConnections.has(globalIndex - 1);
                        const glueRight = highlightedIndices.has(globalIndex + 1) && clusterConnections.has(globalIndex);

                        let rounded = 'rounded';
                        let charClassName = `inline-block px-px transition-transform ${isColorMarked ? '' : 'hover:bg-slate-100'} cursor-pointer`;

                        let charStyle = {};

                        if (isYellow) {
                            charClassName += ' bg-yellow-100';

                            // Check visual adjacency regardless of smartSelection setting for cohesive look
                            const simpleLeft = wordColors && wordColors[globalIndex - 1] === 'yellow';
                            const simpleRight = wordColors && wordColors[globalIndex + 1] === 'yellow';

                            // Determine rounded corners based on adjacency
                            // Used for BOTH yellow highlight AND hidden grey box
                            if (simpleLeft && simpleRight) {
                                rounded = 'rounded-none';
                                charClassName += ' shadow-border-yellow-mid';
                            } else if (simpleLeft) {
                                rounded = 'rounded-r-md rounded-l-none';
                                charClassName += ' shadow-border-yellow-right';
                            } else if (simpleRight) {
                                rounded = 'rounded-l-md rounded-r-none';
                                charClassName += ' shadow-border-yellow-left';
                            } else {
                                // Standalone
                                rounded = 'rounded-md';
                                charClassName += ' shadow-border-yellow';
                            }
                        }

                        const shouldHideLetter = isYellow && hideYellowLetters;

                        return (
                            <span
                                key={i}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => !activeTool && !isReadingMode && handleInteraction(e, globalIndex)} // Char Click
                                className={`${charClassName} ${rounded} ${shouldHideLetter ? 'blur-letter' : ''} ${shouldHideLetter && rounded === 'rounded-none' ? '!rounded-none' : ''} ${shouldHideLetter && rounded.includes('rounded-l-none') ? '!rounded-l-none' : ''} ${shouldHideLetter && rounded.includes('rounded-r-none') ? '!rounded-r-none' : ''}`}
                                style={charStyle}
                            >
                                <span className={shouldHideLetter ? 'blur-letter-content' : ''}>
                                    {char}
                                </span>
                            </span>
                        );
                    })}
                </span>
                {renderSuffix()}
            </span>
        );
    }

    // Syllable View
    let charCounter = 0;
    return (
        <span
            ref={refForWord}
            className={`inline-flex items-baseline whitespace-nowrap transition-all origin-center relative group leading-none ${wrapperCursorClass}`}
            style={wordSpacingStyle}
            // DISABLE WRAPPER CLICK IN YELLOW MODE
            onClick={(e) => !isReadingMode && (activeTool === 'split' || activeTool === 'blur' || activeColor !== 'yellow' || ['light_blue', 'silben', 'none'].includes(settings.clickAction)) && handleInteraction(e)}
        >
            {renderPrefix()}
            <span className={`inline-flex items-baseline ${markerClass} ${isNeutralMarked || isColorMarked ? 'mx-0.5' : ''} ${isSelection && !isNeutralMarked ? 'animate-pulse bg-slate-100 rounded-lg' : ''}`} style={{ backgroundColor: 'transparent' }}>
                {syllables.map((syl, sIdx) => {
                    const currentStart = charCounter;
                    charCounter += syl.length;
                    const isEven = sIdx % 2 === 0;
                    let arcColor = isEven ? '#2563eb' : '#dc2626';
                    let bgClass = isEven ? 'bg-blue-100' : 'bg-blue-200';

                    return (
                        <span key={sIdx} className={`inline-block relative leading-none ${settings.visualType === 'block' ? ('mx-[1px] px-[2px] rounded ' + bgClass + ' border border-blue-200/50 shadow-sm') : 'mx-0'}`} style={settings.visualType === 'block' ? { minHeight: '1em', display: 'inline-flex', alignItems: 'flex-end', paddingBottom: '0.1em' } : { height: '1em' }}>
                            <span className={`inline-block relative z-10 ${settings.visualType === 'black_gray' ? (isEven ? 'text-black' : 'text-gray-400') : ''}`}>
                                {syl.split('').map((char, cIdx) => {
                                    const globalIndex = startIndex + currentStart + cIdx;
                                    const isYellow = wordColors && wordColors[globalIndex] === 'yellow';

                                    const glueLeft = highlightedIndices.has(globalIndex - 1) && clusterConnections.has(globalIndex - 1);
                                    const glueRight = highlightedIndices.has(globalIndex + 1) && clusterConnections.has(globalIndex);

                                    let charStyleClass = 'text-slate-900';
                                    if (settings.visualType === 'black_gray') charStyleClass = isEven ? 'text-black' : 'text-gray-400';

                                    let rounded = 'rounded-sm';
                                    let customClasses = 'px-px cursor-pointer';
                                    let style = {};

                                    if (isYellow) {
                                        style = { backgroundColor: '#feffc7' };
                                        customClasses += ' bg-yellow-100';

                                        const simpleLeft = wordColors && wordColors[globalIndex - 1] === 'yellow';
                                        const simpleRight = wordColors && wordColors[globalIndex + 1] === 'yellow';

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

                                    const shouldHideLetter = isYellow && hideYellowLetters;

                                    return (
                                        <span
                                            key={cIdx}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => (activeTool || !isReadingMode) && handleInteraction(e, globalIndex)}
                                            className={`inline-block select-none transition-all duration-200 leading-none pb-0.5 pt-0 ${charStyleClass} ${rounded} ${customClasses} ${shouldHideLetter ? 'blur-letter' : ''} ${shouldHideLetter && rounded === 'rounded-none' ? '!rounded-none' : ''} ${shouldHideLetter && rounded.includes('rounded-l-none') ? '!rounded-l-none' : ''} ${shouldHideLetter && rounded.includes('rounded-r-none') ? '!rounded-r-none' : ''}`}
                                            style={style}
                                        >
                                            <span className={shouldHideLetter ? 'blur-letter-content' : ''}>
                                                {char}
                                            </span>
                                        </span>
                                    );
                                })}
                            </span>
                            {settings.visualType === 'arc' && <svg className="arc-svg pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 2 2 Q 50 20 98 2" fill="none" stroke={arcColor} strokeWidth="8" strokeLinecap="round" /></svg>}
                        </span>
                    );
                })}
            </span>
            {renderSuffix()}
        </span>
    );

}, (prev, next) => {
    if (prev.highlightedIndices !== next.highlightedIndices || prev.wordColors !== next.wordColors) return false;
    return (
        prev.word === next.word &&
        prev.prefix === next.prefix &&
        prev.suffix === next.suffix &&
        prev.isHidden === next.isHidden &&
        prev.hideYellowLetters === next.hideYellowLetters &&
        prev.activeTool === next.activeTool &&
        prev.settings === next.settings &&
        prev.activeColor === next.activeColor && // ADDED VITAL COMPARISON
        prev.isGrouped === next.isGrouped &&
        prev.isSelection === next.isSelection &&
        prev.toggleHighlights === next.toggleHighlights && // Fix for stale closure
        prev.isReadingMode === next.isReadingMode &&
        prev.hyphenator === next.hyphenator &&
        prev.colorPalette === next.colorPalette &&
        prev.hidePunctuation === next.hidePunctuation &&
        true // refs are stable
    );
});

export { Word };
