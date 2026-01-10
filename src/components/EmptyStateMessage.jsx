import React from 'react';
import { Icons } from './Icons';

export const EmptyStateMessage = ({ onClose, secondStepText = "Wörter markieren." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-xl border-2 border-slate-100 max-w-lg w-full">
            <div className="mb-8">
                <Icons.HandInstruction size={120} />
            </div>

            <div className="text-center space-y-4 mb-10">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    Bitte markiere zuerst Wörter im Text!
                </h3>

                <div className="flex flex-col items-center gap-3 text-slate-500 font-medium text-lg">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                        <span>Grauen Kasten wählen</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
                        <span>{secondStepText}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={onClose}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
                Verstanden
            </button>
        </div>
    );
};
