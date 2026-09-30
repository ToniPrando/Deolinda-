import React from 'react';

interface ToniAepLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
}

export const ToniAepLogo: React.FC<ToniAepLogoProps> = ({
  className = 'h-14 w-auto',
  variant = 'dark',
  showSubtitle = true,
}) => {
  // On dark backgrounds (like the footer), we use bright vivid blue & light tones for high legibility
  const textDark = variant === 'light' ? '#041B3B' : '#FFFFFF';
  const subText = variant === 'light' ? '#0D274D' : '#D1E4FF';

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 520 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-h-20"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Main 3D Ribbon Gradients */}
          <linearGradient id="toniaep-ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C8FF" />
            <stop offset="35%" stopColor="#0077FF" />
            <stop offset="75%" stopColor="#0051FF" />
            <stop offset="100%" stopColor="#002D9C" />
          </linearGradient>

          <linearGradient id="toniaep-ribbon-front" x1="20%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#2AD5FF" />
            <stop offset="40%" stopColor="#0080FF" />
            <stop offset="85%" stopColor="#004AD6" />
          </linearGradient>

          <linearGradient id="toniaep-circuit-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000F29" />
            <stop offset="100%" stopColor="#002052" />
          </linearGradient>

          <linearGradient id="toniaep-i-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0070FF" />
          </linearGradient>

          <linearGradient id="toniaep-line-grad-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00C8FF" stopOpacity="0" />
            <stop offset="100%" stopColor="#0077FF" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="toniaep-line-grad-right" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0077FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00C8FF" stopOpacity="0" />
          </linearGradient>

          {/* Circuit glow filter */}
          <filter id="circuit-neon" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. "Ton" Text */}
        <g id="logo-ton">
          {/* T */}
          <path
            d="M 24 45 L 88 45 C 90.5 45 92 46.5 92 49 L 92 53 C 92 55.5 90.5 57 88 57 L 62 57 L 62 108 C 62 110.5 60.5 112 58 112 L 48 112 C 45.5 112 44 110.5 44 108 L 44 57 L 24 57 C 21.5 57 20 55.5 20 53 L 20 49 C 20 46.5 21.5 45 24 45 Z"
            fill={textDark}
          />
          {/* o */}
          <path
            d="M 125 56 C 142 56 154 68 154 85 C 154 102 142 114 125 114 C 108 114 96 102 96 85 C 96 68 108 56 125 56 Z M 125 70 C 116 70 110 76 110 85 C 110 94 116 100 125 100 C 134 100 140 94 140 85 C 140 76 134 70 125 70 Z"
            fill={textDark}
          />
          {/* n */}
          <path
            d="M 160 58 C 160 56.5 161.5 55 163.5 55 L 171.5 55 C 173.5 55 175 56.5 175 58 L 175 66 C 180 58.5 188 56 197 56 C 211 56 219 64 219 78 L 219 109 C 219 111 217.5 112 215.5 112 L 206.5 112 C 204.5 112 203 111 203 109 L 203 82 C 203 73 198 68 190 68 C 181 68 175 74 175 84 L 175 109 C 175 111 173.5 112 171.5 112 L 163.5 112 C 161.5 112 160 111 160 109 Z"
            fill={textDark}
          />
        </g>

        {/* 2. "i" with Square Dot */}
        <g id="logo-i">
          {/* Square dot */}
          <rect
            x="225"
            y="23"
            width="20"
            height="18"
            rx="4"
            fill="url(#toniaep-i-grad)"
          />
          {/* i stem */}
          <rect
            x="225"
            y="49"
            width="20"
            height="63"
            rx="4"
            fill="url(#toniaep-i-grad)"
          />
        </g>

        {/* 3. Stylized 3D Loop Ribbon 'A' with circuit board leaf */}
        <g id="logo-ribbon-A">
          {/* Main Back Ribbon Flow */}
          <path
            d="M 228 92 C 228 116 244 126 262 126 C 286 126 304 96 322 56 C 334 30 352 22 368 25 C 388 28 402 48 402 78 C 402 108 376 128 340 128 C 314 128 296 112 292 98 C 290 92 296 86 302 86 C 308 86 313 90 316 95 C 322 105 334 112 346 110 C 362 107 378 95 378 76 C 378 57 368 42 355 40 C 344 38 333 46 324 67 C 304 112 282 142 254 142 C 230 142 210 122 210 94 C 210 82 214 68 220 54 L 234 54 C 230 65 228 79 228 92 Z"
            fill="url(#toniaep-ribbon-grad)"
          />

          {/* Front Dynamic 3D Loop */}
          <path
            d="M 248 126 C 274 126 295 98 316 54 C 328 29 344 21 358 23 C 375 25 388 42 388 68 C 388 95 364 116 335 116 C 316 116 302 104 298 94 C 295 86 300 80 307 80 C 313 80 317 84 320 89 C 324 97 334 102 344 100 C 356 97 368 86 368 68 C 368 50 359 38 348 37 C 339 36 329 44 321 62 C 302 105 278 138 250 138 C 238 138 228 130 224 118 C 231 123 239 126 248 126 Z"
            fill="url(#toniaep-ribbon-front)"
          />

          {/* Circuit Board Tail Shape (Dark Tech Infill) */}
          <path
            d="M 312 88 C 322 110 345 125 368 123 C 384 122 396 110 398 96 C 388 106 374 110 358 106 C 342 102 328 88 322 75 L 312 88 Z"
            fill="url(#toniaep-circuit-glow)"
          />

          {/* Circuit Traces and Glowing Nodes */}
          <g filter="url(#circuit-neon)">
            {/* Top Circuit Line */}
            <path
              d="M 334 82 Q 346 95 365 98"
              stroke="#00E5FF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="367" cy="98" r="3.2" fill="#00E5FF" />

            {/* Mid Circuit Line */}
            <path
              d="M 342 90 Q 355 104 374 105"
              stroke="#2AD5FF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="376" cy="105" r="3.2" fill="#2AD5FF" />

            {/* Lower Circuit Line */}
            <path
              d="M 352 100 Q 366 112 384 110"
              stroke="#00C8FF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="386" cy="110" r="3.2" fill="#00C8FF" />

            {/* Circuit Node Dots */}
            <circle cx="334" cy="82" r="2.2" fill="#2AD5FF" />
            <circle cx="342" cy="90" r="2.2" fill="#2AD5FF" />
            <circle cx="352" cy="100" r="2.2" fill="#2AD5FF" />
          </g>
        </g>

        {/* 4. "ep" Text */}
        <g id="logo-ep">
          {/* e */}
          <path
            d="M 436 84 C 436 70 426 56 412 56 C 398 56 388 68 388 85 C 388 102 399 114 414 114 C 424 114 432 108 436 101 C 437 99 436 97 434 96 L 427 92 C 425 91 423 92 421 94 C 418 99 414 101 409 101 C 402 101 397 96 397 88 L 434 88 C 435.5 88 436 86.5 436 84 Z M 397 79 C 398 72 403 67 411 67 C 418 67 424 72 424 79 Z"
            fill={textDark}
          />
          {/* p */}
          <path
            d="M 444 58 C 444 56.5 445.5 55 447.5 55 L 455.5 55 C 457.5 55 459 56.5 459 58 L 459 66 C 464 58.5 472 56 482 56 C 496 56 507 68 507 85 C 507 102 496 114 482 114 C 472 114 464 111.5 459 104 L 459 133 C 459 135 457.5 136 455.5 136 L 447.5 136 C 445.5 136 444 135 444 133 Z M 482 70 C 473 70 467 76 467 85 C 467 94 473 100 482 100 C 491 100 497 94 497 85 C 497 76 491 70 482 70 Z"
            fill={textDark}
          />
        </g>

        {/* 5. Subtitle & Glowing Accent Line: "CRIANDO INOVAÇÃO" */}
        {showSubtitle && (
          <g id="logo-subtitle">
            {/* Left Accent Line */}
            <line
              x1="45"
              y1="160"
              x2="105"
              y2="160"
              stroke="url(#toniaep-line-grad-left)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Slogan Text */}
            <text
              x="260"
              y="164"
              textAnchor="middle"
              fill={subText}
              fontSize="16"
              fontWeight="700"
              letterSpacing="7"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              CRIANDO INOVAÇÃO
            </text>

            {/* Right Accent Line */}
            <line
              x1="415"
              y1="160"
              x2="475"
              y2="160"
              stroke="url(#toniaep-line-grad-right)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
