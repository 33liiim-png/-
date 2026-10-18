import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withGlow?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 rounded-lg',
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-10 h-10 rounded-2xl',
  lg: 'w-12 h-12 rounded-2xl',
  xl: 'w-16 h-16 rounded-3xl',
};

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  withGlow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-sm select-none ${
        sizeClasses[size]
      } ${withGlow ? 'shadow-lg shadow-[#2AABEE]/25' : ''} ${className}`}
    >
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full object-cover"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoBgGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#2EC4FF" />
            <stop offset="45%" stopColor="#2AABEE" />
            <stop offset="80%" stopColor="#1E88E5" />
            <stop offset="100%" stopColor="#1565C0" />
          </linearGradient>

          <linearGradient id="logoTopShine" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#072A4E" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Base Squircle */}
        <rect width="512" height="512" rx="115" fill="url(#logoBgGrad)" />
        <rect width="512" height="512" rx="115" fill="url(#logoTopShine)" />
        <rect
          x="2"
          y="2"
          width="508"
          height="508"
          rx="113"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.2"
          strokeWidth="4"
        />

        {/* Brand Dialogue Shapes */}
        <g filter="url(#logoShadow)">
          {/* Main Bubble */}
          <path
            d="M256 112 C 168 112, 96 178, 96 260 C 96 308, 122 350, 162 377 C 158 398, 146 418, 132 434 C 158 436, 194 425, 222 403 C 233 406, 244 408, 256 408 C 344 408, 416 342, 416 260 C 416 178, 344 112, 256 112 Z"
            fill="#FFFFFF"
          />

          {/* Inner Counter Cut */}
          <path
            d="M272 176 C 220 176, 178 214, 178 262 C 178 288, 192 312, 215 328 C 213 340, 206 352, 198 360 C 213 361, 234 354, 250 341 C 257 343, 264 344, 272 344 C 324 344, 366 306, 366 262 C 366 218, 324 176, 272 176 Z"
            fill="url(#logoBgGrad)"
          />

          {/* Core Eye Dot */}
          <circle cx="272" cy="260" r="28" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};
