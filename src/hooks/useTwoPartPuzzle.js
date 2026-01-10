import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Shared hook for two-part puzzle exercises (Silbenbau 1 & Silbenpuzzle 1).
 * 
 * @param {Object} config
 * @param {Array} config.items - Array of { leftPart, rightPart, fullText } objects
 * @param {string} config.leftType - Piece type for left side (e.g., 'left' or 'zigzag-left')
 * @param {string} config.rightType - Piece type for right side (e.g., 'right' or 'zigzag-right')
 * @param {number} config.initialScale - Initial piece scale (default: 1.0)
 * @param {number} config.successDelay - Delay after success before next item (default: 2000ms)
 */
export const useTwoPartPuzzle = ({
    items = [],
    leftType = 'left',
    rightType = 'right',
    initialScale = 1.0,
    successDelay = 1000
}) => {
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: initialScale,
        wordsPerStage: 3,
        gameMode: 'both-empty'
    });

    const [pendingWordsCount, setPendingWordsCount] = useState(3);
    const debounceTimerRef = useRef(null);

    const [scrambledPieces, setScrambledPieces] = useState([]);
    const [placedPieces, setPlacedPieces] = useState({ left: null, right: null });
    const [isDragging, setIsDragging] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // iPad Fix: Prevent touch scrolling during drag
    useEffect(() => {
        if (!isDragging) return;
        const preventDefault = (e) => { e.preventDefault(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('touchmove', preventDefault, { passive: false });
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('touchmove', preventDefault);
        };
    }, [isDragging]);

    const startNewGame = useCallback((customWordsPerStage) => {
        const wps = customWordsPerStage !== undefined ? customWordsPerStage : pendingWordsCount;
        setGameState(prev => ({ ...prev, gameStatus: 'loading', stages: [], currentStageIndex: 0, wordsPerStage: wps }));
        setPlacedPieces({ left: null, right: null });
        setScrambledPieces([]);
        setShowSuccess(false);

        if (!items || items.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [] }));
            return;
        }

        // Shuffle items
        const shuffled = [...items].sort(() => Math.random() - 0.5);

        const newStages = [];
        for (let i = 0; i < shuffled.length; i += wps) {
            const stageItems = shuffled.slice(i, i + wps);
            if (stageItems.length > 0) {
                newStages.push({
                    items: stageItems,
                    completedIndices: [],
                    targetIndex: 0
                });
            }
        }

        setGameState(prev => ({
            ...prev,
            stages: newStages,
            gameStatus: 'playing',
            currentStageIndex: 0,
            wordsPerStage: wps
        }));
    }, [pendingWordsCount, items]);

    // Auto-start game when items change
    useEffect(() => {
        if (items && items.length > 0) {
            startNewGame();
        } else {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [] }));
        }
    }, [items]); // Only depend on items, not startNewGame to avoid infinite loop

    const setupCurrentWord = useCallback(() => {
        if (gameState.gameStatus !== 'playing' || gameState.stages.length === 0) return;
        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage || !currentStage.items) return;

        const targetIdx = currentStage.targetIndex ?? 0;
        const currentItem = currentStage.items[targetIdx];
        if (!currentItem) return;

        // Set pre-filled pieces based on game mode
        setPlacedPieces({
            left: gameState.gameMode === 'left-filled' ? currentItem.leftPart : null,
            right: gameState.gameMode === 'right-filled' ? currentItem.rightPart : null
        });

        const leftPieces = [];
        const rightPieces = [];

        currentStage.items.forEach((item, idx) => {
            if (currentStage.completedIndices.includes(idx)) return;

            // Left Part
            if (!(idx === targetIdx && gameState.gameMode === 'left-filled')) {
                leftPieces.push({
                    id: `left-${idx}-${item.leftPart}`,
                    text: item.leftPart,
                    type: leftType,
                    color: 'bg-blue-500',
                    itemIdx: idx,
                    sortIndex: (idx * 0.137 + (item.leftPart?.charCodeAt(0) || 0) * 0.013) % 1
                });
            }

            // Right Part
            if (!(idx === targetIdx && gameState.gameMode === 'right-filled')) {
                rightPieces.push({
                    id: `right-${idx}-${item.rightPart}`,
                    text: item.rightPart,
                    type: rightType,
                    color: 'bg-blue-500',
                    itemIdx: idx,
                    sortIndex: (idx * 0.731 + (item.rightPart?.charCodeAt(0) || 0) * 0.017) % 1
                });
            }
        });

        // Stable pseudo-random sort
        const allPieces = [...leftPieces, ...rightPieces].sort((a, b) => {
            const sumA = (a.text || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + (a.itemIdx || 0);
            const sumB = (b.text || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + (b.itemIdx || 0);
            return (sumA % 7) - (sumB % 7) || (a.id || '').localeCompare(b.id || '');
        });

        setScrambledPieces(allPieces);
    }, [gameState.currentStageIndex, gameState.gameStatus, gameState.stages, gameState.gameMode, leftType, rightType]);

    useEffect(() => {
        setupCurrentWord();
    }, [gameState.currentStageIndex, gameState.gameStatus, gameState.gameMode, setupCurrentWord]);

    // Timer ref to cancel auto-advance if user interrupts
    const successTimerRef = useRef(null);

    const handleDrop = useCallback((targetRole) => {
        if (isDragging === null) return; // Allow interaction during success (interrupt)
        const draggingPiece = scrambledPieces.find(s => s.id === isDragging);
        if (!draggingPiece) return;

        // Check if piece type matches target
        const expectedType = targetRole === 'left' ? leftType : rightType;
        if (draggingPiece.type !== expectedType) return;

        // Interrupt success state if active
        if (showSuccess) {
            setShowSuccess(false);
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
                successTimerRef.current = null;
            }
        }

        setPlacedPieces(prev => ({
            ...prev,
            [targetRole]: draggingPiece.text
        }));

        setScrambledPieces(prev => prev.filter(s => s.id !== isDragging));
        setIsDragging(null);
    }, [isDragging, showSuccess, scrambledPieces, leftType, rightType]);

    const removePieceFromSlot = useCallback((role) => {
        // Unlock interaction
        const text = placedPieces[role];
        if (!text) return;

        // Interrupt success state if active
        if (showSuccess) {
            setShowSuccess(false);
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
                successTimerRef.current = null;
            }
        }

        setPlacedPieces(prev => ({
            ...prev,
            [role]: null
        }));

        // Add back to scrambled
        const type = role === 'left' ? leftType : rightType;
        const newPiece = {
            id: `return-${role}-${Math.random()}`,
            text,
            type,
            color: 'bg-blue-500',
            sortIndex: Math.random()
        };
        setScrambledPieces(prev => [...prev, newPiece]);
    }, [showSuccess, placedPieces, leftType, rightType]);

    // Check for correct answer
    useEffect(() => {
        if (showSuccess) return;
        if (!placedPieces.left || !placedPieces.right) return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage || !currentStage.items) return;

        const targetIdx = currentStage.targetIndex ?? 0;
        const targetItem = currentStage.items[targetIdx];
        if (!targetItem) return;

        const formedText = placedPieces.left + placedPieces.right;

        if (targetItem.fullText === formedText) {
            setShowSuccess(true);

            successTimerRef.current = setTimeout(() => {
                setShowSuccess(false);
                setPlacedPieces({ left: null, right: null });
                successTimerRef.current = null;

                const nextIdx = targetIdx + 1;
                setGameState(prev => {
                    const stage = prev.stages[prev.currentStageIndex];
                    if (!stage || !stage.items) return prev;

                    const itemsCount = stage.items.length;
                    const newStages = prev.stages.map((s, idx) => {
                        if (idx === prev.currentStageIndex) {
                            return {
                                ...s,
                                completedIndices: [...s.completedIndices, targetIdx],
                                targetIndex: nextIdx < itemsCount ? nextIdx : s.targetIndex
                            };
                        }
                        return s;
                    });

                    const isStageFinished = nextIdx >= itemsCount;
                    const isFinalStage = prev.currentStageIndex >= prev.stages.length - 1;

                    return {
                        ...prev,
                        stages: newStages,
                        gameStatus: isStageFinished
                            ? (isFinalStage ? 'all-complete' : 'stage-complete')
                            : 'playing'
                    };
                });
            }, successDelay);
        }
    }, [placedPieces, gameState.currentStageIndex, gameState.stages, showSuccess, successDelay]);

    const handleUpdateWordsCount = useCallback((delta) => {
        const nextValue = Math.max(2, Math.min(8, pendingWordsCount + delta));
        if (nextValue === pendingWordsCount) return;
        setPendingWordsCount(nextValue);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = window.setTimeout(() => {
            startNewGame(nextValue);
            debounceTimerRef.current = null;
        }, 1200);
    }, [pendingWordsCount, startNewGame]);

    const handleModeChange = useCallback((mode) => {
        setGameState(prev => ({ ...prev, gameMode: mode }));
    }, []);

    const setScale = useCallback((scale) => {
        setGameState(prev => ({ ...prev, pieceScale: scale }));
    }, []);

    const advanceToNextStage = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            currentStageIndex: prev.currentStageIndex + 1,
            gameStatus: 'playing'
        }));
    }, []);

    // Calculate progress
    const totalItems = useMemo(() =>
        gameState.stages.reduce((acc, stage) => acc + (stage.items?.length || 0), 0),
        [gameState.stages]
    );

    const progress = useMemo(() => {
        if (totalItems === 0) return 0;
        const completedPriorStages = gameState.stages
            .slice(0, gameState.currentStageIndex)
            .reduce((acc, stage) => acc + (stage.items?.length || 0), 0);
        const currentStage = gameState.stages[gameState.currentStageIndex];
        const currentTargetIdx = currentStage?.targetIndex ?? 0;
        return Math.min(100, ((completedPriorStages + currentTargetIdx + 1) / totalItems) * 100);
    }, [gameState.stages, gameState.currentStageIndex, totalItems]);

    const currentStageInfo = gameState.stages[gameState.currentStageIndex];
    const currentTargetIdx = currentStageInfo?.targetIndex ?? 0;
    const currentTargetItem = currentStageInfo?.items?.[currentTargetIdx];

    return {
        // State
        gameState,
        scrambledPieces,
        placedPieces,
        isDragging,
        showSuccess,
        pendingWordsCount,
        progress,
        totalItems,
        currentStageInfo,
        currentTargetIdx,
        currentTargetItem,

        // Actions
        startNewGame,
        handleDrop,
        removePieceFromSlot,
        handleUpdateWordsCount,
        handleModeChange,
        setScale,
        setIsDragging,
        advanceToNextStage
    };
};

export default useTwoPartPuzzle;
