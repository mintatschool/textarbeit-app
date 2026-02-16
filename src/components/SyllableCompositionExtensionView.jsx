
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { Icons } from './Icons';
import { ProgressBar } from './ProgressBar';
import PuzzleTestPiece from './PuzzleTestPiece';
import { speak } from '../utils/speech';
import { EmptyStateMessage } from './EmptyStateMessage';
import { HorizontalLines } from './shared/UIComponents';
import { getPieceColor } from './shared/puzzleUtils';
import { usePreventTouchScroll } from '../hooks/usePreventTouchScroll';
import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { getCorrectCasing } from '../utils/wordCasingUtils';

export const SyllableCompositionExtensionView = ({ words, settings, onClose, title, activeColor }) => {
    // Game Configuration
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: 0.95,
        wordsPerStage: 3
    });

    const [isDragging, setIsDragging] = useState(null);
    const [selectedPiece, setSelectedPiece] = useState(null); // Tap-to-Select state

    // iPad Fix: Prevent touch scrolling during drag
    usePreventTouchScroll(isDragging);

    const [pendingWordsCount, setPendingWordsCount] = useState(3);
    const debounceTimerRef = useRef(null);
    const [activeLengths, setActiveLengths] = useState([]);
    const [forceLowercase, setForceLowercase] = useState(false);


    // State for Pieces & Slots
    // scrambledPieces: Array of { id, text, type, color, ... }
    // placedPieces: Object { "targetId-slotIdx": pieceId }
    const [scrambledPieces, setScrambledPieces] = useState({ left: [], middle: [], right: [] });
    const [placedPieces, setPlacedPieces] = useState({});
    const [completedRows, setCompletedRows] = useState({}); // Map<RowTargetID, SolvedTargetID>
    const [audioEnabled, setAudioEnabled] = useState(true);

    const moveTimerRef = useRef(null);

    const allowedClusters = useMemo(() => new Set(settings.clusters || []), [settings.clusters]);

    // --------------------------------------------------------------------------------
    // DYNAMIC ZOOM & SIDEBAR WIDTH CALCULATION
    // --------------------------------------------------------------------------------

    // Calculate longest target width in current stage (base width before scaling)
    const longestTargetBaseWidth = useMemo(() => {
        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage?.items) return 400; // Fallback

        let maxWidth = 0;
        currentStage.items.forEach(target => {
            if (!target.parts) return;
            // Each piece is ~200px base, with overlaps between pieces
            const numParts = target.parts.length;
            let targetWidth = numParts * 200;
            if (numParts > 1) targetWidth -= 90; // First overlap
            if (numParts > 2) targetWidth -= (numParts - 2) * 60; // Subsequent overlaps
            if (targetWidth > maxWidth) maxWidth = targetWidth;
        });

        return Math.max(300, maxWidth); // Minimum 300px
    }, [gameState.stages, gameState.currentStageIndex]);

    // Calculate max allowed scale based on viewport and longest target
    const maxScale = useMemo(() => {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const maxSidebarWidth = 220;
        const uiElementsWidth = 180; // Speaker + Check + padding

        // Available middle space with max sidebar width
        const availableMiddle = viewportWidth - (2 * maxSidebarWidth);

        // Scale at which longest target + UI fits in available middle
        // Target is rendered at scale * 0.85 in the target area
        const maxByMiddle = (availableMiddle - uiElementsWidth) / (longestTargetBaseWidth * 0.85);

        // Scale at which pieces fit in sidebar (piece base 200px * scale * 0.8)
        const maxBySidebar = maxSidebarWidth / (200 * 0.8);

        // Return the smaller constraint, clamped between 0.7 and 1.4
        return Math.max(0.7, Math.min(1.4, maxByMiddle, maxBySidebar));
    }, [longestTargetBaseWidth]);

    // Dynamic sidebar width based on current scale
    const sidebarWidth = useMemo(() => {
        const baseWidth = 150;
        const width = Math.round(200 * gameState.pieceScale);
        return Math.max(baseWidth, Math.min(220, width));
    }, [gameState.pieceScale]);

    // Auto-reduce scale if it exceeds maxScale (e.g., when stage changes to longer targets)
    useEffect(() => {
        if (gameState.pieceScale > maxScale) {
            setGameState(prev => ({ ...prev, pieceScale: maxScale }));
        }
    }, [maxScale, gameState.currentStageIndex]);


    const totalWords = useMemo(() => gameState.stages.reduce((acc, stage) => acc + stage.items.length, 0), [gameState.stages]);
    const progress = useMemo(() => {
        if (totalWords === 0) return 0;
        const previousStagesWords = gameState.stages.slice(0, gameState.currentStageIndex).reduce((acc, stage) => acc + stage.items.length, 0);
        const currentStageCompletedCount = Object.keys(completedRows).length;
        return Math.min(100, ((previousStagesWords + currentStageCompletedCount) / totalWords) * 100);
    }, [gameState.stages, gameState.currentStageIndex, completedRows, totalWords]);

    // --------------------------------------------------------------------------------
    // 1. GENERATE PUZZLE DATA
    // --------------------------------------------------------------------------------
    const validTargets = useMemo(() => {
        const potentialTargets = [];
        const seen = new Set();

        let candidateSyllables = [];
        if (words && Array.isArray(words)) {
            words.forEach(w => {
                if (w && Array.isArray(w.syllables)) {
                    w.syllables.forEach(s => { if (typeof s === 'string') candidateSyllables.push(getCorrectCasing(s)); });
                } else if (w && w.word) {
                    candidateSyllables.push(getCorrectCasing(w.word));
                }
            });
        }

        // Filter & Split
        candidateSyllables.forEach(syl => {
            if (!syl || typeof syl !== 'string') return;
            const cleanSyl = syl.trim();
            if (cleanSyl.length < 2) return;
            if (seen.has(cleanSyl)) return;

            // Greedy Split Logic (Matches original Extension logic)
            // No Audio filter required per user spec
            let parts = [];
            let remaining = cleanSyl;
            const clusterList = Array.from(allowedClusters).sort((a, b) => b.length - a.length);

            while (remaining.length > 0) {
                let foundCluster = false;
                for (let cluster of clusterList) {
                    if (remaining.toLowerCase().startsWith(cluster.toLowerCase())) {
                        parts.push(remaining.substring(0, cluster.length));
                        remaining = remaining.substring(cluster.length);
                        foundCluster = true;
                        break;
                    }
                }
                if (!foundCluster) {
                    parts.push(remaining[0]);
                    remaining = remaining.substring(1);
                }
            }

            if (parts.length >= 2) {
                potentialTargets.push({
                    id: cleanSyl + '-' + Math.random().toString(36).substr(2, 5),
                    full: cleanSyl,
                    parts: parts
                });
                seen.add(cleanSyl);
            }
        });

        return potentialTargets.sort(() => Math.random() - 0.5);
    }, [words, allowedClusters]);


    // --------------------------------------------------------------------------------
    // 2. GAME LOOP CONTROLLER
    // --------------------------------------------------------------------------------
    const startNewGame = useCallback((currWps) => {
        const wps = currWps !== undefined ? currWps : pendingWordsCount;

        if (validTargets.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [], wordsPerStage: wps }));
            return;
        }

        // Shuffle targets
        const shuffled = [...validTargets].sort(() => Math.random() - 0.5);
        const newStages = [];

        for (let i = 0; i < shuffled.length; i += wps) {
            const chunk = shuffled.slice(i, i + wps);
            if (chunk.length > 0) {
                newStages.push({ items: chunk });
            }
        }

        setGameState(prev => ({
            ...prev,
            stages: newStages,
            currentStageIndex: 0,
            gameStatus: 'playing',
            wordsPerStage: wps
        }));

        setCompletedRows({});
        setPlacedPieces({});

    }, [validTargets, pendingWordsCount]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);



    // --------------------------------------------------------------------------------
    // 3. SETUP STAGE PIECES
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (gameState.gameStatus !== 'playing' || !gameState.stages[gameState.currentStageIndex]) return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        const newPools = { left: [], middle: [], right: [] };

        // Generate Pieces for all targets in this stage
        currentStage.items.forEach((target, tIdx) => {
            target.parts.forEach((partText, pIdx) => {
                const isFirst = pIdx === 0;
                const isLast = pIdx === target.parts.length - 1;

                // Deterministic Type
                let type = 'zigzag-middle';
                if (isFirst) type = 'zigzag-left';
                else if (isLast) type = 'zigzag-right';

                const pieceId = `${target.id}-${pIdx}`;

                const piece = {
                    id: pieceId,
                    text: partText,
                    type: type,
                    color: 'bg-blue-500',
                    targetId: target.id,
                    rotation: (Math.random() - 0.5) * 8, // slight jitter for middle
                    // Middle pieces need grid positions
                    x: 10 + Math.random() * 80,
                    y: 10 + Math.random() * 80
                };

                // Add to appropriate pool
                if (isFirst) newPools.left.push(piece);
                else if (isLast) newPools.right.push(piece);
                else newPools.middle.push(piece);
            });
        });

        // Shuffle within pools
        ['left', 'middle', 'right'].forEach(k => {
            newPools[k].sort(() => Math.random() - 0.5);
            if (k === 'middle') {
                newPools[k] = newPools[k].map((p, i) => ({
                    ...p,
                    x: (i % 3) * 30 + 10 + (Math.random() * 10),
                    y: Math.floor(i / 3) * 30 + 10 + (Math.random() * 10)
                }));
            }
        });

        setScrambledPieces(newPools);
        setPlacedPieces({});
        setCompletedRows({});

    }, [gameState.currentStageIndex, gameState.stages, gameState.gameStatus]);



    // --------------------------------------------------------------------------------
    // 4. INTERACTION HANDLERS
    // --------------------------------------------------------------------------------
    const handleDrop = (pieceId, targetId, slotIndex) => {
        // Find piece in pools
        let foundPiece = null;
        ['left', 'middle', 'right'].forEach(pool => {
            const p = scrambledPieces[pool].find(x => x.id === pieceId);
            if (p) foundPiece = p;
        });

        if (!foundPiece) return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        const target = currentStage.items.find(t => t.id === targetId);
        if (!target) return;

        const isStart = slotIndex === 0;
        const isEnd = slotIndex === target.parts.length - 1;
        let requiredType = 'zigzag-middle';
        if (isStart) requiredType = 'zigzag-left';
        if (isEnd) requiredType = 'zigzag-right';

        if (foundPiece.type !== requiredType) return; // Wrong type for slot

        // Place it
        const slotKey = `${targetId}-${slotIndex}`;

        setPlacedPieces(prev => {
            const next = { ...prev };

            // Check if this piece is already in another slot and remove it
            const existingKey = Object.keys(next).find(k => next[k].id === foundPiece.id);
            if (existingKey) {
                delete next[existingKey];
            }

            // Assign to new slot
            next[slotKey] = foundPiece;
            return next;
        });
    };

    const handleRemove = (targetId, slotIndex) => {
        const slotKey = `${targetId}-${slotIndex}`;
        setPlacedPieces(prev => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    const handleReturnToPool = (pieceId) => {
        // Find if this piece is in placedPieces and remove it
        setPlacedPieces(prev => {
            const next = { ...prev };
            let modified = false;
            Object.keys(next).forEach(key => {
                if (next[key]?.id === pieceId) {
                    delete next[key];
                    modified = true;
                }
            });
            return modified ? next : prev;
        });
    };

    // Tap-to-Select Handlers
    const handlePieceSelect = (piece) => {
        if (!piece) {
            setSelectedPiece(null);
            return;
        }
        if (selectedPiece?.id === piece.id) {
            setSelectedPiece(null);
        } else {
            setSelectedPiece(piece);
        }
    };

    const handleSlotSelect = (targetId, slotIndex, target) => {
        if (!selectedPiece) return;

        const isStart = slotIndex === 0;
        const isEnd = slotIndex === target.parts.length - 1;
        let requiredType = 'zigzag-middle';
        if (isStart) requiredType = 'zigzag-left';
        if (isEnd) requiredType = 'zigzag-right';

        if (selectedPiece.type !== requiredType) {
            setSelectedPiece(null);
            return;
        }

        const slotKey = `${targetId}-${slotIndex}`;
        setPlacedPieces(prev => {
            const next = { ...prev };
            const existingKey = Object.keys(next).find(k => next[k].id === selectedPiece.id);
            if (existingKey) delete next[existingKey];
            next[slotKey] = selectedPiece;
            return next;
        });
        setSelectedPiece(null);
    };

    // --------------------------------------------------------------------------------
    // 5. VALIDATION
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStage = gameState.stages[gameState.currentStageIndex];

        // check each row (defined by a target item)
        currentStage.items.forEach(rowTarget => {
            // Check if all slots in this row are filled
            let isFull = true;
            let currentParts = [];
            for (let i = 0; i < rowTarget.parts.length; i++) {
                const p = placedPieces[`${rowTarget.id}-${i}`];
                if (!p) { isFull = false; break; }
                currentParts.push(p.text);
            }

            if (isFull) {
                // Determine what word was formed
                const formed = currentParts.join('');

                // Get currently solved entries to check for collisions
                const solvedEntries = Object.entries(completedRows);

                // Check if this formed word matches ANY valid target in the stage
                // that is NOT already used by ANOTHER row.
                const matchedTarget = currentStage.items.find(t => {
                    if (t.full !== formed) return false;
                    // Check if used by any OTHER row (ignoring self)
                    const usedByOther = solvedEntries.find(([rId, sId]) => sId === t.id && rId !== rowTarget.id);
                    return !usedByOther;
                });

                if (matchedTarget) {
                    // Success! 
                    if (completedRows[rowTarget.id] !== matchedTarget.id) {
                        setCompletedRows(prev => ({
                            ...prev,
                            [rowTarget.id]: matchedTarget.id
                        }));
                    }
                } else {
                    // Full but invalid or duplicate used by other
                    if (completedRows[rowTarget.id]) {
                        setCompletedRows(prev => {
                            const next = { ...prev };
                            delete next[rowTarget.id];
                            return next;
                        });
                    }
                }
            } else {
                // Not full - if it was marked as complete, unmark it
                if (completedRows[rowTarget.id]) {
                    setCompletedRows(prev => {
                        const next = { ...prev };
                        delete next[rowTarget.id];
                        return next;
                    });
                }
            }
        });
    }, [placedPieces, completedRows, gameState.stages, gameState.currentStageIndex]);

    const handleManualAdvance = useCallback(() => {
        setGameState(prev => {
            const isLastStage = prev.currentStageIndex >= prev.stages.length - 1;
            if (isLastStage) {
                return { ...prev, gameStatus: 'finished' };
            } else {
                return {
                    ...prev,
                    currentStageIndex: prev.currentStageIndex + 1,
                    gameStatus: 'playing'
                };
            }
        });
    }, []);

    // --------------------------------------------------------------------------------
    // 6. RENDER HELPERS
    // --------------------------------------------------------------------------------
    const handleWordsCountChange = (delta) => {
        const next = Math.max(2, Math.min(6, pendingWordsCount + delta));
        setPendingWordsCount(next);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            startNewGame(next);
        }, 800);
    };

    // Pointer Drag Integration
    const { getDragProps, registerDropZone, dragState, isDragging: isPointerDragging } = usePointerDrag({
        onDragStart: (item) => setIsDragging(item.id),
        onDragEnd: () => setIsDragging(null),
        onDrop: (dragItem, targetId) => {
            // targetId: 'pool-left/middle/right' or 'SLOT:{targetId}:{slotIndex}'

            if (targetId.startsWith('pool-')) {
                handleReturnToPool(dragItem.id);
            } else if (targetId.startsWith('SLOT:')) {
                const parts = targetId.split(':');
                if (parts.length === 3) {
                    const tId = parts[1];
                    const sIdx = parseInt(parts[2], 10);
                    handleDrop(dragItem.id, tId, sIdx);
                }
            }
        }
    });


    if (gameState.gameStatus === 'finished') {
        return (
            <RewardModal
                isOpen={true}
                onClose={() => { onClose(); }}
                message="Alle Silben gebaut."
                title="Super!"
                buttonText="Beenden"
                onRestart={() => startNewGame()}
                restartText="Noch einmal"
            />
        );
    }

    if (gameState.gameStatus === 'loading') {
        return <div className="fixed inset-0 bg-white z-[100]" />;
    }

    // Safe guard: If playing but no stages or invalid index
    if (gameState.gameStatus === 'playing' && (!gameState.stages[gameState.currentStageIndex] || gameState.stages.length === 0)) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans">
                <EmptyStateMessage onClose={onClose} />
            </div>
        );
    }

    const currentStage = gameState.stages[gameState.currentStageIndex];

    // Filter out placed pieces from pools
    const allPlacedIds = new Set(Object.values(placedPieces).map(p => p.id));
    const leftVisible = scrambledPieces.left.filter(p => !allPlacedIds.has(p.id));
    const rightVisible = scrambledPieces.right.filter(p => !allPlacedIds.has(p.id));
    const middleVisible = scrambledPieces.middle.filter(p => !allPlacedIds.has(p.id));





    // Casing Toggle Button
    const casingToggleButton = (
        <button
            onClick={() => setForceLowercase(!forceLowercase)}
            className={`w-12 h-10 flex items-center justify-center rounded-lg transition-all border mr-2 ${forceLowercase ? 'bg-blue-600 border-blue-700 shadow-inner' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-white hover:shadow-sm'}`}
            title={forceLowercase ? "Nur Kleinbuchstaben (aktiv)" : "Original Schreibung"}
        >
            <Icons.SyllableCasingCorrection size={28} className={forceLowercase ? 'text-white' : 'text-slate-600'} />
        </button>
    );

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* HEADER */}
            <ExerciseHeader
                title={title || "Silbenbau 2"}
                icon={(p) => <Icons.Silbenbau2 {...p} size={30} />}
                current={gameState.currentStageIndex + 1}
                total={gameState.stages.length}
                progressPercentage={progress}
                settings={settings}
                setSettings={(newSettings) => { /* No-op, using gameState for scale */ }}
                onClose={onClose}
                showSlider={false}
                customControls={
                    <>
                        {casingToggleButton}

                        {/* Words Count Control */}
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                            <HorizontalLines count={2} />
                            <button onClick={() => handleWordsCountChange(-1)} disabled={pendingWordsCount <= 2} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1">
                                <Icons.Minus size={20} />
                            </button>
                            <div className="flex flex-col items-center min-w-[24px]">
                                <span className={`text-xl font-bold transition-colors leading-none ${pendingWordsCount !== gameState.wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                    {pendingWordsCount}
                                </span>
                            </div>
                            <button onClick={() => handleWordsCountChange(1)} disabled={pendingWordsCount >= 6} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1">
                                <Icons.Plus size={20} />
                            </button>
                            <HorizontalLines count={5} />
                        </div>

                        {/* Scale Control */}
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 h-10 rounded-lg ml-2">
                            <span className="text-xs font-bold text-slate-500">A</span>
                            <input
                                type="range"
                                min="0.7"
                                max={maxScale}
                                step="0.05"
                                value={gameState.pieceScale}
                                onChange={(e) => setGameState(prev => ({ ...prev, pieceScale: parseFloat(e.target.value) }))}
                                className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer transition-all"
                            />
                            <span className="text-xl font-bold text-slate-500">A</span>
                        </div>
                    </>
                }
            />

            <div className="flex-1 relative flex overflow-hidden">
                {/* LEFT SIDEBAR (Start Pieces) */}
                <div
                    className="bg-slate-100/50 border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300"
                    style={{ width: sidebarWidth }}
                    ref={registerDropZone('pool-left')}
                >
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anfang</div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 pt-8 flex flex-col items-center gap-4">
                        {leftVisible.map(p => {
                            const isSelected = selectedPiece?.id === p.id;
                            const isDraggingThis = isPointerDragging && dragState?.sourceId === p.id;
                            return (
                                <div key={p.id}
                                    className={`transition-all duration-200 cursor-pointer ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 active:scale-95'} ${isDraggingThis ? 'opacity-40' : ''}`}
                                    style={{
                                        filter: 'none',
                                        touchAction: 'none'
                                    }}
                                    onClick={() => handlePieceSelect(p)}
                                    {...getDragProps(p, p.id)}
                                >
                                    <div className={`transition-all duration-200 rounded-xl`}>
                                        <PuzzleTestPiece label={p.text} type="zigzag-left" colorClass={getPieceColor(p.color, activeColor)} scale={gameState.pieceScale * 0.8} fontFamily={settings.fontFamily} isSelected={isSelected} forceLowercase={forceLowercase} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MAIN AREA */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Middle Pieces Pool */}
                    {scrambledPieces.middle.length > 0 && (
                        <div
                            className="bg-blue-50/30 border-b border-blue-100 relative w-full overflow-hidden shrink-0 min-h-0 h-auto max-h-[35%]"
                            ref={registerDropZone('pool-middle')}
                        >
                            <div className="absolute top-1 left-2 text-[10px] font-bold text-slate-400 uppercase">Mitte</div>
                            <div className="w-full relative pt-12 px-4 pb-4 flex flex-wrap items-center justify-center gap-4 content-center overflow-y-auto custom-scroll">
                                {middleVisible.map(p => {
                                    const isSelected = selectedPiece?.id === p.id;
                                    const isDraggingThis = isPointerDragging && dragState?.sourceId === p.id;
                                    return (
                                        <div key={p.id}
                                            className={`transition-all duration-200 cursor-pointer ${isSelected ? 'scale-110 z-50' : 'hover:z-50 hover:scale-105 active:scale-95'} ${isDraggingThis ? 'opacity-40' : ''}`}
                                            style={{
                                                transform: `rotate(${p.rotation}deg)`,
                                                filter: 'none',
                                                touchAction: 'none'
                                            }}
                                            onClick={() => handlePieceSelect(p)}
                                            {...getDragProps(p, p.id)}
                                        >
                                            <div className={`transition-all duration-200 rounded-xl`}>
                                                <PuzzleTestPiece label={p.text} type="zigzag-middle" colorClass={getPieceColor(p.color, activeColor)} scale={gameState.pieceScale * 0.8} fontFamily={settings.fontFamily} isSelected={isSelected} forceLowercase={forceLowercase} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TARGETS LIST */}
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 pt-12 flex flex-col items-center gap-8 bg-slate-50/30">
                        {currentStage.items.map((target, idx) => {
                            const solvedId = completedRows[target.id];
                            const isComplete = !!solvedId;
                            const isLastItem = idx === currentStage.items.length - 1;
                            const allSolved = currentStage.items.every(t => completedRows[t.id]);

                            const audioText = isComplete
                                ? (currentStage.items.find(t => t.id === solvedId)?.full || target.full)
                                : target.full;

                            const SNAP_OFFSET = 25;
                            // Width calculation
                            let totalOverlapReduction = 0;
                            if (target.parts.length > 1) {
                                let ov1 = 90;
                                if (!isComplete) ov1 -= SNAP_OFFSET;
                                totalOverlapReduction += ov1;

                                if (target.parts.length > 2) {
                                    const subOv = 60 - (isComplete ? 0 : SNAP_OFFSET);
                                    totalOverlapReduction += (target.parts.length - 2) * subOv;
                                }
                            }
                            const totalWidth = (target.parts.length * 200) - totalOverlapReduction;

                            return (
                                <div key={target.id} className={`flex items-center gap-2 transition-all duration-500 ${isComplete ? 'opacity-80' : ''}`}>
                                    {/* Slot Row */}
                                    <div className="relative flex items-center justify-center transition-all duration-500 will-change-[width] overflow-visible"
                                        style={{
                                            height: 110 * (gameState.pieceScale * 0.85),
                                            width: totalWidth * (gameState.pieceScale * 0.85)
                                        }}>
                                        <div className="flex items-center gap-0 absolute left-0 top-0 transition-transform duration-500" style={{ transform: `scale(${gameState.pieceScale * 0.85})`, transformOrigin: 'left top', height: 110 }}>
                                            {Array.from({ length: target.parts.length }).map((_, idx) => {
                                                const slotKey = `${target.id}-${idx}`;
                                                const piece = placedPieces[slotKey];
                                                const isStart = idx === 0;
                                                const isEnd = idx === target.parts.length - 1;

                                                const SNAP_OFFSET = 25;
                                                // Width calculation (Restored original snap-to-fit)
                                                let overlap = idx === 0 ? 0 : (idx === 1 ? 90 : 60);
                                                if (!isComplete && idx > 0) {
                                                    overlap -= SNAP_OFFSET;
                                                }

                                                const marginLeft = idx === 0 ? 0 : -overlap;
                                                const targetType = isStart ? 'zigzag-left' : (isEnd ? 'zigzag-right' : 'zigzag-middle');

                                                const slotIsTarget = !piece && selectedPiece && selectedPiece.type === targetType;

                                                return (
                                                    <div
                                                        key={idx}
                                                        ref={registerDropZone(`SLOT:${target.id}:${idx}`)}
                                                        className={`relative flex items-center justify-center group transition-all duration-500 ${slotIsTarget ? 'scale-105 cursor-pointer' : ''
                                                            }`}
                                                        style={{
                                                            width: 200, height: 110,
                                                            marginLeft: marginLeft,
                                                            zIndex: 50 - idx,
                                                            filter: 'none'
                                                        }}
                                                        onClick={() => {
                                                            if (!piece && !isComplete) handleSlotSelect(target.id, idx, target);
                                                        }}
                                                    >
                                                        {!piece && (
                                                            <div className={`pointer-events-none transition-all duration-200 rounded-xl ${slotIsTarget ? 'opacity-100' : 'opacity-40'}`}>
                                                                <PuzzleTestPiece label="" type={targetType} isGhost scale={1} fontFamily={settings.fontFamily} isSelected={slotIsTarget} forceLowercase={forceLowercase} />
                                                            </div>
                                                        )}
                                                        {piece && (
                                                            <div
                                                                className={`cursor-pointer hover:scale-105 transition-transform relative z-50 ${isPointerDragging && dragState?.sourceId === piece.id ? 'opacity-40' : ''}`}
                                                                onClick={(e) => { e.stopPropagation(); if (!isPointerDragging) handleRemove(target.id, idx); }}
                                                                style={{ touchAction: 'none' }}
                                                                {...getDragProps(piece, piece.id)}
                                                            >
                                                                <PuzzleTestPiece
                                                                    label={piece.text}
                                                                    type={targetType}
                                                                    colorClass={getPieceColor(piece.color, activeColor)}
                                                                    scale={1}
                                                                    id={piece.id}
                                                                    dynamicWidth={piece.width}
                                                                    showSeamLine={true}
                                                                    fontFamily={settings.fontFamily}
                                                                    forceWhiteText={true}
                                                                    forceLowercase={forceLowercase}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Audio, Checkmark & Manual Advance Group */}
                                    <div className="flex flex-col items-center gap-2 ml-10 shrink-0 relative">
                                        <div className="flex items-center gap-2 min-h-[56px]">
                                            {/* Speaker */}
                                            {audioEnabled && (
                                                <button
                                                    onClick={() => speak(audioText)}
                                                    className="w-[70px] h-[70px] bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all ring-4 ring-white/50 hover:scale-105 active:scale-95 z-10 shrink-0"
                                                    title="Anhören"
                                                >
                                                    <Icons.Volume2 size={30} />
                                                </button>
                                            )}

                                            {/* Checkmark */}
                                            <div className={`transition-all duration-500 ease-out flex items-center
                                                ${isComplete ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                                            `}>
                                                <Icons.Check className="text-green-500 drop-shadow-2xl" style={{ width: '70px', height: '70px' }} />
                                            </div>
                                        </div>

                                        {/* Manual Advance Button */}
                                        {isLastItem && allSolved && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8 animate-in slide-in-from-top-4 duration-300 z-20">
                                                <button
                                                    onClick={handleManualAdvance}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl text-xl hover:scale-105 transition-all flex items-center gap-2 ring-4 ring-white/50 whitespace-nowrap"
                                                >
                                                    Weiter <Icons.ArrowRight size={30} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Spacer */}
                        <div className="h-32 w-full" />
                    </div>
                </div>

                {/* RIGHT SIDEBAR (End Pieces) */}
                <div
                    className="shrink-0 relative border-l border-blue-50 bg-white/20 overflow-y-auto overflow-x-hidden custom-scroll pt-12 pb-6 px-4 space-y-8 flex flex-col items-center transition-all duration-300"
                    style={{ width: sidebarWidth }}
                    ref={registerDropZone('pool-right')}
                >
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full mb-4">Ende</div>
                    {rightVisible.map(p => {
                        const isSelected = selectedPiece?.id === p.id;
                        const isDraggingThis = isPointerDragging && dragState?.sourceId === p.id;
                        return (
                            <div
                                key={p.id}
                                className={`transition-all duration-200 cursor-pointer ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 active:scale-95'} ${isDraggingThis ? 'opacity-40' : ''}`}
                                style={{
                                    filter: 'none',
                                    touchAction: 'none'
                                }}
                                onClick={() => handlePieceSelect(p)}
                                {...getDragProps(p, p.id)}
                            >
                                <div className={`transition-all duration-200 rounded-xl`}>
                                    <PuzzleTestPiece
                                        label={p.text}
                                        type="zigzag-right"
                                        colorClass={getPieceColor(p.color, activeColor)}
                                        scale={gameState.pieceScale * 0.8}
                                        fontFamily={settings.fontFamily}
                                        isSelected={isSelected}
                                        forceWhiteText={true}
                                        forceLowercase={forceLowercase}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Drag Overlay */}
            {dragState && (
                <div
                    className="fixed z-[10000] pointer-events-none"
                    style={{
                        left: dragState.pos.x,
                        top: dragState.pos.y,
                        transform: 'translate(-50%, -50%) rotate(2deg)',
                        filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.20))'
                    }}
                >
                    <div style={{ transform: 'scale(1.05)' }}>
                        <PuzzleTestPiece
                            label={dragState.item.text}
                            type={dragState.item.type}
                            colorClass={getPieceColor(dragState.item.color, activeColor)}
                            scale={gameState.pieceScale * 0.8}
                            fontFamily={settings.fontFamily}
                            showSeamLine={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SyllableCompositionExtensionView;
