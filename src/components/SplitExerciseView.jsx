import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

export const SplitExerciseView = ({ words, onClose, settings }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[130] bg-slate-100 modal-animate font-sans flex flex-col"><EmptyStateMessage onClose={onClose} /></div>);
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
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-100 modal-animate font-sans">
            {isSessionFinished && (<div className="fixed inset-0 z-[150] pointer-events-auto flex items-center justify-center bg-black/50 backdrop-blur-sm">{Array.from({ length: 40 }).map((_, i) => <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, top: `-10%`, backgroundColor: ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)], animationDuration: `${1.5 + Math.random() * 2}s` }}></div>)}<div className="bg-white rounded-2xl p-8 shadow-2xl pop-animate text-center border-4 border-yellow-400 max-w-lg mx-4 relative overflow-hidden"><h2 className="text-4xl font-bold text-slate-800 mb-4">Super gemacht! 🎉</h2><p className="text-xl text-slate-600 mb-8">Du hast alle Wörter richtig getrennt.</p><button onClick={onClose} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg text-lg min-touch-target">Zurück zum Text</button></div></div>)}
            <div className="bg-white w-full h-full flex flex-col overflow-hidden relative transition-colors duration-300" style={{ borderColor: status === 'correct' ? '#22c55e' : (status === 'wrong' ? '#ef4444' : '#fff') }}>
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                            <Icons.Scissors className="text-orange-500 -rotate-90" />
                            Wörter trennen
                            <span className="text-xl font-bold text-blue-600 ml-4">{currentIndex + 1} / {words.length}</span>
                        </h2>
                        <div className="w-full max-w-md mt-2 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 shadow-lg transition-transform hover:scale-110 flex items-center justify-center shrink-0 ml-4 min-touch-target">
                        <Icons.X size={32} />
                    </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50/50 overflow-y-auto custom-scroll">
                    <div className="flex flex-wrap justify-center items-end select-none py-4" style={{ fontFamily: settings.fontFamily }}>
                        {fullWord.split('').map((char, i) => {
                            const vStat = vowelStatus[i]; let vowelClass = ""; let borderStyle = "";
                            if (showVowels && vStat) { vowelClass = "bg-yellow-100"; if (vStat.type === 'single') borderStyle = "shadow-border-yellow rounded-sm"; else if (vStat.type === 'start') borderStyle = "shadow-border-yellow-left rounded-l-md pr-3 md:pr-6 -mr-1 md:-mr-2 z-10"; else if (vStat.type === 'end') borderStyle = "shadow-border-yellow-right rounded-r-md pl-3 md:pl-6 -ml-1 md:-ml-2 z-10"; else if (vStat.type === 'mid') borderStyle = "shadow-border-yellow-mid px-3 md:px-6 -mx-1 md:-mx-2 z-10"; }
                            return (<React.Fragment key={i}><div className="relative flex flex-col items-center justify-end"><div className={`text-5xl md:text-8xl font-bold text-slate-800 leading-none px-0 py-1 ${vowelClass} ${borderStyle}`}>{char}</div></div>{i < fullWord.length - 1 && (<div onClick={() => handleGapClick(i)} className="group relative w-6 md:w-12 h-20 md:h-36 -mb-2 cursor-pointer flex justify-center items-end hover:bg-blue-50 rounded mx-1 transition-colors"><div className={`w-2 md:w-3 h-16 md:h-28 rounded-full transition-all duration-200 ${userSplits.has(i) ? 'bg-blue-600 shadow-lg scale-y-100' : 'bg-slate-200 scale-y-50 group-hover:scale-y-75'}`}></div></div>)}</React.Fragment>);
                        })}
                    </div>
                    {status === 'wrong' && <p className="text-red-500 font-bold text-lg mt-4 animate-pulse">Das stimmt noch nicht ganz.</p>}
                    {status === 'correct' && <p className="text-green-600 font-bold text-2xl mt-4 pop-animate">Richtig!</p>}
                </div>
                <div className="p-6 bg-white border-t flex flex-wrap gap-4 justify-center items-center shrink-0">
                    <button onClick={() => setShowVowels(!showVowels)} className={`px-4 py-3 rounded-xl border font-bold transition flex items-center gap-2 min-touch-target ${showVowels ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}><div className={`w-4 h-4 rounded-full border ${showVowels ? 'bg-yellow-400 border-yellow-500' : 'bg-slate-300 border-slate-400'}`}></div> Vokale an</button>
                    <div className="flex-1"></div>
                    {status !== 'correct' ? (<button onClick={checkAnswer} className="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition min-touch-target">Prüfen</button>) : (<button onClick={nextWord} className="px-8 py-3 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 shadow-lg active:scale-95 transition flex items-center gap-2 pop-animate min-touch-target">{currentIndex < words.length - 1 ? 'Nächstes Wort' : 'Fertig'} <Icons.ArrowRight /></button>)}
                </div>
            </div>
        </div>
    );
};
