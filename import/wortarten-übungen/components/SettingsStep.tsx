
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Plus, RotateCcw, AlertTriangle, ArrowRight, ChevronDown, ChevronRight, Layers, Type, Scissors, BookA } from 'lucide-react';
import { 
    getStoredSuffixes, saveSuffixes, resetSuffixes,
    getStoredPrefixes, savePrefixes, resetPrefixes,
    getStoredVowels, saveVowels, resetVowels,
    getStoredConsonants, saveConsonants, resetConsonants,
    getStoredOverrides, saveOverride, removeOverride, SplitOverrides 
} from '../services/settings';

interface SettingsStepProps {
  onBack: () => void;
}

// --- Helper Component for List Management ---
interface ListManagerProps {
    title: string;
    description: string;
    items: string[];
    onAdd: (item: string) => void;
    onRemove: (item: string) => void;
    onReset: () => void;
    placeholder: string;
    icon: React.ReactNode;
    colorClass: string;
}

const ListManager: React.FC<ListManagerProps> = ({ title, description, items, onAdd, onRemove, onReset, placeholder, icon, colorClass }) => {
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleAdd = () => {
        if (input.trim()) {
            onAdd(input.trim().toLowerCase());
            setInput('');
        }
    };

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass} text-white`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{title}</h3>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{items.length} Einträge</div>
                    </div>
                </div>
                {isOpen ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
            </button>
            
            {isOpen && (
                <div className="p-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500 mb-4">{description}</p>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder={placeholder}
                            className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <button onClick={handleAdd} disabled={!input.trim()} className="bg-slate-800 text-white px-4 rounded-lg font-bold hover:bg-slate-900 disabled:opacity-50">
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto mb-4">
                        {items.map(item => (
                            <div key={item} className="bg-white border border-slate-200 shadow-sm px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                                <span className="font-medium text-slate-700">{item}</span>
                                <button onClick={() => onRemove(item)} className="text-slate-300 hover:text-red-500"><XIcon size={14}/></button>
                            </div>
                        ))}
                    </div>

                    <button onClick={onReset} className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 mt-2">
                        <RotateCcw size={12} /> Standard wiederherstellen
                    </button>
                </div>
            )}
        </div>
    );
};

const SettingsStep: React.FC<SettingsStepProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'suffixes' | 'overrides'>('rules');
  
  // Lists State
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [vowels, setVowels] = useState<string[]>([]);
  const [consonants, setConsonants] = useState<string[]>([]);
  const [suffixes, setSuffixes] = useState<string[]>([]);

  // Override State
  const [overrides, setOverrides] = useState<SplitOverrides>({});
  const [newOverrideWord, setNewOverrideWord] = useState('');
  const [newOverridePrefix, setNewOverridePrefix] = useState('');

  useEffect(() => {
    setPrefixes(getStoredPrefixes());
    setVowels(getStoredVowels());
    setConsonants(getStoredConsonants());
    setSuffixes(getStoredSuffixes());
    setOverrides(getStoredOverrides());
  }, []);

  // --- Handlers ---
  const createHandler = (
      getter: () => string[], 
      setter: React.Dispatch<React.SetStateAction<string[]>>, 
      saver: (l: string[]) => void, 
      resetter: () => void
  ) => {
      return {
          add: (item: string) => {
              if (item && !getter().includes(item)) {
                  // Sortieren sicherstellen für konsistente Anzeige
                  const updated = [...getter(), item].sort((a, b) => a.localeCompare(b));
                  setter(updated);
                  saver(updated);
              }
          },
          remove: (item: string) => {
              const updated = getter().filter(i => i !== item);
              setter(updated);
              saver(updated);
          },
          reset: () => {
              if (confirm('Wirklich auf Standard zurücksetzen?')) {
                  resetter();
                  // Defaults neu laden (getStored... liefert defaults wenn leer, jetzt alphabetisch sortiert)
                  // Da resetter() den Speicher löscht, liefert der nächste getter() Aufruf die (sortierten) Defaults.
                  // Wir müssen aber aufpassen: getter() liest frisch aus dem Store.
                  // resetter() löscht den Key. getter() holt defaults.
                  // Wir simulieren hier den "frischen" State.
                  // Da getter() eine Funktion ist die getStoredX aufruft:
                  setter(getter()); 
              }
          }
      };
  };

  const prefixHandler = createHandler(getStoredPrefixes, setPrefixes, savePrefixes, resetPrefixes);
  const vowelHandler = createHandler(getStoredVowels, setVowels, saveVowels, resetVowels);
  const consonantHandler = createHandler(getStoredConsonants, setConsonants, saveConsonants, resetConsonants);
  const suffixHandler = createHandler(getStoredSuffixes, setSuffixes, saveSuffixes, resetSuffixes);

  // --- Override Handlers ---
  const handleAddOverride = () => {
      if (newOverrideWord && newOverridePrefix) {
          const w = newOverrideWord.trim();
          const p = newOverridePrefix.trim();
          
          if (!w.toLowerCase().startsWith(p.toLowerCase())) {
              alert('Der Anfang muss Teil des Wortes sein!');
              return;
          }
          saveOverride(w, p);
          setOverrides(getStoredOverrides());
          setNewOverrideWord('');
          setNewOverridePrefix('');
      }
  };

  const handleRemoveOverride = (word: string) => {
      removeOverride(word);
      setOverrides(getStoredOverrides());
  };

  const sortedOverrides = Object.entries(overrides).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100 min-h-[700px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Einstellungen</h2>
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 p-2">
            <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex gap-2 sm:gap-6 mb-6 border-b border-slate-200 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-2 sm:px-4 font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'rules' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Wort-Bausteine
          </button>
          <button 
            onClick={() => setActiveTab('suffixes')}
            className={`pb-3 px-2 sm:px-4 font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'suffixes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Endungen (Puzzle)
          </button>
          <button 
            onClick={() => setActiveTab('overrides')}
            className={`pb-3 px-2 sm:px-4 font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'overrides' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Ausnahmen
          </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
          
          {/* --- TAB: RULES (Prefixes, Vowels, Consonants) --- */}
          {activeTab === 'rules' && (
              <div className="flex flex-col gap-2">
                  <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-sm text-indigo-800 border border-indigo-100 flex gap-2">
                      <AlertTriangle size={20} className="shrink-0"/>
                      <div>
                          Diese Bausteine werden verwendet, um Wörter zu analysieren und zu trennen (z.B. in der Übung "Verben verlängern").
                      </div>
                  </div>

                  <ListManager 
                      title="Vorsilben"
                      description="Wird für die Trennung bei 'Verben verlängern' genutzt. Erkennt das Verb diese Vorsilbe, wird sie plus der folgende Konsonant abgetrennt (z.B. 'ver-kaufen' -> 'verk')."
                      items={prefixes}
                      onAdd={prefixHandler.add}
                      onRemove={prefixHandler.remove}
                      onReset={prefixHandler.reset}
                      placeholder="z.B. ent, zer, miss"
                      icon={<Scissors size={20}/>}
                      colorClass="bg-indigo-500"
                  />

                  <ListManager 
                      title="Vokalverbindungen"
                      description="Spezielle Verbindungen von Vokalen, die als Einheit betrachtet werden."
                      items={vowels}
                      onAdd={vowelHandler.add}
                      onRemove={vowelHandler.remove}
                      onReset={vowelHandler.reset}
                      placeholder="z.B. ei, au"
                      icon={<Type size={20}/>}
                      colorClass="bg-pink-500"
                  />

                  <ListManager 
                      title="Konsonantenverbindungen"
                      description="Spezielle Verbindungen von Konsonanten."
                      items={consonants}
                      onAdd={consonantHandler.add}
                      onRemove={consonantHandler.remove}
                      onReset={consonantHandler.reset}
                      placeholder="z.B. sch, ck"
                      icon={<BookA size={20}/>}
                      colorClass="bg-orange-500"
                  />
              </div>
          )}

          {/* --- TAB: SUFFIXES --- */}
          {activeTab === 'suffixes' && (
              <div>
                  <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 border border-blue-100 flex gap-2">
                      <AlertTriangle size={20} className="shrink-0"/>
                      <div>
                          Diese Endungen werden in <strong>Puzzle-Übungen</strong> automatisch vom Wortende abgetrennt (z.B. "End<i>ung</i>").
                      </div>
                  </div>
                  
                  <ListManager 
                      title="Puzzle-Endungen"
                      description="Liste der erkannten Endungen."
                      items={suffixes}
                      onAdd={suffixHandler.add}
                      onRemove={suffixHandler.remove}
                      onReset={suffixHandler.reset}
                      placeholder="Neue Endung (z.B. 'heit')"
                      icon={<Layers size={20}/>}
                      colorClass="bg-blue-500"
                  />
              </div>
          )}

          {/* --- TAB: OVERRIDES --- */}
          {activeTab === 'overrides' && (
              <div>
                  <div className="bg-emerald-50 p-4 rounded-lg mb-6 text-sm text-emerald-800 border border-emerald-100 flex gap-2">
                      <AlertTriangle size={20} className="shrink-0"/>
                      <div>
                          Definiere hier <strong>feste Trennungen</strong> für Wörter, bei denen die Automatik nicht das gewünschte Ergebnis liefert.
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Volles Wort</label>
                          <input 
                            value={newOverrideWord}
                            onChange={e => setNewOverrideWord(e.target.value)}
                            placeholder="z.B. hilft"
                            className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-emerald-500 mb-4"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Gewünschter Anfang</label>
                          <div className="flex gap-2">
                            <input 
                                value={newOverridePrefix}
                                onChange={e => setNewOverridePrefix(e.target.value)}
                                placeholder="z.B. hi"
                                className="flex-1 p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                            />
                            <button onClick={handleAddOverride} disabled={!newOverrideWord || !newOverridePrefix} className="bg-emerald-600 text-white px-4 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50">
                                Speichern
                            </button>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">Gespeicherte Ausnahmen</h3>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{sortedOverrides.length} Einträge</span>
                  </div>
                  
                  {sortedOverrides.length === 0 ? (
                      <div className="text-slate-400 text-sm italic">Keine Ausnahmen definiert.</div>
                  ) : (
                      <div className="space-y-2">
                          {sortedOverrides.map(([word, prefix]: [string, string]) => (
                              <div key={word} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group hover:border-emerald-300 transition-colors">
                                  <div className="flex items-center gap-4 flex-1">
                                      <div className="w-32 font-bold text-slate-800 shrink-0 truncate" title={word}>{word}</div>
                                      <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
                                      <div className="flex font-mono text-lg">
                                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-l border border-emerald-100 border-r-0 group-hover:border-emerald-200 transition-colors">
                                            {prefix}
                                          </span>
                                          <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded-r border border-slate-200 border-l-0 group-hover:border-emerald-200 transition-colors">
                                            {word.substring(prefix.length)}
                                          </span>
                                      </div>
                                  </div>
                                  <button onClick={() => handleRemoveOverride(word)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

// Helper Icon for this component
const XIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default SettingsStep;
