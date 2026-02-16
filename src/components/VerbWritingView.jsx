import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';

import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { Tense, VERB_PRONOUNS, getVerbPuzzleParts, getInfinitiveStem } from '../utils/verbUtils';
import { getLocalConjugation, findVerbLemma } from '../data/verbDatabase';
import { Word } from './Word';
import { speak } from '../utils/speech';
import { getTerm } from '../utils/terminology';

export const VerbWritingView = ({ words, settings, setSettings, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentTense, setCurrentTense] = useState('Präsens');
    const [mode, setMode] = useState('ending'); // 'ending' or 'word'
    const [enteredTexts, setEnteredTexts] = useState({}); // { pronounKey: string }
    const [feedback, setFeedback] = useState({});
    const [hasChecked, setHasChecked] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [isTenseMenuOpen, setIsTenseMenuOpen] = useState(false);
    const tenseMenuRef = useRef(null);

    const verbItems = useMemo(() => {
        const uniqueVerbs = new Map();
        words.forEach(w => {
            if (w.data && (w.data.category === 'VERB' || w.data.pos === 'VERB')) {
                const lemma = w.lemma || w.word.toLowerCase();
                if (!uniqueVerbs.has(lemma)) {
                    uniqueVerbs.set(lemma, { ...w, lemma });
                }
                return;
            }

            if (w.isVerb) {
                const lemma = w.lemma || w.word.toLowerCase();
                if (!uniqueVerbs.has(lemma)) {
                    uniqueVerbs.set(lemma, { ...w, lemma });
                }
                return;
            }

            const lemma = findVerbLemma(w.word);
            if (lemma) {
                if (!uniqueVerbs.has(lemma)) {
                    uniqueVerbs.set(lemma, { ...w, lemma });
                }
            }
        });
        return Array.from(uniqueVerbs.values());
    }, [words]);

    const currentVerb = verbItems[currentIndex];

    const conjugationData = useMemo(() => {
        if (!currentVerb) return null;
        return getLocalConjugation(currentVerb.lemma, currentTense);
    }, [currentVerb, currentTense]);

    useEffect(() => {
        if (settings.fontSize > 56) {
            setSettings(prev => ({ ...prev, fontSize: 56 }));
        }
    }, [settings.fontSize, setSettings]);

    useEffect(() => {
        setEnteredTexts({});
        setFeedback({});
        setHasChecked(false);
        setIsComplete(false);
        setIsTenseMenuOpen(false);
    }, [currentIndex, currentTense, mode]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tenseMenuRef.current && !tenseMenuRef.current.contains(event.target)) {
                setIsTenseMenuOpen(false);
            }
        };

        if (isTenseMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isTenseMenuOpen]);

    const allFormsFilled = useMemo(() => {
        if (!conjugationData) return false;

        const filledKeys = Object.keys(enteredTexts).filter(k => enteredTexts[k]?.trim().length > 0).length;
        const requiredKeys = VERB_PRONOUNS.filter(({ key: pronoun }) => {
            const conjugated = conjugationData[pronoun];
            if (!conjugated) return false;

            if (mode === 'word') return true;

            const parts = getVerbPuzzleParts(conjugated, currentTense);
            return !!parts.target;
        }).length;

        return filledKeys === requiredKeys && requiredKeys > 0;
    }, [enteredTexts, conjugationData, currentTense, mode]);

    const checkAnswers = () => {
        if (!conjugationData) return;
        const newFeedback = {};
        let allCorrect = true;

        VERB_PRONOUNS.forEach(({ key: pronoun }) => {
            const conjugated = conjugationData[pronoun];
            if (!conjugated) return;

            let target;
            if (mode === 'word') {
                target = conjugated.toLowerCase();
            } else {
                const parts = getVerbPuzzleParts(conjugated, currentTense);
                if (!parts.target) {
                    newFeedback[pronoun] = 'correct';
                    return;
                }
                target = parts.target.toLowerCase();
            }

            const entered = (enteredTexts[pronoun] || '').trim().toLowerCase();

            if (entered === target) {
                newFeedback[pronoun] = 'correct';
            } else {
                newFeedback[pronoun] = 'incorrect';
                allCorrect = false;
            }
        });

        setFeedback(newFeedback);
        setHasChecked(true);

        if (allCorrect) {
            setIsComplete(true);
            if (currentIndex === verbItems.length - 1) {
                setTimeout(() => setShowReward(true), 500);
            }
        }
    };

    const handleInputChange = (pronoun, value) => {
        if (hasChecked && !isComplete) {
            setHasChecked(false);
            setFeedback({});
        }
        setEnteredTexts(prev => ({ ...prev, [pronoun]: value }));
    };

    const handleMainAction = () => {
        if (!hasChecked) {
            checkAnswers();
        } else if (isComplete) {
            if (currentIndex < verbItems.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        }
    };

    if (verbItems.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
                    <Icons.AlertTriangle size={64} className="mx-auto text-amber-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Keine {getTerm("Verben", settings)} gefunden</h2>
                    <p className="text-slate-600 mb-6">Bitte markiere zuerst einige {getTerm("Verben", settings)} im Text, um diese Übung zu starten.</p>
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">Zurück zum Text</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans select-none overflow-hidden">
            <ExerciseHeader
                title={`${getTerm("Verben", settings)} schreiben`}
                icon={Icons.VerbWriting || Icons.Edit}
                current={currentIndex + 1}
                total={verbItems.length}
                progressPercentage={((currentIndex) / verbItems.length) * 100}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                showSlider={true}
                sliderMin={24}
                sliderMax={56}
                customControls={
                    <div className="flex items-center gap-4 -ml-4">
                        <div className="flex bg-slate-200/50 p-0.5 rounded-lg items-center shadow-inner">
                            <button
                                onClick={() => setMode('ending')}
                                className={`h-8 px-1.5 rounded-md flex items-center gap-1 text-[13px] font-bold transition-all ${mode === 'ending'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                title="Nur Endung schreiben"
                            >
                                <span className="whitespace-nowrap">ich schreib</span>
                                <div className={`w-5 h-5 border-[1.5px] rounded flex items-center justify-center ${mode === 'ending' ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-100/50'}`}>
                                    <span className="text-blue-500 text-[10px]">e</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setMode('word')}
                                className={`h-8 px-1.5 rounded-md flex items-center gap-1 text-[13px] font-bold transition-all ${mode === 'word'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                title="Ganzes Wort schreiben"
                            >
                                <span className="whitespace-nowrap">ich</span>
                                <div className={`min-w-[2.8rem] h-5 px-1 border-[1.5px] rounded flex items-center justify-center ${mode === 'word' ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-100/50'}`}>
                                    <span className="text-blue-500 text-[9px] leading-none">schreibe</span>
                                </div>
                            </button>
                        </div>

                        <div className="relative" ref={tenseMenuRef}>
                            <div className="bg-slate-100 border border-slate-200 rounded-lg flex items-center overflow-hidden h-8">
                                <div className="px-2 font-bold text-sm text-slate-600 border-r border-slate-200 h-full flex items-center">
                                    {currentTense}
                                </div>
                                <button
                                    onClick={() => setIsTenseMenuOpen(!isTenseMenuOpen)}
                                    className={`px-1.5 h-full flex items-center justify-center transition-all hover:bg-slate-200 text-blue-600 ${isTenseMenuOpen ? 'bg-slate-200' : ''}`}
                                    title="Zeitform wählen"
                                >
                                    <Icons.ChevronsUpDown size={16} />
                                </button>
                            </div>

                            {isTenseMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                                    {Object.values(Tense).map(tense => (
                                        <button
                                            key={tense}
                                            onClick={() => {
                                                setCurrentTense(tense);
                                                setIsTenseMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between group ${currentTense === tense ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600 font-medium'}`}
                                        >
                                            {tense}
                                            {currentTense === tense && <Icons.Check size={14} className="text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            title={audioEnabled ? 'Audio an' : 'Audio aus'}
                        >
                            {audioEnabled ? <Icons.Volume2 size={16} /> : <Icons.VolumeX size={16} />}
                        </button>
                    </div>
                }
            />

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start gap-8">
                    <div className="w-fit min-w-[50%] bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-8">
                            <h3
                                className="text-5xl text-slate-800 tracking-tight"
                                style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize * 1.5}px` }}
                            >
                                {(() => {
                                    const { stem, ending } = getInfinitiveStem(currentVerb.lemma);
                                    return (
                                        <>
                                            <span className="font-black">{stem}</span>
                                            <span className="font-normal">{ending}</span>
                                        </>
                                    );
                                })()}
                            </h3>
                            {audioEnabled && (
                                <button
                                    onClick={() => speak(currentVerb.lemma)}
                                    className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-all"
                                >
                                    <Icons.Volume2 size={24} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-3 md:grid-flow-col gap-x-16 gap-y-4 w-full px-4 text-left">
                            {['ich', 'du', 'er_sie_es', 'wir', 'ihr', 'sie_Sie'].map((key) => {
                                const pronounObj = VERB_PRONOUNS.find(p => p.key === key);
                                const label = pronounObj ? pronounObj.label : key;
                                const conjugated = conjugationData ? conjugationData[key] : '';
                                const parts = conjugationData ? getVerbPuzzleParts(conjugated, currentTense) : { fixedBefore: '', target: '', fixedAfter: '' };
                                const isCorrect = hasChecked && feedback[key] === 'correct';
                                const isIncorrect = hasChecked && feedback[key] === 'incorrect';

                                let fixedBefore = parts.fixedBefore;
                                let fixedAfter = parts.fixedAfter;
                                let target = parts.target;

                                if (mode === 'word') {
                                    fixedBefore = '';
                                    fixedAfter = '';
                                    target = conjugated;
                                }

                                return (
                                    <div key={key} className="flex items-baseline gap-4 min-h-0" style={{ lineHeight: '1.1' }}>
                                        <div className="min-w-[8rem] flex justify-end">
                                            <Word
                                                word={label}
                                                settings={{
                                                    ...settings,
                                                    fontSize: key === 'er_sie_es' ? settings.fontSize * 0.7 : settings.fontSize,
                                                    visualType: 'none',
                                                    displayTrigger: 'never'
                                                }}
                                                isReadingMode={true}
                                                forceNoMargin={true}
                                            />
                                        </div>
                                        <div className="flex-1 flex items-baseline relative group px-2">
                                            <div className="flex items-baseline gap-1" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>


                                                {fixedBefore && (
                                                    <Word
                                                        word={fixedBefore}
                                                        settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                        forceNoMargin={true}
                                                        isReadingMode={true}
                                                    />
                                                )}

                                                {target && (
                                                    <input
                                                        type="text"
                                                        value={enteredTexts[key] || ''}
                                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                                        spellCheck="false"
                                                        placeholder=" "
                                                        autoComplete="off"
                                                        autoCorrect="off"
                                                        autoCapitalize="none"
                                                        className={`px-4 py-2 border-2 rounded-xl appearance-none text-left font-bold outline-none transition-all placeholder:font-normal placeholder:text-slate-300 bg-white
                                                            ${hasChecked
                                                                ? (isCorrect
                                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                                    : 'border-red-500 bg-red-50 text-red-700')
                                                                : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-blue-900'
                                                            }
                                                        `}
                                                        style={{
                                                            minWidth: '2.5em',
                                                            width: `${Math.max(target.length, 2) + 1.2}ch`,
                                                            fontSize: `${settings.fontSize}px`,
                                                            fontFamily: settings.fontFamily,
                                                        }}
                                                    />
                                                )}

                                                {fixedAfter && (
                                                    <Word
                                                        word={fixedAfter}
                                                        settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                        forceNoMargin={true}
                                                        isReadingMode={true}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        {audioEnabled && (
                                            <div className="pl-4">
                                                <button
                                                    onClick={() => {
                                                        const textToSpeak = `${label} ${fixedBefore || ''}${target || ''}${fixedAfter ? ' ' + fixedAfter : ''}`;
                                                        speak(textToSpeak.trim());
                                                    }}
                                                    className="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-sm"
                                                    title="Anhören"
                                                >
                                                    <Icons.Volume2 size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-4 shrink-0">
                <div className="flex-1 flex justify-end">
                    {allFormsFilled && (
                        <button
                            onClick={handleMainAction}
                            className={`px-8 py-2.5 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 min-touch-target bg-blue-600 hover:bg-blue-700 text-white`}
                        >
                            {isComplete ? (
                                <>Weiter <Icons.ArrowRight size={20} /></>
                            ) : (
                                <>Prüfen <Icons.Check size={20} /></>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message={`Alle ${getTerm("Verben", settings)} gemeistert! Fantastisch!`}
            />
        </div>
    );
};
