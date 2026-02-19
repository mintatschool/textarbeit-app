import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';

import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { Word } from './Word';
import { speak } from '../utils/speech';
import { analyzeTextLocalNouns } from '../data/nounDatabase';
import { getTerm } from '../utils/terminology';
import { CustomKeyboard } from './CustomKeyboard';

const NOUN_CATEGORIES = [
    { key: 'plural', label: 'Mehrzahl' },
    { key: 'singular', label: 'Einzahl' }
];

export const NounWritingView = ({ words, settings, setSettings, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showReward, setShowReward] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Active Field State: { part: 'article'|'singular' }
    const [activeField, setActiveField] = useState(null);
    const [activeKey, setActiveKey] = useState(null); // For visual feedback on keyboard

    // Track state for ALL nouns to support navigation
    // { index: { enteredTexts, feedback, hasChecked, isComplete } }
    const [history, setHistory] = useState({});

    const nounItems = useMemo(() => {
        const uniqueNouns = new Map();

        // Extract all words from highlighted areas
        const allText = words.map(w => w.word).join(' ');
        const foundNouns = analyzeTextLocalNouns(allText);

        foundNouns.forEach(noun => {
            if (!uniqueNouns.has(noun.lemma) && noun.plural !== '-') {
                uniqueNouns.set(noun.lemma, noun);
            }
        });

        return Array.from(uniqueNouns.values());
    }, [words]);

    const currentNoun = nounItems[currentIndex];

    // Initialize state for current noun if it doesn't exist
    useEffect(() => {
        if (!currentNoun || history[currentIndex]) return;

        setHistory(prev => ({
            ...prev,
            [currentIndex]: {
                enteredTexts: { article: '', singular: '' },
                feedback: {},
                hasChecked: false,
                isComplete: false
            }
        }));
    }, [currentIndex, currentNoun, history]);

    const currentState = history[currentIndex] || {
        enteredTexts: { article: '', singular: '' },
        feedback: {},
        hasChecked: false,
        isComplete: false
    };

    const { enteredTexts, feedback, hasChecked, isComplete } = currentState;

    // Set initial active field when a new word is loaded
    useEffect(() => {
        if (!activeField && !isComplete && !hasChecked) {
            setActiveField({ part: 'article' });
        }
    }, [currentIndex, isComplete, hasChecked, activeField]);

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

    const handleTextInput = (text) => {
        if (!activeField || (hasChecked && isComplete)) return;

        setHistory(prev => {
            const currentItem = prev[currentIndex] || {};
            const prevHasChecked = currentItem.hasChecked;
            const prevEnteredTexts = currentItem.enteredTexts || { article: '', singular: '' };

            const { part } = activeField;
            const currentVal = prevEnteredTexts[part] || '';

            let newEnteredTexts = { ...prevEnteredTexts };
            let nextActiveField = activeField;

            // Simple char limit for article
            if (part === 'article' && currentVal.length >= 4) return prev;

            newEnteredTexts[part] = currentVal + text;

            // If we just finished the article (e.g. "der", "die", "das"), we could auto-jump,
            // but for nouns it's better to let the user decide or use Enter.

            // If we were in checked state, clear it
            const newFeedback = prevHasChecked ? {} : currentItem.feedback;

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
            const prevEnteredTexts = currentItem.enteredTexts || { article: '', singular: '' };

            const { part } = activeField;
            const currentVal = prevEnteredTexts[part] || '';

            let newEnteredTexts = { ...prevEnteredTexts };
            let nextActiveField = activeField;

            if (currentVal.length > 0) {
                newEnteredTexts[part] = currentVal.slice(0, -1);
            } else if (part === 'singular') {
                // If singular is empty and we hit backspace, jump to article
                nextActiveField = { part: 'article' };
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
        if (currentIndex < nounItems.length - 1) {
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
                setActiveField(prev => prev?.part === 'article' ? { part: 'singular' } : { part: 'article' });
                return;
            }

            // Alpha-numeric check (including German umlauts and Space)
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
    }, [activeField, enteredTexts, hasChecked, isComplete]);

    const allFormsFilled = useMemo(() => {
        if (!currentNoun) return false;
        return (enteredTexts.article || '').trim().length > 0 && (enteredTexts.singular || '').trim().length > 0;
    }, [enteredTexts, currentNoun]);

    const checkAnswers = () => {
        if (!currentNoun) return;
        const newFeedback = {};

        const enteredArticle = (enteredTexts.article || '').trim().toLowerCase();
        const targetArticle = currentNoun.article.toLowerCase();

        const enteredSingular = (enteredTexts.singular || '').trim().toLowerCase();
        const targetSingular = currentNoun.lemma.toLowerCase();

        let correctCount = 0;

        if (enteredArticle === targetArticle) {
            newFeedback['article'] = 'correct';
            correctCount++;
        } else {
            newFeedback['article'] = 'incorrect';
        }

        if (enteredSingular === targetSingular) {
            newFeedback['singular'] = 'correct';
            correctCount++;
        } else {
            newFeedback['singular'] = 'incorrect';
        }

        const allCorrect = correctCount === 2;

        updateCurrentHistory({
            feedback: newFeedback,
            hasChecked: true,
            isComplete: allCorrect
        });

        if (allCorrect && currentIndex === nounItems.length - 1) {
            setTimeout(() => setShowReward(true), 500);
        }
    };

    if (nounItems.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
                    <Icons.AlertTriangle size={64} className="mx-auto text-amber-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Keine passenden {getTerm("Substantive", settings)} gefunden</h2>
                    <p className="text-slate-600 mb-6">Bitte markiere zuerst einige {getTerm("Substantive", settings)} mit Pluralformen im Text.</p>
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">Zurück zum Text</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans select-none overflow-hidden safe-area-bottom">
            <ExerciseHeader
                title={`${getTerm("Substantive", settings)} schreiben`}
                icon={Icons.Edit2}
                current={currentIndex + 1}
                total={nounItems.length}
                progressPercentage={((currentIndex) / nounItems.length) * 100}
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
                <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center justify-start gap-4">

                    <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                        <div className="flex flex-col gap-6 w-full px-2 text-left">

                            {/* PLURAL ROW - REFERENCE */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-6 border-b border-slate-50 pb-4">
                                <div className="w-56 shrink-0 mb-1 sm:mb-0">
                                    <span className="text-sm sm:text-base font-bold text-blue-700 uppercase tracking-widest leading-none">
                                        Mehrzahl
                                    </span>
                                </div>
                                <div className="flex-1 flex items-center gap-6 w-full sm:w-auto ml-2" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>
                                    <div className="shrink-0 flex justify-end" style={{ width: '4em' }}>
                                        <div className="px-3 py-2 border-2 border-transparent min-h-[2.5em] flex items-center justify-center">
                                            <Word
                                                word={currentNoun.pluralArticle || 'die'}
                                                settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                forceNoMargin={true}
                                                isReadingMode={true}
                                                isHeadline={true}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 flex justify-start">
                                        <div className="pl-3 pr-4 py-2 border-2 border-transparent min-h-[2.5em] flex items-center">
                                            <Word
                                                word={currentNoun.plural}
                                                settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                forceNoMargin={true}
                                                isReadingMode={true}
                                            />
                                        </div>
                                    </div>

                                    {audioEnabled && (
                                        <div className="ml-2 self-center shrink-0">
                                            <button
                                                onClick={() => speak(`${currentNoun.pluralArticle || 'die'} ${currentNoun.plural}`)}
                                                className="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-sm"
                                                title="Anhören"
                                            >
                                                <Icons.Volume2 size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SINGULAR ROW - INPUTS */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-6 pt-2">
                                <div className="w-56 shrink-0 mb-1 sm:mb-0">
                                    <span className="text-sm sm:text-base font-bold text-blue-700 uppercase tracking-widest leading-none">
                                        Einzahl
                                    </span>
                                </div>
                                <div className="flex-1 flex items-center gap-6 w-full sm:w-auto ml-2" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>

                                    {/* Article Interactive Box */}
                                    <div className="shrink-0 flex justify-end" style={{ width: '4em' }}>
                                        <div
                                            onClick={() => {
                                                setActiveField({ part: 'article' });
                                                if (hasChecked && !isComplete) {
                                                    updateCurrentHistory({ hasChecked: false, feedback: {} });
                                                }
                                            }}
                                            className={`px-3 py-2 border-2 rounded-xl text-center font-medium transition-all bg-white min-h-[2.5em] flex items-center justify-center cursor-pointer box-border
                                                ${hasChecked
                                                    ? (feedback.article === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                                                    : (activeField?.part === 'article' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-blue-300')
                                                }
                                            `}
                                            style={{
                                                minWidth: '4em',
                                                fontSize: `${settings.fontSize}px`
                                            }}
                                        >
                                            {enteredTexts.article}
                                            {activeField?.part === 'article' && !hasChecked && (
                                                <span className="w-0.5 h-[1em] bg-blue-500 animate-pulse ml-0.5"></span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Noun Interactive Box */}
                                    <div className="flex-1 flex justify-start min-w-0">
                                        <div
                                            onClick={() => {
                                                setActiveField({ part: 'singular' });
                                                if (hasChecked && !isComplete) {
                                                    updateCurrentHistory({ hasChecked: false, feedback: {} });
                                                }
                                            }}
                                            className={`pl-3 pr-4 py-2 border-2 rounded-xl text-left font-medium transition-all bg-white min-h-[2.5em] flex items-center w-full cursor-pointer overflow-hidden relative box-border
                                                ${hasChecked
                                                    ? (feedback.singular === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                                                    : (activeField?.part === 'singular' ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-300 hover:border-blue-300')
                                                }
                                            `}
                                            style={{
                                                fontSize: `${settings.fontSize}px`,
                                                fontFamily: settings.fontFamily,
                                                minWidth: '200px'
                                            }}
                                        >
                                            <span className="flex items-center">
                                                {enteredTexts.singular}
                                                {activeField?.part === 'singular' && !hasChecked && (
                                                    <span className="w-0.5 h-[1em] bg-blue-500 animate-pulse ml-0.5"></span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {audioEnabled && (
                                        <div className="ml-2 self-center shrink-0">
                                            <button
                                                onClick={() => speak(`${currentNoun.article} ${currentNoun.lemma}`)}
                                                className="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-sm"
                                                title="Anhören"
                                            >
                                                <Icons.Volume2 size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                message={`Alle ${getTerm("Substantive", settings)} geschrieben!`}
            />
        </div>
    );
};
