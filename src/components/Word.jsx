import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { getCachedSyllables, CLUSTERS } from '../utils/syllables';

const Word = React.memo(({ word, prefix, suffix, startIndex, isHighlighted, highlightedIndices = new Set(), isHidden, toggleHighlights, toggleHidden, hideYellowLetters, activeTool, activeColor, onEditMode, manualSyllables, hyphenator, settings, isReadingMode, wordColors = {}, colorPalette, domRef, isGrouped, isSelection, hidePunctuation, onMouseEnter, onMouseDown, onTouchStart, isTextMarkerMode, drawings = [], onUpdateDrawings, forceNoMargin, forceShowSyllables, isHeadline, hideSelectionFrame }) => {
    const wordKey = `${word}_${startIndex}`;
    const syllables = useMemo(() => manualSyllables || getCachedSyllables(word, hyphenator), [word, manualSyllables, hyphenator]);

    // Attach ref to span
    const refForWord = useCallback((node) => {
        if (domRef) {
            domRef(startIndex, node);
        }
    }, [startIndex]);
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

    // 4. Logik: Visuelle Verbindung (Visual Glue) - Full Word Search
    const clusterConnections = useMemo(() => {
        const bindsRight = new Set();
        if (!settings.smartSelection) return bindsRight;
        const activeClusters = settings.clusters || CLUSTERS;
        const lowerWord = word.toLowerCase();

        // Calculate Syllable Start Indices (for st/sp rule)
        const syllableStarts = new Set();
        let acc = 0;
        syllables.forEach(s => { syllableStarts.add(acc); acc += s.length; });

        for (const cluster of activeClusters) {
            let idx = lowerWord.indexOf(cluster);
            while (idx !== -1) {
                // Special Rule for 'st' and 'sp': Only valid if at the START of a syllable (Anlaut)
                if ((cluster === 'st' || cluster === 'sp') && !syllableStarts.has(idx)) {
                    idx = lowerWord.indexOf(cluster, idx + 1);
                    continue;
                }

                for (let k = 0; k < cluster.length - 1; k++) bindsRight.add(startIndex + idx + k);
                idx = lowerWord.indexOf(cluster, idx + 1);
            }
        }
        return bindsRight;
    }, [word, syllables, settings.smartSelection, startIndex, settings.clusters]);

    // 3. Logik: Intelligente Auswahl (findClusterIndices) - Full Word Search
    const findClusterIndices = (clickedGlobalIndex) => {
        if (!settings.smartSelection) return [clickedGlobalIndex];
        const relativeIndex = clickedGlobalIndex - startIndex;
        const activeClusters = settings.clusters || CLUSTERS;
        const lowerWord = word.toLowerCase();

        // Calculate Syllable Start Indices (for st/sp rule)
        const syllableStarts = new Set();
        let acc = 0;
        syllables.forEach(s => { syllableStarts.add(acc); acc += s.length; });

        // Iterate over all clusters to see if the click falls into one
        for (let cluster of activeClusters) {
            let idx = lowerWord.indexOf(cluster);
            while (idx !== -1) {
                // Special Rule for 'st' and 'sp': Only valid if at the START of a syllable
                if ((cluster === 'st' || cluster === 'sp') && !syllableStarts.has(idx)) {
                    idx = lowerWord.indexOf(cluster, idx + 1);
                    continue;
                }

                // Check if click is within this occurrence
                if (relativeIndex >= idx && relativeIndex < idx + cluster.length) {
                    return Array.from({ length: cluster.length }, (_, k) => startIndex + idx + k);
                }

                idx = lowerWord.indexOf(cluster, idx + 1);
            }
        }
        return [clickedGlobalIndex];
    };

    const handleInteraction = useCallback((e, globalIndex) => {
        if (isReadingMode || activeTool === 'pen' || isTextMarkerMode) return;
        e.stopPropagation();
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
    }, [isReadingMode, activeTool, activeColor, isTextMarkerMode, settings.smartSelection, word, wordKey, syllables, startIndex, onEditMode, toggleHidden, toggleHighlights]);

    const hasLetters = /[a-zA-Z\u00C0-\u017F]/.test(word);
    const showSyllables = hasLetters && (forceShowSyllables || settings.displayTrigger === 'always' || (isHighlighted && settings.displayTrigger === 'click') || isGrouped) && settings.visualType !== 'none';
    let cursorClass = isReadingMode ? 'cursor-default' : (activeTool === 'split' ? 'cursor-alias' : (activeTool === 'blur' ? 'cursor-not-allowed' : 'cursor-pointer'));

    // Safety: If Yellow mode and wrapper hovered, show default cursor to indicate non-interactivity of wrapper
    if (activeColor === 'yellow' && cursorClass === 'cursor-pointer') {
        // Logic refined in wrapperCursorClass
    }
    const wrapperCursorClass = isTextMarkerMode ? 'cursor-text' : ((activeColor === 'yellow' && !activeTool && !isReadingMode) ? 'cursor-default' : cursorClass);

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
        marginRight: (isTextMarkerMode || forceNoMargin) ? '0px' : `${(settings.wordSpacing ?? 0)}em`,
        zIndex: isZoomed ? 20 : 'auto',
        fontSize: `${currentFontSize}px`,
        fontFamily: settings.fontFamily, // Explicitly set for better reliability
        lineHeight: settings.lineHeight || 1.3,
        letterSpacing: `${(settings.letterSpacing ?? 0)}em`,
        fontWeight: isHeadline ? 'bold' : 'normal',

    };
    const renderPrefix = () => !hidePunctuation && prefix ? <span className="text-slate-900 pointer-events-none">{prefix}</span> : null;
    const renderSuffix = () => !hidePunctuation && suffix ? <span className="text-slate-900 pointer-events-none">{suffix}</span> : null;

    // --- Drawing Logic ---
    const [currentPath, setCurrentPath] = useState([]);
    const svgRef = useRef(null);
    const isPenMode = activeTool === 'pen';
    const isEraser = activeColor === 'transparent';
    const isPenEraser = isPenMode && isEraser;
    const isPenDraw = isPenMode && !isEraser;

    const handleStartDraw = (e) => {
        if (!isPenDraw) return;
        e.stopPropagation();
        e.preventDefault(); // Prevent touch scrolling / mouse emulation
        e.target.setPointerCapture(e.pointerId);
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCurrentPath([{ x, y }]);
    };

    const handleDrawMove = (e) => {
        if (!isPenDraw || currentPath.length === 0) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCurrentPath(prev => [...prev, { x, y }]);
    };

    const handleEndDraw = (e) => {
        if (!isPenDraw || currentPath.length === 0) return;
        e.target.releasePointerCapture(e.pointerId);

        // Save Path
        const newDrawing = {
            points: currentPath,
            color: activeColor === 'yellow' ? '#fde047' : resolveColor(activeColor), // Use resolved hex
            relativeWidth: 0.5, // Save relative width for potential future variable widths
            strokeWidth: isZoomed ? (settings.fontSize * (settings.zoomScale || 1.2)) / 2 : (settings.fontSize / 2) // Fallback absolute
        };

        const nextDrawings = drawings ? [...drawings, newDrawing] : [newDrawing];
        onUpdateDrawings(startIndex, nextDrawings);
        setCurrentPath([]);
    };

    const handleDeleteDrawing = (index) => {
        if (!drawings) return;
        const next = [...drawings];
        next.splice(index, 1);
        onUpdateDrawings(startIndex, next);
    };

    const convertPointsToPath = (points) => {
        if (!points || points.length === 0) return "";
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return d;
    };

    const drawingLayer = (

        <svg
            ref={svgRef}
            className={`absolute inset-0 w-full h-full z-30 ${isPenDraw ? 'pointer-events-auto touch-none cursor-crosshair' : 'pointer-events-none'}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ overflow: 'visible' }}
            onPointerDown={(e) => {
                if (isPenDraw) {
                    e.stopPropagation();
                    e.preventDefault();
                    handleStartDraw(e);
                }
            }}
            onPointerMove={handleDrawMove}
            onPointerUp={handleEndDraw}
            onPointerLeave={handleEndDraw}
        >
            {drawings && drawings.map((d, idx) => (
                <path
                    key={idx}
                    d={convertPointsToPath(d.points)}
                    stroke={d.color || 'orange'}
                    strokeWidth={currentFontSize ? currentFontSize * (d.relativeWidth || 0.5) : 12}
                    vectorEffect="non-scaling-stroke"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isPenEraser ? "pointer-events-auto cursor-crosshair hover:opacity-50" : "pointer-events-none"}
                    onPointerDown={(e) => {
                        if (isPenEraser) {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteDrawing(idx);
                        }
                    }}
                    onPointerEnter={(e) => {
                        if (isPenEraser && (e.buttons === 1)) {
                            handleDeleteDrawing(idx);
                        }
                    }}
                />
            ))}
            {currentPath.length > 0 && (
                <path
                    d={convertPointsToPath(currentPath)}
                    stroke={resolveColor(activeColor)}
                    strokeWidth={currentFontSize ? currentFontSize / 2 : 24}
                    vectorEffect="non-scaling-stroke"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
        </svg>
    );
    // ---------------------

    const isColorMarked = firstCharColor !== 'transparent';
    const isNeutralMarked = (isHighlighted && !isColorMarked) || (isGrouped && !isColorMarked);

    const showFrame = (isHighlighted || isGrouped) && !hideSelectionFrame;

    // Use different style for Textmarker (isColorMarked) to create a continuous line
    // Use linear scaling units (em) instead of fixed px to ensure drawing overlay matches
    // PERSISTENCE: Apply marker styling if colored, even if not in Marker Mode
    // Use box-shadow (ring) instead of border to prevent layout shifts
    const markerBase = showFrame
        ? 'rounded-lg' // removed border-2
        : (isColorMarked ? 'rounded-none' : 'rounded-lg');

    // Outline Logic (Layout-neutral, unlike box-shadow with spread)
    // If showFrame: Outline Ring (Slate)
    // If Textmarker: No Ring (or specific marker ring if designed)
    // Neutral: No Ring
    const outlineStyle = showFrame
        ? { outline: '3px solid rgba(203, 213, 225, 0.8)' } // slate-300/80
        : { outline: 'none' };

    const markerClass = `${markerBase}`;

    // Standardize styling to reserve layout space (prevent jumps)
    // Frame/Neutral: Visually expand into whitespace using negative margins
    // Old Padding: 0.15em. New Padding: 0.30em. Margin: -0.15em. Net Effect: 0.15em (Same as before)
    // Standardize styling to reserve layout space (prevent jumps)
    // Frame/Neutral: Visually expand into whitespace using negative margins
    // Old Padding: 0.15em. New Padding: 0.30em. Margin: -0.15em. Net Effect: 0.15em (Same as before)
    // Standardize styling to reserve layout space (prevent jumps)
    // Frame/Neutral: Zero Net Width Impact
    // The padding visually expands the background, the negative margin pulls the flow back.
    // Net result: 0em horizontal space consumed. Frame floats over whitespace.
    // Net result: 0em horizontal space consumed. Frame floats over whitespace.

    const frameStyle = {
        paddingTop: '0em',
        paddingBottom: '0.10em', // Unified vertical padding
        paddingLeft: '0.10em',
        paddingRight: '0.10em',
        marginTop: '-0.25em',
        marginBottom: '-0.10em', // Matches paddingBottom for net zero vertical impact
        marginLeft: '-0.10em',
        marginRight: '-0.10em',
        lineHeight: '1.1'        // FORCE compact line height to reduce box height
    };

    const markerStyle = showFrame
        ? frameStyle
        : (isColorMarked
            // Textmarker: Now using shared frameStyle to ensure identical heights
            ? frameStyle
            : frameStyle
        );

    if (isHidden) {
        return (
            <span
                onClick={() => !isReadingMode && (activeTool === 'blur' || !activeTool) && toggleHidden(wordKey)}
                className={`blur-container ${cursorClass}`}
                style={wordSpacingStyle}
            >
                <span
                    className={`inline-block ${markerClass}`}
                    style={{
                        marginRight: '0',
                        marginLeft: '0',
                        ...markerStyle,
                        ...outlineStyle,
                        backgroundColor: 'transparent'
                    }}
                >
                    <span className="blur-content" style={{ lineHeight: 1 }}>{prefix}{word}{suffix}</span>
                </span>
            </span>
        );
    }

    const backgroundColor = isColorMarked ? firstCharColor : 'transparent';

    // Unified Rendering - use when syllables shouldn't be shown OR when color marked with block style
    // Exception: For black_gray and arc visualTypes, we CAN show syllables even with color marking
    const skipSyllablesForColor = isColorMarked && !isNeutralMarked && settings.visualType === 'block';
    const shouldNestBlock = settings.visualType === 'block' && isColorMarked;

    const renderedContent = (
        <>
            {renderPrefix()}
            {word.split('').map((char, i) => {
                const globalIndex = startIndex + i;
                const isYellow = wordColors && wordColors[globalIndex] === 'yellow';

                let rounded = 'rounded';
                let charClassName = `inline-block leading-none ${isColorMarked ? '' : 'hover:bg-slate-100'} cursor-pointer`;

                // Default char padding in em - Perfectly balanced (padding = -margin) for zero layout shift
                // REDUCED paddingBottom to 0.10em (User Request: "Enger heran")
                // INCREASED horizontal padding/margin to 0.06em to prevent gaps in highlighting (Opaque colors allow overlap without stripes)
                let charStyle = { transition: 'none', paddingLeft: '0.06em', paddingRight: '0.06em', paddingTop: '0em', paddingBottom: '0.10em', marginLeft: '-0.06em', marginRight: '-0.06em', marginTop: '0em', marginBottom: '-0.10em' };

                // Detect generic color (non-yellow) and apply to character for continuous stroke
                const charColorCode = wordColors && wordColors[globalIndex];
                const resolvedCharColor = resolveColor(charColorCode);

                if (isYellow) {
                    charClassName += ' bg-yellow-200';

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
                } else if (resolvedCharColor && resolvedCharColor !== 'transparent') {
                    // Generic Color Marker Logic (e.g. Peach, Green)
                    // Apply background color to character to leverage the negative margin overlap
                    charStyle = {
                        ...charStyle,
                        backgroundColor: resolvedCharColor,
                        // Ensure rounded-none for continuous block look, or add logic if needed
                    };
                    rounded = 'rounded-none';
                }

                const shouldHideLetter = isYellow && hideYellowLetters;

                return (
                    <span
                        key={i}
                        data-paint-index={globalIndex}
                        onMouseDown={(e) => {
                            // Removed e.stopPropagation() to allow drag-and-drop bubbling
                        }}
                        onClick={(e) => {
                            // Prevent highlighting in Marker/Pen/Reading modes
                            if (isTextMarkerMode || activeTool === 'pen' || isReadingMode) return;
                            handleInteraction(e, globalIndex);
                        }}
                        className={`${charClassName} ${rounded} ${shouldHideLetter ? 'blur-letter' : ''} transition-none duration-0`}
                        style={charStyle}
                        onMouseEnter={(e) => {
                            if ((activeTool === 'pen' || isTextMarkerMode) && onMouseEnter) {
                                onMouseEnter(globalIndex, e);
                            }
                        }}
                        onPointerEnter={(e) => {
                            if ((activeTool === 'pen' || isTextMarkerMode) && onMouseEnter && e.buttons === 1) {
                                onMouseEnter(globalIndex, e);
                            }
                        }}
                    >
                        <span className={shouldHideLetter ? 'blur-letter-content' : ''}>
                            {char}
                        </span>
                    </span>
                );
            })}
            {renderSuffix()}
            {/* Drawing Layer */}
            {drawingLayer}
        </>
    );

    if (!showSyllables || skipSyllablesForColor) {
        return (
            <span
                ref={refForWord}
                data-paint-index={startIndex}
                className={`inline-block whitespace-nowrap origin-center relative group ${wrapperCursorClass} ${isTextMarkerMode || activeTool === 'pen' ? 'touch-none' : ''}`}
                style={{
                    ...wordSpacingStyle,
                    lineHeight: 'normal',
                    backgroundColor: 'transparent',
                }}
                // FIX: Simplified event handlers for reliable paint/erase detection
                onMouseEnter={(e) => {
                    // Always trigger in Textmarker or Pen modes if we have a callback
                    if ((isTextMarkerMode || activeTool === 'pen') && onMouseEnter) {
                        onMouseEnter(startIndex, e);
                    }
                }}
                onPointerEnter={(e) => {
                    // Backup for pointer events (more reliable on some devices)
                    if ((isTextMarkerMode || activeTool === 'pen') && onMouseEnter && e.buttons === 1) {
                        onMouseEnter(startIndex, e);
                    }
                }}
                onMouseDown={(e) => {
                    if (isTextMarkerMode || activeTool === 'pen') {
                        e.preventDefault();
                        if (onMouseDown) onMouseDown(startIndex, e);
                    }
                }}
                onTouchStart={(e) => {
                    if (onTouchStart) onTouchStart(startIndex, e);
                }}
                onClick={(e) => !isReadingMode && !isTextMarkerMode && activeTool !== 'pen' && (activeTool === 'split' || activeTool === 'blur' || activeColor !== 'yellow') ? handleInteraction(e) : null}
            >
                <span
                    className={`inline-block ${markerClass} ${isNeutralMarked ? '' : ''} ${isSelection && !isNeutralMarked ? 'bg-slate-100 rounded-lg' : ''}`}
                    style={{
                        marginRight: '0', // Fixed 0 to use word spacing only
                        marginLeft: '0',
                        ...outlineStyle,
                        // If nested, frame is transparent (unless selection). If merged, frame takes color.
                        backgroundColor: shouldNestBlock ? (isSelection ? '#e2e8f0' : 'transparent') : (isNeutralMarked ? 'transparent' : (isSelection ? '#e2e8f0' : backgroundColor)),
                        color: isColorMarked ? 'black' : undefined,
                        // Removed lineHeight: 1 to allow natural font metrics to define box height
                        ...markerStyle
                    }}
                >
                    {shouldNestBlock ? (
                        <span className="rounded shadow-sm" style={{
                            display: 'inline-block',
                            paddingBottom: '0.10em', // Matched to frame padding
                            paddingLeft: '0.02em', paddingRight: '0.02em',
                            marginLeft: '-0.02em', marginRight: '-0.02em', // Compensate for padding to prevent line extension
                            marginBottom: '-0.10em', // Compensate for paddingBottom
                            backgroundColor: backgroundColor
                        }}>
                            {renderedContent}
                        </span>
                    ) : renderedContent}
                </span>
            </span>
        );
    }

    // Syllable View
    let charCounter = 0;
    return (
        <span
            ref={refForWord}
            data-paint-index={startIndex}
            className={`inline-block whitespace-nowrap origin-center relative group ${wrapperCursorClass} ${isTextMarkerMode || activeTool === 'pen' ? 'touch-none' : ''}`}
            style={{ ...wordSpacingStyle, lineHeight: 'normal' }}
            // FIX: Simplified event handlers for reliable paint/erase detection
            onMouseEnter={(e) => {
                // Always trigger in Textmarker or Pen modes if we have a callback
                if ((isTextMarkerMode || activeTool === 'pen') && onMouseEnter) {
                    onMouseEnter(startIndex, e);
                }
            }}
            onPointerEnter={(e) => {
                // Backup for pointer events (more reliable on some devices)
                if ((isTextMarkerMode || activeTool === 'pen') && onMouseEnter && e.buttons === 1) {
                    onMouseEnter(startIndex, e);
                }
            }}
            onMouseDown={(e) => {
                if (isTextMarkerMode || activeTool === 'pen') {
                    e.preventDefault();
                    if (onMouseDown) onMouseDown(startIndex, e);
                }
            }}
            onTouchStart={(e) => {
                if (onTouchStart) onTouchStart(startIndex, e);
            }}
            onClick={(e) => !isReadingMode && !isTextMarkerMode && activeTool !== 'pen' && (activeTool === 'split' || activeTool === 'blur' || activeColor !== 'yellow') ? handleInteraction(e) : null}
        >
            {renderPrefix()}
            <span className={`inline-block ${markerClass} ${isSelection && !isNeutralMarked ? 'animate-pulse bg-slate-100 rounded-lg' : ''}`} style={{ backgroundColor: isColorMarked ? backgroundColor : 'transparent', marginLeft: '0', marginRight: '0', ...outlineStyle, ...markerStyle }}>
                {(() => {
                    let visualCounter = 0;
                    const visualIndices = syllables.map(s => {
                        const hasLetters = /[a-zA-Z\u00C0-\u017F]/.test(s);
                        return hasLetters ? visualCounter++ : -1;
                    });

                    return syllables.map((syl, sIdx) => {
                        const currentStart = charCounter;
                        charCounter += syl.length;

                        const vIdx = visualIndices[sIdx];
                        const isVisualSyllable = vIdx !== -1;
                        const isEven = isVisualSyllable ? vIdx % 2 === 0 : false;

                        let arcColor = isEven ? '#2563eb' : '#dc2626';
                        let bgClass = isEven ? 'bg-blue-100' : 'bg-blue-200';

                        return (
                            <span key={sIdx} className={`relative leading-none ${settings.visualType === 'block' ? ('rounded ' + bgClass) : ''}`} style={settings.visualType === 'block' ? {
                                marginLeft: '0', marginRight: '0',
                                paddingLeft: '0', paddingRight: '0',
                                display: 'inline-block', // Changed to inline-block for better control
                                paddingBottom: '0.10em', // Match frame padding
                                lineHeight: '1.0',
                                // removed width: 100% to prevent layout issues
                                boxShadow: 'inset 0 0 0 1px rgba(191, 219, 254, 0.5)' // Inset border replacement (blue-200/50)
                            } : { display: 'inline-block', paddingBottom: '0.10em', marginLeft: '0', marginRight: '0' }}>
                                <span className={`inline-block relative z-10 ${settings.visualType === 'black_gray' ? (isEven ? 'text-black' : 'text-gray-400') : ''}`}>
                                    {syl.split('').map((char, cIdx) => {
                                        const globalIndex = startIndex + currentStart + cIdx;
                                        const isYellow = wordColors && wordColors[globalIndex] === 'yellow';

                                        const glueLeft = highlightedIndices.has(globalIndex - 1) && clusterConnections.has(globalIndex - 1);
                                        const glueRight = highlightedIndices.has(globalIndex + 1) && clusterConnections.has(globalIndex);

                                        let charStyleClass = 'text-slate-900';
                                        if (settings.visualType === 'black_gray') charStyleClass = isEven ? 'text-black' : 'text-gray-400';

                                        let rounded = 'rounded-sm';
                                        let customClasses = 'cursor-pointer';
                                        // INCREASED to 0.06em to close gaps
                                        let style = { transition: 'none', paddingLeft: '0.06em', paddingRight: '0.06em', marginLeft: '-0.06em', marginRight: '-0.06em' };

                                        // Detect generic color (non-yellow) and apply to character for continuous stroke
                                        const charColorCode = wordColors && wordColors[globalIndex];
                                        const resolvedCharColor = resolveColor(charColorCode);

                                        if (isYellow) {
                                            style = { transition: 'none', backgroundColor: '#fef08a', paddingLeft: '0.06em', paddingRight: '0.06em', paddingTop: '0em', paddingBottom: '0.10em', marginLeft: '-0.06em', marginRight: '-0.06em', marginTop: '0em', marginBottom: '-0.10em' };
                                            customClasses += ' bg-yellow-200';

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
                                        } else if (resolvedCharColor && resolvedCharColor !== 'transparent') {
                                            // Generic Color Marker Logic (e.g. Peach, Green)
                                            style = {
                                                transition: 'none',
                                                backgroundColor: resolvedCharColor,
                                                // Apply same metric fix as yellow to ensure stroke continuity
                                                paddingLeft: '0.06em', paddingRight: '0.06em',
                                                paddingTop: '0em', paddingBottom: '0.10em',
                                                marginLeft: '-0.06em', marginRight: '-0.06em',
                                                marginTop: '0em', marginBottom: '-0.10em'
                                            };
                                            // Make it look like a marker block
                                            rounded = 'rounded-none';

                                            // Optional: Add rounded logic for start/end of color blocks if desired, 
                                            // but for now simple block is safer for continuity.
                                        }

                                        const shouldHideLetter = isYellow && hideYellowLetters;

                                        return (
                                            <span
                                                key={cIdx}
                                                data-paint-index={globalIndex}
                                                onMouseDown={(e) => {
                                                    // Removed e.stopPropagation() to allow drag-and-drop bubbling
                                                }}
                                                onClick={(e) => {
                                                    // Prevent highlighting in Marker/Pen/Reading modes
                                                    if (isTextMarkerMode || activeTool === 'pen' || isReadingMode) return;
                                                    handleInteraction(e, globalIndex);
                                                }}
                                                className={`${customClasses} ${rounded} inline-block leading-none ${shouldHideLetter ? 'blur-letter' : ''} transition-none duration-0`}
                                                style={style}
                                                onMouseEnter={(e) => {
                                                    if ((activeTool === 'pen' || isTextMarkerMode) && onMouseEnter) {
                                                        onMouseEnter(globalIndex, e);
                                                    }
                                                }}
                                                onPointerEnter={(e) => {
                                                    if ((activeTool === 'pen' || isTextMarkerMode) && onMouseEnter && e.buttons === 1) {
                                                        onMouseEnter(globalIndex, e);
                                                    }
                                                }}
                                            >
                                                <span className={shouldHideLetter ? 'blur-letter-content' : ''}>
                                                    {char}
                                                </span>
                                            </span>
                                        );
                                    })}
                                </span>
                                {settings.visualType === 'arc' && isVisualSyllable && <svg className="arc-svg pointer-events-none" style={{ zIndex: 20 }} viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 2 2 Q 50 20 98 2" fill="none" stroke={arcColor} strokeWidth="3" strokeLinecap="round" /></svg>}
                            </span>
                        );
                    });
                })()}

            </span>
            {renderSuffix()}
            {/* Drawing Layer */}
            {drawingLayer}
        </span >
    );

}, (prev, next) => {
    // OPTIMIZATION: Ignore function props (onMouseEnter, onMouseDown, toggleHighlights, etc.)
    // Only compare relevant state/data props
    if (prev.word !== next.word) return false;
    if (prev.startIndex !== next.startIndex) return false;
    // Settings check - assuming object identity might change but content matters
    if (prev.settings.fontSize !== next.settings.fontSize || prev.settings.fontFamily !== next.settings.fontFamily || prev.settings.visualType !== next.settings.visualType || prev.settings.displayTrigger !== next.settings.displayTrigger) return false;

    if (prev.activeTool !== next.activeTool) return false;
    if (prev.activeColor !== next.activeColor) return false;
    if (prev.isTextMarkerMode !== next.isTextMarkerMode) return false;
    if (prev.isReadingMode !== next.isReadingMode) return false;
    if (prev.isHidden !== next.isHidden) return false;
    if (prev.isGrouped !== next.isGrouped) return false;
    if (prev.isSelection !== next.isSelection) return false;
    if (prev.forceShowSyllables !== next.forceShowSyllables) return false;
    // Drawings check (reference mostly sufficient as arrays are replaced)
    if (prev.drawings !== next.drawings) return false;

    // Derived/Complex checks
    if (prev.highlightedIndices !== next.highlightedIndices) {
        // Only re-render if indices RELEVANT to this word (plus neighbors for glue/rounding) have changed
        const start = prev.startIndex - 1;
        const end = prev.startIndex + prev.word.length; // Inclusive check up to +1 neighbor
        let changed = false;
        // Check range [startIndex-1 ... startIndex+length] (Right neighbor is at startIndex+length)
        for (let i = start; i <= end; i++) {
            if (prev.highlightedIndices.has(i) !== next.highlightedIndices.has(i)) {
                changed = true;
                break;
            }
        }
        if (changed) return false;
    }

    if (prev.wordColors !== next.wordColors) {
        // Only re-render if colors RELEVANT to this word (plus neighbors) have changed
        const start = prev.startIndex - 1;
        const end = prev.startIndex + prev.word.length;
        let changed = false;
        for (let i = start; i <= end; i++) {
            if (prev.wordColors[i] !== next.wordColors[i]) {
                changed = true;
                break;
            }
        }
        if (changed) return false;
    }

    return (
        prev.word === next.word &&
        prev.prefix === next.prefix &&
        prev.suffix === next.suffix &&
        prev.isHidden === next.isHidden &&
        prev.hideYellowLetters === next.hideYellowLetters &&
        prev.activeTool === next.activeTool &&
        prev.settings === next.settings &&
        prev.activeColor === next.activeColor &&
        prev.isTextMarkerMode === next.isTextMarkerMode && // Fix: Propagate marker mode changes
        prev.forceNoMargin === next.forceNoMargin &&
        prev.isGrouped === next.isGrouped &&
        prev.isSelection === next.isSelection &&
        prev.toggleHighlights === next.toggleHighlights && // Fix for stale closure
        prev.isReadingMode === next.isReadingMode &&
        prev.hyphenator === next.hyphenator &&
        prev.colorPalette === next.colorPalette &&
        prev.hidePunctuation === next.hidePunctuation &&
        prev.drawings === next.drawings && // Update on drawings change
        prev.isHeadline === next.isHeadline &&
        prev.hideSelectionFrame === next.hideSelectionFrame &&
        true // refs are stable
    );
});

export { Word };
