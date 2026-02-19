import React, { useMemo } from 'react';
import { WordSortingView } from './WordSortingView';
import { analyzeTextLocalNouns } from '../data/nounDatabase';
import { findVerbLemma } from '../data/verbDatabase';
import { findAdjectiveLemma } from '../data/adjectiveDatabase';
import { getCorrectCasing } from '../utils/wordCasingUtils';
import { getTerm } from '../utils/terminology';

export const WordPartOfSpeechSortingView = ({
    exerciseWords,
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
                title: getTerm('Substantive', settings),
                color: 'blue',
                items: []
            },
            verb: {
                id: 'verb',
                title: getTerm('Verben', settings),
                color: 'red',
                items: []
            },
            adjective: {
                id: 'adjective',
                title: getTerm('Adjektive', settings),
                color: 'green',
                items: []
            }
        };

        const order = ['noun', 'verb', 'adjective'];

        const wordsToCategorize = exerciseWords;

        if (wordsToCategorize && wordsToCategorize.length > 0) {
            wordsToCategorize.forEach(w => {
                // exerciseWords are already filtered and grouped.
                // We just need to categorize them.
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
                    cols[targetCol].items.push(w);
                }
            });
        }

        return { cols, order };
    }, [exerciseWords, settings]);

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
