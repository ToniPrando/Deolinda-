import React, { useState, useEffect } from 'react';
import deolindaLogo from '../assets/images/deolinda_logo.png';
import { Home } from 'lucide-react';
import { CustomerUser, SiteInfo } from '../types';
import { TricolorBands } from './TricolorBands';
import { DeolindaLogotype } from './DeolindaLogotype';

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

export const Navbar: React.FC<NavbarProps> = ({
  customLogoUrl,
  customEmblemUrl,
  isEmblemEnabled = true,
  siteInfo,
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

  const renderHeaderLogotype = (isMobile = false) => {
    if (customEmblemUrl && isEmblemEnabled !== false) {
      return (
        <img
          src={customEmblemUrl}
          alt="Logotipo Deolinda Pizzaria"
          className={
            isMobile
              ? "h-7 sm:h-8 w-auto max-w-[150px] object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
              : "h-9 sm:h-11 w-auto max-w-[180px] sm:max-w-[220px] object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
          }
          loading="eager"
        />
      );
    }
    if (customLogoUrl && customLogoUrl !== '/deolinda_logo.png' && !customLogoUrl.includes('deolinda_logo')) {
      return (
        <img
          src={customLogoUrl}
          alt="Logotipo Deolinda Pizzaria"
          className={
            isMobile
              ? "h-7 sm:h-8 w-auto max-w-[150px] object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
              : "h-9 sm:h-11 w-auto max-w-[180px] sm:max-w-[220px] object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
          }
          loading="eager"
        />
      );
    }
    return (
      <DeolindaLogotype
        variant="original"
        className={
          isMobile
            ? "h-6 sm:h-7 w-auto max-w-[140px] sm:max-w-[160px] drop-shadow-xs group-hover:scale-105 transition-transform"
            : "h-8 sm:h-10 w-auto max-w-[170px] sm:max-w-[220px] drop-shadow-xs group-hover:scale-105 transition-transform"
        }
      />
    );
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 bg-white text-[#181513] border-b border-[#EADFCF] ${
        isScrolled ? 'shadow-md py-1.5' : 'py-2 sm:py-3'
      }`}
    >
      <div className="w-full max-w-[1550px] mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Mobile Header: Logotipo Centralizado no topo + Todo o menu visível e centralizado logo abaixo (Sem fundo branco extra) */}
        <div className="flex flex-col items-center justify-center w-full lg:hidden py-0.5 space-y-1.5">
          {/* Logotipo Deolinda Centralizado com Faixas Italianas */}
          <div className="flex items-center justify-center gap-2">
            <TricolorBands direction="left" theme="light" className="w-7 sm:w-10 shrink-0" size="sm" />
            
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('hero', '/');
              }}
              title="Deolinda Pizzaria Napoletana - Ir para a Página Inicial"
              className="flex items-center justify-center group cursor-pointer py-0.5"
            >
              {renderHeaderLogotype(true)}
            </a>

            <TricolorBands direction="right" theme="light" className="w-7 sm:w-10 shrink-0" size="sm" />
          </div>

          {/* Todo o menu visível e centralizado no celular */}
          <nav className="flex items-center justify-center flex-wrap gap-1 sm:gap-2 w-full pt-0.5">
            {/* 1. Início */}
            <button
              onClick={() => handleNavClick('hero', '/')}
              className={`px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 font-cinzel uppercase text-[11px] sm:text-xs tracking-wider shrink-0 ${
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
              className={`px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-[11px] sm:text-xs tracking-wider shrink-0 ${
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
              className={`px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-[11px] sm:text-xs tracking-wider shrink-0 ${
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
              className={`px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-[11px] sm:text-xs tracking-wider shrink-0 ${
                activeSection === 'localizacao'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-2xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Localização & Horários
            </button>
          </nav>
        </div>

        {/* Desktop Navigation: Distribuído ocupando todo o espaço com o Logo Centralizado entre Cardápio e Nossa Tradição */}
        <nav className="hidden lg:flex w-full items-center justify-between text-sm py-1">
          {/* Asa Esquerda do Menu */}
          <div className="flex-1 flex items-center justify-evenly gap-3 xl:gap-8 pr-4 xl:pr-8">
            <TricolorBands direction="left" theme="light" className="w-10 xl:w-20 shrink-0" size="sm" />

            {/* 1. Início */}
            <button
              onClick={() => handleNavClick('hero', '/')}
              title="Ir para a Página Inicial"
              aria-label="Página Inicial"
              className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 font-cinzel uppercase text-xs sm:text-[13px] tracking-wider ${
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
              className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-xs sm:text-[13px] tracking-wider ${
                activeSection === 'cardapio'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Cardápio
            </button>
          </div>

          {/* 3. LOGOTIPO CENTRALIZADO COM ESPAÇAMENTO GENEROSO (Fundo 100% transparente) */}
          <div className="shrink-0 flex items-center justify-center px-4 sm:px-6 xl:px-12">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('hero', '/');
              }}
              title="Deolinda Pizzaria Napoletana - Ir para a Página Inicial"
              className="flex items-center justify-center group cursor-pointer py-1"
            >
              {renderHeaderLogotype(false)}
            </a>
          </div>

          {/* Asa Direita do Menu */}
          <div className="flex-1 flex items-center justify-evenly gap-3 xl:gap-8 pl-4 xl:pl-8">
            {/* 4. Nossa Tradição */}
            <button
              onClick={() => handleNavClick('historia', '/historia')}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-xs sm:text-[13px] tracking-wider ${
                activeSection === 'historia'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Nossa Tradição
            </button>

            {/* 5. Localização & Horários */}
            <button
              onClick={() => handleNavClick('localizacao', '/localizacao')}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-cinzel uppercase text-xs sm:text-[13px] tracking-wider ${
                activeSection === 'localizacao'
                  ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold shadow-xs border border-[#E0D5C3]'
                  : 'text-[#4A423B] hover:text-[#C24D2C] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              Localização & Horários
            </button>

            <TricolorBands direction="right" theme="light" className="w-10 xl:w-20 shrink-0" size="sm" />
          </div>
        </nav>
      </div>
    </header>
  );
};
