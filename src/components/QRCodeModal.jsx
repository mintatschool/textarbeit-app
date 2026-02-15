import React, { useRef, useState, useMemo, useEffect } from 'react';
import QRious from 'qrious';
import { Icons } from './Icons';

// Grenze für Multi-QR (in Zeichen)
const MULTI_QR_THRESHOLD = 800;

export const QRCodeModal = ({ text, onClose }) => {
    const qrRef = useRef(null);
    const fullQrRef = useRef(null);
    const [linkInput, setLinkInput] = useState("");
    const [isMaximized, setIsMaximized] = useState(false);
    const [mode, setMode] = useState('text'); // 'raw' | 'text' | 'link'
    const [showHashes, setShowHashes] = useState(false);

    // Slideshow State
    const [currentPart, setCurrentPart] = useState(0); // 0-indexed
    const [isPlaying, setIsPlaying] = useState(false);
    const [displayDuration, setDisplayDuration] = useState(3.0);
    const timerRef = useRef(null);

    // UTF-8 Encoding Fix für Umlaute
    const toUtf8Bytes = (str) => {
        try {
            return unescape(encodeURIComponent(str));
        } catch (e) {
            return str;
        }
    };

    // Parsing Input Data
    const parsedData = useMemo(() => {
        try {
            return JSON.parse(text);
        } catch (e) {
            return { text: text };
        }
    }, [text]);

    // Ermitteln ob Multi-QR benötigt wird - Jetzt dynamisch für N Teile
    const { qrValues, isMultiPart, errorLevel, tooLong } = useMemo(() => {
        if (!parsedData || !parsedData.text) {
            return { qrValues: [], isMultiPart: false, errorLevel: 'M', tooLong: false };
        }

        let contentToEncode = text;

        if (mode === 'raw') {
            contentToEncode = parsedData.text || text;
        }

        // Feature: Markierungen als # exportieren
        if (showHashes && parsedData.highlights && Array.isArray(parsedData.highlights) && parsedData.highlights.length > 0) {
            const rawText = parsedData.text;
            const highlights = new Set(parsedData.highlights);
            const segments = rawText.split(/(\s+)/);
            let currentIndex = 0;
            let stringWithHashes = "";

            segments.forEach(segment => {
                const match = segment.match(/^([^\w\u00C0-\u017F]*)(\w\u00C0-\u017F]+(?:\-[\w\u00C0-\u017F]+)*)([^\w\u00C0-\u017F]*)$/);
                if (match) {
                    const prefix = match[1];
                    const cleanWord = match[2];
                    const suffix = match[3];
                    const wordStartIndex = currentIndex + prefix.length;

                    if (highlights.has(wordStartIndex)) {
                        stringWithHashes += prefix + "#" + cleanWord + suffix;
                    } else {
                        stringWithHashes += segment;
                    }
                } else {
                    stringWithHashes += segment;
                }
                currentIndex += segment.length;
            });
            contentToEncode = stringWithHashes;
        }

        if (mode !== 'raw' && !showHashes) {
            contentToEncode = contentToEncode.length > 300
                ? contentToEncode
                : (contentToEncode.startsWith('{') ? contentToEncode : JSON.stringify({ text: contentToEncode }));
        }

        const finalContent = toUtf8Bytes(contentToEncode);

        // Konstanten für Chunking
        // Erhöhte Chunk-Größe für weniger QR-Codes (900 ist noch gut scannbar)
        const MAX_CHUNK_SIZE = 900;

        if (finalContent.length > MAX_CHUNK_SIZE) {
            const totalParts = Math.ceil(finalContent.length / MAX_CHUNK_SIZE);

            // Hard Limit verhindern
            if (totalParts > 20) {
                return { qrValues: [], isMultiPart: false, errorLevel: 'M', tooLong: true };
            }

            // ID für diese Übertragung generieren, damit der Scanner weiß, welche Teile zusammengehören
            // Robuste ID mit Timestamp + Zufallselement für eindeutige Identifikation
            const transferId = Date.now().toString(36).slice(-4) + Math.random().toString(36).substr(2, 4);

            // Neu: Daten gleichmäßig verteilen, damit alle QR-Codes ähnlich dicht sind
            const balancedChunkSize = Math.ceil(finalContent.length / totalParts);

            const parts = [];
            for (let i = 0; i < totalParts; i++) {
                const start = i * balancedChunkSize;
                const end = Math.min(start + balancedChunkSize, finalContent.length);
                const chunkData = finalContent.substring(start, end);

                // Delimiter-Format: qrp|ID|PART|TOTAL|DATA (vermeidet JSON-Doppelkodierung)
                parts.push(`qrp|${transferId}|${i + 1}|${totalParts}|${chunkData}`);
            }

            return {
                qrValues: parts,
                isMultiPart: true,
                errorLevel: 'L'
            };
        }

        // Single QR
        if (finalContent.length > 2900) {
            return { qrValues: [], isMultiPart: false, errorLevel: 'M', tooLong: true };
        }

        return {
            qrValues: [finalContent],
            isMultiPart: false,
            errorLevel: finalContent.length < 500 ? 'M' : 'L'
        };
    }, [text, parsedData, showHashes, mode]);

    // Auto-Play Logic
    useEffect(() => {
        if (isPlaying && isMultiPart && qrValues.length > 1) {
            timerRef.current = setInterval(() => {
                setCurrentPart(prev => (prev + 1) % qrValues.length);
            }, displayDuration * 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, isMultiPart, qrValues.length, displayDuration]);

    // Initial Start Auto-Play bei Multipart
    useEffect(() => {
        if (isMultiPart) {
            setIsPlaying(true);
            setCurrentPart(0);
        } else {
            setIsPlaying(false);
            setCurrentPart(0);
        }
    }, [isMultiPart]);


    // QR Rendering Helper
    const renderQR = (canvasRef, value, sizeParam) => {
        if (!canvasRef.current || !value) return;
        try {
            new QRious({
                element: canvasRef.current,
                value: value,
                size: sizeParam,
                level: errorLevel,
                padding: 16
            });
        } catch (e) {
            console.error("QR Render Error:", e);
        }
    };

    // Render Effects
    useEffect(() => {
        if (mode === 'link') return;
        if (!tooLong && qrValues.length > 0) {
            // Normal View
            if (qrRef.current) renderQR(qrRef, qrValues[currentPart], 1000);

            // Fullscreen View
            if (fullQrRef.current) renderQR(fullQrRef, qrValues[currentPart], 1200);
        }
    }, [qrValues, currentPart, isMaximized, tooLong, mode, errorLevel]);

    // Link QR Logic
    useEffect(() => {
        if (mode === 'link' && qrRef.current && linkInput) {
            renderQR(qrRef, linkInput, 1000);
        }
    }, [mode, linkInput]);


    const generateLinkQR = () => {
        // Triggered via state change mainly, but logic kept for existing UI flow
        setMode('link');
    };

    const textLength = parsedData?.text?.length || text?.length || 0;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
            {/* Maximierte Vollbild-Ansicht */}
            {isMaximized && !tooLong && (
                <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-4 animate-fadeIn">
                    <div className="flex flex-col items-center max-w-[90vw]">
                        <div className="bg-white p-4 border-8 border-slate-100 rounded-2xl shadow-2xl flex flex-col items-center relative">
                            <canvas ref={fullQrRef} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}></canvas>

                            {/* Overlay Badge für Current Part */}
                            {isMultiPart && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white font-bold px-4 py-2 rounded-bl-xl text-xl shadow-lg">
                                    {currentPart + 1} / {qrValues.length}
                                </div>
                            )}
                        </div>

                        {/* Controls für Fullscreen */}
                        {isMultiPart && (
                            <div className="flex items-center gap-6 mt-6 bg-slate-100 p-3 rounded-full shadow-lg">
                                <button
                                    onClick={() => { setIsPlaying(false); setCurrentPart(p => (p - 1 + qrValues.length) % qrValues.length); }}
                                    className="p-4 bg-white rounded-full shadow-sm hover:scale-110 transition text-slate-700"
                                    title="Zurück"
                                >
                                    <Icons.ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className={`p-4 rounded-full shadow-md hover:scale-105 transition flex items-center gap-2 ${isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-blue-600 text-white'}`}
                                    title={isPlaying ? "Pause" : "Abspielen"}
                                >
                                    {isPlaying ? <Icons.Pause size={32} /> : <Icons.Play size={32} />}
                                </button>
                                <button
                                    onClick={() => { setIsPlaying(false); setCurrentPart(p => (p + 1) % qrValues.length); }}
                                    className="p-4 bg-white rounded-full shadow-sm hover:scale-110 transition text-slate-700"
                                    title="Weiter"
                                >
                                    <Icons.ChevronRight size={32} />
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsMaximized(false)}
                        className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition min-touch-target"
                    >
                        <Icons.Minimize /> Schließen
                    </button>
                </div>
            )}

            {/* Normales Modal */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 modal-animate flex flex-col items-center max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scroll relative">
                <div className="flex justify-between items-center w-full mb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Icons.QrCode className="text-blue-600" /> Text teilen
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full min-touch-target">
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Tab-Umschalter */}
                <div className="flex w-full gap-2 mb-4">
                    <button
                        onClick={() => { setMode('text'); setLinkInput(""); }}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${mode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <Icons.Files size={16} /> Alles
                    </button>
                    <button
                        onClick={() => { setMode('raw'); setLinkInput(""); }}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${mode === 'raw' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <Icons.FileText size={16} /> Nur Text
                    </button>
                    <button
                        onClick={() => setMode('link')}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${mode === 'link' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <Icons.Link size={16} /> Link
                    </button>
                </div>

                {/* Link-Eingabe */}
                {mode === 'link' && (
                    <div className="w-full mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="text-sm font-bold text-slate-600 block mb-2">Dateilink (Cloud):</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="https://..."
                                className="flex-1 border rounded-lg p-2 text-sm"
                                value={linkInput}
                                onChange={e => setLinkInput(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Multi-Part Hinweis */}
                {isMultiPart && mode !== 'link' && (
                    <div className="w-full mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                        <Icons.AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-bold text-amber-700">Langer Text ({qrValues.length} Teile)</p>
                            <p className="text-xs text-amber-600 mt-1">
                                Die QR-Codes werden automatisch gewechselt. Scanne sie nacheinander.
                            </p>
                        </div>
                    </div>
                )}

                {/* QR-Code Display Area */}
                <div className="relative group w-full flex flex-col items-center">
                    {tooLong && mode !== 'link' ? (
                        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center text-sm font-bold min-h-[280px] flex flex-col items-center justify-center gap-2">
                            <Icons.AlertTriangle size={48} className="text-red-400" />
                            <p>Der Text ist auch für Split-QR zu lang.</p>
                            <p className="text-red-400 font-normal">({textLength} Zeichen)</p>
                        </div>
                    ) : (
                        <>
                            {mode === 'link' && !linkInput ? (
                                <div className="bg-slate-50 border-4 border-slate-100 border-dashed rounded-xl w-[260px] h-[260px] flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Icons.Link size={48} className="opacity-50" />
                                    <span className="text-sm font-medium">Link eingeben...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white p-4 rounded-xl border-4 border-slate-100 flex flex-col items-center relative">
                                        <canvas ref={qrRef} style={{ width: '260px', height: '260px', maxWidth: '100%' }}></canvas>

                                        {isMultiPart && (
                                            <div className="absolute top-2 right-2 bg-slate-800/80 text-white text-xs font-bold px-2 py-1 rounded">
                                                {currentPart + 1} / {qrValues.length}
                                            </div>
                                        )}
                                    </div>

                                    {/* Controls im kleinen Modal */}
                                    {isMultiPart && mode !== 'link' && (
                                        <div className="flex items-center gap-4 mt-3">
                                            <button
                                                onClick={() => { setIsPlaying(false); setCurrentPart(p => (p - 1 + qrValues.length) % qrValues.length); }}
                                                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                                            >
                                                <Icons.ChevronLeft size={20} />
                                            </button>

                                            <button
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition ${isPlaying ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}
                                            >
                                                {isPlaying ? <><Icons.Pause size={16} /> Pause</> : <><Icons.Play size={16} /> Start</>}
                                            </button>

                                            <button
                                                onClick={() => { setIsPlaying(false); setCurrentPart(p => (p + 1) % qrValues.length); }}
                                                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                                            >
                                                <Icons.ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setIsMaximized(true)}
                                        className="absolute bottom-2 right-2 p-2 bg-white/90 shadow-md border rounded-full text-slate-600 hover:text-blue-600 hover:scale-110 transition min-touch-target z-10"
                                        title="Vergrößern"
                                    >
                                        <Icons.Maximize size={18} />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>

                <p className="text-center text-slate-500 text-sm mt-4 mb-4">
                    {mode === 'link'
                        ? (linkInput ? 'Scanne diesen Code, um den Link zu öffnen.' : 'Füge einen Link ein, um einen QR-Code zu erstellen.')
                        : (isMultiPart
                            ? 'Die Kamera erkennt automatisch, wenn alle Teile gescannt sind.'
                            : 'Scanne diesen Code mit der App-Kamera.')}
                </p>

                {/* Duration Setting */}
                {isMultiPart && mode !== 'link' && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <label className="text-sm text-slate-600 font-bold">Anzeigedauer:</label>
                        <select
                            value={displayDuration}
                            onChange={(e) => setDisplayDuration(parseFloat(e.target.value))}
                            className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map(val => (
                                <option key={val} value={val}>{val.toFixed(1)} s</option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 w-full min-touch-target"
                >
                    Schließen
                </button>
            </div>
        </div >
    );
};
