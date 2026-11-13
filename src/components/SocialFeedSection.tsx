import React, { useState, useMemo } from 'react';
import { 
  Camera, 
  Flame,
  Maximize2, 
  Pause, 
  Play, 
  Info
} from 'lucide-react';
import { SocialPost } from '../types';
import { SOCIAL_POSTS } from '../data/socialData';
import { LazyGalleryImage } from './LazyGalleryImage';
import { PhotoLightbox } from './PhotoLightbox';
import { migrateCachedGalleryImageToFirestore } from '../services/firebaseService';

interface SocialFeedSectionProps {
  posts?: SocialPost[];
}

export const SocialFeedSection: React.FC<SocialFeedSectionProps> = ({ posts }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(true);

  const displayPosts = posts && posts.length > 0 ? posts : SOCIAL_POSTS;

  // Garante itens suficientes para preencher telas ultra-wide antes da duplicação de 50%
  const basePosts = useMemo(() => {
    if (displayPosts.length === 0) return [];
    if (displayPosts.length < 5) {
      return [...displayPosts, ...displayPosts, ...displayPosts];
    }
    return displayPosts;
  }, [displayPosts]);

  // Duplicação exata para looping infinito perfeito sem saltos visuais (0% -> -50%)
  const marqueePosts = useMemo(() => {
    return [...basePosts, ...basePosts];
  }, [basePosts]);

  // Velocidade suave e tranquila para contemplação dos momentos (aprox 10s por item)
  const animationDurationSeconds = Math.max(75, Math.round(basePosts.length * 10));

  return (
    <section id="galeria" className="pt-8 sm:pt-12 pb-14 bg-white text-[#181513] border-t border-[#EADFCF] scroll-mt-16 sm:scroll-mt-18 overflow-hidden">
      {/* CSS do looping contínuo da direita para a esquerda */}
      <style>{`
        @keyframes marqueeScrollLeft {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-track-infinite {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: marqueeScrollLeft ${animationDurationSeconds}s linear infinite;
        }
        .marquee-container:hover .marquee-track-infinite {
          animation-play-state: paused;
        }
      `}</style>

      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#F0EAE1]">
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

          {/* Canto direito da galeria: Apenas os 3 ícones solicitados (Pausar, Expandir e Detalhes) */}
          <div className="flex items-center gap-2.5 self-start md:self-end shrink-0">
            {/* 1. Ícone para Pausar / Retomar o movimento */}
            <button
              type="button"
              onClick={() => setIsPaused(prev => !prev)}
              title={isPaused ? "Retomar movimento automático" : "Pausar movimento automático"}
              aria-label={isPaused ? "Retomar movimento" : "Pausar movimento"}
              className="p-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E0D5C3] text-[#5C554E] hover:text-[#C24D2C] transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-emerald-600 fill-current" />
              ) : (
                <Pause className="w-4 h-4 text-[#C24D2C]" />
              )}
            </button>

            {/* 2. Ícone para Expandir em Tela Cheia */}
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              title="Expandir foto em tela cheia"
              aria-label="Expandir foto"
              className="p-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E0D5C3] text-[#5C554E] hover:text-[#C24D2C] transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            >
              <Maximize2 className="w-4 h-4 text-[#C24D2C]" />
            </button>

            {/* 3. Ícone para Ver Detalhes das Fotos */}
            <button
              type="button"
              onClick={() => setShowDetails(prev => !prev)}
              title={showDetails ? "Ocultar legendas e detalhes das fotos" : "Ver legendas e detalhes das fotos"}
              aria-label="Ver detalhes das fotos"
              className={`p-2.5 rounded-full border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                showDetails 
                  ? 'bg-[#FAF7F2] text-[#C24D2C] border-[#C24D2C]/40 shadow-xs' 
                  : 'bg-[#FAF7F2] hover:bg-[#F2ECE1] border-[#E0D5C3] text-[#5C554E] hover:text-[#C24D2C]'
              }`}
            >
              <Info className="w-4 h-4 text-[#C24D2C]" />
            </button>
          </div>
        </div>
      </div>

      {/* Carrossel Infinito em Fila Única (Marquee da Direita para a Esquerda) */}
      <div className="relative w-full overflow-hidden marquee-container py-2">
        
        {/* Máscaras de gradiente suave nas laterais para entrada e saída elegantes */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-20 md:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-20 md:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

        {/* Trilha do looping contínuo */}
        <div 
          className="marquee-track-infinite flex items-stretch gap-4 sm:gap-6 px-4"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {marqueePosts.map((post, idx) => {
            const originalIndex = idx % displayPosts.length;
            return (
              <div
                key={`${post.id || 'post'}-${idx}`}
                onClick={() => setLightboxIndex(originalIndex)}
                className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 bg-white rounded-3xl overflow-hidden border border-[#E0D5C3] shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-pointer hover:-translate-y-1.5 focus:outline-hidden"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxIndex(originalIndex);
                  }
                }}
                aria-label={`Abrir foto ${originalIndex + 1}: ${post.caption}`}
              >
                {/* Imagem do Momento */}
                <div className={`relative overflow-hidden bg-[#181513] transition-all duration-300 ${showDetails ? 'h-60 sm:h-64' : 'h-80 sm:h-96'}`}>
                  <LazyGalleryImage
                    src={post.imageUrl}
                    alt={post.caption}
                    aspectRatioClass="h-full w-full"
                    className="group-hover:scale-108 transition-transform duration-500"
                    onRelativeImageLoaded={(portableDataUrl) => {
                      migrateCachedGalleryImageToFirestore(post, portableDataUrl);
                    }}
                  />

                  {/* Gradiente escuro para legibilidade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-75 group-hover:opacity-90 transition-opacity pointer-events-none" />

                  {/* Tag do Autor no topo direito */}
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold border border-white/20 pointer-events-none">
                    {post.author}
                  </div>

                  {/* Selo No Forno */}
                  {post.isHotOutOfOven && (
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#C24D2C] text-white text-[10px] font-bold flex items-center gap-1 shadow-sm pointer-events-none">
                      <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
                      <span>No Forno</span>
                    </div>
                  )}

                  {/* Ícone de Maximizar ao passar o mouse */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/25 pointer-events-none">
                    <div className="p-3.5 rounded-full bg-black/65 text-white backdrop-blur-md border border-white/30 transform group-hover:scale-110 transition-transform duration-300 shadow-xl">
                      <Maximize2 className="w-5 h-5 text-amber-300" />
                    </div>
                  </div>

                  {/* Informações da Base da Foto */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-[11px] pointer-events-none">
                    <span className="text-white/90 bg-black/55 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px]">
                      {post.timestamp}
                    </span>
                    <span className="text-white/95 bg-black/55 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 group-hover:bg-[#C24D2C] transition-colors">
                      <Camera className="w-3 h-3" />
                      <span>Tela cheia</span>
                    </span>
                  </div>
                </div>

                {/* Legenda e Tags (Alternável pelo ícone de detalhes) */}
                {showDetails && (
                  <div className="p-4 sm:p-4.5 flex flex-col flex-1 justify-between bg-white space-y-2 animate-in fade-in duration-200">
                    <p className="text-xs sm:text-sm text-[#5C554E] leading-relaxed line-clamp-2 group-hover:text-[#181513] transition-colors font-normal">
                      {post.caption}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F0EAE1]">
                      {(post.tags || []).slice(0, 3).map((tag, tIdx) => (
                        <span key={tIdx} className="text-[11px] font-semibold text-[#C24D2C]">
                          {tag}
                        </span>
                      ))}
                      {(post.tags || []).length > 3 && (
                        <span className="text-[10px] font-medium text-[#8C827A]">
                          +{(post.tags || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Modal Lightbox em Tela Cheia */}
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
