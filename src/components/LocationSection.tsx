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

export const LocationSection: React.FC = () => {
  const mapsUrl = 'https://maps.app.goo.gl/WXxuE14BxN9RBDmh8?g_st=ac';
  const destinationQuery = 'Deolinda Pizzaria Napoletana';
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
    <section id="localizacao" className="py-12 sm:py-16 bg-[#181513] text-[#FAF7F2] relative overflow-hidden scroll-mt-20">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C24D2C]/20 text-[#E5A93C] text-xs font-bold uppercase tracking-widest mb-3 border border-[#C24D2C]/40">
            <MapPin className="w-4 h-4 text-[#C24D2C]" />
            <span>Onde Nos Encontrar</span>
          </div>
          <h2 className="font-serif-italian text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Visite a Deolinda Pizzaria Napoletana
          </h2>
          <p className="text-white/70 text-base sm:text-lg">
            Um refúgio italiano aconchegante com aroma de lenha queimando, vinhos selecionados e a verdadeira hospitalidade de Nápoles.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Hours & Contact Info (Left 5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            
            {/* Opening Hours & Contact Card */}
            <div className="bg-[#211D1A] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-[#E5A93C] mb-4">
                  <Clock className="w-6 h-6" />
                  <h3 className="font-serif-italian text-xl font-bold text-white">
                    Horários de Funcionamento
                  </h3>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-white/80">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="font-semibold">Terça a Quinta-feira</span>
                    <span className="text-[#E5A93C] font-bold">18h00 às 23h30</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="font-semibold">Sexta e Sábado</span>
                    <span className="text-[#E5A93C] font-bold">18h00 às 00h00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="font-semibold">Domingo</span>
                    <span className="text-[#E5A93C] font-bold">18h00 às 23h00</span>
                  </div>
                  <div className="flex justify-between py-2 text-white/40">
                    <span>Segunda-feira</span>
                    <span className="italic">Fechado (Descanso da Massa)</span>
                  </div>
                </div>

                <div className="pt-3 text-[11px] text-[#E5A93C] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span>Forno a Lenha aquecido a 450°C durante todo o serviço</span>
                </div>
              </div>

              {/* Direct WhatsApp Contact Button */}
              <div className="pt-4 border-t border-white/10">
                <a
                  href="https://wa.me/5511915331853?text=Ol%C3%A1%20Deolinda%20Pizzaria!%20Gostaria%20de%20informa%C3%A7%C3%B5es."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp: (11) 91533-1853</span>
                </a>
              </div>
            </div>

          </div>

          {/* Interactive Map Visual Representation (Right 7 cols) */}
          <div className="lg:col-span-7 bg-[#211D1A] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between relative min-h-[380px]">
            
            {/* Map Visual Header */}
            <div className="p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-[#181513]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C24D2C] animate-pulse" />
                <span className="font-bold text-white">Localização Oficial Deolinda</span>
              </div>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <span>Abrir Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Stylized Map View Graphic */}
            <div className="relative flex-1 w-full min-h-[320px] bg-[#1a1714] flex items-center justify-center overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
                alt="Mapa da Região Deolinda Pizzaria"
                className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-[#181513]/60 backdrop-blur-[1px]" />

              {/* Pin Center Marker - Centered Floating Button with GPS Navigation */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <button
                  type="button"
                  onClick={handleNavigateWithGPS}
                  disabled={isLocating}
                  className="pointer-events-auto flex flex-col items-center justify-center text-center group/pin hover:scale-105 transition-transform duration-300 cursor-pointer disabled:opacity-80"
                  title="Clique para navegar do seu dispositivo até a Deolinda Pizzaria"
                >
                  <div className="w-14 h-14 rounded-full bg-[#C24D2C] text-white flex items-center justify-center shadow-2xl border-4 border-white animate-bounce group-hover/pin:bg-[#A63A1E] transition-colors">
                    <UtensilsCrossed className="w-7 h-7 text-[#E5A93C]" />
                  </div>
                  <div className="mt-2.5 bg-[#181513]/95 backdrop-blur-md text-[#FAF7F2] px-4 py-2 rounded-2xl border-2 border-[#E5A93C]/70 text-xs sm:text-sm font-bold shadow-2xl flex items-center justify-center gap-2 group-hover/pin:border-[#E5A93C] group-hover/pin:bg-black transition-all">
                    {isLocating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#E5A93C] shrink-0" />
                        <span className="text-[#E5A93C]">Obtendo sua localização GPS...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="tracking-wide">Deolinda Pizzaria Napoletana</span>
                        <Navigation className="w-3.5 h-3.5 text-[#E5A93C] shrink-0" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="p-6 bg-[#181513] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-white/80 text-center sm:text-left">
                <p className="font-bold text-white">Navegação GPS em tempo real:</p>
                <p className="text-[#E5A93C]">Traça a melhor rota a partir da sua posição atual</p>
              </div>

              <button
                type="button"
                onClick={handleNavigateWithGPS}
                disabled={isLocating}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#E5A93C] hover:bg-[#d6992b] text-[#181513] font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer disabled:opacity-75"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#181513]" />
                    <span>Obtendo GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
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
