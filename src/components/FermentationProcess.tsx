import React, { useState } from 'react';
import mozzarellaBufalaImg from '../assets/images/mozzarella_bufala_campana_1787254547476.jpg';
import { 
  Clock, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  Leaf, 
  Wheat, 
  ShieldCheck, 
  Droplets,
  Heart,
  HelpCircle
} from 'lucide-react';

export const FermentationProcess: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: '1. O Cultivo do Lievito Madre',
      time: 'Hora 0 a 12',
      tag: 'Fermento Vivo',
      desc: 'Utilizamos nossa cultura viva de leveduras e bactérias lácticas mantida desde 1952. Este fermento natural confere sabor complexo, acidez sutil e aromas florais inigualáveis à massa.',
      detail: 'Alimentado diariamente com água pura e farinha de trigo de alta força (W300+).'
    },
    {
      title: '2. Hidratação 70% & Farinha Tipo 00',
      time: 'Hora 12 a 24',
      tag: 'Amassamento Suave',
      desc: 'Mistura lenta sem aquecer a massa. A farinha italiana Tipo 00 possui granulometria finíssima e alta pureza, permitindo absorver 70% de água e criando uma rede de glúten flexível e aveludada.',
      detail: 'Massa aberta estritamente com as pontas dos dedos, preservando o ar no cornicione.'
    },
    {
      title: '3. Maturação Lenta a Frio (48 Horas)',
      time: 'Hora 24 a 48',
      tag: 'Transformação Química',
      desc: 'O segredo da leveza! Em temperatura controlada a 4°C, as enzimas transformam os açúcares complexos e quebram as cadeias de glúten em aminoácidos simples. O resultado é uma pizza leve que não pesa no estômago.',
      detail: '90% dos açúcares são pré-digeridos pelo fermento natural antes de ir ao forno.'
    },
    {
      title: '4. Forno a Lenha Napoletano a 450°C',
      time: '60 a 90 Segundos',
      tag: 'Choque Térmico',
      desc: 'Assada diretamente na pedra vulcânica do Vesúvio. O calor intenso e rápido expande as bolhas de ar internas instantaneamente, criando a borda inflada, aerada e com as autênticas marcas de leopardo.',
      detail: 'O miolo permanece úmido e sedoso enquanto a casca ganha crocância delicada.'
    }
  ];

  const dopIngredients = [
    {
      name: 'Pomodoro San Marzano D.O.P.',
      origin: 'Agro Sarnese-Nocerino, Campânia',
      badge: 'D.O.P. Certificado',
      desc: 'Cultivado no solo vulcânico do Monte Vesúvio. Menos acidez, doçura natural equilibrada e polpa densa que não solta água excessiva.',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Mozzarella di Bufala Campana D.O.P.',
      origin: 'Caserta & Salerno, Itália',
      badge: 'Leite 100% Búfala',
      desc: 'Fresca e cremosa, feita exclusivamente com leite de búfala pasteurizado na hora. Derrete formando fios sedosos e aroma amanteigado.',
      image: mozzarellaBufalaImg
    },
    {
      name: 'Farinha Italiana Caputo Tipo 00',
      origin: 'Nápoles, Itália',
      badge: 'Trigo 100% Nobre',
      desc: 'Moagem ultra-fina livre de aditivos químicos. Proporciona elasticidade natural e alvéolos de ar volumosos na borda (cornicione).',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Azeite Extra Vergine & Basilico',
      origin: 'Toscana & Horta Própria',
      badge: 'Colheita Diária',
      desc: 'Manjericão colhido momentos antes de ir à pizza e azeite toscano de primeira prensagem a frio com notas herbáceas intensas.',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <section id="fermentacao" className="py-12 sm:py-16 bg-[#FAF7F2] text-[#1E1B18] border-b border-[#EADFCF]">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C24D2C]/10 text-[#C24D2C] text-xs font-bold uppercase tracking-widest mb-3">
            <Wheat className="w-4 h-4" />
            <span>Processo Artesanal & Saúde</span>
          </div>
          <h2 className="font-serif-italian text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#181513] mb-4">
            O Segredo das 48 Horas de Fermentação Lenta
          </h2>
          <p className="text-[#5C554E] text-base sm:text-lg leading-relaxed">
            Esqueça a sensação de peso e sede após comer pizza. Nosso método tradicional napolitano une tempo, paciência e biologia para criar uma massa aerada, incrivelmente leve e fácil de digerir.
          </p>
        </div>

        {/* 4-Step Interactive Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-20">
          
          {/* Step Selector List (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {steps.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white border-[#C24D2C] shadow-xl shadow-[#C24D2C]/10 ring-2 ring-[#C24D2C]/20'
                      : 'bg-[#F4EFE6]/60 border-transparent hover:bg-white hover:border-[#D6C7B2]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C24D2C] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {step.time}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1B382B]/10 text-[#1B382B]">
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#181513] mb-1">
                    {step.title}
                  </h3>

                  <p className="text-sm text-[#5C554E] leading-relaxed mb-2">
                    {step.desc}
                  </p>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-[#F0E6D8] flex items-center gap-2 text-xs font-medium text-[#1B382B]">
                      <Sparkles className="w-4 h-4 text-[#E5A93C] shrink-0" />
                      <span>{step.detail}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Visual Card (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#181513] to-[#2B231D] rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#C24D2C]/20 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#E5A93C]/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 rounded-full bg-[#C24D2C] text-xs font-bold tracking-wider uppercase">
                  Anatomia Napolitana
                </span>
                <span className="text-[#E5A93C] text-xs font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  450°C no Forno
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-lg relative group">
                <img
                  src="https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80"
                  alt="Pizza Napoletana Borda Cornicione"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <p className="text-xs text-[#FAF7F2] font-medium">
                    🔍 Cornicione: A borda alta e oca cheia de alvéolos de ar
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Digestão Fácil:</strong>{' '}
                    <span className="text-white/80">O glúten quebrado durante 48h não fermenta na sua barriga.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Textura 'Nuvolosa':</strong>{' '}
                    <span className="text-white/80">Centro fino e úmido com bordas fofas como nuvem.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Sem Açúcar ou Gordura na Massa:</strong>{' '}
                    <span className="text-white/80">Apenas Farinha 00, Água, Sal Marinho e Lievito Madre.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* D.O.P. Ingredients Section */}
        <div className="mt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B382B] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-[#1B382B]" />
              <span>Autenticidade Garantida</span>
            </div>
            <h3 className="font-serif-italian text-2xl sm:text-3xl font-bold text-[#181513]">
              Ingredientes Importados de Origem Protegida (D.O.P.)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dopIngredients.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden border border-[#EADFCF] shadow-sm hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#181513]/80 text-[#E5A93C] text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm border border-[#E5A93C]/30">
                    {item.badge}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <p className="text-[11px] font-bold text-[#C24D2C] uppercase tracking-wide mb-1">
                    {item.origin}
                  </p>
                  <h4 className="font-serif-italian text-lg font-bold text-[#181513] mb-2">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#5C554E] leading-relaxed flex-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
