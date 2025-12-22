import React from 'react';
import { Icons } from './Icons';

export const EmptyStateMessage = ({ onClose, title, message }) => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fadeIn">
        <div className="text-gray-300 mb-6"><Icons.Empty size={120} strokeWidth={1} /></div>
        <h2 className="text-3xl font-bold text-gray-400 mb-2">{title || "Hier ist noch nichts los."}</h2>
        <p className="text-xl text-gray-400 mb-8">{message || "Bitte markiere zuerst Wörter im Text."}</p>
        <button onClick={onClose} className="px-8 py-3 bg-gray-400 text-white rounded-xl font-bold hover:bg-gray-500 transition shadow-lg min-touch-target">Zurück zum Text</button>
    </div>
);
