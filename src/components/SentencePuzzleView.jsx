import React, { useState, useEffect, useRef } from 'react';
import { Word } from './Word';
import { Icons } from './Icons';
import { ProgressBar } from './ProgressBar';
import { EmptyStateMessage } from './EmptyStateMessage';
import { RewardModal } from './shared/RewardModal';
import { polyfill } from 'mobile-drag-drop';
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour';
polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride });
// --- UTILS ---
const splitText = (text, mode) => {
    if (mode === 'sentence') {
        // Mode Sentence: Split by . ! ? followed by whitespace or by newlines
        return text.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 0);
    } else {
        // Mode Text: Split by Paragraphs (\n\s*\n)
        return text.split(/\n\s*\n/).filter(s => s.trim().length > 0);
    }
};

const PASTEL_COLORS = [
    'bg-red-100 border-red-200',
    'bg-orange-100 border-orange-200',
    'bg-amber-100 border-amber-200',
    'bg-yellow-100 border-yellow-200',
    'bg-lime-100 border-lime-200',
    'bg-green-100 border-green-200',
    'bg-emerald-100 border-emerald-200',
    'bg-teal-100 border-teal-200',
    'bg-cyan-100 border-cyan-200',
    'bg-sky-100 border-sky-200',
    'bg-blue-100 border-blue-200',
    'bg-indigo-100 border-indigo-200',
    'bg-violet-100 border-violet-200',
    'bg-purple-100 border-purple-200',
    'bg-fuchsia-100 border-fuchsia-200',
    'bg-pink-100 border-pink-200',
    'bg-rose-100 border-rose-200'
];

export const SentencePuzzleView = ({ text, mode = 'sentence', onClose, settings, setSettings, title, hyphenator }) => {
    if (!text || text.trim().length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);

    const [pieces, setPieces] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, correct, wrong
    const [isShaking, setIsShaking] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

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

    // Initialize
    useEffect(() => {
        const rawSegments = splitText(text, mode);

        if (rawSegments.length < 2) {
            // Need at least 2 parts
            alert("Der Text ist zu kurz für dieses Puzzle. Es werden mindestens 2 Sätze oder Absätze benötigt.");
            onClose();
            return;
        }

        const initialPieces = rawSegments.map((seg, idx) => {
            const trimmed = seg.trim();
            const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            return {
                id: `part-${idx}`,
                text: capitalized,
                originalIndex: idx,
                color: PASTEL_COLORS[idx % PASTEL_COLORS.length]
            };
        });

        // Shuffle
        const shuffled = [...initialPieces];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        setPieces(shuffled);
        setStatus('idle');
    }, [text, mode]);

    // Drag & Drop
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleDragStart = (e, position) => {
        setIsDragging(true);
        dragItem.current = position;

        // Safari/iPad Fix: setData is mandatory to trigger drag
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
        // Add dragging class for visuals
        setTimeout(() => e.target.classList.add('dragging'), 0);
    };

    const handleDragEnter = (e, position) => {
        dragOverItem.current = position;
        e.preventDefault();
        // Add visual indicator
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        e.target.classList.remove('dragging');
        const dI = dragItem.current;
        const dO = dragOverItem.current;

        if (dI !== null && dO !== null && dI !== dO) {
            const newPieces = [...pieces];
            const draggedContent = newPieces[dI];
            newPieces.splice(dI, 1);
            newPieces.splice(dO, 0, draggedContent);
            setPieces(newPieces);
            setStatus('idle');
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const checkOrder = () => {
        const isCorrect = pieces.every((p, i) => p.originalIndex === i);
        if (isCorrect) {
            setStatus('correct');
        } else {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);

            // Trigger shake
            const container = document.getElementById('puzzle-container');
            if (container) {
                container.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 500 });
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            <RewardModal
                isOpen={status === 'correct'}
                onClose={onClose}
                message="Alles richtig sortiert! Super!"
            />

            <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 shrink-0 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {mode === 'sentence' ? <Icons.Sentence className="text-pink-500" /> : <Icons.TextBlocks className="text-emerald-500" />}
                        {title || (mode === 'sentence' ? 'Satzpuzzle' : 'Textpuzzle')}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 h-10 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="16" max="64" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                </div>
            </header>
            <ProgressBar progress={status === 'correct' ? 100 : 0} />

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scroll p-6 bg-slate-50/50">
                <div id="puzzle-container" className="max-w-4xl mx-auto space-y-4 pb-24 transition-transform">
                    {pieces.map((piece, idx) => (
                        <div
                            key={piece.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragEnter={(e) => handleDragEnter(e, idx)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }}
                            className={`${piece.color} p-6 rounded-xl border-l-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-grab active:cursor-grabbing flex gap-4 items-start bg-opacity-50 select-none`}
                        >
                            <div className="text-slate-300 cursor-grab active:cursor-grabbing shrink-0 flex items-center justify-center w-8">
                                <Icons.MoveVertical size={28} />
                            </div>
                            <div
                                className="flex-1 text-slate-800 whitespace-pre-wrap leading-relaxed"
                                style={{
                                    fontFamily: settings.fontFamily,
                                    fontSize: `${settings.fontSize}px`
                                }}
                            >
                                <div className="flex flex-wrap items-start" style={{ columnGap: `${(settings.wordSpacing ?? 0.5)}em`, rowGap: '0.2em' }}>
                                    {piece.text.split(/(\s+)/).map((seg, sidx) => {
                                        if (seg.match(/\n/)) return <div key={sidx} className="w-full h-0" />;
                                        if (seg.trim().length === 0) return null;
                                        return (
                                            <Word
                                                key={sidx}
                                                word={seg}
                                                startIndex={0}
                                                settings={settings}
                                                hyphenator={hyphenator}
                                                isReadingMode={true}
                                                forceNoMargin={true}
                                                forceShowSyllables={true}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-4 shrink-0">
                <button
                    onClick={checkOrder}
                    className={`px-8 py-2.5 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 min-touch-target ${isShaking ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    <Icons.Check size={20} /> Prüfen
                </button>
            </div>


        </div>
    );
};
