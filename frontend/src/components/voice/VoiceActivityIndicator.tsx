'use client';

import React from 'react';

interface VoiceActivityIndicatorProps {
  isActive: boolean;
  level?: number; // 0.0 to 1.0 (normalized volume)
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Accessible audio activity meter / visual listening state.
 * Provides live animated visual feedback for deaf, hard-of-hearing, and low-vision students
 * so they have immediate visual confirmation that the microphone is hearing sound.
 */
export function VoiceActivityIndicator({
  isActive,
  level = 0.5,
  label = 'Microphone listening',
  size = 'md',
}: VoiceActivityIndicatorProps) {
  // 5 bar height multipliers for natural equalizer waveform look
  const barMultipliers = [0.4, 0.7, 1.0, 0.8, 0.5];

  const heightClasses = {
    sm: 'h-4 gap-0.5',
    md: 'h-6 gap-1',
    lg: 'h-8 gap-1.5',
  };

  const barWidths = {
    sm: 'w-1',
    md: 'w-1.5',
    lg: 'w-2',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
        isActive
          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}
    >
      {/* Equalizer Frequency Bars */}
      <div
        className={`flex items-end ${heightClasses[size]} justify-center`}
        aria-hidden="true"
      >
        {barMultipliers.map((mult, idx) => {
          // Calculate dynamic height based on volume level or pulse
          const dynamicHeight = isActive
            ? Math.max(20, Math.min(100, Math.round((level || 0.4) * mult * 100)))
            : 15;

          return (
            <span
              key={idx}
              className={`${barWidths[size]} rounded-full transition-all duration-75 ${
                isActive
                  ? 'bg-blue-600 shadow-xs'
                  : 'bg-slate-300'
              }`}
              style={{
                height: `${dynamicHeight}%`,
                animationDelay: `${idx * 80}ms`,
              }}
            />
          );
        })}
      </div>

      {/* Accessible Status Text */}
      <span className={`text-xs font-bold tracking-wide ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
        {isActive ? label : 'Mic Off'}
      </span>
      <span className="sr-only">
        {isActive ? `${label}. Sound detected.` : 'Microphone is inactive.'}
      </span>
    </div>
  );
}

