'use client';

import React from 'react';
import { Mic, Volume2, Sparkles, BookOpen } from 'lucide-react';

export type AvatarState = 'idle' | 'listening' | 'speaking' | 'thinking';

interface VoiceAvatar3DProps {
  state?: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speechBubbleText?: string | null;
  onClick?: () => void;
  className?: string;
  showBadges?: boolean;
}

export function VoiceAvatar3D({
  state = 'idle',
  size = 'md',
  speechBubbleText,
  onClick,
  className = '',
  showBadges = true,
}: VoiceAvatar3DProps) {
  // Dimensions for various sizes
  const config = {
    sm: { box: 72, avatar: 60, badgeSize: 'w-6 h-6', iconSize: 12 },
    md: { box: 124, avatar: 104, badgeSize: 'w-7 h-7', iconSize: 13 },
    lg: { box: 168, avatar: 140, badgeSize: 'w-8 h-8', iconSize: 15 },
    xl: { box: 224, avatar: 186, badgeSize: 'w-10 h-10', iconSize: 18 },
  }[size];

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`AI Voice Assistant Avatar Netra (${state})`}
    >
      {/* Speech Bubble / Status Tag */}
      {speechBubbleText && (
        <div className="absolute -top-12 z-30 max-w-xs animate-bounce-subtle pointer-events-none">
          <div className="relative bg-white/95 backdrop-blur-md text-slate-800 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-2xl shadow-lg border border-blue-100 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isSpeaking
                  ? 'bg-emerald-500 animate-ping'
                  : isListening
                  ? 'bg-rose-500 animate-pulse'
                  : isThinking
                  ? 'bg-amber-500 animate-spin'
                  : 'bg-blue-500'
              }`}
            />
            <span className="truncate">{speechBubbleText}</span>
            {/* Bubble Tail */}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-blue-100" />
          </div>
        </div>
      )}

      {/* Main Avatar Stage */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${config.box}px`, height: `${config.box}px` }}
      >
        {/* Ambient Acoustic Aura Rings (Outer halo) */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
            isSpeaking
              ? 'bg-gradient-to-tr from-blue-400/30 via-indigo-400/20 to-sky-300/30 blur-xl scale-125 animate-pulse'
              : isListening
              ? 'bg-gradient-to-tr from-rose-400/35 via-amber-400/20 to-red-300/25 blur-xl scale-125 animate-ping'
              : isThinking
              ? 'bg-gradient-to-tr from-amber-400/30 via-purple-400/20 to-indigo-300/25 blur-xl scale-110 animate-spin-slow'
              : 'bg-gradient-to-tr from-blue-200/40 via-sky-100/30 to-indigo-100/30 blur-lg scale-100'
          }`}
        />

        {/* Dynamic Acoustic Soundwave Ring (Speaking State) */}
        {isSpeaking && (
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-blue-400/60 animate-spin-slow pointer-events-none" />
        )}

        {/* Sonar Radar Wave (Listening State) */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-rose-400/80 animate-ping pointer-events-none" />
        )}

        {/* Professional 3D Illustrated Female Educator Avatar (Netra) */}
        <div
          className={`relative z-10 transition-transform duration-300 ${
            onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
          }`}
          style={{ width: `${config.avatar}px`, height: `${config.avatar}px` }}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-[0_12px_24px_rgba(37,99,235,0.22)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Natural Warm Ivory / Soft Peach Skin Gradients */}
              <radialGradient id="netraSkin" cx="44%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#fff2eb" />
                <stop offset="45%" stopColor="#fde3d6" />
                <stop offset="80%" stopColor="#fac2ab" />
                <stop offset="100%" stopColor="#f5a489" />
              </radialGradient>

              {/* Natural Rosy Blush */}
              <radialGradient id="netraBlush" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fb7185" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
              </radialGradient>

              {/* Natural Rich Chestnut & Dark Espresso Hair */}
              <linearGradient id="netraHairBack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3d2116" />
                <stop offset="45%" stopColor="#2c150c" />
                <stop offset="100%" stopColor="#1a0b06" />
              </linearGradient>

              <linearGradient id="netraHairHighlight" x1="0%" y1="0%" x2="100%" y2="60%">
                <stop offset="0%" stopColor="#633825" />
                <stop offset="48%" stopColor="#7c462e" />
                <stop offset="100%" stopColor="#4a2617" />
              </linearGradient>

              {/* Professional Navy / Royal Blue Educator Blazer */}
              <linearGradient id="netraBlazer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="45%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>

              {/* Crisp Inner Blouse */}
              <linearGradient id="netraBlouse" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>

              {/* Slim Educator Headset */}
              <linearGradient id="headsetBand" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>

              {/* 3D Drop Shadow */}
              <filter id="soft3D" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="3.5" stdDeviation="3.5" floodColor="#1e3a8a" floodOpacity="0.16" />
              </filter>
            </defs>

            {/* --- Flowing Soft Hair (Back Layer) --- */}
            {/* Elegant wavy hair cascading softly past shoulders */}
            <path
              d="M 52 72 C 40 96, 38 138, 54 168 C 66 148, 72 135, 72 120 C 72 70, 128 70, 128 120 C 128 135, 134 148, 146 168 C 162 138, 160 96, 148 72 C 140 42, 60 42, 52 72 Z"
              fill="url(#netraHairBack)"
            />
            {/* Silky hair highlight strands */}
            <path
              d="M 48 95 C 44 125, 48 145, 58 164"
              stroke="url(#netraHairHighlight)"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 152 95 C 156 125, 152 145, 142 164"
              stroke="url(#netraHairHighlight)"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* --- Sleek Headband Curve (Behind Crown) --- */}
            <path
              d="M 50 84 C 48 38, 152 38, 150 84"
              stroke="url(#headsetBand)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* --- Torso & Professional Educator Attire --- */}
            <g id="torso">
              {/* Royal Blue Blazer Body */}
              <path
                d="M 38 196 C 38 152, 66 138, 100 138 C 134 138, 162 152, 162 196 Z"
                fill="url(#netraBlazer)"
                filter="url(#soft3D)"
              />
              {/* Inner Crisp White Blouse */}
              <path
                d="M 80 139 Q 100 162 120 139 Z"
                fill="url(#netraBlouse)"
              />
              {/* Left Lapel */}
              <path
                d="M 70 139 L 87 172 L 76 178 Z"
                fill="#1d4ed8"
              />
              {/* Right Lapel */}
              <path
                d="M 130 139 L 113 172 L 124 178 Z"
                fill="#1e40af"
              />
              {/* Delicate Silver Necklace with Azure Gem */}
              <path
                d="M 92 146 Q 100 154 108 146"
                stroke="#cbd5e1"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="100" cy="154" r="1.8" fill="#38bdf8" />
            </g>

            {/* --- Graceful Neck with Soft Shadow --- */}
            <rect
              x="88"
              y="116"
              width="24"
              height="26"
              rx="8"
              fill="url(#netraSkin)"
            />
            {/* Chin drop shadow on neck */}
            <path
              d="M 88 116 Q 100 124 112 116 L 112 122 Q 100 128 88 122 Z"
              fill="#c2410c"
              fillOpacity="0.22"
            />

            {/* --- Beautiful Feminine Face Shape --- */}
            <path
              d="M 68 80 C 68 56, 132 56, 132 80 C 132 108, 118 132, 100 135 C 82 132, 68 108, 68 80 Z"
              fill="url(#netraSkin)"
              filter="url(#soft3D)"
            />

            {/* --- Rosy Soft Cheeks --- */}
            <circle cx="78" cy="104" r="8" fill="url(#netraBlush)" />
            <circle cx="122" cy="104" r="8" fill="url(#netraBlush)" />

            {/* --- Delicate, Natural Eyebrows (Slim & Refined) --- */}
            {isListening ? (
              // Attentive, slightly raised inquisitive arch
              <g id="eyebrows-listening">
                <path d="M 76 77 Q 84 71 92 76" stroke="#4a2818" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                <path d="M 108 76 Q 116 71 124 77" stroke="#4a2818" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              </g>
            ) : isSpeaking ? (
              // Cheerful friendly arch
              <g id="eyebrows-speaking">
                <path d="M 76 77 Q 84 72 92 76" stroke="#4a2818" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                <path d="M 108 76 Q 116 72 124 77" stroke="#4a2818" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              </g>
            ) : (
              // Natural, gentle professional arch
              <g id="eyebrows-idle">
                <path d="M 76 78 Q 84 73 92 76" stroke="#4a2818" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                <path d="M 108 76 Q 116 73 124 78" stroke="#4a2818" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* --- Warm Almond Eyes with Sparkles --- */}
            {isSpeaking ? (
              // Happy, warm smiling crescent eyes with flutter lash
              <g id="eyes-speaking">
                <path d="M 76 89 Q 84 82 92 89" stroke="#22120b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <path d="M 108 89 Q 116 82 124 89" stroke="#22120b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                {/* Lash flick */}
                <path d="M 92 89 L 94.5 87" stroke="#22120b" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M 124 89 L 126.5 87" stroke="#22120b" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            ) : (
              // Intelligent, attentive almond eyes
              <g id="eyes-open">
                {/* Sclera */}
                <path d="M 76 89 Q 84 83 92 89 Q 84 94 76 89 Z" fill="#ffffff" />
                <path d="M 108 89 Q 116 83 124 89 Q 116 94 108 89 Z" fill="#ffffff" />
                {/* Chestnut Iris */}
                <circle cx={isThinking ? 85 : 84} cy="89" r="4.2" fill="#3b2216" />
                <circle cx={isThinking ? 117 : 116} cy="89" r="4.2" fill="#3b2216" />
                {/* Deep Pupil */}
                <circle cx={isThinking ? 85 : 84} cy="89" r="2.2" fill="#140a05" />
                <circle cx={isThinking ? 117 : 116} cy="89" r="2.2" fill="#140a05" />
                {/* Catchlight sparkles */}
                <circle cx={isThinking ? 86.5 : 85.5} cy="87.5" r="1.3" fill="#ffffff" />
                <circle cx={isThinking ? 83.5 : 82.5} cy="90.5" r="0.7" fill="#ffffff" />
                <circle cx={isThinking ? 118.5 : 117.5} cy="87.5" r="1.3" fill="#ffffff" />
                <circle cx={isThinking ? 115.5 : 114.5} cy="90.5" r="0.7" fill="#ffffff" />
                {/* Upper lash line */}
                <path d="M 75 89 Q 84 82.5 93 88.5" stroke="#22120b" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 92 89 L 95 87.5" stroke="#22120b" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M 107 88.5 Q 116 82.5 125 89" stroke="#22120b" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 124 89 L 127 87.5" stroke="#22120b" strokeWidth="1.3" strokeLinecap="round" />
              </g>
            )}

            {/* --- Delicate Nose --- */}
            <path
              d="M 99 95 Q 100 100 103 99"
              stroke="#e07a5f"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* --- Natural Rose Tutor Lips --- */}
            {isSpeaking ? (
              // Friendly active speaking smile
              <g id="mouth-speaking" className="animate-pulse">
                <path d="M 92 110 Q 100 122 108 110 Z" fill="#be123c" />
                <path d="M 94 111 Q 100 114.5 106 111" fill="#ffffff" />
                <ellipse cx="100" cy="116.5" rx="3.2" ry="1.6" fill="#fb7185" />
              </g>
            ) : isListening ? (
              // Attentive soft parted smile
              <path
                d="M 93 112 Q 100 117 107 112"
                stroke="#be123c"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              // Warm, welcoming professional smile
              <g id="mouth-idle">
                <path
                  d="M 92 112 Q 100 118 108 112"
                  fill="#f43f5e"
                  fillOpacity="0.85"
                  stroke="#be123c"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <ellipse cx="100" cy="114" rx="3" ry="0.8" fill="#ffffff" fillOpacity="0.4" />
              </g>
            )}

            {/* --- Front Hair: Soft Side-Swept Bangs & Face-Framing Strands --- */}
            {/* Top crown hair volume */}
            <path
              d="M 58 72 C 54 44, 144 44, 142 72 C 136 50, 64 50, 58 72 Z"
              fill="url(#netraHairBack)"
            />
            {/* Elegant Side-Swept Bang */}
            <path
              d="M 80 48 C 96 46, 126 52, 133 74 C 123 62, 105 56, 84 56 Z"
              fill="url(#netraHairHighlight)"
            />
            {/* Left face-framing strand */}
            <path
              d="M 66 70 C 70 88, 72 110, 70 124 C 65 112, 62 90, 62 72 Z"
              fill="url(#netraHairBack)"
            />
            {/* Right face-framing strand */}
            <path
              d="M 134 72 C 136 92, 132 113, 129 124 C 135 112, 138 90, 136 74 Z"
              fill="url(#netraHairBack)"
            />

            {/* --- Sleek Modern Educator Headset --- */}
            {/* Left Earpiece */}
            <rect
              x="46"
              y="80"
              width="8"
              height="22"
              rx="4"
              fill="#2563eb"
              filter="url(#soft3D)"
            />
            <circle
              cx="50"
              cy="91"
              r="2"
              fill={isSpeaking ? '#38bdf8' : isListening ? '#f43f5e' : '#ffffff'}
            />

            {/* Right Earpiece */}
            <rect
              x="146"
              y="80"
              width="8"
              height="22"
              rx="4"
              fill="#2563eb"
              filter="url(#soft3D)"
            />
            <circle
              cx="150"
              cy="91"
              r="2"
              fill={isSpeaking ? '#38bdf8' : isListening ? '#f43f5e' : '#ffffff'}
            />

            {/* Slim Curved White Boom Microphone */}
            <path
              d="M 50 93 Q 60 114 78 113"
              stroke="#cbd5e1"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Microphone Capsule */}
            <rect
              x="76"
              y="110"
              width="6"
              height="6"
              rx="3"
              fill="#1d4ed8"
            />
            {/* Active Status LED on Mic Tip */}
            <circle
              cx="82"
              cy="113"
              r="1.5"
              fill={isListening ? '#f43f5e' : isSpeaking ? '#10b981' : '#38bdf8'}
              className={isListening ? 'animate-pulse' : ''}
            />
          </svg>
        </div>

        {/* --- Floating Reactive 3D Educational Badges --- */}
        {showBadges && (
          <>
            {/* Top Right Floating Badge: Audio Status */}
            <div
              className={`absolute top-0 -right-2 z-20 rounded-2xl p-2 bg-white shadow-md border border-blue-100 flex items-center justify-center transition-transform ${config.badgeSize} ${
                isSpeaking
                  ? 'scale-110 shadow-blue-300/50 bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'text-blue-600'
              }`}
            >
              {isSpeaking ? (
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce" />
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </div>

            {/* Bottom Left Floating Badge: Voice Mic State */}
            <div
              className={`absolute -bottom-1 -left-2 z-20 rounded-2xl p-2 shadow-md border border-slate-100 flex items-center justify-center transition-all ${config.badgeSize} ${
                isListening
                  ? 'bg-rose-500 text-white scale-110 shadow-rose-300/50 animate-pulse'
                  : 'bg-white text-slate-700 hover:text-blue-600'
              }`}
            >
              <Mic className="h-4 w-4" />
            </div>

            {/* Top Left Floating Badge: Education / Book */}
            <div
              className={`absolute top-1 -left-3 z-20 rounded-2xl p-1.5 bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm flex items-center justify-center ${config.badgeSize}`}
            >
              <BookOpen className="h-3.5 w-3.5" />
            </div>

            {/* Bottom Right Floating Badge: AI Intelligence Sparkles */}
            <div
              className={`absolute -bottom-1 -right-1 z-20 rounded-2xl p-1.5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm flex items-center justify-center ${config.badgeSize}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </>
        )}
      </div>

      {/* Dynamic Sub-Label */}
      <div className="mt-2 text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-colors ${
            isSpeaking
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : isListening
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : isThinking
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSpeaking
                ? 'bg-blue-600 animate-ping'
                : isListening
                ? 'bg-rose-600 animate-pulse'
                : isThinking
                ? 'bg-amber-600 animate-spin'
                : 'bg-slate-400'
            }`}
          />
          <span>
            {isSpeaking
              ? 'Speaking'
              : isListening
              ? 'Listening'
              : isThinking
              ? 'Thinking'
              : 'Netra Tutor'}
          </span>
        </span>
      </div>
    </div>
  );
}
