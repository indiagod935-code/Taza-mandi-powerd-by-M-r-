import React from 'react';
import type { FestivalThemeConfig } from '../types';
import { sanitizeSvgMarkup } from '../config/festivalThemes';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  festivalTheme?: FestivalThemeConfig;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl',
  md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'sm',
  festivalTheme,
  className = '',
}) => {
  const isFestival = Boolean(festivalTheme?.active);
  const preset = isFestival ? festivalTheme?.logoPreset || 'default' : 'default';
  const safeCustomSvg =
    isFestival && preset === 'custom' && festivalTheme?.customLogoSvg
      ? sanitizeSvgMarkup(festivalTheme.customLogoSvg)
      : '';

  const sizeClass = SIZE_MAP[size];

  if (safeCustomSvg) {
    return (
      <div
        className={`${sizeClass} overflow-hidden shrink-0 flex items-center justify-center bg-slate-900 border border-white/25 shadow-sm [&>svg]:w-full [&>svg]:h-full ${className}`}
        dangerouslySetInnerHTML={{ __html: safeCustomSvg }}
        aria-label="ताज़ाMandi Custom Logo"
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={`${sizeClass} shrink-0 shadow-sm ${className}`}
      role="img"
      aria-label="ताज़ाMandi Logo"
    >
      <defs>
        <linearGradient id="tm-base" x1="0%" y1="0%" x2="100%" y2="100%">
          {preset === 'diwali' || preset === 'ganesh' || preset === 'sankranti' ? (
            <>
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#7c2d12" />
            </>
          ) : preset === 'holi' || preset === 'navratri' ? (
            <>
              <stop offset="0%" stopColor="#9d174d" />
              <stop offset="100%" stopColor="#581c87" />
            </>
          ) : preset === 'patriotic' ? (
            <>
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#047857" />
            </>
          ) : preset === 'harvest' ? (
            <>
              <stop offset="0%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#065f46" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#022c22" />
            </>
          )}
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="16" fill="url(#tm-base)" />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
      />

      {/* Base Crisp Basket */}
      <path
        d="M17 31 L47 31 L43 51 C42.5 53 40.8 54 38.8 54 L25.2 54 C23.2 54 21.5 53 21 51 Z"
        fill="#ffffff"
        fillOpacity="0.96"
      />
      <path
        d="M23 31 C23 23 41 23 41 31"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <line x1="27" y1="36" x2="27.5" y2="48" stroke="#065f46" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="32" y1="36" x2="32" y2="48" stroke="#065f46" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="37" y1="36" x2="36.5" y2="48" stroke="#065f46" strokeWidth="2.4" strokeLinecap="round" />

      {/* Festival / Seasonal Top Crest */}
      {preset === 'diwali' && (
        <g>
          <path d="M32 7 C35 12 36 16 32 19 C28 16 29 12 32 7 Z" fill="#fde047" />
          <path d="M22 19 Q32 25 42 19 Z" fill="#f59e0b" />
          <circle cx="16" cy="14" r="1.8" fill="#fde047" />
          <circle cx="48" cy="14" r="1.8" fill="#fde047" />
        </g>
      )}

      {preset === 'holi' && (
        <g>
          <circle cx="24" cy="17" r="5" fill="#f472b6" />
          <circle cx="32" cy="14" r="5.5" fill="#fde047" />
          <circle cx="40" cy="17" r="5" fill="#34d399" />
          <circle cx="15" cy="15" r="2" fill="#38bdf8" />
          <circle cx="49" cy="14" r="2" fill="#fb7185" />
        </g>
      )}

      {(preset === 'ganesh' || preset === 'navratri') && (
        <g>
          <path d="M32 8 C37 14 38 20 32 23 C26 20 27 14 32 8 Z" fill="#fb923c" />
          <path d="M21 15 C27 15 30 19 32 23 C25 23 21 20 21 15 Z" fill="#fbbf24" />
          <path d="M43 15 C37 15 34 19 32 23 C39 23 43 20 43 15 Z" fill="#fbbf24" />
        </g>
      )}

      {preset === 'patriotic' && (
        <g>
          <rect x="18" y="10" width="28" height="4" rx="1.5" fill="#fb923c" />
          <rect x="18" y="14" width="28" height="4" rx="1.5" fill="#ffffff" />
          <rect x="18" y="18" width="28" height="4" rx="1.5" fill="#22c55e" />
          <circle cx="32" cy="16" r="2.2" fill="#1d4ed8" />
        </g>
      )}

      {preset === 'eid' && (
        <g>
          <path d="M34 9 A7 7 0 1 0 39 21 A5.5 5.5 0 1 1 34 9 Z" fill="#fde047" />
          <polygon points="43,11 44.2,13.8 47,14 44.8,15.8 45.5,18.5 43,17 40.5,18.5 41.2,15.8 39,14 41.8,13.8" fill="#fde047" />
        </g>
      )}

      {preset === 'sankranti' && (
        <g>
          <polygon points="32,7 42,16 32,24 22,16" fill="#fde047" />
          <line x1="32" y1="7" x2="32" y2="24" stroke="#b45309" strokeWidth="1.5" />
          <path d="M22 16 Q32 13 42 16" fill="none" stroke="#ea580c" strokeWidth="1.5" />
        </g>
      )}

      {preset === 'harvest' && (
        <g>
          <path d="M25 14 C25 9 37 8 40 15 C42 20 35 25 29 23 C25 22 25 18 25 14 Z" fill="#fbbf24" />
          <path d="M32 9 C35 7 39 8 41 11 C38 12 34 11 32 9 Z" fill="#34d399" />
        </g>
      )}

      {(preset === 'default' || preset === 'custom') && (
        <g>
          {/* Twin Fresh Leaf Sprouts */}
          <path d="M32 9 C39 11 44 17 42 24 C35 24 31 19 32 9 Z" fill="#34d399" />
          <path d="M32 12 C25 13 21 18 22 24 C28 24 32 20 32 12 Z" fill="#10b981" />
        </g>
      )}
    </svg>
  );
};
