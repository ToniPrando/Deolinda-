import React from 'react';
import { 
  Instagram, 
  Send, 
  Lock
} from 'lucide-react';
import toniaepLogo from '../assets/images/toniaep_creator_logo.png';
import { TONIAEP_CREATOR_LOGO_BASE64 } from '../assets/images/creatorLogoData';
import { SiteInfo } from '../types';

interface FooterProps {
  onOpenReservation?: () => void;
  onOpenAdmin: () => void;
  siteInfo?: SiteInfo;
  onNavigate?: (id: string, pathOverride?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, siteInfo, onNavigate }) => {
  return (
    <footer className="site-footer bg-[#120F0D] text-[#FAF7F2] border-t border-[#C24D2C]/30 pt-12 pb-10">
      <div className="footer-content w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid: Left (Brand), Center (Criado por), Right (Navegação Rápida) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-center md:items-start mb-10">
          
          {/* Left Column: Brand & Social */}
          <div className="space-y-4 text-left order-1 md:order-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#181513] flex items-center justify-center shadow-lg border border-[#E5A93C]/50 overflow-hidden p-0.5 shrink-0">
                <img
                  src="/deolinda_logo.png"
                  alt="Deolinda Logo"
                  className="w-full h-full object-contain"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-serif-italian text-xl font-bold text-[#FAF7F2]">
                  Deolinda
                </span>
                <p className="text-[9px] tracking-widest uppercase font-semibold text-[#E5A93C] font-cinzel">
                  Pizzaria Napoletana
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed max-w-sm">
              Autêntica pizza napoletana com fermentação natural de 72h, ingredientes certificados D.O.P. e o fogo vivo da pedra vulcânica a 450°C.
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={siteInfo?.instagramUrl || 'https://www.instagram.com/deolindapizzaria/'}
                target="_blank"
                rel="noopener noreferrer"
                title={`Siga no Instagram (${siteInfo?.instagramHandle || '@deolindapizzaria'})`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-[#E5A93C] text-xs font-medium transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span>Instagram</span>
              </a>
              <a
                href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(siteInfo?.whatsappMessage || 'Olá Deolinda Pizzaria! Gostaria de informações.')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-[#25D366] text-xs font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Center Column: Criado por ToniAep (No celular fica abaixo da navegação rápida) */}
          <div className="order-3 md:order-2 flex flex-col items-center justify-center text-center space-y-1.5 py-3 md:py-1 my-auto w-full pt-4 md:pt-1 border-t border-white/5 md:border-none">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E5A93C]/90 font-cinzel">
              Criado por
            </span>
            <a
              href="https://toniaepprojetos.com/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visitar ToniAep Projetos (Criando Inovação)"
              className="footer-logo relative group inline-flex items-center justify-center p-1 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] transition-all cursor-pointer max-w-[105px]"
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
                className="w-full max-w-[140px] h-auto object-contain drop-shadow-[0_2px_8px_rgba(0,180,255,0.25)] transition-transform duration-300 group-hover:scale-105"
              />
            </a>
          </div>

          {/* Right Column: Navegação Rápida (No celular fica antes de Criado por) */}
          <div className="order-2 md:order-3 space-y-3 flex flex-col items-start md:items-end">
            <h4 className="font-serif-italian text-base font-bold text-white border-b border-white/10 pb-2 w-full md:text-right">
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-xs text-white/80 md:text-right">
              <li>
                <a 
                  href="/processo" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('fermentacao', '/processo');
                  }}
                  className="hover:text-[#E5A93C] transition-colors"
                >
                  Fermentação Lenta 72h & Ingredientes
                </a>
              </li>
              <li>
                <a 
                  href="/cardapio" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('cardapio', '/cardapio');
                  }}
                  className="hover:text-[#E5A93C] transition-colors"
                >
                  Cardápio Tradizionale & Speciali
                </a>
              </li>
              <li>
                <a 
                  href="/historia" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('historia', '/historia');
                  }}
                  className="hover:text-[#E5A93C] transition-colors"
                >
                  História & Tradição da Nonna Deolinda
                </a>
              </li>
              <li>
                <a 
                  href="/galeria" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('galeria', '/galeria');
                  }}
                  className="hover:text-[#E5A93C] transition-colors"
                >
                  Fotos & Momentos
                </a>
              </li>
              <li>
                <a 
                  href="/localizacao" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('localizacao', '/localizacao');
                  }}
                  className="hover:text-[#E5A93C] transition-colors"
                >
                  Localização & Horários
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Restricted Access */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {siteInfo?.footerCopyright || 'Deolinda Pizzaria Napoletana. Fatta con amore, lievito madre e farina pura.'}</p>

          <div className="flex items-center gap-4">
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
