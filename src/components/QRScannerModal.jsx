import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Icons } from './Icons';

export const QRScannerModal = ({ onClose, onScanSuccess }) => {
    const [errorMsg, setErrorMsg] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

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
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    { facingMode: "environment" }, // Rückkamera bevorzugen
                    config,
                    (decodedText, decodedResult) => {
                        // SUCCESS: Scanner stoppen und Daten übergeben
                        setIsScanning(false);
                        html5QrCode.stop().then(() => {
                            onScanSuccess(decodedText);
                        }).catch(err => {
                            // Falls Stop fehlschlägt, trotzdem Daten übergeben
                            onScanSuccess(decodedText);
                        });
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
                <div className="w-full bg-black rounded-xl overflow-hidden mb-4 relative h-[300px] flex items-center justify-center">
                    <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>

                    {/* Scanning Indicator */}
                    {isScanning && !errorMsg && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-4 border-blue-500/50 rounded-xl animate-pulse"></div>
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
                    Halte den QR-Code eines anderen Geräts oder einen Dateilink in die Kamera.
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
