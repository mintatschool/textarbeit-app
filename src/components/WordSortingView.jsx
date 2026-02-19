import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icons } from './Icons';
import { RewardModal } from './shared/RewardModal';
import { Word } from './Word';
import { EmptyStateMessage } from './EmptyStateMessage';
import { shuffleArray } from '../utils/arrayUtils';
import { ProgressBar } from './ProgressBar';


// Min 0.4, Max 4.8 (approx +20% of 4.0), Default 5 (Index 4)
const SPEEDS = [0.4, 0.6, 0.8, 1.0, 1.3, 1.7, 2.2, 2.8, 3.5, 4.0, 4.4, 4.8];

// Helper to resolve palette colors
const resolveColor = (colorCode, colorPalette) => {
    if (!colorCode) return '#f1f5f9';
    if (colorCode === 'yellow') return '#facc15';
    if (typeof colorCode === 'string' && colorCode.startsWith('palette-')) {
        const idx = parseInt(colorCode.split('-')[1], 10);
        return colorPalette && colorPalette[idx] ? colorPalette[idx] : '#64748b';
    }
    return colorCode;
};

// Speed slider color (matches Blitzlesen)
const getSliderColor = (lvl) => {
    if (lvl <= 4) return '#22c55e'; // Green
    if (lvl <= 8) return '#fbbf24'; // Amber
    return '#fb923c'; // Orange
};

export const WordSortingView = ({
    columnsState,
    settings,
    setSettings,
    onClose,
    title = "Wörter sortieren",
    wordColors,
    highlightedIndices = new Set(),
    colorPalette = [],
    textCorrections = {},
    hideYellowLetters = false,
}) => {
    const [speedLevel, setSpeedLevel] = useState(5);
    const [score, setScore] = useState(0);
    const [wordsQueue, setWordsQueue] = useState([]);
    const [currentWord, setCurrentWord] = useState(null);
    const [wordX, setWordX] = useState(-200);
    const [validColumns, setValidColumns] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);
    const [selectedWordId, setSelectedWordId] = useState(null);
    const selectedWordIdRef = useRef(null);
    const [isWrong, setIsWrong] = useState(false);
    const [sortedWords, setSortedWords] = useState({});
    const [totalWords, setTotalWords] = useState(0);
    const [beltStopped, setBeltStopped] = useState(false);

    const [userInteractionPause, _setUserInteractionPause] = useState(false);
    const userInteractionPauseRef = useRef(false);
    const setUserInteractionPause = useCallback((v) => {
        userInteractionPauseRef.current = v;
        _setUserInteractionPause(v);
    }, []);
    // Random rotation angle for each word (-15 to +15 degrees)
    const [wordRotation, setWordRotation] = useState(0);

    // Pointer-based drag state (replaces HTML5 drag for iPad compatibility)
    const [isDraggingWord, setIsDraggingWord] = useState(false);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [hoveredColId, setHoveredColId] = useState(null);
    const columnElsRef = useRef({}); // { colId: HTMLElement }
    const itemsContainerRefs = useRef({}); // { colId: HTMLElement }
    const wordElRef = useRef(null);
    const pointerStartRef = useRef(null); // track if it was a tap vs drag
    const [hasErrors, setHasErrors] = useState(false);

    // Prevent page scroll during pointer drag (iPad)
    useEffect(() => {
        if (!isDraggingWord) return;
        const prevent = (e) => e.preventDefault();
        document.addEventListener('touchmove', prevent, { passive: false });
        return () => document.removeEventListener('touchmove', prevent);
    }, [isDraggingWord]);

    const containerRef = useRef(null);
    const beltRef = useRef(null);
    const animationRef = useRef(null);
    const lastTimeRef = useRef(null);
    const rampLength = 300; // Distance over which the ramp effect applies

    // Initialize
    useEffect(() => {
        if (!columnsState || !columnsState.order || !columnsState.cols) {
            return;
        }

        const cols = columnsState.order
            .map(id => columnsState.cols[id])
            .filter(c => c && c.title && c.title.trim() !== '' && c.items && c.items.length > 0);

        if (cols.length < 2) {
            setErrorMsg("Bitte erstelle mindestens zwei Spalten mit Überschriften und Wörtern in der Tabelle.");
            return;
        }
        setValidColumns(cols);

        // Initialize sorted words storage (empty)
        const initial = {};
        cols.forEach(c => { initial[c.id] = []; });
        setSortedWords(initial);

        // Prepare queue - all words from all columns, shuffled
        const allWords = cols.flatMap(col =>
            col.items.map(w => {
                const lookupKey = `${w.word}_${w.index}`;
                if (textCorrections && textCorrections[lookupKey]) {
                    const newText = textCorrections[lookupKey];
                    return { ...w, word: newText, correctColId: col.id };
                }
                return { ...w, correctColId: col.id };
            })
        );
        const shuffled = shuffleArray(allWords);
        setTotalWords(shuffled.length);

        if (shuffled.length > 0) {
            setCurrentWord(shuffled[0]);
            setWordsQueue(shuffled.slice(1));
            setWordX(-200);
            // Set random rotation for first word (-15 to +15 degrees)
            setWordRotation((Math.random() - 0.5) * 30);
        }
    }, [columnsState, textCorrections]);

    // Animation loop - move the single word across the belt
    const animate = useCallback((time) => {
        if (!currentWord || isWrong || userInteractionPauseRef.current) { // Pause on interaction (ref for instant response)
            lastTimeRef.current = null; // Reset delta tracking on pause
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        if (lastTimeRef.current !== null) {
            const delta = time - lastTimeRef.current;
            const speed = SPEEDS[speedLevel - 1] * (delta / 16);

            const beltWidth = beltRef.current?.clientWidth || 800;

            setWordX(prev => {
                // Double-check pause ref inside updater to prevent stale-closure race
                if (userInteractionPauseRef.current) return prev;

                let speedToAdd = speed;

                // Fast Entry Logic: "Geschubst" (Pushed)
                // If before the main belt area (e.g. 60px), move much faster
                // User Request Part 6: "Deutlich schneller" - Dynamic based on slider
                if (prev < 60) {
                    speedToAdd = Math.max(speed * 6, 8); // Significantly increased speed (6x or 8px/frame)
                }

                const newX = prev + speedToAdd;

                // Word went off screen right - re-queue it
                // Adjusted to allow full "drop off" animation before resetting
                // Was `beltWidth + 50`, now maybe `beltWidth + 150` to see the fall?
                if (newX > beltWidth + 200) {
                    // Re-add to queue
                    setWordsQueue(q => [...q, currentWord]);
                    // Get next word
                    if (wordsQueue.length > 0) {
                        const next = wordsQueue[0];
                        setWordsQueue(q => q.slice(1));
                        setCurrentWord(next);
                        // Set new random rotation for next word
                        setWordRotation((Math.random() - 0.5) * 30);
                    }
                    // Reset to Ramp Start Position
                    return -250;
                }
                return newX;
            });
        }
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(animate);
    }, [currentWord, wordsQueue, speedLevel, isWrong]);

    useEffect(() => {
        if (!errorMsg && currentWord) {
            lastTimeRef.current = null;
            animationRef.current = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(animationRef.current);
    }, [animate, errorMsg, currentWord]);

    // Handlers
    const handleWordClick = useCallback(() => {
        if (currentWord && !isWrong) {
            if (selectedWordIdRef.current === 'current') {
                // Deselect → resume belt
                selectedWordIdRef.current = null;
                setSelectedWordId(null);
                setUserInteractionPause(false);
            } else {
                // Select → pause belt so word stays in place
                selectedWordIdRef.current = 'current';
                setSelectedWordId('current');
                setUserInteractionPause(true);
            }
        }
    }, [currentWord, isWrong]);

    const handleColumnClick = useCallback((colId) => {
        if (selectedWordIdRef.current === 'current' && currentWord) {
            checkPlacement(colId);
            selectedWordIdRef.current = null;
            setSelectedWordId(null);
            setUserInteractionPause(false);
        }
    }, [currentWord]);

    const handleRestart = () => {
        setBeltStopped(false);
        setScore(0);
        setHasErrors(false);

        if (!validColumns || validColumns.length === 0) return;

        // Reset sorted words with empty arrays for each column
        const initial = {};
        validColumns.forEach(c => { initial[c.id] = []; });
        setSortedWords(initial);

        // Re-shuffle and start
        const allWords = validColumns.flatMap(col => {
            if (!col || !col.items) return []; // Safety check
            return col.items.map(w => ({ ...w, correctColId: col.id }));
        });

        const shuffled = shuffleArray(allWords);
        setTotalWords(shuffled.length);

        if (shuffled.length > 0) {
            setCurrentWord(shuffled[0]);
            setWordsQueue(shuffled.slice(1));
            setWordX(-250);
            setWordRotation((Math.random() - 0.5) * 30);
        } else {
            setCurrentWord(null);
        }
    };

    // Auto-scroll removed as we use justify-end for "hochrutschen" effect

    // --- Pointer-based drag handlers (iPad-friendly, no bitmap snapshot) ---
    const pointerIdRef = useRef(null);

    const handlePointerDown = (e) => {
        if (!currentWord || isWrong) return;
        e.preventDefault();
        e.stopPropagation();
        setUserInteractionPause(true);
        const el = wordElRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setDragPos({ x: e.clientX, y: e.clientY });
        pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        pointerIdRef.current = e.pointerId;
        // Do NOT enter drag mode yet — wait for pointer to move beyond threshold
        // This prevents opacity-0 flicker and pointer capture issues on iPad taps
    };

    const handlePointerMove = useCallback((e) => {
        if (!currentWord) return;
        const start = pointerStartRef.current;
        if (!start) return; // no active interaction

        // If not yet dragging, check if we exceeded the drag threshold (8px)
        if (!isDraggingWord) {
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            if (Math.sqrt(dx * dx + dy * dy) > 8) {
                // Threshold exceeded → enter drag mode now
                setIsDraggingWord(true);
                const el = wordElRef.current;
                if (el && pointerIdRef.current != null) {
                    try { el.setPointerCapture(pointerIdRef.current); } catch (_) { }
                }
            } else {
                return; // Still below threshold, wait
            }
        }

        e.preventDefault();
        setDragPos({ x: e.clientX, y: e.clientY });

        // Hit-test columns for hover highlight
        let foundCol = null;
        for (const [colId, colEl] of Object.entries(columnElsRef.current)) {
            if (!colEl) continue;
            const r = colEl.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                foundCol = colId;
                break;
            }
        }
        setHoveredColId(foundCol);
    }, [isDraggingWord, currentWord]);

    const handlePointerUp = useCallback((e) => {
        const start = pointerStartRef.current;

        // Release pointer capture immediately so subsequent touches on columns work on iPad
        if (pointerIdRef.current != null && wordElRef.current) {
            try { wordElRef.current.releasePointerCapture(pointerIdRef.current); } catch (_) { }
            pointerIdRef.current = null;
        }

        // Case 1: Was in drag mode → handle drop
        if (isDraggingWord) {
            setIsDraggingWord(false);
            setHoveredColId(null);
            pointerStartRef.current = null;

            if (!currentWord) {
                setUserInteractionPause(false);
                return;
            }

            setUserInteractionPause(false);

            // Hit-test columns for drop
            for (const [colId, colEl] of Object.entries(columnElsRef.current)) {
                if (!colEl) continue;
                const r = colEl.getBoundingClientRect();
                if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                    checkPlacement(colId);
                    return;
                }
            }
            // Dropped outside any column → do nothing (word stays on belt)
            return;
        }

        // Case 2: Never entered drag mode → it's a tap
        if (start && currentWord) {
            pointerStartRef.current = null;
            // handleWordClick manages userInteractionPause itself
            handleWordClick();
            return;
        }

        // Fallback: clean up
        pointerStartRef.current = null;
        setUserInteractionPause(false);
    }, [isDraggingWord, currentWord, handleWordClick]);

    const checkPlacement = (targetColId) => {
        if (!currentWord) return;

        if (currentWord.correctColId === targetColId) {
            // Correct!
            // Play positive feedback sound (optional)
            setSortedWords(prev => ({
                ...prev,
                [targetColId]: [...prev[targetColId], currentWord]
            }));
            setScore(s => s + 1);
            nextWord();
        } else {
            // Wrong!
            // Play negative feedback sound (optional)
            setIsWrong(true);
            setHasErrors(true);

            // Add to correct column as error (gray)
            // Wait for fall animation to start before updating state if needed, 
            // but here we just schedule the state update and next word
            setTimeout(() => {
                setSortedWords(prev => ({
                    ...prev,
                    [currentWord.correctColId]: [...prev[currentWord.correctColId], { ...currentWord, isError: true }]
                }));
                setIsWrong(false);
                nextWord(); // Do NOT re-queue
            }, 600); // 600ms matches animation duration
        }
    };

    const isSelected = selectedWordId === 'current';
    const gameComplete = !currentWord && wordsQueue.length === 0;

    // Handle belt stop on game complete
    useEffect(() => {
        if (gameComplete) {
            const timer = setTimeout(() => setBeltStopped(true), 2000); // Run for 2s then stop
            return () => clearTimeout(timer);
        } else {
            setBeltStopped(false);
        }
    }, [gameComplete]);

    const nextWord = () => {
        if (wordsQueue.length > 0) {
            setCurrentWord(wordsQueue[0]);
            setWordsQueue(q => q.slice(1));
            setWordX(-250);
            // Set new random rotation for next word
            setWordRotation((Math.random() - 0.5) * 30);
        } else {
            setCurrentWord(null);
        }
    };

    // Check if table is unconfigured: no headers or no items at all
    const hasAnyHeader = columnsState?.order?.some(id => columnsState.cols[id]?.title?.trim());
    // STRICTER CHECK: User wants "mindestens in jede Spalte etwas eintragen"
    // So we check if ALL valid columns have items, not just if ANY has items.
    const hasAllColumnsFilled = validColumns.length >= 2 && validColumns.every(c => c.items && c.items.length > 0);

    // Initial checks for safety
    if (!columnsState || !validColumns) return null;

    if (!hasAnyHeader || !hasAllColumnsFilled || validColumns.length < 2) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans">
                <EmptyStateMessage
                    onClose={onClose}
                    message="Die Tabelle ist noch nicht gefüllt!"
                    IconComponent={null}
                    steps={[
                        { text: "In Tabelle Spalten anlegen", icon: Icons.TableInstruction },
                        { text: "Spalten benennen", icon: Icons.TableColumnsInstruction },
                        { text: "Mindestens in jede Spalte etwas eintragen", icon: Icons.TableFillInstruction }
                    ]}
                />
            </div>
        );
    }



    // Dynamic Headroom Calculation
    // We calculate the required height based on the word size to minimize gray area at small zoom levels
    // Word Box estimate: fontSize * 1.35 (line-height) + 24px (padding/border) + 10% (scale hover)
    const wordBoxHeight = (settings.fontSize * 1.35 + 24) * 1.1;
    const headroom = 12; // Minimum space above the word

    // Geometry Constants
    const rollerRadius = 35;
    const axisGap = rollerRadius - 8; // 27px (intersecting belt)
    const beltThickness = 12;

    // Position of the top belt surface relative to container top
    // We want the word to stand on this surface and have 'headroom' space above it
    const topBeltY_Target = wordBoxHeight + headroom;

    // Derive Roller Center from required belt position
    // topBeltY = rollerCenterY - axisGap  =>  rollerCenterY = topBeltY + axisGap
    const rollerCenterY = topBeltY_Target + axisGap;

    // Symmetry & Distance to Axis
    // axisGap calculated above.

    // Top Belt surface
    const topBeltY = rollerCenterY - axisGap;

    // Bottom Belt surface
    // To match symmetry: Center + Gap - Thickness (to align top edge of div?)
    // No, standard symmetry usually means centers of belts are symmetric or inner edges.
    // Let's make inner edges symmetric.
    // Inner gap = axisGap - beltThickness? No that' too close if belts are thick.
    // Let's just place the physical Top/Bottom offset from center symmetrically.
    // Top Div (aligns top): Y = Center - Gap.
    // Bottom Div (aligns top): Y = Center + Gap - 12 (thickness).
    const bottomBeltY = rollerCenterY + axisGap - beltThickness;

    // Belt Area Height
    const beltHeight = bottomBeltY + 50; // Padding below

    // Horizontal Spacing
    // User Request Part 4: "Mehr Abstand zum äußeren Rand"
    const rollerOffset = 30; // Increased from 7 -> 30

    // Belt Surface Offset
    // The belt surface starts where the roller top/bottom tangent ends?
    // Actually visual belt curve is 60px wide centered at rollerOffset.
    // So belt surface should start at rollerOffset + 30 (half curve width)?
    // Or let's keep the relative offset. 
    // Old: rollerOffset=7, beltSurfaceOffset=42 (Diff=35).
    // New: rollerOffset=30 -> beltSurfaceOffset=65.
    const beltSurfaceOffset = 65;

    const progress = totalWords > 0 ? (score / totalWords) * 100 : 0;

    // Interaction Handlers for Rollers
    const handleRollerPress = (e) => {
        e.preventDefault(); // Prevent text selection/drag
        setUserInteractionPause(true);
    };

    const handleRollerRelease = () => {
        setUserInteractionPause(false);
    };

    // Calculate Word styles for Ramp Effect
    const getWordStyle = () => {
        if (!currentWord) return {};

        // Target Y Position
        const targetBottom = beltHeight - topBeltY;

        // "Fast Push" logic
        // The word logic is handled in `animate` for X-position.
        // Here we just handle the visual lift/slide.

        const rampEndX = 40; // User Request: "Weiter links auftreffen" (Reduced from 80)

        if (wordX < rampEndX) {
            // Entry Phase - "Falling" onto the belt
            const p = (wordX + 250) / (rampEndX + 250);
            const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

            const startHeightOffset = 200; // Reduced from 400 to make trajectory shallower
            const yOffset = startHeightOffset * (1 - ease);

            // Rotation: Use pre-generated random rotation (-15 to +15 degrees)
            // Words land at the random angle and gradually flatten to 0
            const rot = wordRotation * (1 - ease);

            return {
                left: `${wordX}px`,
                // Position relative to the belt surface
                bottom: `${targetBottom + yOffset}px`,
                transform: `rotate(${rot}deg) ${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
                opacity: Math.min(1, p * 4),
                transition: 'none' // Procedural
            };
        } else {
            // Locked on Belt - or Falling Off End?
            // Exit Physics
            const beltWidth = beltRef.current?.clientWidth || 800;
            // Define Drop Off Point: The Axis of the Right Roller.
            // Right Roller is at right: `rollerOffset` (30px).
            const rollerAxisX = beltWidth - 30;

            // Calculate Dynamic Word Width
            // Approx: (Char Count * 0.6em * fontSize) + 32px padding
            const estWidth = (currentWord.word.length * settings.fontSize * 0.6) + 32;
            const wordCenterX = wordX + (estWidth / 2);

            // Trigger: Wait until center is slightly PAST the roller face (Axis + 10px cushion)
            // This guarantees we don't start dropping while "on" the roller 
            const triggerPointX = rollerAxisX + 10;

            if (wordCenterX > triggerPointX) {
                // Physics-based Exit: Parabolic trajectory
                // Word maintains horizontal belt speed and falls under gravity
                const distPast = wordCenterX - triggerPointX;

                // Belt speed (pixels per frame at 60fps, approximated)
                const beltSpeed = SPEEDS[speedLevel - 1];

                // Time elapsed since leaving the belt (based on horizontal distance traveled)
                // distPast = beltSpeed * t, so t = distPast / beltSpeed
                const t = distPast / (beltSpeed * 2); // Scale factor for visual effect

                // Gravity constant for parabolic fall: y = 0.5 * g * t^2
                const gravity = 1500; // pixels per second^2 (tuned for visual effect)
                const dropY = -0.5 * gravity * (t * t) / 1000; // Convert to px

                // Rotation: Very gentle forward tip (simulates tipping forward off edge)
                const tipRot = Math.min(30, t * 40); // Max 30 degrees for subtle effect

                // Opacity: Fade out as it falls below view
                const fadeThreshold = -200; // Start fading when 200px below surface
                const opacity = dropY < fadeThreshold ? Math.max(0, 1 - (Math.abs(dropY) - 200) / 300) : 1;

                return {
                    left: `${wordX}px`, // Maintains horizontal velocity (wordX continues advancing)
                    bottom: `${targetBottom + dropY}px`,
                    transform: `rotate(${tipRot}deg) ${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
                    opacity: opacity,
                    transition: 'none',
                    zIndex: 200
                };
            }

            // Normal Belt Travel
            return {
                left: `${wordX}px`,
                bottom: `${targetBottom}px`,
                transform: `${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
                opacity: 1,
                transition: isWrong ? 'none' : 'transform 0.1s linear'
            };
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none overflow-hidden"
            onMouseUp={handleRollerRelease}
            onTouchEnd={handleRollerRelease}
        >
            {/* Header - Blitzlesen Style */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <Icons.WordSorting size={40} className="text-blue-600" />
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-800 leading-tight">{title}</span>
                        <span className="text-base font-black transition-colors duration-200" style={{ color: getSliderColor(speedLevel) }}>
                            Geschwindigkeit {speedLevel}
                        </span>
                    </div>
                </div>

                {/* Speed Slider - Blitzlesen Style - Shifted Up */}
                <div className="flex items-center gap-6 -mt-2">
                    <div className="relative flex flex-col items-center w-[320px] h-10 justify-center">
                        <div className="flex items-center gap-3 w-full">
                            <Icons.Walker size={42} className="text-green-500 shrink-0" />
                            <div className="flex-1 relative h-10 flex items-center">
                                <input
                                    type="range"
                                    min="1"
                                    max="12"
                                    step="1"
                                    value={speedLevel}
                                    onChange={(e) => setSpeedLevel(Number(e.target.value))}
                                    className="w-full appearance-none cursor-pointer transition-all accent-current z-10 relative speed-range"
                                    style={{ color: getSliderColor(speedLevel) }}
                                />
                                {/* Ticks */}
                                <div className="absolute top-1/2 -translate-y-1/2 w-[calc(100%-12px)] left-[6px] flex justify-between pointer-events-none opacity-30">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="w-[1px] h-2 bg-slate-600 rounded-full" />
                                    ))}
                                </div>
                            </div>
                            <Icons.Runner size={42} className="text-orange-500 shrink-0" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Font Size Slider */}
                    {setSettings && (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 h-10 rounded-lg">
                            <span className="text-xs font-bold text-slate-500">A</span>
                            <input
                                type="range"
                                min="16"
                                max="120"
                                step="2"
                                value={settings.fontSize}
                                onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                                className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                            />
                            <span className="text-xl font-bold text-slate-500">A</span>
                        </div>
                    )}

                    <button onClick={onClose} className="bg-red-500 text-white hover:bg-red-600 rounded-lg w-10 h-10 flex items-center justify-center transition-all">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>

            {/* Progress Bar - Treppenwörter Style */}
            <div className="px-6 py-2 bg-white border-b border-slate-200">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative" ref={containerRef}>

                {/* TABLE COLUMNS - Matching WordListView styling */}
                <div
                    className="flex-1 overflow-auto px-6"
                    style={{ paddingBottom: `${beltHeight + 100}px` }}
                >
                    <div className="flex gap-6 min-h-full">
                        {validColumns.map(col => {
                            const bgColor = resolveColor(col.color, colorPalette);
                            const hasColor = !!col.color;

                            // User Request: Match Main View exactly (White text on color)
                            const textColor = hasColor ? 'white' : '#334155';
                            const finalBg = hasColor ? bgColor : '#f8fafc';
                            // Shadow/Border tweaks
                            const borderStyle = hasColor ? 'none' : '1px solid #e2e8f0';

                            return (
                                <div
                                    key={col.id}
                                    ref={(el) => { columnElsRef.current[col.id] = el; }}
                                    data-col-id={col.id}
                                    onClick={() => handleColumnClick(col.id)}
                                    onPointerUp={(e) => {
                                        // iPad: onClick may not fire reliably on touch, so also handle here
                                        if (!isDraggingWord) {
                                            e.stopPropagation();
                                            handleColumnClick(col.id);
                                        }
                                    }}
                                    className={`flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-[280px] transition-all relative
                                        ${isSelected ? 'cursor-pointer ring-4 ring-blue-300 ring-offset-2 border-blue-400' : 'hover:border-slate-300'}
                                        ${hoveredColId === col.id ? 'ring-4 ring-blue-400 bg-blue-50' : ''}
                                    `}
                                    style={{ touchAction: 'manipulation' }}
                                >
                                    {/* Column Header - matches WordListView */}
                                    <div
                                        className="p-3 rounded-t-xl text-center font-bold shadow-sm sticky top-0 z-40"
                                        style={{
                                            backgroundColor: finalBg,
                                            color: textColor,
                                            fontFamily: settings.fontFamily,
                                            fontSize: `${settings.fontSize * 1.1}px`,
                                            borderBottom: borderStyle
                                        }}
                                    >
                                        {col.title || "Spalte"}
                                    </div>

                                    {/* Column Items - sorted words appear here */}
                                    <div
                                        ref={(el) => { itemsContainerRefs.current[col.id] = el; }}
                                        className="p-3 pt-6 pb-6 space-y-2 flex-1 relative min-h-[100px] flex flex-col"
                                    >

                                        {/* Click feedback overlay for selected column */}
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-blue-50/30 rounded-lg pointer-events-none animate-pulse" />
                                        )}

                                        {sortedWords[col.id]?.map((word, idx) => {
                                            return (
                                                <div
                                                    key={`sorted-${word.id}-${idx}`}
                                                    className={`
                                                        border-2 shadow-sm rounded-lg px-4 py-3 text-center pop-animate
                                                        ${word.isError
                                                            ? 'bg-slate-100 border-slate-300 text-slate-500'
                                                            : 'bg-green-50 border-green-400'
                                                        }
                                                    `}
                                                >
                                                    <Word
                                                        word={word.word}
                                                        startIndex={word.index}
                                                        settings={{ ...settings, fontSize: settings.fontSize * 0.85 }}
                                                        isReadingMode={true}
                                                        forceShowSyllables={true}
                                                        manualSyllables={word.syllables}
                                                        wordColors={wordColors}
                                                        highlightedIndices={highlightedIndices}
                                                        hideYellowLetters={hideYellowLetters}
                                                    />
                                                </div>
                                            );
                                        })}

                                        {/* Drop zone hint REMOVED per user request */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CONVEYOR BELT - Fixed at bottom */}
                <div
                    ref={beltRef}
                    className="absolute bottom-0 left-0 right-0 z-[400]"
                    style={{ height: `${beltHeight}px`, backgroundColor: '#1e293b' }} // slate-800 to match darker app theme
                >
                    {/* Size constants:
                        Roller Diameter: 70px
                        Belt Thickness: 12px (h-3)
                        Center Y: 160px
                        Top Belt Y: 135px
                        Bottom Belt Y: 185px
                    */}

                    {/* TOP BELT SURFACE - main visible belt */}
                    <div
                        className="absolute h-3 bg-[#c2410c] overflow-hidden z-10"
                        style={{
                            left: `${beltSurfaceOffset}px`, right: `${beltSurfaceOffset}px`, top: `${topBeltY}px`,
                            animationPlayState: (beltStopped || userInteractionPause) ? 'paused' : 'running'
                        }}
                    >
                        <div
                            className="absolute inset-0 w-full h-full"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, #1e293b 0, #1e293b 2px, transparent 2px, transparent 40px)',
                                backgroundSize: '40px 4px',
                                backgroundRepeat: 'repeat-x',
                                backgroundPosition: '0 0%',
                                backgroundColor: '#c2410c',
                                animation: `conveyorScrollForward ${1 / (1.5 * SPEEDS[speedLevel - 1])}s linear infinite`,
                                animationPlayState: (beltStopped || userInteractionPause) ? 'paused' : 'running'
                            }}
                        />
                    </div>

                    {/* LEFT BELT CURVE - wraps around left roller */}
                    {/* Visual Fix: Removed vertical connectors. Belt is now geometrically consistent. */}

                    {/* Belt Curves also need high z-index to cover if needed, matching rollers */}
                    <div
                        className="absolute w-[60px] h-[60px] -translate-y-1/2 z-[490]"
                        style={{ top: `${rollerCenterY}px`, left: `${rollerOffset}px` }}
                    >
                        <div
                            className="absolute inset-0 rounded-full border-[12px] border-[#c2410c]"
                            style={{ borderRightColor: 'transparent' }}
                        />
                    </div>

                    <div
                        className="absolute w-[60px] h-[60px] -translate-y-1/2 z-[490]"
                        style={{ top: `${rollerCenterY}px`, right: `${rollerOffset}px` }}
                    >
                        <div
                            className="absolute inset-0 rounded-full border-[12px] border-[#c2410c]"
                            style={{ borderLeftColor: 'transparent' }}
                        />
                    </div>

                    {/* BOTTOM BELT - return path */}
                    <div
                        className="absolute h-3 bg-[#c2410c] overflow-hidden"
                        style={{ left: `${beltSurfaceOffset}px`, right: `${beltSurfaceOffset}px`, top: `${bottomBeltY}px` }}
                    >
                        <div
                            className="absolute inset-0 w-full h-full"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, #1e293b 0, #1e293b 2px, transparent 2px, transparent 40px)',
                                backgroundSize: '40px 4px',
                                backgroundRepeat: 'repeat-x',
                                backgroundPosition: '0 100%',
                                backgroundColor: '#c2410c',
                                animation: `conveyorScrollBackward ${1 / (1.5 * SPEEDS[speedLevel - 1])}s linear infinite`,
                                animationPlayState: (beltStopped || userInteractionPause) ? 'paused' : 'running'
                            }}
                        />
                    </div>

                    {/* LEFT ROLLER - Interactive */}
                    <div
                        className="absolute -translate-y-1/2 w-[70px] h-[70px] z-[500] cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                        style={{ top: `${rollerCenterY}px`, left: `${rollerOffset - 5}px` }}
                        onMouseDown={handleRollerPress}
                        onTouchStart={handleRollerPress}
                    >
                        {/* Static Background Face */}
                        <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-b from-slate-600 to-slate-400 border-4 border-slate-500 shadow-xl" />

                        {/* Rotating Cross */}
                        <div
                            className="absolute inset-0 w-full h-full flex items-center justify-center"
                            style={{
                                animation: `spinRoller ${3.7 / SPEEDS[speedLevel - 1]}s linear infinite`,
                                animationPlayState: (beltStopped || userInteractionPause) ? 'paused' : 'running'
                            }}
                        >
                            <div className="absolute w-[80%] h-0.5 bg-slate-300/60" />
                            <div className="absolute w-0.5 h-[80%] bg-slate-300/60" />
                            <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-slate-300" />
                        </div>
                    </div>

                    {/* RIGHT ROLLER - Interactive */}
                    <div
                        className="absolute -translate-y-1/2 w-[70px] h-[70px] z-[500] cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                        style={{ top: `${rollerCenterY}px`, right: `${rollerOffset - 5}px` }}
                        onMouseDown={handleRollerPress}
                        onTouchStart={handleRollerPress}
                    >
                        {/* Static Background Face - Identical Gradient */}
                        <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-b from-slate-600 to-slate-400 border-4 border-slate-500 shadow-xl" />

                        {/* Rotating Cross */}
                        <div
                            className="absolute inset-0 w-full h-full flex items-center justify-center"
                            style={{
                                animation: `spinRoller ${3.7 / SPEEDS[speedLevel - 1]}s linear infinite`,
                                animationPlayState: (beltStopped || userInteractionPause) ? 'paused' : 'running'
                            }}
                        >
                            <div className="absolute w-[80%] h-0.5 bg-slate-300/60" />
                            <div className="absolute w-0.5 h-[80%] bg-slate-300/60" />
                            <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-slate-300" />
                        </div>
                    </div>

                    {/* THE WORD - sits ON the top belt surface, BEHIND rollers (z-200 vs z-300) */}
                    {currentWord && (
                        <div
                            ref={wordElRef}
                            className={`absolute z-[450] cursor-grab active:cursor-grabbing origin-bottom
                                ${isWrong ? 'animate-fall' : ''}
                                ${isDraggingWord ? 'opacity-0 pointer-events-none' : ''}
                                ${isSelected ? '!scale-110' : 'hover:scale-110 hover:-translate-y-1 hover:rotate-1 hover:shadow-lg'} 
                            `}
                            style={{
                                ...getWordStyle(),
                                'transform': isWrong ? `translateY(300px) rotate(${10 + Math.random() * 30}deg)` : getWordStyle().transform,
                                'transition': isWrong ? 'transform 0.6s ease-in' : 'transform 0.15s ease-out',
                                'touchAction': 'none' // Prevents 300ms delay on iPad
                            }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={() => { setIsDraggingWord(false); setHoveredColId(null); setUserInteractionPause(false); pointerStartRef.current = null; }}
                            onTouchStart={(e) => e.stopPropagation()} /* Block mobile-drag-drop polyfill */
                        >
                            <div className={`
                                bg-white px-4 py-2 rounded-lg shadow-lg border 
                                ${isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-blue-500 ring-4 ring-blue-500 z-50' : 'border-blue-500'}
                            `}>
                                <Word
                                    word={currentWord.word}
                                    startIndex={currentWord.index}
                                    settings={{ ...settings, fontSize: settings.fontSize * 0.85 }}
                                    isReadingMode={true}
                                    forceShowSyllables={true}
                                    manualSyllables={currentWord.syllables}
                                    wordColors={wordColors}
                                    highlightedIndices={highlightedIndices}
                                    hideYellowLetters={hideYellowLetters}
                                />
                            </div>
                        </div>
                    )}

                    {/* Floating drag clone - follows pointer during drag */}
                    {isDraggingWord && currentWord && (
                        <div
                            className="fixed z-[10000] pointer-events-none"
                            style={{
                                left: `${dragPos.x - dragOffset.x}px`,
                                top: `${dragPos.y - dragOffset.y}px`,
                                transform: 'scale(1.05) rotate(2deg)',
                                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.25))'
                            }}
                        >
                            <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-blue-500">
                                <Word
                                    word={currentWord.word}
                                    startIndex={currentWord.index}
                                    settings={{ ...settings, fontSize: settings.fontSize * 0.85 }}
                                    isReadingMode={true}
                                    forceShowSyllables={true}
                                    manualSyllables={currentWord.syllables}
                                    wordColors={wordColors}
                                    highlightedIndices={highlightedIndices}
                                    hideYellowLetters={hideYellowLetters}
                                />
                            </div>
                        </div>
                    )}

                    <RewardModal
                        isOpen={gameComplete}
                        onClose={onClose}
                        onRestart={handleRestart}
                        message={hasErrors ? "Alle Wörter einsortiert!" : "Hervorragend! Alles richtig!"}
                        buttonText="Zurück"
                        restartText="Noch einmal"
                        showConfetti={!hasErrors}
                        iconSize={24}
                        containerClassName="absolute left-0 right-0 bottom-0 z-[600] flex items-center justify-center pointer-events-none"
                        style={{ height: `${beltHeight}px` }}
                        contentClassName="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl pop-animate pointer-events-auto text-center border-b-4 border-blue-200 relative z-10 mx-4 max-w-xl w-full"
                    />
                </div>
            </div>

            {/* CSS for animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes conveyorScrollForward {
                    from { background-position: 0 0%; }
                    to { background-position: 40px 0%; }
                }
                @keyframes conveyorScrollBackward {
                    from { background-position: 40px 100%; }
                    to { background-position: 0 100%; }
                }
                @keyframes spin {
                    from { transform: translateY(-50%) rotate(0deg); }
                    to { transform: translateY(-50%) rotate(360deg); }
                }
                @keyframes spinRoller {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes confettiFall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .confetti {
                    position: fixed;
                    top: -10px;
                    width: 10px;
                    height: 10px;
                    animation: confettiFall 3s ease-out forwards;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0) translateY(-50%); }
                    25% { transform: translateX(-10px) translateY(-50%); }
                    75% { transform: translateX(10px) translateY(-50%); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out 2; }

                @keyframes fall {
                    0% { transform: translateY(0) rotate(0); opacity: 1; }
                    100% { transform: translateY(300px) rotate(var(--fall-rotate, 10deg)); opacity: 0; }
                }
                .animate-fall {
                    animation: fall 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
                    pointer-events: none;
                }
                
                input[type=range].speed-range::-webkit-slider-runnable-track {
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                input[type=range].speed-range::-moz-range-track {
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                input[type=range].speed-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 32px;
                    width: 32px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid currentColor;
                    cursor: pointer;
                    margin-top: -12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                }
                input[type=range].speed-range::-moz-range-thumb {
                    height: 32px;
                    width: 32px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid currentColor;
                    cursor: pointer;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                input[type=range].speed-range:active::-webkit-slider-thumb {
                    transform: scale(1.15);
                }
                .pop-animate { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}} />
        </div>
    );
};
