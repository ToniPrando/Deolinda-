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
    <footer className="site-footer bg-[#120F0D] text-[#FAF7F2] border-t border-[#C24D2C]/30 pt-10 pb-8">
      <div className="footer-content w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Center Block: Logo e Nome ao lado do Endereço, e Botões Sociais */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
          {/* Logo e Nome ao lado do Endereço */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-center">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#181513] flex items-center justify-center shadow-lg border border-[#E5A93C]/50 overflow-hidden p-0.5 shrink-0">
                <img
                  src={customLogoUrl || "/deolinda_logo.png"}
                  alt={siteInfo?.restaurantName || "Deolinda Logo"}
                  className="w-full h-full object-contain"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <span className="font-serif-italian text-lg sm:text-xl font-bold text-[#FAF7F2] leading-tight block">
                  {siteInfo?.restaurantName || 'Deolinda Pizzaria Napoletana'}
                </span>
              </div>
            </div>

            <span className="hidden sm:inline text-white/20">•</span>

            {/* Endereço ao lado */}
            <div className="text-center sm:text-left text-xs text-white/80 space-y-0.5">
              <p className="font-medium text-white/90 flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E5A93C] shrink-0" />
                <span>
                  {siteInfo?.address || 'Rua Santa Cruz, 232'}, {siteInfo?.addressNeighborhood || 'Centro'} — {siteInfo?.addressCityState || 'Itu - SP'}
                </span>
              </p>
              {siteInfo?.openingHoursSummary && (
                <p className="text-white/60 text-[11px] sm:pl-5">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-[#E5A93C] text-xs font-medium transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>Instagram</span>
            </a>
            <a
              href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(siteInfo?.whatsappMessage || 'Olá Deolinda Pizzaria! Gostaria de informações.')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-[#25D366] text-xs font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp</span>
            </a>
            <a
              href={siteInfo?.facebookUrl || 'https://www.facebook.com/p/Deolinda-Pizzeria-61593126269315/'}
              target="_blank"
              rel="noopener noreferrer"
              title="Siga no Facebook"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-[#1877F2] text-xs font-medium transition-colors"
            >
              <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        {/* Bottom Section: Copyright & Criado por ToniAep Centralizados Lado a Lado */}
        <div className="pt-6 border-t border-white/10 flex flex-col items-center justify-center gap-3.5 text-center">
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/60">
            <span>
              © {new Date().getFullYear()} Deolinda Pizzaria Napoletana. Fatta con amore
            </span>

            <span className="hidden sm:inline text-white/20">•</span>

            {/* Criado por ToniAep centralizado ao lado do texto */}
            <div className="inline-flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E5A93C]/90 font-cinzel">
                Criado por
              </span>
              <a
                href="https://toniaepprojetos.com/"
                target="_blank"
                rel="noopener noreferrer"
                title="Visitar ToniAep Projetos (Criando Inovação)"
                className="footer-logo relative group inline-flex items-center justify-center p-0.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] transition-all cursor-pointer max-w-[105px]"
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
                  className="w-full max-w-[105px] h-auto object-contain drop-shadow-[0_2px_8px_rgba(0,180,255,0.25)] transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            </div>
          </div>

          {/* Área Restrita Admin */}
          <div className="flex items-center justify-center gap-3 text-xs text-white/40 pt-1">
            <button
              onClick={onOpenAdmin}
              className="text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 cursor-pointer"
              title="Acesso restrito para funcionários e gestores"
            >
              <Lock className="w-3 h-3 text-white/40" />
              <span>Área Restrita (Administrador)</span>
            </button>
            {siteInfo?.footerAssociationText && siteInfo.footerAssociationText.trim() !== '' && siteInfo.footerAssociationText !== 'Associazione Verace Pizza Napoletana' && (
              <>
                <span>•</span>
                <span className="text-[#E5A93C]/80 font-semibold">{siteInfo.footerAssociationText}</span>
              </>
            )}
          </div>

        </div>

      </div>
    </footer>
  );
};
