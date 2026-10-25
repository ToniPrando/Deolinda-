import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  Flame, 
  UtensilsCrossed, 
  Filter, 
  Check, 
  X, 
  ShoppingBag,
  Info,
  Lock,
  Star,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { MenuItem, CategoryType, CartItem, CustomerUser, MenuCategory, SiteInfo } from '../types';
import { MENU_ITEMS, CRUST_OPTIONS, EXTRA_TOPPINGS, DEFAULT_MENU_CATEGORIES } from '../data/menuData';
import { TricolorBands } from './TricolorBands';

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
  onAddToCart,
  currentUser,
  onRequireLogin,
  siteInfo
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gridCols, setGridCols] = useState<3 | 4 | 5>(5);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState<boolean>(false);
  const gridMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gridMenuContainerRef = useRef<HTMLDivElement | null>(null);

  const handleGridMouseEnter = () => {
    if (gridMenuTimeoutRef.current) {
      clearTimeout(gridMenuTimeoutRef.current);
      gridMenuTimeoutRef.current = null;
    }
    setIsGridMenuOpen(true);
  };

  const handleGridMouseLeave = () => {
    if (gridMenuTimeoutRef.current) {
      clearTimeout(gridMenuTimeoutRef.current);
    }
    gridMenuTimeoutRef.current = setTimeout(() => {
      setIsGridMenuOpen(false);
    }, 280);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridMenuContainerRef.current && !gridMenuContainerRef.current.contains(e.target as Node)) {
        setIsGridMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (gridMenuTimeoutRef.current) clearTimeout(gridMenuTimeoutRef.current);
    };
  }, []);

  // Modal State for Pizza Customizer
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedCrust, setSelectedCrust] = useState<string>(CRUST_OPTIONS[0].name);
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

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
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchCategory && matchQuery;
    });
  }, [currentItems, selectedCategory, searchQuery]);

  const handleSelectCategory = (catId: CategoryType | 'all') => {
    setSelectedCategory(catId);
    
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

  const openCustomizer = (item: MenuItem) => {
    if (!currentUser) {
      setAddedNotice('Faça login ou cadastre-se para adicionar ao pedido.');
      setTimeout(() => setAddedNotice(null), 3500);
      onRequireLogin();
      return;
    }
    setCustomizingItem(item);
    setSelectedCrust(CRUST_OPTIONS[0].name);
    setSelectedExtras([]);
    setSpecialNotes('');
    setItemQuantity(1);
  };

  const handleToggleExtra = (extra: { name: string; price: number }) => {
    if (selectedExtras.some(e => e.name === extra.name)) {
      setSelectedExtras(selectedExtras.filter(e => e.name !== extra.name));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const calculateCustomizedPrice = () => {
    if (!customizingItem) return 0;
    const crustObj = CRUST_OPTIONS.find(c => c.name === selectedCrust);
    const crustPrice = crustObj ? crustObj.price : 0;
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    return (customizingItem.price + crustPrice + extrasTotal) * itemQuantity;
  };

  const buildCustomizedWhatsAppText = () => {
    if (!customizingItem) return '';
    const crustObj = CRUST_OPTIONS.find(c => c.name === selectedCrust);
    const crustPart = (customizingItem.category === 'tradizionali' || customizingItem.category === 'speciali') && selectedCrust
      ? ` - Borda: ${selectedCrust}${crustObj && crustObj.price > 0 ? ` (+${formatBRL(crustObj.price)})` : ''}`
      : '';
    const extrasPart = selectedExtras.length > 0
      ? ` - Adicionais: ${selectedExtras.map(e => `${e.name} (+${formatBRL(e.price)})`).join(', ')}`
      : '';
    const notesPart = specialNotes.trim() ? ` - Obs: ${specialNotes.trim()}` : '';
    const total = formatBRL(calculateCustomizedPrice());

    return `Olá Deolinda Pizzaria! Gostaria de pedir: *${itemQuantity}x ${customizingItem.name}* (${total})${crustPart}${extrasPart}${notesPart}.`;
  };

  const handleConfirmAddToCart = () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!customizingItem) return;

    const crustObj = CRUST_OPTIONS.find(c => c.name === selectedCrust);
    const crustPrice = crustObj ? crustObj.price : 0;
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const unitPrice = customizingItem.price + crustPrice + extrasTotal;

    const cartItem: CartItem = {
      id: `${customizingItem.id}-${Date.now()}`,
      menuItem: customizingItem,
      quantity: itemQuantity,
      crustOption: customizingItem.category.includes('pizze') || customizingItem.category === 'tradizionali' || customizingItem.category === 'speciali' 
        ? selectedCrust 
        : 'Padrão',
      extraIngredients: selectedExtras,
      specialNotes: specialNotes.trim() || undefined,
      itemTotalPrice: unitPrice * itemQuantity
    };

    onAddToCart(cartItem);

    setAddedNotice(`"${customizingItem.name}" adicionado ao pedido!`);
    setTimeout(() => setAddedNotice(null), 3500);
    setCustomizingItem(null);
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <section id="cardapio" className="pt-3 sm:pt-4 pb-12 bg-[#F4EFE6] text-[#1E1B18] scroll-mt-16 sm:scroll-mt-18">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Floating Notification */}
        {addedNotice && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1B382B] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#2D5F49] animate-in slide-in-from-bottom-5">
            <ShoppingBag className="w-5 h-5 text-[#E5A93C]" />
            <span className="font-semibold text-sm">{addedNotice}</span>
          </div>
        )}

        {/* Section Title - Compacto para priorizar visualização da grade */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-3 sm:mb-4"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#C24D2C]/10 text-[#C24D2C] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Cardápio Autêntico Napolitano</span>
          </div>
          <h2 className="font-serif-italian text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#181513] mb-1 leading-tight">
            A Tradição Napolitana no seu Paladar
          </h2>
          <p className="text-[#5C554E] text-xs sm:text-sm max-w-xl mx-auto line-clamp-1 sm:line-clamp-none">
            Pizzas individuais (30cm) com fermentação lenta de 72h, ingredientes D.O.P. e assadas a 450°C.
          </p>
        </motion.div>

        {/* Search and Tag Filters Bar - Design Compacto */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-[#E0D5C3] shadow-xs mb-3.5 sm:mb-4.5 space-y-2 sm:space-y-2.5"
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
              <input
                type="text"
                placeholder="Buscar por pizza ou ingrediente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 sm:py-2 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[11px] sm:text-xs font-semibold text-[#8C827A] flex items-center gap-1.5 self-end sm:self-center">
              <span>🍕 {filteredItems.length} {filteredItems.length === 1 ? 'opção' : 'opções'}</span>
            </div>
          </div>

          {/* Category Tabs & Grid View Control */}
          <div className="flex items-center justify-between gap-2 border-t border-[#F0EAE1] pt-2">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none flex-1 w-full lg:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-[#C24D2C] text-white shadow-xs scale-[1.02]'
                      : 'bg-[#FAF7F2] text-[#5C554E] hover:bg-[#EAE4D9] border border-[#E0D5C3]'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Grid Configuration Button with Hover Menu (Reduzido pela metade do tamanho) */}
            <div 
              ref={gridMenuContainerRef}
              className="hidden md:block relative shrink-0 self-center"
              onMouseEnter={handleGridMouseEnter}
              onMouseLeave={handleGridMouseLeave}
            >
              <button
                type="button"
                onClick={() => setIsGridMenuOpen(prev => !prev)}
                title={`Grade de exibição: ${gridCols} colunas por linha. Clique ou passe o mouse para alterar.`}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-[#FAF7F2] text-[#5C554E] hover:bg-[#EAE4D9] border border-[#E0D5C3] shadow-xs hover:border-[#C24D2C]/40 hover:text-[#181513]"
                aria-haspopup="true"
                aria-expanded={isGridMenuOpen}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#C24D2C]" />
                <span className="font-mono">{gridCols}x</span>
                <ChevronDown className={`w-3 h-3 text-[#8C827A] transition-transform duration-200 ${isGridMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Hover Dropdown Menu */}
              {isGridMenuOpen && (
                <div 
                  className="absolute right-0 top-full pt-1.5 z-50 min-w-[215px] animate-in fade-in zoom-in-95 duration-150"
                  onMouseEnter={handleGridMouseEnter}
                  onMouseLeave={handleGridMouseLeave}
                >
                  <div className="bg-white rounded-2xl shadow-xl border border-[#E0D5C3] p-1.5 backdrop-blur-md">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C827A] border-b border-[#F0EAE1] mb-1 flex items-center justify-between">
                      <span>Configurar Grade</span>
                      <span className="text-[#C24D2C] font-semibold">{gridCols} por linha</span>
                    </div>
                    {[
                      { cols: 5, label: '5 por linha', hint: 'Padrão recomendado' },
                      { cols: 4, label: '4 por linha', hint: 'Visual intermediário' },
                      { cols: 3, label: '3 por linha', hint: 'Cards maiores' },
                    ].map((option) => (
                      <button
                        key={option.cols}
                        type="button"
                        onClick={() => {
                          setGridCols(option.cols as 3 | 4 | 5);
                          setIsGridMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-3 text-left cursor-pointer ${
                          gridCols === option.cols
                            ? 'bg-[#C24D2C] text-white shadow-sm'
                            : 'text-[#5C554E] hover:bg-[#FAF7F2] hover:text-[#181513]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className={`text-[10px] font-normal ${gridCols === option.cols ? 'text-white/80' : 'text-[#8C827A]'}`}>
                            {option.hint}
                          </span>
                        </div>
                        {gridCols === option.cols && (
                          <Check className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Product Cards Grid with Smooth Scroll Fade-In & Stagger */}
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
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-full bg-[#C24D2C] text-white text-xs font-bold uppercase tracking-wider"
            >
              Limpar Filtros
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`${selectedCategory}-${searchQuery ? 'search' : 'all'}-${gridCols}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className={`grid ${
              gridCols === 3
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                : gridCols === 4
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4'
            }`}
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                  delay: Math.min((index % 5) * 0.05, 0.25)
                }}
                className="bg-white rounded-2xl overflow-hidden border border-[#E0D5C3] shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col group will-change-transform"
              >
                {/* Image & Badges */}
                <div 
                  onClick={() => openCustomizer(item)}
                  className="relative h-36 sm:h-40 md:h-42 overflow-hidden bg-[#181513] cursor-pointer"
                  title="Clique para ver detalhes e personalizar"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Price Tag (Bottom Right of Image) */}
                  <div className="absolute bottom-2 right-2 bg-[#181513]/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-[#E5A93C]/40 text-[#E5A93C] font-black text-xs sm:text-sm shadow-md">
                    {formatBRL(item.price)}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between">
                  <div>
                    {item.italianName && (
                      <p className="text-[9px] sm:text-[10px] font-cinzel font-semibold uppercase tracking-wider text-[#C24D2C] mb-0.5 truncate">
                        {item.italianName}
                      </p>
                    )}

                    <h3 
                      onClick={() => openCustomizer(item)}
                      className="font-serif-italian text-sm sm:text-base font-bold text-[#181513] mb-1 group-hover:text-[#C24D2C] transition-colors leading-snug line-clamp-2 cursor-pointer"
                      title="Clique para ver detalhes e personalizar"
                    >
                      {item.name}
                    </h3>

                    <p className="text-[11px] sm:text-xs text-[#5C554E] leading-relaxed mb-2 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Ingredients Pills */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.ingredients.slice(0, 3).map((ing, iIdx) => (
                        <span
                          key={iIdx}
                          className="px-1.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#5C554E] text-[10px] border border-[#EADFCF] whitespace-nowrap"
                        >
                          {ing}
                        </span>
                      ))}
                      {item.ingredients.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#8C827A] text-[10px] border border-[#EADFCF]">
                          +{item.ingredients.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Area: Botão WhatsApp compacto no canto direito */}
                  <div className="pt-2.5 border-t border-[#F0EAE1] flex items-center justify-end">
                    <a
                      href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(`Olá Deolinda Pizzaria! Gostaria de pedir: *${item.name}* (${formatBRL(item.price)}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Pedir ${item.name} no WhatsApp`}
                      aria-label={`Pedir ${item.name} no WhatsApp`}
                      className="w-8 h-8 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm hover:shadow flex items-center justify-center shrink-0 transition-transform hover:scale-110 active:scale-95 group/wa cursor-pointer"
                    >
                      <svg className="w-4.5 h-4.5 fill-current transition-transform group-hover/wa:scale-110" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

      </div>

      {/* Pizza Customizer Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E0D5C3] animate-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header with Image */}
            <div className="relative h-44 bg-[#181513]">
              <img
                src={customizingItem.image}
                alt={customizingItem.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <button
                onClick={() => setCustomizingItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="text-xs uppercase font-bold text-[#E5A93C] tracking-wider">
                  {customizingItem.category === 'tradizionali' || customizingItem.category === 'speciali' ? 'Personalizar Pizza' : 'Adicionar ao Pedido'}
                </span>
                <h3 className="font-serif-italian text-2xl font-bold">{customizingItem.name}</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* Crust Selection (for pizzas) */}
              {(customizingItem.category === 'tradizionali' || customizingItem.category === 'speciali') && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#181513] mb-2 flex items-center justify-between">
                    <span>1. Escolha a Borda (Cornicione)</span>
                    <span className="text-[#C24D2C] font-normal normal-case text-xs">Obrigatório</span>
                  </label>
                  <div className="space-y-2">
                    {CRUST_OPTIONS.map((crust) => (
                      <div
                        key={crust.id}
                        onClick={() => setSelectedCrust(crust.name)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                          selectedCrust === crust.name
                            ? 'bg-[#FAF7F2] border-[#C24D2C] ring-1 ring-[#C24D2C] font-semibold text-[#181513]'
                            : 'bg-white border-[#E0D5C3] text-[#5C554E] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedCrust === crust.name
                                ? 'border-[#C24D2C] bg-[#C24D2C] text-white'
                                : 'border-gray-400'
                            }`}
                          >
                            {selectedCrust === crust.name && <Check className="w-3 h-3" />}
                          </div>
                          <span>{crust.name}</span>
                        </div>
                        <span className="font-bold text-[#181513]">
                          {crust.price === 0 ? 'Incluso' : `+ ${formatBRL(crust.price)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Toppings */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#181513] mb-2">
                  2. Adicionais Especiais (Opcional)
                </label>
                <div className="space-y-2">
                  {EXTRA_TOPPINGS.map((extra, eIdx) => {
                    const isChecked = selectedExtras.some(e => e.name === extra.name);
                    return (
                      <div
                        key={eIdx}
                        onClick={() => handleToggleExtra(extra)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#FAF7F2] border-[#1B382B] ring-1 ring-[#1B382B] font-semibold text-[#181513]'
                            : 'bg-white border-[#E0D5C3] text-[#5C554E] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isChecked
                                ? 'border-[#1B382B] bg-[#1B382B] text-white'
                                : 'border-gray-400'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span>{extra.name}</span>
                        </div>
                        <span className="font-bold text-[#181513]">
                          + {formatBRL(extra.price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#181513] mb-1.5">
                  Observações para o Pizzaiolo
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: sem orégano, azeite à parte, massa bem tostada..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E0D5C3] text-xs focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#181513]">
                  Quantidade:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-[#E0D5C3] font-bold text-base flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-[#181513]">{itemQuantity}</span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-[#E0D5C3] font-bold text-base flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-[#FAF7F2] border-t border-[#E0D5C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-[#5C554E] uppercase font-bold">Total do Item</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-extrabold text-[#C24D2C]">
                    {formatBRL(calculateCustomizedPrice())}
                  </p>
                  <span className="text-[10px] font-extrabold text-[#8C5E0A] bg-[#E5A93C]/20 border border-[#E5A93C]/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#E5A93C]" />
                    +{customizingItem ? (customizingItem.pointsEarned ?? Math.round(customizingItem.price)) * itemQuantity : 0} pts
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <a
                  href={`https://wa.me/${siteInfo?.whatsappNumber || '5511915331853'}?text=${encodeURIComponent(buildCustomizedWhatsAppText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Pedir este item personalizado no WhatsApp"
                  className="flex-1 sm:flex-initial px-4 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>Pedir no WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleConfirmAddToCart}
                  className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#C24D2C]/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
