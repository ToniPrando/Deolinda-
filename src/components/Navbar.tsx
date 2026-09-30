import React, { useState, useEffect } from 'react';
import deolindaLogo from '../assets/images/deolinda_logo.png';
import { 
  Menu as MenuIcon, 
  X
} from 'lucide-react';
import { CustomerUser } from '../types';

interface NavbarProps {
  onOpenAuth?: () => void;
  currentUser?: CustomerUser | null;
  customLogoUrl?: string | null;
  customEmblemUrl?: string | null;
  isEmblemEnabled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  customLogoUrl,
  customEmblemUrl,
  isEmblemEnabled = true
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

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Lockup */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex items-center">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    className="h-8 sm:h-10 md:h-11 w-auto max-w-[130px] sm:max-w-[190px] object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="hidden sm:inline font-serif-italian text-xs md:text-sm text-[#E5A93C] italic font-normal tracking-wide pl-2 border-l border-white/20">
                    L'arte della Vera Pizza Napoletana
                  </span>
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
                  <span className="font-serif-italian text-xs sm:text-sm text-[#E5A93C] italic font-normal tracking-wide leading-tight">
                    L'arte della Vera Pizza Napoletana
                  </span>
                </div>
              )}
            </a>
          </div>
        </div>

        {/* Desktop Navigation Links with enhanced spacing */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-8 2xl:gap-10 text-sm font-semibold tracking-wide">
          <button
            onClick={() => scrollToSection('cardapio')}
            className="px-3.5 py-1.5 rounded-full text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 transition-all cursor-pointer"
          >
            Cardápio
          </button>
          <button
            onClick={() => scrollToSection('fermentacao')}
            className="px-3.5 py-1.5 rounded-full text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 transition-all cursor-pointer"
          >
            Processo & Massa
          </button>
          <button
            onClick={() => scrollToSection('historia')}
            className="px-3.5 py-1.5 rounded-full text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 transition-all cursor-pointer"
          >
            Nossa Tradição
          </button>
          <button
            onClick={() => scrollToSection('galeria')}
            className="px-3.5 py-1.5 rounded-full text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 transition-all cursor-pointer"
          >
            Galeria do Forno
          </button>
          <button
            onClick={() => scrollToSection('localizacao')}
            className="px-3.5 py-1.5 rounded-full text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 transition-all cursor-pointer"
          >
            Localização
          </button>
        </nav>

        {/* Mobile Menu Trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#FAF7F2] hover:bg-white/10 transition-colors"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#181513] border-t border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-1 text-base font-medium pt-1">
            <button
              onClick={() => scrollToSection('cardapio')}
              className="text-left py-2 px-3 rounded hover:bg-white/10 text-[#FAF7F2]"
            >
              🍕 Cardápio Autêntico
            </button>
            <button
              onClick={() => scrollToSection('fermentacao')}
              className="text-left py-2 px-3 rounded hover:bg-white/10 text-[#FAF7F2]"
            >
              🌾 Fermentação 48h & Ingredientes
            </button>
            <button
              onClick={() => scrollToSection('historia')}
              className="text-left py-2 px-3 rounded hover:bg-white/10 text-[#FAF7F2]"
            >
              🇮🇹 Nossa História & Tradição
            </button>
            <button
              onClick={() => scrollToSection('galeria')}
              className="text-left py-2 px-3 rounded hover:bg-white/10 text-[#FAF7F2]"
            >
              📸 Galeria do Forno (#DeolindaNapoletana)
            </button>
            <button
              onClick={() => scrollToSection('localizacao')}
              className="text-left py-2 px-3 rounded hover:bg-white/10 text-[#FAF7F2]"
            >
              📍 Localização & Horários
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
