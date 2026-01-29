import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

import { shuffleArray } from '../utils/arrayUtils';
import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { polyfill } from 'mobile-drag-drop';
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour';
polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride });
export const SyllablePuzzleView = ({ words, settings, setSettings, onClose, title }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center p-6"><EmptyStateMessage onClose={onClose} secondStepText="Wörter zum Puzzeln markieren." /></div>);
    const [puzzleWords, setPuzzleWords] = useState([]);
    const [placedPieces, setPlacedPieces] = useState({});
    const [poolPieces, setPoolPieces] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPiece, setSelectedPiece] = useState(null); // For Click-to-Place
    const dragItemRef = useRef(null);

    useEffect(() => {
        if (!isDragging) return;
        const preventDefault = (e) => { e.preventDefault(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('touchmove', preventDefault, { passive: false });
        return () => { document.body.style.overflow = ''; document.removeEventListener('touchmove', preventDefault); };
    }, [isDragging]);

    useEffect(() => {
        const pWords = words.map(w => { return { id: w.id, fullWord: w.word, syllables: w.syllables, pieces: w.syllables.map((txt, idx) => ({ id: `${w.id}_syl_${idx}`, text: txt, wordId: w.id, index: idx, isStart: idx === 0, isEnd: idx === w.syllables.length - 1, isSolo: w.syllables.length === 1 })) }; });
        setPuzzleWords(shuffleArray(pWords));
        const allPieces = pWords.flatMap(w => w.pieces);
        for (let i = allPieces.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[allPieces[i], allPieces[j]] = [allPieces[j], allPieces[i]]; }
        setPoolPieces(allPieces);
        setPlacedPieces({});
        setShowReward(false);
    }, [JSON.stringify(words)]);

    useEffect(() => {
        const totalSlots = puzzleWords.reduce((acc, w) => acc + w.syllables.length, 0);
        const isFull = Object.keys(placedPieces).length === totalSlots;
        if (words.length > 0 && totalSlots > 0 && isFull) {
            let allRowsCorrect = true;
            puzzleWords.forEach(wordDef => { const rowPieces = []; for (let i = 0; i < wordDef.syllables.length; i++) { const slotId = `${wordDef.id}_${i}`; if (placedPieces[slotId]) rowPieces.push(placedPieces[slotId].text); } const formedWord = rowPieces.join(''); const match = puzzleWords.find(w => w.fullWord === formedWord && w.syllables.length === wordDef.syllables.length); if (!match) allRowsCorrect = false; });
            if (allRowsCorrect) setTimeout(() => setShowReward(true), 200);
        }
    }, [placedPieces, words, puzzleWords]);

    const handleDragStart = (e, piece, source, slotId = null) => { setIsDragging(true); dragItemRef.current = { piece, source, slotId }; e.dataTransfer.setData('application/json', JSON.stringify(piece)); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => e.target.classList.add('dragging'), 0); };
    const handleDragEnd = (e) => { setIsDragging(false); e.target.classList.remove('dragging'); dragItemRef.current = null; document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target')); };
    const handleSlotDrop = (e, targetWordId, targetIndex) => { setIsDragging(false); e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target')); const dragData = dragItemRef.current; if (!dragData) return; const { piece, source, slotId: sourceSlotId } = dragData; const targetSlotId = `${targetWordId}_${targetIndex}`; if (source === 'slot' && sourceSlotId === targetSlotId) return; const existingPiece = placedPieces[targetSlotId]; setPlacedPieces(prev => { const newPlaced = { ...prev, [targetSlotId]: piece }; if (source === 'slot' && sourceSlotId) delete newPlaced[sourceSlotId]; return newPlaced; }); setPoolPieces(prev => { let newPool = prev; if (source === 'pool') newPool = newPool.filter(p => p.id !== piece.id); if (existingPiece) newPool = [...newPool, existingPiece]; return newPool; }); };
    const handlePoolDrop = (e) => { setIsDragging(false); e.preventDefault(); e.stopPropagation(); const dragData = dragItemRef.current; if (!dragData) return; const { piece, source, slotId } = dragData; if (source === 'slot') { setPlacedPieces(prev => { const copy = { ...prev }; delete copy[slotId]; return copy; }); setPoolPieces(prev => [...prev, piece]); } };

    // Click-to-Place Handlers
    const handlePoolPieceClick = (piece) => {
        if (selectedPiece?.id === piece.id) {
            setSelectedPiece(null);
        } else {
            setSelectedPiece(piece);
        }
    };

    const handleSlotClick = (targetWordId, targetIndex) => {
        const targetSlotId = `${targetWordId}_${targetIndex}`;

        if (!selectedPiece) {
            // If already filled, return to pool
            if (placedPieces[targetSlotId]) {
                const piece = placedPieces[targetSlotId];
                setPlacedPieces(prev => { const copy = { ...prev }; delete copy[targetSlotId]; return copy; });
                setPoolPieces(prev => [...prev, piece]);
            }
            return;
        }

        // Place the piece
        const pieceToPlace = selectedPiece;
        const existingPiece = placedPieces[targetSlotId];

        setPlacedPieces(prev => ({ ...prev, [targetSlotId]: pieceToPlace }));
        setPoolPieces(prev => {
            let newPool = prev.filter(p => p.id !== pieceToPlace.id);
            if (existingPiece) newPool = [...newPool, existingPiece];
            return newPool;
        });
        setSelectedPiece(null);
    };
    const getPieceStyle = (piece, isPlaced) => { let base = "relative flex items-center justify-center border font-bold select-none min-w-[3rem] px-4 shadow-sm "; base += isPlaced ? "bg-blue-200 text-blue-900 border-blue-300 " : "bg-blue-100 text-blue-900 border-blue-300 "; if (!piece.isStart && !piece.isSolo) base += "pl-2 "; if (!piece.isEnd && !piece.isSolo) base += "pr-10 "; if (piece.isStart || piece.isSolo) base += "rounded-l-2xl pl-2 "; if (piece.isEnd || piece.isSolo) base += "rounded-r-2xl "; return base; };
    const dynamicHeight = Math.max(56, settings.fontSize * 1.5);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message="Alle Silben sortiert! Super!"
            />
            <ExerciseHeader
                title={title || "Silben-Puzzle"}
                icon={Icons.Puzzle}
                current={Object.keys(placedPieces).length}
                total={poolPieces.length + Object.keys(placedPieces).length}
                progressPercentage={(Object.keys(placedPieces).length / (poolPieces.length + Object.keys(placedPieces).length)) * 100}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={16}
                sliderMax={120}
            />
            <div className="flex-1 overflow-y-auto custom-scroll p-6 bg-slate-50/50">
                <div className="max-w-6xl mx-auto grid gap-6 pb-12" style={{ gridTemplateColumns: settings.fontSize > 50 ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                    {puzzleWords.map((word) => {
                        const isWordComplete = word.pieces.every(p => placedPieces[`${word.id}_${p.index}`]?.text === p.text); return (
                            <div key={word.id} className={`p-4 bg-white rounded-xl border flex flex-wrap gap-4 items-center justify-center min-h-[5rem] transition-colors duration-300 ${isWordComplete ? 'border-green-400 bg-green-50 shadow-md' : 'border-slate-200 shadow-sm'}`}>
                                <button
                                    onClick={() => speak(word.fullWord)}
                                    className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 shrink-0"
                                    title="Wort anhören"
                                >
                                    <Icons.Volume2 size={20} />
                                </button>
                                <div className="flex flex-wrap gap-2 items-center justify-center">{word.pieces.map((originalPiece) => { const slotId = `${word.id}_${originalPiece.index}`; const placedPiece = placedPieces[slotId]; return (<div key={slotId} onClick={() => handleSlotClick(word.id, originalPiece.index)} className={`puzzle-drop-target relative flex items-center justify-center rounded-lg cursor-pointer ${!placedPiece ? 'border-2 border-dashed border-slate-300' : ''} ${selectedPiece ? 'ring-2 ring-blue-300 ring-offset-2 animate-pulse' : ''}`} style={{ fontSize: `${settings.fontSize}px`, minHeight: `${dynamicHeight}px`, minWidth: '7rem', zIndex: 1 }} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => { e.preventDefault(); e.currentTarget.classList.add('active-target'); }} onDragLeave={(e) => { e.currentTarget.classList.remove('active-target'); }} onDrop={(e) => handleSlotDrop(e, word.id, originalPiece.index)}>{placedPiece ? (<div draggable onDragStart={(e) => handleDragStart(e, placedPiece, 'slot', slotId)} onDragEnd={handleDragEnd} onContextMenu={(e) => e.preventDefault()} className={`${getPieceStyle(placedPiece, true)} cursor-grab active:cursor-grabbing hover:scale-105 transition-transform touch-action-none`} style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px`, minHeight: `${dynamicHeight}px`, width: '100%', height: '100%' }}>{(!placedPiece.isEnd && !placedPiece.isSolo) && <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-200 z-10"></div>}{(!placedPiece.isStart && !placedPiece.isSolo) && <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white z-20"></div>}{placedPiece.text}</div>) : <span className="text-slate-300 font-bold select-none">?</span>}</div>); })}</div>
                                {isWordComplete && <div className="ml-4 text-green-500 animate-[popIn_0.4s_ease-out]"><Icons.Check size={40} strokeWidth={3} /></div>}
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="shrink-0 bg-white border-t border-slate-200 p-6 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] z-50 overflow-y-auto custom-scroll" style={{ maxHeight: '45vh', height: 'auto', touchAction: 'pan-y' }} onDragOver={(e) => e.preventDefault()} onDrop={handlePoolDrop}>
                <div className="max-w-7xl mx-auto"><h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider sticky top-0 bg-white z-50 pb-2">Verfügbare Teile</h3><div className="flex flex-wrap gap-4 justify-center items-start content-start pb-4">{poolPieces.map((piece) => (<div key={piece.id} draggable onDragStart={(e) => handleDragStart(e, piece, 'pool')} onDragEnd={handleDragEnd} onClick={() => handlePoolPieceClick(piece)} onContextMenu={(e) => e.preventDefault()} className={`${getPieceStyle(piece, false)} cursor-grab active:cursor-grabbing hover:scale-105 transition-transform hover:shadow-md hover:bg-blue-50 relative z-40 touch-action-none ${selectedPiece?.id === piece.id ? 'ring-4 ring-blue-500 shadow-xl scale-110 !z-50' : ''}`} style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px`, minHeight: `${dynamicHeight}px` }}>{(!piece.isEnd && !piece.isSolo) && <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-inherit z-10 border-r border-b border-blue-300/50"></div>}{(!piece.isStart && !piece.isSolo) && <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white z-20 border-r border-blue-300/30"></div>}<span className="relative z-0">{piece.text}</span></div>))}{poolPieces.length === 0 && !showReward && <div className="text-slate-400 italic mt-4">Alle Teile platziert!</div>}</div></div>
            </div>
        </div>
    );
};
