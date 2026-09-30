import React from 'react';
import { 
  Flame, 
  MapPin, 
  Phone, 
  Clock, 
  Instagram, 
  Send, 
  Heart, 
  ShieldCheck, 
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import toniaepLogo from '../assets/images/toniaep_creator_logo.png';
import { TONIAEP_CREATOR_LOGO_BASE64 } from '../assets/images/creatorLogoData';

interface FooterProps {
  onOpenReservation?: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const mapsUrl = 'https://maps.app.goo.gl/WXxuE14BxN9RBDmh8?g_st=ac';

  return (
    <footer className="site-footer bg-[#120F0D] text-[#FAF7F2] border-t border-[#C24D2C]/30 pt-12 pb-10">
      <div className="footer-content w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-4">
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

            <p className="text-xs text-white/70 leading-relaxed">
              Autêntica pizza napoletana com fermentação natural de 48h, ingredientes certificados D.O.P. e o fogo vivo da pedra vulcânica a 450°C.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#E5A93C]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lievito Madre Centenário da Família</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif-italian text-base font-bold text-white border-b border-white/10 pb-2">
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-xs text-white/80">
              <li>
                <a href="#cardapio" className="hover:text-[#E5A93C] transition-colors">
                  🍕 Cardápio Tradizionale & Speciali
                </a>
              </li>
              <li>
                <a href="#fermentacao" className="hover:text-[#E5A93C] transition-colors">
                  🌾 Fermentação Lenta 48h & Ingredientes
                </a>
              </li>
              <li>
                <a href="#historia" className="hover:text-[#E5A93C] transition-colors">
                  🇮🇹 História & Tradição da Nonna Deolinda
                </a>
              </li>
              <li>
                <a href="#galeria" className="hover:text-[#E5A93C] transition-colors">
                  📸 Galeria #DeolindaNapoletana
                </a>
              </li>
              <li>
                <a href="#localizacao" className="hover:text-[#E5A93C] transition-colors">
                  📍 Localização & Horários
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="space-y-3">
            <h4 className="font-serif-italian text-base font-bold text-white border-b border-white/10 pb-2">
              Horários de Atendimento
            </h4>
            <div className="space-y-2 text-xs text-white/80">
              <div className="flex justify-between">
                <span>Terça a Quinta:</span>
                <span className="text-[#E5A93C] font-semibold">18h00 - 23h30</span>
              </div>
              <div className="flex justify-between">
                <span>Sexta e Sábado:</span>
                <span className="text-[#E5A93C] font-semibold">18h00 - 00h00</span>
              </div>
              <div className="flex justify-between">
                <span>Domingo:</span>
                <span className="text-[#E5A93C] font-semibold">18h00 - 23h00</span>
              </div>
              <div className="flex justify-between text-white/40 pt-1">
                <span>Segunda-feira:</span>
                <span className="italic">Descanso da Massa</span>
              </div>
            </div>
          </div>

          {/* Location & Social */}
          <div className="space-y-3">
            <h4 className="font-serif-italian text-base font-bold text-white border-b border-white/10 pb-2">
              Endereço & Contato
            </h4>
            
            <a 
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C24D2C] transition-all"
            >
              <div className="flex items-start gap-2 text-xs text-white/90">
                <MapPin className="w-4 h-4 text-[#C24D2C] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white group-hover:text-[#E5A93C]">Deolinda Pizzaria Napoletana</p>
                  <p className="text-[11px] text-white/60 mt-0.5">Clique para abrir no Google Maps</p>
                </div>
              </div>
            </a>

            <div className="flex gap-2 pt-2">
              <a
                href="https://wa.me/5511915331853?text=Ol%C3%A1%20Deolinda%20Pizzaria!%20Gostaria%20de%20informa%C3%A7%C3%B5es."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp (11) 91533-1853</span>
              </a>

              <a
                href="https://www.instagram.com/deolindapizzaria/"
                target="_blank"
                rel="noopener noreferrer"
                title="Siga a Deolinda Pizzaria no Instagram (@deolindapizzaria)"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4 text-[#E5A93C]" />
              </a>
            </div>
          </div>

        </div>

        {/* Creator Attribution Section (Centralized) */}
        <div className="pt-8 pb-4 border-t border-white/10 flex flex-col items-center justify-center text-center space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#E5A93C]/90 font-cinzel">
            Criado por
          </span>
          <a
            href="https://toniaepprojetos.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visitar ToniAep Projetos (Criando Inovação)"
            className="footer-logo relative group inline-flex items-center justify-center p-2 rounded-2xl bg-white/[0.02] hover:bg-white/[0.08] transition-all cursor-pointer"
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
              className="w-full max-w-[140px] h-auto object-contain drop-shadow-[0_4px_12px_rgba(0,180,255,0.25)] transition-transform duration-300 group-hover:scale-105"
            />
          </a>
        </div>

        {/* Bottom Copyright & Restricted Access */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Deolinda Pizzaria Napoletana. Fatta con amore, lievito madre e farina pura.</p>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 cursor-pointer"
              title="Acesso restrito para funcionários e gestores"
            >
              <Lock className="w-3 h-3 text-white/40" />
              <span>Área Restrita (Administrador)</span>
            </button>
            <span>•</span>
            <span className="text-[#E5A93C]/80 font-semibold">Associazione Verace Pizza Napoletana</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
