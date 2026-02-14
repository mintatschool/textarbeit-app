
import React, { useState, useEffect, useRef } from 'react';
import { AppStep, VerbDefinition, NounDefinition, AdjectiveDefinition, ExerciseResult, ExerciseMode, WordCategory, WordItem } from './types';
import { analyzeTextForVerbs, analyzeTextForNouns, analyzeTextForAdjectives, onAiUsed } from './services/gemini';
import InputStep from './components/InputStep';
import CategorySelectionStep from './components/CategorySelectionStep';
import SelectionStep from './components/SelectionStep';
import ExerciseStep from './components/ExerciseStep';
import SettingsStep from './components/SettingsStep';
import { Trophy, RotateCcw, Volume2, Info, X, GraduationCap, Settings } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [lastStep, setLastStep] = useState<AppStep>(AppStep.INPUT);
  const [inputText, setInputText] = useState('');
  
  // Analysis Data
  const [verbs, setVerbs] = useState<VerbDefinition[]>([]);
  const [nouns, setNouns] = useState<NounDefinition[]>([]);
  const [adjectives, setAdjectives] = useState<AdjectiveDefinition[]>([]);
  
  // Selection State
  const [activeCategory, setActiveCategory] = useState<WordCategory>(WordCategory.VERB);
  const [selectionItems, setSelectionItems] = useState<WordItem[]>([]);
  const [exerciseItems, setExerciseItems] = useState<WordItem[]>([]);
  
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>(ExerciseMode.WRITE);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  
  // AI Status State
  const [aiUsed, setAiUsed] = useState(false);
  const [aiReasons, setAiReasons] = useState<string[]>([]);
  const [showAiDetails, setShowAiDetails] = useState(false);
  const aiDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to AI events
    const unsubscribe = onAiUsed((reason) => {
      setAiUsed(true);
      setAiReasons(prev => {
          // Avoid duplicate consecutive messages
          if (prev[prev.length - 1] === reason) return prev;
          return [...prev, reason];
      });
    });
    
    // Close popup when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (aiDetailsRef.current && !aiDetailsRef.current.contains(event.target as Node)) {
        setShowAiDetails(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTextAnalysis = async (text: string) => {
    setIsLoading(true);
    setInputText(text);
    
    // Parallel analysis
    const [v, n, a] = await Promise.all([
        analyzeTextForVerbs(text),
        analyzeTextForNouns(text),
        analyzeTextForAdjectives(text)
    ]);
    
    setVerbs(v);
    setNouns(n);
    setAdjectives(a);
    setIsLoading(false);
    setStep(AppStep.CATEGORY_SELECT);
  };

  const handleCategorySelect = (category: WordCategory) => {
      setActiveCategory(category);
      
      let items: WordItem[] = [];

      if (category === WordCategory.VERB) {
          items = verbs.map((v, i) => ({
              id: `v-${i}`,
              category: WordCategory.VERB,
              text: v.lemma,
              subText: v.detectedTense,
              data: v
          }));
      } else if (category === WordCategory.NOUN) {
          items = nouns.map((n, i) => ({
              id: `n-${i}`,
              category: WordCategory.NOUN,
              text: n.lemma,
              subText: n.article, // Display article as badge
              data: n
          }));
      } else if (category === WordCategory.ADJECTIVE) {
          items = adjectives.map((a, i) => ({
              id: `a-${i}`,
              category: WordCategory.ADJECTIVE,
              text: a.lemma,
              subText: '',
              data: a
          }));
      }
      
      setSelectionItems(items);
      setStep(AppStep.SELECTION);
  };

  const startExercise = (items: WordItem[], mode: ExerciseMode) => {
    setExerciseItems(items);
    setExerciseMode(mode);
    setStep(AppStep.EXERCISE);
  };

  const finishExercise = (finalResults: ExerciseResult[]) => {
    setResults(finalResults);
    setStep(AppStep.SUMMARY);
  };

  const restart = () => {
    setStep(AppStep.INPUT);
    setInputText('');
    setVerbs([]);
    setNouns([]);
    setAdjectives([]);
    setResults([]);
    setAiUsed(false);
    setAiReasons([]);
  };

  const openSettings = () => {
      if (step !== AppStep.SETTINGS) {
          setLastStep(step);
          setStep(AppStep.SETTINGS);
      }
  };

  const closeSettings = () => {
      setStep(lastStep);
  };

  // Feedback Logic for Summary
  const totalCorrect = results.reduce((acc, r) => acc + r.correctCount, 0);
  const totalPossible = results.reduce((acc, r) => acc + r.totalCount, 0);
  const scorePct = totalPossible > 0 ? (totalCorrect / totalPossible) * 100 : 0;

  const getFeedback = () => {
    if (totalPossible === 0) return { title: "Fertig!", text: "Keine Aufgaben bearbeitet.", color: "bg-slate-100 text-slate-500", icon: <Info size={40} /> };
    
    if (scorePct === 100) return { title: "Perfekt!", text: "Alles richtig! Eine Glanzleistung.", color: "bg-yellow-100 text-yellow-600", icon: <Trophy size={40} /> };
    if (scorePct >= 80) return { title: "Super gemacht!", text: "Ein sehr starkes Ergebnis.", color: "bg-blue-100 text-blue-600", icon: <Trophy size={40} /> };
    if (scorePct >= 50) return { title: "Gut gemacht!", text: "Du bist auf einem guten Weg.", color: "bg-indigo-100 text-indigo-600", icon: <GraduationCap size={40} /> };
    if (scorePct > 0) return { title: "Übung macht den Meister!", text: "Bleib dran, es wird besser.", color: "bg-orange-100 text-orange-600", icon: <RotateCcw size={40} /> };
    
    return { title: "Nicht aufgeben!", text: "Aller Anfang ist schwer. Versuch es gleich nochmal!", color: "bg-red-100 text-red-600", icon: <X size={40} /> };
  };

  const feedback = getFeedback();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <span className="font-bold text-xl tracking-tight">Wortarten-Übungen</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
                onClick={openSettings}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                title="Einstellungen"
            >
                <Settings size={20} />
            </button>

            <div className="relative" ref={aiDetailsRef}>
                <button 
                onClick={() => setShowAiDetails(!showAiDetails)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    aiUsed 
                    ? 'bg-green-50 border-green-200 cursor-pointer hover:bg-green-100' 
                    : 'bg-slate-50 border-slate-100 cursor-default'
                }`}
                >
                    <span className={`text-xs font-bold uppercase tracking-wider ${aiUsed ? 'text-green-700' : 'text-slate-500'}`}>KI:</span>
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${aiUsed ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] scale-110' : 'bg-slate-300'}`} />
                </button>

                {/* AI Info Popup */}
                {showAiDetails && aiUsed && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Info size={14} className="text-blue-500"/>
                            KI-Aktivität
                        </h4>
                        <button onClick={() => setShowAiDetails(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Die App hat für folgende Aufgaben die Online-KI genutzt, da keine Offline-Daten verfügbar waren:
                    </p>
                    <ul className="space-y-2">
                        {aiReasons.map((reason, idx) => (
                            <li key={idx} className="text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col h-full">
        {step === AppStep.SETTINGS && (
            <SettingsStep onBack={closeSettings} />
        )}

        {step === AppStep.INPUT && (
          <div className="flex-1 flex items-center justify-center">
            <InputStep onNext={handleTextAnalysis} isLoading={isLoading} />
          </div>
        )}

        {step === AppStep.CATEGORY_SELECT && (
            <div className="flex-1 flex items-center justify-center">
                <CategorySelectionStep 
                    verbCount={verbs.length}
                    nounCount={nouns.length}
                    adjCount={adjectives.length}
                    onSelect={handleCategorySelect}
                    onBack={() => setStep(AppStep.INPUT)}
                />
            </div>
        )}

        {step === AppStep.SELECTION && (
          <SelectionStep 
            items={selectionItems}
            category={activeCategory}
            text={inputText}
            onStartExercise={startExercise}
            onBack={() => setStep(AppStep.CATEGORY_SELECT)}
          />
        )}

        {step === AppStep.EXERCISE && (
          <ExerciseStep 
            items={exerciseItems}
            mode={exerciseMode}
            onFinish={finishExercise}
            onCancel={() => setStep(AppStep.SELECTION)}
          />
        )}

        {step === AppStep.SUMMARY && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${feedback.color}`}>
                {feedback.icon}
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{feedback.title}</h2>
              <p className="text-slate-500 mb-8">{feedback.text}</p>
              
              <div className="space-y-4 mb-8 text-left max-h-60 overflow-y-auto">
                {results.map((res, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex flex-col">
                      <div>
                        <span className="font-bold text-slate-800 capitalize">{res.verb}</span>
                        <span className="text-xs text-slate-500 ml-2">({res.tense})</span>
                      </div>
                      {res.usedAudio && (
                        <div className="flex items-center gap-1 text-xs text-indigo-500 mt-1">
                          <Volume2 size={12} />
                          <span>mit Hilfe</span>
                        </div>
                      )}
                    </div>
                    <div className={`font-mono font-bold ${
                      res.correctCount === res.totalCount ? 'text-green-600' : 'text-orange-500'
                    }`}>
                      {res.correctCount}/{res.totalCount}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={restart}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <RotateCcw size={20} />
                Neue Übung erstellen
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Wortarten-Übungen. Powered by Gemini API.</p>
      </footer>
    </div>
  );
}
