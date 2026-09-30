import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Flame, 
  Wine, 
  Clock, 
  CalendarDays, 
  Bot, 
  User, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Ciao! Benvenuto alla Deolinda Pizzaria Napoletana. 🇮🇹 Sou o Mastro Deolinda, seu concierge gastronômico. Posso tirar dúvidas sobre nossa massa de 48h de fermentação, harmonizações de vinhos ou ajudar no seu pedido!',
      timestamp: 'Agora'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4).map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text }))
        })
      });

      const data = await response.json();
      const botReply = data.reply || 'Grazie! Como posso ajudar você a saborear a melhor pizza napolitana hoje?';

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Nossa massa napolitana de 48h é maturada lentamente e assada a 450°C no forno a lenha! Para reservas e pedidos personalizados, você também pode nos chamar no WhatsApp.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: '🌾 Como funciona a fermentação 48h?', prompt: 'Como funciona a fermentação de 48 horas e por que a massa é tão leve e digestível?' },
    { label: '🍷 Qual vinho harmoniza com a Margherita?', prompt: 'Qual vinho italiano vocês recomendam para harmonizar com a Margherita D.O.P.?' },
    { label: '🍕 Recomende a melhor pizza da casa', prompt: 'Qual é a pizza especial mais famosa e recomendada da Deolinda?' },
    { label: '🌱 Opções vegetarianas no cardápio', prompt: 'Quais opções vegetarianas vocês oferecem?' }
  ];

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-4 rounded-full bg-gradient-to-br from-[#C24D2C] to-[#8C2A12] text-white shadow-2xl hover:scale-105 transition-all flex items-center justify-center border-2 border-[#E5A93C] cursor-pointer group"
            aria-label="Abrir Suporte & Concierge Deolinda"
          >
            <Bot className="w-6 h-6 text-[#FAF7F2] group-hover:rotate-12 transition-transform" />
            
            {hasUnread && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#E5A93C] text-[#181513] font-bold text-[9px] rounded-full flex items-center justify-center animate-ping" />
            )}

            <div className="hidden sm:block absolute right-full mr-3 bg-[#181513] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              Dúvidas ou Dicas? Fale com Mastro Deolinda 🇮🇹
            </div>
          </button>
        )}
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 max-h-[580px] h-[85vh] bg-white rounded-3xl shadow-2xl border border-[#E0D5C3] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          
          {/* Chat Header */}
          <div className="bg-[#181513] text-white p-4 flex items-center justify-between border-b border-[#C24D2C]/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C24D2C] flex items-center justify-center text-white border border-[#E5A93C]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-italian font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Mastro Deolinda</span>
                  <span className="text-[9px] bg-[#E5A93C] text-[#181513] px-1.5 py-0.2 rounded font-black">
                    IA Sommelier
                  </span>
                </h3>
                <p className="text-[10px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Atendimento Gastronômico 24/7
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F2]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[#C24D2C] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                    🍕
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#C24D2C] text-white rounded-br-none'
                      : 'bg-white text-[#181513] border border-[#EADFCF] rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[9px] block text-right mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-[#8C827A]'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-[#8C827A] bg-white p-2.5 rounded-2xl border border-[#EADFCF] w-36">
                <span className="w-2 h-2 rounded-full bg-[#C24D2C] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#C24D2C] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#C24D2C] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px]">Consultando...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-2 bg-[#F4EFE6] border-t border-[#E0D5C3] overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#EADFCF] text-[10px] font-semibold text-[#5C554E] hover:bg-[#FAF7F2] transition-colors shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-[#E0D5C3] flex items-center gap-2">
            <input
              type="text"
              placeholder="Pergunte sobre vinhos, massas, pedidos..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 py-2 px-3 bg-[#FAF7F2] rounded-xl border border-[#E0D5C3] text-xs focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* WhatsApp Direct Link Shortcut */}
          <div className="bg-[#181513] text-[#FAF7F2] p-2 text-center text-[10px] flex items-center justify-center gap-2">
            <span>Deseja atendimento humano?</span>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] font-bold hover:underline flex items-center gap-1"
            >
              Abrir WhatsApp <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      )}
    </>
  );
};
