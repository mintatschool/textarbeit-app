import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

export const GapSentencesView = ({ text, settings, setSettings, onClose }) => {
    const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
    const [groups, setGroups] = useState([]);
    const [placedWords, setPlacedWords] = useState({}); // { gapId: wordObj }
    const [poolWords, setPoolWords] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [groupSolved, setGroupSolved] = useState(false);
    const dragItemRef = useRef(null);

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

        return { id: `s_${sIdx}`, parts, target: { ...target, id: `gap_${sIdx}` } };
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

        // Grid-based positioning logic
        const shuffled = [...targets].sort(() => Math.random() - 0.5);
        const columns = 1;
        const rows = shuffled.length;

        const positioned = shuffled.map((w, i) => {
            const x = 50; // Center horizontally in the pool area
            const y = (100 / (rows + 1)) * (i + 1);
            return { ...w, x, y };
        });

        setPoolWords(positioned);
        setPlacedWords({});
        setGroupSolved(false);
    }, [currentGroup]);

    // Drag & Drop Handlers
    const handleDragStart = (e, word, source, gapId = null) => {
        dragItemRef.current = { word, source, gapId };
        e.dataTransfer.setData('application/json', JSON.stringify(word));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = (e) => {
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
                <div className="w-[75%] p-8 overflow-y-auto custom-scroll flex flex-col gap-8 bg-white/50">
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
                                                    className="bg-white px-3 py-1 rounded-lg border shadow-sm font-bold text-blue-700 cursor-grab active:cursor-grabbing animate-[popIn_0.3s_ease-out]"
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

                <div className="w-[25%] bg-slate-200/50 border-l border-slate-300 flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={handlePoolDrop}>
                    <div className="p-4 bg-white/80 border-b border-slate-200 shadow-sm">
                        <span className="font-bold text-slate-600 uppercase tracking-widest text-xs">Wortpool</span>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                        {poolWords.map((w) => (
                            <div
                                key={w.poolId}
                                draggable
                                onDragStart={(e) => handleDragStart(e, w, 'pool')}
                                onDragEnd={handleDragEnd}
                                className="absolute bg-white border-2 border-slate-300 text-slate-800 font-bold rounded-2xl shadow-[0_4px_0_0_#cbd5e1] hover:shadow-[0_2px_0_0_#cbd5e1] hover:translate-y-[2px] transition-all flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
                                style={{
                                    left: `${w.x}%`,
                                    top: `${w.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: `${Math.max(18, settings.fontSize * 0.7)}px`,
                                    fontFamily: settings.fontFamily,
                                    minWidth: '70%',
                                    textAlign: 'center'
                                }}
                            >
                                {w.text}
                            </div>
                        ))}
                        {poolWords.length === 0 && !groupSolved && <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-400 italic text-sm">Prüfe deine Antworten...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
