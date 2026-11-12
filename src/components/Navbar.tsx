import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import { CustomerUser, SiteInfo } from '../types';
import { TricolorBands } from './TricolorBands';

interface NavbarProps {
  onOpenAuth?: () => void;
  currentUser?: CustomerUser | null;
  customLogoUrl?: string | null;
  customEmblemUrl?: string | null;
  isEmblemEnabled?: boolean;
  siteInfo?: SiteInfo;
  activeSection?: string;
  onNavigate?: (id: string, pathOverride?: string) => void;
}

// Logo oficial em lettering conforme anexo pelo cliente (fundo 100% transparente)
const HEADER_LETTERING_LOGO = '/assets/aistudio/Gemini_Generated_Image_spqd4gspqd4gspqd-removebg-preview_18fa875b.png';

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string, path: string) => {
    if (onNavigate) {
      onNavigate(id, path);
    } else {
      window.history.pushState({ section: id }, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Renderiza exclusivamente o logo em lettering anexado pelo cliente (sem logo redondo e sem disco de fundo)
  const renderHeaderLogotype = () => {
    return (
      <button
        onClick={() => handleNavClick('hero', '/')}
        className="flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 p-0 focus:outline-hidden"
        title="Ir para a Página Inicial - Deolinda Pizzaria Napoletana"
        aria-label="Deolinda Pizzaria Napoletana"
      >
        <img
          src={HEADER_LETTERING_LOGO}
          alt="Deolinda Pizzaria Napoletana"
          className="h-8 sm:h-10 md:h-11 w-auto max-w-[210px] sm:max-w-[250px] md:max-w-[290px] object-contain bg-transparent"
          loading="eager"
        />
      </button>
    );
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 bg-white text-[#181513] border-b border-[#EADFCF] ${
        isScrolled ? 'shadow-md py-2 sm:py-2.5' : 'py-2.5 sm:py-3.5'
      }`}
    >
      <div className="w-full max-w-[1550px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Mobile Header: Logo Lettering Centralizado no topo + Menu completo abaixo com ampla separação */}
        <div className="flex flex-col items-center justify-center w-full lg:hidden py-1 space-y-2">
          {/* Logo Lettering Centralizado no Mobile */}
          <div className="flex items-center justify-center py-0.5">
            {renderHeaderLogotype()}
          </div>

          {/* Itens do Menu Mobile com separação aumentada */}
          <nav className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-4 w-full py-0.5">
            {/* 1. Início */}
            <button
              onClick={() => handleNavClick('hero', '/')}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 font-cinzel uppercase text-[11px] sm:text-xs tracking-wider shrink-0 ${
                activeSection === 'hero'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-2xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-[#C24D2C]" />
              <span>Início</span>
            </button>

            {/* 2. Cardápio */}
            <button
              onClick={() => handleNavClick('cardapio', '/cardapio')}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-[11px] sm:text-xs tracking-wider shrink-0 ${
                activeSection === 'cardapio'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-2xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Cardápio
            </button>

            {/* 3. Nossa Tradição */}
            <button
              onClick={() => handleNavClick('historia', '/historia')}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-[11px] sm:text-xs tracking-wider shrink-0 ${
                activeSection === 'historia'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-2xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Nossa Tradição
            </button>

            {/* 4. Localização & Horários */}
            <button
              onClick={() => handleNavClick('localizacao', '/localizacao')}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-[11px] sm:text-xs tracking-wider shrink-0 ${
                activeSection === 'localizacao'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-2xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Localização & Horários
            </button>
          </nav>
        </div>

        {/* Desktop Navigation: Faixa tricolor + Asa esquerda + Logo centralizado (lettering) + Asa direita + Faixa tricolor */}
        <nav className="hidden lg:flex w-full items-center justify-between text-sm py-1">
          {/* Faixa Tricolor Esquerda */}
          <TricolorBands direction="left" theme="light" className="w-12 xl:w-20 shrink-0" size="sm" />

          {/* Asa Esquerda de Menus - Separação ampliada */}
          <div className="flex items-center gap-8 xl:gap-14 2xl:gap-20 flex-1 justify-end pr-8 xl:pr-14">
            {/* 1. Início */}
            <button
              onClick={() => handleNavClick('hero', '/')}
              title="Ir para a Página Inicial"
              aria-label="Página Inicial"
              className={`px-7 py-2.5 sm:px-8 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-2.5 font-cinzel uppercase text-xs sm:text-[13px] tracking-wider ${
                activeSection === 'hero'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              <Home className="w-4 h-4 text-[#C24D2C]" />
              <span>Início</span>
            </button>

            {/* 2. Cardápio */}
            <button
              onClick={() => handleNavClick('cardapio', '/cardapio')}
              className={`px-7 py-2.5 sm:px-8 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-xs sm:text-[13px] tracking-wider ${
                activeSection === 'cardapio'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Cardápio
            </button>
          </div>

          {/* LOGO CENTRALIZADO NO CABEÇALHO (Lettering anexo exclusivo, 100% transparente) */}
          <div className="shrink-0 px-4 xl:px-8">
            {renderHeaderLogotype()}
          </div>

          {/* Asa Direita de Menus - Separação ampliada */}
          <div className="flex items-center gap-8 xl:gap-14 2xl:gap-20 flex-1 justify-start pl-8 xl:pl-14">
            {/* 3. Nossa Tradição */}
            <button
              onClick={() => handleNavClick('historia', '/historia')}
              className={`px-7 py-2.5 sm:px-8 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-xs sm:text-[13px] tracking-wider ${
                activeSection === 'historia'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Nossa Tradição
            </button>

            {/* 4. Localização & Horários */}
            <button
              onClick={() => handleNavClick('localizacao', '/localizacao')}
              className={`px-7 py-2.5 sm:px-8 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-xs sm:text-[13px] tracking-wider ${
                activeSection === 'localizacao'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Localização & Horários
            </button>
          </div>

          {/* Faixa Tricolor Direita */}
          <TricolorBands direction="right" theme="light" className="w-12 xl:w-20 shrink-0" size="sm" />
        </nav>
      </div>
    </header>
  );
};
