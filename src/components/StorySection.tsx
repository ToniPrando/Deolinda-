import React, { useState } from 'react';
import { 
  Heart, 
  Sparkles, 
  Award, 
  Flame, 
  Clock, 
  MapPin, 
  Quote, 
  CheckCircle,
  Users
} from 'lucide-react';
import { STORY_MILESTONES, ARTISAN_PILLARS } from '../data/storyData';

export const StorySection: React.FC = () => {
  const [selectedMilestone, setSelectedMilestone] = useState(0);

  return (
    <section id="historia" className="py-12 sm:py-16 bg-[#FAF7F2] text-[#1E1B18] border-b border-[#EADFCF] scroll-mt-20">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1B382B]/10 text-[#1B382B] text-xs font-bold uppercase tracking-widest mb-3">
            <Heart className="w-4 h-4 text-[#C24D2C]" />
            <span>Tradição Familiar & Paixão</span>
          </div>
          <h2 className="font-serif-italian text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#181513] mb-4">
            A História da Nonna Deolinda
          </h2>
          <p className="text-[#5C554E] text-base sm:text-lg">
            Mais do que uma receita, um legado sagrado de amor, farinha pura e paciência transmitido de geração em geração desde as ruelas de Nápoles.
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
                  "A massa tem alma. Se você tiver paciência, ela recompensará todos à sua mesa."
                </p>
                <span className="text-xs text-white/70 italic mt-1">
                  — Nonna Deolinda Bertolli
                </span>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-[#C24D2C] text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border-2 border-white">
              <Flame className="w-8 h-8 text-[#E5A93C]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Lievito Madre</p>
                <p className="text-sm font-extrabold text-[#FAF7F2]">Centenário da Família</p>
              </div>
            </div>
          </div>

          {/* Narrative Text (Right 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4 text-sm sm:text-base text-[#5C554E] leading-relaxed">
              <p>
                A história da <strong>Deolinda Pizzaria Napoletana</strong> começou há mais de sete décadas no coração de Spaccanapoli, onde a jovem Deolinda aprendeu que a verdadeira pizza napolitana não aceita atalhos.
              </p>
              <p>
                Quando a família decidiu atravessar o Atlântico rumo ao Brasil, o bem mais precioso na bagagem era um pote de vidro protegido com o fermento natural da bisavó. Esse mesmo fermento biológico vivo é alimentado todos os dias até hoje em nossa cozinha para dar origem à nossa massa aerada de 48 horas.
              </p>
              <p>
                Em 2016, erguemos nosso forno a lenha no padrão estrito da <em>Associazione Verace Pizza Napoletana</em>, utilizando pedras vulcânicas do Vesúvio e importando o Pomodoro San Marzano e a Mozzarella di Bufala diretamente de produtores artesanais da Campânia.
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

        {/* Interactive Milestones Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EADFCF] shadow-sm">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-bold text-[#C24D2C] tracking-widest">
              Linha do Tempo
            </span>
            <h3 className="font-serif-italian text-2xl sm:text-3xl font-bold text-[#181513] mt-1">
              Sete Décadas de Devoção à Pizza Napolitana
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8">
            {STORY_MILESTONES.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMilestone(idx)}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                  selectedMilestone === idx
                    ? 'bg-[#181513] text-white border-[#181513] shadow-md'
                    : 'bg-[#FAF7F2] text-[#5C554E] hover:bg-[#F4EFE6] border-[#EADFCF]'
                }`}
              >
                <span className={`text-xs font-bold block ${selectedMilestone === idx ? 'text-[#E5A93C]' : 'text-[#C24D2C]'}`}>
                  {m.year}
                </span>
                <span className="text-xs font-semibold block truncate mt-0.5">
                  {m.title}
                </span>
              </button>
            ))}
          </div>

          {/* Active Milestone Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#FAF7F2] rounded-2xl p-5 sm:p-6 border border-[#EADFCF]">
            <div className="md:col-span-4 h-48 rounded-xl overflow-hidden">
              <img
                src={STORY_MILESTONES[selectedMilestone].image}
                alt={STORY_MILESTONES[selectedMilestone].title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#C24D2C]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{STORY_MILESTONES[selectedMilestone].location} • {STORY_MILESTONES[selectedMilestone].year}</span>
              </div>
              <h4 className="font-serif-italian text-xl sm:text-2xl font-bold text-[#181513]">
                {STORY_MILESTONES[selectedMilestone].title}
              </h4>
              <p className="text-xs sm:text-sm text-[#5C554E] leading-relaxed">
                {STORY_MILESTONES[selectedMilestone].description}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
