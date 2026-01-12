import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { getCachedSyllables, CLUSTERS } from '../utils/syllables';

const Word = React.memo(({ word, prefix, suffix, startIndex, isHighlighted, highlightedIndices = new Set(), isHidden, toggleHighlights, toggleHidden, hideYellowLetters, activeTool, activeColor, onEditMode, manualSyllables, hyphenator, settings, isReadingMode, wordColors = {}, colorPalette, domRef, isGrouped, isSelection, hidePunctuation, onMouseEnter, onMouseDown, isTextMarkerMode, drawings = [], onUpdateDrawings, forceNoMargin, forceShowSyllables }) => {
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
        if (isReadingMode || activeTool === 'pen' || isTextMarkerMode) return;
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
        lineHeight: 1,
        letterSpacing: `${(settings.letterSpacing ?? 0)}em`,
        transition: 'font-size 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s ease'
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

    const showFrame = isHighlighted || isGrouped;

    // Use different style for Textmarker (isColorMarked) to create a continuous line
    // Use linear scaling units (em) instead of fixed px to ensure drawing overlay matches
    // PERSISTENCE: Apply marker styling if colored, even if not in Marker Mode
    const markerBase = (showFrame || isColorMarked)
        ? (showFrame ? 'border-2 rounded-lg' : 'rounded-none')
        : '';
    const markerBorder = showFrame ? 'border-slate-300/80' : (isColorMarked ? 'border-0' : 'border-transparent');
    const markerClass = `${markerBase} ${markerBorder}`;
    const markerStyle = (showFrame || isColorMarked)
        ? ((!showFrame && isColorMarked)
            ? { paddingTop: '0.05em', paddingBottom: '0.15em', paddingLeft: '0', paddingRight: '0', marginBottom: '-0.15em', marginTop: '-0.05em' }
            : { paddingTop: '0.05em', paddingBottom: '0.05em', paddingLeft: '0.15em', paddingRight: '0.15em' }
        ) : {};

    if (isHidden) {
        return (
            <span
                onClick={() => !isReadingMode && (activeTool === 'blur' || !activeTool) && toggleHidden(wordKey)}
                className={`blur-container transition-all ${cursorClass}`}
                style={wordSpacingStyle}
            >
                <span
                    className={`inline-block ${markerClass}`}
                    style={{
                        marginRight: showFrame ? '0.05em' : '0',
                        marginLeft: showFrame ? '0.05em' : '0',
                        ...markerStyle,
                        borderColor: 'transparent',
                        backgroundColor: 'transparent'
                    }}
                >
                    <span className="blur-content" style={{ lineHeight: 1 }}>{prefix}{word}{suffix}</span>
                </span>
            </span>
        );
    }

    const backgroundColor = isColorMarked ? firstCharColor : 'transparent';

    // Unified Rendering - use when syllables shouldn't be shown OR when color marked (but NOT when neutral marked)
    if (!showSyllables || (isColorMarked && !isNeutralMarked)) {
        return (
            <span
                ref={refForWord}
                data-paint-index={startIndex}
                className={`inline-block relative select-none transition-all origin-center ${wrapperCursorClass}`}
                style={{
                    ...wordSpacingStyle,
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
                onClick={(e) => !isReadingMode && !isTextMarkerMode && activeTool !== 'pen' && (activeTool === 'split' || activeTool === 'blur' || activeColor !== 'yellow') ? handleInteraction(e) : null}
            >
                <span
                    className={`inline-block ${markerClass} ${isNeutralMarked ? '' : ''} ${isSelection && !isNeutralMarked ? 'animate-pulse bg-slate-100 rounded-lg' : ''}`}
                    style={{
                        marginRight: showFrame ? '0.05em' : '0',
                        marginLeft: showFrame ? '0.05em' : '0',
                        backgroundColor: isNeutralMarked ? 'transparent' : (isSelection ? '#e2e8f0' : backgroundColor),
                        color: isColorMarked ? 'black' : undefined,
                        ...markerStyle
                    }}
                >
                    {renderPrefix()}
                    {word.split('').map((char, i) => {
                        const globalIndex = startIndex + i;
                        const isYellow = wordColors && wordColors[globalIndex] === 'yellow';

                        const glueLeft = highlightedIndices.has(globalIndex - 1) && clusterConnections.has(globalIndex - 1);
                        const glueRight = highlightedIndices.has(globalIndex + 1) && clusterConnections.has(globalIndex);

                        let rounded = 'rounded';

                        let charClassName = `inline-block leading-none transition-transform ${isColorMarked ? '' : 'hover:bg-slate-100'} cursor-pointer`;

                        // Default char padding in em - Adjusted for better coverage (descenders)
                        let charStyle = { paddingLeft: '0.02em', paddingRight: '0.02em', paddingTop: '0.02em', paddingBottom: '0.18em', marginTop: '-0.02em', marginBottom: '-0.16em' };

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
                                data-paint-index={globalIndex}
                                onMouseDown={(e) => {
                                    // FIX: Allow propagation in Paint/Eraser modes (Textmarker or Pen)
                                    // This ensures the App's global handlePaint (via Wrapper onMouseDown) receives the event to start the drag state.
                                    if (!isTextMarkerMode && activeTool !== 'pen') {
                                        e.stopPropagation();
                                    }
                                }}
                                onClick={(e) => {
                                    // Prevent highlighting in Marker/Pen/Reading modes
                                    if (isTextMarkerMode || activeTool === 'pen' || isReadingMode) return;
                                    handleInteraction(e, globalIndex);
                                }}
                                className={`${charClassName} ${rounded} ${shouldHideLetter ? 'blur-letter' : ''}`}
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
            className={`inline-flex items-baseline whitespace-nowrap transition-all origin-center relative group leading-none ${wrapperCursorClass}`}
            style={wordSpacingStyle}
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
            onClick={(e) => !isReadingMode && !isTextMarkerMode && activeTool !== 'pen' && (activeTool === 'split' || activeTool === 'blur' || activeColor !== 'yellow') ? handleInteraction(e) : null}
        >
            {renderPrefix()}
            <span className={`inline-flex items-baseline ${markerClass} ${isSelection && !isNeutralMarked ? 'animate-pulse bg-slate-100 rounded-lg' : ''}`} style={{ backgroundColor: 'transparent', marginLeft: isNeutralMarked ? '0.05em' : '0', marginRight: isNeutralMarked ? '0.05em' : '0', ...markerStyle }}>
                {syllables.map((syl, sIdx) => {
                    const currentStart = charCounter;
                    charCounter += syl.length;
                    const isEven = sIdx % 2 === 0;
                    let arcColor = isEven ? '#2563eb' : '#dc2626';
                    let bgClass = isEven ? 'bg-blue-100' : 'bg-blue-200';

                    return (

                        <span key={sIdx} className={`inline-block relative leading-none ${settings.visualType === 'block' ? ('rounded ' + bgClass + ' border border-blue-200/50 shadow-sm') : ''}`} style={settings.visualType === 'block' ? { marginLeft: '0.02em', marginRight: '0.02em', paddingLeft: '0.05em', paddingRight: '0.05em', minHeight: '1.2em', display: 'inline-flex', alignItems: 'flex-end', paddingBottom: '0.15em' } : { height: '1.1em', marginLeft: '0', marginRight: '0' }}>
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
                                    let style = { paddingLeft: '0.02em', paddingRight: '0.02em' };

                                    if (isYellow) {
                                        style = { backgroundColor: '#feffc7', paddingTop: '0.02em', paddingBottom: '0.04em', marginTop: '-0.02em', marginBottom: '-0.02em' };
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
                                            data-paint-index={globalIndex}
                                            onMouseDown={(e) => {
                                                // Allow propagation in paint modes for drag detection
                                                if (!isTextMarkerMode && activeTool !== 'pen') {
                                                    e.stopPropagation();
                                                }
                                            }}
                                            onClick={(e) => {
                                                // Prevent highlighting in Marker/Pen/Reading modes
                                                if (isTextMarkerMode || activeTool === 'pen' || isReadingMode) return;
                                                handleInteraction(e, globalIndex);
                                            }}
                                            className={`${customClasses} ${rounded} inline-block leading-none ${shouldHideLetter ? 'blur-letter' : ''}`}
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
                            {settings.visualType === 'arc' && <svg className="arc-svg pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 2 2 Q 50 20 98 2" fill="none" stroke={arcColor} strokeWidth="3" strokeLinecap="round" /></svg>}
                        </span>
                    );
                })}
            </span>
            {renderSuffix()}
            {/* Drawing Layer */}
            {drawingLayer}
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
        true // refs are stable
    );
});

export { Word };
