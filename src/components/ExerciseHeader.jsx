import React from 'react';
import { Icons } from './Icons';

/**
 * Standardized header component for exercise views.
 * Based on the Treppenwörter design.
 */
export const ExerciseHeader = ({
    title,
    icon: IconComponent,
    current,
    total,
    progressPercentage,
    settings,
    setSettings,
    onClose,
    customControls,
    showSlider,
    sliderMin = 16,
    sliderMax = 120,
    children
}) => {
    const showProgress = typeof current === 'number' && typeof total === 'number';

    return (
        <>
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 shrink-0 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {IconComponent && <IconComponent className="text-blue-600" />}
                        {title}
                    </h2>
                    {showProgress && (
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold text-lg">
                            {current} / {total}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {customControls}
                    {settings && setSettings && (typeof showSlider === 'undefined' || showSlider) && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 h-10 rounded-lg">
                            <span className="text-xs font-bold text-slate-500">A</span>
                            <input
                                type="range"
                                min={sliderMin}
                                max={sliderMax}
                                value={settings.fontSize}
                                onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                                className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                            />
                            <span className="text-xl font-bold text-slate-500">A</span>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"
                    >
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>

            {children}

            {/* Progress Bar */}
            {typeof progressPercentage === 'number' && (
                <div className="px-6 py-2 bg-white border-b border-slate-200">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </>
    );
};
