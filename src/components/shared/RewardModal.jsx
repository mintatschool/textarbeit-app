import React from 'react';
import { Icons } from '../Icons';

/**
 * A unified reward modal component for all exercises.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Function to call when clicking the "Beenden" (End) button
 * @param {string} [props.message="Hervorragend gemacht!"] - The success message to display
 * @param {string} [props.buttonText="Beenden"] - Text for the close button
 * @param {boolean} [props.showConfetti=true] - Whether to show the confetti animation
 */
export const RewardModal = ({
    isOpen,
    onClose,
    message = "Hervorragend gemacht!",
    buttonText = "Beenden",
    showConfetti = true,
    title,
    onRestart,
    restartText
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center font-sans">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px]"></div>

            {/* Modal Content */}
            <div className="bg-white rounded-3xl p-12 shadow-2xl pop-animate pointer-events-auto text-center border-b-8 border-green-100 relative z-10 mx-4 max-w-lg w-full">
                <div className="flex flex-col items-center">
                    <div className="mb-8 flex flex-col items-center justify-center gap-4">
                        <Icons.Check size={64} className="text-green-500 shrink-0 mb-2" />

                        {title && (
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">
                                {title}
                            </h2>
                        )}

                        <span className={`${title ? 'text-xl text-slate-600 font-medium' : 'text-3xl md:text-4xl font-black text-green-600'} leading-tight`}>
                            {message}
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        {onRestart && (
                            <button
                                onClick={onRestart}
                                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg min-touch-target flex-1 flex items-center justify-center gap-2"
                            >
                                <Icons.RotateCcw size={24} />
                                {restartText || "Noch einmal"}
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className={`px-8 py-4 ${onRestart ? 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50' : 'bg-blue-600 text-white hover:bg-blue-700'} rounded-2xl font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-lg min-touch-target flex-1`}
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confetti Animation */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[160]">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            className="confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 4)],
                                animationDuration: `${2 + Math.random() * 3}s`,
                                animationDelay: `${Math.random()}s`
                            }}
                        />
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .confetti {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    top: -12px;
                    opacity: 0;
                    border-radius: 2px;
                    animation: confettiFall linear infinite;
                }

                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }

                .pop-animate {
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes popIn {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                `
            }} />
        </div>
    );
};
