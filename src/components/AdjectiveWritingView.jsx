import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';

import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { Word } from './Word';
import { speak } from '../utils/speech';
import { analyzeTextLocalAdjectives } from '../data/adjectiveDatabase';
import { getTerm } from '../utils/terminology';
import { CustomKeyboard } from './CustomKeyboard';

const ADJ_CATEGORIES = [
    { key: 'positiv', label: 'Grundstufe' },
    { key: 'komparativ', label: '1. Vergleichsstufe' },
    { key: 'superlativ', label: '2. Vergleichsstufe' }
];

export const AdjectiveWritingView = ({ words, settings, setSettings, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showReward, setShowReward] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Track state for ALL adjectives to support navigation
    // { index: { enteredTexts, feedback, hasChecked, isComplete, shownFormIndex } }
    const [history, setHistory] = useState({});

    // Active Field State: { category: 'positiv'|'komparativ'|'superlativ', part: 'stem'|'prefix' }
    // We'll initialize this when a new word loads or user TAPS a field
    const [activeField, setActiveField] = useState(null);
    const [activeKey, setActiveKey] = useState(null); // For visual feedback on keyboard

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

    // Set initial active field when a new word is loaded or state initializes
    useEffect(() => {
        if (!activeField && !isComplete && !hasChecked) {
            // Find first empty or available field
            for (let i = 0; i < ADJ_CATEGORIES.length; i++) {
                const cat = ADJ_CATEGORIES[i];
                if (i !== shownFormIndex && (cat.key !== 'komparativ' || currentAdj.komparativ !== '-') && (cat.key !== 'superlativ' || currentAdj.superlativ !== '-')) {
                    // Check if it's superlative and has 'am' prefix separately?
                    // For simplicity, default to stem of first available
                    if (cat.key === 'superlativ' && currentAdj.superlativ.startsWith('am ')) {
                        // Maybe active prefix 'am' first? Or just stem. Let's do stem for now as 'am' is often pre-filled or easy
                        // Actually, let's select the Prefix 'am' if it's empty
                        const val = enteredTexts[cat.key] || '';
                        if (!val.startsWith('am ')) {
                            setActiveField({ category: cat.key, part: 'prefix' });
                        } else {
                            setActiveField({ category: cat.key, part: 'stem' });
                        }
                    } else {
                        setActiveField({ category: cat.key, part: 'stem' });
                    }
                    break;
                }
            }
        }
    }, [currentIndex, shownFormIndex, currentAdj, isComplete, hasChecked]); // removed activeField from dep to avoid loop, check inside


    const updateCurrentHistory = (updates) => {
        setHistory(prev => {
            const currentItem = prev[currentIndex] || {};
            return {
                ...prev,
                [currentIndex]: {
                    ...currentItem,
                    ...updates
                }
            };
        });
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

    const handleTextInput = (text) => {
        if (!activeField || (hasChecked && isComplete)) return;

        setHistory(prev => {
            const currentItem = prev[currentIndex] || {};
            const prevHasChecked = currentItem.hasChecked;
            const prevEnteredTexts = currentItem.enteredTexts || {};

            const { category, part } = activeField;
            const currentFullText = prevEnteredTexts[category] || '';
            const parts = getParts(category, currentFullText);

            let newEnteredTexts = { ...prevEnteredTexts };
            let nextActiveField = activeField;

            // Superlative 'am ' handling
            if (category === 'superlativ' && currentAdj.superlativ.startsWith('am ')) {
                if (part === 'prefix') {
                    // Editing 'am' part
                    let newPrefix = (parts.prefix + text).toLowerCase();
                    if (newPrefix.length > 2) newPrefix = newPrefix.substring(0, 2);

                    const newFull = (newPrefix + (newPrefix.length === 2 ? ' ' : '') + parts.stem).trimStart();
                    newEnteredTexts[category] = newFull;

                    if (newPrefix === 'am') {
                        nextActiveField = { category, part: 'stem' };
                        newEnteredTexts[category] = 'am ' + parts.stem;
                    }
                } else {
                    const newStem = parts.stem + text;
                    newEnteredTexts[category] = (parts.prefix ? parts.prefix + ' ' : '') + newStem;
                }
            } else {
                // Normal Case
                newEnteredTexts[category] = currentFullText + text;
            }

            // If we were in checked state, clear it
            const newFeedback = prevHasChecked ? {} : currentItem.feedback;

            // Only update active field if it changed
            if (nextActiveField !== activeField) {
                setActiveField(nextActiveField);
            }

            return {
                ...prev,
                [currentIndex]: {
                    ...currentItem,
                    enteredTexts: newEnteredTexts,
                    hasChecked: false,
                    feedback: newFeedback
                }
            };
        });
    };

    const handleBackspace = () => {
        if (!activeField || (hasChecked && isComplete)) return;

        setHistory(prev => {
            const currentItem = prev[currentIndex] || {};
            const prevHasChecked = currentItem.hasChecked;
            const prevEnteredTexts = currentItem.enteredTexts || {};

            const { category, part } = activeField;
            const currentFullText = prevEnteredTexts[category] || '';
            const parts = getParts(category, currentFullText);

            let newEnteredTexts = { ...prevEnteredTexts };
            let nextActiveField = activeField;

            if (category === 'superlativ' && currentAdj.superlativ.startsWith('am ')) {
                if (part === 'prefix') {
                    if (parts.prefix.length > 0) {
                        const newPrefix = parts.prefix.slice(0, -1);
                        newEnteredTexts[category] = (newPrefix + (newPrefix.length > 0 ? ' ' : '') + parts.stem).trimStart();
                    }
                } else {
                    if (parts.stem.length > 0) {
                        const newStem = parts.stem.slice(0, -1);
                        newEnteredTexts[category] = (parts.prefix ? parts.prefix + ' ' : '') + newStem;
                    } else {
                        nextActiveField = { category, part: 'prefix' };
                    }
                }
            } else {
                if (currentFullText.length > 0) {
                    newEnteredTexts[category] = currentFullText.slice(0, -1);
                }
            }

            // Clear feedback if correcting
            const newFeedback = prevHasChecked ? {} : currentItem.feedback;

            if (nextActiveField !== activeField) {
                setActiveField(nextActiveField);
            }

            return {
                ...prev,
                [currentIndex]: {
                    ...currentItem,
                    enteredTexts: newEnteredTexts,
                    hasChecked: false,
                    feedback: newFeedback
                }
            };
        });
    };


    const handleNext = () => {
        if (currentIndex < adjItems.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setActiveField(null); // Reset active field
        }
    };

    const handleMainAction = () => {
        if (!hasChecked || !isComplete) {
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
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Keine {getTerm("Adjektive", settings)} gefunden</h2>
                    <p className="text-slate-600 mb-6">Bitte markiere zuerst einige {getTerm("Adjektive", settings)} im Text, um diese Übung zu starten.</p>
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

    // Hardware Keyboard Support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (hasChecked && isComplete) {
                if (e.key === 'Enter') {
                    handleNext();
                    e.preventDefault();
                }
                return;
            }

            // Navigation with Tab
            if (e.key === 'Tab') {
                e.preventDefault();
                // Logic to switch active field could go here
                return;
            }

            // Alpha-numeric check (including German umlauts)
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (/^[a-zA-ZäöüÄÖÜß ]$/.test(e.key)) {
                    handleTextInput(e.key);
                    setActiveKey(e.key);
                    setTimeout(() => setActiveKey(null), 150);
                }
            } else if (e.key === 'Backspace') {
                handleBackspace();
                setActiveKey('Backspace');
                setTimeout(() => setActiveKey(null), 150);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                handleMainAction(); // Check or Next
                setActiveKey('Enter');
                setTimeout(() => setActiveKey(null), 150);
                e.preventDefault();
            } else if (e.key === 'Shift') {
                setActiveKey('Shift');
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Shift') {
                setActiveKey(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [activeField, enteredTexts, hasChecked, isComplete]); // Add dependencies needed for logic


    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans select-none overflow-hidden safe-area-bottom">
            <ExerciseHeader
                title={`${getTerm("Adjektive", settings)} schreiben`}
                icon={Icons.Edit2}
                current={currentIndex + 1}
                total={adjItems.length}
                progressPercentage={((currentIndex) / adjItems.length) * 100}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                showSlider={true}
                sliderMin={24}
                sliderMax={42}
                customControls={
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            title={audioEnabled ? 'Audio an' : 'Audio aus'}
                        >
                            {audioEnabled ? <Icons.Volume2 size={20} /> : <Icons.VolumeX size={20} />}
                        </button>
                    </div>
                }
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col items-center justify-start gap-2">

                    <div className="w-full max-w-4xl bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                        <div className="flex flex-col gap-1 w-full px-2 text-left">
                            {ADJ_CATEGORIES.map((cat, idx) => {
                                const formValue = currentAdjForms[idx];
                                if (formValue === '-') return null;

                                const isShown = shownFormIndex === idx;
                                const isSuperlative = cat.key === 'superlativ';

                                // Determine content for 'am' prefix and stem based on view mode
                                let displayPrefix = '';
                                let displayStem = formValue;

                                // Current Input Values
                                const currentInput = enteredTexts[cat.key] || '';
                                const parts = getParts(cat.key, currentInput);


                                if (isSuperlative) {
                                    if (formValue.toLowerCase().startsWith('am ')) {
                                        displayPrefix = 'am';
                                        displayStem = formValue.substring(3);
                                    }
                                }

                                // Calculate if any form in this exercise has a prefix (usually superlative 'am ')
                                const hasAnyPrefix = currentAdj.superlativ && currentAdj.superlativ.toLowerCase().startsWith('am ');

                                return (
                                    <div key={cat.key} className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                        {/* Label Area */}
                                        <div className="w-56 shrink-0 mb-1 sm:mb-0">
                                            <span className="text-sm sm:text-base font-bold text-blue-700 uppercase tracking-widest leading-none">
                                                {cat.label}
                                            </span>
                                        </div>

                                        {/* Content Container (Prefix + Stem) */}
                                        <div
                                            className="flex-1 flex items-center gap-6 w-full sm:w-auto ml-2"
                                            style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}
                                        >
                                            {/* Prefix Column ('am') - Consistent width for alignment */}
                                            {hasAnyPrefix && (
                                                <div className="shrink-0 flex justify-end" style={{ width: '2.5em' }}>
                                                    {isSuperlative && formValue.toLowerCase().startsWith('am ') ? (
                                                        isShown ? (
                                                            <Word
                                                                word={displayPrefix}
                                                                settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                                forceNoMargin={true}
                                                                isReadingMode={true}
                                                                isHeadline={true}
                                                            />
                                                        ) : (
                                                            // Interactive 'am' Box
                                                            <div
                                                                onClick={() => {
                                                                    setActiveField({ category: cat.key, part: 'prefix' });
                                                                    if (hasChecked && !isComplete) {
                                                                        updateCurrentHistory({ hasChecked: false, feedback: {} });
                                                                    }
                                                                }}
                                                                className={`px-3 py-2 border-2 rounded-xl text-center font-medium transition-all bg-white min-h-[2.5em] flex items-center justify-center cursor-pointer box-border
                                                                    ${hasChecked
                                                                        ? (feedback[cat.key] === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                                                                        : (activeField?.category === cat.key && activeField?.part === 'prefix' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-blue-300')
                                                                    }
                                                                `}
                                                                style={{
                                                                    minWidth: '2.5em',
                                                                    fontSize: `${settings.fontSize}px`
                                                                }}
                                                            >
                                                                {parts.prefix}
                                                                {activeField?.category === cat.key && activeField?.part === 'prefix' && !hasChecked && (
                                                                    <span className="w-0.5 h-[1em] bg-blue-500 animate-pulse ml-0.5"></span>
                                                                )}
                                                            </div>
                                                        )
                                                    ) : (
                                                        // Spacer for non-prefix rows to maintain alignment
                                                        <div className="w-[2.5em]"></div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Stem Column */}
                                            <div className="flex-1 flex justify-start min-w-0">
                                                {isShown ? (
                                                    <Word
                                                        word={displayStem}
                                                        settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                        forceNoMargin={true}
                                                        isReadingMode={true}
                                                    />
                                                ) : (
                                                    // Interactive Stem Box
                                                    <div
                                                        onClick={() => {
                                                            setActiveField({ category: cat.key, part: 'stem' });
                                                            if (hasChecked && !isComplete) {
                                                                updateCurrentHistory({ hasChecked: false, feedback: {} });
                                                            }
                                                        }}
                                                        className={`pl-3 pr-4 py-2 border-2 rounded-xl text-left font-medium transition-all bg-white min-h-[2.5em] flex items-center w-full cursor-pointer overflow-hidden relative box-border
                                                            ${hasChecked
                                                                ? (feedback[cat.key] === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                                                                : (activeField?.category === cat.key && activeField?.part === 'stem' ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-300 hover:border-blue-300')
                                                            }
                                                        `}
                                                        style={{
                                                            fontSize: `${settings.fontSize}px`,
                                                            fontFamily: settings.fontFamily,
                                                        }}
                                                    >
                                                        <span className="flex items-center">
                                                            {parts.stem}
                                                            {activeField?.category === cat.key && activeField?.part === 'stem' && !hasChecked && (
                                                                <span className="w-0.5 h-[1em] bg-blue-500 animate-pulse ml-0.5"></span>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Audio Button */}
                                            {audioEnabled && (
                                                <div className="ml-2 self-center shrink-0">
                                                    <button
                                                        onClick={() => speak(formValue)}
                                                        className="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-sm"
                                                        title="Anhören"
                                                    >
                                                        <Icons.Volume2 size={20} />
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

                {/* Keyboard Area - Fixed Bottom */}
                <div className="w-full z-50">
                    <div className="w-full h-full flex flex-col justify-end">
                        <CustomKeyboard
                            onKeyPress={handleTextInput}
                            onBackspace={handleBackspace}
                            onEnter={handleMainAction}
                            settings={settings}
                            activeKey={activeKey}
                        />
                    </div>
                </div>
            </div>

            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message={`Alle ${getTerm("Adjektive", settings)} geschrieben!`}
            />
        </div>
    );
};

