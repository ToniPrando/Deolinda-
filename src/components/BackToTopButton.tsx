import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopButtonProps {
  heroBlockRef: React.RefObject<HTMLDivElement | null>;
  activeSection: string;
  hidden?: boolean;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  heroBlockRef,
  activeSection,
  hidden = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkScrollVisibility = () => {
      if (typeof window === 'undefined') return;

      let threshold = Math.max(Math.round(window.innerHeight * 0.65), 360);

      if (activeSection === 'hero' && heroBlockRef.current) {
        const heroHeight = heroBlockRef.current.offsetHeight;
        if (heroHeight > 0) {
          threshold = Math.max(heroHeight - 80, 320);
        }
      }

      setIsVisible(window.scrollY > threshold);
    };

    checkScrollVisibility();
    window.addEventListener('scroll', checkScrollVisibility, { passive: true });
    window.addEventListener('resize', checkScrollVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkScrollVisibility);
      window.removeEventListener('resize', checkScrollVisibility);
    };
  }, [activeSection, heroBlockRef]);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const shouldShow = isVisible && !hidden;

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Voltar ao Topo"
      title="Voltar ao Topo"
      aria-hidden={!shouldShow}
      tabIndex={shouldShow ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 w-12 h-12 flex items-center justify-center rounded-full bg-[#181513]/95 dark:bg-[#25201B]/95 hover:bg-[#C24D2C] dark:hover:bg-[#C24D2C] text-[#FAF7F2] border border-[#E5A93C]/50 dark:border-[#E5A93C]/70 hover:border-[#E5A93C] shadow-[0_12px_30px_rgba(24,21,19,0.35)] backdrop-blur-md transition-all duration-300 cursor-pointer group ${
        shouldShow
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5 text-[#E5A93C] group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-200" />
    </button>
  );
};
