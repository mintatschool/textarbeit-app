import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

// Pastel colors for words
const WORD_COLORS = [
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700',
    'bg-yellow-100 text-yellow-700',
    'bg-lime-100 text-lime-700',
    'bg-green-100 text-green-700',
    'bg-emerald-100 text-emerald-700',
    'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700',
    'bg-sky-100 text-sky-700',
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-purple-100 text-purple-700',
    'bg-fuchsia-100 text-fuchsia-700',
    'bg-pink-100 text-pink-700',
    'bg-rose-100 text-rose-700'
];

export const GapSentencesView = ({ text, settings, setSettings, onClose }) => {
    const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
    const [groups, setGroups] = useState([]);
    const [placedWords, setPlacedWords] = useState({}); // { gapId: wordObj }
    const [poolWords, setPoolWords] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [groupSolved, setGroupSolved] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragItemRef = useRef(null);

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

    // Sentence Splitting Logic
    const splitSentences = (txt) => {
        return txt.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);
    };

    // Word Logic: find 3 longest words, pick one
    const processSentence = (sentence, sIdx) => {
        const wordsInSentence = sentence.split(/\s+/).filter(w => w.length > 0);

        // Clean words for length calculation (strip punctuation)
        const cleanWords = wordsInSentence.map((w, i) => ({
            text: w,
            clean: w.replace(/[^\w\u00C0-\u017F]/g, ''),
            index: i
        })).filter(w => w.clean.length > 2);

        if (cleanWords.length < 3) return null;

        // Sort by length decending
        const sorted = [...cleanWords].sort((a, b) => b.clean.length - a.clean.length);
        const top3 = sorted.slice(0, 3);
        const target = top3[Math.floor(Math.random() * top3.length)];

        const parts = wordsInSentence.map((w, i) => {
            if (i === target.index) {
                return { type: 'gap', id: `gap_${sIdx}`, correctText: target.text, cleanText: target.clean };
            }
            return { type: 'text', text: w };
        });

        return {
            id: `s_${sIdx}`,
            parts,
            target: {
                ...target,
                id: `gap_${sIdx}`,
                color: WORD_COLORS[sIdx % WORD_COLORS.length]
            }
        };
    };

    // Partition logic for groups
    useEffect(() => {
        if (!text) return;
        const rawSentences = splitSentences(text);
        const processed = rawSentences.map((s, i) => processSentence(s, i)).filter(Boolean);

        if (processed.length === 0) return;

        const partition = (n) => {
            if (n <= 5) return [n];
            const size = n / Math.ceil(n / 5);
            const sizes = [];
            let rem = n;
            while (rem > 0) {
                const s = Math.min(rem, Math.ceil(size));
                sizes.push(s);
                rem -= s;
            }
            return sizes;
        };

        const sizes = partition(processed.length);
        const newGroups = [];
        let cur = 0;
        sizes.forEach(s => {
            newGroups.push(processed.slice(cur, cur + s));
            cur += s;
        });

        setGroups(newGroups);
        setCurrentGroupIdx(0);
    }, [text]);

    const currentGroup = useMemo(() => groups[currentGroupIdx] || [], [groups, currentGroupIdx]);

    // Pool Management
    useEffect(() => {
        if (currentGroup.length === 0) return;
        const targets = currentGroup.map(s => ({ ...s.target, poolId: `pool_${s.target.id}` }));
        const shuffled = [...targets].sort(() => Math.random() - 0.5);
        setPoolWords(shuffled);
        setPlacedWords({});
        setGroupSolved(false);
    }, [currentGroup]);

    // Drag & Drop Handlers
    const handleDragStart = (e, word, source, gapId = null) => {
        setIsDragging(true);
        dragItemRef.current = { word, source, gapId };
        e.dataTransfer.setData('application/json', JSON.stringify(word));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        dragItemRef.current = null;
        document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target'));
    };

    const handleDrop = (e, targetGapId, targetWord) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData) return;

        // Clean BOTH versions for comparison to ensure matching even with punctuation or case differences
        const cleanDragged = dragData.word.text.replace(/[^\w\u00C0-\u017F]/g, '').toLowerCase();
        const cleanTarget = targetWord.replace(/[^\w\u00C0-\u017F]/g, '').toLowerCase();

        if (cleanDragged !== cleanTarget) return;

        const existingWord = placedWords[targetGapId];

        setPlacedWords(prev => {
            const next = { ...prev };
            next[targetGapId] = dragData.word;
            if (dragData.source === 'gap' && dragData.gapId) delete next[dragData.gapId];
            return next;
        });

        setPoolWords(prev => {
            let next = prev;
            if (dragData.source === 'pool') next = next.filter(w => w.poolId !== dragData.word.poolId);
            if (existingWord) next = [...next, existingWord];
            return next;
        });
    };

    const handlePoolDrop = (e) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData || dragData.source !== 'gap') return;
        setPlacedWords(prev => { const next = { ...prev }; delete next[dragData.gapId]; return next; });
        setPoolWords(prev => [...prev, dragData.word]);
    };

    // Solution Checking
    useEffect(() => {
        if (currentGroup.length === 0) return;
        const totalGaps = currentGroup.length;
        if (Object.keys(placedWords).length === totalGaps) {
            setGroupSolved(true);
            if (currentGroupIdx === groups.length - 1) {
                setTimeout(() => setShowReward(true), 800);
            }
        } else {
            setGroupSolved(false);
        }
    }, [placedWords, currentGroup, currentGroupIdx, groups.length]);

    if (!text || groups.length === 0) {
        return <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} title="Keine Sätze gefunden" message="Der Text ist zu kurz oder enthält keine klaren Sätze für diese Übung." /></div>;
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans select-none">
            {showReward && (
                <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, top: `-10%`, backgroundColor: ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)], animationDuration: `${2 + Math.random() * 3}s`, animationDelay: `${Math.random()}s` }}></div>
                    ))}
                    <div className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-2xl pop-animate pointer-events-auto text-center border-4 border-yellow-400">
                        <h2 className="text-4xl font-bold text-slate-800 mb-4">Super gemacht! 🎉</h2>
                        <button onClick={onClose} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition min-touch-target">Zurück</button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex flex-wrap gap-4 justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.GapSentences className="text-indigo-500" /> Lückensätze</h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                        <div className="flex gap-2 mr-2">
                            {groups.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${i < currentGroupIdx ? 'bg-green-500 text-white' :
                                        i === currentGroupIdx ? 'bg-blue-600 text-white scale-110 shadow-md' :
                                            'bg-slate-200 text-slate-500'
                                        }`}
                                >
                                    {i < currentGroupIdx ? <Icons.Check size={14} /> : i + 1}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{currentGroupIdx + 1} / {groups.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="20" max="64" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 p-8 overflow-y-auto custom-scroll flex flex-col gap-8 bg-white/50">
                    <div className="max-w-5xl mx-auto space-y-12 py-12">
                        {currentGroup.map(sentence => (
                            <div key={sentence.id} className="flex flex-wrap items-center gap-x-3 gap-y-6 text-slate-800 leading-relaxed" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>
                                {sentence.parts.map((p, i) => {
                                    if (p.type === 'text') return <span key={i}>{p.text}</span>;
                                    const placed = placedWords[p.id];
                                    return (
                                        <div
                                            key={i}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDragEnter={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50', 'border-blue-400'); }}
                                            onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400'); }}
                                            onDrop={(e) => { e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400'); handleDrop(e, p.id, p.correctText); }}
                                            className={`relative inline-flex items-center justify-center min-w-[6em] h-[2.2em] border-b-4 transition-all rounded-t-xl ${placed ? 'border-transparent' : 'border-slate-300 bg-slate-100/50 hover:bg-white hover:border-blue-400 cursor-pointer'}`}
                                        >
                                            {placed ? (
                                                <div
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, placed, 'gap', p.id)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`px-1 py-0 rounded font-bold cursor-grab active:cursor-grabbing animate-[popIn_0.3s_ease-out] whitespace-nowrap leading-none touch-action-none touch-manipulation select-none ${placed.color}`}
                                                    style={{ fontSize: '1.2em' }}
                                                >
                                                    {placed.text}
                                                </div>
                                            ) : (
                                                <span className="opacity-0 font-bold">{p.correctText}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {groupSolved && currentGroupIdx < groups.length - 1 && (
                        <div className="mt-8 flex flex-col items-center pb-20">
                            <span className="text-green-600 font-bold mb-3 flex items-center gap-2 text-xl"><Icons.Check size={28} /> Richtig!</span>
                            <button onClick={() => { setCurrentGroupIdx(prev => prev + 1); setGroupSolved(false); }} className="px-8 py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg hover:bg-green-600 hover:scale-105 transition-all flex items-center gap-2 text-lg">
                                weiter <Icons.ArrowRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-80 bg-white border-l border-slate-100 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20" onDragOver={(e) => e.preventDefault()} onDrop={handlePoolDrop}>
                    <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Wortauswahl</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-6 flex flex-col gap-4">
                        {poolWords.map((w) => (
                            <div
                                key={w.poolId}
                                draggable
                                onDragStart={(e) => handleDragStart(e, w, 'pool')}
                                onDragEnd={handleDragEnd}
                                className={`w-full p-4 font-bold rounded-2xl transition-all flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-[1.02] touch-action-none touch-manipulation select-none ${w.color}`}
                                style={{ fontFamily: settings.fontFamily, fontSize: `${Math.max(20, settings.fontSize * 0.8)}px` }}
                            >
                                {w.text}
                            </div>
                        ))}
                        {poolWords.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-300 gap-4 opacity-50">
                                <Icons.Check size={48} className="text-green-400" />
                                <span className="text-sm font-bold">Alles verteilt!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
