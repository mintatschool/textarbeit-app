import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

export const SettingsModal = ({ settings, setSettings, onExport, onImport, logo, setLogo, onClose, onClearHighlights, onPrint, onShowQR, onReset, activeView }) => {
    const fileInputRef = useRef(null);
    const [printType, setPrintType] = useState(() => {
        if (activeView === 'carpet') return 'carpet';
        if (activeView === 'list') return 'list';
        return 'text';
    });
    const [tableOrientation, setTableOrientation] = useState('landscape');
    const [showClusterManager, setShowClusterManager] = useState(false);
    const [newCluster, setNewCluster] = useState('');

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
        { name: "Comic Sans", val: "'Comic Neue', 'Comic Sans MS', cursive" },
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
                    <div className="flex gap-1">
                        <button onClick={onShowQR} className="p-3 hover:bg-slate-100 rounded-full transition-colors min-touch-target text-slate-500" title="QR-Code / Link generieren">
                            <Icons.Share size={24} />
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors min-touch-target" title="Schließen (Esc)">
                            <Icons.X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-10">

                    {/* 1. OPTIK & LAYOUT */}
                    <section>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 border-b-2 border-slate-100 pb-2">
                            1. Optik & Layout
                        </h3>

                        <div className="space-y-8">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Bild</label>
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden transition-all shrink-0 hover:border-blue-400">
                                        {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <Icons.Image className="text-slate-300" />}
                                    </div>
                                    <div className="flex flex-col gap-3 flex-1">
                                        <div className="flex gap-2">
                                            <button onClick={() => fileInputRef.current.click()} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition min-touch-target">Datei wählen...</button>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                            {logo && <button onClick={() => setLogo(null)} className="text-red-500 text-xs font-bold hover:underline py-1 w-fit">Bild löschen</button>}
                                        </div>

                                        {logo && (
                                            <div className="w-full max-w-[200px]">
                                                <label className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1">
                                                    <span>Größe (Bildschirm)</span>
                                                    <span>{settings.imageWidth || 15}%</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="33"
                                                    step="1"
                                                    value={settings.imageWidth || 15}
                                                    onChange={(e) => setSettings({ ...settings, imageWidth: parseInt(e.target.value) })}
                                                    className="w-full accent-blue-600 rounded-full cursor-pointer"
                                                />
                                            </div>
                                        )}
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
                                        <span className="text-sm font-bold text-slate-700">Zeilenabstand</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{settings.lineHeight.toFixed(1)}</span>
                                    </label>
                                    <div className="flex items-center gap-3 px-1">
                                        <input type="range" min="-0.5" max="2.5" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })} className="flex-1 accent-blue-600 rounded-full cursor-pointer" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Wortabstand</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{settings.wordSpacing.toFixed(1)}</span>
                                    </label>
                                    <div className="flex items-center gap-3 px-1">
                                        <input type="range" min="-0.3" max="1.5" step="0.1" value={settings.wordSpacing} onChange={(e) => setSettings({ ...settings, wordSpacing: parseFloat(e.target.value) })} className="flex-1 accent-blue-600 rounded-full cursor-pointer" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Buchstabenabstand</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{(settings.letterSpacing || 0).toFixed(2)}</span>
                                    </label>
                                    <div className="flex items-center gap-3 px-1">
                                        <input type="range" min="-0.1" max="0.5" step="0.01" value={settings.letterSpacing || 0} onChange={(e) => setSettings({ ...settings, letterSpacing: parseFloat(e.target.value) })} className="flex-1 accent-blue-600 rounded-full cursor-pointer" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Textbreite</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{settings.textWidth}%</span>
                                    </label>
                                    <div className="flex items-center gap-3 px-1">
                                        <input type="range" min="40" max="100" step="1" value={settings.textWidth} onChange={(e) => setSettings({ ...settings, textWidth: parseInt(e.target.value) })} className="flex-1 accent-blue-600 rounded-full cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            {/* Syllable Display */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Silben-Darstellung</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                    {[
                                        { id: 'none', label: 'Keine Silben' },
                                        { id: 'block', label: 'Boxen' },
                                        { id: 'arc', label: 'Bögen' },
                                        { id: 'black_gray', label: 'Schwarz/Grau' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSettings({ ...settings, visualType: opt.id })}
                                            className={`flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${settings.visualType === opt.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-100' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
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
                                        Immer (alle Wörter)
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, displayTrigger: 'click' })}
                                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all min-touch-target ${settings.displayTrigger === 'click' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        nur beim Markieren
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. BEDIENUNG */}
                    <section>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 border-b-2 border-slate-100 pb-2">
                            2. Bedienung
                        </h3>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                        <Icons.MagicWand size={18} className="text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <div className="text-sm font-bold text-slate-700">Buchstabenverbindungen statt Einzelbuchstaben markieren <span className="text-[10px] font-normal block text-slate-400">(z. B. ei, sp, ...)</span></div>
                                </div>
                                <button onClick={() => setSettings({ ...settings, smartSelection: !settings.smartSelection })} className={`w-14 h-7 rounded-full p-1 transition-all min-touch-target ${settings.smartSelection ? 'bg-green-500' : 'bg-slate-200'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.smartSelection ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                </button>
                            </label>

                            {settings.smartSelection && (
                                <button
                                    onClick={() => setShowClusterManager(true)}
                                    className="ml-11 flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors py-2 px-3 bg-blue-50 rounded-lg w-fit"
                                >
                                    <Icons.Plus size={16} /> Buchstabenverbindungen festlegen
                                </button>
                            )}

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
                                                className="w-20 accent-blue-600 rounded-full cursor-pointer"
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

                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                        <Icons.Layout size={18} className="text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <div className="text-sm font-bold text-slate-700">Menüleiste reduzieren</div>
                                </div>
                                <button onClick={() => setSettings({ ...settings, reduceMenu: !settings.reduceMenu })} className={`w-14 h-7 rounded-full p-1 transition-all min-touch-target ${settings.reduceMenu ? 'bg-green-500' : 'bg-slate-200'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.reduceMenu ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                </button>
                            </label>
                        </div>
                    </section>

                    {/* 3. VERWALTUNG */}
                    <section>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 border-b-2 border-slate-100 pb-2">
                            3. Verwaltung
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
                                        <Icons.Upload size={20} /> Datei öffnen
                                    </button>
                                </div>
                            </div>

                            {/* Printing */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Drucken</label>
                                <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
                                        <button
                                            onClick={() => onPrint(printType, (printType === 'list' || printType === 'carpet') ? { orientation: tableOrientation } : { orientation: 'auto' })}
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 flex items-center justify-center transition shadow-sm min-touch-target"
                                            title="Drucken"
                                        >
                                            <Icons.Printer size={22} />
                                        </button>
                                    </div>

                                    {(printType === 'list' || printType === 'carpet') && (
                                        <div className="flex items-center justify-between p-1 bg-slate-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
                                            <button
                                                onClick={() => setTableOrientation('portrait')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${tableOrientation === 'portrait' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <Icons.File className="rotate-0" size={16} /> Hochformat
                                            </button>
                                            <button
                                                onClick={() => setTableOrientation('landscape')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${tableOrientation === 'landscape' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <Icons.FileText className="rotate-0" size={16} /> Querformat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Camera Toggle */}
                            <div className="pt-4 border-t border-slate-50">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                            <Icons.Camera size={18} className="text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">Kamera-Import-Button</div>
                                    </div>
                                    <button onClick={() => setSettings({ ...settings, enableCamera: !settings.enableCamera })} className={`w-14 h-7 rounded-full p-1 transition-all min-touch-target ${settings.enableCamera ? 'bg-green-500' : 'bg-slate-200'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.enableCamera ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                    </button>
                                </label>
                            </div>

                            {/* Reset Button */}
                            <div className="pt-4 border-t border-slate-50 flex justify-center">
                                <button
                                    onClick={onReset}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                >
                                    <Icons.Trash2 size={16} /> Alle Einstellungen zurücksetzen
                                </button>
                            </div>

                            {/* Authorship Credit */}
                            <div className="flex justify-center pb-6 mt-4">
                                <span className="text-sm font-bold text-slate-400">
                                    Gestaltung & Programmierung: Peter Rogoll (KI-gestützt)
                                </span>
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
            </div >

            {/* Cluster Manager Overlay */}
            {showClusterManager && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowClusterManager(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-800">Buchstabenverbindungen</h3>
                            <button onClick={() => setShowClusterManager(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <Icons.X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scroll space-y-6">
                            {/* Add New Cluster */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCluster}
                                    onChange={(e) => setNewCluster(e.target.value.toLowerCase().replace(/[^a-zäöüß]/g, ''))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newCluster) {
                                            if (!settings.clusters.includes(newCluster)) {
                                                setSettings({ ...settings, clusters: [...settings.clusters, newCluster] });
                                            }
                                            setNewCluster('');
                                        }
                                    }}
                                    placeholder="z.B. qu, ie, sch"
                                    className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold outline-none focus:border-blue-500 transition-all"
                                    spellCheck={false}
                                />
                                <button
                                    onClick={() => {
                                        if (newCluster && !settings.clusters.includes(newCluster)) {
                                            setSettings({ ...settings, clusters: [...settings.clusters, newCluster] });
                                            setNewCluster('');
                                        }
                                    }}
                                    disabled={!newCluster}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 font-bold transition-all flex items-center gap-2"
                                >
                                    <Icons.Plus size={18} /> Hinzufügen
                                </button>
                            </div>

                            {/* Existing Clusters */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {settings.clusters.map(cluster => (
                                    <div key={cluster} className="group relative">
                                        <div className="bg-slate-50 border-2 border-slate-100 rounded-xl py-2 px-3 text-center font-bold text-slate-700">
                                            {cluster}
                                        </div>
                                        <button
                                            onClick={() => setSettings({ ...settings, clusters: settings.clusters.filter(c => c !== cluster) })}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                            <Icons.X size={10} strokeWidth={4} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {settings.clusters.length === 0 && (
                                <p className="text-center text-slate-400 text-sm italic">Keine Verbindungen festgelegt.</p>
                            )}

                            <div className="pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => {
                                        const standard = ['sch', 'chs', 'ch', 'ck', 'ph', 'pf', 'th', 'qu', 'ei', 'ie', 'eu', 'au', 'äu', 'ai', 'sp', 'st'];
                                        setSettings({ ...settings, clusters: standard });
                                    }}
                                    className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-wider"
                                >
                                    Standard wiederherstellen
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => setShowClusterManager(false)}
                                className="w-full py-3 bg-slate-800 text-white rounded-xl font-black shadow-lg hover:bg-slate-900 transition-all"
                            >
                                FERTIG
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
