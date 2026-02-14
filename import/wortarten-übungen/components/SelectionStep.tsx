
import React, { useState } from 'react';
import { Check, PenTool, Puzzle, RefreshCcw, AlertCircle, Search, Scaling } from 'lucide-react';
import { WordItem, ExerciseMode, WordCategory, VerbDefinition } from '../types';

interface SelectionStepProps {
  items: WordItem[];
  category: WordCategory;
  text: string;
  onStartExercise: (selectedItems: WordItem[], mode: ExerciseMode) => void;
  onBack: () => void;
}

const SelectionStep: React.FC<SelectionStepProps> = ({ items, category, text, onStartExercise, onBack }) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    items.map((_, idx) => idx) // Select all by default
  );

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleStart = (mode: ExerciseMode) => {
    let selected = items.filter((_, idx) => selectedIndices.includes(idx));
    
    // Filter logic for BASE_FORM & EXTEND: Exclude 1st Person Plural ("wir") if needed
    // Usually 'wir' form is identical to base form, so "Finding Base Form" is trivial.
    // For EXTEND it's also trivial (extensions are identical).
    if (category === WordCategory.VERB && (mode === ExerciseMode.BASE_FORM || mode === ExerciseMode.EXTEND)) {
        const filtered = selected.filter(item => {
            const def = item.data as VerbDefinition;
            if (!def.detectedPerson) return true; 
            const persons = def.detectedPerson.toLowerCase().split('/');
            return !persons.includes('wir');
        });

        if (filtered.length === 0 && selected.length > 0) {
            alert("Für diese Übung wurden alle ausgewählten Verben gefiltert (z.B. 'wir'-Formen), da sie zu einfach sind. Bitte wähle andere Verben.");
            return;
        }
        selected = filtered;
    }

    if (selected.length > 0) {
      onStartExercise(selected, mode);
    }
  };

  const selectedCount = selectedIndices.length;
  // Rule: Noun/Adjective Puzzle needs at least 3 words to generate meaningful distractors from the pool
  const canStartPuzzle = category === WordCategory.VERB || selectedCount >= 3;
  
  const getCategoryLabel = (cat: WordCategory) => {
      switch(cat) {
          case WordCategory.VERB: return 'Verben';
          case WordCategory.NOUN: return 'Substantive';
          case WordCategory.ADJECTIVE: return 'Adjektive';
      }
  };

  const getActionLabel = (cat: WordCategory, mode: ExerciseMode) => {
      if (mode === ExerciseMode.BASE_FORM) return 'Personalform finden';
      if (mode === ExerciseMode.EXTEND) return 'Verben verlängern';
      const type = getCategoryLabel(cat);
      const action = mode === ExerciseMode.WRITE ? 'schreiben' : 'puzzeln';
      return `${type} ${action}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
            {items.length} {getCategoryLabel(category)} gefunden
        </h2>
        <p className="text-slate-500 mt-2">
          Wähle aus, welche Wörter du üben möchtest.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {items.map((item, idx) => {
          const isSelected = selectedIndices.includes(idx);
          return (
            <button
              key={item.id}
              onClick={() => toggleSelection(idx)}
              className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-start gap-1">
                  <span className="block font-bold text-slate-900">
                    {category === WordCategory.NOUN && item.subText ? (
                        <span className={`text-xs px-1.5 py-0.5 rounded mr-2 font-bold uppercase tracking-wider bg-slate-100 text-slate-600`}>
                            {item.subText}
                        </span>
                    ) : null}
                    {item.text}
                  </span>
                  {category === WordCategory.VERB && item.subText && (
                    <span className="text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                        {item.subText}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="bg-blue-500 text-white rounded-full p-0.5 shrink-0">
                    <Check size={12} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {items.length === 0 && (
          <div className="text-center p-8 text-slate-400">
              Keine passenden Wörter gefunden.
          </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between pt-6 border-t border-slate-100 gap-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-4 py-3 text-slate-500 hover:text-slate-800 transition-colors order-2 sm:order-1"
        >
          <RefreshCcw size={18} />
          Zurück
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2 flex-wrap justify-end">
          {category === WordCategory.VERB && (
            <>
              <button
                onClick={() => handleStart(ExerciseMode.BASE_FORM)}
                disabled={selectedCount === 0}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-white transition-all ${
                  selectedCount === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 shadow hover:shadow-lg'
                }`}
              >
                <Search size={18} />
                <span className="text-sm">{getActionLabel(category, ExerciseMode.BASE_FORM)}</span>
              </button>

              <button
                onClick={() => handleStart(ExerciseMode.EXTEND)}
                disabled={selectedCount === 0}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-white transition-all ${
                  selectedCount === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow hover:shadow-lg'
                }`}
              >
                <Scaling size={18} />
                <span className="text-sm">{getActionLabel(category, ExerciseMode.EXTEND)}</span>
              </button>
            </>
          )}

          <button
            onClick={() => handleStart(ExerciseMode.WRITE)}
            disabled={selectedCount === 0}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-white transition-all ${
              selectedCount === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow hover:shadow-lg'
            }`}
          >
            <PenTool size={18} />
            <span className="text-sm">{getActionLabel(category, ExerciseMode.WRITE)}</span>
          </button>
          
          <button
            onClick={() => handleStart(ExerciseMode.PUZZLE)}
            disabled={!canStartPuzzle}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg font-bold text-white transition-all h-auto min-h-[56px] ${
              !canStartPuzzle
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow hover:shadow-lg'
            }`}
            title={!canStartPuzzle ? "Wähle mindestens 3 Wörter für das Puzzle" : ""}
          >
            <div className="flex items-center gap-2">
                 <Puzzle size={18} />
                 <span className="text-sm">{getActionLabel(category, ExerciseMode.PUZZLE)}</span>
            </div>
            {!canStartPuzzle && selectedCount > 0 && (
                <span className="text-[10px] bg-slate-400 text-white px-1.5 py-0.5 rounded uppercase tracking-wide mt-1">
                    Zu wenige Wörter
                </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionStep;
