import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

export const SettingsModal = ({ settings, setSettings, onExport, onImport, logo, setLogo, onClose, onClearHighlights, onPrint, onShowQR }) => {
    const fileInputRef = useRef(null);
    const [printType, setPrintType] = useState('text');

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogo(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleImportClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => onImport(ev.target.result);
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const fonts = [
        { name: "Patrick Hand", val: "'Patrick Hand', cursive" },
        { name: "Comic Sans", val: "'Comic Sans MS', cursive" },
        { name: "Mali", val: "'Mali', cursive" },
        { name: "Andika", val: "'Andika', sans-serif" },
        { name: "Open Sans", val: "'Open Sans', sans-serif" }
    ];

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden modal-animate border border-slate-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Icons.Settings className="text-slate-500" /> Einstellungen
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors min-touch-target" title="Schließen (Esc)">
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-10">

                    {/* 1. OPTIK & LAYOUT */}
                    <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                            1. Optik & Layout
                        </h3>

                        <div className="space-y-8">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Logo / Schul-Header</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden transition-all hover:border-blue-400">
                                        {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <Icons.Image className="text-slate-300" />}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => fileInputRef.current.click()} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition min-touch-target">Datei wählen...</button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                        {logo && <button onClick={() => setLogo(null)} className="text-red-500 text-xs font-bold hover:underline py-1 w-fit">Bild löschen</button>}
                                    </div>
                                </div>
                            </div>

                            {/* Font Picker */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Schriftart</label>
                                <div className="relative group">
                                    <select
                                        value={settings.fontFamily}
                                        onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-200 text-slate-800 text-base font-bold rounded-2xl p-4 pr-10 outline-none hover:border-blue-400 transition-all cursor-pointer appearance-none"
                                        style={{ fontFamily: settings.fontFamily }}
                                    >
                                        {fonts.map(f => (
                                            <option key={f.val} value={f.val}>{f.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <Icons.ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Text Sliders */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Schriftart Größe</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{settings.fontSize}px</span>
                                    </label>
                                    <div className="flex items-center gap-3 px-1">
                                        <span className="text-[10px] font-bold text-slate-400">A</span>
                                        <input type="range" min="16" max="80" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="flex-1 accent-blue-600 h-1.5 bg-slate-100 rounded-full cursor-pointer" />
                                        <span className="text-lg font-bold text-slate-400">A</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Zeilenabstand</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{settings.lineHeight.toFixed(1)}</span>
                                    </label>
                                    <div className="flex items-center gap-3 px-1">
                                        <Icons.AlignLeft size={16} className="text-slate-300" />
                                        <input type="range" min="1.1" max="4.0" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })} className="flex-1 accent-blue-600 h-1.5 bg-slate-100 rounded-full cursor-pointer" />
                                        <Icons.AlignJustify size={16} className="text-slate-300" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Wortabstand</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{settings.wordSpacing.toFixed(1)}</span>
                                    </label>
                                    <div className="flex items-center gap-3 px-1">
                                        <span className="text-[10px] font-bold text-slate-400">↔</span>
                                        <input type="range" min="0" max="2.5" step="0.1" value={settings.wordSpacing} onChange={(e) => setSettings({ ...settings, wordSpacing: parseFloat(e.target.value) })} className="flex-1 accent-blue-600 h-1.5 bg-slate-100 rounded-full cursor-pointer" />
                                        <span className="text-sm font-bold text-slate-400">↔</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Textbreite</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{settings.textWidth}%</span>
                                    </label>
                                    <div className="flex items-center gap-3 px-1">
                                        <Icons.Minimize2 size={16} className="text-slate-300" />
                                        <input type="range" min="40" max="100" step="1" value={settings.textWidth} onChange={(e) => setSettings({ ...settings, textWidth: parseInt(e.target.value) })} className="flex-1 accent-blue-600 h-1.5 bg-slate-100 rounded-full cursor-pointer" />
                                        <Icons.Maximize2 size={16} className="text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            {/* Syllable Display */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Silben-Darstellung</label>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                                    <button
                                        onClick={() => setSettings({ ...settings, visualType: 'block' })}
                                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all min-touch-target ${settings.visualType === 'block' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Boxen
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, visualType: 'arc' })}
                                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all min-touch-target ${settings.visualType === 'arc' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Bögen
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, visualType: 'black_gray' })}
                                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all min-touch-target ${settings.visualType === 'black_gray' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        s/w/g
                                    </button>
                                </div>
                            </div>

                            {/* Syllable Visibility */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Wann werden Silben angezeigt?</label>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                                    <button
                                        onClick={() => setSettings({ ...settings, displayTrigger: 'always' })}
                                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all min-touch-target ${settings.displayTrigger === 'always' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Immer (Alle Wörter)
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, displayTrigger: 'click' })}
                                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all min-touch-target ${settings.displayTrigger === 'click' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Nur beim Antippen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. ARBEITSWEISE */}
                    <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                            2. Arbeitsweise <span className="text-[10px] lowercase font-normal ml-2 tracking-normal text-slate-400">(Was passiert beim Antippen?)</span>
                        </h3>

                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
                            <p className="text-xs font-bold text-blue-700 leading-relaxed flex items-center gap-2">
                                <Icons.Info size={16} /> Hinweis: "Nur Wörter, die markiert werden, landen in den Übungen!"
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Interaction Mode */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700">Klick-Modus</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setSettings({ ...settings, clickAction: 'yellow_border' })}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 min-touch-target ${settings.clickAction === 'yellow_border' ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${settings.clickAction === 'yellow_border' ? 'border-blue-600' : 'border-slate-300'}`}>
                                            {settings.clickAction === 'yellow_border' && <div className="w-3 h-3 bg-blue-600 rounded-full animate-popIn"></div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">Standard: Gelb markieren</div>
                                            <div className="text-xs text-slate-500">Ideal für Puzzle & Wortwolke</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setSettings({ ...settings, clickAction: 'light_blue' })}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 min-touch-target ${settings.clickAction === 'light_blue' ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${settings.clickAction === 'light_blue' ? 'border-blue-600' : 'border-slate-300'}`}>
                                            {settings.clickAction === 'light_blue' && <div className="w-3 h-3 bg-blue-600 rounded-full animate-popIn"></div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">Tuschkasten: Bunt färben</div>
                                        </div>
                                    </button>
                                </div>

                            </div>

                            {/* Switches */}
                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                            <Icons.MagicWand size={18} className="text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">Intelligente Auswahl <span className="text-[10px] font-normal block text-slate-400">(Buchstabenverbindungen zusammenfassen: ei, sp, ...)</span></div>
                                    </div>
                                    <button onClick={() => setSettings({ ...settings, smartSelection: !settings.smartSelection })} className={`w-14 h-7 rounded-full p-1 transition-all min-touch-target ${settings.smartSelection ? 'bg-green-500' : 'bg-slate-200'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.smartSelection ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                    </button>
                                </label>

                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                            <Icons.ZoomIn size={18} className="text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">Markierte Wörter vergrößern</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {settings.zoomActive && (
                                            <div className="flex items-center gap-2 animate-fadeIn">
                                                <input
                                                    type="range"
                                                    min="1.1"
                                                    max="1.5"
                                                    step="0.05"
                                                    value={settings.zoomScale || 1.2}
                                                    onChange={(e) => setSettings({ ...settings, zoomScale: parseFloat(e.target.value) })}
                                                    className="w-20 accent-blue-600 h-1.5 bg-slate-200 rounded-full cursor-pointer"
                                                />
                                                <span className="text-[10px] font-black text-blue-600 min-w-[2.5em] text-center bg-blue-50 px-1.5 py-0.5 rounded-md">x{settings.zoomScale?.toFixed(1) || '1.2'}</span>
                                            </div>
                                        )}
                                        <button onClick={() => setSettings({ ...settings, zoomActive: !settings.zoomActive })} className={`w-14 h-7 rounded-full p-1 transition-all min-touch-target ${settings.zoomActive ? 'bg-green-500' : 'bg-slate-200'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.zoomActive ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                </label>

                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                            <Icons.Lock size={18} className="text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">Scroll-Sperre <span className="text-[10px] font-normal block text-slate-400">(Lesemodus / Smartboard)</span></div>
                                    </div>
                                    <button onClick={() => setSettings({ ...settings, lockScroll: !settings.lockScroll })} className={`w-14 h-7 rounded-full p-1 transition-all min-touch-target ${settings.lockScroll ? 'bg-green-500' : 'bg-slate-200'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.lockScroll ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                    </button>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* 3. VERWALTUNG */}
                    <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                            3. Verwaltung <span className="text-[10px] lowercase font-normal ml-2 tracking-normal text-slate-400">(Speichern & Teilen)</span>
                        </h3>

                        <div className="space-y-6">
                            {/* QR & Sync */}
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={onShowQR} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-95 min-touch-target">
                                    <Icons.QrCode size={22} /> QR-Code / Link generieren
                                </button>
                                <div className="flex gap-4">
                                    <button onClick={onExport} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 font-bold flex items-center justify-center gap-2 transition-all min-touch-target">
                                        <Icons.Download size={20} /> Speichern
                                    </button>
                                    <button onClick={handleImportClick} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 font-bold flex items-center justify-center gap-2 transition-all min-touch-target">
                                        <Icons.Upload size={20} /> Laden
                                    </button>
                                </div>
                            </div>

                            {/* Printing */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700">Drucken</label>
                                <div className="flex gap-2">
                                    <select
                                        value={printType}
                                        onChange={(e) => setPrintType(e.target.value)}
                                        className="flex-1 bg-white border-2 border-slate-200 text-slate-800 text-sm font-black rounded-xl p-3 outline-none focus:border-blue-500 cursor-pointer min-touch-target"
                                    >
                                        <option value="text">Text (Standard)</option>
                                        <option value="list">Liste / Tabelle</option>
                                        <option value="carpet">Silbenteppich</option>
                                    </select>
                                    <button onClick={() => onPrint(printType)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 flex items-center justify-center transition shadow-sm min-touch-target" title="Drucken">
                                        <Icons.Printer size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Camera Toggle */}
                            <div className="pt-4 border-t border-slate-50">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                            <Icons.Camera size={18} className="text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">Kamera-Import Button anzeigen</div>
                                    </div>
                                    <button onClick={() => setSettings({ ...settings, enableCamera: !settings.enableCamera })} className={`w-14 h-7 rounded-full p-1 transition-all min-touch-target ${settings.enableCamera ? 'bg-green-500' : 'bg-slate-200'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.enableCamera ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                    </button>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer Button (Touch-optimized) */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 min-touch-target"
                    >
                        FERTIG / SCHLIESSEN
                    </button>
                </div>
            </div>
        </div>
    );
};
