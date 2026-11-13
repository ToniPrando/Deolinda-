import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  UtensilsCrossed, 
  X, 
  Wine
} from 'lucide-react';
import { MenuItem, CategoryType, CartItem, CustomerUser, MenuCategory, SiteInfo } from '../types';
import { MENU_ITEMS, DEFAULT_MENU_CATEGORIES } from '../data/menuData';
import { compressImageElementToDataUrl } from '../utils/imageCompressor';
import { migrateCachedMenuImageToFirestore } from '../services/firebaseService';

interface MenuSectionProps {
  menuItems?: MenuItem[];
  menuCategories?: MenuCategory[];
  onAddToCart: (item: CartItem) => void;
  currentUser: CustomerUser | null;
  onRequireLogin: () => void;
  siteInfo?: SiteInfo;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ 
  menuItems,
  menuCategories,
  siteInfo
}) => {
  // Prioriza sempre "Todo o Cardápio" ('all') toda vez que o site for iniciado/reiniciado
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState<boolean>(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  // Modal State for Item Photo & Details
  const [viewingItem, setViewingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingItem(null);
        setIsCategoryMenuOpen(false);
      }
    };
    if (viewingItem || isCategoryMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    if (viewingItem) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [viewingItem, isCategoryMenuOpen]);

  const categories: { id: CategoryType | 'all'; label: string; icon: string }[] = useMemo(() => {
    const list = menuCategories && menuCategories.length > 0 ? menuCategories : DEFAULT_MENU_CATEGORIES;
    return [
      { id: 'all', label: 'Todo o Cardápio', icon: '🍽️' },
      ...list.map(c => ({
        id: c.id,
        label: c.label,
        icon: c.icon || '🍕'
      }))
    ];
  }, [menuCategories]);

  const currentItems = menuItems || MENU_ITEMS;

  const filteredItems = useMemo(() => {
    return currentItems.filter((item) => {
      const itemCat = String(item.category || '').trim().toLowerCase();
      const filterCat = String(selectedCategory).trim().toLowerCase();
      const matchCategory = selectedCategory === 'all' || itemCat === filterCat;
      const matchQuery = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchCategory && matchQuery;
    });
  }, [currentItems, selectedCategory, searchQuery]);

  const activeCategoryOption = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory) || categories[0];
  }, [categories, selectedCategory]);

  const handleSelectCategory = (catId: CategoryType | 'all') => {
    setSelectedCategory(catId);
    setIsCategoryMenuOpen(false);
    
    // On mobile, ensure content is displayed starting from the menu title
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const cardapioSection = document.getElementById('cardapio');
      if (cardapioSection) {
        const titleEl = cardapioSection.querySelector('h2') || cardapioSection;
        const headerEl = document.querySelector('header');
        const headerHeight = headerEl ? Math.min(headerEl.offsetHeight, 72) : 64;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = titleEl.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const targetScroll = Math.max(0, elementPosition - headerHeight - 10);

        if (window.scrollY > targetScroll + 30) {
          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  const openItemDetails = (item: MenuItem) => {
    setViewingItem(item);
  };

  const getCategoryLabel = (catId: string) => {
    const found = categories.find(c => c.id === catId);
    if (found) return found.label;
    switch (catId) {
      case 'tradizionali': return 'Pizzas Tradicionais';
      case 'speciali': return 'Pizzas Especiais';
      case 'dolci': return 'Sobremesas';
      case 'bevande': return 'Bebidas';
      default: return 'Cardápio';
    }
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <section id="cardapio" className="pt-3 sm:pt-4 pb-12 bg-white text-[#181513] scroll-mt-16 sm:scroll-mt-18">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title - Compacto para priorizar visualização da grade */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-3 sm:mb-4"
        >
          <h2 className="font-serif-italian text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#181513] leading-tight">
            A Tradição Napolitana no seu Paladar
          </h2>
        </motion.div>

        {/* Search and Single Category Dropdown Box - Centralizado na largura das 2 colunas */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-30 max-w-6xl mx-auto bg-white p-3 sm:p-4 rounded-2xl border border-[#E0D5C3] shadow-xs mb-6 sm:mb-8"
        >
          <div className="flex flex-row gap-2.5 sm:gap-3 items-center justify-between">
            {/* Único Quadro de Opções do Cardápio (à esquerda, metade do tamanho, sem ícones) */}
            <div ref={categoryMenuRef} className="relative w-36 sm:w-44 shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isCategoryMenuOpen}
                aria-label={`Opções do cardápio: ${activeCategoryOption.label}`}
                className={`w-full px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isCategoryMenuOpen || selectedCategory !== 'all'
                    ? 'bg-[#E5E7EB] border-[#D1D5DB] text-[#181513] shadow-2xs'
                    : 'bg-[#FAF7F2] hover:bg-[#E5E7EB] border-[#E0D5C3] text-[#181513]'
                }`}
              >
                <span className="block text-xs sm:text-sm font-bold text-[#181513] truncate">
                  {activeCategoryOption.label}
                </span>
              </button>

              {isCategoryMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Categorias do cardápio"
                  className="absolute left-0 top-full mt-1.5 min-w-[180px] sm:min-w-[200px] z-50 bg-white rounded-xl shadow-xl border border-[#E0D5C3] p-1 flex flex-col gap-0.5"
                >
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-left cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#E5E7EB] text-[#181513]'
                            : 'text-[#181513] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Input (à direita) */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
              <input
                type="text"
                placeholder="Buscar por pizza ou ingrediente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-500 selection:bg-cyan-400 selection:text-slate-950 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Product Cards Grid - Duas Colunas Centralizadas */}
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-12 text-center border border-[#E0D5C3] max-w-md mx-auto my-12"
          >
            <UtensilsCrossed className="w-12 h-12 text-[#C24D2C] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif-italian text-xl font-bold text-[#181513] mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-sm text-[#5C554E] mb-4">
              Não encontramos nenhum prato com os filtros selecionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-full bg-[#C24D2C] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Limpar Filtros
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`${selectedCategory}-${searchQuery ? 'search' : 'all'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-2 auto-rows-fr gap-5 sm:gap-6 max-w-6xl mx-auto"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  delay: Math.min((index % 4) * 0.05, 0.2)
                }}
                className="bg-white rounded-2xl overflow-hidden border border-[#E0D5C3] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-row items-stretch group will-change-transform hover:-translate-y-0.5 h-[196px] sm:h-[220px]"
              >
                {/* Esquerda: Informações do Item + Preço e Botão WhatsApp abaixo do texto */}
                <div className="p-3.5 sm:p-5 flex flex-col flex-1 min-w-0 justify-between gap-2 overflow-hidden">
                  <div className="min-w-0">
                    {item.italianName && (
                      <p className="text-[10px] sm:text-[11px] font-cinzel font-semibold uppercase tracking-wider text-[#C24D2C] mb-0.5 truncate">
                        {item.italianName}
                      </p>
                    )}

                    <h3 
                      onClick={() => openItemDetails(item)}
                      className="font-serif-italian text-base sm:text-lg font-bold text-[#181513] mb-1 group-hover:text-[#C24D2C] transition-colors leading-snug line-clamp-2 cursor-pointer"
                      title="Clique para ver foto e detalhes"
                    >
                      {item.name}
                    </h3>

                    <p 
                      onClick={() => openItemDetails(item)}
                      className="text-xs sm:text-sm text-[#5C554E] leading-relaxed line-clamp-2 sm:line-clamp-3 cursor-pointer"
                      title="Clique para ver foto e detalhes"
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Abaixo do texto: Preço e Botão WhatsApp */}
                  <div className="pt-2.5 border-t border-[#F0EAE1] flex items-center justify-start gap-3 flex-wrap shrink-0">
                    <span className="font-extrabold text-sm sm:text-base text-[#C24D2C] font-serif-italian tabular-nums whitespace-nowrap">
                      {formatBRL(item.price)}
                    </span>

                    <a
                      href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(`Olá Deolinda Pizzaria! Gostaria de pedir: *${item.name}* (${formatBRL(item.price)}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Pedir ${item.name} no WhatsApp`}
                      aria-label={`Pedir ${item.name} no WhatsApp`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs hover:shadow text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0 transition-all hover:scale-105 active:scale-95 group/wa cursor-pointer whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current transition-transform group-hover/wa:scale-110" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <span>Pedir</span>
                    </a>
                  </div>
                </div>

                {/* Direita: Foto do Item (sem valor sobreposto) */}
                <div 
                  onClick={() => openItemDetails(item)}
                  className="relative w-32 sm:w-44 lg:w-48 h-full shrink-0 overflow-hidden bg-[#181513] cursor-pointer"
                  title="Clique para ver foto e detalhes"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onLoad={(e) => {
                      if (
                        item.image &&
                        item.image.startsWith('/menu_images/') &&
                        e.currentTarget.complete &&
                        e.currentTarget.naturalWidth > 0
                      ) {
                        const portable = compressImageElementToDataUrl(e.currentTarget, 420000);
                        if (portable) {
                          migrateCachedMenuImageToFirestore(item, portable).catch(() => {});
                        }
                      }
                    }}
                    onError={(e) => {
                      const fallback = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80';
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

      </div>

      {/* Modal: Apenas Foto do Item, Nome do Prato, Descrição e Valor */}
      {viewingItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setViewingItem(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E0D5C3] animate-in zoom-in-95 duration-200 relative my-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagem do Item em Destaque */}
            <div className="relative h-64 sm:h-72 w-full bg-[#181513] overflow-hidden">
              <img
                src={viewingItem.image}
                alt={viewingItem.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const fallback = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80';
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Botão Fechar (X) */}
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg z-10 hover:scale-105 active:scale-95"
                title="Fechar"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Tag da Categoria */}
              <div className="absolute top-3.5 left-4 flex items-center gap-1.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/75 text-[#E5A93C] border border-[#E5A93C]/30 backdrop-blur-md shadow-sm">
                  {getCategoryLabel(viewingItem.category)}
                </span>
                {viewingItem.tags && viewingItem.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white backdrop-blur-md">
                    {tag}
                  </span>
                ))}
              </div>

            </div>

            {/* Informações: Nome do Prato, Descrição e Detalhes */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                {viewingItem.italianName && (
                  <p className="text-xs font-cinzel font-semibold uppercase tracking-widest text-[#C24D2C] mb-1">
                    {viewingItem.italianName}
                  </p>
                )}
                <h3 className="font-serif-italian text-2xl sm:text-3xl font-bold text-[#181513] leading-tight">
                  {viewingItem.name}
                </h3>
              </div>

              {/* Descrição do Prato */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] mb-1.5">
                  Descrição
                </h4>
                <p className="text-sm sm:text-base text-[#5C554E] leading-relaxed">
                  {viewingItem.description}
                </p>
              </div>

              {/* Ingredientes Principais (se houver) */}
              {viewingItem.ingredients && viewingItem.ingredients.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] mb-1.5">
                    Ingredientes Principais
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingItem.ingredients.map((ing, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#181513] text-xs font-medium border border-[#EADFCF]"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Harmonização do Sommelier (se houver) */}
              {viewingItem.pairing && (
                <div className="p-3 rounded-2xl bg-[#F7F4EE] border border-[#E8DEC8] flex items-center gap-2.5 text-xs text-[#1B382B]">
                  <Wine className="w-4 h-4 text-[#C24D2C] shrink-0" />
                  <span><strong>Harmonização do Sommelier:</strong> {viewingItem.pairing}</span>
                </div>
              )}
            </div>

            {/* Rodapé do Modal com Botão Fechar e Valor ao lado do WhatsApp */}
            <div className="p-4 sm:p-5 bg-[#FAF7F2] border-t border-[#E0D5C3] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-[#5C554E] hover:text-[#181513] border border-[#E0D5C3] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              >
                Fechar
              </button>

              <div className="flex items-center gap-3">
                <span className="font-extrabold text-base sm:text-lg text-[#C24D2C] font-serif-italian tabular-nums whitespace-nowrap">
                  {formatBRL(viewingItem.price)}
                </span>

                <a
                  href={"https://wa.me/" + (siteInfo?.whatsappNumber || "5511915331853") + "?text=" + encodeURIComponent("Olá Deolinda Pizzaria! Gostaria de pedir: *" + viewingItem.name + "* (" + formatBRL(viewingItem.price) + ").")}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={"Pedir " + viewingItem.name + " no WhatsApp"}
                  className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 whitespace-nowrap shrink-0"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>Pedir no WhatsApp</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}


    </section>
  );
};
