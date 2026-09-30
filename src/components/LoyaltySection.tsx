import React, { useState } from 'react';
import { 
  Sparkles, 
  Award, 
  Gift, 
  QrCode, 
  CheckCircle2, 
  Crown, 
  Flame, 
  ArrowRight, 
  Pizza, 
  Wine, 
  Cake, 
  Utensils 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LOYALTY_REWARDS } from '../data/menuData';
import { LoyaltyMember } from '../types';

export const LoyaltySection: React.FC = () => {
  const [member, setMember] = useState<LoyaltyMember>({
    id: 'MEM-8902',
    name: 'Cliente Deolinda VIP',
    email: 'membro@deolinda.com',
    phone: '(11) 98888-7777',
    points: 340,
    tier: 'Pizzaiolo Appassionato',
    joinedDate: 'Agosto 2024',
    memberCode: 'DEO-8902-VIP',
    freePizzasEarned: 2
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [redeemedReward, setRedeemedReward] = useState<string | null>(null);
  const [simulationValue, setSimulationValue] = useState<number>(180);

  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName || !inputPhone) return;

    const newMember: LoyaltyMember = {
      id: `MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: inputName,
      email: `${inputName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phone: inputPhone,
      points: 150, // Welcome bonus!
      tier: 'Amici di Deolinda',
      joinedDate: 'Hoje',
      memberCode: `DEO-${Math.floor(1000 + Math.random() * 9000)}-FEDELTA`,
      freePizzasEarned: 0
    };

    setMember(newMember);
    setIsRegistering(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleRedeem = (rewardId: string, pts: number, title: string) => {
    if (member.points < pts) {
      alert(`Você precisa de ${pts} pontos para resgatar "${title}". Seu saldo atual é ${member.points} pontos.`);
      return;
    }

    setMember(prev => ({
      ...prev,
      points: prev.points - pts
    }));

    setRedeemedReward(`🎉 Parabéns! Você resgatou "${title}". O voucher foi adicionado ao seu cartão.`);
    setTimeout(() => setRedeemedReward(null), 5000);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cake': return <Cake className="w-5 h-5" />;
      case 'Pizza': return <Pizza className="w-5 h-5" />;
      case 'Wine': return <Wine className="w-5 h-5" />;
      default: return <Utensils className="w-5 h-5" />;
    }
  };

  return (
    <section id="fidelidade" className="py-20 bg-[#FAF7F2] text-[#1E1B18] border-b border-[#EADFCF] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5A93C]/15 text-[#8C5E0A] text-xs font-bold uppercase tracking-widest mb-3 border border-[#E5A93C]/40">
            <Sparkles className="w-4 h-4 text-[#C24D2C]" />
            <span>Club Fedeltà Deolinda</span>
          </div>
          <h2 className="font-serif-italian text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#181513] mb-4">
            Coma Pizza, Ganhe Pontos & Recompensas
          </h2>
          <p className="text-[#5C554E] text-base sm:text-lg">
            A cada R$ 10 consumidos no salão, balcão ou delivery, você ganha <strong>10 Pontos de Farinha</strong> para trocar por pizzas inteiras, sobremesas e experiências exclusivas.
          </p>
        </div>

        {/* Floating Notification */}
        {redeemedReward && (
          <div className="max-w-xl mx-auto mb-8 bg-[#1B382B] text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2D5F49] animate-in slide-in-from-top-4">
            <Gift className="w-6 h-6 text-[#E5A93C] shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{redeemedReward}</p>
          </div>
        )}

        {/* Member Digital Card & Level Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          
          {/* Digital Loyalty Card (Left 5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-br from-[#181513] via-[#2B231D] to-[#181513] rounded-3xl p-6 sm:p-8 text-white shadow-2xl border-2 border-[#E5A93C]/40 relative overflow-hidden">
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C24D2C]/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#E5A93C]/20 rounded-full blur-2xl" />

              <div className="relative z-10">
                
                {/* Card Top */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Flame className="w-6 h-6 text-[#E5A93C]" />
                    <span className="font-serif-italian font-bold text-lg text-white">
                      Deolinda Fedeltà
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#E5A93C] text-[#181513] text-[10px] font-black uppercase tracking-wider">
                    {member.tier}
                  </span>
                </div>

                {/* Points Balance */}
                <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-white/60">Saldo de Pontos</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-[#E5A93C]">{member.points}</span>
                    <span className="text-xs text-white/80 font-semibold">Pontos de Farinha</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#E5A93C] to-[#C24D2C] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (member.points / 400) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/60 mt-1.5 flex justify-between">
                    <span>Faltam {Math.max(0, 400 - member.points)} pts para Pizza Margherita Grátis</span>
                    <span>Meta: 400 pts</span>
                  </p>
                </div>

                {/* Member Info & QR Code */}
                <div className="flex items-end justify-between pt-2">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">{member.name}</p>
                    <p className="text-[11px] font-mono text-white/60 mt-0.5">{member.memberCode}</p>
                    <p className="text-[10px] text-[#E5A93C] mt-1">Membro desde {member.joinedDate}</p>
                  </div>

                  <div className="p-2 bg-white rounded-xl shadow-md">
                    <QrCode className="w-10 h-10 text-[#181513]" />
                  </div>
                </div>

              </div>
            </div>

            {/* Custom Register Toggle Button */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-bold text-[#C24D2C] hover:underline cursor-pointer"
              >
                {isRegistering ? 'Fechar formulário de cadastro' : 'Não é cadastrado? Ative seu Cartão Digital com +150 Pontos Bônus'}
              </button>
            </div>

            {/* Register form */}
            {isRegistering && (
              <form onSubmit={handleRegisterMember} className="mt-4 p-5 bg-white rounded-2xl border border-[#E0D5C3] shadow-md space-y-3 animate-in fade-in duration-200">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#181513]">
                  Cadastrar Cartão Fidelidade
                </h4>
                <input
                  type="text"
                  required
                  placeholder="Seu Nome Completo"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                />
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp (11) 99999-9999"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#1B382B] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#254E3C] transition-all"
                >
                  Ativar & Ganhar 150 Pontos
                </button>
              </form>
            )}
          </div>

          {/* Points Calculator Simulator (Right 7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFCF] shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C24D2C]">
                Simulador de Recompensas
              </span>
              <h3 className="font-serif-italian text-2xl font-bold text-[#181513] mt-1">
                Veja o quanto você ganha nos seus pedidos
              </h3>
              <p className="text-xs text-[#5C554E] mt-1">
                Arraste o valor do consumo para simular seus pontos e recompensas imediatas.
              </p>
            </div>

            {/* Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#5C554E]">Consumo na Pizzaria:</span>
                <span className="text-xl font-extrabold text-[#C24D2C]">
                  R$ {simulationValue},00
                </span>
              </div>

              <input
                type="range"
                min="40"
                max="600"
                step="10"
                value={simulationValue}
                onChange={(e) => setSimulationValue(Number(e.target.value))}
                className="w-full accent-[#C24D2C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8C827A] mt-1">
                <span>R$ 40</span>
                <span>R$ 300</span>
                <span>R$ 600</span>
              </div>
            </div>

            {/* Simulator Output Box */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#5C554E]">Pontos Gerados</span>
                <p className="text-2xl font-extrabold text-[#1B382B]">
                  +{Math.floor(simulationValue)} pts
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#5C554E]">Cashback Estimado</span>
                <p className="text-2xl font-extrabold text-[#E5A93C]">
                  10%
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-[#5C554E]">Próximo Resgate</span>
                <p className="text-xs font-bold text-[#C24D2C] mt-1">
                  {simulationValue >= 400 ? '🍕 Pizza Margherita D.O.P.' : simulationValue >= 220 ? '🍰 Tiramisù della Nonna' : '🫒 Bruschetta Caprese'}
                </p>
              </div>
            </div>

            {/* Loyalty Levels info */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EAE1] text-center">
              <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                <p className="text-[10px] font-bold text-[#5C554E]">Nível 1</p>
                <p className="text-xs font-extrabold text-[#181513]">Amici di Deolinda</p>
                <p className="text-[10px] text-[#8C827A]">0 a 200 pts</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/30">
                <p className="text-[10px] font-bold text-[#8C5E0A]">Nível 2</p>
                <p className="text-xs font-extrabold text-[#8C5E0A]">Pizzaiolo</p>
                <p className="text-[10px] text-[#8C5E0A]/80">201 a 500 pts</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1B382B]/10">
                <p className="text-[10px] font-bold text-[#1B382B]">Nível 3</p>
                <p className="text-xs font-extrabold text-[#1B382B]">Maestro</p>
                <p className="text-[10px] text-[#1B382B]/80">500+ pts</p>
              </div>
            </div>
          </div>

        </div>

        {/* Redeemable Rewards Grid */}
        <div>
          <h3 className="font-serif-italian text-2xl font-bold text-[#181513] mb-6">
            Catálogo de Recompensas para Resgate
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LOYALTY_REWARDS.map((rew) => {
              const canAfford = member.points >= rew.pointsRequired;
              return (
                <div
                  key={rew.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                    canAfford
                      ? 'bg-white border-[#E5A93C] shadow-md hover:shadow-xl ring-1 ring-[#E5A93C]/30'
                      : 'bg-white/60 border-[#EADFCF] opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-2xl bg-[#FAF7F2] text-[#C24D2C] border border-[#EADFCF]">
                        {getRewardIcon(rew.iconName)}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#181513] text-[#E5A93C] text-xs font-black">
                        {rew.pointsRequired} pts
                      </span>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C24D2C]">
                      {rew.category}
                    </span>

                    <h4 className="font-serif-italian text-lg font-bold text-[#181513] mb-2">
                      {rew.title}
                    </h4>

                    <p className="text-xs text-[#5C554E] leading-relaxed mb-6">
                      {rew.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRedeem(rew.id, rew.pointsRequired, rew.title)}
                    className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      canAfford
                        ? 'bg-[#C24D2C] hover:bg-[#A63A1E] text-white shadow-md'
                        : 'bg-[#EADFCF] text-[#8C827A] cursor-not-allowed'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>{canAfford ? 'Resgatar Agora' : `Faltam ${rew.pointsRequired - member.points} pts`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
