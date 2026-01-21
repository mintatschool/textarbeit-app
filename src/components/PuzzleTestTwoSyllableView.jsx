import React, { useMemo } from 'react';
import { Icons } from './Icons';
import TwoPartPuzzleLayout from './TwoPartPuzzleLayout';
import { useTwoPartPuzzle } from '../hooks/useTwoPartPuzzle';
import { speak } from '../utils/speech';

// Puzzle-style ModeIcon (with nose/hole)
const PuzzleModeIcon = ({ mode, active }) => {
    const primaryColor = active ? '#3b82f6' : '#94a3b8';
    const strokeColor = active ? '#2563eb' : '#cbd5e1';
    const fillLeft = mode === 'left-filled' ? primaryColor : 'none';
    const fillRight = mode === 'right-filled' ? primaryColor : 'none';

    const LARGE_PUZZLE_LEFT = "M 0,20 Q 0,0 20,0 H 120 Q 140,0 140,20 V 45 C 190,30 190,120 140,105 V 130 Q 140,150 120,150 H 20 Q 0,150 0,130 Z";
    const LARGE_PUZZLE_RIGHT = "M 30,20 Q 30,0 50,0 H 200 Q 220,0 220,20 V 130 Q 220,150 200,150 H 50 Q 30,150 30,130 V 105 C 80,120 80,30 30,45 Z";

    return (
        <svg width="60" height="35" viewBox="0 0 420 180" className="overflow-visible transition-all duration-300">
            <path
                d={LARGE_PUZZLE_LEFT}
                fill={fillLeft}
                stroke={strokeColor}
                strokeWidth="24"
                className="transition-colors duration-300"
            />
            <path
                d={LARGE_PUZZLE_RIGHT}
                fill={fillRight}
                stroke={strokeColor}
                strokeWidth="24"
                transform="translate(140, 0)"
                className="transition-colors duration-300"
            />
        </svg>
    );
};

// Custom Icon Component for the PNG
const CustomIcon = (props) => (
    <div className={`${props.className} flex items-center justify-center`}>
        <Icons.Silbenpuzzle1 size={32} className="text-blue-600" />
    </div>
);

export const PuzzleTestTwoSyllableView = ({ words, settings, onClose, title, activeColor }) => {
    // Filter words with exactly 2 syllables and convert to unified format
    const validItems = useMemo(() => {
        if (!words || words.length === 0) return [];

        const filtered = words.filter(w =>
            w.syllables &&
            w.syllables.length === 2 &&
            w.syllables.every(s => s && typeof s === 'string')
        );

        return filtered.map(w => ({
            leftPart: w.syllables[0],
            rightPart: w.syllables[1],
            fullText: w.syllables.join(''),
            word: w.word // Keep original word for speech
        }));
    }, [words]);

    // Use the shared hook
    const puzzleState = useTwoPartPuzzle({
        items: validItems,
        leftType: 'left',
        rightType: 'right',
        initialScale: settings.pieceScale || 1.0,
        successDelay: 1000,
        manualAdvance: true
    });

    const handleSpeak = (item) => {
        if (item && (item.word || item.fullText)) {
            speak(item.word || item.fullText);
        }
    };

    return (
        <TwoPartPuzzleLayout
            {...puzzleState}
            onClose={onClose}
            title={title || "Silbenpuzzle 1"}
            subtitle="2 Silben"
            settings={settings}
            leftType="left"
            rightType="right"
            overlap={25}
            icon={CustomIcon}
            renderModeIcon={PuzzleModeIcon}
            activeColor={activeColor}
            onSpeak={handleSpeak}
            emptyMessage="Keine passenden Wörter gefunden."
            emptyHint="Wörter mit zwei Silben markieren."
            allCompleteMessage="Alle Wörter geschafft!"
            stageCompleteMessage="Level geschafft!"
            hideSpeakerToggle={true}
            manualAdvance={true}
            skipStageConfirmation={true}
            hideStageFeedback={true}
            maxWordsPerStage={validItems.length}
        />
    );
};
