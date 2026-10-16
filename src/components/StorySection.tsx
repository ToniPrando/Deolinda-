import React from 'react';
import { 
  Heart, 
  CheckCircle 
} from 'lucide-react';
import { ARTISAN_PILLARS } from '../data/storyData';
import { SiteInfo } from '../types';

interface StorySectionProps {
  siteInfo?: SiteInfo;
}

export const StorySection: React.FC<StorySectionProps> = ({ siteInfo }) => {

  return (
    <section id="historia" className="py-12 sm:py-16 bg-[#FAF7F2] text-[#1E1B18] border-b border-[#EADFCF] scroll-mt-20">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1B382B]/10 text-[#1B382B] text-xs font-bold uppercase tracking-widest mb-3">
            <Heart className="w-4 h-4 text-[#C24D2C]" />
            <span>{siteInfo?.storyBadge || 'Tradição Familiar & Paixão'}</span>
          </div>
          <h2 className="font-serif-italian text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#181513] mb-4">
            {siteInfo?.storyTitle || 'A História da Nonna Deolinda'}
          </h2>
          <p className="text-[#5C554E] text-base sm:text-lg">
            {siteInfo?.storySubtitle || 'Mais do que uma receita, um legado sagrado de amor, farinha pura e paciência transmitido de geração em geração desde as ruelas de Nápoles.'}
          </p>
        </div>

        {/* Feature Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-20">
          
          {/* Main Visual Image (Left 5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                alt="História da Pizzaria Deolinda"
                className="w-full h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs uppercase font-bold text-[#E5A93C] tracking-wider mb-1">
                  Nápoles, 1952
                </span>
                <p className="font-serif-italian text-xl font-bold text-[#FAF7F2]">
                  "{siteInfo?.storyQuote || 'A massa tem alma. Se você tiver paciência, ela recompensará todos à sua mesa.'}"
                </p>
                <span className="text-xs text-white/70 italic mt-1">
                  — {siteInfo?.storyQuoteAuthor || 'Nonna Deolinda Bertolli'}
                </span>
              </div>
            </div>
          </div>

          {/* Narrative Text (Right 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4 text-sm sm:text-base text-[#5C554E] leading-relaxed">
              <p>
                {siteInfo?.storyParagraph1 || (
                  <>
                    A história da <strong>Deolinda Pizzaria Napoletana</strong> começou há mais de sete décadas no coração de Spaccanapoli, onde a jovem Deolinda aprendeu que a verdadeira pizza napolitana não aceita atalhos.
                  </>
                )}
              </p>
              <p>
                {siteInfo?.storyParagraph2 || (
                  <>
                    Quando a família decidiu atravessar o Atlântico rumo ao Brasil, o bem mais precioso na bagagem era um pote de vidro protegido com o fermento natural da bisavó. Esse mesmo fermento biológico vivo é alimentado todos os dias até hoje em nossa cozinha para dar origem à nossa massa aerada de 72 horas.
                  </>
                )}
              </p>
            </div>

            {/* 4 Pillars of Excellence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {ARTISAN_PILLARS.map((pillar, pIdx) => (
                <div
                  key={pIdx}
                  className="bg-white p-3.5 rounded-2xl border border-[#EADFCF] shadow-sm flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-[#1B382B]/10 text-[#1B382B] shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-[#1B382B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#181513]">{pillar.title}</h4>
                    <p className="text-[11px] text-[#5C554E] leading-tight mt-0.5">{pillar.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
