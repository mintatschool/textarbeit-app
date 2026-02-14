
import React from 'react';
import { PenTool, Box, ArrowRight, ArrowLeft, Star } from 'lucide-react';
import { WordCategory } from '../types';

interface CategorySelectionStepProps {
  verbCount: number;
  nounCount: number;
  adjCount: number;
  onSelect: (category: WordCategory) => void;
  onBack: () => void;
}

const CategorySelectionStep: React.FC<CategorySelectionStepProps> = ({ verbCount, nounCount, adjCount, onSelect, onBack }) => {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Was möchtest du üben?</h2>
        <p className="text-slate-500 mt-2">Wähle eine Wortart aus deinem Text.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Verbs Option */}
        <button
          onClick={() => onSelect(WordCategory.VERB)}
          className="group relative p-6 rounded-2xl border-2 border-blue-100 hover:border-blue-500 bg-blue-50 hover:bg-white transition-all text-left flex flex-col gap-4 shadow-sm hover:shadow-md"
        >
          <div className="w-14 h-14 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <PenTool size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Verben</h3>
            <p className="text-sm text-slate-500 mt-1">Personalformen finden.</p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between text-blue-600 font-bold">
            <span>{verbCount} gefunden</span>
            <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Nouns Option */}
        <button
          onClick={() => onSelect(WordCategory.NOUN)}
          className="group relative p-6 rounded-2xl border-2 border-indigo-100 hover:border-indigo-500 bg-indigo-50 hover:bg-white transition-all text-left flex flex-col gap-4 shadow-sm hover:shadow-md"
        >
          <div className="w-14 h-14 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Box size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Substantive</h3>
            <p className="text-sm text-slate-500 mt-1">Artikel, Einzahl und Mehrzahl.</p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between text-indigo-600 font-bold">
            <span>{nounCount} gefunden</span>
            <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Adjectives Option */}
        <button
          onClick={() => onSelect(WordCategory.ADJECTIVE)}
          className="group relative p-6 rounded-2xl border-2 border-purple-100 hover:border-purple-500 bg-purple-50 hover:bg-white transition-all text-left flex flex-col gap-4 shadow-sm hover:shadow-md"
        >
          <div className="w-14 h-14 bg-purple-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Star size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Adjektive</h3>
            <p className="text-sm text-slate-500 mt-1">Steigerungsformen (Komparativ/Superlativ).</p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between text-purple-600 font-bold">
            <span>{adjCount} gefunden</span>
            <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      <div className="flex justify-start border-t border-slate-100 pt-6">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 font-medium transition-colors hover:bg-slate-50 rounded-lg">
          <ArrowLeft size={18} />
          Zurück zur Eingabe
        </button>
      </div>
    </div>
  );
};

export default CategorySelectionStep;
