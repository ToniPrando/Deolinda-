import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  Layers,
  FolderOpen,
  Upload,
  Image as ImageIcon,
  ClipboardPaste,
  Trash2,
  Plus,
  Edit3,
  Search,
  Filter,
  Wine,
  Tag,
  UtensilsCrossed,
  Sparkles,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { MENU_ITEMS } from '../data/menuData';
import { MenuItem, CategoryType } from '../types';
import { saveEmblemToFirestore, saveLogoToFirestore, saveMenuItemsToFirestore } from '../services/firebaseService';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: any[];
  reservations?: any[];
  menuItems?: MenuItem[];
  onMenuItemsUpdated?: (items: MenuItem[]) => void;
  onUpdateOrderStatus?: (orderId: string, status: any) => void;
  onUpdateReservationStatus?: (resId: string, status: any) => void;
  onRefreshOrders?: () => Promise<void> | void;
  customLogoUrl?: string | null;
  customEmblemUrl?: string | null;
  isEmblemEnabled?: boolean;
  onOpenLogoModal?: (initialTab?: 'logo' | 'emblem') => void;
  onEmblemUpdated?: (newEmblemUrl: string | null, enabled?: boolean) => void;
  onLogoUpdated?: (newLogoUrl: string | null) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onRefreshOrders,
  menuItems,
  onMenuItemsUpdated,
  customLogoUrl,
  customEmblemUrl,
  isEmblemEnabled = true,
  onOpenLogoModal,
  onEmblemUpdated,
  onLogoUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'branding'>('menu');
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [, setLastSyncTime] = useState<string>('Agora');

  // ==========================================
  // MENU ITEMS STATE & CONTROLS
  // ==========================================
  const [currentMenuItems, setCurrentMenuItems] = useState<MenuItem[]>(() => {
    if (menuItems && menuItems.length > 0) return menuItems;
    try {
      const saved = localStorage.getItem('deolinda_custom_menu_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MENU_ITEMS;
  });

  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      setCurrentMenuItems(menuItems);
    }
  }, [menuItems]);

  const [isMaximized, setIsMaximized] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [menuNotice, setMenuNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper for real currency formatting (R$ 00,00)
  const formatPriceInput = (rawValue: string | number): string => {
    const digits = String(rawValue).replace(/\D/g, '');
    if (!digits) return 'R$ 0,00';
    const cents = parseInt(digits, 10);
    const value = cents / 100;
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parsePriceNumber = (formattedValue: string): number => {
    const digits = formattedValue.replace(/\D/g, '');
    if (!digits) return 0;
    return parseInt(digits, 10) / 100;
  };

  const getCategoryNameInPortuguese = (category: string) => {
    switch (category) {
      case 'tradizionali':
        return 'Pizzas Tradicionais';
      case 'speciali':
        return 'Pizzas Especiais';
      case 'antipasti':
        return 'Entradas & Aperitivos';
      case 'dolci':
        return 'Sobremesas';
      case 'bevande':
        return 'Bebidas & Vinhos';
      default:
        return category;
    }
  };

  // Item Editor Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    italianName: '',
    category: 'tradizionali' as CategoryType,
    price: 'R$ 0,00',
    description: '',
    ingredientsStr: '',
    pairing: '',
    image: '',
    isAvailable: true
  });
  const itemImageInputRef = useRef<HTMLInputElement>(null);

  // Quick Photo Suggestions
  const quickPhotoPresets = [
    { label: 'Pizza Margherita', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80' },
    { label: 'Pizza Especial', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
    { label: 'Burrata / Entrada', url: 'https://images.unsplash.com/photo-1592417817098-8f3d69102353?auto=format&fit=crop&w=800&q=80' },
    { label: 'Sobremesa / Dolci', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80' },
    { label: 'Vinho Italiano', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80' }
  ];

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemFormData({
      name: '',
      italianName: '',
      category: 'tradizionali',
      price: 'R$ 0,00',
      description: '',
      ingredientsStr: '',
      pairing: '',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
      isAvailable: true
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      italianName: item.italianName || '',
      category: item.category,
      price: formatPriceInput(Math.round(item.price * 100).toString()),
      description: item.description,
      ingredientsStr: item.ingredients.join(', '),
      pairing: item.pairing || '',
      image: item.image,
      isAvailable: item.isAvailable !== false
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim()) {
      alert('Por favor, informe o nome do prato.');
      return;
    }

    const parsedPrice = parsePriceNumber(itemFormData.price);
    if (parsedPrice <= 0) {
      alert('Por favor, informe um valor de preço válido (ex: R$ 78,00).');
      return;
    }

    const ingredientsList = itemFormData.ingredientsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const savedItem: MenuItem = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      name: itemFormData.name.trim(),
      italianName: itemFormData.italianName.trim() || undefined,
      category: itemFormData.category,
      price: parsedPrice,
      description: itemFormData.description.trim() || 'Prato artesanal preparado com ingredientes frescos e selecionados.',
      ingredients: ingredientsList.length > 0 ? ingredientsList : ['Ingredientes frescos da casa'],
      pairing: itemFormData.pairing.trim() || undefined,
      image: itemFormData.image.trim() || 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
      tags: [],
      isAvailable: itemFormData.isAvailable
    };

    let updatedList: MenuItem[];
    if (editingItem) {
      updatedList = currentMenuItems.map(it => it.id === editingItem.id ? savedItem : it);
      setMenuNotice({ type: 'success', text: `Item "${savedItem.name}" atualizado com sucesso no cardápio!` });
    } else {
      updatedList = [savedItem, ...currentMenuItems];
      setMenuNotice({ type: 'success', text: `Novo item "${savedItem.name}" adicionado com sucesso ao cardápio!` });
    }

    setCurrentMenuItems(updatedList);
    if (onMenuItemsUpdated) {
      onMenuItemsUpdated(updatedList);
    }
    await saveMenuItemsToFirestore(updatedList);
    setIsItemModalOpen(false);
    setEditingItem(null);
    setTimeout(() => setMenuNotice(null), 5000);
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o item "${name}" do cardápio?`)) {
      const updatedList = currentMenuItems.filter(it => it.id !== id);
      setCurrentMenuItems(updatedList);
      if (onMenuItemsUpdated) {
        onMenuItemsUpdated(updatedList);
      }
      await saveMenuItemsToFirestore(updatedList);
      setMenuNotice({ type: 'success', text: `Item "${name}" foi excluído do cardápio.` });
      setTimeout(() => setMenuNotice(null), 5000);
    }
  };

  const handleToggleItemAvailability = async (id: string) => {
    const updatedList = currentMenuItems.map(it => {
      if (it.id === id) {
        const nextState = it.isAvailable === false ? true : false;
        return { ...it, isAvailable: nextState };
      }
      return it;
    });
    setCurrentMenuItems(updatedList);
    if (onMenuItemsUpdated) {
      onMenuItemsUpdated(updatedList);
    }
    await saveMenuItemsToFirestore(updatedList);
  };

  // Filtered menu items for admin view
  const filteredAdminItems = currentMenuItems.filter((item) => {
    const matchCategory = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    const matchQuery = 
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.italianName && item.italianName.toLowerCase().includes(menuSearch.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase())) ||
      (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(menuSearch.toLowerCase())));
    return matchCategory && matchQuery;
  });

  // ==========================================
  // BRANDING EMBLEM TOOL STATE
  // ==========================================
  const [emblemPreview, setEmblemPreview] = useState<string | null>(customEmblemUrl || null);
  const [emblemBase64, setEmblemBase64] = useState<string | null>(null);
  const [emblemUrlInput, setEmblemUrlInput] = useState<string>('');
  const [emblemIsEnabled, setEmblemIsEnabled] = useState<boolean>(isEmblemEnabled !== false);
  const [isEmblemSaving, setIsEmblemSaving] = useState<boolean>(false);
  const [emblemNotice, setEmblemNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragEmblemActive, setDragEmblemActive] = useState<boolean>(false);
  const emblemFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmblemPreview(customEmblemUrl || null);
    setEmblemIsEnabled(isEmblemEnabled !== false);
  }, [customEmblemUrl, isEmblemEnabled]);

  const handleSaveEmblemDirect = async () => {
    const finalUrl = emblemUrlInput.trim() || emblemBase64 || emblemPreview;
    if (!finalUrl) {
      setEmblemNotice({ type: 'error', text: 'Selecione ou informe uma imagem antes de salvar.' });
      return;
    }
    setIsEmblemSaving(true);
    setEmblemNotice(null);
    try {
      await saveEmblemToFirestore(finalUrl, emblemIsEnabled);
      try {
        await fetch('/api/settings/emblem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emblemUrl: finalUrl, enabled: emblemIsEnabled })
        });
      } catch (e) {
        console.warn('Backend emblem save fallback error:', e);
      }
      if (onEmblemUpdated) {
        onEmblemUpdated(finalUrl, emblemIsEnabled);
      }
      setEmblemNotice({ type: 'success', text: 'Imagem anexa salva com sucesso! Exibida ao lado do logo do cabeçalho e embaixo do logo na página principal.' });
      setTimeout(() => setEmblemNotice(null), 5000);
    } catch (err: any) {
      setEmblemNotice({ type: 'error', text: 'Erro ao salvar imagem anexa na nuvem.' });
    } finally {
      setIsEmblemSaving(false);
    }
  };

  const handleRemoveEmblemDirect = async () => {
    setIsEmblemSaving(true);
    setEmblemNotice(null);
    try {
      await saveEmblemToFirestore(null, false);
      try {
        await fetch('/api/settings/emblem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emblemUrl: null, enabled: false })
        });
      } catch (e) {
        console.warn(e);
      }
      setEmblemPreview(null);
      setEmblemBase64(null);
      setEmblemUrlInput('');
      if (onEmblemUpdated) {
        onEmblemUpdated(null, false);
      }
      setEmblemNotice({ type: 'success', text: 'Imagem anexa removida com sucesso de todas as páginas!' });
      setTimeout(() => setEmblemNotice(null), 5000);
    } catch (err: any) {
      setEmblemNotice({ type: 'error', text: 'Erro ao remover imagem anexa.' });
    } finally {
      setIsEmblemSaving(false);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      if (onRefreshOrders) {
        await onRefreshOrders();
      }
      const now = new Date();
      setLastSyncTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => setIsManualSyncing(false), 500);
    }
  };

  if (!isOpen) return null;

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex items-center justify-center transition-all duration-200 ${
        isMaximized ? 'p-0' : 'p-2 sm:p-6'
      }`}
    >
      <div className={`bg-[#FAF7F2] shadow-2xl flex flex-col overflow-hidden border border-[#E0D5C3] transition-all duration-200 ${
        isMaximized 
          ? 'w-full h-full rounded-none border-none' 
          : 'rounded-3xl w-full max-w-6xl h-[92vh]'
      }`}>
        
        {/* Dashboard Top Header */}
        <div className="bg-[#181513] text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#C24D2C]/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C24D2C] flex items-center justify-center text-white shadow-lg shrink-0">
              <Flame className="w-6 h-6 text-[#E5A93C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-italian font-bold text-lg sm:text-xl text-white">
                  Controle de Cardápio e Identidade Visual
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Sincronizado ao Vivo
                </span>
              </div>
              <p className="text-xs text-white/70">
                Gerenciamento de pratos, preços, fotos e identidade visual
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Sync Status and Manual Refresh */}
            <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-xl text-[10px] font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Nuvem Firebase</span>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isManualSyncing}
                title="Sincronizar com a nuvem agora"
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#E5A93C] ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sincronizar</span>
              </button>
            </div>

            {onOpenLogoModal && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenLogoModal('logo')}
                  title="Personalizar logomarca oficial da Pizzaria"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C24D2C] to-[#E5A93C] hover:from-[#A63A1E] hover:to-[#D4982B] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer border border-amber-300/40"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-200" />
                  <span className="hidden sm:inline">Alterar Logo</span>
                  <span className="sm:hidden">Logo</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLogoModal('emblem')}
                  title="Ferramenta para colocar imagem ao lado e embaixo do logo"
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7F2] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer border border-white/20"
                >
                  <Layers className="w-3.5 h-3.5 text-[#E5A93C]" />
                  <span className="hidden md:inline">Imagem Anexa</span>
                </button>
              </div>
            )}

            {/* Maximize / Restore Screen Button */}
            <button
              type="button"
              onClick={() => setIsMaximized(prev => !prev)}
              title={isMaximized ? "Restaurar tamanho da janela" : "Maximizar tela"}
              className="p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer ml-1"
            >
              {isMaximized ? <Minimize2 className="w-5 h-5 text-[#E5A93C]" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer ml-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Dashboard Tabs Bar */}
        <div className="bg-white border-b border-[#E0D5C3] px-6 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'menu', label: `📝 Controle de Cardápio (${currentMenuItems.length})` },
            { id: 'branding', label: '🎨 Identidade & Logotipo' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#C24D2C] text-[#C24D2C]'
                  : 'border-transparent text-[#5C554E] hover:text-[#181513]'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ========================================== */}
        {/* Tab 1: Controle de Cardápio (Completo)     */}
        {/* ========================================== */}
        {activeTab === 'menu' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F4EFE6] space-y-4">
            
            {/* Notice Alert */}
            {menuNotice && (
              <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                menuNotice.type === 'success' 
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-900' 
                  : 'bg-rose-100 border border-rose-300 text-rose-900'
              }`}>
                {menuNotice.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{menuNotice.text}</span>
              </div>
            )}

            {/* Header Action Bar */}
            <div className="bg-white rounded-3xl p-5 border border-[#E0D5C3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-serif-italian text-xl font-bold text-[#181513]">
                  Gestão & Editor de Cardápio
                </h4>
                <p className="text-xs text-[#5C554E] mt-0.5">
                  Adicione novos pratos, edite detalhes, fotos, ingredientes e preços ou exclua itens.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddItemModal}
                className="px-5 py-3 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#C24D2C]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#E5A93C]" />
                <span>Adicionar Novo Item ao Cardápio</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E0D5C3] shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                
                {/* Search Input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou ingrediente..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                  />
                  {menuSearch && (
                    <button
                      onClick={() => setMenuSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'tradizionali', label: '🍕 Pizzas Tradicionais' },
                    { id: 'speciali', label: '✨ Pizzas Especiais' },
                    { id: 'antipasti', label: '🫒 Entradas & Aperitivos' },
                    { id: 'dolci', label: '🍰 Sobremesas' },
                    { id: 'bevande', label: '🍷 Bebidas & Vinhos' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategoryFilter === cat.id
                          ? 'bg-[#181513] text-white shadow-sm'
                          : 'bg-[#FAF7F2] text-[#5C554E] hover:bg-[#EAE4D9] border border-[#E0D5C3]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Items Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAdminItems.map((item) => {
                const isAvailable = item.isAvailable !== false;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#E0D5C3] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                  >
                    <div>
                      {/* Item Image Header with Badges */}
                      <div className="relative h-44 bg-[#181513] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        {/* Category Badge */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 text-white backdrop-blur-md">
                            {getCategoryNameInPortuguese(item.category)}
                          </span>
                        </div>

                        {/* Price Badge */}
                        <div className="absolute bottom-2.5 right-2.5 bg-[#181513]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#E5A93C]/40 text-[#E5A93C] font-black text-sm shadow">
                          {formatBRL(item.price)}
                        </div>

                        {/* Availability Pill */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                            isAvailable 
                              ? 'bg-emerald-500/90 text-white' 
                              : 'bg-rose-500/90 text-white'
                          }`}>
                            {isAvailable ? '✓ Disponível' : '✕ Pausado'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        {item.italianName && (
                          <p className="text-[10px] font-cinzel font-semibold uppercase tracking-wider text-[#C24D2C]">
                            {item.italianName}
                          </p>
                        )}
                        <h5 className="font-serif-italian text-base font-bold text-[#181513] leading-snug">
                          {item.name}
                        </h5>
                        <p className="text-xs text-[#5C554E] line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Ingredients */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.ingredients.slice(0, 4).map((ing, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#5C554E] text-[10px] border border-[#EADFCF]">
                              {ing}
                            </span>
                          ))}
                          {item.ingredients.length > 4 && (
                            <span className="text-[10px] text-neutral-400 self-center">
                              +{item.ingredients.length - 4}
                            </span>
                          )}
                        </div>

                        {item.pairing && (
                          <p className="text-[11px] text-[#1B382B] flex items-center gap-1 pt-1">
                            <Wine className="w-3 h-3 text-[#C24D2C]" />
                            <span className="truncate"><strong>Harmonização:</strong> {item.pairing}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="p-3 bg-[#FAF7F2] border-t border-[#EADFCF] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleItemAvailability(item.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase transition-all cursor-pointer ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Alternar disponibilidade no cardápio"
                      >
                        {isAvailable ? 'Disponível' : 'Pausado'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditItemModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-[#181513] hover:text-[#C24D2C] border border-[#E0D5C3] font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          title="Editar este item"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#E5A93C]" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                          title="Excluir este item do cardápio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredAdminItems.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E0D5C3] max-w-md mx-auto my-8">
                <UtensilsCrossed className="w-12 h-12 text-[#C24D2C] mx-auto mb-3 opacity-60" />
                <h4 className="font-serif-italian text-lg font-bold text-[#181513] mb-1">
                  Nenhum prato encontrado
                </h4>
                <p className="text-xs text-[#5C554E] mb-4">
                  Não encontramos nenhum item correspondente aos filtros de busca.
                </p>
                <button
                  type="button"
                  onClick={() => { setMenuSearch(''); setSelectedCategoryFilter('all'); }}
                  className="px-4 py-2 rounded-xl bg-[#C24D2C] text-white text-xs font-bold uppercase"
                >
                  Limpar Filtros
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================== */}
        {/* Tab 2: Branding & Logomarca Management     */}
        {/* ========================================== */}
        {activeTab === 'branding' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F4EFE6]">
            {/* Hidden file input for attached emblem direct upload */}
            <input
              ref={emblemFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  if (!file.type.startsWith('image/')) {
                    setEmblemNotice({ type: 'error', text: 'Selecione um arquivo de imagem válido (PNG, JPG, WebP ou SVG).' });
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const result = ev.target?.result as string;
                    setEmblemPreview(result);
                    setEmblemBase64(result);
                    setEmblemNotice({ type: 'success', text: 'Imagem carregada! Clique em "Salvar Imagem Anexa" para aplicar.' });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />

            <div className="max-w-4xl mx-auto space-y-6">

              {/* CARD 1: LOGOMARCA PRINCIPAL CIRCULAR */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E0D5C3] shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EADFCF]">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="p-2 rounded-xl bg-[#C24D2C]/10 text-[#C24D2C]">
                        <Camera className="w-5 h-5" />
                      </span>
                      <h4 className="font-serif-italian text-2xl font-bold text-[#181513]">
                        1. Logomarca Principal da Pizzaria (Circular)
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-[#5C554E]">
                      Insígnia circular oficial da Pizzaria Deolinda. Visível no topo do cabeçalho, no centro do hero e em documentos oficiais.
                    </p>
                  </div>

                  {onOpenLogoModal && (
                    <button
                      type="button"
                      onClick={() => onOpenLogoModal('logo')}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C24D2C] to-[#E5A93C] hover:from-[#A63A1E] hover:to-[#D4982B] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#C24D2C]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Camera className="w-4 h-4 text-amber-200" />
                      <span>Alterar Logotipo Principal</span>
                    </button>
                  )}
                </div>

                {/* Previews Grid */}
                <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dark Theme Header Preview */}
                  <div className="bg-[#181513] rounded-2xl p-6 text-white border border-[#C24D2C]/30 flex flex-col items-center justify-center text-center shadow-md">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5A93C] mb-4 bg-white/10 px-3 py-1 rounded-full">
                      Visualização no Fundo Escuro
                    </span>
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-16 h-16 rounded-full bg-[#181513] border-2 border-[#E5A93C] p-1 flex items-center justify-center shadow-xl shadow-[#C24D2C]/40 overflow-hidden shrink-0">
                        <img
                          src={customLogoUrl || "/deolinda_logo.png"}
                          alt="Logomarca Deolinda Preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/deolinda_logo.png';
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-serif-italian text-lg font-bold text-[#FAF7F2] mb-0.5">Deolinda</span>
                    <span className="text-[10px] tracking-widest uppercase font-semibold text-[#E5A93C]/90 font-cinzel">Pizzaria Napoletana D.O.P.</span>
                  </div>

                  {/* Light Theme Document Preview */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-6 text-[#181513] border border-[#E0D5C3] flex flex-col items-center justify-center text-center shadow-md">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#C24D2C] mb-4 bg-[#C24D2C]/10 px-3 py-1 rounded-full">
                      Visualização em Fundo Claro
                    </span>
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-[#E0D5C3] p-1.5 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                        <img
                          src={customLogoUrl || "/deolinda_logo.png"}
                          alt="Logomarca Deolinda Preview Claro"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/deolinda_logo.png';
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-serif-italian text-lg font-bold text-[#181513] mb-0.5">Deolinda</span>
                    <span className="text-[10px] tracking-widest uppercase font-semibold text-[#C24D2C] font-cinzel">Pizzaria Napoletana D.O.P.</span>
                  </div>
                </div>

                {/* Status info */}
                <div className="mt-6 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-xs text-[#5C554E] space-y-1">
                    <p className="font-bold text-[#181513] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Status: {customLogoUrl ? 'Logomarca personalizada ativa' : 'Logomarca padrão ativa'}
                    </p>
                    <p>Formatos suportados: PNG (fundo transparente recomendado), WebP, JPG ou SVG.</p>
                  </div>

                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Deseja restaurar a logomarca padrão original?')) {
                          try {
                            await saveLogoToFirestore(null);
                            await fetch('/api/settings/logo', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ logoUrl: null })
                            });
                            if (onLogoUpdated) onLogoUpdated(null);
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Restaurar Padrão</span>
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2: FERRAMENTA DE IMAGEM ANEXA */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E5A93C]/40 shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EADFCF]">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="p-2 rounded-xl bg-gradient-to-br from-[#C24D2C] to-[#E5A93C] text-white shadow-sm">
                        <Layers className="w-5 h-5" />
                      </span>
                      <h4 className="font-serif-italian text-2xl font-bold text-[#181513]">
                        2. Ferramenta de Imagem Anexa (Cabeçalho & Início)
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-[#5C554E]">
                      Coloque uma imagem ou letreiro personalizado para ficar posicionada <strong>ao lado do logo do cabeçalho</strong> e <strong>embaixo do logo na página principal</strong>, preservando 100% da integridade visual e proporção original.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEmblemIsEnabled(!emblemIsEnabled)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        emblemIsEnabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                      }`}
                      title={emblemIsEnabled ? 'Imagem ativa no site' : 'Imagem ocultada temporariamente'}
                    >
                      {emblemIsEnabled ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-neutral-500" />}
                      <span>{emblemIsEnabled ? 'Ativado no Site' : 'Pausado / Oculto'}</span>
                    </button>

                    {onOpenLogoModal && (
                      <button
                        type="button"
                        onClick={() => onOpenLogoModal('emblem')}
                        className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#C24D2C]" />
                        <span>Abrir Modal</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Feedback Alert */}
                {emblemNotice && (
                  <div className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in ${
                    emblemNotice.type === 'success' 
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' 
                      : 'bg-rose-50 border border-rose-300 text-rose-800'
                  }`}>
                    {emblemNotice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium">{emblemNotice.text}</span>
                  </div>
                )}

                {/* Upload & Drag Drop Area */}
                <div className="pt-6 space-y-5">
                  <div
                    onDragEnter={(e) => { e.preventDefault(); setDragEmblemActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragEmblemActive(false); }}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragEmblemActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        if (!file.type.startsWith('image/')) {
                          setEmblemNotice({ type: 'error', text: 'Selecione um arquivo de imagem válido (PNG, JPG, WebP ou SVG).' });
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          setEmblemPreview(result);
                          setEmblemBase64(result);
                          setEmblemNotice({ type: 'success', text: 'Imagem carregada! Clique em "Salvar Imagem Anexa" para aplicar.' });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      dragEmblemActive 
                        ? 'border-[#C24D2C] bg-[#C24D2C]/5 scale-[1.01]' 
                        : 'border-[#E0D5C3] hover:border-[#C24D2C]/60 bg-[#FAF7F2]'
                    }`}
                    onClick={() => emblemFileInputRef.current?.click()}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#E0D5C3] shadow-sm flex items-center justify-center text-[#C24D2C]">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#181513]">
                        Clique para selecionar ou arraste sua imagem aqui
                      </p>
                      <p className="text-xs text-[#5C554E] mt-1">
                        PNG com fundo transparente, WebP, SVG ou JPG (qualquer proporção horizontal ou emblema)
                      </p>
                    </div>
                  </div>

                  {/* URL Input and Paste Option */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#181513] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#C24D2C]" />
                      <span>Ou cole a URL direta de uma imagem da internet:</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          placeholder="https://exemplo.com/minha-imagem-ou-logo.png"
                          value={emblemUrlInput}
                          onChange={(e) => {
                            setEmblemUrlInput(e.target.value);
                            if (e.target.value.trim()) {
                              setEmblemPreview(e.target.value.trim());
                            }
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) {
                              setEmblemUrlInput(text);
                              setEmblemPreview(text);
                            }
                          } catch {}
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 border border-[#E0D5C3] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Colar da área de transferência"
                      >
                        <ClipboardPaste className="w-4 h-4 text-[#5C554E]" />
                        <span className="hidden sm:inline">Colar</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Preview Area */}
                  {emblemPreview && (
                    <div className="p-4 sm:p-6 rounded-2xl bg-[#181513] text-white border border-[#C24D2C]/40 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#E5A93C] flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          <span>Pré-visualização da Imagem Anexa</span>
                        </span>
                        <span className="text-[10px] text-white/50">
                          Preserva proporção natural e 100% da integridade
                        </span>
                      </div>

                      {/* Header Lockup Simulation */}
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#181513] border border-[#E5A93C] flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                          <img
                            src={customLogoUrl || "/deolinda_logo.png"}
                            alt="Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/deolinda_logo.png';
                            }}
                          />
                        </div>
                        <img
                          src={emblemPreview}
                          alt="Imagem anexa simulada"
                          className="h-9 w-auto max-w-[200px] object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Save and Remove Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                    <div>
                      {emblemPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveEmblemDirect}
                          disabled={isEmblemSaving}
                          className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover Imagem Anexa</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveEmblemDirect}
                        disabled={isEmblemSaving || (!emblemPreview && !emblemUrlInput.trim())}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-[#C24D2C] to-[#E5A93C] hover:from-[#A63A1E] hover:to-[#D4982B] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#C24D2C]/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isEmblemSaving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Salvando na Nuvem...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Salvar Imagem Anexa</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ========================================== */}
      {/* Item Editor / Creator Modal                */}
      {/* ========================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-[#E0D5C3]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#181513] text-white flex items-center justify-between border-b border-[#C24D2C]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C24D2C] flex items-center justify-center text-white">
                  {editingItem ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4 text-[#E5A93C]" />}
                </div>
                <div>
                  <h4 className="font-serif-italian text-lg font-bold text-white">
                    {editingItem ? `Editar Item: ${editingItem.name}` : 'Adicionar Novo Item ao Cardápio'}
                  </h4>
                  <p className="text-[11px] text-white/70">
                    Preencha os campos abaixo para atualizar ou cadastrar o prato.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveItem} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              
              {/* Row 1: Name and Italian Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#181513] mb-1">
                    Nome do Prato *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    placeholder="Ex: Pizza Burrata & Trufas"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#181513] mb-1">
                    Nome em Italiano (Opcional)
                  </label>
                  <input
                    type="text"
                    value={itemFormData.italianName}
                    onChange={(e) => setItemFormData({ ...itemFormData, italianName: e.target.value })}
                    placeholder="Ex: Burrata al Tartufo"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                  />
                </div>
              </div>

              {/* Row 2: Category and Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#181513] mb-1">
                    Categoria no Cardápio *
                  </label>
                  <select
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value as CategoryType })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                  >
                    <option value="tradizionali">🍕 Pizzas Tradicionais</option>
                    <option value="speciali">✨ Pizzas Especiais</option>
                    <option value="antipasti">🫒 Entradas & Aperitivos</option>
                    <option value="dolci">🍰 Sobremesas</option>
                    <option value="bevande">🍷 Bebidas & Vinhos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#181513] mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={itemFormData.price}
                    onChange={(e) => {
                      const formatted = formatPriceInput(e.target.value);
                      setItemFormData({ ...itemFormData, price: formatted });
                    }}
                    placeholder="R$ 00,00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                  />
                  <p className="text-[10px] text-[#8C827A] mt-1">
                    Apenas números (ex: 7800 vira R$ 78,00)
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-[#181513] mb-1">
                  Descrição do Prato
                </label>
                <textarea
                  rows={2}
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  placeholder="Descreva a receita, textura da massa, sabor e tradição do prato..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className="block font-bold text-[#181513] mb-1">
                  Ingredientes (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={itemFormData.ingredientsStr}
                  onChange={(e) => setItemFormData({ ...itemFormData, ingredientsStr: e.target.value })}
                  placeholder="Ex: Massa 48h, Mozzarella de Búfala, Pomodoro San Marzano, Manjericão fresco"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                />
              </div>

              {/* Wine Pairing */}
              <div>
                <label className="block font-bold text-[#181513] mb-1">
                  Sugestão de Harmonização (Opcional)
                </label>
                <input
                  type="text"
                  value={itemFormData.pairing}
                  onChange={(e) => setItemFormData({ ...itemFormData, pairing: e.target.value })}
                  placeholder="Ex: Chianti Classico DOCG ou Chopp Artesanal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                />
              </div>

              {/* Image Input, File Upload & Presets */}
              <div className="space-y-2 pt-1 border-t border-[#E0D5C3]">
                <label className="block font-bold text-[#181513]">
                  Foto do Prato
                </label>

                <input
                  ref={itemImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const res = ev.target?.result as string;
                        setItemFormData({ ...itemFormData, image: res });
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={itemFormData.image}
                    onChange={(e) => setItemFormData({ ...itemFormData, image: e.target.value })}
                    placeholder="URL da imagem (https://...)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#E0D5C3] text-xs focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30"
                  />
                  <button
                    type="button"
                    onClick={() => itemImageInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-[#181513] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#E5A93C]" />
                    <span>Upload Foto</span>
                  </button>
                </div>

                {/* Preset Suggestions */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-[#8C827A] font-semibold">Sugestões:</span>
                  {quickPhotoPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setItemFormData({ ...itemFormData, image: preset.url })}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EAE4D9] border border-[#E0D5C3] text-[#5C554E] whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Thumbnail Preview */}
                {itemFormData.image && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#E0D5C3]">
                    <img
                      src={itemFormData.image}
                      alt="Prévia do prato"
                      className="w-14 h-14 rounded-lg object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="text-[11px] text-[#5C554E]">
                      <p className="font-bold text-[#181513]">Prévia da Imagem Selecionada</p>
                      <p className="truncate max-w-xs">{itemFormData.image}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Availability Switch */}
              <div className="pt-2 border-t border-[#E0D5C3] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#181513] block">Disponibilidade no Cardápio</span>
                  <span className="text-[11px] text-[#5C554E]">Se desmarcado, o item aparecerá pausado para os clientes</span>
                </div>
                <button
                  type="button"
                  onClick={() => setItemFormData({ ...itemFormData, isAvailable: !itemFormData.isAvailable })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    itemFormData.isAvailable
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {itemFormData.isAvailable ? '✓ Item Ativo & Disponível' : '✕ Item Pausado'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E0D5C3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E0D5C3] bg-white text-[#5C554E] hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#E5A93C]" />
                  <span>{editingItem ? 'Salvar Alterações' : 'Cadastrar no Cardápio'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
