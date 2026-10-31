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
    <section id="historia" className="pt-3 sm:pt-4 pb-12 bg-[#FAF7F2] text-[#1E1B18] border-b border-[#EADFCF] scroll-mt-16 sm:scroll-mt-18">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-3 sm:mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1B382B]/10 text-[#1B382B] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5">
            <Heart className="w-3.5 h-3.5 text-[#C24D2C]" />
            <span>{siteInfo?.storyBadge || 'Tradição Familiar & Paixão'}</span>
          </div>
          <h2 className="font-serif-italian text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#181513] mb-1 leading-tight">
            {siteInfo?.storyTitle || 'A História da Nonna Deolinda'}
          </h2>
          <p className="text-[#5C554E] text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            {siteInfo?.storySubtitle || 'Mais do que uma receita, um legado sagrado de amor, farinha pura e paciência transmitido de geração em geração desde as ruelas de Nápoles.'}
          </p>
        </div>

        {/* Feature Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center mb-8 sm:mb-10">
          
          {/* Main Visual Image (Left 5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 sm:border-4 border-white bg-black/10">
              <img
                src={siteInfo?.storyImageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"}
                alt="História da Pizzaria Deolinda"
                className="w-full h-[280px] sm:h-[320px] lg:h-[350px] object-cover"
              />
            </div>
          </div>

          {/* Narrative Text (Right 7 cols) */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[#5C554E] leading-relaxed">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {ARTISAN_PILLARS.map((pillar, pIdx) => (
                <div
                  key={pIdx}
                  className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#EADFCF] shadow-2xs flex items-start gap-2.5"
                >
                  <div className="p-1.5 rounded-lg bg-[#1B382B]/10 text-[#1B382B] shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#1B382B]" />
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
