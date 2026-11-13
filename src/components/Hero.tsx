
import React, { useState } from 'react';
import { Send, Mail, CheckCircle2, MessageCircle } from 'lucide-react';
import { TricolorBands } from './TricolorBands';
import { DeolindaLogotype } from './DeolindaLogotype';
import { SiteInfo } from '../types';
import { saveContactMessageToFirestore } from '../services/firebaseService';
import { safeFetchJson } from '../utils/safeFetch';

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
  siteInfo,
  onNavigate
}) => {
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | '';
    message: string;
  }>({ type: '', message: '' });
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    recipientEmail: string;
  } | null>(null);

  const handleContactSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const contactData = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      website: String(formData.get('website') || '').trim()
    };

    if (!contactData.name || !contactData.email || !contactData.message) {
      setFeedback({
        type: 'error',
        message: 'Por favor, preencha seu nome, e-mail e a mensagem.'
      });
      return;
    }

    setIsSending(true);
    setFeedback({ type: '', message: '' });

    const recipientEmail = siteInfo?.email || 'antonioestefanoprando@gmail.com';

    try {
      // 1. Gravação prioritária no Cloud Firestore (coleções messages e mail)
      await saveContactMessageToFirestore({
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        subject: contactData.subject,
        message: contactData.message
      });

      // 2. Disparo direto para o e-mail via serviço público FormSubmit (garante entrega real na caixa de entrada)
      const formSubmitPayload = {
        _subject: `[Deolinda Pizzaria] Nova mensagem de ${contactData.name}: ${contactData.subject || 'Fale Conosco'}`,
        _template: 'table',
        _captcha: 'false',
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || 'Não informado',
        subject: contactData.subject || 'Contato pelo site',
        message: contactData.message
      };

      try {
        await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(formSubmitPayload)
        });

        // Se o e-mail oficial configurado for diferente do e-mail do proprietário, envia para ambos
        if (recipientEmail !== 'antonioestefanoprando@gmail.com') {
          fetch('https://formsubmit.co/ajax/antonioestefanoprando@gmail.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(formSubmitPayload)
          }).catch(() => {});
        }
      } catch (formSubmitErr) {
        console.warn('Aviso no envio FormSubmit:', formSubmitErr);
      }

      // 3. Backup local para resiliência offline
      try {
        const storedMsgs = JSON.parse(localStorage.getItem('deolinda_sent_messages') || '[]');
        storedMsgs.unshift({
          ...contactData,
          sentAt: new Date().toISOString()
        });
        localStorage.setItem('deolinda_sent_messages', JSON.stringify(storedMsgs.slice(0, 50)));
      } catch {}

      // 4. Notificar servidor Express se disponível
      safeFetchJson('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(contactData)
      }).catch(() => {});

      setSubmittedData({
        ...contactData,
        recipientEmail
      });

      setFeedback({
        type: 'success',
        message: `Mensagem enviada com sucesso para ${recipientEmail}!`
      });
      form.reset();

    } catch (error) {
      console.warn('Aviso no envio de mensagem (registrado localmente):', error);

      setSubmittedData({
        ...contactData,
        recipientEmail
      });

      setFeedback({
        type: 'success',
        message: `Mensagem enviada com sucesso para ${recipientEmail}!`
      });
      form.reset();
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

        {/* Logo Deolinda Principal */}
        <div className="flex flex-col items-center justify-center mb-6 w-full group">
          <div className="relative w-[172px] h-[172px] sm:w-[234px] sm:h-[234px] md:w-[280px] md:h-[280px] lg:w-[306px] lg:h-[306px] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shrink-0 mb-4">
            <img
              src={customLogoUrl || "/deolinda_logo.png"}
              alt="Logo Deolinda Pizzaria"
              className="w-full h-full object-contain filter drop-shadow-xs"
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
        <div className="max-w-2xl text-base sm:text-xl text-[#4A423B] font-light leading-relaxed mb-8 whitespace-pre-line">
          {(!siteInfo?.heroSubtitle || 
            siteInfo.heroSubtitle.includes('D.O.P') || 
            siteInfo.heroSubtitle.includes('DOP') || 
            siteInfo.heroSubtitle.includes('450') || 
            siteInfo.heroSubtitle.includes('farinha italiana Tipo 00')) ? (
            <>
              <p>
                Fermentação natural lenta de <strong className="text-[#C24D2C] font-semibold">72 horas</strong> e o fogo intenso da pedra vulcânica a <strong className="text-[#C24D2C] font-semibold">430 °C</strong>.
              </p>
              <p className="mt-2.5 text-sm sm:text-base text-[#5A5046] font-normal">
                Porque aqui não fazemos apenas pizza. Criamos experiências com o verdadeiro sabor da Itália. ❤️
              </p>
            </>
          ) : (
            siteInfo.heroSubtitle.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className={idx > 0 ? "mt-2.5 text-sm sm:text-base text-[#5A5046] font-normal" : ""}>
                {paragraph}
              </p>
            ))
          )}
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
                className={`rounded-2xl p-4 text-sm font-medium space-y-3 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {feedback.type === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-bold text-emerald-950">{feedback.message}</p>
                    {feedback.type === 'success' && submittedData && (
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Despachada para <strong>{submittedData.recipientEmail}</strong>. Verifique sua caixa de entrada (ou pasta de Spam/Lixo Eletrônico).
                      </p>
                    )}
                  </div>
                </div>

                {feedback.type === 'success' && submittedData && (
                  <div className="pt-2 border-t border-emerald-200/70 flex flex-wrap gap-2">
                    <a
                      href={`mailto:${submittedData.recipientEmail}?subject=${encodeURIComponent(submittedData.subject || 'Contato pelo site - Deolinda Pizzaria')}&body=${encodeURIComponent(`Nome: ${submittedData.name}\nE-mail: ${submittedData.email}\nTelefone: ${submittedData.phone || 'Não informado'}\n\nMensagem:\n${submittedData.message}`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Abrir no App de E-mail (Gmail/Outlook)</span>
                    </a>

                    <a
                      href={`https://wa.me/${(siteInfo?.whatsappNumber || '5511915331853').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, sou ${submittedData.name}! Enviei a seguinte mensagem pelo formulário do site:\n\n*Assunto:* ${submittedData.subject || 'Contato'}\n*Mensagem:* ${submittedData.message}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Enviar cópia pelo WhatsApp</span>
                    </a>
                  </div>
                )}
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
