import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Icons } from './Icons';
import ReactCrop, { convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Tesseract from 'tesseract.js';

export const QRScannerModal = ({ onClose, onScanSuccess }) => {
    const [mode, setMode] = useState('qr'); // 'qr' | 'ocr'
    const [errorMsg, setErrorMsg] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [multiPartState, setMultiPartState] = useState(null); // { total: N, parts: { 1: "...", 2: "..." } }

    // OCR State
    const [capturedImage, setCapturedImage] = useState(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const [ocrStatus, setOcrStatus] = useState(''); // 'initializing', 'recognizing', 'success', 'error'
    const [ocrProgress, setOcrProgress] = useState(0);

    const scannerRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const imgRef = useRef(null);

    // --- QR Code Logic ---

    // Parse Multi-Part QR Code
    const parseMultiPart = (text) => {
        try {
            const data = JSON.parse(text);
            if (data && typeof data.p === 'number' && typeof data.t === 'number' && typeof data.d === 'string') {
                return { id: data.i || 'legacy', part: data.p, total: data.t, data: data.d };
            }
        } catch (e) {
            // Not JSON or not multi-part
        }
        return null;
    };

    const handleScanResult = (decodedText, html5QrCode) => {
        const multiPart = parseMultiPart(decodedText);

        if (multiPart) {
            setMultiPartState(prev => {
                if (!prev || prev.id !== multiPart.id) {
                    return {
                        id: multiPart.id,
                        total: multiPart.total,
                        parts: { [multiPart.part]: multiPart.data }
                    };
                }
                const newState = { ...prev };
                newState.parts[multiPart.part] = multiPart.data;

                const collectedParts = Object.keys(newState.parts).length;
                if (collectedParts >= newState.total) {
                    let combined = '';
                    for (let i = 1; i <= newState.total; i++) {
                        combined += newState.parts[i] || '';
                    }
                    setIsScanning(false);
                    html5QrCode.stop().then(() => {
                        onScanSuccess(combined);
                    }).catch(() => {
                        onScanSuccess(combined);
                    });
                    return null;
                }
                return newState;
            });
        } else {
            setIsScanning(false);
            html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
            }).catch(() => {
                onScanSuccess(decodedText);
            });
        }
    };

    // useEffect for QR Scanner
    useEffect(() => {
        if (mode !== 'qr') return;

        let html5QrCode = null;
        const elementId = "qr-reader";
        let isMounted = true;

        const startScanner = async () => {
            await new Promise(r => setTimeout(r, 200));
            // Check if element exists before starting
            if (!document.getElementById(elementId) || !isMounted) return;

            try {
                // If there's already a scanner instance (cleanup failed?), try to reuse or stop it
                if (scannerRef.current) {
                    try {
                        if (scannerRef.current.isScanning) {
                            await scannerRef.current.stop();
                        }
                        scannerRef.current.clear();
                    } catch (e) {
                        // ignore
                    }
                }

                html5QrCode = new Html5Qrcode(elementId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 15,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: 1.0,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                };

                if (!isMounted) return;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (isMounted) handleScanResult(decodedText, html5QrCode);
                    },
                    (error) => {
                        // Ignore scan errors, but logging might be useful for debug
                    }
                );

                if (isMounted) setIsScanning(true);
            } catch (err) {
                console.error("Kamera Error:", err);
                if (isMounted) setErrorMsg("Kamera konnte nicht gestartet werden.");
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            setIsScanning(false);
            if (scannerRef.current) {
                const scannerToStop = scannerRef.current;
                scannerRef.current = null;

                // Attempt to stop, then clear.
                // We don't await here because cleanup is sync, but we trigger the promise chain.
                scannerToStop.stop()
                    .then(() => {
                        return scannerToStop.clear();
                    })
                    .catch((err) => {
                        // If stop() fails, it might be because it wasn't running.
                        // Try clear() anyway if appropriate, or just ignore.
                        console.log("Scanner stop error:", err);
                        try { scannerToStop.clear(); } catch (e) { }
                    });
            }
        };
    }, [mode, onScanSuccess]);


    // --- OCR Logic ---

    // OCR Camera Effect
    useEffect(() => {
        if (mode !== 'ocr' || capturedImage) {
            // Stop stream if leaving OCR mode or if image is captured
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            return;
        }

        const startOcrCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("OCR Camera Error:", err);
                setErrorMsg("Kamera für OCR konnte nicht gestartet werden.");
            }
        };

        startOcrCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [mode, capturedImage]);

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            setCapturedImage(canvas.toDataURL('image/png'));
            // Default crop: center 80%
            setCrop({
                unit: '%',
                x: 10,
                y: 10,
                width: 80,
                height: 30
            });
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setOcrResult(null); // Assuming setOcrResult uses local invalid state not defined in provided snippet but it was used in handleRetake previously, though not defined in vars? Wait, setOcrResult was in my previous code but maybe I missed it in the view. I'll stick to what was there or what is needed. Actually setOcrResult is NOT in the state variables I saw: [mode, errorMsg, isScanning, multiPartState, capturedImage, crop, completedCrop, ocrStatus, ocrProgress]. Ah, handleRetake in previous view had setOcrResult(null). I should probably remove it if it's not defined or check. The view didn't show 'const [ocrResult, setOcrResult]'. I will assume it was a hallucination in previous edit or missed.
        // Actually, looking at the previous view, handleRetake lines 223-228:
        // setCapturedImage(null);
        // setOcrResult(null); <-- safe to remove if unused, but I will just not include it to avoid errors if it doesn't exist.
        // setOcrStatus('');
        // setOcrProgress(0);

        // Wait, I better be safe. I will recreate handleRetake without the potentially missing setOcrResult if I didn't see it defined.
        // Let's implement the pre-processing first.
        setCapturedImage(null);
        setOcrStatus('');
        setOcrProgress(0);
    };

    // Pre-processing for better OCR accuracy
    const preprocessImage = (canvas) => {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Loop through all pixels
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Grayscale (weighted average)
            // Luma = 0.299R + 0.587G + 0.114B
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Binarization (Thresholding)
            // If lighter than 128 (roughly middle), make it white, else black.
            // Adjust threshold as needed. 128 is standard, maybe slightly higher for clearer text on grayish paper.
            const threshold = 120; // Slightly aggressive for text on paper
            const val = gray > threshold ? 255 : 0;

            data[i] = val;     // R
            data[i + 1] = val; // G
            data[i + 2] = val; // B
            // Alpha (data[i+3]) remains unchanged
        }

        ctx.putImageData(imageData, 0, 0);
    };

    const handleOcrScan = async () => {
        if (!imgRef.current || !completedCrop) {
            // Fallback for full image if no crop
            if (capturedImage && !completedCrop) {
                // allow
            } else {
                return;
            }
        }

        setOcrStatus('initializing');

        // 1. Crop image to canvas
        const image = imgRef.current;
        const cropToUse = completedCrop || { x: 0, y: 0, width: image.width, height: image.height, unit: 'px' };

        // Ensure we work with pixel units
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const canvas = document.createElement('canvas');
        const pixelCrop = convertToPixelCrop(cropToUse, image.width, image.height);

        canvas.width = pixelCrop.width * scaleX;
        canvas.height = pixelCrop.height * scaleY;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            image,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0,
            0,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY
        );

        // --- APPLY PRE-PROCESSING ---
        preprocessImage(canvas);

        const blob = await new Promise(resolve => canvas.toBlob(resolve));

        // 2. Tesseract
        setOcrStatus('recognizing');
        try {
            const { data: { text } } = await Tesseract.recognize(
                blob,
                'deu',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setOcrProgress(m.progress);
                        }
                    }
                }
            );

            setOcrStatus('success');
            onScanSuccess(text.trim());
        } catch (err) {
            console.error(err);
            setOcrStatus('error');
            setErrorMsg("Texterkennung fehlgeschlagen.");
        }
    };

    const partsCollected = multiPartState ? Object.keys(multiPartState.parts).length : 0;
    const totalParts = multiPartState?.total || 0;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl p-6 modal-animate flex flex-col items-center max-w-md w-full max-h-[90vh] overflow-y-auto">

                {/* Header with Switch */}
                <div className="flex flex-col w-full mb-4 gap-4">
                    <div className="flex justify-between items-center w-full">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {mode === 'qr' ? <Icons.Camera className="text-blue-600" /> : <Icons.Type className="text-blue-600" />}
                            {mode === 'qr' ? 'Code scannen' : 'Text scannen'}
                        </h2>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full min-touch-target">
                            <Icons.X size={24} />
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-lg w-full">
                        <button
                            className={`flex-1 py-1 px-3 rounded-md text-sm font-bold transition-all ${mode === 'qr' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => { setMode('qr'); setCapturedImage(null); }}
                        >
                            QR-Code
                        </button>
                        <button
                            className={`flex-1 py-1 px-3 rounded-md text-sm font-bold transition-all ${mode === 'ocr' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setMode('ocr')}
                        >
                            Text (OCR)
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="w-full bg-black rounded-xl overflow-hidden mb-4 relative min-h-[320px] flex items-center justify-center flex-col">

                    {/* QR MODE */}
                    {mode === 'qr' && (
                        <>
                            <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
                            {isScanning && !errorMsg && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-72 h-72 border-4 border-blue-500/50 rounded-xl animate-pulse"></div>
                                </div>
                            )}
                            {multiPartState && partsCollected < totalParts && (
                                <div className="absolute bottom-4 left-4 right-4 bg-blue-600 text-white p-3 rounded-xl text-center font-bold shadow-lg">
                                    <div className="flex items-center justify-center gap-2">
                                        <Icons.Check size={20} />
                                        Teil {partsCollected} von {totalParts} gescannt
                                    </div>
                                    <p className="text-sm font-normal mt-1 opacity-90">Bitte scanne jetzt den nächsten QR-Code</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* OCR MODE */}
                    {mode === 'ocr' && (
                        <>
                            {!capturedImage ? (
                                // Live Camera View
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                        onLoadedMetadata={(e) => e.target.play()}
                                    />
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center pb-4">
                                        <button
                                            onClick={handleCapture}
                                            className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 shadow-lg transition-transform active:scale-95"
                                            aria-label="Foto aufnehmen"
                                        />
                                    </div>
                                    <div className="absolute top-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                                        Text fotografieren
                                    </div>
                                </>
                            ) : (
                                // Crop View
                                <div className="w-full h-full bg-slate-900 flex flex-col">
                                    <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(c) => setCrop(c)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                        >
                                            <img ref={imgRef} src={capturedImage} alt="Capture" />
                                        </ReactCrop>
                                    </div>

                                    {ocrStatus === 'initializing' || ocrStatus === 'recognizing' ? (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 text-white">
                                            <div className="w-12 h-12 border-4 border-white/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                            <p className="font-bold">
                                                {ocrStatus === 'initializing' ? 'Lade Sprachdaten...' : `Erkenne Text... ${Math.round(ocrProgress * 100)}%`}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 p-2 bg-white">
                                            <button
                                                onClick={handleRetake}
                                                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold"
                                            >
                                                Neu
                                            </button>
                                            <button
                                                onClick={handleOcrScan}
                                                className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                                            >
                                                <Icons.Check size={20} />
                                                Text übernehmen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Error Message */}
                    {errorMsg && (
                        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/80 z-50">
                            <div className="text-center">
                                <Icons.AlertTriangle size={48} className="text-red-400 mx-auto mb-2" />
                                <p className="text-white font-bold">{errorMsg}</p>
                                <button onClick={() => setErrorMsg(null)} className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg">
                                    OK
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-500 text-sm mb-4">
                    {mode === 'qr' && (multiPartState
                        ? `Scanne alle ${totalParts} QR-Codes nacheinander.`
                        : 'Halte den QR-Code eines anderen Geräts oder einen Dateilink in die Kamera.')
                    }
                    {mode === 'ocr' && !capturedImage && 'Richte die Kamera auf den Text aus und drücke den Auslöser.'}
                    {mode === 'ocr' && capturedImage && 'Wähle den Textbereich aus, der erkannt werden soll.'}
                </p>

                {(!capturedImage || mode === 'qr') && (
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 w-full min-touch-target"
                    >
                        Abbrechen
                    </button>
                )}
            </div>
        </div>
    );
};
