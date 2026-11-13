import React, { useState, useEffect } from 'react';
import { compressImageElementToDataUrl } from '../utils/imageCompressor';

interface LazyGalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatioClass?: string;
  onClick?: () => void;
  onRelativeImageLoaded?: (portableDataUrl: string) => void;
}

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80';

export const LazyGalleryImage: React.FC<LazyGalleryImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatioClass = 'h-52 sm:h-56',
  onClick,
  onRelativeImageLoaded
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || DEFAULT_FALLBACK_IMAGE);

  useEffect(() => {
    setImgSrc(src || DEFAULT_FALLBACK_IMAGE);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (
      onRelativeImageLoaded &&
      imgSrc &&
      imgSrc.startsWith('/gallery_images/') &&
      e.currentTarget.complete &&
      e.currentTarget.naturalWidth > 0
    ) {
      const dataUrl = compressImageElementToDataUrl(e.currentTarget, 420000);
      if (dataUrl) {
        onRelativeImageLoaded(dataUrl);
      }
    }
  };

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
        onLoad={handleLoad}
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

