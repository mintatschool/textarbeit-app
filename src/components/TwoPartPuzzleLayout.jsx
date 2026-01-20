import React, { useMemo } from 'react';
import {
    Volume2,
    VolumeX,
    CheckCircle2,
    ChevronRight,
    Minus,
    Plus,
    AlertCircle
} from 'lucide-react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { ProgressBar } from './ProgressBar';
import PuzzleTestPiece from './PuzzleTestPiece';

/**
 * Shared layout component for two-part puzzle exercises.
 * Used by both SyllableCompositionView and PuzzleTestTwoSyllableView.
 */

const HorizontalLines = ({ count }) => (
    <div className="flex flex-col gap-[2px] w-2 items-center justify-center">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
        ))}
    </div>
);

// Mode Icon - can be customized via renderModeIcon prop
const DefaultModeIcon = ({ mode, active }) => {
    const primaryColor = active ? '#3b82f6' : '#94a3b8';
    const strokeColor = active ? '#2563eb' : '#cbd5e1';
    const fillLeft = mode === 'left-filled' ? primaryColor : 'none';
    const fillRight = mode === 'right-filled' ? primaryColor : 'none';

    const LARGE_PUZZLE_LEFT = "M 0,20 Q 0,0 20,0 H 120 Q 140,0 140,20 V 45 C 190,30 190,120 140,105 V 130 Q 140,150 120,150 H 20 Q 0,150 0,130 Z";
    const LARGE_PUZZLE_RIGHT = "M 30,20 Q 30,0 50,0 H 200 Q 220,0 220,20 V 130 Q 220,150 200,150 H 50 Q 30,150 30,130 V 105 C 80,120 80,30 30,45 Z";

    return (
        <svg width="60" height="35" viewBox="0 0 420 180" className="overflow-visible transition-all duration-300">
            <path
                d={LARGE_PUZZLE_LEFT}
                fill={fillLeft}
                stroke={strokeColor}
                strokeWidth="24"
                className="transition-colors duration-300"
            />
            <path
                d={LARGE_PUZZLE_RIGHT}
                fill={fillRight}
                stroke={strokeColor}
                strokeWidth="24"
                transform="translate(140, 0)"
                className="transition-colors duration-300"
            />
        </svg>
    );
};

export const TwoPartPuzzleLayout = ({
    // State from hook
    gameState,
    scrambledPieces,
    placedPieces,
    isDragging,
    showSuccess,
    pendingWordsCount,
    progress,
    currentStageInfo,
    currentTargetIdx,
    currentTargetItem,
    selectedPiece,

    // Actions from hook
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
    handleSlotSelect,

    // Props
    onClose,
    title,
    subtitle = "2 Teile",
    settings = {},
    leftType = 'left',
    rightType = 'right',
    overlap = 25,

    // Customization
    icon: HeaderIcon = Icons.SyllableTestTwo,
    renderModeIcon: ModeIcon = DefaultModeIcon,
    onSpeak,
    emptyMessage = "Keine passenden Wörter gefunden.",
    emptyHint = "Bitte markiere passende Wörter.",
    allCompleteMessage = "Alle geschafft!",
    stageCompleteMessage = "Level geschafft!",
    activeColor, // Added activeColor prop
    hideSpeakerToggle = false,
    manualAdvance = false
}) => {
    const { gameStatus } = gameState;

    console.log("TwoPartPuzzleLayout RENDER START:", {
        gameStatus,
        stageIndex: gameState.currentStageIndex,
        scrambledPiecesCount: scrambledPieces ? scrambledPieces.length : 'null',
        scrambledPiecesSample: scrambledPieces ? scrambledPieces.slice(0, 3) : [],
        leftType,
        rightType,
        placedPieces
    });

    const getTextPadding = (type) => {
        // Start pieces (Knob/Arrow on Right) -> Need Padding Right to shift text Left
        // Increased from pr-12 to pr-20 to shift text further left
        if (type === 'left' || type === 'zigzag-left') return 'pr-20';

        // End pieces (Hole/Arrow-In on Left) -> Need Padding Left to shift text Right
        // Using pr instead of pl to shift text further left
        if (type === 'right' || type === 'zigzag-right') return 'pr-10';

        // Middle pieces (Hole Left, Knob Right) -> Shift left
        if (type === 'middle' || type === 'zigzag-middle') return 'pr-14';

        return 'pr-4 pl-1';
    };

    const [audioEnabled, setAudioEnabled] = React.useState(true);

    const getPieceColor = (pieceColor) => {
        if (activeColor === 'neutral') return 'bg-blue-500'; // Default to blue
        if (activeColor && activeColor !== 'neutral') return activeColor;
        return pieceColor || 'bg-blue-500';
    };

    // Loading state
    if (gameStatus === 'loading' || !scrambledPieces) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-50">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold text-blue-900 animate-pulse">Übung wird geladen...</p>
            </div>
        );
    }

    // Empty state - no valid items
    if (gameStatus === 'playing' && (!currentStageInfo || gameState.stages.length === 0)) {
        return (
            <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col items-center justify-center p-6">
                <EmptyStateMessage onClose={onClose} secondStepText={emptyHint} />
            </div>
        );
    }

    // Stage/All complete overlay
    if (gameStatus === 'all-complete' || gameStatus === 'stage-complete') {
        const isAllDone = gameStatus === 'all-complete';
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
                <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in duration-300 relative overflow-hidden">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Super!</h2>
                    <p className="text-slate-500 mb-8 font-medium">
                        {isAllDone ? allCompleteMessage : stageCompleteMessage}
                    </p>
                    <button
                        onClick={() => {
                            if (isAllDone) {
                                onClose();
                            } else {
                                advanceToNextStage();
                            }
                        }}
                        className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg relative z-10"
                    >
                        {isAllDone ? 'Beenden' : 'Weiter'} <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
                {/* Confetti */}
                <div className="fixed inset-0 pointer-events-none z-[60]">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="confetti" style={{
                            left: `${Math.random() * 100}%`,
                            backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 4)],
                            animationDuration: `${2 + Math.random() * 3}s`,
                            animationDelay: `${Math.random()}s`
                        }} />
                    ))}
                </div>
            </div>
        );
    }

    const scale = gameState.pieceScale;
    const scaledOverlap = overlap * scale;

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* Header */}
            <header className="bg-white border-b-2 border-blue-100 px-6 py-3 flex justify-between items-center z-20 shadow-md shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 mr-4">
                        <HeaderIcon className="text-blue-600 w-8 h-8" />
                        <span className="text-xl font-bold text-slate-800 hidden md:inline">{title}</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto max-w-[200px] md:max-w-md no-scrollbar py-2 px-1">
                        {gameState.stages.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0 ${gameState.currentStageIndex === idx
                                    ? 'bg-blue-600 text-white scale-110 shadow-md'
                                    : idx < gameState.currentStageIndex
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-100 text-gray-300'
                                    }`}
                            >
                                {idx + 1}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Audio Toggle */}
                    {!hideSpeakerToggle && (
                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            title={audioEnabled ? 'Audio an' : 'Audio aus'}
                        >
                            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                    )}

                    {/* Mode Selector */}
                    <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-[1.25rem] border border-slate-200 hidden md:flex">
                        {['both-empty', 'left-filled', 'right-filled'].map((m) => (
                            <button
                                key={m}
                                onClick={() => handleModeChange(m)}
                                className={`
                                    relative px-3 py-1.5 rounded-xl transition-all duration-300
                                    ${gameState.gameMode === m
                                        ? 'bg-white shadow-lg scale-105 border border-blue-100'
                                        : 'hover:bg-white/50 border border-transparent'}
                                    active:scale-95
                                `}
                                title={m === 'both-empty' ? 'Beide Teile finden' : m === 'left-filled' ? 'Zweiten Teil finden' : 'Ersten Teil finden'}
                            >
                                <div className="transform scale-75 origin-center">
                                    <ModeIcon mode={m} active={gameState.gameMode === m} />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Words per Stage */}
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                        <HorizontalLines count={2} />
                        <button
                            onClick={() => handleUpdateWordsCount(-1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1"
                            disabled={pendingWordsCount <= 2}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center min-w-[24px]">
                            <span className={`text-xl font-black transition-colors leading-none ${pendingWordsCount !== gameState.wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                {pendingWordsCount}
                            </span>
                        </div>
                        <button
                            onClick={() => handleUpdateWordsCount(1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1"
                            disabled={pendingWordsCount >= 8}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <HorizontalLines count={5} />
                    </div>

                    {/* Scale Slider */}
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input
                            type="range"
                            min="0.7"
                            max="1.3"
                            step="0.1"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 flex items-center justify-center transition-colors shadow-sm ml-2"
                    >
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>

            <ProgressBar progress={progress} />

            {/* Main Content */}
            <main className="flex-1 relative flex overflow-hidden">
                {/* Left Pieces */}
                <div className="w-1/4 relative border-r border-blue-50 bg-white/20 shrink-0 overflow-y-auto overflow-x-hidden custom-scroll py-6 space-y-8 flex flex-col items-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const sourceRole = e.dataTransfer.getData("source-role");
                        if (sourceRole) removePieceFromSlot(sourceRole);
                    }}
                >
                    {scrambledPieces.filter(s => s.type === leftType).map(s => {
                        const isSelected = selectedPiece?.id === s.id;
                        return (
                            <div
                                key={s.id}
                                className={`transition-all duration-200 cursor-pointer ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 active:scale-95 z-20'
                                    }`}
                                style={{
                                    zIndex: isDragging === s.id ? 100 : (isSelected ? 50 : 10),
                                    filter: isSelected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : 'none'
                                }}
                                onClick={() => handlePieceSelect?.(s)}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <PuzzleTestPiece
                                    label={s.text}
                                    type={leftType}
                                    colorClass={getPieceColor(s.color)}
                                    scale={scale}
                                    onDragStart={() => setIsDragging(s.id)}
                                    onDragEnd={() => setIsDragging(null)}
                                    isDragging={isDragging === s.id}
                                    fontFamily={settings.fontFamily}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Center - Drop Zone */}
                <div className="flex-1 flex flex-col px-4 relative overflow-y-hidden overflow-x-auto">


                    {/* Target Area - using m-auto for safe centering (centers if fits, aligns start if overflows) */}
                    <div className="m-auto flex flex-col items-center gap-4 w-fit p-4">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{subtitle}</span>

                        <div className={`
                            relative flex items-center justify-center transition-all duration-500 py-8
                            ${showSuccess ? 'scale-105' : ''}
                        `}>
                            <div className="flex items-center gap-8">
                                <div className="flex items-center relative">
                                    {['left', 'right'].map((role, idx) => {
                                        // placedPieces now contains piece objects, not just text
                                        const placedPiece = placedPieces[role];
                                        const pieceText = placedPiece?.text || placedPiece; // Handle both object and legacy string
                                        const typeName = role === 'left' ? leftType : rightType;

                                        return (
                                            <div
                                                key={role}
                                                className={`relative flex items-center justify-center transition-all duration-300 group overflow-visible ${!pieceText && selectedPiece && selectedPiece.type === (role === 'left' ? leftType : rightType)
                                                    ? 'scale-105 cursor-pointer'
                                                    : ''
                                                    }`}
                                                style={{
                                                    width: `${200 * scale}px`,
                                                    height: `${110 * scale}px`,
                                                    marginLeft: idx === 0 ? 0 : `-${scaledOverlap}px`,
                                                    zIndex: idx === 0 ? 2 : 1,
                                                    filter: !pieceText && selectedPiece && selectedPiece.type === (role === 'left' ? leftType : rightType)
                                                        ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.7))'
                                                        : 'none'
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    handleDrop(role);
                                                }}
                                                onClick={() => {
                                                    // If slot is empty and piece is selected, place it
                                                    if (!pieceText && selectedPiece) {
                                                        handleSlotSelect?.(role);
                                                    }
                                                }}
                                            >
                                                <div className="absolute inset-[-20px] z-0" />

                                                {/* Empty Slot Ghost */}
                                                {!pieceText && (
                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                        <PuzzleTestPiece
                                                            label=""
                                                            type={typeName}
                                                            isGhost={true}
                                                            scale={scale}
                                                            fontFamily={settings.fontFamily}
                                                        />
                                                    </div>
                                                )}

                                                {/* Filled Slot */}
                                                {pieceText && (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform touch-none"
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("source-role", role);
                                                        }}
                                                        onClick={() => removePieceFromSlot(role)}
                                                        onContextMenu={(e) => e.preventDefault()}
                                                    >
                                                        <PuzzleTestPiece
                                                            label={pieceText}
                                                            type={typeName}
                                                            colorClass={getPieceColor()} // Use activeColor or default
                                                            scale={scale}
                                                            showSeamLine={true}
                                                            fontFamily={settings.fontFamily}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Success Checkmark & Audio Group */}
                                <div className="flex flex-col items-center gap-4 ml-6">
                                    <div className="flex items-center gap-5">
                                        {/* Speaker */}
                                        {audioEnabled && (
                                            <button
                                                onClick={() => onSpeak && currentTargetItem && onSpeak(currentTargetItem)}
                                                className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 shrink-0 z-10"
                                                title="Anhören"
                                            >
                                                <Volume2 className="w-7 h-7" />
                                            </button>
                                        )}

                                        {/* Checkmark - Flex Item for reliable alignment */}
                                        <div className={`transition-all duration-500 ease-out flex items-center
                                                ${showSuccess ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                                            `}>
                                            <CheckCircle2
                                                className="text-green-500 drop-shadow-2xl"
                                                style={{ width: '56px', height: '56px' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Manual Advance Button - Below Speaker/Checkmark */}
                                    {manualAdvance && showSuccess && (
                                        <div className="animate-in slide-in-from-top-4 duration-300 mt-6">
                                            <button
                                                onClick={handleNextItem}
                                                className="bg-blue-600 hover:bg-blue-700 text-white pl-6 pr-4 py-3 rounded-2xl font-bold shadow-xl text-lg hover:scale-105 transition-all flex items-center gap-2 ring-4 ring-white/50 whitespace-nowrap"
                                            >
                                                Weiter <ChevronRight size={24} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Pieces */}
                <div className="w-1/4 relative border-l border-blue-50 bg-white/20 shrink-0 overflow-y-auto overflow-x-hidden custom-scroll py-6 space-y-8 flex flex-col items-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const sourceRole = e.dataTransfer.getData("source-role");
                        if (sourceRole) removePieceFromSlot(sourceRole);
                    }}
                >
                    {scrambledPieces.filter(s => s.type === rightType).map(s => {
                        const isSelected = selectedPiece?.id === s.id;
                        return (
                            <div
                                key={s.id}
                                className={`transition-all duration-200 cursor-pointer ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 active:scale-95 z-20'
                                    }`}
                                style={{
                                    zIndex: isDragging === s.id ? 100 : (isSelected ? 50 : 10),
                                    filter: isSelected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : 'none'
                                }}
                                onClick={() => handlePieceSelect?.(s)}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <PuzzleTestPiece
                                    label={s.text}
                                    type={rightType}
                                    colorClass={getPieceColor(s.color)}
                                    scale={scale}
                                    onDragStart={() => setIsDragging(s.id)}
                                    onDragEnd={() => setIsDragging(null)}
                                    isDragging={isDragging === s.id}
                                    fontFamily={settings.fontFamily}
                                />
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default TwoPartPuzzleLayout;
