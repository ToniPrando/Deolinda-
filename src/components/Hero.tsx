
import React, { useState } from 'react';
import { Flame, Clock, Send, Mail } from 'lucide-react';
import { TricolorBands } from './TricolorBands';
import { SiteInfo } from '../types';

interface HeroProps {
  onOpenMenu?: () => void;
  onOpenReservation?: () => void;
  onOpenConcierge?: () => void;
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
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | '';
    message: string;
  }>({ type: '', message: '' });

  const handleContactSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const contactData = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      subject: String(formData.get('subject') || ''),
      message: String(formData.get('message') || ''),
      website: String(formData.get('website') || '')
    };

    setIsSending(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Não foi possível enviar sua mensagem.'
        );
      }

      setFeedback({
        type: 'success',
        message: 'Mensagem enviada com sucesso! Em breve entraremos em contato.'
      });

      form.reset();

    } catch (error) {
      console.error('Erro ao enviar formulário:', error);

      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro. Tente novamente mais tarde.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const inputClasses =
    'w-full rounded-lg border border-white/15 bg-[#211C18] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#E5A93C] focus:ring-1 focus:ring-[#E5A93C]';

  return (
    <section className="relative flex flex-col items-center justify-start overflow-hidden bg-[#14110F] text-white pt-2 sm:pt-4 pb-12 sm:pb-16">

      {/* Background with Dark Atmospheric Image & Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2000&q=80')`
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#14110F] via-[#14110F]/80 to-[#14110F]/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C24D2C]/20 via-transparent to-transparent pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 sm:pt-2 pb-6 text-center flex flex-col items-center">

        {/* Logo Deolinda */}
        <div className="flex flex-col items-center justify-center mb-6 w-full group">
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#181513] flex items-center justify-center shadow-2xl shadow-[#C24D2C]/60 border-2 sm:border-4 border-[#E5A93C] transform group-hover:scale-105 transition-transform duration-300 overflow-hidden p-1 shrink-0 mb-3">
            <img
              src={customLogoUrl || "/deolinda_logo.png"}
              alt="Logo Deolinda Pizzaria"
              className="w-full h-full object-contain filter drop-shadow-md"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Emblema */}
          {customEmblemUrl && isEmblemEnabled !== false && (
            <div className="flex items-center justify-center mb-3 max-w-xs sm:max-w-md px-4">
              <img
                src={customEmblemUrl}
                alt="Emblema Deolinda Pizzaria"
                className="h-14 sm:h-20 md:h-24 lg:h-28 w-auto max-w-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)] hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Identidade italiana */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-1">
            <TricolorBands direction="left" theme="dark" className="w-10 sm:w-20 md:w-28" />

            <span className="text-xs sm:text-base md:text-lg tracking-[0.25em] sm:tracking-[0.4em] uppercase font-bold text-[#FAF7F2] font-cinzel drop-shadow-md whitespace-nowrap">
              {siteInfo?.heroSubBadge || 'Pizzaria Napoletana'}
            </span>

            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-[#FAF7F2] bg-[#C24D2C] px-2.5 py-0.5 rounded-full border border-white/30 shadow-md whitespace-nowrap">
              D.O.P.
            </span>

            <TricolorBands direction="right" theme="dark" className="w-10 sm:w-20 md:w-28" />
          </div>
        </div>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-xl text-[#FAF7F2]/85 font-light leading-relaxed mb-8">
          {siteInfo?.heroSubtitle || (
            <>
              Fermentação natural lenta de <strong className="text-[#E5A93C] font-semibold">72 horas</strong>, farinha italiana Tipo 00, ingredientes certificados <strong className="text-[#E5A93C] font-semibold">D.O.P.</strong> e o fogo vivo da pedra vulcânica a <strong className="text-[#E5A93C] font-semibold">450°C</strong>.
            </>
          )}
        </p>

        {/* Artisan Highlights Bar */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto border-t border-white/10 pt-8 text-center sm:text-left">

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2.5 sm:gap-3">
            <div className="p-2 rounded-lg bg-[#C24D2C]/30 text-[#E5A93C] shrink-0">
              <Clock className="w-5 h-5" />
            </div>

            <div className="flex flex-col items-center sm:items-start">
              <p className="text-xs uppercase font-bold text-[#E5A93C] tracking-wider">Fermentação</p>
              <p className="text-sm font-semibold text-white">
                {siteInfo?.heroFermentationHighlight || '72 Horas Lenta'}
              </p>
              <p className="text-[11px] text-white/60">
                {siteInfo?.heroFermentationSubtext || 'Leve e digestiva'}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2.5 sm:gap-3">
            <div className="p-2 rounded-lg bg-[#C24D2C]/30 text-[#C24D2C] shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex flex-col items-center sm:items-start">
              <p className="text-xs uppercase font-bold text-[#E5A93C] tracking-wider">Forno a Lenha</p>
              <p className="text-sm font-semibold text-white">
                {siteInfo?.heroOvenHighlight || '450°C em 90s'}
              </p>
              <p className="text-[11px] text-white/60">
                {siteInfo?.heroOvenSubtext || 'Pedra vulcânica'}
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="w-full max-w-xl mx-auto mt-12 sm:mt-16 text-left">

          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#C24D2C]/20 border border-[#E5A93C]/30 mb-4">
              <Mail className="w-6 h-6 text-[#E5A93C]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#E5A93C] font-cinzel mb-3">
              Fale Conosco
            </h2>

            <p className="text-sm sm:text-base text-white/65 leading-relaxed">
              Tem alguma dúvida, sugestão ou deseja falar com nossa equipe?
              Envie sua mensagem. Será um prazer atender você!
            </p>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4"
          >

            {/* Campo anti-spam invisível */}
            <div className="absolute opacity-0 -z-10 pointer-events-none" aria-hidden="true">
              <label htmlFor="contact-website">Não preencha este campo</label>
              <input
                id="contact-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="contact-name" className="block text-sm font-semibold text-white/85 mb-2">
                Nome completo *
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Digite seu nome"
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-email" className="block text-sm font-semibold text-white/85 mb-2">
                  E-mail *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-sm font-semibold text-white/85 mb-2">
                  Telefone
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-sm font-semibold text-white/85 mb-2">
                Assunto
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                maxLength={120}
                placeholder="Sobre o que deseja falar?"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-sm font-semibold text-white/85 mb-2">
                Sua mensagem *
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                minLength={5}
                maxLength={5000}
                rows={5}
                placeholder="Escreva sua mensagem aqui..."
                className={`${inputClasses} resize-y`}
              />
            </div>

            {feedback.message && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-lg p-3 text-sm ${
                  feedback.type === 'success'
                    ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#C24D2C] hover:bg-[#A83D22] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 transition-all duration-300 shadow-lg shadow-[#C24D2C]/20"
            >
              {isSending ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando mensagem...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar mensagem
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-white/40">
              Os campos marcados com * são obrigatórios.
            </p>

          </form>
        </div>

      </div>
    </section>
  );
};
