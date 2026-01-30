import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePreventTouchScroll } from './usePreventTouchScroll';

/**
 * Shared hook for two-part puzzle exercises (Silbenbau 1 & Silbenpuzzle 1).
 * 
 * SLOT-BASED ARCHITECTURE:
 * - Pieces are NEVER deleted, only moved between pool and slots
 * - Visibility is computed dynamically (pieces in slots or used are hidden from pool)
 * - This prevents unsolvable situations
 * 
 * @param {Object} config
 * @param {Array} config.items - Array of { leftPart, rightPart, fullText } objects
 * @param {string} config.leftType - Piece type for left side (e.g., 'left' or 'zigzag-left')
 * @param {string} config.rightType - Piece type for right side (e.g., 'right' or 'zigzag-right')
 * @param {number} config.initialScale - Initial piece scale (default: 1.0)
 * @param {number} config.successDelay - Delay after success before next item (default: 1000ms)
 * @param {boolean} config.manualAdvance - If true, user must click "Weiter" to advance
 */
export const useTwoPartPuzzle = ({
    items = [],
    leftType = 'left',
    rightType = 'right',
    initialScale = 0.7,
    successDelay = 1000,
    manualAdvance = false
}) => {
    // ==========================================================================
    // STATE
    // ==========================================================================

    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: initialScale,
        wordsPerStage: 3,
        gameMode: 'both-empty',
        gameId: 0 // Track unique game sessions to force effect re-runs
    });

    const [pendingWordsCount, setPendingWordsCount] = useState(3);
    const debounceTimerRef = useRef(null);

    // ALL pieces for the current stage (never modified after generation)
    const [allPieces, setAllPieces] = useState([]);

    // Current slots: { left: piece | null, right: piece | null }
    const [slots, setSlots] = useState({ left: null, right: null });

    // IDs of pieces that have been used in completed words
    const [usedPieceIds, setUsedPieceIds] = useState(new Set());

    const [isDragging, setIsDragging] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Tap-to-Select state
    const [selectedPiece, setSelectedPiece] = useState(null);

    const successTimerRef = useRef(null);
    const lastGeneratedStageRef = useRef(-1); // Track which stage we last generated pieces for
    const stagesRef = useRef([]); // Ref to access stages without re-triggering effects

    // ==========================================================================
    // COMPUTED: Visible pieces (not in slots and not used)
    // ==========================================================================

    const visiblePieces = useMemo(() => {
        const slotPieceIds = new Set();
        if (slots.left) slotPieceIds.add(slots.left.id);
        if (slots.right) slotPieceIds.add(slots.right.id);

        return allPieces.filter(p =>
            !slotPieceIds.has(p.id) && !usedPieceIds.has(p.id)
        );
    }, [allPieces, slots, usedPieceIds]);

    // ==========================================================================
    // iPad Fix: Prevent touch scrolling during drag
    // ==========================================================================

    usePreventTouchScroll(isDragging);

    // ==========================================================================
    // HELPER: Generate Pieces for a stage
    // ==========================================================================

    const generatePiecesHelper = useCallback((stageIndex, stageItems) => {
        if (!stageItems) return [];
        const pieces = [];

        // Generate pieces for ALL items in the stage
        stageItems.forEach((item, idx) => {
            // Left Part
            pieces.push({
                id: `left-${stageIndex}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                text: item.leftPart,
                type: leftType,
                color: 'bg-blue-500',
                itemIdx: idx
            });

            // Right Part
            pieces.push({
                id: `right-${stageIndex}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                text: item.rightPart,
                type: rightType,
                color: 'bg-blue-500',
                itemIdx: idx
            });
        });

        // Shuffle pieces
        pieces.sort(() => Math.random() - 0.5);
        return pieces;
    }, [leftType, rightType]);

    // ==========================================================================
    // GAME INITIALIZATION
    // ==========================================================================

    const startNewGame = useCallback((customWordsPerStage) => {
        const wps = customWordsPerStage !== undefined ? customWordsPerStage : pendingWordsCount;

        // Reset all state
        setSlots({ left: null, right: null });
        // setAllPieces([]); // Don't clear here, we will set them synchronously below
        setUsedPieceIds(new Set());
        setShowSuccess(false);
        setIsDragging(null);
        setSelectedPiece(null);

        // Force reset refs
        lastGeneratedStageRef.current = -1;

        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }

        if (!items || items.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [] }));
            setAllPieces([]);
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

        // SYNCHRONOUS GENERATION FOR FIRST STAGE
        // This ensures pieces are ready immediately, no useEffect delay
        let initialPieces = [];
        if (newStages.length > 0) {
            initialPieces = generatePiecesHelper(0, newStages[0].items);
            lastGeneratedStageRef.current = 0; // Mark 0 as generated so effect skips it
        }

        setAllPieces(initialPieces);

        setGameState({
            stages: newStages,
            currentStageIndex: 0,
            gameStatus: 'playing',
            pieceScale: initialScale,
            wordsPerStage: wps,
            gameMode: 'both-empty',
            gameId: (gameState.gameId || 0) + 1
        });
    }, [pendingWordsCount, items, initialScale, generatePiecesHelper, gameState.gameId]);

    // Auto-start game when items change
    useEffect(() => {
        if (items && items.length > 0) {
            startNewGame();
        } else {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [] }));
        }
    }, [items]); // Only depend on items

    // ==========================================================================
    // STAGE SETUP: Generate pieces when stage changes
    // ==========================================================================

    // Keep stagesRef in sync with gameState.stages
    useEffect(() => {
        stagesRef.current = gameState.stages;
    }, [gameState.stages]);

    useEffect(() => {
        if (gameState.gameStatus !== 'playing') return;

        // Only generate pieces if we're entering a NEW stage
        if (lastGeneratedStageRef.current === gameState.currentStageIndex) {
            return; // Already generated for this stage
        }

        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage || !currentStage.items) return;

        // Use helper to generate pieces
        const pieces = generatePiecesHelper(gameState.currentStageIndex, currentStage.items);

        lastGeneratedStageRef.current = gameState.currentStageIndex;
        setAllPieces(pieces);
        setSlots({ left: null, right: null });
        setUsedPieceIds(new Set());
        setShowSuccess(false);

    }, [gameState.currentStageIndex, gameState.gameStatus, gameState.gameId, generatePiecesHelper]); // Removed leftType/rightType as they are in helper dependency

    // ==========================================================================
    // GAME MODE: Pre-fill slots based on mode
    // ==========================================================================

    useEffect(() => {
        if (gameState.gameStatus !== 'playing') return;
        if (gameState.gameMode === 'both-empty') return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage) return;

        const targetIdx = currentStage.targetIndex ?? 0;
        const currentItem = currentStage.items[targetIdx];
        if (!currentItem) return;

        // Find pieces for the current target that aren't used yet
        const availablePieces = allPieces.filter(p => !usedPieceIds.has(p.id));

        if (gameState.gameMode === 'left-filled' && !slots.left) {
            const leftPiece = availablePieces.find(p =>
                p.type === leftType && p.itemIdx === targetIdx
            );
            if (leftPiece) {
                setSlots(prev => ({ ...prev, left: leftPiece }));
            }
        }

        if (gameState.gameMode === 'right-filled' && !slots.right) {
            const rightPiece = availablePieces.find(p =>
                p.type === rightType && p.itemIdx === targetIdx
            );
            if (rightPiece) {
                setSlots(prev => ({ ...prev, right: rightPiece }));
            }
        }
    }, [gameState.gameMode, gameState.currentStageIndex, gameState.stages, gameState.gameStatus, allPieces, usedPieceIds, leftType, rightType, slots]);

    // ==========================================================================
    // TAP-TO-SELECT INTERACTIONS
    // ==========================================================================

    const handlePieceSelect = useCallback((piece) => {
        if (!piece) {
            setSelectedPiece(null);
            return;
        }

        // Toggle selection: deselect if clicking same piece
        if (selectedPiece?.id === piece.id) {
            setSelectedPiece(null);
        } else {
            setSelectedPiece(piece);
        }
    }, [selectedPiece]);

    const handleSlotSelect = useCallback((targetRole) => {
        if (!selectedPiece) return;

        // Check if piece type matches target
        const expectedType = targetRole === 'left' ? leftType : rightType;
        if (selectedPiece.type !== expectedType) {
            setSelectedPiece(null);
            return;
        }

        // Interrupt success state if active
        if (showSuccess) {
            setShowSuccess(false);
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
                successTimerRef.current = null;
            }
        }

        // Place the piece
        setSlots(prev => {
            const newSlots = { ...prev };
            // If piece was in another slot, clear that slot
            if (prev.left?.id === selectedPiece.id) newSlots.left = null;
            if (prev.right?.id === selectedPiece.id) newSlots.right = null;
            newSlots[targetRole] = selectedPiece;
            return newSlots;
        });

        setSelectedPiece(null);
    }, [selectedPiece, leftType, rightType, showSuccess]);

    // ==========================================================================
    // DRAG-AND-DROP INTERACTIONS
    // ==========================================================================

    const handleDrop = useCallback((targetRole) => {
        if (isDragging === null) return;

        // Find the piece being dragged from visible pieces
        const draggingPiece = visiblePieces.find(p => p.id === isDragging);
        if (!draggingPiece) {
            // Maybe it's in a slot already (swapping)
            const slotPiece = slots.left?.id === isDragging ? slots.left :
                slots.right?.id === isDragging ? slots.right : null;
            if (!slotPiece) {
                setIsDragging(null);
                return;
            }
        }

        const pieceToPlace = draggingPiece ||
            (slots.left?.id === isDragging ? slots.left : slots.right);

        if (!pieceToPlace) {
            setIsDragging(null);
            return;
        }

        // Check if piece type matches target
        const expectedType = targetRole === 'left' ? leftType : rightType;
        if (pieceToPlace.type !== expectedType) {
            setIsDragging(null);
            return;
        }

        // Interrupt success state if active
        if (showSuccess) {
            setShowSuccess(false);
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
                successTimerRef.current = null;
            }
        }

        // If piece was in another slot, clear that slot
        setSlots(prev => {
            const newSlots = { ...prev };
            if (prev.left?.id === pieceToPlace.id) newSlots.left = null;
            if (prev.right?.id === pieceToPlace.id) newSlots.right = null;
            newSlots[targetRole] = pieceToPlace;
            return newSlots;
        });

        setIsDragging(null);
    }, [isDragging, visiblePieces, slots, showSuccess, leftType, rightType]);

    const removePieceFromSlot = useCallback((role) => {
        if (!slots[role]) return;

        // Interrupt success state if active
        if (showSuccess) {
            setShowSuccess(false);
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
                successTimerRef.current = null;
            }
        }

        setSlots(prev => ({
            ...prev,
            [role]: null
        }));
    }, [showSuccess, slots]);

    // ==========================================================================
    // SUCCESS CHECK & ADVANCEMENT
    // ==========================================================================

    const advanceToNextTarget = useCallback((matchedIdx) => {
        // Mark the matched pieces as used
        const leftPiece = slots.left;
        const rightPiece = slots.right;

        if (leftPiece && rightPiece) {
            setUsedPieceIds(prev => {
                const next = new Set(prev);
                next.add(leftPiece.id);
                next.add(rightPiece.id);
                return next;
            });
        }

        // Clear slots
        setSlots({ left: null, right: null });
        setShowSuccess(false);

        // Update game state
        setGameState(prev => {
            const stage = prev.stages[prev.currentStageIndex];
            if (!stage || !stage.items) return prev;

            const newCompletedIndices = [...(stage.completedIndices || []), matchedIdx];

            // Find next uncompleted item
            let nextTargetIdx = 0;
            while (newCompletedIndices.includes(nextTargetIdx) && nextTargetIdx < stage.items.length) {
                nextTargetIdx++;
            }

            const allItemsCompleted = newCompletedIndices.length >= stage.items.length;

            const newStages = prev.stages.map((s, idx) => {
                if (idx === prev.currentStageIndex) {
                    return {
                        ...s,
                        completedIndices: newCompletedIndices,
                        targetIndex: nextTargetIdx < stage.items.length ? nextTargetIdx : 0
                    };
                }
                return s;
            });

            const isFinalStage = prev.currentStageIndex >= prev.stages.length - 1;

            return {
                ...prev,
                stages: newStages,
                gameStatus: allItemsCompleted
                    ? (isFinalStage ? 'all-complete' : 'stage-complete')
                    : 'playing'
            };
        });
    }, [slots]);

    // Check for correct answer
    useEffect(() => {
        if (showSuccess) return;
        if (!slots.left || !slots.right) return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage || !currentStage.items) return;

        const formedText = slots.left.text + slots.right.text;
        const completedIndices = currentStage.completedIndices || [];

        // Find ANY remaining word that matches the formed text
        const matchingItemIdx = currentStage.items.findIndex((item, idx) =>
            !completedIndices.includes(idx) && item.fullText === formedText
        );

        if (matchingItemIdx !== -1) {
            setShowSuccess(true);

            if (!manualAdvance) {
                successTimerRef.current = setTimeout(() => {
                    advanceToNextTarget(matchingItemIdx);
                }, successDelay);
            }
        }
    }, [slots, gameState.currentStageIndex, gameState.stages, showSuccess, successDelay, manualAdvance, advanceToNextTarget]);

    // Manual advance handler (for "Weiter" button)
    const handleNextItem = useCallback(() => {
        if (!showSuccess) return;

        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }

        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage || !currentStage.items) return;

        const formedText = (slots.left?.text || '') + (slots.right?.text || '');
        const completedIndices = currentStage.completedIndices || [];

        // Find the matched word
        const matchingItemIdx = currentStage.items.findIndex((item, idx) =>
            !completedIndices.includes(idx) && item.fullText === formedText
        );

        if (matchingItemIdx !== -1) {
            advanceToNextTarget(matchingItemIdx);
        } else {
            // Fallback: just clear and show next
            setSlots({ left: null, right: null });
            setShowSuccess(false);
        }
    }, [showSuccess, gameState.stages, gameState.currentStageIndex, slots, advanceToNextTarget]);

    // ==========================================================================
    // OTHER CALLBACKS
    // ==========================================================================

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
        // Clear slots when mode changes
        setSlots({ left: null, right: null });
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

    // ==========================================================================
    // COMPUTED VALUES
    // ==========================================================================

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
        const completedInCurrentStage = (currentStage?.completedIndices?.length || 0);
        return Math.min(100, ((completedPriorStages + completedInCurrentStage) / totalItems) * 100);
    }, [gameState.stages, gameState.currentStageIndex, totalItems]);

    // --------------------------------------------------------------------------------
    // DYNAMIC ZOOM & SIDEBAR WIDTH CALCULATION (for two-part puzzles)
    // --------------------------------------------------------------------------------

    // Calculate longest word width in current stage (base width before scaling)
    const longestWordBaseWidth = useMemo(() => {
        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage?.items) return 310; // Fallback for 2-syllable word (200 + 200 - 90 overlap)

        let maxWidth = 0;
        currentStage.items.forEach(item => {
            // Two-part puzzles always have 2 pieces
            // Each piece is ~200px base, with ~90px overlap
            const wordWidth = 200 + 200 - 90; // = 310px
            if (wordWidth > maxWidth) maxWidth = wordWidth;
        });

        return Math.max(300, maxWidth);
    }, [gameState.stages, gameState.currentStageIndex]);

    // Calculate max allowed scale based on viewport and longest word
    const maxScale = useMemo(() => {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const maxSidebarWidth = 220;
        const uiElementsWidth = 180; // Speaker + Check + padding

        // Available middle space with max sidebar width
        const availableMiddle = viewportWidth - (2 * maxSidebarWidth);

        // Scale at which longest word + UI fits in available middle
        const maxByMiddle = (availableMiddle - uiElementsWidth) / longestWordBaseWidth;

        // Scale at which pieces fit in sidebar (piece base 200px * scale)
        const maxBySidebar = maxSidebarWidth / 200;

        // Return the smaller constraint, clamped between 0.7 and 1.3
        return Math.max(0.7, Math.min(1.3, maxByMiddle, maxBySidebar));
    }, [longestWordBaseWidth]);

    // Dynamic sidebar width based on current scale
    const sidebarWidth = useMemo(() => {
        const baseWidth = 220; // Increased base width to prevent clipping
        const width = Math.round(200 * gameState.pieceScale) + 40; // Add buffer for padding
        return Math.max(baseWidth, Math.min(300, width));
    }, [gameState.pieceScale]);

    // Auto-reduce scale if it exceeds maxScale (e.g., when stage changes)
    useEffect(() => {
        if (gameState.pieceScale > maxScale) {
            setGameState(prev => ({ ...prev, pieceScale: maxScale }));
        }
    }, [maxScale, gameState.currentStageIndex]);


    const currentStageInfo = gameState.stages[gameState.currentStageIndex];
    const currentTargetIdx = currentStageInfo?.targetIndex ?? 0;
    const currentTargetItem = currentStageInfo?.items?.[currentTargetIdx];

    // ==========================================================================
    // RETURN
    // ==========================================================================

    return {
        // State
        gameState,
        scrambledPieces: visiblePieces, // For compatibility with existing layout
        placedPieces: { // For compatibility with existing layout
            left: slots.left,
            right: slots.right
        },
        isDragging,
        showSuccess,
        pendingWordsCount,
        progress,
        totalItems,
        currentStageInfo,
        currentTargetIdx,
        currentTargetItem,
        selectedPiece,
        maxScale,      // Dynamic max zoom based on viewport and word length
        sidebarWidth,  // Dynamic sidebar width based on current scale

        // Actions
        startNewGame,
        handleDrop,
        removePieceFromSlot,
        handleUpdateWordsCount,
        handleModeChange,
        setScale,
        setIsDragging,
        advanceToNextStage,
        handleNextItem,
        handlePieceSelect,
        handleSlotSelect
    };
};

export default useTwoPartPuzzle;
