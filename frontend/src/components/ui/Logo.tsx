import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showSubtitle = true, className = '' }: LogoProps) {
  const pixelSize = {
    sm: 28,
    md: 36,
    lg: 44,
  }[size];

  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size];

  const titleSize = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Sleek Glassmorphic Emblem: Optic Iris & Acoustic Wave */}
      <div
        className={`relative ${iconDimensions} shrink-0`}
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px`, minWidth: `${pixelSize}px`, minHeight: `${pixelSize}px` }}
      >
        <svg
          viewBox="0 0 48 48"
          width={pixelSize}
          height={pixelSize}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_16px_rgba(129,140,248,0.5)]"
          style={{ width: `${pixelSize}px`, height: `${pixelSize}px`, maxWidth: `${pixelSize}px`, maxHeight: `${pixelSize}px` }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="netraGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="netraGradAccent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>

          {/* Outer Rounded Geometric Shield with Educational Royal Blue Depth */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="13"
            fill="#2563eb"
            stroke="#1d4ed8"
            strokeWidth="1.5"
          />

          {/* Optical Eye Contour */}
          <path
            d="M9 24C13.5 17 18.5 14 24 14C29.5 14 34.5 17 39 24C34.5 31 29.5 34 24 34C18.5 34 13.5 31 9 24Z"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Sensor Iris */}
          <circle
            cx="24"
            cy="24"
            r="5"
            fill="#38bdf8"
          />

          {/* Focal Light Aperture */}
          <circle
            cx="22.5"
            cy="22.5"
            r="1.6"
            fill="#ffffff"
          />

          {/* Acoustic Resonance Waves */}
          <path
            d="M17 21C16 22 16 26 17 27"
            stroke="#93c5fd"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M31 21C32 22 32 26 31 27"
            stroke="#93c5fd"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="leading-tight">
        <span className={`${titleSize} font-extrabold tracking-tight text-slate-900 block`}>
          Netrasaathi
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 block">
            Accessible AI Study Assistant
          </span>
        )}
      </div>
    </div>
  );
}
