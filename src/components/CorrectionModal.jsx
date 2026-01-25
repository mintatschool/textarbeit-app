import React, { useState } from 'react';
import { Icons } from './Icons';

export const CorrectionModal = ({ word, currentSyllables, onSave, onClose, font }) => {
    const fullWord = currentSyllables.join('');
    const initialSplits = new Set();
    let acc = 0;
    for (let i = 0; i < currentSyllables.length - 1; i++) { acc += currentSyllables[i].length; initialSplits.add(acc - 1); }
    const [splits, setSplits] = useState(initialSplits);
    const toggleSplit = (index) => {
        const newSplits = new Set(splits);
        if (newSplits.has(index)) newSplits.delete(index); else newSplits.add(index);
        setSplits(newSplits);
    };
    const handleSave = () => {
        const newSyllables = [];
        let buffer = "";
        for (let i = 0; i < fullWord.length; i++) {
            buffer += fullWord[i];
            if (splits.has(i)) { newSyllables.push(buffer); buffer = ""; }
        }
        newSyllables.push(buffer);
        onSave(newSyllables);
    };
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 modal-animate flex flex-col h-[85vh] md:h-auto overflow-hidden">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2"><Icons.Edit3 className="text-blue-600" size={28} /> Silben anpassen</h2>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full min-touch-target"><Icons.X size={28} /></button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 relative overflow-y-auto custom-scroll">
                    <p className="text-slate-500 text-base mb-8 text-center px-4 mt-8">Tippe zwischen die Buchstaben, um die Trennung zu korrigieren.</p>
                    <div className="flex flex-wrap justify-center items-stretch select-none pb-20 px-4" style={{ fontFamily: font }}>
                        {fullWord.split('').map((char, i) => (
                            <React.Fragment key={i}>
                                <div className="text-3xl md:text-5xl font-bold text-slate-800 py-4">{char}</div>
                                {i < fullWord.length - 1 && (
                                    <div onClick={() => toggleSplit(i)} className="group relative w-12 md:w-20 cursor-pointer flex justify-center items-stretch hover:bg-black/5 rounded mx-1">
                                        <div className="relative w-full h-full flex justify-center items-center">
                                            <div className={`absolute w-1.5 h-3/4 bg-slate-300 rounded-full transition-all duration-200 ${splits.has(i) ? 'opacity-0' : 'opacity-30 group-hover:opacity-100'}`}></div>
                                            <div className={`absolute w-2 md:w-3 h-full bg-blue-600 rounded-full shadow-lg transition-all duration-300 transform origin-center ${splits.has(i) ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}></div>
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="mt-6 flex justify-center gap-4 border-t pt-4">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition min-touch-target">Abbrechen</button>
                    <button onClick={handleSave} className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition flex items-center gap-2 min-touch-target"><Icons.Check size={24} /> Übernehmen</button>
                </div>
            </div>
        </div>
    );
};
