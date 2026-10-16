import React from 'react';

interface TricolorBandsProps {
  direction?: 'left' | 'right';
  className?: string;
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const TricolorBands: React.FC<TricolorBandsProps> = ({
  direction = 'left',
  className = '',
  theme = 'dark',
  size = 'md'
}) => {
  const isLeft = direction === 'left';
  const gradientDir = isLeft ? 'bg-gradient-to-r' : 'bg-gradient-to-l';

  const heightClass = size === 'sm' ? 'h-[2px]' : size === 'lg' ? 'h-[3px]' : 'h-[2.5px]';
  const gapClass = size === 'sm' ? 'gap-[2px]' : 'gap-[3px]';

  const defaultWidth =
    size === 'sm' ? 'w-8 sm:w-12 md:w-16' : size === 'lg' ? 'w-14 sm:w-24 md:w-36' : 'w-10 sm:w-20 md:w-28';

  const middleLine =
    theme === 'dark'
      ? `${gradientDir} from-transparent via-white to-white shadow-[0_0_6px_rgba(255,255,255,0.6)]`
      : `${gradientDir} from-transparent via-[#C8BAA7] to-[#C8BAA7] shadow-[0_0_4px_rgba(200,186,167,0.4)]`;

  return (
    <div
      className={`flex flex-col ${gapClass} shrink-0 select-none pointer-events-none ${className || defaultWidth}`}
      aria-hidden="true"
    >
      {/* Verde Band */}
      <div
        className={`${heightClass} w-full rounded-full ${gradientDir} from-transparent via-[#008C45] to-[#008C45] shadow-[0_0_6px_rgba(0,140,69,0.6)]`}
      />
      {/* Bianco / Neutral Band */}
      <div className={`${heightClass} w-full rounded-full ${middleLine}`} />
      {/* Rosso Band */}
      <div
        className={`${heightClass} w-full rounded-full ${gradientDir} from-transparent via-[#CD212A] to-[#CD212A] shadow-[0_0_6px_rgba(205,33,42,0.6)]`}
      />
    </div>
  );
};
