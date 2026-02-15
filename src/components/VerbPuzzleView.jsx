import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';

import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { Tense, VERB_PRONOUNS, getVerbPuzzleParts, getInfinitiveStem } from '../utils/verbUtils';
import { getLocalConjugation, findVerbLemma } from '../data/verbDatabase';
import { Word } from './Word';
import { speak } from '../utils/speech';
import { getTerm } from '../utils/terminology';
import { polyfill } from 'mobile-drag-drop';
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour';

polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride });

export const VerbPuzzleView = ({ words, settings, setSettings, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentTense, setCurrentTense] = useState('Präsens');
    const [placedPieces, setPlacedPieces] = useState({}); // { pronounKey: pieceId }
    const [availablePieces, setAvailablePieces] = useState([]);
    const [piecesRegistry, setPiecesRegistry] = useState({});
    const [feedback, setFeedback] = useState({});
    const [hasChecked, setHasChecked] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPiece, setSelectedPiece] = useState(null);

    const [audioEnabled, setAudioEnabled] = useState(false); // Default off
    const [isTenseMenuOpen, setIsTenseMenuOpen] = useState(false);
    const tenseMenuRef = useRef(null);
    const dragItemRef = useRef(null);

    const verbItems = useMemo(() => {
        const uniqueVerbs = new Map();
        words.forEach(w => {
            // 1. Check if explicitly tagged (e.g. from dictionary or manual markings)
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

            // 2. Try to find lemma in DB (even if not explicitly tagged)
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

    // Calculate max target length for consistent gap widths
    const maxTargetLength = useMemo(() => {
        if (!conjugationData) return 0;
        let max = 0;
        VERB_PRONOUNS.forEach(({ key: pronoun }) => {
            const conjugated = conjugationData[pronoun];
            if (!conjugated) return;
            const parts = getVerbPuzzleParts(conjugated, currentTense);
            if (parts.target) {
                max = Math.max(max, parts.target.length);
            }
        });
        return Math.max(max, 2); // Minimum 2 for sanity
    }, [conjugationData, currentTense]);

    // Clamp font size to the new maximum allowed (72px)
    useEffect(() => {
        if (settings.fontSize > 72) {
            setSettings(prev => ({ ...prev, fontSize: 72 }));
        }
    }, [settings.fontSize, setSettings]);

    useEffect(() => {
        if (!conjugationData) return;

        const pieces = [];
        const registry = {};

        VERB_PRONOUNS.forEach(({ key: pronoun }) => {
            const conjugated = conjugationData[pronoun];
            if (!conjugated) return;

            const parts = getVerbPuzzleParts(conjugated, currentTense);

            // Skip if no target part (e.g. "er ging")
            if (!parts.target) return;

            const piece = {
                id: `${pronoun}_${currentIndex}_${currentTense}`,
                text: parts.target,
                targetKey: pronoun,
                conjugated: conjugated
            };
            pieces.push(piece);
            registry[piece.id] = piece;
        });

        // Shuffle available pieces
        const shuffled = [...pieces].sort(() => Math.random() - 0.5);

        setPiecesRegistry(registry);
        setAvailablePieces(shuffled);
        setPlacedPieces({});
        setFeedback({});
        setHasChecked(false);
        setIsComplete(false);
        setSelectedPiece(null);
        setIsTenseMenuOpen(false);
    }, [conjugationData, currentIndex, currentTense]);

    // Click outside listener for tense menu
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

    // Check if all forms are filled (not validated)
    const allFormsFilled = useMemo(() => {
        if (!conjugationData) return false;

        const currentPieces = Object.keys(placedPieces).length;
        const requiredPieces = VERB_PRONOUNS.filter(({ key: pronoun }) => {
            const conjugated = conjugationData[pronoun];
            if (!conjugated) return false;
            const parts = getVerbPuzzleParts(conjugated, currentTense);
            return !!parts.target;
        }).length;

        return currentPieces === requiredPieces && requiredPieces > 0;
    }, [placedPieces, conjugationData, currentTense]);

    // Reset feedback when pieces change
    useEffect(() => {
        if (hasChecked) {
            setHasChecked(false);
            setFeedback({});
            setIsComplete(false);
        }
    }, [placedPieces]);

    const checkAnswers = () => {
        if (!conjugationData) return;
        const newFeedback = {};
        let allCorrect = true;

        VERB_PRONOUNS.forEach(({ key: pronoun }) => {
            // Check if this pronoun even expects a piece
            const conjugated = conjugationData[pronoun];
            if (!conjugated) return;
            const parts = getVerbPuzzleParts(conjugated, currentTense);

            // If no target part, it's correct by default (nothing to place)
            if (!parts.target) {
                newFeedback[pronoun] = 'correct';
                return;
            }

            const placedId = placedPieces[pronoun];
            if (!placedId) {
                allCorrect = false;
                return;
            }
            const piece = piecesRegistry[placedId];
            if (piece && piece.text === parts.target) {
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

    const handleDragStart = (e, piece, source, sourceKey = null) => {
        // Hide feedback if dragging starts to allow re-attempt
        if (hasChecked && !isComplete) {
            setHasChecked(false);
            setFeedback({});
        }

        setIsDragging(true);
        dragItemRef.current = { piece, source, sourceKey };
        e.dataTransfer.setData('text/plain', piece.id);
        setTimeout(() => e.target.classList.add('opacity-40'), 0);
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        if (e.target.classList) e.target.classList.remove('opacity-40');
        dragItemRef.current = null;
    };

    const handleDropOnTarget = (e, targetKey) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData) return;

        // Reset check state on modification
        if (hasChecked && !isComplete) {
            setHasChecked(false);
            setFeedback({});
        }

        const { piece, source, sourceKey } = dragData;
        const existingPieceId = placedPieces[targetKey];

        setPlacedPieces(prev => {
            const next = { ...prev };
            if (source === 'target' && sourceKey) {
                delete next[sourceKey];
            }
            next[targetKey] = piece.id;
            return next;
        });

        setAvailablePieces(prev => {
            let next = prev;
            if (source === 'pool') {
                next = next.filter(p => p.id !== piece.id);
            }
            if (existingPieceId) {
                const existingPiece = piecesRegistry[existingPieceId];
                next = [...next, existingPiece];
            }
            return next;
        });
    };

    const handleReturnToPool = (e) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData || dragData.source !== 'target') return;

        // Reset check state
        if (hasChecked && !isComplete) {
            setHasChecked(false);
            setFeedback({});
        }

        const { piece, sourceKey } = dragData;

        setPlacedPieces(prev => {
            const next = { ...prev };
            delete next[sourceKey];
            return next;
        });

        setAvailablePieces(prev => [...prev, piece]);
    };

    const handlePieceClick = (piece) => {
        if (selectedPiece && selectedPiece.id === piece.id) {
            setSelectedPiece(null);
        } else {
            setSelectedPiece(piece);
        }
    };

    const handleGapClick = (targetKey) => {
        // Reset check state on interaction
        if (hasChecked && !isComplete) {
            setHasChecked(false);
            setFeedback({});
        }

        const existingPieceId = placedPieces[targetKey];

        // Case 1: Gap is filled -> Return to pool
        if (existingPieceId) {
            const piece = piecesRegistry[existingPieceId];
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[targetKey];
                return next;
            });
            setAvailablePieces(prev => [...prev, piece]);
            return;
        }

        // Case 2: Gap is empty AND piece is selected -> Place piece
        if (selectedPiece) {
            setPlacedPieces(prev => ({ ...prev, [targetKey]: selectedPiece.id }));
            setAvailablePieces(prev => prev.filter(p => p.id !== selectedPiece.id));
            setSelectedPiece(null);
        }
    };

    const handleMainAction = () => {
        if (!hasChecked) {
            // First click: Check answers
            checkAnswers();
        } else if (isComplete) {
            // Already complete and checked -> Go next
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
                title={`${getTerm("Verben", settings)} puzzlen`}
                icon={Icons.VerbPuzzle}
                current={currentIndex + 1}
                total={verbItems.length}
                progressPercentage={((currentIndex + 1) / verbItems.length) * 100}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                showSlider={true}
                sliderMin={24}
                sliderMax={72}
                customControls={
                    <div className="flex items-center gap-6">
                        {/* Custom Tense Selector */}
                        <div className="relative" ref={tenseMenuRef}>
                            <div className="bg-slate-100 border border-slate-200 rounded-xl flex items-center overflow-hidden">
                                <div className="px-4 py-2 font-bold text-lg text-slate-600 border-r border-slate-200">
                                    {currentTense}
                                </div>
                                <button
                                    onClick={() => setIsTenseMenuOpen(!isTenseMenuOpen)}
                                    className={`px-3 py-2 flex items-center justify-center transition-all hover:bg-slate-200 text-blue-600 ${isTenseMenuOpen ? 'bg-slate-200' : ''}`}
                                    title="Zeitform wählen"
                                >
                                    <Icons.ChevronsUpDown size={20} />
                                </button>
                            </div>

                            {isTenseMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
                                    {Object.values(Tense).map(tense => (
                                        <button
                                            key={tense}
                                            onClick={() => {
                                                setCurrentTense(tense);
                                                setIsTenseMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between group ${currentTense === tense ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600 font-medium'}`}
                                        >
                                            {tense}
                                            {currentTense === tense && <Icons.Check size={16} className="text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Audio Toggle */}
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

            <div className="flex-1 flex overflow-hidden">
                {/* Main Exercise Area */}
                <div
                    className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start gap-8"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleReturnToPool}
                >
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-[0.5em] w-full px-4 text-left">
                            {['ich', 'wir', 'du', 'ihr', 'er_sie_es', 'sie_Sie'].map((key) => {
                                const pronounObj = VERB_PRONOUNS.find(p => p.key === key);
                                const label = pronounObj ? pronounObj.label : key;
                                const conjugated = conjugationData ? conjugationData[key] : '';
                                const parts = conjugationData ? getVerbPuzzleParts(conjugated, currentTense) : { fixedBefore: '', target: '', fixedAfter: '' };
                                const placedPieceId = placedPieces[key];
                                const piece = piecesRegistry[placedPieceId];
                                const isCorrect = hasChecked && feedback[key] === 'correct';
                                const isIncorrect = hasChecked && feedback[key] === 'incorrect';

                                return (
                                    <div key={key} className="flex items-baseline gap-4 min-h-[1.5em]" style={{ lineHeight: settings.lineHeight }}>
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
                                                {parts.fixedBefore && (
                                                    <Word
                                                        word={parts.fixedBefore}
                                                        settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                        forceNoMargin={true}
                                                        isReadingMode={true}
                                                    />
                                                )}

                                                {/* Only show gap if there is a target part to fill */}
                                                {parts.target && (
                                                    <div
                                                        className={`px-2 py-2 border-2 rounded-xl text-left font-bold transition-all mx-1 cursor-pointer
                                                                ${hasChecked && placedPieceId
                                                                ? (isCorrect
                                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                                    : 'border-red-500 bg-red-50 text-red-700')
                                                                : (placedPieceId
                                                                    ? 'border-slate-300 bg-white text-blue-900'
                                                                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100')
                                                            }
                                                                ${selectedPiece && !placedPieceId ? 'ring-4 ring-blue-100 ring-offset-2 animate-pulse border-blue-500' : ''}
                                                            `}
                                                        style={{
                                                            minWidth: '2em',
                                                            width: `${maxTargetLength}ch`
                                                        }}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => handleDropOnTarget(e, key)}
                                                        onClick={() => handleGapClick(key)}
                                                    >
                                                        {piece ? (
                                                            <div
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, piece, 'target', key)}
                                                                onDragEnd={handleDragEnd}
                                                                className={`font-bold transition-all text-left animate-[popIn_0.3s_ease-out] select-none flex items-center justify-start bg-transparent`}
                                                            >
                                                                {piece.text}
                                                            </div>
                                                        ) : (
                                                            <span className="opacity-0">{parts.target || '...'}</span>
                                                        )}
                                                    </div>
                                                )}

                                                {parts.fixedAfter && (
                                                    <Word
                                                        word={parts.fixedAfter}
                                                        settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                                        forceNoMargin={true}
                                                        isReadingMode={true}
                                                    />
                                                )}
                                            </div>


                                        </div>
                                        {/* Speaker Button - Only if audio is enabled */}
                                        {audioEnabled && (
                                            <div className="pl-4">
                                                <button
                                                    onClick={() => {
                                                        const textToSpeak = `${label} ${parts.fixedBefore || ''}${parts.target || ''}${parts.fixedAfter ? ' ' + parts.fixedAfter : ''}`;
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

                    <div className="w-full flex justify-end mt-4 items-center px-4">

                        <div className="flex-1 flex justify-end">
                            {allFormsFilled && (
                                <button
                                    onClick={handleMainAction}
                                    className={`px-8 py-4 rounded-2xl font-bold shadow-xl text-xl hover:scale-105 transition-all flex items-center gap-2 ring-4 ring-white/50 whitespace-nowrap
                                        ${isComplete
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }
                                    `}
                                >
                                    {isComplete ? (
                                        <>Weiter <Icons.ArrowRight size={30} /></>
                                    ) : (
                                        <>Prüfen <Icons.Check size={30} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div >

                {/* Piece Pool (Speicher) */}
                <div
                    className="w-60 h-full bg-slate-200/50 border-l border-slate-300 shadow-inner flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleReturnToPool}
                >
                    <div className="p-4 bg-white/80 border-b border-slate-200 shadow-sm flex items-center justify-between">
                        <span className="font-bold text-slate-600 text-xs tracking-wider uppercase">Speicher</span>
                        <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-xs">{availablePieces.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-wrap content-start justify-center gap-3">
                        {availablePieces.map(piece => (
                            <div
                                key={piece.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, piece, 'pool')}
                                onDragEnd={handleDragEnd}
                                onClick={() => handlePieceClick(piece)}
                                // Match GapWordsView "consonants" style: border-2, rounded-2xl, p-3, text-blue-900 etc.
                                className={`border-2 text-blue-900 font-bold rounded-2xl transition-all flex items-center justify-center p-3 cursor-grab active:cursor-grabbing hover:scale-110 bg-white border-slate-300 hover:translate-y-[2px] shadow-sm
                                        ${selectedPiece && selectedPiece.id === piece.id ? 'ring-4 ring-blue-500 border-blue-500 !scale-110 z-10' : 'hover:border-blue-300'}
                                    `}
                                style={{ fontSize: `${Math.max(20, settings.fontSize * 0.8)}px`, fontFamily: settings.fontFamily, minWidth: '3.5rem' }}
                            >
                                <Word
                                    word={piece.text}
                                    settings={{ ...settings, visualType: 'none', displayTrigger: 'never' }}
                                    forceNoMargin={true}
                                    isReadingMode={true}
                                />
                            </div>
                        ))}
                    </div>
                </div >
            </div >

            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message={`Alle ${getTerm("Verben", settings)} gemeistert! Fantastisch!`}
            />
        </div >
    );
};
