import React, { useState, useEffect } from 'react';

interface LazyGalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatioClass?: string;
  onClick?: () => void;
}

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80';

export const LazyGalleryImage: React.FC<LazyGalleryImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatioClass = 'h-52 sm:h-56',
  onClick
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || DEFAULT_FALLBACK_IMAGE);

  useEffect(() => {
    setImgSrc(src || DEFAULT_FALLBACK_IMAGE);
  }, [src]);

  return (
    <div 
      className={`relative w-full ${aspectRatioClass} overflow-hidden bg-[#181513] select-none`}
      onClick={onClick}
    >
      <img
        src={imgSrc}
        alt={alt || 'Momento Deolinda Pizzaria'}
        loading="eager"
        decoding="async"
        onError={() => {
          if (imgSrc !== DEFAULT_FALLBACK_IMAGE) {
            setImgSrc(DEFAULT_FALLBACK_IMAGE);
          }
        }}
        className={`w-full h-full object-cover ${className}`}
      />
    </div>
  );
};
