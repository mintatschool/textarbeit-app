import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Icons } from './Icons';

export const QRScannerModal = ({ onClose, onScanSuccess }) => {
    const [errorMsg, setErrorMsg] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [multiPartState, setMultiPartState] = useState(null); // { total: N, parts: { 1: "...", 2: "..." } }
    const scannerRef = useRef(null);

    // Parse Multi-Part QR Code
    const parseMultiPart = (text) => {
        try {
            const data = JSON.parse(text);
            // Check if it's a multi-part format: { p: partNumber, t: total, d: data }
            if (data && typeof data.p === 'number' && typeof data.t === 'number' && typeof data.d === 'string') {
                return { part: data.p, total: data.t, data: data.d };
            }
        } catch (e) {
            // Not JSON or not multi-part
        }
        return null;
    };

    const handleScanResult = (decodedText, html5QrCode) => {
        const multiPart = parseMultiPart(decodedText);

        if (multiPart) {
            // It's a multi-part QR code
            setMultiPartState(prev => {
                const newState = prev || { total: multiPart.total, parts: {} };
                newState.parts[multiPart.part] = multiPart.data;

                // Check if we have all parts
                const collectedParts = Object.keys(newState.parts).length;
                if (collectedParts >= newState.total) {
                    // Combine all parts in order
                    let combined = '';
                    for (let i = 1; i <= newState.total; i++) {
                        combined += newState.parts[i] || '';
                    }
                    // Stop scanner and return combined result
                    setIsScanning(false);
                    html5QrCode.stop().then(() => {
                        onScanSuccess(combined);
                    }).catch(() => {
                        onScanSuccess(combined);
                    });
                }
                return { ...newState };
            });
        } else {
            // Single QR code - direct success
            setIsScanning(false);
            html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
            }).catch(() => {
                onScanSuccess(decodedText);
            });
        }
    };

    useEffect(() => {
        let html5QrCode = null;
        const elementId = "qr-reader";

        const startScanner = async () => {
            // Kurze Verzögerung, damit das DOM-Element existiert
            await new Promise(r => setTimeout(r, 200));

            try {
                html5QrCode = new Html5Qrcode(elementId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 15, // Erhöht von 10 auf 15 für schnellere Erkennung
                    qrbox: { width: 300, height: 300 }, // Vergrößert von 250 auf 300
                    aspectRatio: 1.0,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true // Native API wenn verfügbar
                    }
                };

                await html5QrCode.start(
                    { facingMode: "environment" }, // Rückkamera bevorzugen
                    config,
                    (decodedText, decodedResult) => {
                        handleScanResult(decodedText, html5QrCode);
                    },
                    (errorMessage) => {
                        // Error Callback wird oft gefeuert (bei jedem Frame ohne QR)
                        // Meistens ignorieren
                    }
                );

                setIsScanning(true);
            } catch (err) {
                console.error("Kamera Error:", err);
                setErrorMsg("Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen oder HTTPS verwenden.");
            }
        };

        startScanner();

        // CLEANUP: Kamera ausschalten, wenn Komponente unmounted wird
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch(e => console.log("Stop failed", e));
                    scannerRef.current.clear();
                } catch (e) {
                    console.log("Cleanup error:", e);
                }
            }
        };
    }, [onScanSuccess]);

    const partsCollected = multiPartState ? Object.keys(multiPartState.parts).length : 0;
    const totalParts = multiPartState?.total || 0;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl p-6 modal-animate flex flex-col items-center max-w-md w-full">
                <div className="flex justify-between items-center w-full mb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Icons.Camera className="text-blue-600" /> Code scannen
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-full min-touch-target"
                    >
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Scanner Container */}
                <div className="w-full bg-black rounded-xl overflow-hidden mb-4 relative h-[320px] flex items-center justify-center">
                    <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>

                    {/* Scanning Indicator */}
                    {isScanning && !errorMsg && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-72 h-72 border-4 border-blue-500/50 rounded-xl animate-pulse"></div>
                        </div>
                    )}

                    {/* Multi-Part Progress */}
                    {multiPartState && partsCollected < totalParts && (
                        <div className="absolute bottom-4 left-4 right-4 bg-blue-600 text-white p-3 rounded-xl text-center font-bold shadow-lg">
                            <div className="flex items-center justify-center gap-2">
                                <Icons.Check size={20} />
                                Teil {partsCollected} von {totalParts} gescannt
                            </div>
                            <p className="text-sm font-normal mt-1 opacity-90">
                                Bitte scanne jetzt den nächsten QR-Code
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMsg && (
                        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/80">
                            <div className="text-center">
                                <Icons.AlertTriangle size={48} className="text-red-400 mx-auto mb-2" />
                                <p className="text-white font-bold">{errorMsg}</p>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-500 text-sm mb-4">
                    {multiPartState
                        ? `Scanne alle ${totalParts} QR-Codes nacheinander.`
                        : 'Halte den QR-Code eines anderen Geräts oder einen Dateilink in die Kamera.'
                    }
                </p>

                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 w-full min-touch-target"
                >
                    Abbrechen
                </button>
            </div>
        </div>
    );
};
