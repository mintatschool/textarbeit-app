import React, { useMemo, useCallback } from 'react';
import { Icons } from './Icons';
import { getCachedSyllables, CLUSTERS } from '../utils/syllables';

export const Word = React.memo(({ word, prefix, suffix, startIndex, isHighlighted, highlightedIndices, isHidden, toggleHighlights, toggleHidden, activeTool, onEditMode, manualSyllables, hyphenator, settings, isReadingMode }) => {
    const wordKey = `${word}_${startIndex}`;
    const syllables = useMemo(() => manualSyllables || getCachedSyllables(word, hyphenator), [word, manualSyllables, hyphenator]);

    const clusterConnections = useMemo(() => {
        const bindsRight = new Set();
        if (!settings.smartSelection) return bindsRight;
        let currentSyllableStartIndex = 0;
        syllables.forEach(syl => {
            const lowerSyl = syl.toLowerCase();
            for (const cluster of CLUSTERS) {
                let idx = lowerSyl.indexOf(cluster);
                while (idx !== -1) {
                    // Logic: "st" and "sp" only connect at start of syllable
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

    const findClusterIndices = (clickedGlobalIndex) => {
        if (!settings.smartSelection) return [clickedGlobalIndex];
        const relativeIndex = clickedGlobalIndex - startIndex;
        let currentSylStart = 0; let targetSylIndex = -1; let indexInSyl = -1;
        for (let i = 0; i < syllables.length; i++) { const sylLen = syllables[i].length; if (relativeIndex >= currentSylStart && relativeIndex < currentSylStart + sylLen) { targetSylIndex = i; indexInSyl = relativeIndex - currentSylStart; break; } currentSylStart += sylLen; }
        if (targetSylIndex === -1) return [clickedGlobalIndex];
        const sylText = syllables[targetSylIndex].toLowerCase();
        for (let cluster of CLUSTERS) {
            const len = cluster.length;
            for (let offset = 0; offset < len; offset++) {
                const start = indexInSyl - offset;
                if (start < 0 || start + len > sylText.length) continue;

                // Logic: "st" and "sp" only connect at start of syllable
                if ((cluster === 'st' || cluster === 'sp') && start !== 0) continue;

                if (sylText.substring(start, start + len) === cluster) return Array.from({ length: len }, (_, k) => startIndex + currentSylStart + start + k);
            }
        }
        return [clickedGlobalIndex];
    };

    const handleInteraction = useCallback((e, globalIndex) => { e.stopPropagation(); if (isReadingMode) return; if (activeTool === 'split') { onEditMode(word, wordKey, syllables); return; } else if (activeTool === 'blur') { toggleHidden(wordKey); return; } if (settings.clickAction === 'light_blue' || settings.clickAction === 'none') { const wordIndices = Array.from({ length: word.length }, (_, i) => startIndex + i); toggleHighlights(wordIndices); } else { if (typeof globalIndex === 'number') toggleHighlights(findClusterIndices(globalIndex)); } }, [isReadingMode, activeTool, settings.clickAction, settings.smartSelection, word, wordKey, syllables, startIndex, onEditMode, toggleHidden, toggleHighlights]);

    const showSyllables = settings.displayTrigger === 'always' || (isHighlighted && settings.displayTrigger === 'click');
    let cursorClass = isReadingMode ? 'cursor-default' : (activeTool === 'split' ? 'cursor-alias' : (activeTool === 'blur' ? 'cursor-not-allowed' : 'cursor-pointer'));
    const isZoomed = !activeTool && !isReadingMode && settings.zoomActive && isHighlighted;
    const isLightBlueMode = settings.clickAction === 'light_blue' && isHighlighted;
    const zoomScale = settings.zoomScale || 1.2;

    // Use dynamic font size for zooming to naturally push away neighbors
    const currentFontSize = isZoomed ? settings.fontSize * zoomScale : settings.fontSize;

    const wordSpacingStyle = {
        marginRight: `${(settings.wordSpacing ?? 0)}em`,
        zIndex: isZoomed ? 20 : 'auto',
        fontSize: `${currentFontSize}px`,
        lineHeight: 1,
        transition: 'font-size 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s ease'
    };
    const renderPrefix = () => prefix ? <span className="text-slate-900">{prefix}</span> : null;
    const renderSuffix = () => suffix ? <span className="text-slate-900">{suffix}</span> : null;

    if (isHidden) return <span onClick={() => !isReadingMode && (activeTool === 'blur' || !activeTool) && toggleHidden(wordKey)} className={`blur-container transition-all ${cursorClass}`} style={wordSpacingStyle}><span className="blur-content" style={{ lineHeight: 1 }}>{prefix}{word}{suffix}</span></span>;
    if (!showSyllables) { return (<span className={`inline-block select-none transition-all origin-center ${cursorClass} ${isLightBlueMode ? 'bg-blue-200 rounded-md px-0' : ''}`} style={wordSpacingStyle} onClick={(e) => !isReadingMode && (activeTool === 'split' || activeTool === 'blur' || settings.clickAction === 'light_blue' || settings.clickAction === 'none') && handleInteraction(e)}>{renderPrefix()}{word.split('').map((char, i) => <span key={i} onClick={(e) => !activeTool && !isReadingMode && handleInteraction(e, startIndex + i)} className={`inline-block rounded px-px transition-transform hover:bg-slate-100 ${isLightBlueMode ? 'text-black' : ''}`}>{char}</span>)}{renderSuffix()}</span>); }
    let charCounter = 0;
    return (
        <span role="button" tabIndex={0} onKeyDown={(e) => { if (!isReadingMode && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleInteraction(e); } }} className={`inline-flex items-baseline whitespace-nowrap transition-all origin-center relative group leading-none ${cursorClass} ${isLightBlueMode ? 'bg-blue-200 rounded-md shadow-sm' : ''}`} style={wordSpacingStyle} onClick={(e) => !isReadingMode && (activeTool === 'split' || activeTool === 'blur' || settings.clickAction === 'light_blue' || settings.clickAction === 'none') && handleInteraction(e)}>
            {renderPrefix()}
            {syllables.map((syl, sIdx) => {
                const currentStart = charCounter;
                charCounter += syl.length;
                const isEven = sIdx % 2 === 0;
                let arcColor = isEven ? '#2563eb' : '#dc2626';
                let bgClass = isLightBlueMode ? 'bg-transparent' : (isEven ? 'bg-blue-100' : 'bg-blue-200');

                return (
                    <span key={sIdx} className={`inline-block relative leading-none ${settings.visualType === 'block' ? (isLightBlueMode ? 'mx-0' : 'mx-[1px] px-[2px] rounded ' + bgClass + ' border border-blue-200/50 shadow-sm') : 'mx-0'}`} style={settings.visualType === 'block' ? { minHeight: '1em', display: 'inline-flex', alignItems: 'flex-end', paddingBottom: '0.1em' } : { height: '1em' }}>
                        <span className={`inline-block relative z-10 ${settings.visualType === 'black_gray' ? (isEven ? 'text-black' : 'text-gray-400') : ''}`}>
                            {syl.split('').map((char, cIdx) => {
                                const relativeIndex = currentStart + cIdx;
                                const globalIndex = startIndex + relativeIndex;
                                const isCharClicked = highlightedIndices.has(globalIndex);
                                let charStyle = 'text-slate-900';
                                let margin = 'mx-px';
                                let rounded = 'rounded-sm';

                                if (settings.visualType === 'black_gray') charStyle = isEven ? 'text-black' : 'text-gray-400';

                                if (isCharClicked && !isLightBlueMode) {
                                    if (settings.clickAction === 'yellow_border') {
                                        const glueLeft = highlightedIndices.has(globalIndex - 1) && clusterConnections.has(globalIndex - 1);
                                        const glueRight = highlightedIndices.has(globalIndex + 1) && clusterConnections.has(globalIndex);
                                        if (settings.smartSelection && (glueLeft || glueRight)) {
                                            margin = 'mx-0';
                                            charStyle += ' bg-yellow-100';
                                            if (glueLeft && glueRight) { rounded = 'rounded-none'; charStyle += ' shadow-border-yellow-mid'; }
                                            else if (glueLeft) { rounded = 'rounded-r-sm rounded-l-none'; charStyle += ' shadow-border-yellow-right'; }
                                            else if (glueRight) { rounded = 'rounded-l-sm rounded-r-none'; charStyle += ' shadow-border-yellow-left'; }
                                        } else {
                                            charStyle += ' shadow-border-yellow bg-yellow-100';
                                        }
                                    } else if (settings.clickAction === 'dark_blue') charStyle = 'text-blue-900 font-bold scale-110';
                                }
                                if (isLightBlueMode) charStyle = 'text-black';

                                return <span key={cIdx} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => !activeTool && !isReadingMode && handleInteraction(e, globalIndex)} className={`inline-block select-none transition-all duration-200 leading-none pb-0.5 pt-0 ${charStyle} ${margin} ${rounded}`}>{char}</span>;
                            })}
                        </span>
                        {settings.visualType === 'arc' && !isLightBlueMode && <svg className="arc-svg pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 2 2 Q 50 20 98 2" fill="none" stroke={arcColor} strokeWidth="8" strokeLinecap="round" /></svg>}
                    </span>
                );
            })}
            {renderSuffix()}
        </span>
    );
}, (prev, next) => {
    // If indices set changed, we must re-render if this word could be affected
    if (prev.highlightedIndices !== next.highlightedIndices) {
        // Simple but safe: if the word range overlaps with any change, we'd ideally know,
        // but since we don't have the diff here, we check if the word is or WAS highlighted.
        // Even safer: if highlightedIndices changes at all, we re-render this word to be sure.
        // Performance is still okay because React's virtual DOM diffing is fast.
        return false;
    }
    return (
        prev.word === next.word &&
        prev.prefix === next.prefix &&
        prev.suffix === next.suffix &&
        prev.isHidden === next.isHidden &&
        prev.activeTool === next.activeTool &&
        prev.settings === next.settings &&
        prev.isReadingMode === next.isReadingMode &&
        prev.hyphenator === next.hyphenator
    );
});
