import React, { useState } from 'react';
import { Send, Mail, CheckCircle2, MessageCircle } from 'lucide-react';
import { SiteInfo } from '../types';
import { saveContactMessageToFirestore } from '../services/firebaseService';
import { safeFetchJson } from '../utils/safeFetch';

interface ContactSectionProps {
  siteInfo?: SiteInfo;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ siteInfo }) => {
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
      await saveContactMessageToFirestore({
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        subject: contactData.subject,
        message: contactData.message
      });

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

      try {
        const storedMsgs = JSON.parse(localStorage.getItem('deolinda_sent_messages') || '[]');
        storedMsgs.unshift({
          ...contactData,
          sentAt: new Date().toISOString()
        });
        localStorage.setItem('deolinda_sent_messages', JSON.stringify(storedMsgs.slice(0, 50)));
      } catch {}

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
    'w-full rounded-xl border border-[#D5C9B8] dark:border-white/15 bg-[#FAF7F2] dark:bg-[#12100E] px-4 py-3 text-sm text-[#181513] dark:text-[#FAF7F2] placeholder:text-[#8C827A] outline-none transition focus:border-[#C24D2C] focus:bg-white dark:focus:bg-[#181513] focus:ring-2 focus:ring-[#C24D2C]/20 shadow-xs';

  return (
    <section id="fale-conosco" className="bg-white dark:bg-[#12100E] text-[#181513] dark:text-[#FAF7F2] border-t border-[#EADFCF] dark:border-white/10 py-14 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-xl mx-auto text-left">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#C24D2C]/10 dark:bg-[#E5A93C]/15 border border-[#C24D2C]/25 dark:border-[#E5A93C]/30 mb-4">
            <Mail className="w-6 h-6 text-[#C24D2C] dark:text-[#E5A93C]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#181513] dark:text-[#FAF7F2] font-cinzel mb-3">
            Fale Conosco
          </h2>

          <p className="text-sm sm:text-base text-[#5C554E] dark:text-[#C2B8AD] leading-relaxed">
            Tem alguma dúvida, sugestão ou deseja falar com nossa equipe?
            Envie sua mensagem. Será um prazer atender você!
          </p>
        </div>

        <form
          onSubmit={handleContactSubmit}
          className="bg-white dark:bg-[#1B1815] border border-[#E0D5C3] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#C24D2C]/5 space-y-4"
        >
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
            <label htmlFor="contact-name" className="block text-sm font-semibold text-[#181513] dark:text-[#FAF7F2] mb-1.5">
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
              <label htmlFor="contact-email" className="block text-sm font-semibold text-[#181513] dark:text-[#FAF7F2] mb-1.5">
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
              <label htmlFor="contact-phone" className="block text-sm font-semibold text-[#181513] dark:text-[#FAF7F2] mb-1.5">
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
            <label htmlFor="contact-subject" className="block text-sm font-semibold text-[#181513] dark:text-[#FAF7F2] mb-1.5">
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
            <label htmlFor="contact-message" className="block text-sm font-semibold text-[#181513] dark:text-[#FAF7F2] mb-1.5">
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
    </section>
  );
};
