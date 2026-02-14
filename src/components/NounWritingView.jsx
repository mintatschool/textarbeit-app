import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { Volume2, VolumeX } from 'lucide-react';
import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { speak } from '../utils/speech';
import { analyzeTextLocalNouns } from '../data/nounDatabase';

const NOUN_CATEGORIES = [
    { key: 'plural', label: 'Mehrzahl' },
    { key: 'singular', label: 'Einzahl' }
];

export const NounWritingView = ({ words, settings, setSettings, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const [showReward, setShowReward] = useState(false);

    const articleInputRef = React.useRef(null);
    const singularInputRef = React.useRef(null);
    const [audioEnabled, setAudioEnabled] = useState(false);

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

    const updateCurrentHistory = (updates) => {
        setHistory(prev => ({
            ...prev,
            [currentIndex]: {
                ...currentState,
                ...updates
            }
        }));
    };



    useEffect(() => {
        if (settings.fontSize > 56) {
            setSettings(prev => ({ ...prev, fontSize: 56 }));
        }
    }, [settings.fontSize, setSettings]);

    const handleInputChange = (field, value) => {
        const newEnteredTexts = { ...enteredTexts, [field]: value };
        if (hasChecked && !isComplete) {
            updateCurrentHistory({ enteredTexts: newEnteredTexts, hasChecked: false, feedback: {} });
        } else {
            updateCurrentHistory({ enteredTexts: newEnteredTexts });
        }
    };

    const handleNext = () => {
        if (currentIndex < nounItems.length - 1) {
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
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Keine passenden Substantive gefunden</h2>
                    <p className="text-slate-600 mb-6">Bitte markiere zuerst einige Substantive mit Pluralformen im Text.</p>
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">Zurück zum Text</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans select-none overflow-hidden">
            <ExerciseHeader
                title="Substantive schreiben"
                icon={Icons.Edit}
                current={currentIndex + 1}
                total={nounItems.length}
                progressPercentage={((currentIndex + 1) / nounItems.length) * 100}
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
                    <div className="w-fit min-w-[60%] bg-white p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                        <div className="flex flex-col gap-10 w-full px-4 text-left">

                            {/* PLURAL ROW - REFERENCE */}
                            <div className="flex items-center gap-12">
                                <div className="w-48 shrink-0">
                                    <span className="text-lg font-bold text-blue-700 uppercase tracking-widest leading-none">
                                        Mehrzahl
                                    </span>
                                </div>
                                <div className="flex-1 flex items-center gap-4" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>
                                    {/* Plural Articles/Nouns are shown as read-only reference */}
                                    <div className="px-4 py-2 border-2 border-transparent text-slate-700 font-bold min-h-[3rem] flex items-center justify-start bg-blue-50 rounded-xl text-left" style={{ width: '4em', minWidth: '120px' }}>
                                        {currentNoun.pluralArticle || 'die'}
                                    </div>
                                    <div className="px-4 py-2 border-2 border-transparent text-slate-700 font-bold min-h-[3rem] flex items-center justify-start bg-blue-50 rounded-xl text-left">
                                        {currentNoun.plural}
                                    </div>

                                    {audioEnabled && (
                                        <button
                                            onClick={() => speak(`${currentNoun.pluralArticle || 'die'} ${currentNoun.plural}`)}
                                            className="ml-4 w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-sm"
                                        >
                                            <Volume2 size={24} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* SINGULAR ROW - INPUTS */}
                            <div className="flex items-center gap-12">
                                <div className="w-48 shrink-0">
                                    <span className="text-lg font-bold text-blue-700 uppercase tracking-widest leading-none">
                                        Einzahl
                                    </span>
                                </div>
                                <div className="flex-1 flex items-center gap-4" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>

                                    {/* Article Input */}
                                    <input
                                        ref={articleInputRef}
                                        type="text"
                                        value={enteredTexts.article || ''}
                                        onChange={(e) => handleInputChange('article', e.target.value)}
                                        className={`px-4 py-2 border-2 rounded-xl text-left font-bold outline-none transition-all placeholder:font-normal placeholder:text-slate-300
                                            ${hasChecked
                                                ? (feedback.article === 'correct'
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-red-500 bg-red-50 text-red-700')
                                                : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-blue-900 bg-white'
                                            }
                                        `}
                                        style={{ width: '4em', minWidth: '120px' }}
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="none"
                                        spellCheck="false"
                                    />

                                    {/* Noun Input */}
                                    <input
                                        ref={singularInputRef}
                                        type="text"
                                        value={enteredTexts.singular || ''}
                                        onChange={(e) => handleInputChange('singular', e.target.value)}
                                        className={`px-4 py-2 border-2 rounded-xl text-left font-bold outline-none transition-all placeholder:font-normal placeholder:text-slate-300
                                            ${hasChecked
                                                ? (feedback.singular === 'correct'
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-red-500 bg-red-50 text-red-700')
                                                : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-blue-900 bg-white'
                                            }
                                        `}
                                        style={{ minWidth: '200px', width: `${Math.max((currentNoun.lemma || '').length, 10)}ch` }}
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="none"
                                        spellCheck="false"
                                    />

                                    {audioEnabled && (
                                        <button
                                            onClick={() => speak(`${currentNoun.article} ${currentNoun.lemma}`)}
                                            className="ml-4 w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-sm"
                                        >
                                            <Volume2 size={24} />
                                        </button>
                                    )}
                                </div>
                            </div>

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
                message="Alle Substantive gemeistert! Prima!"
            />
        </div>
    );
};
