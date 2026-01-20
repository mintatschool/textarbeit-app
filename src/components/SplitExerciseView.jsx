import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { ProgressBar } from './ProgressBar';
import { speak } from '../utils/speech';

export const SplitExerciseView = ({ words, onClose, settings, setSettings, title }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[130] bg-slate-100 modal-animate font-sans flex flex-col items-center justify-center"><EmptyStateMessage onClose={onClose} /></div>);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userSplits, setUserSplits] = useState(new Set());
    const [showVowels, setShowVowels] = useState(false);
    const [status, setStatus] = useState('idle');
    const [isSessionFinished, setIsSessionFinished] = useState(false);
    const currentWordObj = words[currentIndex];
    const fullWord = currentWordObj ? currentWordObj.word : '';
    const correctSyllables = currentWordObj ? currentWordObj.syllables : [];
    const progress = ((currentIndex + 1) / words.length) * 100;

    useEffect(() => { setUserSplits(new Set()); setStatus('idle'); }, [currentIndex]);

    const correctSplitIndices = useMemo(() => { const indices = new Set(); let acc = 0; for (let i = 0; i < correctSyllables.length - 1; i++) { acc += correctSyllables[i].length; indices.add(acc - 1); } return indices; }, [correctSyllables]);
    const vowelStatus = useMemo(() => { const status = new Array(fullWord.length).fill(null); const text = fullWord.toLowerCase(); const diphthongs = ['eu', 'äu', 'au', 'ei', 'ie', 'ai']; const singleVowels = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü']; let i = 0; while (i < text.length) { let isDiphthong = false; for (let d of diphthongs) { if (text.startsWith(d, i)) { status[i] = { type: 'start' }; if (d.length > 1) { for (let k = 1; k < d.length - 1; k++) status[i + k] = { type: 'mid' }; status[i + d.length - 1] = { type: 'end' }; } else { status[i] = { type: 'single' }; } i += d.length; isDiphthong = true; break; } } if (isDiphthong) continue; if (singleVowels.includes(text[i])) { status[i] = { type: 'single' }; } i++; } return status; }, [fullWord]);

    const handleGapClick = (index) => { if (status === 'correct') return; const newSplits = new Set(userSplits); if (newSplits.has(index)) newSplits.delete(index); else newSplits.add(index); setUserSplits(newSplits); setStatus('idle'); };
    const checkAnswer = () => { const isCorrect = userSplits.size === correctSplitIndices.size && [...userSplits].every(x => correctSplitIndices.has(x)); setStatus(isCorrect ? 'correct' : 'wrong'); };
    const nextWord = () => { if (currentIndex < words.length - 1) { setCurrentIndex(prev => prev + 1); } else { setIsSessionFinished(true); } };
    if (!currentWordObj) return null;

    return (
        <div className="fixed inset-0 z-[130] flex flex-col bg-slate-100 modal-animate font-sans select-none">
            {isSessionFinished && (
                <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
                    <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px]"></div>
                    <div className="bg-white rounded-3xl p-12 shadow-2xl pop-animate pointer-events-auto text-center border-b-8 border-green-100 relative z-10">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-green-600 mb-8 flex items-center gap-3">
                                <Icons.CheckCircle size={64} className="text-green-500" /> Alle Wörter richtig getrennt! Toll!
                            </span>
                            <button onClick={onClose} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg min-touch-target">
                                Beenden
                            </button>
                        </div>
                    </div>

                    {/* Confetti */}
                    <div className="fixed inset-0 pointer-events-none z-[160]">
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
            )}

            <div className="bg-white px-6 py-4 shadow-sm flex flex-wrap gap-4 justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Icons.Scissors className="text-orange-500 -rotate-90" />
                        {title || "Wörter trennen"}
                    </h2>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-bold text-sm">
                        {currentIndex + 1} / {words.length}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowVowels(!showVowels)}
                        className={`px-4 py-2 rounded-xl font-bold text-lg border transition-all min-touch-target ${showVowels ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_2px_0_0_#eab308]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                        Vokale
                    </button>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg ml-2">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input
                            type="range"
                            min="24"
                            max="100"
                            value={settings.fontSize}
                            onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                            className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target">
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>

            <ProgressBar progress={progress} />

            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white/50 overflow-y-auto custom-scroll">
                <div className="flex flex-wrap justify-center items-end gap-16 py-4">
                    <div className="flex flex-wrap justify-center items-end select-none" style={{ fontFamily: settings.fontFamily }}>
                        {fullWord.split('').map((char, i) => {
                            const vStat = vowelStatus[i]; let vowelClass = ""; let borderStyle = "";
                            if (showVowels && vStat) { vowelClass = "bg-yellow-100"; if (vStat.type === 'single') borderStyle = "shadow-border-yellow rounded-sm"; else if (vStat.type === 'start') borderStyle = "shadow-border-yellow-left rounded-l-md pr-3 md:pr-6 -mr-1 md:-mr-2 z-10"; else if (vStat.type === 'end') borderStyle = "shadow-border-yellow-right rounded-r-md pl-3 md:pl-6 -ml-1 md:-ml-2 z-10"; else if (vStat.type === 'mid') borderStyle = "shadow-border-yellow-mid px-3 md:px-6 -mx-1 md:-mx-2 z-10"; }
                            return (
                                <React.Fragment key={i}>
                                    <div className="relative flex flex-col items-center justify-end">
                                        <div className={`font-bold text-slate-800 leading-none px-0 py-1 transition-all ${vowelClass} ${borderStyle}`} style={{ fontSize: `${settings.fontSize * 2.5}px` }}>
                                            {char}
                                        </div>
                                    </div>
                                    {i < fullWord.length - 1 && (!vStat || (vStat.type !== 'start' && vStat.type !== 'mid')) && (
                                        <div onClick={() => handleGapClick(i)} className="group relative w-6 md:w-12 h-20 md:h-36 -mb-2 cursor-pointer flex justify-center items-end hover:bg-blue-50 rounded mx-1 transition-colors">
                                            <div className={`w-2 md:w-3 h-16 md:h-28 rounded-full transition-all duration-200 ${userSplits.has(i) ? 'bg-blue-600 shadow-lg scale-y-100' : 'bg-slate-200 scale-y-50 group-hover:scale-y-75'}`}></div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => speak(fullWord)}
                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 shrink-0 mb-8"
                        title="Wort anhören"
                    >
                        <Icons.Volume2 size={24} />
                    </button>
                </div>
                <div className="h-16 flex items-center">
                    {status === 'wrong' && <p className="text-red-500 font-bold text-lg animate-pulse">Das stimmt noch nicht ganz.</p>}
                    {status === 'correct' && <p className="text-green-600 font-bold text-2xl pop-animate flex items-center gap-2"><Icons.CheckCircle size={28} /> Richtig!</p>}
                </div>
            </div>

            <div className="p-6 bg-white border-t flex flex-wrap gap-4 justify-center items-center shrink-0">
                <div className="flex-1"></div>
                {status !== 'correct' ? (
                    <button onClick={checkAnswer} className="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition min-touch-target">Prüfen</button>
                ) : (
                    <button onClick={nextWord} className="px-8 py-3 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 shadow-lg active:scale-95 transition flex items-center gap-2 pop-animate min-touch-target">
                        {currentIndex < words.length - 1 ? 'Nächstes Wort' : 'Fertig'} <Icons.ArrowRight />
                    </button>
                )}
            </div>
        </div>
    );
};
