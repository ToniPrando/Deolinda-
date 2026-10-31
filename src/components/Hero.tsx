import React from 'react';
import { Flame, Clock } from 'lucide-react';
import { TricolorBands } from './TricolorBands';
import { SiteInfo } from '../types';

interface HeroProps {
  onOpenMenu?: () => void;
  onOpenReservation?: () => void;
  onOpenConcierge?: () => void;
  customLogoUrl?: string | null;
  customEmblemUrl?: string | null;
  isEmblemEnabled?: boolean;
  siteInfo?: SiteInfo;
}

export const Hero: React.FC<HeroProps> = ({
  customLogoUrl,
  customEmblemUrl,
  isEmblemEnabled = true,
  siteInfo
}) => {
  return (
    <section className="relative flex flex-col items-center justify-start overflow-hidden bg-[#14110F] text-white pt-2 sm:pt-4 pb-12 sm:pb-16">
      {/* Background with Dark Atmospheric Image & Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2000&q=80')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#14110F] via-[#14110F]/80 to-[#14110F]/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C24D2C]/20 via-transparent to-transparent pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 sm:pt-2 pb-6 text-center flex flex-col items-center">
        
        {/* Centered Large Deolinda Logo Lockup - Posicionado no topo bem próximo do cabeçalho */}
        <div className="flex flex-col items-center justify-center mb-6 w-full group">
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#181513] flex items-center justify-center shadow-2xl shadow-[#C24D2C]/60 border-2 sm:border-4 border-[#E5A93C] transform group-hover:scale-105 transition-transform duration-300 overflow-hidden p-1 shrink-0 mb-3">
            <img
              src={customLogoUrl || "/deolinda_logo.png"}
              alt="Logo Deolinda Pizzaria"
              className="w-full h-full object-contain filter drop-shadow-md"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Imagem anexa embaixo do logotipo da página principal */}
          {customEmblemUrl && isEmblemEnabled !== false && (
            <div className="flex items-center justify-center mb-3 max-w-xs sm:max-w-md px-4">
              <img
                src={customEmblemUrl}
                alt="Emblema Deolinda Pizzaria"
                className="h-14 sm:h-20 md:h-24 lg:h-28 w-auto max-w-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)] hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Sub-label banner with Italian Tricolore horizontal bands */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-1">
            <TricolorBands direction="left" theme="dark" className="w-10 sm:w-20 md:w-28" />

            {/* Text */}
            <span className="text-xs sm:text-base md:text-lg tracking-[0.25em] sm:tracking-[0.4em] uppercase font-bold text-[#FAF7F2] font-cinzel drop-shadow-md whitespace-nowrap">
              {siteInfo?.heroSubBadge || 'Pizzaria Napoletana'}
            </span>

            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-[#FAF7F2] bg-[#C24D2C] px-2.5 py-0.5 rounded-full border border-white/30 shadow-md whitespace-nowrap">
              D.O.P.
            </span>

            <TricolorBands direction="right" theme="dark" className="w-10 sm:w-20 md:w-28" />
          </div>
        </div>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-xl text-[#FAF7F2]/85 font-light leading-relaxed mb-8">
          {siteInfo?.heroSubtitle || (
            <>
              Fermentação natural lenta de <strong className="text-[#E5A93C] font-semibold">72 horas</strong>, farinha italiana Tipo 00, ingredientes certificados <strong className="text-[#E5A93C] font-semibold">D.O.P.</strong> e o fogo vivo da pedra vulcânica a <strong className="text-[#E5A93C] font-semibold">450°C</strong>.
            </>
          )}
        </p>

        {/* Artisan Highlights Bar */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto border-t border-white/10 pt-8 text-left">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#C24D2C]/30 text-[#E5A93C] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-[#E5A93C] tracking-wider">Fermentação</p>
              <p className="text-sm font-semibold text-white">{siteInfo?.heroFermentationHighlight || '72 Horas Lenta'}</p>
              <p className="text-[11px] text-white/60">{siteInfo?.heroFermentationSubtext || 'Leve e digestiva'}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#C24D2C]/30 text-[#C24D2C] shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-[#E5A93C] tracking-wider">Forno a Lenha</p>
              <p className="text-sm font-semibold text-white">{siteInfo?.heroOvenHighlight || '450°C em 90s'}</p>
              <p className="text-[11px] text-white/60">{siteInfo?.heroOvenSubtext || 'Pedra vulcânica'}</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
