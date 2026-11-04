'use client';

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Square,
  Gauge,
  Globe,
  Subtitles,
  Keyboard,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/speech';

interface AudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  rate: number;
  currentBlockIndex: number;
  totalBlocks: number;
  selectedLanguage: string;
  showCaptions: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRepeat: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onChangeRate: (rate: number) => void;
  onChangeLanguage: (lang: string) => void;
  onToggleCaptions: () => void;
  disabled?: boolean;
}

export function AudioControls({
  isPlaying,
  isPaused,
  rate,
  currentBlockIndex,
  totalBlocks,
  selectedLanguage,
  showCaptions,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRepeat,
  onNext,
  onPrevious,
  onChangeRate,
  onChangeLanguage,
  onToggleCaptions,
  disabled = false,
}: AudioControlsProps) {
  const speedOptions = [
    { value: 0.75, label: '0.75x', desc: 'Slow' },
    { value: 1.0, label: '1.0x', desc: 'Normal' },
    { value: 1.25, label: '1.25x', desc: 'Fast' },
    { value: 1.5, label: '1.5x', desc: 'Faster' },
  ];

  const handlePlayToggle = () => {
    if (isPlaying) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      onPlay();
    }
  };

  const hasNext = currentBlockIndex < totalBlocks - 1;
  const hasPrev = currentBlockIndex > 0;

  return (
    <div
      role="region"
      aria-label="Accessible Audio Player Controls"
      className="backdrop-blur-md bg-white/95 rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-[0_12px_40px_rgba(15,23,42,0.12)] sticky bottom-4 z-30 transition-all space-y-3"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Status & Audio Waveform */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                isPlaying
                  ? 'bg-blue-600 text-white shadow-sm border border-blue-400'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
              aria-hidden="true"
            >
              {isPlaying ? (
                <div className="flex items-end gap-1 h-4">
                  <span className="wave-bar wave-bar-1 h-4! bg-white" />
                  <span className="wave-bar wave-bar-2 h-4! bg-white" />
                  <span className="wave-bar wave-bar-3 h-4! bg-white" />
                </div>
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5 text-blue-600" />
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                {isPlaying ? 'Speaking Aloud' : isPaused ? 'Audio Paused' : 'Ready to Speak'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Card {totalBlocks > 0 ? currentBlockIndex + 1 : 0} of {totalBlocks}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-blue-700 font-bold">{rate}x</span>
              </div>
            </div>
          </div>

          {/* Captions Toggle for Mobile */}
          <button
            type="button"
            onClick={onToggleCaptions}
            className={`lg:hidden p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showCaptions
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            aria-label={showCaptions ? 'Hide readable captions' : 'Show readable captions'}
            title="Toggle Captions"
          >
            <Subtitles className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Playback Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {/* Previous Block (P) */}
          <button
            type="button"
            onClick={onPrevious}
            disabled={disabled || !hasPrev}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer transition-all shadow-xs"
            aria-label="Previous card (Keyboard: P)"
            title="Previous (P)"
          >
            <SkipBack className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Repeat Current Block (R) */}
          <button
            type="button"
            onClick={onRepeat}
            disabled={disabled}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer transition-all shadow-xs"
            aria-label="Repeat current card (Keyboard: R)"
            title="Repeat (R)"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Main Play / Pause Button (Spacebar) */}
          <button
            type="button"
            onClick={handlePlayToggle}
            disabled={disabled}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 min-h-[42px] shadow-sm transition-all cursor-pointer border ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border-amber-600'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
            }`}
            aria-label={
              isPlaying
                ? 'Pause speech narration (Keyboard: Space)'
                : isPaused
                ? 'Resume speech narration (Keyboard: Space)'
                : 'Start reading aloud (Keyboard: Space)'
            }
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : isPaused ? (
              <>
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Listen All</span>
              </>
            )}
          </button>

          {/* Stop Button (M) */}
          <button
            type="button"
            onClick={onStop}
            disabled={disabled || (!isPlaying && !isPaused)}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer transition-all shadow-xs"
            aria-label="Stop speech narration (Keyboard: M)"
            title="Stop (M)"
          >
            <Square className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>

          {/* Next Block (N) */}
          <button
            type="button"
            onClick={onNext}
            disabled={disabled || !hasNext}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer transition-all shadow-xs"
            aria-label="Next card (Keyboard: N)"
            title="Next (N)"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Right: Language Picker, Captions Toggle & Speed Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-center w-full lg:w-auto">
          {/* Language Selector */}
          <div className="relative flex items-center bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200">
            <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0 mr-1.5" aria-hidden="true" />
            <label htmlFor="language-select" className="sr-only">
              Choose Voice Language
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="bg-transparent text-xs text-slate-900 font-bold focus:outline-hidden cursor-pointer"
              aria-label="Select voice language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white text-slate-900">
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Captions Toggle for Desktop */}
          <button
            type="button"
            onClick={onToggleCaptions}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showCaptions
                ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
            aria-label={showCaptions ? 'Hide large captions' : 'Show large captions'}
            title="Toggle Captions"
          >
            <Subtitles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Captions</span>
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 px-1.5 flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              <span className="sr-only">Speech speed:</span>
            </span>
            {speedOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeRate(opt.value)}
                className={`px-2 py-1 text-xs font-bold rounded-lg min-h-[30px] transition-all cursor-pointer ${
                  rate === opt.value
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
                aria-label={`Set speech speed to ${opt.label} (${opt.desc})`}
                aria-pressed={rate === opt.value}
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accessible Keyboard Navigation Hints Bar */}
      <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 px-1 font-medium">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1 text-slate-600 font-semibold">
            <Keyboard className="h-3 w-3 text-blue-600" aria-hidden="true" />
            <span>Shortcuts:</span>
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono text-[10px]">
              Space
            </kbd>{' '}
            Play/Pause
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono text-[10px]">
              N
            </kbd>{' '}
            Next Card
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono text-[10px]">
              P
            </kbd>{' '}
            Previous Card
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono text-[10px]">
              R
            </kbd>{' '}
            Repeat
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono text-[10px]">
              M
            </kbd>{' '}
            Mute/Stop
          </span>
        </div>
        <span className="text-blue-700 font-bold">Hands-free ready</span>
      </div>
    </div>
  );
}
