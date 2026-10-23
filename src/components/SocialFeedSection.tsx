import React, { useState } from 'react';
import { 
  Instagram, 
  Camera, 
  X, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { SocialPost } from '../types';
import { SOCIAL_POSTS } from '../data/socialData';

interface SocialFeedSectionProps {
  posts?: SocialPost[];
}

export const SocialFeedSection: React.FC<SocialFeedSectionProps> = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  const displayPosts = posts && posts.length > 0 ? posts : SOCIAL_POSTS;

  return (
    <section id="galeria" className="pt-3 sm:pt-4 pb-12 bg-[#F4EFE6] text-[#1E1B18] border-b border-[#EADFCF] scroll-mt-16 sm:scroll-mt-18">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-3 sm:mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#C24D2C]/10 text-[#C24D2C] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5">
              <Camera className="w-3.5 h-3.5 text-[#C24D2C]" />
              <span>Fotos & Momentos • #DeolindaNapoletana</span>
            </div>
            <h2 className="font-serif-italian text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#181513] mb-1 leading-tight">
              Fotos & Momentos
            </h2>
            <p className="text-[#5C554E] text-xs sm:text-sm max-w-xl">
              Acompanhe as fotos e momentos especiais da Deolinda Pizzaria Napoletana e compartilhe sua experiência marcando <strong>@deolindapizzaria</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://www.instagram.com/deolindapizzaria/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white hover:bg-gray-100 text-[#181513] border border-[#E0D5C3] text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all"
            >
              <Instagram className="w-3.5 h-3.5 text-[#C24D2C]" />
              <span>Seguir @deolindapizzaria</span>
            </a>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayPosts.map((post) => {
            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-white rounded-2xl overflow-hidden border border-[#E0D5C3] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-[#181513]">
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Author Header on Top Right */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                    {post.author}
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                    <span className="text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full">
                      {post.timestamp}
                    </span>
                    <span className="text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
                      <Camera className="w-3 h-3 text-[#E5A93C]" />
                      <span>Ver foto</span>
                    </span>
                  </div>
                </div>

                {/* Caption Body */}
                <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
                  <p className="text-xs text-[#5C554E] leading-relaxed line-clamp-2 mb-2">
                    {post.caption}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F0EAE1]">
                    {post.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] sm:text-[11px] font-semibold text-[#1B382B]">
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

      {/* Selected Post Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E0D5C3] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 sm:h-96 bg-[#181513]">
              <img
                src={selectedPost.imageUrl}
                alt={selectedPost.caption}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                title="Fechar visualização"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#C24D2C] text-white flex items-center justify-center font-bold text-sm">
                    {selectedPost.author.charAt(1)?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#181513]">{selectedPost.author}</h4>
                    <p className="text-[11px] text-[#8C827A]">{selectedPost.timestamp}</p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E0D5C3] text-xs font-semibold text-[#5C554E] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#C24D2C]" />
                  <span>Galeria Oficial</span>
                </div>
              </div>

              <p className="text-sm text-[#5C554E] leading-relaxed">
                {selectedPost.caption}
              </p>

              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedPost.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#1B382B] text-xs font-semibold border border-[#E0D5C3]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8C827A]">
                <span>Deolinda Pizzaria Napoletana</span>
                <span className="text-[#C24D2C] font-semibold">Forno a Lenha 450°C</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
