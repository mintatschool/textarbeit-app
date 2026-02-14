
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    AlertCircle,
    RotateCcw,
    Volume2,
    VolumeX,
    Minus,
    Plus,
    ArrowRight,
    Check
} from 'lucide-react';
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

export const PuzzleTestMultiSyllableView = ({ words, settings, onClose, title, activeColor }) => {
    // Game State
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: 0.85,
        wordsPerStage: 3
    });

    const [isDragging, setIsDragging] = useState(null);
    const [selectedPiece, setSelectedPiece] = useState(null); // Tap-to-Select state
    const [pendingWordsCount, setPendingWordsCount] = useState(3);

    // Pieces & Slots State
    const [pieces, setPieces] = useState({ left: [], middle: [], right: [] });
    const [slots, setSlots] = useState({}); // Key: "wordId-slotIdx" -> piece
    const [completedRows, setCompletedRows] = useState({}); // Map<RowWordID, SolvedWordID>
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [highlightedWordId, setHighlightedWordId] = useState(null); // For audio hint
    const [lastSpokenWord, setLastSpokenWord] = useState(null); // Prevent repetitive speech

    const debounceTimerRef = useRef(null);
    const audioHighlightTimerRef = useRef(null);

    // iPad Fix: Prevent touch scrolling during drag
    usePreventTouchScroll(isDragging);

    // --------------------------------------------------------------------------------
    // DYNAMIC ZOOM & SIDEBAR WIDTH CALCULATION
    // --------------------------------------------------------------------------------

    // Calculate longest word width in current stage (base width before scaling)
    const longestWordBaseWidth = useMemo(() => {
        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage?.items) return 400; // Fallback for 2-syllable word

        let maxWidth = 0;
        currentStage.items.forEach(word => {
            if (!word.syllables) return;
            // Each piece is ~200px base, with overlaps between pieces
            // Overlap: ~90px for first connection, ~60px for subsequent
            const numSyllables = word.syllables.length;
            let wordWidth = numSyllables * 200;
            if (numSyllables > 1) wordWidth -= 90; // First overlap
            if (numSyllables > 2) wordWidth -= (numSyllables - 2) * 60; // Subsequent overlaps
            if (wordWidth > maxWidth) maxWidth = wordWidth;
        });

        return Math.max(300, maxWidth); // Minimum 300px
    }, [gameState.stages, gameState.currentStageIndex]);

    // Calculate max allowed scale based on viewport and longest word
    const maxScale = useMemo(() => {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const minSidebarWidth = 150;
        const maxSidebarWidth = 220;
        const uiElementsWidth = 180; // Speaker + Check + padding

        // Available middle space with max sidebar width
        const availableMiddle = viewportWidth - (2 * maxSidebarWidth);

        // Scale at which longest word + UI fits in available middle
        // Word is rendered at scale * 0.85 in the target area
        const maxByMiddle = (availableMiddle - uiElementsWidth) / (longestWordBaseWidth * 0.85);

        // Scale at which pieces fit in sidebar (piece base 200px * scale * 0.8)
        const maxBySidebar = maxSidebarWidth / (200 * 0.8);

        // Return the smaller constraint, clamped between 0.6 and 1.3
        return Math.max(0.6, Math.min(1.3, maxByMiddle, maxBySidebar));
    }, [longestWordBaseWidth]);

    // Dynamic sidebar width based on current scale
    const sidebarWidth = useMemo(() => {
        // Sidebar grows with scale, from 150px at 0.6 to ~220px at max scale
        const baseWidth = 150;
        const width = Math.round(200 * gameState.pieceScale);
        return Math.max(baseWidth, Math.min(220, width));
    }, [gameState.pieceScale]);

    // Auto-reduce scale if it exceeds maxScale (e.g., when stage changes to longer words)
    useEffect(() => {
        if (gameState.pieceScale > maxScale) {
            setGameState(prev => ({ ...prev, pieceScale: maxScale }));
        }
    }, [maxScale, gameState.currentStageIndex]);



    // --------------------------------------------------------------------------------
    // 1. GAME LOGIC & INITIALIZATION
    // --------------------------------------------------------------------------------

    // Start/Restart Game
    const startNewGame = useCallback((currWps) => {
        const wps = currWps !== undefined ? currWps : gameState.wordsPerStage;

        if ((!words || !Array.isArray(words) || words.length === 0) && (!gameState.stages || gameState.stages.length === 0)) {
            setGameState(prev => ({ ...prev, gameStatus: 'no_words' }));
            return;
        }

        // Filter valid words strictly
        const validWords = words
            .filter(w =>
                w.syllables &&
                w.syllables.length >= 2 &&
                w.syllables.every(s => s && typeof s === 'string')
            )
            .map(w => ({
                ...w,
                id: w.id || Math.random().toString(36).substr(2, 9)
            }));

        if (validWords.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'no_words' }));
            return;
        }

        const shuffled = [...validWords].sort(() => Math.random() - 0.5);
        const stages = [];
        for (let i = 0; i < shuffled.length; i += wps) {
            const chunk = shuffled.slice(i, i + wps);
            if (chunk.length > 0) {
                stages.push({ items: chunk });
            }
        }

        setGameState(prev => ({
            ...prev,
            stages,
            currentStageIndex: 0,
            gameStatus: 'playing',
            wordsPerStage: wps
        }));

        setCompletedRows({});
        setSlots({});
        setHighlightedWordId(null);
        setLastSpokenWord(null);

    }, [words, gameState.wordsPerStage]);

    // Update pending count when wordsPerStage changes (e.g. initial load)
    useEffect(() => {
        setPendingWordsCount(gameState.wordsPerStage);
    }, [gameState.wordsPerStage]);

    // Initial Start
    useEffect(() => {
        startNewGame();
    }, [startNewGame]);


    // --------------------------------------------------------------------------------
    // 2. STAGE SETUP (Pieces Generation)
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (gameState.gameStatus !== 'playing' || !gameState.stages[gameState.currentStageIndex]) return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        const newPieces = { left: [], middle: [], right: [] };

        const getPieceWidth = (text) => {
            const standardBaseWidth = 200;
            if (!text || text.length <= 5) return standardBaseWidth;
            return standardBaseWidth + ((text.length - 5) * 20);
        };

        const getMiddleGridPos = (index, total) => {
            const spacing = 90 / (total || 1);
            return {
                x: 5 + (index * spacing),
                y: 10 + (Math.random() * 20)
            };
        };

        // Generate pieces for the current stage words ONLY
        currentStage.items.forEach(word => {
            word.syllables.forEach((syl, index) => {
                const uniqueId = `${word.id}-${index}-${Math.random().toString(36).substr(2, 5)}`;
                const width = getPieceWidth(syl);
                const piece = {
                    id: uniqueId,
                    text: syl,
                    wordId: word.id,
                    syllableIndex: index,
                    totalSyllables: word.syllables.length,
                    color: 'bg-blue-500',
                    rotation: (Math.random() - 0.5) * 4,
                    width: width,
                    sortIndex: Math.random()
                };

                if (index === 0) {
                    newPieces.left.push({ ...piece, type: 'left' });
                } else if (index === word.syllables.length - 1) {
                    newPieces.right.push({ ...piece, type: 'right' });
                } else {
                    newPieces.middle.push({ ...piece, type: 'middle' });
                }
            });
        });

        // Shuffle
        newPieces.left.sort((a, b) => a.sortIndex - b.sortIndex);
        newPieces.right.sort((a, b) => a.sortIndex - b.sortIndex);
        newPieces.middle.sort((a, b) => a.sortIndex - b.sortIndex);

        newPieces.middle = newPieces.middle.map((p, i) => ({
            ...p,
            ...getMiddleGridPos(i, newPieces.middle.length)
        }));

        setPieces(newPieces);
        setSlots({}); // Clear slots when stage changes
        setCompletedRows({}); // Clear completed for this stage context

    }, [gameState.currentStageIndex, gameState.stages, gameState.gameStatus]);


    // --------------------------------------------------------------------------------
    // 3. INTERACTIONS (Drop, Remove, Speak)
    // --------------------------------------------------------------------------------

    const handleDrop = (pieceId, wordId, slotIndex) => {
        // Find piece
        let foundPiece = null;
        ['left', 'middle', 'right'].forEach(zone => {
            const p = pieces[zone].find(x => x.id === pieceId);
            if (p) { foundPiece = p; }
        });

        if (!foundPiece) return;

        // Find the target word to check its syllable count for type validation
        const currentStage = gameState.stages[gameState.currentStageIndex];
        const targetWord = currentStage.items.find(w => w.id === wordId);
        if (!targetWord) return;

        const targetLength = targetWord.syllables.length;
        // Verify piece fits slot type
        const requiredType = slotIndex === 0 ? 'left' : (slotIndex === targetLength - 1 ? 'right' : 'middle');
        if (foundPiece.type !== requiredType) return;

        // Place piece
        const slotKey = `${wordId}-${slotIndex}`;

        setSlots(prev => {
            const next = { ...prev };

            // Check if this piece is already in another slot and remove it
            const existingKey = Object.keys(next).find(k => next[k].id === foundPiece.id);
            if (existingKey) {
                delete next[existingKey];
            }

            next[slotKey] = foundPiece;
            return next;
        });
    };

    const removePieceFromSlot = (slotKey, wordId) => {
        setSlots(prev => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    const handleReturnToPool = (pieceId) => {
        setSlots(prev => {
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

    const handleSlotSelect = (wordId, slotIndex, targetWord) => {
        if (!selectedPiece) return;

        const targetLength = targetWord.syllables.length;
        const requiredType = slotIndex === 0 ? 'left' : (slotIndex === targetLength - 1 ? 'right' : 'middle');

        if (selectedPiece.type !== requiredType) {
            setSelectedPiece(null);
            return;
        }

        const slotKey = `${wordId}-${slotIndex}`;
        setSlots(prev => {
            const next = { ...prev };
            const existingKey = Object.keys(next).find(k => next[k].id === selectedPiece.id);
            if (existingKey) delete next[existingKey];
            next[slotKey] = selectedPiece;
            return next;
        });
        setSelectedPiece(null);
    };

    // --------------------------------------------------------------------------------
    // 4. VALIDATION LOOP
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStageWords = gameState.stages[gameState.currentStageIndex].items;

        currentStageWords.forEach(rowWord => {
            // Check if all slots in this row are filled
            let isFull = true;
            const rowPieces = [];
            const len = rowWord.syllables.length;

            for (let i = 0; i < len; i++) {
                const p = slots[`${rowWord.id}-${i}`];
                if (!p) { isFull = false; break; }
                rowPieces.push(p);
            }

            if (isFull) {
                const formedWord = rowPieces.map(p => p.text).join('').toLowerCase();

                // Get currently solved entries to check for collisions
                const solvedEntries = Object.entries(completedRows);

                // Find matching target
                const matchedWord = currentStageWords.find(w => {
                    if (w.syllables.join('').toLowerCase() !== formedWord) return false;
                    // Check if used by any OTHER row (ignoring self)
                    const usedByOther = solvedEntries.find(([rId, sId]) => sId === w.id && rId !== rowWord.id);
                    return !usedByOther;
                });

                if (matchedWord) {
                    // Only update if not already set to this ID
                    if (completedRows[rowWord.id] !== matchedWord.id) {
                        setCompletedRows(prev => ({
                            ...prev,
                            [rowWord.id]: matchedWord.id
                        }));
                    }
                } else {
                    // Invalid or duplicate
                    if (completedRows[rowWord.id]) {
                        setCompletedRows(prev => {
                            const next = { ...prev };
                            delete next[rowWord.id];
                            return next;
                        });
                    }
                }
            } else {
                // Not full - unmark
                if (completedRows[rowWord.id]) {
                    setCompletedRows(prev => {
                        const next = { ...prev };
                        delete next[rowWord.id];
                        return next;
                    });
                }
            }
        });
    }, [slots, completedRows, gameState.stages, gameState.currentStageIndex]);

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
    // 5. RENDER HELPERS
    // --------------------------------------------------------------------------------

    const totalWords = useMemo(() => gameState.stages.reduce((acc, stage) => acc + stage.items.length, 0), [gameState.stages]);
    const progress = useMemo(() => {
        if (totalWords === 0) return 0;
        const previousStagesWords = gameState.stages.slice(0, gameState.currentStageIndex).reduce((acc, stage) => acc + stage.items.length, 0);
        const currentStageCompletedCount = Object.keys(completedRows).length;
        return Math.min(100, ((previousStagesWords + currentStageCompletedCount + 1) / totalWords) * 100);
    }, [gameState.stages, gameState.currentStageIndex, completedRows, totalWords]);

    const handleWordsCountChange = (delta) => {
        const next = Math.max(2, Math.min(6, pendingWordsCount + delta));
        if (next === pendingWordsCount) return;

        setPendingWordsCount(next);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            startNewGame(next);
            debounceTimerRef.current = null;
        }, 1200);
    };

    const getVisiblePieces = (zone) => {
        const inSlots = Object.values(slots).map(p => p.id);
        return pieces[zone].filter(p => !inSlots.includes(p.id));
    };

    const getSlotStyles = (word, index, placedPiece, isComplete) => {
        const base = 200;

        // Calculate projected width based on the actual target syllable
        // This ensures ghost slots match the geometry of the target word
        const text = word.syllables[index];
        const standardBaseWidth = 200;
        let projectedWidth = standardBaseWidth;
        if (text && text.length > 5) {
            projectedWidth = standardBaseWidth + ((text.length - 5) * 20);
        }

        // Use the placed piece width if available, otherwise the projected width
        const finalWidth = placedPiece ? placedPiece.width : projectedWidth;
        const stretchX = finalWidth / base;

        // Perfect geometric overlap based on SVG coordinates (unscaled)
        // Left->Middle: 80px (scaled by stretchX)
        // Middle->Next: 60px (scaled by stretchX)
        const SNAP_OFFSET = 20;
        let baseOverlap = index === 0 ? 0 : (index === 1 ? 80 : 60);

        if (!isComplete && index > 0) {
            baseOverlap -= SNAP_OFFSET;
        }

        const overlap = baseOverlap * stretchX;

        return {
            width: `${finalWidth}px`,
            height: `110px`,
            marginLeft: index === 0 ? 0 : `-${overlap}px`,
            zIndex: 10 + index,
            transition: 'margin-left 0.5s ease-in-out'
        };
    };
    const getRowWidth = (word, isComplete) => {
        let totalWidth = 0;
        const len = word.syllables.length;
        if (len === 0) return 0;
        const SNAP_OFFSET = 20;

        // Helper to get width from text
        const getW = (text) => {
            const standardBaseWidth = 200;
            if (!text || text.length <= 5) return standardBaseWidth;
            return standardBaseWidth + ((text.length - 5) * 20);
        };

        word.syllables.forEach((syl, i) => {
            const w = getW(syl);

            if (i === 0) {
                totalWidth += w;
            } else {
                // Perfect geometric overlap based on SVG coordinates
                const stretchX = w / 200;
                let baseOverlap = i === 1 ? 80 : 60;

                if (!isComplete) {
                    baseOverlap -= SNAP_OFFSET;
                }

                const overlap = baseOverlap * stretchX;
                totalWidth += (w - overlap);
            }
        });

        return totalWidth;
    };

    const { getDragProps, registerDropZone, dragState, isDragging: isPointerDragging } = usePointerDrag({
        onDragStart: (item) => setIsDragging(item.id),
        onDragEnd: () => setIsDragging(null),
        onDrop: (dragItem, targetId) => {
            // targetId: 'pool-left/middle/right' or 'SLOT:{wordId}:{slotIndex}'

            if (targetId.startsWith('pool-')) {
                handleReturnToPool(dragItem.id);
            } else if (targetId.startsWith('SLOT:')) {
                const parts = targetId.split(':');
                if (parts.length >= 3) {
                    // Reassemble wordId if it contained colons (unlikely but safe)
                    const sIdx = parseInt(parts[parts.length - 1], 10);
                    const wId = parts.slice(1, parts.length - 1).join(':');
                    handleDrop(dragItem.id, wId, sIdx);
                }
            }
        }
    });

    // --------------------------------------------------------------------------------
    // 6. RENDER
    // --------------------------------------------------------------------------------

    if ((gameState.gameStatus === 'playing' && (!gameState.stages[gameState.currentStageIndex] || gameState.stages.length === 0)) || gameState.gameStatus === 'no_words') {
        return (
            <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col items-center justify-center p-6 font-sans">
                <EmptyStateMessage
                    onClose={onClose}
                    secondStepText="Wörter mit mindestens 2 Silben markieren."
                />
            </div>
        );
    }

    if (gameState.gameStatus === 'finished') {
        return (
            <RewardModal
                isOpen={true}
                onClose={() => { onClose(); }}
                message="Alle Wörter gepuzzelt."
                title="Super!"
                buttonText="Beenden"
                onRestart={() => startNewGame()}
                restartText="Noch einmal"
            />
        );
    }

    if (gameState.gameStatus === 'loading') return <div className="fixed inset-0 bg-white z-[100]" />;

    const currentStageItems = gameState.stages[gameState.currentStageIndex]?.items || [];

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* Header */}
            <ExerciseHeader
                title={title || "Silbenpuzzle 2"}
                icon={(p) => <Icons.Silbenpuzzle2 {...p} size={30} />}
                current={Number(gameState.currentStageIndex + 1)}
                total={Number(gameState.stages.length)}
                progressPercentage={progress}
                settings={settings}
                setSettings={null}
                onClose={onClose}
                showSlider={false}
                customControls={
                    <>
                        {/* Audio Toggle */}
                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            title={audioEnabled ? 'Audio an' : 'Audio aus'}
                        >
                            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>

                        {/* Words Count Control */}
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                            <HorizontalLines count={2} />
                            <button onClick={() => handleWordsCountChange(-1)} disabled={gameState.wordsPerStage <= 2} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1">
                                <Minus className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col items-center min-w-[24px]">
                                <span className={`text-xl font-black transition-colors leading-none ${pendingWordsCount !== gameState.wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                    {pendingWordsCount}
                                </span>
                            </div>
                            <button onClick={() => handleWordsCountChange(1)} disabled={gameState.wordsPerStage >= 6} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1">
                                <Plus className="w-5 h-5" />
                            </button>
                            <HorizontalLines count={5} />
                        </div>

                        {/* Scale Control */}
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 h-10 rounded-lg hidden md:flex">
                            <span className="text-xs font-bold text-slate-500">A</span>
                            <input
                                type="range"
                                min="0.6"
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


            {/* Main Content */}
            <div className="flex-1 relative flex overflow-hidden">

                {/* LEFT ZONE - Anfangsstücke */}
                <div
                    className="bg-slate-100/50 border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300"
                    style={{ width: sidebarWidth }}
                    ref={registerDropZone('pool-left')}
                >
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anfang</div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 pt-8 flex flex-col items-start gap-4">
                        {getVisiblePieces('left').map(p => {
                            const isHighlighted = highlightedWordId === p.wordId;
                            const isSelected = selectedPiece?.id === p.id;
                            const isDraggingThis = isPointerDragging && dragState?.sourceId === p.id;
                            return (
                                <div key={p.id}
                                    className={`transition-all duration-200 cursor-pointer
                                        ${isHighlighted ? 'scale-110 drop-shadow-xl' : ''}
                                        ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 active:scale-95'}
                                        ${isDraggingThis ? 'opacity-40' : ''}
                                    `}
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
                                            type="left"
                                            colorClass={getPieceColor(p.color, activeColor)}
                                            dynamicWidth={p.width}
                                            scale={gameState.pieceScale * 0.8}
                                            fontFamily={settings.fontFamily}
                                            isSelected={isSelected}
                                            forceWhiteText={true}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MIDDLE ZONE + CENTER */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Middle Pieces Pool (Top Strip) */}
                    {pieces.middle.length > 0 && (
                        <div
                            className="bg-blue-50/30 border-b border-blue-100 relative w-full overflow-hidden shrink-0 min-h-0 h-auto max-h-[35%]"
                            ref={registerDropZone('pool-middle')}
                        >
                            <div className="absolute top-1 left-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mitte</div>
                            <div className="w-full relative pt-12 px-4 pb-4 flex flex-wrap items-center justify-center gap-4 content-center overflow-y-auto custom-scroll">
                                {getVisiblePieces('middle').map(p => {
                                    const isHighlighted = highlightedWordId === p.wordId;
                                    const isSelected = selectedPiece?.id === p.id;
                                    const isDraggingThis = isPointerDragging && dragState?.sourceId === p.id;
                                    return (
                                        <div key={p.id}
                                            className={`transition-all duration-200 cursor-pointer
                                                ${isHighlighted ? 'scale-110 z-[100] drop-shadow-xl' : ''}
                                                ${isSelected ? 'scale-110 z-50' : 'hover:z-50 hover:scale-105 active:scale-95'}
                                                ${isDraggingThis ? 'opacity-40' : ''}
                                            `}
                                            style={{
                                                transform: `rotate(${p.rotation}deg)`,
                                                filter: 'none',
                                                touchAction: 'none'
                                            }}
                                            onClick={() => handlePieceSelect(p)}
                                            {...getDragProps(p, p.id)}
                                        >
                                            <div className={`transition-all duration-200 rounded-xl`}>
                                                <PuzzleTestPiece
                                                    label={p.text}
                                                    type="middle"
                                                    colorClass={getPieceColor(p.color, activeColor)}
                                                    dynamicWidth={p.width}
                                                    scale={gameState.pieceScale * 0.8}
                                                    fontFamily={settings.fontFamily}
                                                    isSelected={isSelected}
                                                    forceWhiteText={true}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Word Rows Area */}
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 pt-12 flex flex-col items-center gap-8 bg-slate-50/30">
                        {currentStageItems.map((word, idx) => {
                            const solvedId = completedRows[word.id];
                            const isComplete = !!solvedId;
                            const isLastItem = idx === currentStageItems.length - 1;
                            const allSolved = currentStageItems.every(w => completedRows[w.id]);

                            // Audio Text: Solved word or target word
                            const audioText = isComplete && solvedId
                                ? (currentStageItems.find(w => w.id === solvedId)?.word || word.word)
                                : word.word;

                            return (
                                <div key={word.id} className={`flex items-center gap-0 transition-all duration-500 ${isComplete ? 'opacity-80 scale-95' : ''}`}>
                                    <div className="relative flex items-center pr-0 transition-[width] duration-500" style={{ height: 110 * gameState.pieceScale, width: getRowWidth(word, isComplete) * gameState.pieceScale }}>
                                        <div className="flex items-center gap-0 absolute left-0 top-0 transition-transform duration-500" style={{ transform: `scale(${gameState.pieceScale})`, transformOrigin: 'left center', height: 110 }}>
                                            {word.syllables.map((syl, idx) => {
                                                const slotKey = `${word.id}-${idx}`;
                                                const piece = slots[slotKey];
                                                const len = word.syllables.length;
                                                const type = idx === 0 ? 'left' : (idx === len - 1 ? 'right' : 'middle');
                                                const slotStyles = getSlotStyles(word, idx, piece, isComplete);

                                                const slotIsTarget = !piece && selectedPiece && selectedPiece.type === type;

                                                return (
                                                    <div
                                                        key={idx}
                                                        ref={registerDropZone(`SLOT:${word.id}:${idx}`)}
                                                        className={`relative flex items-center justify-center transition-all duration-300 group ${slotIsTarget ? 'scale-105 cursor-pointer' : ''
                                                            }`}
                                                        style={{
                                                            ...slotStyles,
                                                            filter: 'none'
                                                        }}
                                                        onClick={() => {
                                                            if (!piece && !isComplete) handleSlotSelect(word.id, idx, word);
                                                        }}
                                                    >
                                                        {!piece && (
                                                            <div className={`pointer-events-none transition-all duration-200 rounded-xl ${slotIsTarget ? 'opacity-100' : 'opacity-40'}`}>
                                                                <PuzzleTestPiece
                                                                    label=""
                                                                    type={type}
                                                                    isGhost={true}
                                                                    scale={1}
                                                                    fontFamily={settings.fontFamily}
                                                                    isSelected={slotIsTarget}
                                                                    forceWhiteText={true}
                                                                />
                                                            </div>
                                                        )}

                                                        {piece && (
                                                            <div
                                                                className={`cursor-pointer hover:scale-105 transition-transform ${isPointerDragging && dragState?.sourceId === piece.id ? 'opacity-40' : ''}`}
                                                                style={{ touchAction: 'none' }}
                                                                onClick={(e) => { e.stopPropagation(); if (!isPointerDragging) removePieceFromSlot(slotKey, word.id); }}
                                                                {...getDragProps(piece, piece.id)}
                                                            >
                                                                <PuzzleTestPiece
                                                                    label={piece.text}
                                                                    type={type}
                                                                    colorClass={getPieceColor(piece.color, activeColor)}
                                                                    scale={1}
                                                                    dynamicWidth={piece.width}
                                                                    showSeamLine={true}
                                                                    fontFamily={settings.fontFamily}
                                                                    forceWhiteText={true}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Audio, Checkmark & Manual Advance Group */}
                                    <div className="flex flex-col items-center gap-4 relative">
                                        <div className="flex items-center gap-2 min-h-[56px]">
                                            {/* Speaker */}
                                            {audioEnabled && (
                                                <button
                                                    onClick={() => speak(audioText)}
                                                    className="w-[70px] h-[70px] bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all ring-4 ring-white/50 hover:scale-105 active:scale-95 z-10 shrink-0"
                                                    title="Anhören"
                                                >
                                                    <Volume2 size={30} />
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
                                                    Weiter <ArrowRight size={30} />
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

                {/* RIGHT ZONE - Endstücke */}
                <div
                    className="shrink-0 relative border-l border-blue-50 bg-white/20 overflow-y-auto overflow-x-hidden custom-scroll pt-12 pb-6 px-4 space-y-8 flex flex-col items-center transition-all duration-300"
                    style={{ width: sidebarWidth }}
                    ref={registerDropZone('pool-right')}
                >
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full mb-4">Ende</div>
                    {getVisiblePieces('right').map(p => {
                        const isHighlighted = highlightedWordId === p.wordId;
                        const isSelected = selectedPiece?.id === p.id;
                        const isDraggingThis = isPointerDragging && dragState?.sourceId === p.id;
                        return (
                            <div
                                key={p.id}
                                className={`transition-all duration-200 cursor-pointer
                                    ${isHighlighted ? 'scale-110 drop-shadow-xl' : ''}
                                    ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 active:scale-95'}
                                    ${isDraggingThis ? 'opacity-40' : ''}
                                `}
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
                                        type="right"
                                        colorClass={getPieceColor(p.color, activeColor)}
                                        dynamicWidth={p.width}
                                        scale={gameState.pieceScale * 0.8}
                                        fontFamily={settings.fontFamily}
                                        isSelected={isSelected}
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
                            dynamicWidth={dragState.item.width}
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

export default PuzzleTestMultiSyllableView;
