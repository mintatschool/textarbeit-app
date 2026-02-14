import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { Volume2, VolumeX } from 'lucide-react';
import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { Word } from './Word';
import { speak } from '../utils/speech';
import { analyzeTextLocalAdjectives } from '../data/adjectiveDatabase';

const ADJ_CATEGORIES = [
    { key: 'positiv', label: 'Grundstufe' },
    { key: 'komparativ', label: '1. Vergleichsstufe' },
    { key: 'superlativ', label: '2. Vergleichsstufe' }
];

export const AdjectiveWritingView = ({ words, settings, setSettings, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [focusedKey, setFocusedKey] = useState(null);
    const [showReward, setShowReward] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [selectionIndex, setSelectionIndex] = useState(null);

    // Track state for ALL adjectives to support navigation
    // { index: { enteredTexts, feedback, hasChecked, isComplete, shownFormIndex } }
    const [history, setHistory] = useState({});

    const adjItems = useMemo(() => {
        const uniqueAdjectives = new Map();

        // Extract all words from highlighted areas
        const allText = words.map(w => w.word).join(' ');
        const foundAdjectives = analyzeTextLocalAdjectives(allText);

        foundAdjectives.forEach(adj => {
            if (!uniqueAdjectives.has(adj.lemma)) {
                uniqueAdjectives.set(adj.lemma, adj);
            }
        });

        return Array.from(uniqueAdjectives.values());
    }, [words]);

    const currentAdj = adjItems[currentIndex];

    // Initialize state for current adjective if it doesn't exist
    useEffect(() => {
        if (!currentAdj || history[currentIndex]) return;

        // Randomly pick one of the 3 forms to show (if they exist)
        const availableIndices = [0];
        if (currentAdj.komparativ !== '-') availableIndices.push(1);
        if (currentAdj.superlativ !== '-') availableIndices.push(2);
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

        setHistory(prev => ({
            ...prev,
            [currentIndex]: {
                enteredTexts: {},
                feedback: {},
                hasChecked: false,
                isComplete: false,
                shownFormIndex: randomIndex
            }
        }));
    }, [currentIndex, currentAdj, history]);

    const currentState = history[currentIndex] || {
        enteredTexts: {},
        feedback: {},
        hasChecked: false,
        isComplete: false,
        shownFormIndex: 0
    };

    const { enteredTexts, feedback, hasChecked, isComplete, shownFormIndex } = currentState;

    const updateCurrentHistory = (updates) => {
        setHistory(prev => ({
            ...prev,
            [currentIndex]: {
                ...currentState,
                ...updates
            }
        }));
    };

    // Helper to process word parts (handling "am " prefix)
    const getParts = (categoryKey, text) => {
        const lower = (text || '').toLowerCase();
        if (categoryKey === 'superlativ') {
            if (lower.startsWith('am ')) {
                return { prefix: 'am', stem: text.substring(3), stemOffset: 3 };
            } else if (lower.startsWith('am')) {
                return { prefix: 'am', stem: text.substring(2), stemOffset: 2 };
            } else if (lower.startsWith('a')) {
                return { prefix: 'a', stem: text.substring(1), stemOffset: 1 };
            }
        }
        return { prefix: '', stem: text, stemOffset: 0 };
    };




    useEffect(() => {
        if (settings.fontSize > 56) {
            setSettings(prev => ({ ...prev, fontSize: 56 }));
        }
    }, [settings.fontSize, setSettings]);

    // Inject Custom Style for Hard Blink


    const handleInputChange = (category, value) => {
        const newEnteredTexts = { ...enteredTexts, [category]: value };
        if (hasChecked && !isComplete) {
            updateCurrentHistory({ enteredTexts: newEnteredTexts, hasChecked: false, feedback: {} });
        } else {
            updateCurrentHistory({ enteredTexts: newEnteredTexts });
        }
    };

    const handleNext = () => {
        if (currentIndex < adjItems.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleMainAction = () => {
        if (!hasChecked) {
            checkAnswers();
        } else if (isComplete) {
            handleNext();
        }
    };

    const allFormsFilled = useMemo(() => {
        if (!currentAdj) return false;

        const filledKeys = Object.keys(enteredTexts).filter(k => {
            const val = enteredTexts[k] || '';
            const testParts = getParts(k, val);
            return testParts.stem.trim().length > 0;
        }).length;

        // Better logic: count how many of the 3 forms exist and are NOT the shown one.
        let neededKeys = 0;
        if (shownFormIndex !== 0) neededKeys++;
        if (currentAdj.komparativ !== '-' && shownFormIndex !== 1) neededKeys++;
        if (currentAdj.superlativ !== '-' && shownFormIndex !== 2) neededKeys++;

        return filledKeys >= neededKeys;
    }, [enteredTexts, currentAdj, shownFormIndex]);

    const checkAnswers = () => {
        if (!currentAdj) return;
        const newFeedback = {};
        let allCorrect = true;

        // Positiv
        if (shownFormIndex !== 0) {
            const entered = (enteredTexts['positiv'] || '').trim().toLowerCase();
            const target = currentAdj.lemma.toLowerCase();
            if (entered === target) {
                newFeedback['positiv'] = 'correct';
            } else {
                newFeedback['positiv'] = 'incorrect';
                allCorrect = false;
            }
        }

        // Komparativ
        if (currentAdj.komparativ !== '-' && shownFormIndex !== 1) {
            const entered = (enteredTexts['komparativ'] || '').trim().toLowerCase();
            const target = currentAdj.komparativ.toLowerCase();
            if (entered === target) {
                newFeedback['komparativ'] = 'correct';
            } else {
                newFeedback['komparativ'] = 'incorrect';
                allCorrect = false;
            }
        }

        // Superlativ
        if (currentAdj.superlativ !== '-' && shownFormIndex !== 2) {
            const entered = (enteredTexts['superlativ'] || '').trim().toLowerCase();
            const target = currentAdj.superlativ.toLowerCase();

            const enteredStem = getParts('superlativ', entered).stem;
            const targetStem = getParts('superlativ', target).stem;

            if (enteredStem === targetStem && (entered.startsWith('am ') || entered.startsWith('am'))) {
                newFeedback['superlativ'] = 'correct';
            } else {
                newFeedback['superlativ'] = 'incorrect';
                allCorrect = false;
            }
        }

        updateCurrentHistory({
            feedback: newFeedback,
            hasChecked: true,
            isComplete: allCorrect
        });

        if (allCorrect && currentIndex === adjItems.length - 1) {
            setTimeout(() => setShowReward(true), 500);
        }
    };

    if (adjItems.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
                    <Icons.AlertTriangle size={64} className="mx-auto text-amber-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Keine Adjektive gefunden</h2>
                    <p className="text-slate-600 mb-6">Bitte markiere zuerst einige Adjektive im Text, um diese Übung zu starten.</p>
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">Zurück zum Text</button>
                </div>
            </div>
        );
    }

    const currentAdjForms = [
        currentAdj.lemma,
        currentAdj.komparativ,
        currentAdj.superlativ
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans select-none overflow-hidden">
            <ExerciseHeader
                title="Adjektive schreiben"
                icon={Icons.VerbWriting || Icons.Edit}
                current={currentIndex + 1}
                total={adjItems.length}
                progressPercentage={((currentIndex + 1) / adjItems.length) * 100}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                showSlider={true}
                sliderMin={24}
                sliderMax={56}
                customControls={
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            title={audioEnabled ? 'Audio an' : 'Audio aus'}
                        >
                            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                    </div>
                }
            />

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start gap-8">
                    <div className="w-fit min-w-[70%] bg-white p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                        <div className="flex flex-col gap-8 w-full px-4 text-left">
                            {ADJ_CATEGORIES.map((cat, idx) => {
                                const formValue = currentAdjForms[idx];
                                if (formValue === '-') return null;

                                const isShown = shownFormIndex === idx;
                                const isSuperlative = cat.key === 'superlativ';

                                // Determine content for 'am' prefix and stem based on view mode
                                let displayPrefix = '';
                                let displayStem = formValue;

                                if (isSuperlative) {
                                    // Check if the target form actually has 'am ' prefix (it should for superlatives usually)
                                    if (formValue.toLowerCase().startsWith('am ')) {
                                        displayPrefix = 'am';
                                        displayStem = formValue.substring(3);
                                    }
                                }

                                return (
                                    <div key={cat.key} className="flex items-center gap-4">
                                        {/* Label Area */}
                                        <div className="w-64 shrink-0">
                                            <span className="text-lg font-bold text-blue-700 uppercase tracking-widest leading-none">
                                                {cat.label}
                                            </span>
                                        </div>

                                        {/* Content Container (Prefix + Stem) */}
                                        <div
                                            className="flex-1 flex items-baseline"
                                            style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}
                                        >
                                            {/* Prefix Column ('am') */}
                                            <div
                                                className="shrink-0 flex justify-end mr-12"
                                                style={{ width: '2.5em' }} // Fixed em width for 'am' alignment relative to font size
                                            >
                                                {isSuperlative ? (
                                                    isShown ? (
                                                        // View Mode: Show 'am' text if it exists
                                                        displayPrefix ? (
                                                            <span className="font-bold">{displayPrefix}</span>
                                                        ) : null
                                                    ) : (
                                                        // Edit Mode: Show 'am' Input
                                                        // Only separate input if the target starts with 'am ' (standard superlative)
                                                        formValue.toLowerCase().startsWith('am ') ? (
                                                            <input
                                                                type="text"
                                                                value={(enteredTexts[cat.key] || '').toLowerCase().startsWith('am ') ? 'am' : ((enteredTexts[cat.key] || '').split(' ')[0] === 'am' ? 'am' : (enteredTexts[cat.key] || '').substring(0, 2).trim())}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const parts = (enteredTexts[cat.key] || '').split(' ');
                                                                    const rest = parts.length > 1 ? parts.slice(1).join(' ') : '';
                                                                    if (val.length <= 2) {
                                                                        handleInputChange(cat.key, `${val} ${rest}`);
                                                                    }
                                                                }}
                                                                spellCheck="false"
                                                                placeholder=" "
                                                                autoComplete="off"
                                                                autoCorrect="off"
                                                                autoCapitalize="none"
                                                                className={`px-4 py-2 border-2 rounded-xl appearance-none text-left font-medium outline-none transition-all placeholder:font-normal placeholder:text-slate-300 bg-white
                                                                    ${hasChecked
                                                                        ? (feedback[cat.key] === 'correct'
                                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                                            : 'border-red-500 bg-red-50 text-red-700')
                                                                        : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-blue-900'
                                                                    }
                                                                `}
                                                                style={{
                                                                    width: '100%',
                                                                    fontSize: `${settings.fontSize}px`,
                                                                    fontFamily: settings.fontFamily,
                                                                    letterSpacing: `${(settings.letterSpacing ?? 0)}em`,
                                                                    marginLeft: '-18px'
                                                                }}
                                                            />
                                                        ) : null
                                                    )
                                                ) : null}
                                            </div>

                                            {/* Stem Column */}
                                            <div className="flex-1 flex justify-start">
                                                {isShown ? (
                                                    <Word
                                                        word={displayStem}
                                                        settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                        forceNoMargin={true}
                                                        isReadingMode={true}
                                                    />
                                                ) : (
                                                    // Input Field
                                                    isSuperlative && formValue.toLowerCase().startsWith('am ') ? (
                                                        // Stem Input for Superlative
                                                        <input
                                                            type="text"
                                                            value={(enteredTexts[cat.key] || '').toLowerCase().startsWith('am ') ? (enteredTexts[cat.key] || '').substring(3) : ((enteredTexts[cat.key] || '').includes(' ') ? (enteredTexts[cat.key] || '').split(' ').slice(1).join(' ') : (enteredTexts[cat.key] && enteredTexts[cat.key] !== 'am' && enteredTexts[cat.key] !== 'a' ? enteredTexts[cat.key] : ''))}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                handleInputChange(cat.key, `am ${val}`);
                                                            }}
                                                            spellCheck="false"
                                                            placeholder=" "
                                                            autoComplete="off"
                                                            autoCorrect="off"
                                                            autoCapitalize="none"
                                                            className={`px-4 py-2 border-2 rounded-xl appearance-none text-left font-medium outline-none transition-all placeholder:font-normal placeholder:text-slate-300 bg-white
                                                                ${hasChecked
                                                                    ? (feedback[cat.key] === 'correct'
                                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                                        : 'border-red-500 bg-red-50 text-red-700')
                                                                    : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-blue-900'
                                                                }
                                                            `}
                                                            style={{
                                                                minWidth: '2.5em',
                                                                width: `${Math.max((formValue.substring(3) || '').length, 2) + 4.0}ch`,
                                                                fontSize: `${settings.fontSize}px`,
                                                                fontFamily: settings.fontFamily,
                                                                letterSpacing: `${(settings.letterSpacing ?? 0)}em`,
                                                                marginLeft: '-18px'
                                                            }}
                                                        />
                                                    ) : (
                                                        // Standard Input for Positiv/Komparativ
                                                        <input
                                                            type="text"
                                                            value={enteredTexts[cat.key] || ''}
                                                            onChange={(e) => handleInputChange(cat.key, e.target.value)}
                                                            spellCheck="false"
                                                            placeholder=" "
                                                            autoComplete="off"
                                                            autoCorrect="off"
                                                            autoCapitalize="none"
                                                            className={`px-4 py-2 border-2 rounded-xl appearance-none text-left font-medium outline-none transition-all placeholder:font-normal placeholder:text-slate-300 bg-white
                                                                ${hasChecked
                                                                    ? (feedback[cat.key] === 'correct'
                                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                                        : 'border-red-500 bg-red-50 text-red-700')
                                                                    : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-blue-900'
                                                                }
                                                            `}
                                                            style={{
                                                                minWidth: '2.5em',
                                                                width: `${Math.max(formValue.length, 2) + 4.0}ch`,
                                                                fontSize: `${settings.fontSize}px`,
                                                                fontFamily: settings.fontFamily,
                                                                letterSpacing: `${(settings.letterSpacing ?? 0)}em`,
                                                                marginLeft: '-18px'
                                                            }}
                                                        />
                                                    )
                                                )}
                                            </div>

                                            {/* Audio Button */}
                                            {audioEnabled && (
                                                <div className="ml-8 self-center">
                                                    <button
                                                        onClick={() => speak(formValue)}
                                                        className="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-sm"
                                                        title="Anhören"
                                                    >
                                                        <Volume2 size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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
                message="Alle Adjektive gemeistert! Großartig!"
            />
        </div>
    );
};
