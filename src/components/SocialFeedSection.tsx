import React, { useState } from 'react';
import { 
  Camera, 
  Flame,
  Maximize2
} from 'lucide-react';
import { SocialPost } from '../types';
import { SOCIAL_POSTS } from '../data/socialData';
import { LazyGalleryImage } from './LazyGalleryImage';
import { PhotoLightbox } from './PhotoLightbox';

interface SocialFeedSectionProps {
  posts?: SocialPost[];
}

export const SocialFeedSection: React.FC<SocialFeedSectionProps> = ({ posts }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const displayPosts = posts && posts.length > 0 ? posts : SOCIAL_POSTS;

  return (
    <section id="galeria" className="pt-8 sm:pt-12 pb-16 bg-white text-[#181513] border-t border-[#EADFCF] scroll-mt-16 sm:scroll-mt-18">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-[#F0EAE1]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C24D2C]/10 text-[#C24D2C] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 border border-[#C24D2C]/25">
              <Camera className="w-3.5 h-3.5 text-[#C24D2C]" />
              <span>Galeria de Momentos • #DeolindaNapoletana</span>
            </div>
            
            <h2 className="font-serif-italian text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#181513] mb-1.5 leading-tight">
              Momentos da Pizzaria
            </h2>
            
            <p className="text-[#5C554E] text-xs sm:text-sm max-w-2xl leading-relaxed">
              Confira os momentos especiais, as pizzas artesanais recém-saídas do forno a 430°C e a atmosfera acolhedora da Deolinda.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E0D5C3] text-xs font-medium text-[#7C6F62]">
              <Maximize2 className="w-3.5 h-3.5 text-[#C24D2C]" />
              <span>Clique na foto para expandir</span>
            </span>
          </div>
        </div>

        {/* Gallery Grid with Lazy Loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {displayPosts.map((post, idx) => {
            return (
              <div
                key={post.id || idx}
                onClick={() => setLightboxIndex(idx)}
                className="bg-white rounded-2xl overflow-hidden border border-[#E0D5C3] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer hover:-translate-y-1 focus:outline-hidden"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxIndex(idx);
                  }
                }}
                aria-label={`Abrir foto ${idx + 1}: ${post.caption}`}
              >
                {/* Image Container with High-Performance Lazy Loading */}
                <div className="relative overflow-hidden bg-[#181513]">
                  <LazyGalleryImage
                    src={post.imageUrl}
                    alt={post.caption}
                    aspectRatioClass="h-52 sm:h-56"
                    className="group-hover:scale-108"
                  />

                  {/* Dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-75 group-hover:opacity-90 transition-opacity pointer-events-none" />

                  {/* Author Header on Top Right */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold border border-white/20 pointer-events-none">
                    {post.author}
                  </div>

                  {/* Hot Badge */}
                  {post.isHotOutOfOven && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#C24D2C] text-white text-[10px] font-bold flex items-center gap-1 shadow-sm pointer-events-none">
                      <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
                      <span>No Forno</span>
                    </div>
                  )}

                  {/* Hover visual cue with Maximize icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/25 pointer-events-none">
                    <div className="p-3 rounded-full bg-black/65 text-white backdrop-blur-md border border-white/30 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Maximize2 className="w-5 h-5 text-amber-300" />
                    </div>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] pointer-events-none">
                    <span className="text-white/90 bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px]">
                      {post.timestamp}
                    </span>
                    <span className="text-white/95 bg-black/55 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 group-hover:bg-[#C24D2C] transition-colors">
                      <Camera className="w-3 h-3" />
                      <span>Tela cheia</span>
                    </span>
                  </div>
                </div>

                {/* Caption Body */}
                <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
                  <p className="text-xs text-[#5C554E] leading-relaxed line-clamp-2 mb-2 group-hover:text-[#181513] transition-colors">
                    {post.caption}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-2 border-t border-[#F0EAE1]">
                    {(post.tags || []).map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-semibold text-[#C24D2C]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      <PhotoLightbox
        posts={displayPosts}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(newIndex) => setLightboxIndex(newIndex)}
      />

    </section>
  );
};
