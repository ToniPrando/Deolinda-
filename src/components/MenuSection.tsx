import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  Wine, 
  Plus, 
  Flame, 
  UtensilsCrossed, 
  Filter, 
  Check, 
  X, 
  ShoppingBag,
  Info,
  Lock,
  LogIn,
  Star
} from 'lucide-react';
import { MenuItem, CategoryType, CartItem, CustomerUser, MenuCategory } from '../types';
import { MENU_ITEMS, CRUST_OPTIONS, EXTRA_TOPPINGS, DEFAULT_MENU_CATEGORIES } from '../data/menuData';
import { TricolorBands } from './TricolorBands';

interface MenuSectionProps {
  menuItems?: MenuItem[];
  menuCategories?: MenuCategory[];
  onAddToCart: (item: CartItem) => void;
  currentUser: CustomerUser | null;
  onRequireLogin: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ 
  menuItems,
  menuCategories,
  onAddToCart,
  currentUser,
  onRequireLogin
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    <section id="cardapio" className="py-12 sm:py-16 bg-[#F4EFE6] text-[#1E1B18] scroll-mt-20">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Floating Notification */}
        {addedNotice && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1B382B] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#2D5F49] animate-in slide-in-from-bottom-5">
            <ShoppingBag className="w-5 h-5 text-[#E5A93C]" />
            <span className="font-semibold text-sm">{addedNotice}</span>
          </div>
        )}

        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C24D2C]/10 text-[#C24D2C] text-xs font-bold uppercase tracking-widest mb-3">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Cardápio Autêntico Italiano</span>
          </div>
          <h2 className="font-serif-italian text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#181513] mb-4">
            A Tradição Napolitana no seu Paladar
          </h2>
          <p className="text-[#5C554E] text-base sm:text-lg">
            Todas as nossas pizzas são individuais (30cm), com massa de 72h de fermentação, assadas a 450°C e cortadas ao estilo de Nápoles.
          </p>
        </motion.div>

        {/* Search and Tag Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E0D5C3] shadow-sm mb-10 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
              <input
                type="text"
                placeholder="Buscar por pizza, ingrediente ou vinho..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-[#8C827A] flex items-center gap-1.5 self-center">
              <span>🍕 {filteredItems.length} {filteredItems.length === 1 ? 'opção disponível' : 'opções disponíveis'}</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4 border-t border-[#F0EAE1] pt-3">
            <TricolorBands direction="left" theme="light" className="w-6 sm:w-12 md:w-20 shrink-0" size="sm" />
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none justify-start md:justify-center flex-1 sm:flex-initial">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#C24D2C] text-white shadow-md shadow-[#C24D2C]/30 scale-105'
                      : 'bg-[#FAF7F2] text-[#5C554E] hover:bg-[#EAE4D9] border border-[#E0D5C3]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            <TricolorBands direction="right" theme="light" className="w-6 sm:w-12 md:w-20 shrink-0" size="sm" />
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
            key={`${selectedCategory}-${searchQuery ? 'search' : 'all'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                  delay: Math.min((index % 3) * 0.08, 0.24)
                }}
                className="bg-white rounded-3xl overflow-hidden border border-[#E0D5C3] shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col group will-change-transform"
              >
                {/* Image & Badges */}
                <div className="relative h-56 overflow-hidden bg-[#181513]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Loyalty Points Earned Badge (Top Right) */}
                  <div className="absolute top-3 right-3 bg-[#181513]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#E5A93C]/40 text-[#E5A93C] font-mono font-black text-[10px] shadow flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#E5A93C]" />
                    <span>+{item.pointsEarned ?? Math.round(item.price)} pts</span>
                  </div>

                  {/* Price Tag (Bottom Right of Image) */}
                  <div className="absolute bottom-3 right-3 bg-[#181513]/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#E5A93C]/40 text-[#E5A93C] font-black text-base shadow-lg">
                    {formatBRL(item.price)}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    {item.italianName && (
                      <p className="text-[11px] font-cinzel font-semibold uppercase tracking-widest text-[#C24D2C] mb-1">
                        {item.italianName}
                      </p>
                    )}

                    <h3 className="font-serif-italian text-xl font-bold text-[#181513] mb-2 group-hover:text-[#C24D2C] transition-colors">
                      {item.name}
                    </h3>

                    <p className="text-xs text-[#5C554E] leading-relaxed mb-4 line-clamp-3">
                      {item.description}
                    </p>

                    {/* Ingredients Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.ingredients.map((ing, iIdx) => (
                        <span
                          key={iIdx}
                          className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#5C554E] text-[11px] border border-[#EADFCF]"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Pairing & Add Action */}
                  <div className="pt-4 border-t border-[#F0EAE1] space-y-3">
                    {item.pairing && (
                      <div className="flex items-start gap-1.5 text-[11px] text-[#1B382B] bg-[#1B382B]/5 p-2 rounded-lg">
                        <Wine className="w-3.5 h-3.5 text-[#C24D2C] shrink-0 mt-0.5" />
                        <span className="leading-tight">
                          <strong>Harmonização:</strong> {item.pairing}
                        </span>
                      </div>
                    )}

                    {currentUser && (
                      <button
                        onClick={() => openCustomizer(item)}
                        className="w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer bg-[#C24D2C] hover:bg-[#A63A1E] text-white"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {item.category === 'tradizionali' || item.category === 'speciali'
                            ? 'Personalizar & Pedir'
                            : 'Adicionar ao Pedido'}
                        </span>
                      </button>
                    )}
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

              <button
                onClick={handleConfirmAddToCart}
                className="px-6 py-3.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#C24D2C]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Confirmar & Adicionar</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
