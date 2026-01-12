import React, { useMemo } from 'react';
import { Icons } from './Icons';
import TwoPartPuzzleLayout from './TwoPartPuzzleLayout';
import { useTwoPartPuzzle } from '../hooks/useTwoPartPuzzle';
import { speak, hasAudio } from '../utils/speech';
import availableSyllables from '../utils/available_syllables.json';

// Arrow-style ModeIcon for Silbenbau (different from puzzle pieces)
const ArrowModeIcon = ({ mode, active }) => {
    const primaryColor = active ? '#3b82f6' : '#94a3b8';
    const strokeColor = active ? '#2563eb' : '#cbd5e1';
    const fillLeft = mode === 'left-filled' ? primaryColor : 'none';
    const fillRight = mode === 'right-filled' ? primaryColor : 'none';

    const ICON_ARROW_LEFT = "M 0,20 Q 0,0 20,0 H 120 L 150,75 L 120,150 H 20 Q 0,150 0,130 Z";
    const ICON_ARROW_RIGHT = "M 152,0 L 182,75 L 152,150 H 280 Q 300,150 300,130 V 20 Q 300,0 280,0 H 152 Z";

    return (
        <svg width="60" height="35" viewBox="0 0 300 150" className="overflow-visible transition-all duration-300">
            <path
                d={ICON_ARROW_LEFT}
                fill={fillLeft}
                stroke={strokeColor}
                strokeWidth="20"
                transform="scale(0.8)"
                className="transition-colors duration-300"
            />
            <path
                d={ICON_ARROW_RIGHT}
                fill={fillRight}
                stroke={strokeColor}
                strokeWidth="20"
                transform="scale(0.8) translate(10,0)"
                className="transition-colors duration-300"
            />
        </svg>
    );
};

export const SyllableCompositionView = ({ onClose, settings = {}, words = [], title, activeColor }) => {
    // Syllable Logic - filter valid syllables from marked words
    const allowedClusters = useMemo(() => new Set(settings.clusters || []), [settings.clusters]);

    const validItems = useMemo(() => {
        if (!availableSyllables) return [];

        let audioSet = new Set();
        try {
            const raw = (availableSyllables && Array.isArray(availableSyllables)
                ? availableSyllables
                : (availableSyllables?.default || []));
            if (Array.isArray(raw)) {
                audioSet = new Set(raw.map(s => (s && typeof s === 'string') ? s.toLowerCase().trim() : ''));
            }
        } catch (e) {
            console.warn("Syllable audio list error", e);
            return [];
        }

        const valid = [];
        const seen = new Set();

        // Extract syllables from words
        let candidateSyllables = [];
        if (words && Array.isArray(words)) {
            words.forEach(w => {
                if (w && Array.isArray(w.syllables)) {
                    w.syllables.forEach(s => {
                        if (typeof s === 'string') candidateSyllables.push(s);
                    });
                } else if (w && w.word) {
                    candidateSyllables.push(w.word);
                }
            });
        }

        // Filter loop
        candidateSyllables.forEach(syl => {
            if (!syl || typeof syl !== 'string') return;
            const cleanSyl = syl.toLowerCase().trim();
            if (cleanSyl.length < 2) return;
            if (seen.has(cleanSyl)) return;

            // Must have audio
            if (!hasAudio(cleanSyl)) return;

            // Must consist of (Letter/Cluster) + (Letter/Cluster)
            let foundSplit = null;
            for (let i = 1; i < cleanSyl.length; i++) {
                const partA = cleanSyl.substring(0, i);
                const partB = cleanSyl.substring(i);

                const isPartAValid = partA.length === 1 || allowedClusters.has(partA);
                const isPartBValid = partB.length === 1 || allowedClusters.has(partB);

                if (isPartAValid && isPartBValid) {
                    foundSplit = {
                        leftPart: partA,
                        rightPart: partB,
                        fullText: cleanSyl
                    };
                    break;
                }
            }

            if (foundSplit) {
                valid.push(foundSplit);
                seen.add(cleanSyl);
            }
        });

        console.log("SyllableCompositionView: Filtered syllables count:", valid.length);
        if (valid.length > 0) {
            console.log("SyllableCompositionView: valid items sample:", valid.slice(0, 3));
        }
        return valid;
    }, [words, allowedClusters]);

    // Use the shared hook
    const puzzleState = useTwoPartPuzzle({
        items: validItems,
        leftType: 'zigzag-left',
        rightType: 'zigzag-right',
        initialScale: 1.0,
        successDelay: 1000,
        manualAdvance: true
    });

    const handleSpeak = (item) => {
        if (item && item.fullText) {
            speak(item.fullText);
        }
    };

    return (
        <TwoPartPuzzleLayout
            {...puzzleState}
            onClose={onClose}
            title={title || "Silbenbau 1"}
            subtitle="Silbe bauen"
            settings={settings}
            leftType="zigzag-left"
            rightType="zigzag-right"
            overlap={30}
            icon={() => <img src={`${import.meta.env.BASE_URL}silbenbau1_logo.png`} className="w-auto h-6 object-contain" alt="Silbenbau 1" />}
            renderModeIcon={ArrowModeIcon}
            activeColor={activeColor}
            onSpeak={handleSpeak}
            emptyMessage="Keine passenden Silben gefunden."
            emptyHint={<>
                Passende Wörter markieren!
                <br />
                <span className="block mt-1 text-sm font-normal text-slate-400">Für diese Übung werden sehr häufige und einfache Silben benötigt.</span>
            </>}
            allCompleteMessage="Alle Silben gebaut!"
            stageCompleteMessage="Level geschafft!"
            hideSpeakerToggle={true}
            manualAdvance={true}
        />
    );
};
