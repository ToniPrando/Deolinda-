import React from 'react';
import { 
  Instagram, 
  Send, 
  Facebook,
  MapPin,
  Sun,
  Moon
} from 'lucide-react';
import { SiteInfo } from '../types';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  onOpenReservation?: () => void;
  onOpenAdmin?: () => void;
  siteInfo?: SiteInfo;
  customLogoUrl?: string | null;
  onNavigate?: (id: string, pathOverride?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ siteInfo, customLogoUrl }) => {
  const { theme, setTheme } = useTheme();

  return (
    <footer className="site-footer relative z-10 bg-white/80 dark:bg-[#12100E]/80 backdrop-blur-[2px] text-[#181513] dark:text-[#FAF7F2] border-t border-[#EADFCF] dark:border-white/10 pt-10 pb-8 transition-colors duration-200">
      <div className="footer-content w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Center Block: Logo e Nome ao lado do Endereço, e Botões Sociais */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
          {/* Logo e Nome ao lado do Endereço */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-center">
            {/* Brand Logo & Name (Sem borda amarela) */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1E1A17] flex items-center justify-center shadow-xs overflow-hidden p-0.5 shrink-0 border border-transparent dark:border-white/10">
                <img
                  src={customLogoUrl || "/deolinda_logo.png"}
                  alt={siteInfo?.restaurantName || "Deolinda Logo"}
                  className="w-full h-full object-contain"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <span className="font-serif-italian text-lg sm:text-xl font-bold text-[#181513] dark:text-[#FAF7F2] leading-tight block">
                  {siteInfo?.restaurantName || 'Deolinda Pizzaria Napoletana'}
                </span>
              </div>
            </div>

            <span className="hidden sm:inline text-[#D5C9B8] dark:text-white/25">•</span>

            {/* Endereço ao lado */}
            <div className="text-center sm:text-left text-xs text-[#5C554E] dark:text-[#C2B8AD] space-y-0.5">
              <p className="font-medium text-[#181513] dark:text-[#FAF7F2] flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C24D2C] shrink-0" />
                <span>
                  {siteInfo?.address || 'Rua Santa Cruz, 232'}, {siteInfo?.addressNeighborhood || 'Centro'} — {siteInfo?.addressCityState || 'Itu - SP'}
                </span>
              </p>
              {siteInfo?.openingHoursSummary && (
                <p className="text-[#7A7067] dark:text-[#9F958B] text-[11px] sm:pl-5">
                  {siteInfo.openingHoursSummary}
                </p>
              )}
            </div>
          </div>

          {/* Botões das Redes Sociais Centralizados (Instagram, WhatsApp e Facebook) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-1">
            <a
              href={siteInfo?.instagramUrl || 'https://www.instagram.com/deolindapizzaria/'}
              target="_blank"
              rel="noopener noreferrer"
              title={`Siga no Instagram (${siteInfo?.instagramHandle || '@deolindapizzaria'})`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1815] hover:bg-[#F2ECE1] dark:hover:bg-[#26211D] text-[#181513] dark:text-[#FAF7F2] border border-[#E0D5C3] dark:border-white/10 text-xs font-medium transition-colors shadow-2xs"
            >
              <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
              <span>Instagram</span>
            </a>
            <a
              href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(siteInfo?.whatsappMessage || 'Olá Deolinda Pizzaria! Gostaria de informações.')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1815] hover:bg-[#F2ECE1] dark:hover:bg-[#26211D] text-[#181513] dark:text-[#FAF7F2] border border-[#E0D5C3] dark:border-white/10 text-xs font-medium transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp</span>
            </a>
            <a
              href={siteInfo?.facebookUrl || 'https://www.facebook.com/p/Deolinda-Pizzeria-61593126269315/'}
              target="_blank"
              rel="noopener noreferrer"
              title="Siga no Facebook"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1815] hover:bg-[#F2ECE1] dark:hover:bg-[#26211D] text-[#181513] dark:text-[#FAF7F2] border border-[#E0D5C3] dark:border-white/10 text-xs font-medium transition-colors shadow-2xs"
            >
              <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        {/* Bottom Section: Copyright, Seletor de Tema e Criado por TonIAep */}
        <div className="pt-6 border-t border-[#EADFCF] dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#7A7067] dark:text-[#A99E94]">
          {/* Lado Esquerdo: Copyright */}
          <div className="text-center md:text-left order-3 md:order-1">
            <span>
              © {new Date().getFullYear()} Deolinda Pizzaria Napoletana. Fatta con amore
            </span>
          </div>

          {/* Centro: Seletor de Tema (Claro / Escuro) */}
          <div className="order-1 md:order-2 flex items-center justify-center">
            <div
              role="group"
              aria-label="Seletor de tema do site"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1815] border border-[#E0D5C3] dark:border-white/10 shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                title="Ativar tema claro"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-[#181513] shadow-xs border border-[#E0D5C3]'
                    : 'text-[#7A7067] dark:text-[#A99E94] hover:text-[#181513] dark:hover:text-[#FAF7F2]'
                }`}
              >
                <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-[#C24D2C]' : ''}`} />
                <span>Claro</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                title="Ativar tema escuro"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#2C2520] text-[#E5A93C] shadow-xs border border-[#E5A93C]/30'
                    : 'text-[#7A7067] dark:text-[#A99E94] hover:text-[#181513] dark:hover:text-[#FAF7F2]'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#E5A93C]' : ''}`} />
                <span>Escuro</span>
              </button>
            </div>
          </div>

          {/* Lado Direito: Criado por TonIAep (Texto com link) */}
          <div className="order-2 md:order-3 w-full sm:w-auto flex justify-center md:justify-end">
            <div className="bg-transparent rounded-xl px-2.5 py-1 flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#7A7067] dark:text-[#A99E94] font-cinzel">
                Criado por
              </span>
              <a
                href="https://toniaepprojetos.com/"
                target="_blank"
                rel="noopener noreferrer"
                title="Visitar TonIAep Projetos"
                className="text-xs font-bold tracking-wide text-[#181513] dark:text-[#FAF7F2] hover:text-[#C24D2C] dark:hover:text-[#E5A93C] transition-colors underline-offset-4 hover:underline"
              >
                TonIAep
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
