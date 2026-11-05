import React, { useState, useEffect, useRef } from 'react';
import { Pizza, ImageOff } from 'lucide-react';

interface LazyGalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatioClass?: string;
  onClick?: () => void;
}

export const LazyGalleryImage: React.FC<LazyGalleryImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatioClass = 'h-52 sm:h-56',
  onClick
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, load immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '250px 0px', // Preload when image is 250px away from entering viewport
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Reset states if src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${aspectRatioClass} overflow-hidden bg-[#241F1B] select-none`}
      onClick={onClick}
    >
      {/* Shimmer Skeleton Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#241F1B] via-[#352F29] to-[#241F1B] animate-pulse flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-amber-500/30">
            <Pizza className="w-8 h-8 animate-bounce mb-1 opacity-40" />
            <span className="text-[10px] tracking-wider uppercase font-medium text-amber-500/40">Deolinda</span>
          </div>
        </div>
      )}

      {/* Fallback when image fails to load */}
      {hasError ? (
        <div className="absolute inset-0 bg-[#2A231E] flex flex-col items-center justify-center text-[#B8A89A] p-4 text-center">
          <ImageOff className="w-8 h-8 text-[#C24D2C] mb-1.5 opacity-80" />
          <span className="text-[11px] font-semibold text-white/90">Momento Deolinda</span>
          <span className="text-[10px] text-white/50 mt-0.5 line-clamp-1">{alt}</span>
        </div>
      ) : (
        /* Actual Image with Lazy Loading & Smooth Fade-in */
        isInView && (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setIsLoaded(true);
              setHasError(true);
            }}
            className={`w-full h-full object-cover transition-all duration-700 ease-out ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } ${className}`}
          />
        )
      )}
    </div>
  );
};
