import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Users,
  Sparkles,
  CheckCircle2,
  QrCode,
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reservation, CustomerUser, SiteInfo } from '../types';
import { saveReservationToFirestore } from '../services/firebaseService';

interface ReservationSectionProps {
  onReservationCreated: (res: Reservation) => void;
  currentUser: CustomerUser | null;
  onOpenAuth: () => void;
  siteInfo?: SiteInfo;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({
  onReservationCreated,
  currentUser,
  siteInfo
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
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

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
      badge: 'Mais Desejado'
    },
    {
      name: 'Salão Principal das Artes',
      desc: 'Ambiente climatizado e decorado com tijolos aparentes e fotos históricas de Nápoles.',
      badge: 'Clássico'
    },
    {
      name: 'Varanda Rústica Romântica',
      desc: 'Ambiente íntimo à meia-luz, perfeito para casais e datas especiais.',
      badge: 'Romântico'
    },
    {
      name: 'Balcão do Mestre Pizzaiolo',
      desc: 'Assista de perto à abertura da massa e à queima no forno a 430°C.',
      badge: 'Experiência'
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
    'Aniversário',
    'Jantar Romântico / Casal',
    'Reunião de Família',
    'Encontro com Amigos',
    'Negócios / Confraternização'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = (name || currentUser?.name || '').trim();
    const cleanPhone = (phone || currentUser?.phone || '').trim();

    if (!cleanName || !cleanPhone) {
      setErrorMessage('Por favor, informe seu nome completo e WhatsApp para confirmar a reserva.');
      return;
    }

    setIsSubmitting(true);

    const newRes: Reservation = {
      id: `RES-${Math.floor(100 + Math.random() * 900)}`,
      name: cleanName,
      phone: cleanPhone,
      email: (email || currentUser?.email || '').trim() || 'cliente@deolinda.com',
      date,
      time,
      guests,
      area,
      occasion,
      notes: notes.trim(),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    try {
      await saveReservationToFirestore(newRes);
    } catch (fsErr) {
      console.warn('Firestore reservation save:', fsErr);
    }

    try {
      await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRes)
      });
    } catch {
      // fallback to local/Firestore state
    }

    onReservationCreated(newRes);
    setConfirmedReservation(newRes);
    setIsSubmitting(false);

    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const getFormattedDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const generateWhatsAppLink = () => {
    if (!confirmedReservation) return '#';
    const whatsappDigits = (siteInfo?.whatsappNumber || '5511915331853').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá Deolinda Pizzaria! Acabei de fazer a reserva #${confirmedReservation.id} para ${confirmedReservation.name}, no dia ${confirmedReservation.date} às ${confirmedReservation.time} (${confirmedReservation.guests} pessoas no ${confirmedReservation.area}). Gostaria de confirmar!`
    );
    return `https://wa.me/${whatsappDigits}?text=${text}`;
  };

  const inputClasses =
    'w-full rounded-xl border border-[#D5C9B8] bg-[#FAF7F2] px-4 py-3 text-sm text-[#181513] placeholder:text-[#8C827A] outline-none transition focus:border-[#C24D2C] focus:bg-white focus:ring-2 focus:ring-[#C24D2C]/20 shadow-xs';

  return (
    <section id="reservas" className="py-12 sm:py-16 bg-white text-[#181513] border-t border-[#EADFCF] scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#C24D2C]/10 border border-[#C24D2C]/25 mb-4">
            <CalendarDays className="w-6 h-6 text-[#C24D2C]" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#181513] font-cinzel mb-3">
            Reservas
          </h2>
          <p className="text-[#5C554E] text-sm sm:text-base leading-relaxed">
            Garanta sua mesa na {siteInfo?.restaurantName || 'Deolinda Pizzaria Napoletana'} e desfrute de uma noite autêntica ao redor do forno a lenha.
          </p>
        </div>

        {confirmedReservation ? (
          <div className="max-w-2xl mx-auto bg-white text-[#181513] rounded-3xl overflow-hidden shadow-xl border border-[#E0D5C3]">
            <div className="bg-[#1B382B] text-white p-6 sm:p-8 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5A93C] text-[#181513] font-bold text-xs uppercase tracking-wider mb-3">
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

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EADFCF]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5C554E]">Data</span>
                  <p className="text-xs sm:text-sm font-bold text-[#181513]">
                    {getFormattedDate(confirmedReservation.date)}
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

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C3]">
                <div className="w-24 h-24 bg-[#181513] text-white rounded-2xl flex flex-col items-center justify-center p-3 shadow-inner shrink-0 text-center">
                  <QrCode className="w-10 h-10 text-[#E5A93C] mb-1" />
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
                    {siteInfo?.restaurantName || 'Deolinda Pizzaria Napoletana'} • {siteInfo?.address || 'Rua Santa Cruz, 232'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={generateWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar no WhatsApp da Pizzaria</span>
                </a>

                <button
                  type="button"
                  onClick={() => setConfirmedReservation(null)}
                  className="px-6 py-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EADFCF] text-[#181513] border border-[#E0D5C3] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Fazer Outra Reserva
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E0D5C3] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#C24D2C]/5 space-y-7"
          >
            {/* Ambiente Desejado */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#C24D2C] mb-3">
                1. Selecione o Ambiente Desejado
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {seatingAreas.map((seat) => (
                  <button
                    type="button"
                    key={seat.name}
                    onClick={() => setArea(seat.name)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      area === seat.name
                        ? 'bg-[#FAF7F2] border-[#C24D2C] ring-2 ring-[#C24D2C]/20 shadow-sm'
                        : 'bg-white border-[#E0D5C3] hover:bg-[#FAF7F2]/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm text-[#181513]">{seat.name}</h4>
                      <span className="text-[11px] font-semibold text-[#C24D2C] shrink-0">
                        {seat.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C554E] leading-relaxed">{seat.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Data, Pessoas e Ocasião */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="reservation-date" className="block text-xs font-bold uppercase tracking-wider text-[#181513] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C24D2C]" />
                  <span>Data</span>
                </label>
                <input
                  id="reservation-date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="reservation-guests" className="block text-xs font-bold uppercase tracking-wider text-[#181513] mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#C24D2C]" />
                  <span>Número de Pessoas</span>
                </label>
                <select
                  id="reservation-guests"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className={inputClasses}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Pessoa (Individual)' : num === 2 ? 'Pessoas (Casal / Dupla)' : 'Pessoas'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reservation-occasion" className="block text-xs font-bold uppercase tracking-wider text-[#181513] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C24D2C]" />
                  <span>Ocasião</span>
                </label>
                <select
                  id="reservation-occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className={inputClasses}
                >
                  {occasions.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Horário */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#181513] mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C24D2C]" />
                <span>Escolha o Horário</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      time === slot
                        ? 'bg-[#C24D2C] text-white border-[#C24D2C] shadow-sm'
                        : 'bg-[#FAF7F2] border-[#E0D5C3] text-[#4A423B] hover:border-[#C24D2C]/50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Dados de Contato */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="reservation-name" className="block text-sm font-semibold text-[#181513] mb-1.5">
                  Nome Completo *
                </label>
                <input
                  id="reservation-name"
                  type="text"
                  required
                  placeholder="Digite seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="reservation-phone" className="block text-sm font-semibold text-[#181513] mb-1.5">
                  WhatsApp *
                </label>
                <input
                  id="reservation-phone"
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="reservation-email" className="block text-sm font-semibold text-[#181513] mb-1.5">
                  E-mail
                </label>
                <input
                  id="reservation-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label htmlFor="reservation-notes" className="block text-sm font-semibold text-[#181513] mb-1.5">
                Observações Especiais
              </label>
              <textarea
                id="reservation-notes"
                rows={3}
                placeholder="Ex: cadeirão de bebê, preferência de mesa, aniversário ou restrições alimentares..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputClasses} resize-y`}
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C24D2C] hover:bg-[#A83D22] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 transition-all duration-300 shadow-lg shadow-[#C24D2C]/20 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirmando Reserva...' : 'Confirmar Reserva de Mesa'}</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
