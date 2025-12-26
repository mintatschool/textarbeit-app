
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RotateCcw, 
  Volume2, 
  CheckCircle2, 
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  Smile,
  AlertCircle
} from 'lucide-react';
import { GameState, GameMode } from './types';
import { fetchEducationalWords } from './geminiService';
import PuzzlePiece from './PuzzlePiece';
import { COLORS, FALLBACK_WORDS, PUZZLE_PATH_LEFT, PUZZLE_PATH_RIGHT } from './constants';

const HorizontalLines = ({ count }: { count: number }) => (
  <div className="flex flex-col gap-[2px] w-4 items-center justify-center">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
    ))}
  </div>
);

// Hochwertige Miniatur-Vorschau für die Spielmodi
const ModeIcon = ({ mode, active }: { mode: GameMode, active: boolean }) => {
  const primaryColor = active ? '#3b82f6' : '#94a3b8';
  const strokeColor = active ? '#2563eb' : '#cbd5e1';
  const fillLeft = mode === 'left-filled' ? primaryColor : 'none';
  const fillRight = mode === 'right-filled' ? primaryColor : 'none';
  
  return (
    <svg width="48" height="28" viewBox="0 0 420 110" className="overflow-visible drop-shadow-sm transition-all duration-300">
      {/* Linkes Teil */}
      <path 
        d={PUZZLE_PATH_LEFT} 
        fill={fillLeft} 
        stroke={strokeColor} 
        strokeWidth="16" 
        className="transition-colors duration-300"
      />
      {/* Rechtes Teil - leicht versetzt für die 'Naht' Optik */}
      <path 
        d={PUZZLE_PATH_RIGHT} 
        fill={fillRight} 
        stroke={strokeColor} 
        strokeWidth="16" 
        transform="translate(210, 0)" 
        className="transition-colors duration-300"
      />
    </svg>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    stages: [],
    currentStageIndex: 0,
    gameStatus: 'loading',
    pieceScale: 1.0,
    wordsPerStage: 3,
    gameMode: 'both-empty'
  });

  const [pendingWordsCount, setPendingWordsCount] = useState<number>(3);
  const debounceTimerRef = useRef<number | null>(null);

  const [scrambledSyllables, setScrambledSyllables] = useState<{ id: string, text: string, type: 'left' | 'right', color: string, x: number, y: number, rotation: number, wordIdx: number }[]>([]);
  const [placedSyllables, setPlacedSyllables] = useState<{ left: string | null, right: string | null }>({ left: null, right: null });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [showWordSuccess, setShowWordSuccess] = useState(false);
  const processingComplete = useRef(false);

  const startNewGame = useCallback(async (customWordsPerStage?: number) => {
    const wps = customWordsPerStage !== undefined ? customWordsPerStage : pendingWordsCount;
    setGameState(prev => ({ ...prev, gameStatus: 'loading', stages: [], currentStageIndex: 0, wordsPerStage: wps }));

    try {
      const totalWordsNeeded = wps * 3;
      let allWords = await fetchEducationalWords(totalWordsNeeded); 
      
      if (!allWords || allWords.length === 0) {
        allWords = [...FALLBACK_WORDS].sort(() => Math.random() - 0.5).slice(0, totalWordsNeeded);
      }

      const newStages = [];
      for (let i = 0; i < allWords.length; i += wps) {
        const stageWords = allWords.slice(i, i + wps);
        if (stageWords.length > 0) {
          newStages.push({ words: stageWords, completedWordIndices: [], targetWordIndex: 0 });
        }
      }
      
      setGameState(prev => ({ ...prev, stages: newStages, gameStatus: 'playing', currentStageIndex: 0, wordsPerStage: wps }));
    } catch (err) {
      console.error("Startfehler:", err);
      const fallbackSet = [...FALLBACK_WORDS].sort(() => Math.random() - 0.5).slice(0, wps);
      setGameState(prev => ({ 
        ...prev, 
        gameStatus: 'playing', 
        stages: [{ words: fallbackSet, completedWordIndices: [], targetWordIndex: 0 }] 
      }));
    }
  }, [pendingWordsCount]);

  useEffect(() => {
    startNewGame();
  }, []);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'de-DE';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
  };

  const setupCurrentWord = useCallback(() => {
    if (gameState.gameStatus !== 'playing' || gameState.stages.length === 0) return;
    const currentStage = gameState.stages[gameState.currentStageIndex];
    if (!currentStage) return;
    const targetWordIdx = currentStage.targetWordIndex ?? 0;
    const currentWord = currentStage.words[targetWordIdx];
    if (!currentWord) return;

    setPlacedSyllables({
      left: gameState.gameMode === 'left-filled' ? currentWord.syllables[0] : null,
      right: gameState.gameMode === 'right-filled' ? currentWord.syllables[1] : null
    });

    const leftPieces: any[] = [];
    const rightPieces: any[] = [];

    currentStage.words.forEach((word, wordIdx) => {
      if (currentStage.completedWordIndices.includes(wordIdx)) return;
      word.syllables.forEach((text, sylIdx) => {
        const isLeft = sylIdx === 0;
        if (wordIdx === targetWordIdx) {
          if (isLeft && gameState.gameMode === 'left-filled') return;
          if (!isLeft && gameState.gameMode === 'right-filled') return;
        }
        const piece = {
          id: `syl-${wordIdx}-${sylIdx}-${Math.random()}`,
          text,
          type: isLeft ? 'left' : 'right',
          color: COLORS[wordIdx % COLORS.length],
          wordIdx,
          x: 10 + Math.random() * 50, 
          y: 5 + (wordIdx * (80 / gameState.wordsPerStage)),
          rotation: (Math.random() - 0.5) * 8
        };
        if (isLeft) leftPieces.push(piece);
        else rightPieces.push(piece);
      });
    });

    setScrambledSyllables([...leftPieces, ...rightPieces].sort(() => Math.random() - 0.5));
    if (!processingComplete.current) speak(currentWord.fullWord);
    processingComplete.current = false;
  }, [gameState.currentStageIndex, gameState.gameStatus, gameState.stages, gameState.gameMode, gameState.wordsPerStage]);

  useEffect(() => {
    setupCurrentWord();
  }, [gameState.currentStageIndex, gameState.gameStatus, gameState.gameMode, setupCurrentWord]);

  const handleDrop = (targetType: 'left' | 'right') => {
    if (isDragging === null || processingComplete.current) return;
    const draggingSyllable = scrambledSyllables.find(s => s.id === isDragging);
    if (!draggingSyllable) return;

    const currentStage = gameState.stages[gameState.currentStageIndex];
    const targetWordIdx = currentStage.targetWordIndex ?? 0;
    const currentWord = currentStage.words[targetWordIdx];

    const isCorrect = (targetType === 'left' && currentWord.syllables[0] === draggingSyllable.text) ||
                      (targetType === 'right' && currentWord.syllables[1] === draggingSyllable.text);

    if (isCorrect) {
      const newPlaced = { ...placedSyllables, [targetType]: draggingSyllable.text };
      setPlacedSyllables(newPlaced);
      setScrambledSyllables(prev => prev.filter(s => s.id !== isDragging));
      if (newPlaced.left && newPlaced.right) completeWord(targetWordIdx);
    }
    setIsDragging(null);
  };

  const completeWord = (wordIdx: number) => {
    if (processingComplete.current) return;
    processingComplete.current = true;
    const currentStage = gameState.stages[gameState.currentStageIndex];
    speak(currentStage.words[wordIdx].fullWord);
    setShowWordSuccess(true);

    setTimeout(() => {
      setShowWordSuccess(false);
      const nextWordIdx = wordIdx + 1;
      setGameState(prev => {
        const newStages = prev.stages.map((stage, idx) => {
          if (idx === prev.currentStageIndex) {
            return {
              ...stage,
              completedWordIndices: [...stage.completedWordIndices, wordIdx],
              targetWordIndex: nextWordIdx < prev.wordsPerStage ? nextWordIdx : stage.targetWordIndex
            };
          }
          return stage;
        });
        const isStageFinished = nextWordIdx >= prev.wordsPerStage;
        return { ...prev, stages: newStages, gameStatus: isStageFinished ? 'stage-complete' : 'playing' };
      });
    }, 1200);
  };

  const handleUpdateWordsCount = (delta: number) => {
    const nextValue = Math.max(2, Math.min(8, pendingWordsCount + delta));
    if (nextValue === pendingWordsCount) return;
    setPendingWordsCount(nextValue);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      startNewGame(nextValue);
      debounceTimerRef.current = null;
    }, 1200); 
  };

  const handleModeChange = (mode: GameMode) => {
    setGameState(prev => ({ ...prev, gameMode: mode }));
  };

  if (gameState.gameStatus === 'loading') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold text-blue-900 animate-pulse">Wörter werden vorbereitet...</p>
      </div>
    );
  }

  const currentStageInfo = gameState.stages[gameState.currentStageIndex];
  
  if (!currentStageInfo && gameState.gameStatus === 'playing') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-900 mb-2">Ups, da ist etwas schiefgelaufen.</h2>
        <button onClick={() => startNewGame()} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Nochmal versuchen</button>
      </div>
    );
  }

  const currentTargetIdx = currentStageInfo?.targetWordIndex ?? 0;
  const seamOverlap = 80 * gameState.pieceScale;
  const totalPuzzleWidth = (400 * gameState.pieceScale) - seamOverlap;

  return (
    <div className="h-screen w-screen flex flex-col bg-blue-50 overflow-hidden font-sans no-select">
      <header className="bg-white border-b-2 border-blue-100 px-6 py-3 flex justify-between items-center z-20 shadow-md shrink-0">
        <div className="flex items-center gap-2">
          {gameState.stages.map((_, idx) => (
            <div key={idx} className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all ${gameState.currentStageIndex === idx ? 'bg-blue-600 text-white scale-110 shadow-md' : idx < gameState.currentStageIndex ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
              {idx + 1}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6">
          {/* Schwierigkeits-Modus-Wähler */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-[1.25rem] border border-slate-200">
            {(['both-empty', 'left-filled', 'right-filled'] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`
                  relative px-4 py-2 rounded-xl transition-all duration-300 
                  ${gameState.gameMode === m 
                    ? 'bg-white shadow-lg scale-105 border border-blue-100' 
                    : 'hover:bg-white/50 border border-transparent'}
                  active:scale-95
                `}
                title={m === 'both-empty' ? 'Beide Silben finden' : m === 'left-filled' ? 'Zweite Silbe finden' : 'Erste Silbe finden'}
              >
                <ModeIcon mode={m} active={gameState.gameMode === m} />
                {gameState.gameMode === m && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
            <HorizontalLines count={2} />
            <button onClick={() => handleUpdateWordsCount(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1" disabled={pendingWordsCount <= 2}>
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center min-w-[30px]">
              <span className={`text-2xl font-black transition-colors leading-none ${pendingWordsCount !== gameState.wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                {pendingWordsCount}
              </span>
            </div>
            <button onClick={() => handleUpdateWordsCount(1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1" disabled={pendingWordsCount >= 8}>
              <Plus className="w-5 h-5" />
            </button>
            <HorizontalLines count={5} />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 px-4 py-1.5 rounded-2xl border border-gray-200">
            <Maximize2 className="w-4 h-4 text-blue-400" />
            <input type="range" min="0.7" max="1.3" step="0.1" value={gameState.pieceScale} onChange={(e) => setGameState(prev => ({ ...prev, pieceScale: parseFloat(e.target.value) }))} className="w-20 h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
          <button onClick={() => window.confirm("Neu starten?") && startNewGame()} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        {/* Links */}
        <div className="w-1/4 relative border-r border-blue-50 bg-white/20 shrink-0 overflow-hidden">
          {scrambledSyllables.filter(s => s.type === 'left').map(s => (
            <div key={s.id} className="absolute transition-transform hover:scale-110 active:scale-95" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.rotation}deg)`, zIndex: isDragging === s.id ? 100 : 10 }}>
              <PuzzlePiece label={s.text} type="left" colorClass={s.color} scale={gameState.pieceScale} onDragStart={() => setIsDragging(s.id)} isDragging={isDragging === s.id} />
            </div>
          ))}
        </div>

        {/* Zentrum */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
          <button onClick={() => currentStageInfo?.words[currentTargetIdx] && speak(currentStageInfo.words[currentTargetIdx].fullWord)} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all ring-8 ring-white/50 mb-10 shrink-0">
            <Volume2 className="w-8 h-8 text-white" />
          </button>

          <div className="relative p-12 bg-white/50 rounded-[3rem] border-2 border-white/80 shadow-inner flex items-center justify-center overflow-visible">
            <div 
              className="relative flex items-center justify-center overflow-visible" 
              style={{ 
                width: `${totalPuzzleWidth}px`, 
                height: `${110 * gameState.pieceScale}px` 
              }}
            >
              {['left', 'right'].map((type: any) => (
                <div key={type} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(type)} className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center overflow-visible" style={{ width: `${200 * gameState.pieceScale}px`, height: `${110 * gameState.pieceScale}px`, left: type === 'left' ? 0 : 'auto', right: type === 'right' ? 0 : 'auto', zIndex: type === 'left' ? 2 : 1 }}>
                  <PuzzlePiece label="" type={type} colorClass="" scale={gameState.pieceScale} isGhost={true} className="absolute inset-0 z-0" />
                  {placedSyllables[type as keyof typeof placedSyllables] && (
                    <PuzzlePiece label={placedSyllables[type as keyof typeof placedSyllables]!} type={type} colorClass={COLORS[currentTargetIdx % COLORS.length]} scale={gameState.pieceScale} className="relative z-10" showSeamLine={true} />
                  )}
                </div>
              ))}
            </div>
            
            <div className={`absolute transition-all duration-500 ease-out z-30 pointer-events-none ${showWordSuccess ? 'scale-125 opacity-100 translate-x-8' : 'scale-0 opacity-0 translate-x-0'}`} style={{ left: '100%', top: '50%', transform: 'translateY(-50%)' }}>
              <CheckCircle2 className="text-emerald-500 drop-shadow-2xl" style={{ width: `${80 * gameState.pieceScale}px`, height: `${80 * gameState.pieceScale}px` }} />
            </div>
          </div>

          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.8em] mt-10 shrink-0">Silben zusammenfügen</p>
        </div>

        {/* Rechts */}
        <div className="w-1/4 relative border-l border-blue-50 bg-white/20 shrink-0 overflow-hidden">
          {scrambledSyllables.filter(s => s.type === 'right').map(s => (
            <div key={s.id} className="absolute transition-transform hover:scale-110 active:scale-95" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.rotation}deg)`, zIndex: isDragging === s.id ? 100 : 10 }}>
              <PuzzlePiece label={s.text} type="right" colorClass={s.color} scale={gameState.pieceScale} onDragStart={() => setIsDragging(s.id)} isDragging={isDragging === s.id} />
            </div>
          ))}
        </div>
      </main>

      {gameState.gameStatus === 'stage-complete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in duration-300">
            <Smile className="w-16 h-16 text-emerald-600 mb-6" />
            <h2 className="text-3xl font-black text-slate-900 mb-2">Super!</h2>
            <p className="text-slate-500 mb-8 font-medium">Level geschafft.</p>
            <button onClick={() => setGameState(prev => ({...prev, currentStageIndex: prev.currentStageIndex + 1, gameStatus: 'playing'}))} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg">
              Weiter <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
