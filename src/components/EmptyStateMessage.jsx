import React from 'react';
import { Icons } from './Icons';

export const EmptyStateMessage = ({ onClose, IconComponent = Icons.SelectionHint, title = "Bitte markiere zuerst Wörter im Text!", firstStepText = "Grauen Kasten wählen!", secondStepText = "Wörter markieren.", steps = null }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-xl border-2 border-slate-100 max-w-lg w-full font-sans">

            <div className="text-center space-y-4 mb-10">
                {IconComponent && (
                    <div className="flex justify-center mb-6">
                        <IconComponent size={160} className="text-slate-800" />
                    </div>
                )}
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {title}
                </h3>

                <div className="flex flex-col items-start gap-4 text-slate-500 font-medium text-lg text-left">
                    {steps ? (
                        steps.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                {step.text.startsWith('(') ? (
                                    // Optional/Ghosted Step
                                    <div className="flex items-center gap-3 opacity-50">
                                        <div className="w-6 h-6 shrink-0" /> {/* Spacer for number */}
                                        <span>{step.text}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold shrink-0">{idx + 1}</span>
                                        <span className="flex-1">{step.text}</span>
                                        {step.icon && <step.icon size={64} className="shrink-0 ml-auto" />}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="flex items-start gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0 mt-1">1</span>
                                <span>{firstStepText}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0 mt-1">2</span>
                                <span>{secondStepText}</span>
                            </div>
                        </>
                    )}
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
