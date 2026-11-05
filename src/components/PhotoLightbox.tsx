import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  Flame, 
  Info,
  Loader2,
  ImageOff
} from 'lucide-react';
import { SocialPost } from '../types';

interface PhotoLightboxProps {
  posts: SocialPost[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (newIndex: number) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  posts,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [hasImageError, setHasImageError] = useState(false);

  // Touch gesture state for mobile swiping
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const currentPost = posts[currentIndex];
  const totalPosts = posts.length;

  // Reset zoom and image state whenever currentIndex changes
  useEffect(() => {
    setIsZoomed(false);
    setIsImageLoading(true);
    setHasImageError(false);

    // Scroll active thumbnail into view
    if (thumbnailStripRef.current) {
      const activeThumb = thumbnailStripRef.current.children[currentIndex] as HTMLElement | undefined;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentIndex]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (totalPosts <= 1) return;
    const nextIdx = (currentIndex - 1 + totalPosts) % totalPosts;
    onIndexChange(nextIdx);
  }, [currentIndex, totalPosts, onIndexChange]);

  const handleNext = useCallback(() => {
    if (totalPosts <= 1) return;
    const nextIdx = (currentIndex + 1) % totalPosts;
    onIndexChange(nextIdx);
  }, [currentIndex, totalPosts, onIndexChange]);

  // Toggle browser fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Listen for browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isZoomed, onClose, handlePrev, handleNext, toggleFullscreen]);

  // Touch handlers for mobile swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return; // Allow panning when zoomed instead of swiping
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Only register as swipe if horizontal movement is dominant and > 45px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (!isOpen || !currentPost) return null;

  return (
    <div 
      ref={lightboxRef}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar / Header Controls */}
      <div className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Left: Counter & Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1 rounded-full bg-white/10 text-white font-medium text-xs sm:text-sm border border-white/15 backdrop-blur-md">
            <span>{currentIndex + 1}</span>
            <span className="text-white/50 mx-1">/</span>
            <span className="text-white/70">{totalPosts}</span>
          </div>

          {currentPost.isHotOutOfOven && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C24D2C] text-white text-xs font-bold shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Forno 430°C</span>
            </div>
          )}
        </div>

        {/* Right: Actions (Zoom, Info, Fullscreen, Close) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className={`p-2 sm:p-2.5 rounded-full transition-colors cursor-pointer ${
              isZoomed 
                ? 'bg-[#C24D2C] text-white' 
                : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
            }`}
            title={isZoomed ? "Reduzir zoom (Esc)" : "Ampliar foto"}
            aria-label="Alternar Zoom"
          >
            {isZoomed ? <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" /> : <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Info Toggle */}
          <button
            type="button"
            onClick={() => setShowInfo((prev) => !prev)}
            className={`p-2 sm:p-2.5 rounded-full transition-colors cursor-pointer ${
              showInfo 
                ? 'bg-white/20 text-white' 
                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
            }`}
            title={showInfo ? "Ocultar detalhes da foto (I)" : "Mostrar detalhes da foto (I)"}
            aria-label="Alternar informações"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Fullscreen API Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer hidden sm:flex"
            title={isFullscreen ? "Sair da tela cheia (F)" : "Tela cheia completa (F)"}
            aria-label="Tela cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-[#C24D2C] text-white transition-colors cursor-pointer ml-1"
            title="Fechar visualizador (Esc)"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Main Center Area: Image & Navigation Arrows */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-0">
        
        {/* Navigation Arrow - Previous */}
        {totalPosts > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-6 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/50 hover:bg-[#C24D2C] text-white border border-white/20 backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 focus:outline-hidden"
            title="Foto anterior (Seta para a esquerda)"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Loading Spinner */}
        {isImageLoading && !hasImageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 z-10 pointer-events-none">
            <Loader2 className="w-10 h-10 animate-spin text-[#C24D2C] mb-2" />
            <span className="text-xs sm:text-sm font-medium tracking-wide">Carregando momento...</span>
          </div>
        )}

        {/* Error Fallback */}
        {hasImageError ? (
          <div className="flex flex-col items-center justify-center text-white/70 p-8 rounded-2xl bg-white/5 border border-white/10 max-w-sm text-center">
            <ImageOff className="w-12 h-12 text-[#C24D2C] mb-3" />
            <p className="font-semibold text-sm mb-1 text-white">Não foi possível carregar esta foto</p>
            <p className="text-xs text-white/60 mb-4">{currentPost.caption}</p>
            <button
              onClick={() => {
                setHasImageError(false);
                setIsImageLoading(true);
              }}
              className="px-4 py-2 rounded-full bg-[#C24D2C] text-white text-xs font-semibold hover:bg-[#A83F23] cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          /* Active Image Container */
          <div 
            className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ${
              isZoomed ? 'cursor-zoom-out overflow-auto scale-125 sm:scale-150' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed((prev) => !prev)}
          >
            <img
              key={currentPost.id}
              src={currentPost.imageUrl}
              alt={currentPost.caption}
              className={`max-w-full max-h-[72vh] sm:max-h-[78vh] object-contain rounded-xl shadow-2xl transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setIsImageLoading(false);
                setHasImageError(true);
              }}
              draggable={false}
            />
          </div>
        )}

        {/* Navigation Arrow - Next */}
        {totalPosts > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-6 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/50 hover:bg-[#C24D2C] text-white border border-white/20 backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 focus:outline-hidden"
            title="Próxima foto (Seta para a direita)"
            aria-label="Próxima foto"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Bottom Section: Details + Thumbnails */}
      <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/85 to-transparent pt-3 pb-4 sm:pb-5 px-3 sm:px-6">
        
        {/* Caption & Metadata Panel (Toggleable) */}
        {showInfo && (
          <div className="max-w-4xl mx-auto mb-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 text-white animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#C24D2C] text-white font-bold text-xs flex items-center justify-center">
                  {currentPost.author.charAt(1)?.toUpperCase() || 'D'}
                </span>
                <span className="font-semibold text-xs sm:text-sm text-white">
                  {currentPost.author}
                </span>
                <span className="text-white/40 text-xs">•</span>
                <span className="text-white/60 text-xs">
                  {currentPost.timestamp}
                </span>
              </div>

              <div className="text-[11px] text-[#C24D2C] font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Deolinda Pizzaria Napoletana</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-2 sm:line-clamp-3">
              {currentPost.caption}
            </p>

            {currentPost.tags && currentPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentPost.tags.map((tag, tIdx) => (
                  <span 
                    key={tIdx} 
                    className="text-[10px] sm:text-[11px] font-semibold text-amber-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Thumbnail Carousel Strip */}
        {totalPosts > 1 && (
          <div 
            ref={thumbnailStripRef}
            className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-4xl mx-auto justify-start sm:justify-center"
          >
            {posts.map((post, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={post.id || idx}
                  type="button"
                  onClick={() => onIndexChange(idx)}
                  className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-[#C24D2C] ring-offset-2 ring-offset-black scale-105 opacity-100' 
                      : 'opacity-40 hover:opacity-85 hover:scale-102'
                  }`}
                  title={`Ir para foto ${idx + 1}`}
                  aria-label={`Ver foto ${idx + 1}`}
                >
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {post.isHotOutOfOven && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C24D2C]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Keyboard hints on desktop */}
        <div className="hidden sm:flex items-center justify-center gap-4 mt-2 text-[10px] text-white/40">
          <span>← / → Navegar fotos</span>
          <span>•</span>
          <span>Esc Fechar</span>
          <span>•</span>
          <span>F Tela Cheia</span>
          <span>•</span>
          <span>I Alternar Legenda</span>
        </div>
      </div>
    </div>
  );
};
