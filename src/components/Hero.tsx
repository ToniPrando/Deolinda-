
import React, { useState } from 'react';
import { Flame, Clock, Send, Mail } from 'lucide-react';
import { TricolorBands } from './TricolorBands';
import { DeolindaLogotype } from './DeolindaLogotype';
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
    'w-full rounded-xl border border-[#D5C9B8] bg-[#FAF7F2] px-4 py-3 text-sm text-[#181513] placeholder:text-[#8C827A] outline-none transition focus:border-[#C24D2C] focus:bg-white focus:ring-2 focus:ring-[#C24D2C]/20 shadow-xs';

  return (
    <section className="relative flex flex-col items-center justify-start overflow-hidden bg-white text-[#181513] pt-6 sm:pt-8 pb-16 sm:pb-20">

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-6 text-center flex flex-col items-center">

        {/* Logo Deolinda - Reduzido em 25% para proporção ideal e limpo */}
        <div className="flex flex-col items-center justify-center mb-6 w-full group">
          <div className="w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-[315px] lg:h-[315px] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shrink-0 mb-4">
            <img
              src={customLogoUrl || "/deolinda_logo.png"}
              alt="Logo Deolinda Pizzaria"
              className="w-full h-full object-contain filter drop-shadow-md"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Imagem / Letreiro Vetorizado abaixo do logo */}
          <div className="flex flex-col items-center justify-center w-full max-w-md sm:max-w-lg mb-4 px-4">
            {customEmblemUrl && isEmblemEnabled !== false ? (
              <img
                src={customEmblemUrl}
                alt="Emblema Deolinda Pizzaria"
                className="h-20 sm:h-28 md:h-36 w-auto max-w-full object-contain filter drop-shadow-xs hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <DeolindaLogotype
                variant="original"
                className="h-10 sm:h-12 md:h-14 w-auto max-w-[280px] sm:max-w-[340px] drop-shadow-xs hover:scale-105 transition-transform duration-300"
              />
            )}
          </div>

          {/* Identidade italiana vetorizada */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-0.5">
            <TricolorBands direction="left" theme="light" className="w-10 sm:w-20 md:w-28" />

            <span className="text-xs sm:text-base md:text-lg tracking-[0.25em] sm:tracking-[0.4em] uppercase font-bold text-[#181513] font-cinzel drop-shadow-xs whitespace-nowrap">
              {siteInfo?.heroSubBadge || 'Pizzaria Napoletana'}
            </span>

            <TricolorBands direction="right" theme="light" className="w-10 sm:w-20 md:w-28" />
          </div>
        </div>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-xl text-[#4A423B] font-light leading-relaxed mb-8">
          {siteInfo?.heroSubtitle || (
            <>
              Fermentação natural lenta de <strong className="text-[#C24D2C] font-semibold">72 horas</strong>, farinha italiana Tipo 00, ingredientes artesanais selecionados e o fogo vivo da pedra vulcânica a <strong className="text-[#C24D2C] font-semibold">430°C</strong>.
            </>
          )}
        </p>

        {/* Artisan Highlights Bar */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto border-t border-[#E5DAC8] pt-8 text-center sm:text-left">

          <div className="bg-white rounded-2xl p-4 border border-[#E0D5C3] shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
            <div className="p-2.5 rounded-xl bg-[#C24D2C]/10 text-[#C24D2C] shrink-0">
              <Clock className="w-5 h-5" />
            </div>

            <div className="flex flex-col items-center sm:items-start">
              <p className="text-xs uppercase font-bold text-[#C24D2C] tracking-wider">Fermentação</p>
              <p className="text-sm font-bold text-[#181513]">
                {siteInfo?.heroFermentationHighlight || '72 Horas Lenta'}
              </p>
              <p className="text-[11px] text-[#6B6158]">
                {siteInfo?.heroFermentationSubtext || 'Leve e digestiva'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E0D5C3] shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
            <div className="p-2.5 rounded-xl bg-[#C24D2C]/10 text-[#C24D2C] shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex flex-col items-center sm:items-start">
              <p className="text-xs uppercase font-bold text-[#C24D2C] tracking-wider">Forno a Lenha</p>
              <p className="text-sm font-bold text-[#181513]">
                {siteInfo?.heroOvenHighlight || '430°C em 90s'}
              </p>
              <p className="text-[11px] text-[#6B6158]">
                {siteInfo?.heroOvenSubtext || 'Pedra vulcânica'}
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="w-full max-w-xl mx-auto mt-12 sm:mt-16 text-left">

          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#C24D2C]/10 border border-[#C24D2C]/25 mb-4">
              <Mail className="w-6 h-6 text-[#C24D2C]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#181513] font-cinzel mb-3">
              Fale Conosco
            </h2>

            <p className="text-sm sm:text-base text-[#5C554E] leading-relaxed">
              Tem alguma dúvida, sugestão ou deseja falar com nossa equipe?
              Envie sua mensagem. Será um prazer atender você!
            </p>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="bg-white border border-[#E0D5C3] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#C24D2C]/5 space-y-4"
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
              <label htmlFor="contact-name" className="block text-sm font-semibold text-[#181513] mb-1.5">
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
                <label htmlFor="contact-email" className="block text-sm font-semibold text-[#181513] mb-1.5">
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
                <label htmlFor="contact-phone" className="block text-sm font-semibold text-[#181513] mb-1.5">
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
              <label htmlFor="contact-subject" className="block text-sm font-semibold text-[#181513] mb-1.5">
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
              <label htmlFor="contact-message" className="block text-sm font-semibold text-[#181513] mb-1.5">
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
                className={`rounded-xl p-3 text-sm font-medium ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C24D2C] hover:bg-[#A83D22] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 transition-all duration-300 shadow-lg shadow-[#C24D2C]/20 active:scale-98 cursor-pointer"
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

            <p className="text-center text-[11px] text-[#8C827A]">
              Os campos marcados com * são obrigatórios.
            </p>

          </form>
        </div>

      </div>
    </section>
  );
};
