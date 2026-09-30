import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  QrCode, 
  Send, 
  Share2, 
  Calendar,
  Heart,
  ChevronRight,
  UserCheck,
  Lock,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reservation, CustomerUser } from '../types';
import { saveReservationToFirestore } from '../services/firebaseService';

interface ReservationSectionProps {
  onReservationCreated: (res: Reservation) => void;
  currentUser: CustomerUser | null;
  onOpenAuth: () => void;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({ 
  onReservationCreated, 
  currentUser, 
  onOpenAuth 
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('20:00');
  const [guests, setGuests] = useState(2);
  const [area, setArea] = useState('Jardim do Forno a Lenha');
  const [occasion, setOccasion] = useState('Jantar Especial');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  // Sync with currentUser
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser]);

  const timeSlots = [
    '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const seatingAreas = [
    {
      name: 'Jardim do Forno a Lenha',
      desc: 'Mesas aconchegantes ao ar livre sob luzes suaves com aroma da lenha queimando.',
      icon: '🌿',
      badge: 'Mais Desejado'
    },
    {
      name: 'Salão Principal das Artes',
      desc: 'Ambiente climatizado e decorado com tijolos aparentes e fotos históricas de Nápoles.',
      icon: '🏛️',
      badge: 'Clássico'
    },
    {
      name: 'Varanda Rústica Romântica',
      desc: 'Ambiente íntimo à meia-luz, perfeito para casais e datas especiais.',
      icon: '🕯️',
      badge: 'Romântico'
    },
    {
      name: 'Balcão do Mestre Pizzaiolo',
      desc: 'Assista de perto à abertura da massa e à queima no forno a 450°C.',
      icon: '🔥',
      badge: 'Experiência VIP'
    }
  ];

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 2 && digits.length <= 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
    setPhone(formatted);
  };

  const occasions = [
    'Jantar Especial',
    'Aniversário 🎂',
    'Jantar Romântico / Casal 🕯️',
    'Reunião de Família 👨‍👩‍👧‍👦',
    'Encontro com Amigos 🍕',
    'Negócios / Confraternização 💼'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!name || !phone) {
      alert('Por favor, informe seu nome e telefone para confirmar a reserva.');
      return;
    }

    setIsSubmitting(true);

    const newRes: Reservation = {
      id: `RES-${Math.floor(100 + Math.random() * 900)}`,
      name: currentUser.name || name,
      phone: currentUser.phone || phone,
      email: currentUser.email || email || 'cliente@deolinda.com',
      date,
      time,
      guests,
      area,
      occasion,
      notes,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // 1. Instantly push to Cloud Firestore
    try {
      await saveReservationToFirestore(newRes);
    } catch (fsErr) {
      console.warn('Firestore reservation save:', fsErr);
    }

    try {
      // 2. Post to backend API
      await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRes)
      });
    } catch (err) {
      console.log('Using local state for reservation confirmation');
    }

    onReservationCreated(newRes);
    setConfirmedReservation(newRes);
    setIsSubmitting(false);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const getFormattedDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const generateWhatsAppLink = () => {
    if (!confirmedReservation) return '#';
    const text = encodeURIComponent(
      `Olá Deolinda Pizzaria! Acabei de fazer a reserva #${confirmedReservation.id} para ${confirmedReservation.name}, no dia ${confirmedReservation.date} às ${confirmedReservation.time} (${confirmedReservation.guests} pessoas no ${confirmedReservation.area}). Gostaria de confirmar!`
    );
    return `https://wa.me/5511999999999?text=${text}`;
  };

  return (
    <section id="reservas" className="py-20 bg-[#181513] text-[#FAF7F2] relative overflow-hidden scroll-mt-20">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C24D2C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1B382B]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5A93C]/10 text-[#E5A93C] text-xs font-bold uppercase tracking-widest mb-3 border border-[#E5A93C]/20">
            <CalendarDays className="w-4 h-4" />
            <span>Experiência Presencial</span>
          </div>
          <h2 className="font-serif-italian text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Reserve Sua Mesa na Deolinda
          </h2>
          <p className="text-white/70 text-base sm:text-lg">
            Garanta seu lugar ao redor do fogo do forno a lenha e desfrute de uma noite inesquecível de gastronomia napolitana.
          </p>
        </div>

        {confirmedReservation ? (
          /* Confirmation Digital Ticket */
          <div className="max-w-2xl mx-auto bg-[#FAF7F2] text-[#181513] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#E5A93C] animate-in zoom-in-95 duration-300">
            
            <div className="bg-[#1B382B] text-white p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5A93C] text-[#181513] font-black text-xs uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-4 h-4" />
                Reserva Confirmada com Sucesso
              </div>
              <h3 className="font-serif-italian text-2xl sm:text-3xl font-bold text-[#FAF7F2]">
                Benvenuto, {confirmedReservation.name}!
              </h3>
              <p className="text-xs text-[#FAF7F2]/80 mt-1">
                Seu voucher oficial foi emitido. Apresente na recepção ao chegar.
              </p>
              <div className="mt-4 inline-block bg-white/10 px-4 py-1.5 rounded-xl text-sm font-mono tracking-widest text-[#E5A93C] border border-white/20">
                CÓDIGO: #{confirmedReservation.id}
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F4EFE6] p-4 rounded-2xl border border-[#EADFCF]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5C554E]">Data</span>
                  <p className="text-xs sm:text-sm font-bold text-[#181513]">
                    {confirmedReservation.date}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5C554E]">Horário</span>
                  <p className="text-xs sm:text-sm font-bold text-[#C24D2C]">
                    {confirmedReservation.time}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5C554E]">Pessoas</span>
                  <p className="text-xs sm:text-sm font-bold text-[#181513]">
                    {confirmedReservation.guests} lugares
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5C554E]">Ambiente</span>
                  <p className="text-xs sm:text-sm font-bold text-[#1B382B] truncate">
                    {confirmedReservation.area}
                  </p>
                </div>
              </div>

              {/* QR Code and Location notice */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white border border-[#E0D5C3]">
                <div className="w-28 h-28 bg-[#181513] text-white rounded-2xl flex flex-col items-center justify-center p-3 shadow-inner shrink-0 text-center">
                  <QrCode className="w-12 h-12 text-[#E5A93C] mb-1" />
                  <span className="text-[9px] font-mono tracking-tighter text-white/70">
                    DEOLINDA-PASS
                  </span>
                </div>

                <div className="text-xs space-y-1 text-[#5C554E] flex-1 text-center sm:text-left">
                  <p className="font-bold text-[#181513] text-sm">
                    Tolerância de chegada: 15 minutos
                  </p>
                  <p>Mesa reservada para <strong>{confirmedReservation.occasion}</strong>.</p>
                  {confirmedReservation.notes && (
                    <p className="italic text-[#8C827A]">"{confirmedReservation.notes}"</p>
                  )}
                  <p className="text-[11px] text-[#C24D2C] font-semibold pt-1">
                    📍 Deolinda Pizzaria Napoletana • Estacionamento com Valet no local
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={generateWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar no WhatsApp da Pizzaria</span>
                </a>

                <button
                  onClick={() => setConfirmedReservation(null)}
                  className="px-6 py-3.5 rounded-2xl bg-[#F4EFE6] hover:bg-[#EADFCF] text-[#181513] font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Fazer Outra Reserva
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* Form Layout */
          <div className="bg-[#211D1A] rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto">
            
            {/* Customer Authentication Status Badge */}
            {currentUser ? (
              <div className="mb-6 p-4 rounded-2xl bg-[#1B382B]/80 border border-[#2D5F49] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E5A93C] text-[#181513] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    <UserCheck className="w-5 h-5 text-[#181513]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{currentUser.name}</span>
                      <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {currentUser.isGoogleAuth ? 'Conta Google' : 'Cliente Autenticado'}
                      </span>
                    </div>
                    <p className="text-white/70 text-xs">
                      {currentUser.phone} • {currentUser.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-xs font-bold text-[#E5A93C] hover:underline cursor-pointer flex items-center gap-1 self-end sm:self-center"
                >
                  <span>Alterar Cadastro</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div 
                onClick={onOpenAuth}
                className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#C24D2C]/30 via-[#211D1A] to-[#E5A93C]/20 border-2 border-[#E5A93C] hover:border-amber-300 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl group"
                role="button"
                tabIndex={0}
                aria-label="Abrir janela de cadastro obrigatório para reserva"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#C24D2C] text-white flex items-center justify-center font-bold text-base shrink-0 mt-0.5 shadow-lg group-hover:scale-105 transition-transform">
                    <Lock className="w-6 h-6 text-[#E5A93C]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-white flex items-center gap-1.5 font-serif-italian">
                        <span>Cadastro Obrigatório para Reserva</span>
                      </h4>
                      <span className="bg-[#E5A93C] text-[#181513] text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        Clique Aqui
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-1 max-w-xl leading-relaxed">
                      Para confirmar e garantir sua mesa com antecedência na Deolinda, é obrigatório estar cadastrado. Clique nesta janela para preencher seu cadastro ou entrar com sua conta Google.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAuth();
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#E5A93C] hover:bg-[#d4962b] text-[#181513] font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 group-hover:scale-105"
                >
                  <UserPlus className="w-4 h-4 text-[#181513]" />
                  <span>Cadastrar Agora</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="relative">
              {/* If user is not logged in, show lock overlay and prevent form filling */}
              {!currentUser && (
                <div 
                  onClick={onOpenAuth}
                  className="absolute inset-0 z-20 backdrop-blur-[2px] bg-[#181513]/75 rounded-2xl border border-dashed border-[#E5A93C]/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-[#181513]/85"
                >
                  <div className="w-16 h-16 rounded-full bg-[#C24D2C]/30 border border-[#E5A93C] flex items-center justify-center mb-3 shadow-lg">
                    <Lock className="w-8 h-8 text-[#E5A93C] animate-pulse" />
                  </div>
                  <h5 className="font-serif-italian text-lg font-bold text-white mb-1">
                    Preenchimento Bloqueado
                  </h5>
                  <p className="text-xs text-white/80 max-w-md mb-4 leading-relaxed">
                    Você precisa estar cadastrado e logado para selecionar a mesa, ambiente, horário e número de pessoas.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAuth();
                    }}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#C24D2C] to-[#E5A93C] text-white font-bold text-xs uppercase tracking-wider shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Clique aqui para Abrir o Cadastro</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className={`space-y-8 ${!currentUser ? 'opacity-40 select-none pointer-events-none' : ''}`}>
                
                {/* Step 1: Area Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#E5A93C] mb-3 flex items-center gap-2">
                    <span>1. Selecione o Ambiente Desejado</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seatingAreas.map((seat, sIdx) => (
                      <div
                        key={sIdx}
                        onClick={() => currentUser && setArea(seat.name)}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          area === seat.name
                            ? 'bg-[#1B382B] border-[#2D5F49] ring-2 ring-[#E5A93C] text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        } ${!currentUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{seat.icon}</span>
                            <h4 className="font-bold text-sm text-white">{seat.name}</h4>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#E5A93C]">
                            {seat.badge}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">{seat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Date, Time and Guests */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#E5A93C] mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Data</span>
                    </label>
                    <input
                      type="date"
                      required
                      disabled={!currentUser}
                      min={new Date().toISOString().split('T')[0]}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C] disabled:opacity-50"
                    />
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#E5A93C] mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Número de Pessoas</span>
                    </label>
                    <select
                      disabled={!currentUser}
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-[#2B2520] border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C] disabled:opacity-50"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Pessoa (Individual)' : num === 2 ? 'Pessoas (Casal / Dupla)' : `Pessoas`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Occasion */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#E5A93C] mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ocasião</span>
                    </label>
                    <select
                      disabled={!currentUser}
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#2B2520] border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C] disabled:opacity-50"
                    >
                      {occasions.map((occ, oIdx) => (
                        <option key={oIdx} value={occ}>
                          {occ}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Step 3: Time Slot Pills */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#E5A93C] mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Escolha o Horário</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        disabled={!currentUser}
                        onClick={() => currentUser && setTime(slot)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          time === slot
                            ? 'bg-[#C24D2C] text-white ring-2 ring-[#E5A93C] shadow-md'
                            : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/15'
                        } ${!currentUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4: Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#E5A93C] mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!currentUser}
                      placeholder="Ex: Antonio Rossi"
                      value={currentUser?.name || name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C] disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#E5A93C] mb-1.5">
                      WhatsApp para Confirmação *
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      disabled={!currentUser}
                      placeholder="(11) 99999-9999"
                      value={currentUser?.phone || phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C] disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Observações Especiais (Ex: cadeirão de bebê, restrições alimentares, etc.)
                  </label>
                  <textarea
                    rows={2}
                    disabled={!currentUser}
                    placeholder="Conte para nossa equipe se houver alguma necessidade especial..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C24D2C] disabled:opacity-50"
                  />
                </div>

                {/* Submit Button */}
                {currentUser ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C24D2C] to-[#A63A1E] hover:from-[#A63A1E] hover:to-[#8C2A12] text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-[#C24D2C]/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <CalendarDays className="w-5 h-5 text-[#E5A93C]" />
                    <span>{isSubmitting ? 'Confirmando Reserva...' : 'Confirmar Reserva de Mesa Gratuitamente'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="w-full py-4 rounded-2xl bg-[#E5A93C] hover:bg-[#d4962b] text-[#181513] font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <Lock className="w-5 h-5 text-[#181513]" />
                    <span>Cadastre-se ou Entre para Confirmar a Reserva</span>
                  </button>
                )}

              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
