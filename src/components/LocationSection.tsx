import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Send, 
  Navigation, 
  UtensilsCrossed, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { SiteInfo } from '../types';

interface LocationSectionProps {
  siteInfo?: SiteInfo;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ siteInfo }) => {
  const mapsUrl = siteInfo?.mapsUrl || 'https://maps.app.goo.gl/WXxuE14BxN9RBDmh8?g_st=ac';
  const destinationQuery = siteInfo?.restaurantName || 'Deolinda Pizzaria Napoletana';
  const [isLocating, setIsLocating] = useState(false);

  const handleNavigateWithGPS = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsLocating(true);

    const openRoute = (originCoord?: { lat: number; lng: number }) => {
      setIsLocating(false);
      const destination = encodeURIComponent(destinationQuery);
      const url = originCoord
        ? `https://www.google.com/maps/dir/?api=1&origin=${originCoord.lat},${originCoord.lng}&destination=${destination}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${destination}&travelmode=driving`;

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          openRoute({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error or permission declined:', error);
          openRoute();
        },
        { timeout: 6000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    } else {
      openRoute();
    }
  };

  return (
    <section id="localizacao" className="pt-6 sm:pt-8 pb-12 sm:pb-16 bg-white text-[#181513] border-t border-[#EADFCF] relative overflow-hidden scroll-mt-16 sm:scroll-mt-18">
      <div className="w-full max-w-[820px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C24D2C]/10 text-[#C24D2C] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-2 border border-[#C24D2C]/25">
            <MapPin className="w-3.5 h-3.5 text-[#C24D2C]" />
            <span>{siteInfo?.locationBadge || 'Onde Nos Encontrar'}</span>
          </div>
          <h2 className="font-serif-italian text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#181513] mb-2">
            {siteInfo?.locationTitle || 'Visite a Deolinda Pizzaria Napoletana'}
          </h2>
          <p className="text-[#5C554E] text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            {siteInfo?.locationSubtitle || 'Um refúgio italiano aconchegante com aroma de lenha queimando, vinhos selecionados e a verdadeira hospitalidade de Nápoles.'}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          
          {/* Hours & Contact Info (Left 5 cols) */}
          <div className="md:col-span-5 flex flex-col">
            
            {/* Opening Hours & Contact Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E0D5C3] shadow-md space-y-3.5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#C24D2C] mb-2.5">
                  <Clock className="w-4 h-4 text-[#C24D2C]" />
                  <h3 className="font-serif-italian text-base sm:text-lg font-bold text-[#181513]">
                    Horários de Atendimento
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs text-[#5C554E]">
                  <div className="flex justify-between py-1.5 border-b border-[#EADFCF]">
                    <span className="font-medium text-[#181513]">Terça a Quinta</span>
                    <span className="text-[#C24D2C] font-bold">{siteInfo?.hoursTueThu || '18h00 às 23h30'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#EADFCF]">
                    <span className="font-medium text-[#181513]">Sexta e Sábado</span>
                    <span className="text-[#C24D2C] font-bold">{siteInfo?.hoursFriSat || '18h00 às 00h00'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#EADFCF]">
                    <span className="font-medium text-[#181513]">Domingo</span>
                    <span className="text-[#C24D2C] font-bold">{siteInfo?.hoursSun || '18h00 às 23h00'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-[#8C827A]">
                    <span>Segunda-feira</span>
                    <span className="italic">{siteInfo?.hoursMon || 'Fechado (Descanso)'}</span>
                  </div>
                </div>

                <div className="pt-2.5 text-[11px] text-[#8C5E0A] flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>{siteInfo?.environmentInfo || 'Forno a Lenha aquecido a 450°C durante todo o serviço'}</span>
                </div>

                {/* Endereço Oficial */}
                <div className="pt-3 border-t border-[#EADFCF]">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] hover:border-[#C24D2C] hover:bg-white flex items-start gap-2.5 transition-all group shadow-2xs"
                  >
                    <MapPin className="w-4 h-4 text-[#C24D2C] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="block text-[10px] font-bold text-[#C24D2C] uppercase tracking-wider">Endereço da Pizzaria</span>
                      <p className="text-xs font-semibold text-[#181513] mt-0.5 leading-snug">
                        {siteInfo?.address && !siteInfo.address.toLowerCase().includes('augusta')
                          ? `${siteInfo.address}, ${siteInfo.addressNeighborhood || 'Centro'}, ${siteInfo.addressCityState || 'Itu, SP'}`
                          : 'Rua Santa Cruz, 232, Centro, Itu, SP'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#7A7067] group-hover:text-[#C24D2C] mt-0.5">
                        <span>Ver rotas no Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Direct WhatsApp Contact Button */}
              <div className="pt-3 border-t border-[#EADFCF]">
                <a
                  href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(siteInfo?.whatsappMessage || 'Olá Deolinda Pizzaria! Gostaria de informações.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp: {siteInfo?.phone || '(11) 91533-1853'}</span>
                </a>
              </div>
            </div>

          </div>

          {/* Interactive Map Visual Representation (Right 7 cols) */}
          <div className="md:col-span-7 bg-white rounded-2xl overflow-hidden border border-[#E0D5C3] shadow-md flex flex-col justify-between relative min-h-[220px]">
            
            {/* Map Visual Header */}
            <div className="p-3 bg-gradient-to-b from-white/95 to-transparent absolute top-0 inset-x-0 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#E0D5C3] text-[10px] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#C24D2C] animate-pulse" />
                <span className="font-bold text-[#181513]">Localização Oficial</span>
              </div>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto px-2.5 py-1 rounded-full bg-white/95 hover:bg-white backdrop-blur-md text-[#181513] border border-[#E0D5C3] text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-all"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3 text-[#C24D2C]" />
              </a>
            </div>

            {/* Stylized Map View Graphic */}
            <div className="relative flex-1 w-full min-h-[180px] bg-[#FAF7F2] flex items-center justify-center overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
                alt="Mapa da Região Deolinda Pizzaria"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px]" />

              {/* Pin Center Marker - Centered Floating Button with GPS Navigation */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <button
                  type="button"
                  onClick={handleNavigateWithGPS}
                  disabled={isLocating}
                  className="pointer-events-auto flex flex-col items-center justify-center text-center group/pin hover:scale-105 transition-transform duration-300 cursor-pointer disabled:opacity-80"
                  title="Clique para navegar do seu dispositivo até a Deolinda Pizzaria"
                >
                  <div className="w-10 h-10 rounded-full bg-[#C24D2C] text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce group-hover/pin:bg-[#A63A1E] transition-colors">
                    <UtensilsCrossed className="w-4 h-4 text-white" />
                  </div>
                  <div className="mt-1.5 bg-white/95 backdrop-blur-md text-[#181513] px-3.5 py-1 rounded-xl border border-[#E0D5C3] text-[11px] font-bold shadow-lg flex items-center justify-center gap-1.5 group-hover/pin:border-[#C24D2C] transition-all">
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C24D2C] shrink-0" />
                        <span className="text-[#C24D2C]">Obtendo GPS...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="tracking-wide">Deolinda Pizzaria</span>
                        <Navigation className="w-3 h-3 text-[#C24D2C] shrink-0" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="p-3 bg-[#FAF7F2] border-t border-[#EADFCF] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="text-[11px] text-[#5C554E] text-center sm:text-left">
                <p className="font-bold text-[#181513] leading-tight">Navegação GPS em tempo real:</p>
                <p className="text-[#7A7067] text-[10px]">Traça a melhor rota a partir da sua posição</p>
              </div>

              <button
                type="button"
                onClick={handleNavigateWithGPS}
                disabled={isLocating}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#C24D2C] hover:bg-[#A83D22] text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer disabled:opacity-75"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Obtendo GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-white" />
                    <span>Navegar até a Pizzaria</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
