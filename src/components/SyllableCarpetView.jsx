import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { speak } from '../utils/speech';
import availableSyllables from '../utils/available_syllables.json';

const syllableSet = new Set(availableSyllables);

export const SyllableCarpetView = ({ words, settings, setSettings, onClose }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);
    const [hiddenSyllables, setHiddenSyllables] = useState(new Set());
    const [shuffledSyllables, setShuffledSyllables] = useState([]);
    const [isGameMode, setIsGameMode] = useState(false);
    const [isFingerMode, setIsFingerMode] = useState(false);
    const [targetSyllable, setTargetSyllable] = useState(null);
    const [completedSyllables, setCompletedSyllables] = useState(new Set());
    const [remainingPool, setRemainingPool] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    const uniqueSyllables = useMemo(() => { const set = new Set(); words.forEach(w => { if (w.syllables) w.syllables.forEach(s => set.add(s)); }); return Array.from(set).sort((a, b) => a.localeCompare(b, 'de')); }, [JSON.stringify(words)]);
    useEffect(() => { setShuffledSyllables(uniqueSyllables); }, [uniqueSyllables]);
    useEffect(() => { let interval; if (timerActive) { interval = setInterval(() => setTimer(t => t + 1), 1000); } return () => clearInterval(interval); }, [timerActive]);

    const getVisibleList = () => shuffledSyllables.filter(s => !hiddenSyllables.has(s));
    const toggleGameMode = () => { if (isGameMode) { setIsGameMode(false); setTargetSyllable(null); setTimerActive(false); window.speechSynthesis.cancel(); } else { const visible = getVisibleList(); if (visible.length === 0) return; const shuffled = [...shuffledSyllables]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } setShuffledSyllables(shuffled); const pool = shuffled.filter(s => !hiddenSyllables.has(s)); if (pool.length === 0) return; setRemainingPool(pool); setCompletedSyllables(new Set()); setIsGameMode(true); setTimer(0); setTimerActive(true); setShowReward(false); setIsFingerMode(false); pickNextSyllable(pool); } };
    const pickNextSyllable = (pool) => { if (pool.length === 0) { setTimerActive(false); setTargetSyllable(null); setShowReward(true); return; } const randomIndex = Math.floor(Math.random() * pool.length); const next = pool[randomIndex]; setTargetSyllable(next); setTimeout(() => speak(next), 500); };
    const handleSyllableClick = (syl) => { if (isFingerMode) return; if (isGameMode) { if (completedSyllables.has(syl)) return; if (syl === targetSyllable) { const newCompleted = new Set(completedSyllables); newCompleted.add(syl); setCompletedSyllables(newCompleted); const newPool = remainingPool.filter(s => s !== syl); setRemainingPool(newPool); setTimeout(() => pickNextSyllable(newPool), 300); } else { speak(targetSyllable); } } else { setHiddenSyllables(prev => { const n = new Set(prev); if (n.has(syl)) n.delete(syl); else n.add(syl); return n; }); } };
    const minColWidth = Math.max(60, settings.fontSize * 2.5);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans pt-0 md:pt-0">
            {showReward && (<div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, top: `-10%`, backgroundColor: ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)], animationDuration: `${2 + Math.random() * 3}s`, animationDelay: `${Math.random()}s` }}></div>)}<div className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-2xl pop-animate pointer-events-auto text-center border-4 border-yellow-400"><h2 className="text-4xl font-bold text-slate-800 mb-2">Fertig! 🎉</h2><p className="text-xl text-slate-600 mb-4">Zeit: {timer} Sekunden</p><button onClick={() => { setShowReward(false); setIsGameMode(false); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition min-touch-target">OK</button></div></div>)}
            <div className="bg-white px-6 py-4 shadow-sm flex flex-wrap gap-4 justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-4 md:gap-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.Grid2x2 className="text-blue-600" /> Silbenteppich</h2>
                    <div className="flex items-center gap-2 md:gap-4">
                        {isGameMode && (
                            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-mono text-lg font-bold text-blue-600">
                                <Icons.Clock size={20} /> {timer}s
                            </div>
                        )}
                        <button onClick={toggleGameMode} className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 px-6 font-bold shadow-sm min-touch-target ${isGameMode ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100'}`}>
                            {isGameMode ? <><Icons.Square size={20} fill="currentColor" /> Stopp</> : <><Icons.Volume2 size={24} /> Start</>}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isGameMode && (
                        <button
                            onClick={() => targetSyllable && speak(targetSyllable)}
                            className="p-2.5 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-100 transition shadow-sm font-bold flex items-center gap-2 min-touch-target"
                            title="Nochmal hören"
                        >
                            <Icons.RotateCcw size={22} />
                        </button>
                    )}
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="16" max="120" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-48 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                </div>
            </div>
            <div className={`flex-1 p-6 pr-6 overflow-y-auto custom-scroll`}>
                <div className="grid gap-3 pb-32" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))` }}>
                    {shuffledSyllables.map((syl, idx) => {
                        if (hiddenSyllables.has(syl)) return null;
                        const isCompleted = completedSyllables.has(syl);
                        const hasAudio = syllableSet.has(syl.toLowerCase().trim());

                        let boxClass = (idx % 2 === 0) ? 'bg-blue-100 border-blue-200' : 'bg-blue-200 border-blue-300';
                        let textClass = 'text-slate-800';

                        // Audio availability styling: Stronger border
                        const audioClass = hasAudio && !isCompleted ? 'border-2 border-slate-400 shadow-sm' : 'border';

                        if (isCompleted) {
                            boxClass = 'bg-slate-50 border-slate-200 opacity-60';
                            textClass = 'text-gray-300';
                        } else if (isGameMode) {
                            boxClass = (idx % 2 === 0) ? 'bg-blue-50 border-blue-100' : 'bg-blue-100 border-blue-200';
                        }

                        return (
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSyllableClick(syl); } }}
                                key={idx}
                                onClick={() => handleSyllableClick(syl)}
                                className={`px-4 py-2 rounded-lg ${audioClass} ${boxClass} ${textClass} font-medium select-none text-center flex items-center justify-center transition-all duration-200 lowercase relative ${!isFingerMode && !isGameMode ? 'cursor-pointer hover:bg-red-100 hover:text-red-800 hover:border-red-200' : ''} ${isGameMode && !isCompleted && !isFingerMode ? 'cursor-pointer active:scale-95 hover:shadow-md' : ''} ${isFingerMode ? 'cursor-default' : ''}`}
                                style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px`, minHeight: `${settings.fontSize * 1.5}px` }}
                            >
                                {syl}
                                {isCompleted && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500/80 pointer-events-none"><Icons.Check size={48} strokeWidth={4} /></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-4">
                <button onClick={() => setIsFingerMode(!isFingerMode)} className={`rounded-full w-14 h-14 shadow-lg transition-transform hover:scale-110 flex items-center justify-center border-2 min-touch-target ${isFingerMode ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`} title="Lese-Modus (Finger)"><Icons.Hand size={30} /></button>
            </div>
        </div>
    );
};
