import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { ProgressBar } from './ProgressBar';
import { speak } from '../utils/speech';
import { shuffleArray } from '../utils/arrayUtils';
import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';

export const SplitExerciseView = ({ words, onClose, settings, setSettings, title }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[130] bg-slate-100 modal-animate font-sans flex flex-col items-center justify-center"><EmptyStateMessage onClose={onClose} /></div>);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userSplits, setUserSplits] = useState(new Set());

    // Randomize words
    const randomWords = useMemo(() => {
        return shuffleArray(words);
    }, [words]);

    const [showVowels, setShowVowels] = useState(false);
    const [status, setStatus] = useState('idle');
    const [isSessionFinished, setIsSessionFinished] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [isError, setIsError] = useState(false);
    const currentWordObj = randomWords[currentIndex];
    const fullWord = currentWordObj ? currentWordObj.word : '';
    const correctSyllables = currentWordObj ? currentWordObj.syllables : [];
    const progress = ((currentIndex + 1) / (words ? words.length : 1)) * 100;

    useEffect(() => { setUserSplits(new Set()); setStatus('idle'); }, [currentIndex]);

    const correctSplitIndices = useMemo(() => { const indices = new Set(); let acc = 0; for (let i = 0; i < correctSyllables.length - 1; i++) { acc += correctSyllables[i].length; indices.add(acc - 1); } return indices; }, [correctSyllables]);
    const vowelStatus = useMemo(() => { const status = new Array(fullWord.length).fill(null); const text = fullWord.toLowerCase(); const diphthongs = ['eu', 'äu', 'au', 'ei', 'ie', 'ai']; const singleVowels = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü']; let i = 0; while (i < text.length) { let isDiphthong = false; for (let d of diphthongs) { if (text.startsWith(d, i)) { status[i] = { type: 'start' }; if (d.length > 1) { for (let k = 1; k < d.length - 1; k++) status[i + k] = { type: 'mid' }; status[i + d.length - 1] = { type: 'end' }; } else { status[i] = { type: 'single' }; } i += d.length; isDiphthong = true; break; } } if (isDiphthong) continue; if (singleVowels.includes(text[i])) { status[i] = { type: 'single' }; } i++; } return status; }, [fullWord]);

    const handleGapClick = (index) => { if (status === 'correct') return; const newSplits = new Set(userSplits); if (newSplits.has(index)) newSplits.delete(index); else newSplits.add(index); setUserSplits(newSplits); setStatus('idle'); setIsError(false); };
    const checkAnswer = () => {
        const isCorrect = userSplits.size === correctSplitIndices.size && [...userSplits].every(x => correctSplitIndices.has(x));
        if (isCorrect) {
            setStatus('correct');
        } else {
            setStatus('wrong'); // Keep internal status for button logic if needed, but rely on effect for visuals
            setIsShaking(true);
            setIsError(true);
            setTimeout(() => {
                setIsShaking(false);
                setIsError(false);
                setStatus('idle'); // Optional: reset status to idle so 'Check' button comes back if desired, or keep as 'wrong' but remove message
            }, 500);
        }
    };
    const nextWord = () => { if (currentIndex < words.length - 1) { setCurrentIndex(prev => prev + 1); } else { setIsSessionFinished(true); } };
    if (!currentWordObj) return null;

    return (
        <div className="fixed inset-0 z-[130] flex flex-col bg-slate-100 modal-animate font-sans select-none">
            <RewardModal
                isOpen={isSessionFinished}
                onClose={onClose}
                message="Alle Wörter richtig getrennt! Toll!"
            />

            <ExerciseHeader
                title={title || "Wörter trennen"}
                icon={Icons.Scissors}
                current={currentIndex + 1}
                total={words.length}
                progressPercentage={progress}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={24}
                sliderMax={100}
                customControls={
                    <button
                        onClick={() => setShowVowels(!showVowels)}
                        className={`px-4 py-2 rounded-xl font-bold text-lg border transition-all min-touch-target ${showVowels ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_2px_0_0_#eab308]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                        Vokale
                    </button>
                }
            />

            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white/50 overflow-y-auto custom-scroll">
                <div className={`flex flex-wrap justify-center items-end gap-16 py-4 ${isShaking ? 'shake' : ''}`}>
                    {status === 'correct' ? (
                        <div className="flex flex-wrap justify-center items-end gap-1 select-none animate-fadeIn transition-all duration-500">
                            {correctSyllables.map((syl, idx) => {
                                const isEven = idx % 2 === 0;
                                let classes = "relative flex items-center justify-center px-2 ";
                                let textClass = "text-slate-800";
                                let arcColor = isEven ? '#2563eb' : '#dc2626';

                                if (settings.visualType === 'block') {
                                    classes += isEven ? 'bg-blue-100 border-blue-200/50' : 'bg-blue-200 border-blue-300/50';
                                    classes += " border rounded-xl shadow-sm py-1";
                                } else if (settings.visualType === 'arc') {
                                    classes += " pb-8"; // Space for arc - increased for large size
                                } else if (settings.visualType === 'black_gray') {
                                    textClass = isEven ? "text-slate-900" : "text-gray-400";
                                }

                                return (
                                    <div key={idx} className={classes} style={{ fontSize: `${settings.fontSize * 2.5}px`, fontFamily: settings.fontFamily }}>
                                        <span className={`font-bold leading-none ${textClass}`}>{syl}</span>
                                        {settings.visualType === 'arc' && (
                                            <svg className="absolute bottom-0 left-0 w-full h-8 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none">
                                                <path d="M 2 2 Q 50 20 98 2" fill="none" stroke={arcColor} strokeWidth="6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                            </svg>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center items-end select-none" style={{ fontFamily: settings.fontFamily }}>
                            {fullWord.split('').map((char, i) => {
                                const vStat = vowelStatus[i]; let vowelClass = ""; let borderStyle = "";
                                if (showVowels && vStat) { vowelClass = "bg-yellow-100"; if (vStat.type === 'single') borderStyle = "shadow-border-yellow rounded-sm"; else if (vStat.type === 'start') borderStyle = "shadow-border-yellow-left rounded-l-md pr-3 md:pr-6 -mr-1 md:-mr-2 z-10"; else if (vStat.type === 'end') borderStyle = "shadow-border-yellow-right rounded-r-md pl-3 md:pl-6 -ml-1 md:-ml-2 z-10"; else if (vStat.type === 'mid') borderStyle = "shadow-border-yellow-mid px-3 md:px-6 -mx-1 md:-mx-2 z-10"; }
                                return (
                                    <React.Fragment key={i}>
                                        <div className="relative flex flex-col items-center justify-end">
                                            <div className={`font-bold leading-none px-0 py-1 transition-all ${isError ? 'text-red-500' : 'text-slate-800'} ${vowelClass} ${borderStyle}`} style={{ fontSize: `${settings.fontSize * 2.5}px` }}>
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
                    )}
                    <button
                        onClick={() => speak(fullWord)}
                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 shrink-0 mb-8"
                        title="Wort anhören"
                    >
                        <Icons.Volume2 size={24} />
                    </button>
                </div>
                <div className="flex flex-col items-center gap-4 min-h-[4rem]">
                    {/* Removed text feedback 'Das stimmt noch nicht ganz.' */}
                    {status === 'correct' && (
                        <>
                            <p className="text-green-600 font-bold text-2xl pop-animate flex items-center gap-2"><Icons.Check size={28} /> Richtig!</p>

                            {/* Syllable Feedback Display */}

                        </>
                    )}
                </div>
            </div>

            <div className="px-6 py-3 bg-white border-t flex flex-wrap gap-4 justify-end items-center shrink-0">
                <div className="flex-1"></div>
                {status !== 'correct' ? (
                    <button onClick={checkAnswer} className={`px-8 py-2.5 text-white text-lg font-bold rounded-xl shadow-lg active:scale-95 transition min-touch-target flex items-center gap-2 ${isShaking ? 'bg-red-500' : 'bg-blue-600 hover:bg-blue-700'}`}><Icons.Check size={20} /> Prüfen</button>
                ) : (
                    <button onClick={nextWord} className="px-8 py-2.5 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition flex items-center gap-2 pop-animate min-touch-target">
                        {currentIndex < words.length - 1 ? 'Nächstes Wort' : 'Fertig'} <Icons.ArrowRight />
                    </button>
                )}
            </div>
        </div>
    );
};
