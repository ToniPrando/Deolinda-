import React from 'react';
import { 
  Instagram, 
  Send, 
  Facebook,
  Lock,
  MapPin
} from 'lucide-react';
import toniaepLogo from '../assets/images/toniaep_creator_logo.png';
import { TONIAEP_CREATOR_LOGO_BASE64 } from '../assets/images/creatorLogoData';
import { SiteInfo } from '../types';

interface FooterProps {
  onOpenReservation?: () => void;
  onOpenAdmin: () => void;
  siteInfo?: SiteInfo;
  customLogoUrl?: string | null;
  onNavigate?: (id: string, pathOverride?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, siteInfo, customLogoUrl }) => {
  return (
    <footer className="site-footer bg-white text-[#181513] border-t border-[#EADFCF] pt-10 pb-8">
      <div className="footer-content w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Center Block: Logo e Nome ao lado do Endereço, e Botões Sociais */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
          {/* Logo e Nome ao lado do Endereço */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-center">
            {/* Brand Logo & Name (Sem borda amarela) */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs overflow-hidden p-0.5 shrink-0">
                <img
                  src={customLogoUrl || "/deolinda_logo.png"}
                  alt={siteInfo?.restaurantName || "Deolinda Logo"}
                  className="w-full h-full object-contain"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <span className="font-serif-italian text-lg sm:text-xl font-bold text-[#181513] leading-tight block">
                  {siteInfo?.restaurantName || 'Deolinda Pizzaria Napoletana'}
                </span>
              </div>
            </div>

            <span className="hidden sm:inline text-[#D5C9B8]">•</span>

            {/* Endereço ao lado */}
            <div className="text-center sm:text-left text-xs text-[#5C554E] space-y-0.5">
              <p className="font-medium text-[#181513] flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C24D2C] shrink-0" />
                <span>
                  {siteInfo?.address || 'Rua Santa Cruz, 232'}, {siteInfo?.addressNeighborhood || 'Centro'} — {siteInfo?.addressCityState || 'Itu - SP'}
                </span>
              </p>
              {siteInfo?.openingHoursSummary && (
                <p className="text-[#7A7067] text-[11px] sm:pl-5">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#181513] border border-[#E0D5C3] text-xs font-medium transition-colors shadow-2xs"
            >
              <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
              <span>Instagram</span>
            </a>
            <a
              href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(siteInfo?.whatsappMessage || 'Olá Deolinda Pizzaria! Gostaria de informações.')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#181513] border border-[#E0D5C3] text-xs font-medium transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp</span>
            </a>
            <a
              href={siteInfo?.facebookUrl || 'https://www.facebook.com/p/Deolinda-Pizzeria-61593126269315/'}
              target="_blank"
              rel="noopener noreferrer"
              title="Siga no Facebook"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#181513] border border-[#E0D5C3] text-xs font-medium transition-colors shadow-2xs"
            >
              <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        {/* Bottom Section: Copyright, Cadeado Admin e Seção com Fundo Escuro Elegante Criado por ToniAep */}
        <div className="pt-6 border-t border-[#EADFCF] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#7A7067]">
          {/* Lado Esquerdo: Copyright */}
          <div className="text-center md:text-left order-2 md:order-1">
            <span>
              © {new Date().getFullYear()} Deolinda Pizzaria Napoletana. Fatta con amore
            </span>
          </div>

          {/* Centro: Cadeado Admin Único */}
          <div className="flex items-center justify-center order-3 md:order-2">
            <button
              onClick={onOpenAdmin}
              className="text-[#A89F95] hover:text-[#C24D2C] transition-colors p-1.5 rounded-md hover:bg-[#FAF7F2] cursor-pointer flex items-center justify-center"
              title="Área Restrita (Administrador)"
              aria-label="Área Restrita"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lado Direito: Criado por ToniAep (Transparente / Translúcido) */}
          <div className="order-1 md:order-3 w-full sm:w-auto flex justify-center md:justify-end">
            <div className="bg-transparent rounded-xl px-2.5 py-1 flex items-center justify-center gap-2 hover:bg-black/[0.03] transition-colors">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#7A7067] font-cinzel">
                Criado por
              </span>
              <a
                href="https://toniaepprojetos.com/"
                target="_blank"
                rel="noopener noreferrer"
                title="Visitar ToniAep Projetos (Criando Inovação)"
                className="footer-logo relative group inline-flex items-center justify-center p-1 rounded-lg bg-transparent hover:bg-black/[0.04] transition-all cursor-pointer max-w-[140px]"
              >
                <img 
                  src={toniaepLogo || TONIAEP_CREATOR_LOGO_BASE64} 
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== TONIAEP_CREATOR_LOGO_BASE64) {
                      target.src = TONIAEP_CREATOR_LOGO_BASE64;
                    }
                  }}
                  alt="ToniAep - Criando Inovação" 
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="sync"
                  className="w-full max-w-[140px] h-auto object-contain drop-shadow-[0_2px_10px_rgba(0,180,255,0.35)] transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
