import React from 'react';
import { TricolorBands } from './TricolorBands';
import { DeolindaLogotype } from './DeolindaLogotype';
import { SiteInfo } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeroProps {
  onOpenMenu?: () => void;
  onOpenReservation?: () => void;
  onOpenConcierge?: () => void;
  onNavigate?: (id: string, pathOverride?: string) => void;
  customLogoUrl?: string | null;
  customEmblemUrl?: string | null;
  isEmblemEnabled?: boolean;
  siteInfo?: SiteInfo;
}

export const Hero: React.FC<HeroProps> = ({
  customLogoUrl,
  customEmblemUrl,
  isEmblemEnabled = true,
  siteInfo
}) => {
  const { isDark } = useTheme();

  return (
    <section className="relative bg-white dark:bg-[#12100E] text-[#181513] dark:text-[#FAF7F2] pt-2 sm:pt-3 pb-12 sm:pb-16 overflow-x-clip transition-colors duration-200">
      <div className="relative z-10 w-full max-w-[1520px] mx-auto px-3 sm:px-5 lg:px-6 pt-0 sm:pt-1 pb-4">

        {/* Coluna Esquerda: Logo junto e centralizado com o texto próximo à margem esquerda | Coluna Direita: Foto próxima ao cabeçalho */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* Coluna Esquerda: Logo + Texto centralizados juntos no lado esquerdo */}
          <div className="md:col-span-6 flex flex-col items-center text-center pt-2 sm:pt-4 md:pt-6">
            {/* Logo Principal junto e centralizado com o texto */}
            <div className="w-full flex justify-center mb-4 sm:mb-5 group">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-68 lg:h-68 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shrink-0">
                <img
                  src={customLogoUrl || "/deolinda_logo.png"}
                  alt="Logo Deolinda Pizzaria"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Imagem / Letreiro Vetorizado */}
            <div className="flex flex-col items-center justify-center w-full max-w-lg mb-3.5">
              {customEmblemUrl && isEmblemEnabled !== false ? (
                <img
                  src={customEmblemUrl}
                  alt="Emblema Deolinda Pizzaria"
                  className="h-16 sm:h-20 md:h-28 w-auto max-w-full object-contain object-center filter drop-shadow-xs hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <DeolindaLogotype
                  variant={isDark ? 'white' : 'original'}
                  className="h-11 sm:h-12 md:h-14 w-auto max-w-[280px] sm:max-w-[360px] drop-shadow-xs hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>

            {/* Identidade italiana vetorizada */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 mt-0.5 mb-5">
              <TricolorBands direction="left" theme={isDark ? 'dark' : 'light'} className="w-10 sm:w-16 md:w-20" />

              <span className="text-sm sm:text-base md:text-lg tracking-[0.2em] sm:tracking-[0.3em] uppercase font-bold text-[#181513] dark:text-[#FAF7F2] font-cinzel drop-shadow-xs whitespace-nowrap">
                {siteInfo?.heroSubBadge || 'Pizzaria Napoletana'}
              </span>

              <TricolorBands direction="right" theme={isDark ? 'dark' : 'light'} className="w-10 sm:w-16 md:w-20" />
            </div>

            {/* Subtitle */}
            <div className="max-w-xl text-lg sm:text-xl lg:text-2xl text-[#4A423B] dark:text-[#D6CEC5] font-light leading-relaxed whitespace-pre-line text-center">
              {(!siteInfo?.heroSubtitle ||
                siteInfo.heroSubtitle.includes('D.O.P') ||
                siteInfo.heroSubtitle.includes('DOP') ||
                siteInfo.heroSubtitle.includes('450') ||
                siteInfo.heroSubtitle.includes('farinha italiana Tipo 00')) ? (
                <>
                  <p>
                    Fermentação natural lenta de <strong className="text-[#C24D2C] dark:text-[#E5A93C] font-semibold">72 horas</strong> e o fogo intenso da pedra vulcânica a <strong className="text-[#C24D2C] dark:text-[#E5A93C] font-semibold">430 °C</strong>.
                  </p>
                  <p className="mt-3 text-base sm:text-lg text-[#5A5046] dark:text-[#B8AEA3] font-normal">
                    Porque aqui não fazemos apenas pizza. Criamos experiências com o verdadeiro sabor da Itália. ❤️
                  </p>
                </>
              ) : (
                siteInfo.heroSubtitle.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className={idx > 0 ? "mt-3 text-base sm:text-lg text-[#5A5046] dark:text-[#B8AEA3] font-normal" : ""}>
                    {paragraph}
                  </p>
                ))
              )}
            </div>
          </div>

          {/* Coluna Direita: Foto inteira visível com efeito Reveal fixo ao rolar + Descrição do Cornicione logo abaixo */}
          <aside className="md:col-span-6 self-start w-full flex justify-center md:justify-end">
            <div className="w-full max-w-[540px] bg-white dark:bg-[#1B1815] border border-transparent dark:border-white/10 rounded-3xl overflow-clip transition-colors duration-200">
              {/* Janela na proporção exata da foto (681x812) para visualizar toda a imagem sem cortes */}
              <div className="relative w-full aspect-[681/812] overflow-clip rounded-3xl">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 -top-[100vh] -bottom-[100vh] overflow-clip isolate pointer-events-none motion-reduce:inset-0"
                >
                  <div className="sticky top-24 lg:top-20 w-full motion-reduce:static">
                    <img
                      src="/assets/aistudio/Captura_de_tela_2026-11-15_203026_c3b68c56.png"
                      alt="Cornicione da pizza napolitana"
                      className="w-full h-auto block"
                      loading="eager"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <span className="sr-only">Cornicione da pizza napolitana</span>
              </div>

              <div className="p-6 sm:p-8 space-y-4 bg-white dark:bg-[#1B1815] border-t border-transparent dark:border-white/10 transition-colors duration-200">
                <h3 className="text-lg sm:text-xl font-bold text-[#181513] dark:text-[#FAF7F2] font-cinzel leading-snug text-center">
                  Você sabe oque é Cornicione?
                </h3>

                <p className="text-sm sm:text-[15px] text-[#4A423B] dark:text-[#D6CEC5] leading-relaxed text-justify">
                  Diferente das bordas tradicionais ou recheadas comuns no Brasil, o corniccione é a verdadeira "alma" da pizza napolitana. É o resultado de uma massa com longa fermentação e alta hidratação, assada rapidamente em forno a lenha muito quente. Fica alto, inflado, leve, aerado por dentro (cheio de alvéolos) e crocante por fora.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </section>
  );
};
