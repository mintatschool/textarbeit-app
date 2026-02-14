import React, { useMemo } from 'react';
import { WordSortingView } from './WordSortingView';
import { analyzeTextLocalNouns } from '../data/nounDatabase';
import { findVerbLemma } from '../data/verbDatabase';
import { findAdjectiveLemma } from '../data/adjectiveDatabase';
import { getCorrectCasing } from '../utils/wordCasingUtils';

export const WordPartOfSpeechSortingView = ({
    text,
    processedWords,
    settings,
    setSettings,
    onClose,
    colorPalette,
    highlightedIndices = new Set(),
    hideYellowLetters = false,
    wordColors = {},
}) => {
    // Generate the columns and populated items based on the text and databases
    const columnsState = useMemo(() => {
        // Prepare the 3 columns (only Substantive, Verben, Adjektive)
        const cols = {
            noun: {
                id: 'noun',
                title: 'Substantive',
                color: 'blue',
                items: []
            },
            verb: {
                id: 'verb',
                title: 'Verben',
                color: 'red',
                items: []
            },
            adjective: {
                id: 'adjective',
                title: 'Adjektive',
                color: 'green',
                items: []
            }
        };

        const order = ['noun', 'verb', 'adjective'];

        const wordsToCategorize = processedWords;

        if (wordsToCategorize && wordsToCategorize.length > 0) {
            wordsToCategorize.forEach(w => {
                if (w.type !== 'word') return;

                const cleanWord = w.word.replace(/[.,/#!$%^&*;:{}=_`~()]/g, "").trim();
                if (!cleanWord) return;

                const isNoun = analyzeTextLocalNouns(cleanWord).length > 0;
                const isVerb = !!findVerbLemma(cleanWord);
                const isAdjective = !!findAdjectiveLemma(cleanWord);

                let targetCol = null;
                if (isNoun) targetCol = 'noun';
                else if (isVerb) targetCol = 'verb';
                else if (isAdjective) targetCol = 'adjective';

                if (targetCol) {
                    cols[targetCol].items.push({
                        id: `w_${w.index}`,
                        word: getCorrectCasing(w.word),
                        index: w.index,
                    });
                }
            });
        }

        return { cols, order };
    }, [processedWords]);

    return (
        <WordSortingView
            columnsState={columnsState}
            settings={settings}
            setSettings={setSettings}
            onClose={onClose}
            title="Wortarten sortieren"
            colorPalette={colorPalette}
            wordColors={wordColors}
            textCorrections={{}}
            highlightedIndices={highlightedIndices}
            hideYellowLetters={hideYellowLetters}
        />
    );
};
