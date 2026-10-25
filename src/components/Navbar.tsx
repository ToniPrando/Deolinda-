import React, { useState, useEffect } from 'react';
import deolindaLogo from '../assets/images/deolinda_logo.png';
import { 
  Menu as MenuIcon, 
  X,
  Instagram
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
    const wasMobileMenuOpen = mobileMenuOpen;
    setMobileMenuOpen(false);

    // On mobile, if dropdown was open, delay execution slightly so dropdown unmounts
    // and does not distort scroll position calculations
    const delay = wasMobileMenuOpen ? 120 : 0;

    setTimeout(() => {
      if (onNavigate) {
        onNavigate(id, path);
      } else {
        if (id === 'hero' || id === 'inicio') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        const element = document.getElementById(id);
        if (element) {
          const isMobile = window.innerWidth < 1024;
          // Target the title heading on mobile so content displays from the title
          const targetEl = isMobile && element.querySelector('h2') ? (element.querySelector('h2') || element) : element;
          const headerEl = document.querySelector('header');
          const headerHeight = headerEl ? Math.min(headerEl.offsetHeight, 72) : (isMobile ? 64 : 76);
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = targetEl.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = Math.max(0, elementPosition - headerHeight - (isMobile ? 10 : 16));

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }, delay);
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
            onClick={() => handleNavClick('galeria', '/galeria')}
            className={`px-3.5 xl:px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'galeria'
                ? 'bg-white/15 text-[#E5A93C] font-bold shadow-sm ring-1 ring-[#E5A93C]/40'
                : 'text-[#FAF7F2]/90 hover:text-[#E5A93C] hover:bg-white/5 font-semibold'
            }`}
          >
            Fotos & Momentos
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

        {/* Right Side: WhatsApp & Instagram Action Icons + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* WhatsApp Header Icon Button */}
          <a
            href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(siteInfo?.whatsappMessage || 'Olá Deolinda Pizzaria! Gostaria de informações.')}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Fale conosco pelo WhatsApp"
            aria-label="WhatsApp da Deolinda Pizzaria"
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm hover:shadow flex items-center justify-center transition-all hover:scale-105 active:scale-95 group/wa cursor-pointer"
          >
            <svg className="w-4.5 h-4.5 fill-current transition-transform group-hover/wa:scale-110" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </a>

          {/* Instagram Header Icon Button */}
          <a
            href={siteInfo?.instagramUrl || 'https://www.instagram.com/deolindapizzaria/'}
            target="_blank"
            rel="noopener noreferrer"
            title={`Siga a Deolinda no Instagram (${siteInfo?.instagramHandle || '@deolindapizzaria'})`}
            aria-label="Instagram da Deolinda Pizzaria"
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-sm hover:shadow flex items-center justify-center transition-all hover:scale-105 active:scale-95 group/ig cursor-pointer"
          >
            <Instagram className="w-4.5 h-4.5 transition-transform group-hover/ig:scale-110" />
          </a>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center lg:hidden ml-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-[#FAF7F2] hover:bg-white/10 transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
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
              onClick={() => handleNavClick('galeria', '/galeria')}
              className={`text-left py-2 px-3 rounded transition-colors ${
                activeSection === 'galeria' ? 'bg-white/15 text-[#E5A93C] font-bold' : 'hover:bg-white/10 text-[#FAF7F2]'
              }`}
            >
              Fotos & Momentos (#DeolindaNapoletana)
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
