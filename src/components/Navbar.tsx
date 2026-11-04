import React, { useState, useEffect } from 'react';
import deolindaLogo from '../assets/images/deolinda_logo.png';
import { 
  Menu as MenuIcon, 
  X,
  Home
} from 'lucide-react';
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

export const Navbar: React.FC<NavbarProps> = ({
  customLogoUrl,
  customEmblemUrl,
  isEmblemEnabled = true,
  siteInfo,
  activeSection,
  onNavigate
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string, path: string) => {
    setMobileMenuOpen(false);

    if (onNavigate) {
      onNavigate(id, path);
    } else {
      window.history.pushState({ section: id }, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md text-[#181513] shadow-md border-b border-[#EADFCF] py-2'
          : 'bg-white text-[#181513] border-b border-[#EADFCF] py-2.5 sm:py-3'
      }`}
    >
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Mobile Header: Logo e Hamburger */}
        <div className="flex items-center justify-between w-full lg:hidden">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('hero', '/');
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs overflow-hidden p-0.5 shrink-0">
              <img
                src={customLogoUrl || deolindaLogo || "/deolinda_logo.png"}
                alt="Logo Pizzaria Deolinda"
                className="w-full h-full object-contain"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-serif-italian text-xl font-bold text-[#181513]">
              Deolinda
            </span>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#181513] hover:bg-[#FAF7F2] border border-[#E0D5C3] transition-colors cursor-pointer"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
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

          {/* 3. LOGO CENTRALIZADO COM ESPAÇAMENTO GENEROSO (Sem borda amarela) */}
          <div className="shrink-0 flex items-center justify-center px-4 sm:px-6 xl:px-12">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('hero', '/');
              }}
              title="Deolinda Pizzaria Napoletana - Ir para a Página Inicial"
              className="flex items-center justify-center group cursor-pointer"
            >
              <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center shadow-md p-1 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                <img
                  src={customLogoUrl || deolindaLogo || "/deolinda_logo.png"}
                  alt="Logo Pizzaria Deolinda"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
              {customEmblemUrl && isEmblemEnabled !== false && (
                <img
                  src={customEmblemUrl}
                  alt="Emblema Deolinda"
                  className="h-9 w-auto max-w-[130px] object-contain ml-2.5 hidden 2xl:inline-block filter drop-shadow-xs"
                />
              )}
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

      {/* Mobile Dropdown Menu (Tema Branco) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#EADFCF] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200 shadow-xl">
          <div className="flex items-center justify-center gap-3 py-1">
            <TricolorBands direction="left" theme="light" className="w-12 shrink-0" size="sm" />
            <span className="text-[10px] tracking-widest uppercase font-semibold text-[#C24D2C] font-cinzel">Menu Deolinda</span>
            <TricolorBands direction="right" theme="light" className="w-12 shrink-0" size="sm" />
          </div>
          <div className="flex flex-col space-y-1 text-base font-medium pt-1">
            <button
              onClick={() => handleNavClick('hero', '/')}
              className={`text-left py-2 px-3 rounded-xl transition-colors flex items-center gap-2.5 ${
                activeSection === 'hero' ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold border border-[#E0D5C3]' : 'hover:bg-[#FAF7F2] text-[#181513]'
              }`}
            >
              <Home className="w-4 h-4 text-[#C24D2C]" />
              <span>Página Inicial</span>
            </button>
            <button
              onClick={() => handleNavClick('cardapio', '/cardapio')}
              className={`text-left py-2 px-3 rounded-xl transition-colors ${
                activeSection === 'cardapio' ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold border border-[#E0D5C3]' : 'hover:bg-[#FAF7F2] text-[#181513]'
              }`}
            >
              Cardápio Autêntico
            </button>
            <button
              onClick={() => handleNavClick('historia', '/historia')}
              className={`text-left py-2 px-3 rounded-xl transition-colors ${
                activeSection === 'historia' ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold border border-[#E0D5C3]' : 'hover:bg-[#FAF7F2] text-[#181513]'
              }`}
            >
              Nossa História & Tradição
            </button>
            <button
              onClick={() => handleNavClick('localizacao', '/localizacao')}
              className={`text-left py-2 px-3 rounded-xl transition-colors ${
                activeSection === 'localizacao' ? 'bg-[#FAF7F2] text-[#C24D2C] font-bold border border-[#E0D5C3]' : 'hover:bg-[#FAF7F2] text-[#181513]'
              }`}
            >
              Localização & Horários
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
