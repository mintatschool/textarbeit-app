
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, RotateCcw, Loader2, GripVertical, Volume2, AlertCircle, ChevronDown, ArrowDown, Info } from 'lucide-react';
import { WordItem, WordCategory, ExerciseMode, ExerciseResult, VerbDefinition, NounDefinition, AdjectiveDefinition, ConjugationTable, Tense, UserAnswer } from '../types';
import { generateConjugation } from '../services/gemini';
import { getLocalConjugation } from '../services/verbDatabase';
import { calculateExtensionSplit, calculatePuzzleSplit } from '../services/settings';

interface ExerciseStepProps {
  items: WordItem[];
  mode: ExerciseMode;
  onFinish: (results: ExerciseResult[]) => void;
  onCancel: () => void;
}

const VERB_PRONOUNS = [
  { key: 'ich', label: 'ich' },
  { key: 'du', label: 'du' },
  { key: 'er_sie_es', label: 'er/sie/es' },
  { key: 'wir', label: 'wir' },
  { key: 'ihr', label: 'ihr' },
  { key: 'sie_Sie', label: 'sie/Sie' },
] as const;

// --- UTILS FOR VERBS ---
const isCompoundTense = (tense: Tense | string): boolean => {
  return [Tense.PERFEKT, Tense.PLUSQUAMPERFEKT, Tense.FUTUR_I].includes(tense as Tense);
};

interface PuzzlePart {
  fixedBefore: string; 
  target: string;      
  fixedAfter: string;  
}

const getVerbPuzzleParts = (conjugated: string, tense: Tense | string): PuzzlePart => {
  conjugated = conjugated.trim().toLowerCase(); 
  
  if (isCompoundTense(tense)) {
    const spaceIndex = conjugated.indexOf(' ');
    if (spaceIndex > -1) {
      const aux = conjugated.substring(0, spaceIndex);
      const part = conjugated.substring(spaceIndex + 1);
      return { fixedBefore: '', target: aux, fixedAfter: part };
    }
  }

  // Endungen für Verben (Präsens und Präteritum)
  const vSuffixes = ['test', 'tet', 'est', 'ten', 'en', 'st', 'te', 'et', 'e', 't', 'n'];
  vSuffixes.sort((a, b) => b.length - a.length);

  for (const suffix of vSuffixes) {
    if (conjugated.endsWith(suffix)) {
      const stem = conjugated.slice(0, -suffix.length);
      
      // Spezielle Logik für Präteritum (starke Verben schützen)
      if (tense === Tense.PRAETERITUM) {
          // Regelmäßige Schwache Präteritum-Endungen (te, test...) immer trennen
          if (['te', 'test', 'ten', 'tet'].includes(suffix)) {
              return { fixedBefore: stem, target: suffix, fixedAfter: '' };
          }
          // Bei starken Verben (ging-st, ging-en, ging-t) nur trennen, wenn der Stamm stabil bleibt
          if (['en', 'st', 't'].includes(suffix) && stem.length >= 3) {
               return { fixedBefore: stem, target: suffix, fixedAfter: '' };
          }
          // Sonst (z.B. "ging"): Nicht trennen, sondern als Ganzes anzeigen
          continue; 
      }

      // Im Präsens ist die Trennung meist unkritisch (geh-en, lach-t)
      if (stem.length >= 2) {
          return { fixedBefore: stem, target: suffix, fixedAfter: '' };
      }
    }
  }

  // Fallback: Wenn keine Endung sinnvoll abgetrennt werden kann (z.B. "ging")
  return { fixedBefore: conjugated, target: '', fixedAfter: '' };
};

const ExerciseStep: React.FC<ExerciseStepProps> = ({ items, mode, onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = items[currentIndex];

  // Verb State
  const [currentTense, setCurrentTense] = useState<Tense | string>(Tense.PRAESENS);
  const [verbTarget, setVerbTarget] = useState<ConjugationTable | null>(null);
  const [verbAnswers, setVerbAnswers] = useState<UserAnswer>({});
  
  // Base Form Mode State
  const [verbConjugatedInput, setVerbConjugatedInput] = useState('');

  // Extend Mode State
  const [extendBaseInput, setExtendBaseInput] = useState('');
  const [extendSuffixInput, setExtendSuffixInput] = useState(''); 

  // Noun/Adj State
  const [nounLastCharInput, setNounLastCharInput] = useState('');
  const [nounPluralInput, setNounPluralInput] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [adjAnswers, setAdjAnswers] = useState<UserAnswer>({});

  // Generic State
  const [feedback, setFeedback] = useState<Record<string, boolean> | null>(null);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [usedAudioForCurrent, setUsedAudioForCurrent] = useState(false);
  const [hasMadeMistake, setHasMadeMistake] = useState(false);
  const [activeStage, setActiveStage] = useState(0);

  // Puzzle State
  const [puzzleParts, setPuzzleParts] = useState<Record<string, PuzzlePart>>({});
  const [puzzlePool, setPuzzlePool] = useState<{id: string, text: string}[]>([]);
  const [puzzlePlacements, setPuzzlePlacements] = useState<Record<string, {id: string, text: string} | null>>({});
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  // Audio Helper
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setUsedAudioForCurrent(true);
  };

  // Initialize Item - Default Tense from Source Text
  useEffect(() => {
    if (currentItem.category === WordCategory.VERB) {
        const def = currentItem.data as VerbDefinition;
        const sourceTenseStr = (def.detectedTense as string).toLowerCase();
        const initialTense = Object.values(Tense).find(t => t.toLowerCase() === sourceTenseStr) 
            || Tense.PRAESENS;
        setCurrentTense(initialTense);
    }
  }, [currentItem]);

  // Fetch Data & Prepare Exercise
  useEffect(() => {
    const prepare = async () => {
      setIsLoading(true);
      setFeedback(null);
      setShowIncompleteWarning(false);
      setShowSolution(false);
      setUsedAudioForCurrent(false);
      setHasMadeMistake(false);
      setActiveStage(0);
      
      setVerbAnswers({});
      setVerbConjugatedInput('');
      setExtendBaseInput('');
      setExtendSuffixInput('');

      setVerbTarget(null);
      setNounLastCharInput('');
      setNounPluralInput('');
      setSelectedArticle(null);
      setAdjAnswers({});
      
      setPuzzlePool([]);
      setPuzzlePlacements({});
      setPuzzleParts({});
      setSelectedPoolId(null);

      if (currentItem.category === WordCategory.VERB) {
        const def = currentItem.data as VerbDefinition;
        let data = getLocalConjugation(def.lemma, currentTense);
        if (!data) data = await generateConjugation(def.lemma, currentTense as string);
        setVerbTarget(data);

        if (data && mode === ExerciseMode.PUZZLE) {
            const parts: Record<string, PuzzlePart> = {};
            const pool: {id: string, text: string}[] = [];
            const initialPlacements: Record<string, {id: string, text: string} | null> = {};

            VERB_PRONOUNS.forEach(({key}) => {
                const p = getVerbPuzzleParts(data![key].toLowerCase(), currentTense);
                parts[key] = p;
                
                if (p.target) {
                    pool.push({ id: `${key}-${Math.random()}`, text: p.target });
                } else {
                    // "ich ging" -> ging ist fixedBefore, target ist leer -> Form ist fertig
                    initialPlacements[key] = { id: 'fixed', text: '' };
                }
            });
            
            pool.sort(() => Math.random() - 0.5);
            setPuzzleParts(parts);
            setPuzzlePool(pool);
            setPuzzlePlacements(initialPlacements);
        }
      } 
      else if (currentItem.category === WordCategory.NOUN) {
          const def = currentItem.data as NounDefinition;
          if (mode === ExerciseMode.PUZZLE) {
              const parts: Record<string, PuzzlePart> = {};
              const pool: {id: string, text: string}[] = [];
              const singSplit = calculatePuzzleSplit(def.lemma); 
              parts['nounSingular'] = singSplit;
              pool.push({ id: 'sing-correct', text: singSplit.target });

              if (def.plural !== '-') {
                  const plurSplit = calculatePuzzleSplit(def.plural); 
                  parts['nounPlural'] = plurSplit;
                  pool.push({ id: 'plur-correct', text: plurSplit.target });
              }
              const distractors = ['e', 'n', 'en', 'er', 's', 'r', 'te', 'm', 'd', 'ch', 'ung'];
              distractors.sort(() => Math.random() - 0.5).slice(0, 5).forEach((d, i) => pool.push({ id: `dist-${i}`, text: d }));
              pool.sort(() => Math.random() - 0.5);
              setPuzzleParts(parts);
              setPuzzlePool(pool);
          }
      }
      else if (currentItem.category === WordCategory.ADJECTIVE) {
          const def = currentItem.data as AdjectiveDefinition;
          const parts: Record<string, PuzzlePart> = {};
          const posSplit = calculatePuzzleSplit(def.lemma.toLowerCase(), true); 
          parts['positiv'] = posSplit;

          if (mode === ExerciseMode.PUZZLE) {
              const pool: {id: string, text: string}[] = [];
              pool.push({ id: 'pos-correct', text: posSplit.target });
              const kompSplit = calculatePuzzleSplit(def.komparativ.toLowerCase()); 
              parts['komparativ'] = kompSplit;
              pool.push({ id: 'komp-correct', text: kompSplit.target });
              
              let supWord = def.superlativ.toLowerCase();
              let prefix = '';
              if (supWord.startsWith('am ')) {
                  prefix = 'am ';
                  supWord = supWord.substring(3);
              }
              const supSplit = calculatePuzzleSplit(supWord); 
              parts['superlativ'] = { fixedBefore: prefix + supSplit.fixedBefore, target: supSplit.target, fixedAfter: supSplit.fixedAfter };
              pool.push({ id: 'sup-correct', text: supSplit.target });

              const distractors = ['er', 'sten', 'ste', 'es', 'em', 'en', 'er', 'st', 'ig', 'lich', 'll', 'tt', 'ck'];
              distractors.sort(() => Math.random() - 0.5).slice(0, 6).forEach((d, i) => pool.push({ id: `dist-${i}`, text: d }));
              pool.sort(() => Math.random() - 0.5);
              setPuzzlePool(pool);
          }
          setPuzzleParts(parts);
      }
      setIsLoading(false);
    };
    prepare();
  }, [currentItem, currentTense, mode]);

  const getStages = (): string[][] => {
      if (currentItem.category === WordCategory.NOUN) {
          const def = currentItem.data as NounDefinition;
          return def.plural !== '-' ? [['article', 'char', 'nounSingular'], ['plural', 'nounPlural']] : [['article', 'char', 'nounSingular']];
      }
      if (currentItem.category === WordCategory.ADJECTIVE) {
          return [['positiv'], ['komparativ'], ['superlativ']];
      }
      if (currentItem.category === WordCategory.VERB) {
          if (mode === ExerciseMode.BASE_FORM) return [['conjugated']];
          if (mode === ExerciseMode.EXTEND) return [['extend']];
          return [VERB_PRONOUNS.map(p => p.key)]; 
      }
      return [];
  };

  // Fix: Added missing handlePoolClick function to manage selectedPoolId state.
  const handlePoolClick = (id: string) => {
    if (feedback) return;
    setSelectedPoolId(prev => (prev === id ? null : id));
  };

  const handleSlotClick = (key: string) => {
    if (feedback) return;
    if (puzzlePlacements[key]) {
        if (puzzlePlacements[key]?.id === 'fixed') return;
        setPuzzlePlacements(p => { const n = {...p}; delete n[key]; return n; });
        return;
    }
    if (selectedPoolId) {
        const item = puzzlePool.find(p => p.id === selectedPoolId);
        if (item) {
            setPuzzlePlacements(p => ({...p, [key]: item}));
            setSelectedPoolId(null);
            setShowIncompleteWarning(false);
        }
    }
  };

  const handleCheck = () => {
      const stages = getStages();
      const currentStageKeys = stages[activeStage];
      
      let isComplete = true;
      if (currentItem.category === WordCategory.VERB) {
          if (mode === ExerciseMode.BASE_FORM) isComplete = !!verbConjugatedInput.trim();
          else if (mode === ExerciseMode.EXTEND) isComplete = !!extendBaseInput.trim() && !!extendSuffixInput.trim();
          else if (mode === ExerciseMode.WRITE) isComplete = VERB_PRONOUNS.every(p => (verbAnswers[p.key as keyof UserAnswer] || '').trim().length > 0);
          else isComplete = VERB_PRONOUNS.every(p => !!puzzlePlacements[p.key]);
      } else if (currentItem.category === WordCategory.NOUN) {
          if (mode === ExerciseMode.WRITE) isComplete = activeStage === 0 ? (!!selectedArticle && !!nounLastCharInput.trim()) : !!nounPluralInput.trim();
          else isComplete = activeStage === 0 ? (!!selectedArticle && !!puzzlePlacements['nounSingular']) : !!puzzlePlacements['nounPlural'];
      } else if (currentItem.category === WordCategory.ADJECTIVE) {
          if (mode === ExerciseMode.WRITE) isComplete = !!(adjAnswers[currentStageKeys[0] as keyof UserAnswer]?.trim());
          else isComplete = !!puzzlePlacements[currentStageKeys[0]];
      }

      if (!isComplete) {
          setShowIncompleteWarning(true);
          return;
      }

      const { correct, stageFeedback } = checkAnswersForStage(activeStage);
      if (!correct) setHasMadeMistake(true);
      setFeedback(prev => ({ ...prev, ...stageFeedback }));
  };

  const handleStageAdvance = () => {
      if (activeStage < getStages().length - 1) {
          setActiveStage(p => p + 1);
          setFeedback(null);
      } else {
          handleFinish();
      }
  };

  const handleFinish = () => {
      const result: ExerciseResult = {
        verb: currentItem.text,
        tense: currentItem.category === WordCategory.VERB ? currentTense as string : 'Allgemein',
        correctCount: hasMadeMistake ? 0 : 1,
        totalCount: 1,
        usedAudio: usedAudioForCurrent
      };
      const nextResults = [...results, result];
      setResults(nextResults);
      if (currentIndex < items.length - 1) setCurrentIndex(p => p + 1);
      else onFinish(nextResults);
  };

  const checkAnswersForStage = (stageIdx: number): { correct: boolean, stageFeedback: Record<string, boolean> } => {
      const stageFeedback: Record<string, boolean> = {};
      let isStageCorrect = true;

      if (currentItem.category === WordCategory.VERB) {
          if (mode === ExerciseMode.BASE_FORM) {
              const def = currentItem.data as VerbDefinition;
              const isCorrect = verbConjugatedInput.trim().toLowerCase() === def.original.toLowerCase();
              stageFeedback['conjugated'] = isCorrect;
              isStageCorrect = isCorrect;
          } else if (mode === ExerciseMode.EXTEND) {
              if (verbTarget) {
                 const def = currentItem.data as VerbDefinition;
                 const key = getPersonKey(def.detectedPerson);
                 const split = calculateExtensionSplit(verbTarget[key].toLowerCase()); 
                 const baseCorrect = extendBaseInput.trim().toLowerCase() === def.lemma.toLowerCase();
                 const suffixCorrect = extendSuffixInput.trim().toLowerCase() === split.end.toLowerCase();
                 stageFeedback['extendBase'] = baseCorrect;
                 stageFeedback['extendSuffix'] = suffixCorrect;
                 isStageCorrect = baseCorrect && suffixCorrect;
              }
          } else if (verbTarget) {
              VERB_PRONOUNS.forEach(({key}) => {
                  const target = verbTarget[key].toLowerCase();
                  let isCorrect = false;
                  if (mode === ExerciseMode.WRITE) isCorrect = (verbAnswers[key as keyof UserAnswer] || '').trim().toLowerCase() === target;
                  else {
                      const part = puzzleParts[key];
                      const placed = puzzlePlacements[key];
                      const constructed = (part?.fixedBefore || '') + (placed?.text || '') + (part?.fixedAfter || '');
                      isCorrect = constructed.trim().toLowerCase() === target.trim();
                  }
                  stageFeedback[key] = isCorrect;
                  if (!isCorrect) isStageCorrect = false;
              });
          }
      } else if (currentItem.category === WordCategory.NOUN) {
          const def = currentItem.data as NounDefinition;
          if (stageIdx === 0) {
              const artCorrect = selectedArticle === def.article;
              stageFeedback['article'] = artCorrect;
              if (mode === ExerciseMode.WRITE) {
                  const charCorrect = nounLastCharInput === def.lemma.slice(-1);
                  stageFeedback['char'] = charCorrect;
                  isStageCorrect = artCorrect && charCorrect;
              } else {
                  const singCorrect = puzzlePlacements['nounSingular']?.text === puzzleParts['nounSingular'].target;
                  stageFeedback['nounSingular'] = singCorrect;
                  isStageCorrect = artCorrect && singCorrect;
              }
          } else {
              if (mode === ExerciseMode.WRITE) {
                  const plurCorrect = nounPluralInput.trim() === def.plural;
                  stageFeedback['plural'] = plurCorrect;
                  isStageCorrect = plurCorrect;
              } else {
                  const plurCorrect = puzzlePlacements['nounPlural']?.text === puzzleParts['nounPlural'].target;
                  stageFeedback['nounPlural'] = plurCorrect;
                  isStageCorrect = plurCorrect;
              }
          }
      } else if (currentItem.category === WordCategory.ADJECTIVE) {
          const def = currentItem.data as AdjectiveDefinition;
          const currentType = ['positiv', 'komparativ', 'superlativ'][stageIdx];
          const target = currentType === 'positiv' ? def.lemma : currentType === 'komparativ' ? def.komparativ : def.superlativ;
          
          if (mode === ExerciseMode.WRITE) {
             const isCorrect = (adjAnswers[currentType as keyof UserAnswer] || '').trim().toLowerCase() === target.toLowerCase();
             stageFeedback[currentType] = isCorrect;
             isStageCorrect = isCorrect;
          } else {
              const part = puzzleParts[currentType];
              const placed = puzzlePlacements[currentType];
              const constructed = (part?.fixedBefore || '') + (placed?.text || '') + (part?.fixedAfter || '');
              isStageCorrect = constructed.trim().toLowerCase() === target.trim().toLowerCase();
              stageFeedback[currentType] = isStageCorrect;
          }
      }
      return { correct: isStageCorrect, stageFeedback };
  };

  const getPersonKey = (detected: string | undefined): string => {
      const norm = (detected || 'ich').toLowerCase();
      if (norm.includes('ich')) return 'ich';
      if (norm.includes('du')) return 'du';
      if (norm.includes('wir')) return 'wir';
      if (norm.includes('ihr')) return 'ihr';
      if (norm.includes('sie') && (norm.includes('es') || norm.includes('er'))) return 'er_sie_es';
      return 'sie_Sie';
  };

  const isCurrentStageCorrect = () => {
      if (!feedback) return false;
      const { correct } = checkAnswersForStage(activeStage);
      return correct;
  };

  const getDisplayPerson = (p: string | undefined) => {
      const s = (p || 'Personalform').toLowerCase();
      if (s === 'er_sie_es' || s === 'er/sie/es' || (s.includes('er') && s.includes('sie') && s.includes('es'))) return 'Er/sie/es';
      return s;
  };

  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0;
  const stageCorrect = isCurrentStageCorrect();
  const isLastStage = activeStage === getStages().length - 1;

  return (
    <div className={`w-full mx-auto h-[calc(100vh-140px)] flex flex-col ${mode === ExerciseMode.PUZZLE ? 'max-w-7xl' : 'max-w-4xl'}`}>
      <div className="mb-4 flex items-center justify-between shrink-0 px-4">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></button>
        <div className="flex-1 mx-4 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-medium text-slate-500">{currentIndex + 1} / {items.length}</span>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row relative">
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className={`p-6 text-white flex justify-between items-center shrink-0 ${currentItem.category === WordCategory.VERB ? 'bg-blue-600' : currentItem.category === WordCategory.NOUN ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                <div>
                    <h2 className="text-3xl font-bold">{currentItem.category === WordCategory.VERB ? (mode === ExerciseMode.BASE_FORM ? 'Form finden' : mode === ExerciseMode.EXTEND ? 'Verlängern' : 'Konjugieren') : 'Übung'}</h2>
                    <span className="opacity-80 text-sm">{mode === ExerciseMode.PUZZLE ? 'Bausteine zuordnen' : 'Selbst schreiben'}</span>
                </div>
                {currentItem.category === WordCategory.VERB && (
                     <div className="flex flex-col items-end gap-1">
                        <label className="text-xs font-semibold uppercase opacity-70">Zeitform</label>
                        <select 
                            value={currentTense} 
                            onChange={e => setCurrentTense(e.target.value)}
                            className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm focus:bg-blue-700 outline-none cursor-pointer"
                            disabled={!!feedback}
                        >
                            {Object.values(Tense).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center bg-slate-50/30">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" size={32} /></div>
                ) : (
                    <div className="w-full max-w-3xl flex flex-col items-center">
                    
                    {/* --- GRUNDFORM ANZEIGE FÜR VERBEN --- */}
                    {currentItem.category === WordCategory.VERB && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center mb-8 w-full max-w-lg">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grundform (Infinitive)</span>
                             <div className="text-3xl font-bold text-slate-800 lowercase mt-1">{(currentItem.data as VerbDefinition).lemma}</div>
                             <button onClick={() => speak((currentItem.data as VerbDefinition).lemma)} className="p-1 mt-1 text-blue-300 hover:text-blue-500"><Volume2 size={20} /></button>
                        </div>
                    )}

                    {/* --- VERBS: BASE FORM MODE --- */}
                    {currentItem.category === WordCategory.VERB && mode === ExerciseMode.BASE_FORM && (
                        <div className="flex flex-col gap-8 w-full max-w-lg items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-32 text-right shrink-0">
                                    <span className="text-xl font-bold text-slate-500 lowercase block">{getDisplayPerson((currentItem.data as VerbDefinition).detectedPerson)}</span>
                                </div>
                                <div className="relative flex-1">
                                    <input 
                                        value={verbConjugatedInput}
                                        onChange={e => { setVerbConjugatedInput(e.target.value); setShowIncompleteWarning(false); }}
                                        className={`w-full p-4 rounded-xl border-2 outline-none text-left text-2xl font-bold lowercase transition-all
                                            ${feedback?.conjugated === true ? 'border-green-500 bg-green-50 text-green-800' : 
                                              feedback?.conjugated === false ? 'border-red-400 bg-red-50 text-red-800' : 'border-slate-200 focus:border-blue-500 bg-white'}`}
                                        disabled={!!feedback}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- VERBS: CONJUGATION WRITE/PUZZLE --- */}
                    {currentItem.category === WordCategory.VERB && verbTarget && mode !== ExerciseMode.BASE_FORM && mode !== ExerciseMode.EXTEND && (
                        mode === ExerciseMode.WRITE ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                {VERB_PRONOUNS.map(({key, label}) => (
                                    <div key={key}>
                                        <label className="text-sm text-slate-500">{label}</label>
                                        <div className="relative">
                                            <input 
                                                value={verbAnswers[key as keyof UserAnswer] || ''}
                                                onChange={e => { setVerbAnswers(p => ({...p, [key]: e.target.value})); setShowIncompleteWarning(false); }}
                                                className={`w-full p-3 rounded-lg border-2 outline-none transition-all lowercase
                                                    ${feedback?.[key] === true ? 'border-green-500 bg-green-50' : feedback?.[key] === false ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`}
                                                disabled={!!feedback}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="flex flex-col gap-4 items-center w-full">
                                {VERB_PRONOUNS.map(({key, label}) => {
                                    const part = puzzleParts[key];
                                    const placed = puzzlePlacements[key];
                                    return (
                                        <div key={key} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm w-full max-w-2xl">
                                            <div className="w-24 text-right text-base font-bold text-slate-400 uppercase tracking-wider shrink-0">{label}</div>
                                            <div className="flex-1 flex justify-center items-center gap-1">
                                                 {part?.fixedBefore && (<div className="bg-slate-100 px-3 py-2 rounded-lg font-bold border border-slate-200 text-slate-700 text-lg lowercase">{part.fixedBefore}</div>)}
                                                 {part?.target ? (
                                                     <button onClick={() => handleSlotClick(key)} disabled={!!feedback}
                                                        className={`h-16 min-w-[5rem] px-4 rounded-xl border-2 text-2xl font-bold flex items-center justify-center transition-all lowercase
                                                            ${placed ? 'bg-blue-50 border-blue-400 text-blue-900' : 'bg-white border-slate-300 hover:border-blue-300 border-dashed'}
                                                            ${feedback?.[key] === true ? '!bg-green-100 !border-green-500' : feedback?.[key] === false ? '!bg-red-100 !border-red-400' : ''}`}>
                                                        {placed?.text}
                                                     </button>
                                                 ) : null}
                                                {part?.fixedAfter && (<div className="bg-slate-100 px-3 py-2 rounded-lg font-bold border border-slate-200 text-slate-700 text-lg lowercase">{part.fixedAfter}</div>)}
                                            </div>
                                            <button onClick={() => speak(`${label} ${verbTarget[key]}`)} className="p-2 text-blue-300 hover:text-blue-500 shrink-0"><Volume2 size={24} /></button>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    )}
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                 {!feedback ? (
                    <button onClick={handleCheck} disabled={isLoading} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 disabled:opacity-50">Prüfen</button>
                 ) : (
                    <>
                        <button onClick={() => setShowSolution(!showSolution)} className="px-4 py-3 text-slate-600 hover:text-blue-600 font-medium underline text-sm">Lösung</button>
                        {stageCorrect && !isLastStage ? (
                             <button onClick={handleStageAdvance} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 flex gap-2 items-center">Nächster Schritt <ChevronDown size={18} /></button>
                        ) : (
                             <button onClick={handleFinish} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold shadow hover:bg-green-700 flex gap-2 items-center">Weiter <ArrowRight size={18} /></button>
                        )}
                    </>
                 )}
            </div>
        </div>

        {mode === ExerciseMode.PUZZLE && (
            <div className="bg-slate-100 border-l border-slate-200 w-full md:w-64 flex flex-col shrink-0 h-48 md:h-full overflow-hidden">
                <div className="p-4 border-b border-slate-200 shrink-0">
                    <h3 className="text-sm font-bold text-slate-500 uppercase flex gap-2 items-center"><GripVertical size={16}/> Bausteine</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                     <div className="flex flex-wrap gap-2 content-start justify-center">
                        {puzzlePool.map(item => {
                            const placed = Object.values(puzzlePlacements).some((p: any) => p?.id === item.id);
                            if (placed && !feedback) return null;
                            return (
                                <button key={item.id} onClick={() => handlePoolClick(item.id)} disabled={!!feedback || placed}
                                    className={`px-4 py-3 bg-white rounded-xl shadow-sm border-2 font-bold transition-all text-xl lowercase
                                        ${selectedPoolId === item.id ? 'border-blue-500 ring-2 ring-blue-200 scale-105' : 'border-slate-200 hover:border-blue-300'}`}>
                                    {item.text}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseStep;
