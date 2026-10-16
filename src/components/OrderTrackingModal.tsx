import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  X, 
  Bike, 
  Store, 
  UtensilsCrossed, 
  Send, 
  Sparkles, 
  ChefHat, 
  Pizza, 
  Minimize2, 
  Maximize2, 
  Check 
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderCompleted?: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  order,
  onClose,
  onOrderCompleted
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString('pt-BR'));
  const [previousStatus, setPreviousStatus] = useState<OrderStatus | null>(order ? order.status : null);
  const [statusChangedAlert, setStatusChangedAlert] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (order) {
      setCurrentOrder(order);
      setPreviousStatus(order.status);
    }
  }, [order]);

  // Live polling for this order from backend /api/orders/:id
  useEffect(() => {
    if (!isOpen || !currentOrder?.id) return;

    const fetchLiveOrder = async () => {
      try {
        setIsLiveSyncing(true);
        const res = await fetch(`/api/orders/${currentOrder.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.order) {
            const updated: Order = data.order;
            
            // Check if status changed by admin
            if (previousStatus && updated.status !== previousStatus) {
              setPreviousStatus(updated.status);
              const statusTitles: Record<OrderStatus, string> = {
                received: 'Pedido Confirmado',
                preparing: 'Massa em Preparo',
                baking: 'No Forno a Lenha a 450°C! 🔥',
                out_for_delivery: updated.type === 'delivery' ? 'Saiu para Entrega!' : updated.type === 'table' ? 'Pronto para Servir na Mesa!' : 'Pronto para Retirada no Balcão!',
                completed: 'Pedido Concluído! Buon Appetito!',
                cancelled: 'Pedido Cancelado'
              };
              setStatusChangedAlert(`O status do seu pedido mudou para: "${statusTitles[updated.status]}"!`);
              setTimeout(() => setStatusChangedAlert(null), 6000);

              // When order is marked as completed or cancelled by the admin, dismiss the popup
              if (updated.status === 'completed' || updated.status === 'cancelled') {
                setTimeout(() => {
                  if (onOrderCompleted) {
                    onOrderCompleted();
                  } else {
                    onClose();
                  }
                }, 1800);
              }
            }

            // If incoming status is already completed/cancelled
            if (updated.status === 'completed' || updated.status === 'cancelled') {
              if (onOrderCompleted) {
                onOrderCompleted();
              }
            }

            setCurrentOrder(updated);
            setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
          }
        }
      } catch {
        // Fallback to local
      } finally {
        setIsLiveSyncing(false);
      }
    };

    fetchLiveOrder();
    const interval = setInterval(fetchLiveOrder, 2000);
    return () => clearInterval(interval);
  }, [isOpen, currentOrder?.id, previousStatus, onOrderCompleted, onClose]);

  if (!isOpen || !currentOrder) return null;

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Status mapping and stage detection
  const stages: {
    key: OrderStatus;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
  }[] = [
    {
      key: 'received',
      title: 'Pedido Recebido',
      subtitle: 'Confirmado na cozinha e enviado para a bancada',
      icon: ChefHat,
      color: '#2563eb'
    },
    {
      key: 'preparing',
      title: 'Em Preparo (Massa 72h)',
      subtitle: 'Abrindo o disco à mão com molho San Marzano e búfala',
      icon: Pizza,
      color: '#d97706'
    },
    {
      key: 'baking',
      title: 'No Forno a Lenha (450°C) 🔥',
      subtitle: 'Assando em pedra vulcânica em 90s para cornicione perfeito',
      icon: Flame,
      color: '#ea580c'
    },
    {
      key: 'out_for_delivery',
      title: currentOrder.type === 'delivery' ? 'A Caminho / Rota' : currentOrder.type === 'table' ? 'Pronto / Indo para a Mesa' : 'Pronto no Balcão',
      subtitle: currentOrder.type === 'delivery' ? 'Embalagem térmica lacrada e azeite EVOO finalizado' : 'Finalizado no salão',
      icon: currentOrder.type === 'delivery' ? Bike : currentOrder.type === 'table' ? UtensilsCrossed : Store,
      color: '#7c3aed'
    },
    {
      key: 'completed',
      title: 'Concluído / Buon Appetito!',
      subtitle: 'Pedido entregue com maestria napoletana',
      icon: CheckCircle2,
      color: '#16a34a'
    }
  ];

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 0;
      case 'preparing': return 1;
      case 'baking': return 2;
      case 'out_for_delivery': return 3;
      case 'completed': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(currentOrder.status);

  const generateWhatsAppTrackingLink = () => {
    let text = `Olá Deolinda Pizzaria Napoletana! Gostaria de acompanhar meu pedido *#${currentOrder.id}* em nome de *${currentOrder.customerName}* (Total: ${formatBRL(currentOrder.total)}).`;
    return `https://wa.me/5511999999999?text=${encodeURIComponent(text)}`;
  };

  // Minimized floating bubble
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
        <div 
          onClick={() => setIsMinimized(false)}
          className="bg-[#181513] text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border-2 border-[#C24D2C] flex items-center gap-3 cursor-pointer hover:scale-105 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#C24D2C] flex items-center justify-center text-white relative">
            <Flame className="w-6 h-6 text-[#E5A93C] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#181513] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-[#E5A93C]">#{currentOrder.id}</span>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                {currentOrder.status === 'received' && 'Recebido'}
                {currentOrder.status === 'preparing' && 'Em Massa'}
                {currentOrder.status === 'baking' && 'No Forno 450°C 🔥'}
                {currentOrder.status === 'out_for_delivery' && 'Pronto / Rota'}
                {currentOrder.status === 'completed' && 'Concluído ✓'}
              </span>
            </div>
            <p className="text-[11px] text-white/80 font-medium group-hover:text-white">
              Clique para expandir acompanhamento ao vivo
            </p>
          </div>
          <Maximize2 className="w-4 h-4 text-white/60 group-hover:text-white ml-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-[#E0D5C3] my-4 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#181513] text-white p-5 sm:p-6 border-b border-[#C24D2C]/40 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C24D2C] to-[#8C2710] flex items-center justify-center text-white shadow-lg border border-[#E5A93C]/40">
                <Flame className="w-7 h-7 text-[#E5A93C] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif-italian text-xl sm:text-2xl font-bold text-white">
                    Acompanhamento do Pedido
                  </h3>
                  <span className="font-mono bg-[#C24D2C] text-[#FAF7F2] px-2.5 py-0.5 rounded-full text-xs font-black">
                    #{currentOrder.id}
                  </span>
                </div>
                <p className="text-xs text-white/70 flex items-center gap-2 mt-0.5">
                  <span>Cliente: <strong className="text-white">{currentOrder.customerName}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Sincronizado ao Vivo ({lastUpdated})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimizar janela para flutuante"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Fechar janela"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status Changed Toast Banner */}
          {statusChangedAlert && (
            <div className="mt-4 p-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg animate-bounce-short border border-emerald-400/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E5A93C] shrink-0" />
                <span>{statusChangedAlert}</span>
              </div>
              <button onClick={() => setStatusChangedAlert(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          
          {/* Main Dynamic Status Spotlight Card */}
          <div className={`p-5 sm:p-6 rounded-3xl border text-white shadow-md relative overflow-hidden transition-all duration-500 ${
            currentOrder.status === 'baking'
              ? 'bg-gradient-to-br from-[#8C2710] via-[#C24D2C] to-[#E5A93C]/90 border-orange-400'
              : currentOrder.status === 'preparing'
              ? 'bg-gradient-to-br from-[#1B382B] via-[#2A523F] to-[#3B6E57] border-emerald-400/50'
              : currentOrder.status === 'out_for_delivery'
              ? 'bg-gradient-to-br from-[#3B2854] via-[#5B3E84] to-[#7B53B3] border-purple-400'
              : currentOrder.status === 'completed'
              ? 'bg-gradient-to-br from-[#1B382B] via-[#165B33] to-[#1FB359] border-emerald-300'
              : currentOrder.status === 'cancelled'
              ? 'bg-gradient-to-br from-[#5C1B1B] via-[#7B2424] to-[#A03030] border-red-400'
              : 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] border-blue-400'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-white/80 bg-black/30 px-3 py-1 rounded-full inline-block border border-white/20">
                  Status Atual da Cozinha
                </span>
                <h4 className="font-serif-italian text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
                  {currentOrder.status === 'received' && '1. Pedido Confirmado!'}
                  {currentOrder.status === 'preparing' && '2. Abrindo a Massa Napolitana...'}
                  {currentOrder.status === 'baking' && '3. No Forno a Lenha (450°C) 🔥'}
                  {currentOrder.status === 'out_for_delivery' && (currentOrder.type === 'delivery' ? '4. Saiu para Entrega! 🛵' : currentOrder.type === 'table' ? '4. Pronto para a Mesa! 🍽️' : '4. Pronto para Retirada! 🛍️')}
                  {currentOrder.status === 'completed' && '5. Entregue! Buon Appetito! 🍕'}
                  {currentOrder.status === 'cancelled' && 'Pedido Cancelado'}
                </h4>
                <p className="text-xs sm:text-sm text-white/90 max-w-md">
                  {currentOrder.status === 'received' && 'Seu pedido foi registrado em nosso banco de dados interno e já está na bancada do pizzaiolo.'}
                  {currentOrder.status === 'preparing' && 'Massa de fermentação 72h sendo aberta manualmente e recheada com ingredientes D.O.P.'}
                  {currentOrder.status === 'baking' && 'A pizza está dentro da cúpula de pedra vulcânica a 450°C, assando em menos de 90 segundos!'}
                  {currentOrder.status === 'out_for_delivery' && (currentOrder.type === 'delivery' ? 'O entregador já está com a caixa térmica lacrada a caminho do seu endereço.' : currentOrder.type === 'table' ? 'O garçom está levando sua pizza fumegante para a sua mesa.' : 'Seu pedido está quentinho te esperando no balcão.')}
                  {currentOrder.status === 'completed' && 'Esperamos que você tenha uma autêntica experiência gastronômica de Nápoles!'}
                  {currentOrder.status === 'cancelled' && 'Este pedido foi cancelado no sistema da pizzaria.'}
                </p>
              </div>

              {/* Big Status Icon Animation */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                {currentOrder.status === 'baking' ? (
                  <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-[#E5A93C] animate-pulse" />
                ) : currentOrder.status === 'preparing' ? (
                  <Pizza className="w-10 h-10 sm:w-12 sm:h-12 text-[#E5A93C] animate-spin-slow" />
                ) : currentOrder.status === 'out_for_delivery' ? (
                  <Bike className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
                ) : currentOrder.status === 'completed' ? (
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                ) : (
                  <ChefHat className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                )}
              </div>
            </div>

            {/* Live Estimation Bar */}
            <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E5A93C]" />
                <span>Previsão de Entrega/Preparo: <strong>~{currentOrder.estimatedMinutes || 25} minutos</strong></span>
              </div>
              <div className="text-[11px] text-white/80 bg-black/20 px-3 py-1 rounded-xl">
                Tipo: <strong className="text-white capitalize">{currentOrder.type === 'delivery' ? 'Delivery' : currentOrder.type === 'table' ? `${currentOrder.tableNumber || 'Mesa'}` : 'Retirada no Balcão'}</strong>
              </div>
            </div>
          </div>

          {/* Interactive Step-by-Step Timeline (Updates Live with Admin Actions) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E0D5C3] shadow-sm space-y-4">
            <h5 className="font-serif-italian font-bold text-base text-[#181513] flex items-center justify-between">
              <span>Etapas do Preparo Napolitano</span>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#C24D2C]">
                Atualizado pelo Administrador
              </span>
            </h5>

            <div className="space-y-4 relative">
              {stages.map((st, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;
                const isPending = currentStageIndex < idx;
                const IconComponent = st.icon;

                return (
                  <div 
                    key={st.key}
                    className={`flex items-start gap-4 p-3.5 rounded-2xl transition-all ${
                      isCurrent 
                        ? 'bg-[#FAF7F2] border-2 border-[#C24D2C] shadow-sm ring-4 ring-[#C24D2C]/10 scale-[1.01]' 
                        : isPassed 
                        ? 'bg-emerald-50/50 border border-emerald-200 opacity-90' 
                        : 'bg-gray-50/60 border border-gray-200/60 opacity-60'
                    }`}
                  >
                    {/* Stage Number / Icon circle */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-[#C24D2C] text-white shadow-md'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isPassed ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <IconComponent className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-bold text-xs sm:text-sm ${
                          isCurrent ? 'text-[#C24D2C]' : isPassed ? 'text-emerald-900' : 'text-gray-500'
                        }`}>
                          {st.title}
                        </p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-[#C24D2C] text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                            Em Andamento
                          </span>
                        )}
                        {isPassed && (
                          <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5C554E] mt-0.5 leading-snug">
                        {st.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details & Items Card */}
          <div className="bg-white p-5 rounded-3xl border border-[#E0D5C3] shadow-sm space-y-4">
            <h5 className="font-serif-italian font-bold text-base text-[#181513] pb-2 border-b border-[#F0EAE1]">
              Resumo dos Itens do Pedido
            </h5>

            <div className="space-y-3 divide-y divide-[#F0EAE1]">
              {currentOrder.items.map((item, itIdx) => (
                <div key={itIdx} className="pt-2.5 first:pt-0 text-xs">
                  <div className="flex justify-between font-bold text-[#181513]">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-[#C24D2C] font-extrabold">{formatBRL(item.price)}</span>
                  </div>
                  {item.crust && (
                    <p className="text-[11px] text-[#C24D2C] font-semibold mt-0.5">
                      Borda: {item.crust}
                    </p>
                  )}
                  {item.extras && item.extras.length > 0 && (
                    <p className="text-[10px] text-[#5C554E]">
                      Extras: {item.extras.join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-amber-800 italic bg-amber-50 p-1.5 rounded-lg mt-1 border border-amber-200">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Financial summary & details */}
            <div className="pt-3 border-t border-[#E0D5C3] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#5C554E]">
                <span>Forma de Pagamento:</span>
                <span className="font-bold text-[#181513]">{currentOrder.paymentMethod || 'Pix'}</span>
              </div>
              {currentOrder.address && (
                <div className="flex justify-between text-[#5C554E]">
                  <span className="shrink-0">Endereço de Entrega:</span>
                  <span className="font-bold text-[#181513] text-right line-clamp-2 max-w-xs">{currentOrder.address}</span>
                </div>
              )}
              {currentOrder.tableNumber && (
                <div className="flex justify-between text-[#5C554E]">
                  <span>Local:</span>
                  <span className="font-bold text-emerald-800">{currentOrder.tableNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-[#181513] pt-2 border-t border-[#F0EAE1]">
                <span>Total Pago:</span>
                <span className="text-[#C24D2C]">{formatBRL(currentOrder.total)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#E0D5C3] flex flex-wrap items-center justify-between gap-3">
          <a
            href={generateWhatsAppTrackingLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Falar com a Pizzaria no WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#181513] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
          >
            Continuar Navegando
          </button>
        </div>

      </div>
    </div>
  );
};
