
import React, { useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';

interface InputStepProps {
  onNext: (text: string) => void;
  isLoading: boolean;
}

const InputStep: React.FC<InputStepProps> = ({ onNext, isLoading }) => {
  const [text, setText] = useState('');

  const handleAnalyze = () => {
    if (text.trim().length > 0) {
      onNext(text);
    }
  };

  const loadExample = () => {
    setText("Gestern ging ich in den Park und sah einen Hund. Er spielte mit einem Ball und war sehr glücklich.");
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="flex flex-col items-center">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight flex items-end">
              Bitte warten
              <span className="ml-1 animate-[pulse_1.4s_infinite_0ms] text-blue-600 text-3xl leading-6">.</span>
              <span className="animate-[pulse_1.4s_infinite_200ms] text-blue-600 text-3xl leading-6">.</span>
              <span className="animate-[pulse_1.4s_infinite_400ms] text-blue-600 text-3xl leading-6">.</span>
            </h3>
          </div>
        </div>
      )}

      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
          <BookOpen size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Text eingeben</h2>
        <p className="text-slate-500 mt-2">
          Füge einen deutschen Text ein, aus dem du eine Übung erstellen möchtest.
        </p>
      </div>

      <textarea
        className="w-full h-40 p-4 bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-lg transition-all shadow-inner"
        placeholder="Schreibe oder kopiere deinen Text hier..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={loadExample}
          className="text-sm text-slate-400 hover:text-blue-500 underline transition-colors"
          disabled={isLoading}
        >
          Beispiel laden
        </button>

        <button
          onClick={handleAnalyze}
          disabled={text.trim().length === 0 || isLoading}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all transform hover:scale-105 active:scale-95 ${
            text.trim().length === 0 || isLoading
              ? 'bg-slate-300 cursor-not-allowed transform-none'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
        >
          Weiter zur Auswahl
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default InputStep;
