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
          ? 'bg-[#181513]/95 backdrop-blur-md text-white shadow-xl border-b border-[#C24D2C]/20 py-2.5'
          : 'bg-[#181513] text-white py-3'
      }`}
    >
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo & Lockup */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex items-center">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('hero', '/');
              }}
              className="flex items-center gap-3 text-left group"
            >
              <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#181513] flex items-center justify-center shadow-lg shadow-[#C24D2C]/30 border-2 border-[#E5A93C]/60 group-hover:scale-105 group-hover:border-[#E5A93C] transition-all overflow-hidden shrink-0">
                <img
                  src={customLogoUrl || deolindaLogo || "/deolinda_logo.png"}
                  alt="Logo Pizzaria Deolinda"
                  className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-300"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {customEmblemUrl && isEmblemEnabled !== false ? (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <img
                    src={customEmblemUrl}
                    alt="Deolinda Pizzaria Napoletana"
                    className="h-8 sm:h-10 md:h-11 w-auto max-w-[150px] sm:max-w-[210px] object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-serif-italian text-xl sm:text-2xl font-bold tracking-tight text-[#FAF7F2] group-hover:text-[#E5A93C] transition-colors leading-tight">
                      Deolinda
                    </span>
                    <span className="text-[10px] tracking-widest uppercase font-semibold text-[#E5A93C]/90 font-cinzel">
                      Pizzaria Napoletana
                    </span>
                  </div>
                </div>
              )}
            </a>
          </div>
        </div>

        {/* Desktop Navigation Links spanning all remaining space in the header */}
        <nav className="hidden lg:flex flex-1 items-center justify-between mx-4 lg:mx-6 xl:mx-10 2xl:mx-14 text-sm tracking-wide">
          <TricolorBands direction="left" theme="dark" className="w-6 xl:w-8 shrink-0" size="sm" />
          
          {/* Ícone de Casa para levar à Página Inicial */}
          <button
            onClick={() => handleNavClick('hero', '/')}
            title="Ir para a Página Inicial"
            aria-label="Página Inicial"
            className={`p-2 xl:px-3.5 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'hero'
                ? 'bg-white/15 text-[#E5A93C] font-bold shadow-sm ring-1 ring-[#E5A93C]/40'
                : 'text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 font-semibold'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden xl:inline text-xs font-semibold tracking-wider uppercase font-cinzel">Início</span>
          </button>

          <button
            onClick={() => handleNavClick('fermentacao', '/processo')}
            className={`px-3.5 xl:px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'fermentacao'
                ? 'bg-white/15 text-[#E5A93C] font-bold shadow-sm ring-1 ring-[#E5A93C]/40'
                : 'text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 font-semibold'
            }`}
          >
            Processo & Massa
          </button>
          <button
            onClick={() => handleNavClick('cardapio', '/cardapio')}
            className={`px-3.5 xl:px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'cardapio'
                ? 'bg-white/15 text-[#E5A93C] font-bold shadow-sm ring-1 ring-[#E5A93C]/40'
                : 'text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 font-semibold'
            }`}
          >
            Cardápio
          </button>
          <button
            onClick={() => handleNavClick('historia', '/historia')}
            className={`px-3.5 xl:px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'historia'
                ? 'bg-white/15 text-[#E5A93C] font-bold shadow-sm ring-1 ring-[#E5A93C]/40'
                : 'text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 font-semibold'
            }`}
          >
            Nossa Tradição
          </button>
          <button
            onClick={() => handleNavClick('localizacao', '/localizacao')}
            className={`px-3.5 xl:px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'localizacao'
                ? 'bg-white/15 text-[#E5A93C] font-bold shadow-sm ring-1 ring-[#E5A93C]/40'
                : 'text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 font-semibold'
            }`}
          >
            Localização
          </button>
          <TricolorBands direction="right" theme="dark" className="w-6 xl:w-8 shrink-0" size="sm" />
        </nav>

        {/* Right Side: Mobile Menu Trigger (hidden on desktop) */}
        <div className="flex items-center lg:hidden shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-[#FAF7F2] hover:bg-white/10 transition-colors"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#181513] border-t border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-center gap-3 py-1">
            <TricolorBands direction="left" theme="dark" className="w-12 shrink-0" size="sm" />
            <span className="text-[10px] tracking-widest uppercase font-semibold text-[#E5A93C] font-cinzel">Menu Deolinda</span>
            <TricolorBands direction="right" theme="dark" className="w-12 shrink-0" size="sm" />
          </div>
          <div className="flex flex-col space-y-1 text-base font-medium pt-1">
            <button
              onClick={() => handleNavClick('hero', '/')}
              className={`text-left py-2 px-3 rounded transition-colors flex items-center gap-2.5 ${
                activeSection === 'hero' ? 'bg-white/15 text-[#E5A93C] font-bold' : 'hover:bg-white/10 text-[#FAF7F2]'
              }`}
            >
              <Home className="w-4 h-4 text-[#E5A93C]" />
              <span>Página Inicial</span>
            </button>
            <button
              onClick={() => handleNavClick('fermentacao', '/processo')}
              className={`text-left py-2 px-3 rounded transition-colors ${
                activeSection === 'fermentacao' ? 'bg-white/15 text-[#E5A93C] font-bold' : 'hover:bg-white/10 text-[#FAF7F2]'
              }`}
            >
              Processo & Massa (Fermentação 72h)
            </button>
            <button
              onClick={() => handleNavClick('cardapio', '/cardapio')}
              className={`text-left py-2 px-3 rounded transition-colors ${
                activeSection === 'cardapio' ? 'bg-white/15 text-[#E5A93C] font-bold' : 'hover:bg-white/10 text-[#FAF7F2]'
              }`}
            >
              Cardápio Autêntico
            </button>
            <button
              onClick={() => handleNavClick('historia', '/historia')}
              className={`text-left py-2 px-3 rounded transition-colors ${
                activeSection === 'historia' ? 'bg-white/15 text-[#E5A93C] font-bold' : 'hover:bg-white/10 text-[#FAF7F2]'
              }`}
            >
              Nossa História & Tradição
            </button>
            <button
              onClick={() => handleNavClick('localizacao', '/localizacao')}
              className={`text-left py-2 px-3 rounded transition-colors ${
                activeSection === 'localizacao' ? 'bg-white/15 text-[#E5A93C] font-bold' : 'hover:bg-white/10 text-[#FAF7F2]'
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
