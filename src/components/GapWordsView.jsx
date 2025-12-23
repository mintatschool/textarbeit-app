import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

export const GapWordsView = ({ words, settings, setSettings, onClose }) => {
    const [mode, setMode] = useState('vowels'); // 'vowels' or 'consonants'
    const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
    const [groups, setGroups] = useState([]);
    const [placedLetters, setPlacedLetters] = useState({}); // { gapId: letterObj }
    const [poolLetters, setPoolLetters] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [groupSolved, setGroupSolved] = useState(false);
    const [solvedWordIds, setSolvedWordIds] = useState(new Set());
    const dragItemRef = useRef(null);

    // Audio support
    const speakWord = (text) => {
        if (!('speechSynthesis' in window)) return;
        const speak = (voices) => {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'de-DE';
            u.voice = voices.find(v => v.lang.includes('de') && (v.name.includes('Google') || v.name.includes('Female'))) || voices.find(v => v.lang.includes('de')) || null;
            window.speechSynthesis.speak(u);
        };
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) speak(voices);
        else window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); speak(voices); };
    };

    // Letter Cluster Definition (German common clusters)
    const clusters = ['sch', 'ch', 'qu', 'st', 'sp', 'ei', 'ie', 'au', 'eu', 'äu', 'ck', 'ng', 'nk', 'pf', 'th'];

    // Grouping Logic
    useEffect(() => {
        if (!words || words.length === 0) return;

        const partition = (n) => {
            if (n < 3) return [n];
            if (n === 3) return [3];
            if (n === 4) return [4];
            if (n === 5) return [5];
            if (n === 6) return [3, 3];
            if (n === 7) return [4, 3];
            if (n === 11) return [4, 4, 3];

            let y = Math.floor(n / 5);
            let rem = n % 5;

            if (rem === 0) return Array(y).fill(5);
            if (rem === 1) return [...Array(y - 3).fill(5), 4, 4, 4, 4];
            if (rem === 2) return [...Array(y - 2).fill(5), 4, 4, 4];
            if (rem === 3) return [...Array(y - 1).fill(5), 4, 4];
            if (rem === 4) return [...Array(y).fill(5), 4];

            return [n];
        };

        const groupSizes = partition(words.length);
        const newGroups = [];
        let currentIdx = 0;
        groupSizes.forEach(size => {
            newGroups.push(words.slice(currentIdx, currentIdx + size));
            currentIdx += size;
        });
        setGroups(newGroups);
        setCurrentGroupIdx(0);
    }, [words]);

    // Helper to check for clusters and vowels
    const isVowel = (char) => /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);

    // Improved Char Logic: Handle clusters
    const getWordChunks = (word, mode) => {
        const chunks = [];
        let i = 0;
        const text = word.toLowerCase();

        while (i < word.length) {
            let foundCluster = false;
            // Check for clusters (3 chars then 2 chars)
            for (let len = 3; len >= 2; len--) {
                const sub = text.substring(i, i + len);
                if (clusters.includes(sub)) {
                    const originalSub = word.substring(i, i + len);
                    // A cluster is a target if it contains at least one character of the target type
                    // Or if any part of it is the target type. Usually clusters are treated as units.
                    // If mode is vowels, "ei" is a target. If mode is consonants, "sch" is a target.
                    let isTarget = false;
                    if (mode === 'vowels') {
                        isTarget = [...sub].some(isVowel);
                    } else {
                        isTarget = [...sub].some(c => /[a-zäöü]/.test(c) && !isVowel(c));
                    }

                    chunks.push({ text: originalSub, isTarget, id: `chunk_${i}` });
                    i += len;
                    foundCluster = true;
                    break;
                }
            }

            if (!foundCluster) {
                const char = word[i];
                const isTarget = /[a-zA-ZäöüÄÖÜ]/.test(char) && (mode === 'vowels' ? isVowel(char) : !isVowel(char));
                chunks.push({ text: char, isTarget, id: `chunk_${i}` });
                i++;
            }
        }
        return chunks;
    };

    const currentWords = useMemo(() => {
        if (groups.length === 0) return [];
        const group = groups[currentGroupIdx];
        return group.map(w => {
            const syllables = w.syllables.map((syl, sIdx) => {
                const chunks = getWordChunks(syl, mode).map((chunk, cIdx) => ({
                    ...chunk,
                    id: `${w.id}_s${sIdx}_c${cIdx}`
                }));
                return { text: syl, chunks };
            });
            return { ...w, syllables };
        });
    }, [groups, currentGroupIdx, mode]);

    // Letter Pool Logic & Reset
    useEffect(() => {
        if (currentWords.length === 0) {
            setPoolLetters([]);
            setPlacedLetters({});
            setGroupSolved(false);
            setSolvedWordIds(new Set());
            return;
        }
        const targets = currentWords.flatMap(w =>
            w.syllables.flatMap(s => s.chunks.filter(c => c.isTarget).map(c => ({ ...c, poolId: `pool_${c.id}` })))
        );

        // Grid-based positioning
        const shuffled = [...targets].sort(() => Math.random() - 0.5);
        const columns = 2;
        const rows = Math.ceil(shuffled.length / columns);
        const cellW = 100 / columns;
        const cellH = 100 / Math.max(4, rows);

        const positioned = shuffled.map((l, i) => {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const jitterX = (Math.random() - 0.5) * (cellW * 0.4);
            const jitterY = (Math.random() - 0.5) * (cellH * 0.4);
            const x = (col * cellW) + (cellW / 2) + jitterX;
            const y = (row * cellH) + (cellH / 2) + jitterY;
            return { ...l, x, y };
        });

        setPoolLetters(positioned);
        setPlacedLetters({});
        setGroupSolved(false);
        setSolvedWordIds(new Set());
    }, [currentWords, mode]);

    // Drag & Drop
    const handleDragStart = (e, letter, source, gapId = null) => {
        dragItemRef.current = { letter, source, gapId };
        e.dataTransfer.setData('application/json', JSON.stringify(letter));
        e.dataTransfer.effectAllowed = 'move';
        // setTimeout(() => e.target.classList.add('opacity-40'), 0); // Removed for better drag visibility
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-40');
        dragItemRef.current = null;
        document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target'));
    };

    const handleDrop = (e, targetGapId, targetText) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData) return;

        if (dragData.letter.text.toLowerCase() !== targetText.toLowerCase()) return;

        const existingLetter = placedLetters[targetGapId];

        setPlacedLetters(prev => {
            const next = { ...prev };
            next[targetGapId] = dragData.letter;
            if (dragData.source === 'gap' && dragData.gapId) delete next[dragData.gapId];
            return next;
        });

        setPoolLetters(prev => {
            let next = prev;
            if (dragData.source === 'pool') next = next.filter(l => l.poolId !== dragData.letter.poolId);
            if (existingLetter) next = [...next, existingLetter];
            return next;
        });
    };

    const handlePoolDrop = (e) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData || dragData.source !== 'gap') return;
        setPlacedLetters(prev => { const next = { ...prev }; delete next[dragData.gapId]; return next; });
        setPoolLetters(prev => [...prev, dragData.letter]);
    };

    // Progress Tracking
    useEffect(() => {
        if (currentWords.length === 0) return;

        // Track per-word success for visual feedback
        const newSolvedIds = new Set();
        currentWords.forEach(w => {
            const isSolved = w.syllables.every(s => s.chunks.every(c => !c.isTarget || placedLetters[c.id]));
            if (isSolved) newSolvedIds.add(w.id);
        });
        setSolvedWordIds(newSolvedIds);

        const totalTargets = currentWords.reduce((acc, w) => acc + w.syllables.reduce((sAcc, s) => sAcc + s.chunks.filter(c => c.isTarget).length, 0), 0);
        if (totalTargets > 0 && Object.keys(placedLetters).length === totalTargets) {
            setGroupSolved(true);
        } else {
            setGroupSolved(false);
        }
    }, [placedLetters, currentWords]);

    // Handle Group Completion & Reward
    useEffect(() => {
        if (groupSolved && !showReward && currentGroupIdx === groups.length - 1 && groups.length > 0) {
            const timer = setTimeout(() => {
                setShowReward(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [groupSolved, currentGroupIdx, groups.length, showReward]);

    if (!words || words.length === 0) return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} title="Markiere Wörter" message="Bitte markiere zuerst Wörter im Text, um diese Übung zu starten." /></div>
    );

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

            <div className="bg-white px-6 py-4 shadow-sm flex flex-wrap gap-4 justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.GapWords className="text-blue-600" /> Lückenwörter</h2>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setMode('vowels')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${mode === 'vowels' ? 'bg-yellow-100 text-slate-900 shadow-[0_2px_0_0_#eab308] border border-yellow-400' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Vokale
                        </button>
                        <button
                            onClick={() => setMode('consonants')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${mode === 'consonants' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Konsonanten
                        </button>
                    </div>
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
                        <input type="range" min="24" max="100" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-[70%] p-8 overflow-y-auto custom-scroll flex flex-col items-center justify-center gap-12 bg-white/50">
                    <div className="w-full max-w-4xl space-y-8">
                        {currentWords.map((word) => {
                            const isSolved = solvedWordIds.has(word.id);
                            return (
                                <div key={word.id} className={`p-8 bg-white rounded-3xl border shadow-sm flex flex-wrap justify-center gap-x-1 gap-y-4 transition-all duration-500 transform relative ${isSolved ? 'border-green-300 bg-green-50/50 scale-[1.01] shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
                                    <button
                                        onClick={() => speakWord(word.word)}
                                        className="absolute left-4 top-4 p-2.5 text-slate-400 hover:text-blue-600 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-blue-50 transition min-touch-target"
                                        title="Wort anhören"
                                    >
                                        <Icons.Volume2 size={20} />
                                    </button>
                                    {word.syllables.map((syl, sIdx) => {
                                        const isEven = sIdx % 2 === 0;
                                        let styleClass = "";
                                        let textClass = "";
                                        if (settings.visualType === 'block') {
                                            styleClass = isEven ? 'bg-blue-100 border-blue-200/50' : 'bg-blue-200 border-blue-300/50';
                                            styleClass += " border rounded px-1.5 py-0.5 mx-[1px] shadow-sm";
                                        } else if (settings.visualType === 'black_gray') {
                                            textClass = isEven ? "text-slate-800" : "text-slate-400";
                                        } else {
                                            textClass = isEven ? "text-blue-700" : "text-red-600";
                                        }

                                        return (
                                            <div key={sIdx} className={`relative flex items-center ${styleClass}`} style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>
                                                {syl.chunks.map((chunk) => {
                                                    const isVowelChunk = [...chunk.text.toLowerCase()].some(isVowel);
                                                    const showYellowStatic = mode === 'consonants' && isVowelChunk;

                                                    if (!chunk.isTarget) return (
                                                        <span
                                                            key={chunk.id}
                                                            className={`font-bold ${textClass} ${showYellowStatic ? 'bg-yellow-100 shadow-border-yellow text-slate-900 mx-px px-0.5 rounded-sm' : ''}`}
                                                        >
                                                            {chunk.text}
                                                        </span>
                                                    );
                                                    const placed = placedLetters[chunk.id];
                                                    // showYellowStyle logic:
                                                    // 1. In vowels mode: only when placed
                                                    // 2. In consonants mode: always for vowels as hints
                                                    const showYellowStyle = (mode === 'vowels' && placed) || (mode === 'consonants' && isVowelChunk);

                                                    return (
                                                        <div
                                                            key={chunk.id}
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDragEnter={(e) => { e.preventDefault(); e.currentTarget.classList.add('active-target'); }}
                                                            onDragLeave={(e) => { e.currentTarget.classList.remove('active-target'); }}
                                                            onDrop={(e) => { e.currentTarget.classList.remove('active-target'); handleDrop(e, chunk.id, chunk.text); }}
                                                            className={`relative flex items-center justify-center transition-all border-b-4 mx-2 rounded-t-xl gap-zone ${placed ? 'border-transparent' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-400'}`}
                                                            style={{ minWidth: `${Math.max(1.5, chunk.text.length * 1.2)}em`, height: '2.2em' }}
                                                        >
                                                            {placed ? (
                                                                <div
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, placed, 'gap', chunk.id)}
                                                                    onDragEnd={handleDragEnd}
                                                                    className={`font-bold transition-all px-1 rounded-sm cursor-grab active:cursor-grabbing animate-[popIn_0.3s_ease-out] ${showYellowStyle ? 'bg-yellow-100 shadow-border-yellow text-slate-900 mx-px' : 'text-blue-600'}`}
                                                                >
                                                                    {placed.text}
                                                                </div>
                                                            ) : (
                                                                <span className="opacity-0">{chunk.text}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {settings.visualType === 'arc' && (
                                                    <svg className="absolute -bottom-1 left-0 w-full h-2 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 5 5 Q 50 20 95 5" fill="none" stroke={isEven ? '#2563eb' : '#dc2626'} strokeWidth="10" strokeLinecap="round" /></svg>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {groupSolved && currentGroupIdx < groups.length - 1 && (
                        <div className="mt-8 flex flex-col items-center">
                            <span className="text-green-600 font-bold mb-3 flex items-center gap-2 text-xl"><Icons.Check size={28} /> Prima!</span>
                            <button onClick={() => { setCurrentGroupIdx(prev => prev + 1); setGroupSolved(false); }} className="px-8 py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg hover:bg-green-600 hover:scale-105 transition-all flex items-center gap-2 text-lg">
                                weiter <Icons.ArrowRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-[30%] bg-slate-200/50 border-l border-slate-300 flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={handlePoolDrop}>
                    <div className="p-4 bg-white/80 border-b border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider text-xs">Buchstaben</span>
                            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-full">{poolLetters.length}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${(groups.length > 0 ? ((currentGroupIdx + (groupSolved ? 1 : 0)) / groups.length) * 100 : 0)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                        {poolLetters.map((l) => {
                            const isVowelTile = mode === 'vowels' && [...l.text.toLowerCase()].some(isVowel);
                            return (
                                <div
                                    key={l.poolId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, l, 'pool')}
                                    onDragEnd={handleDragEnd}
                                    className={`absolute border-2 text-slate-800 font-bold rounded-2xl transition-all flex items-center justify-center p-3 cursor-grab active:cursor-grabbing hover:scale-110 bg-white border-slate-300 shadow-[0_4px_0_0_#cbd5e1] hover:shadow-[0_2px_0_0_#cbd5e1] hover:translate-y-[2px] ${isVowelTile ? 'bg-yellow-100 border-yellow-400' : ''}`}
                                    style={{ left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${Math.max(20, settings.fontSize * 0.8)}px`, fontFamily: settings.fontFamily, minWidth: '3.5rem' }}
                                >
                                    {l.text}
                                </div>
                            );
                        })}
                        {poolLetters.length === 0 && !groupSolved && <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-400 italic text-sm">Prüfe deine Antworten...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
