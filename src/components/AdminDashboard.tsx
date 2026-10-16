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
  Minimize2,
  MessageSquare,
  Calendar,
  RotateCcw,
  Globe,
  Phone,
  MapPin,
  Clock,
  Send,
  Save,
  FileText,
  BookOpen,
  Wheat,
  Info,
  ExternalLink,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  FolderTree,
  LayoutGrid
} from 'lucide-react';
import { MENU_ITEMS, DEFAULT_MENU_CATEGORIES } from '../data/menuData';
import { SOCIAL_POSTS } from '../data/socialData';
import { DEFAULT_SITE_INFO } from '../data/siteInfoData';
import { MenuItem, CategoryType, SocialPost, SiteInfo, MenuCategory } from '../types';
import { 
  saveEmblemToFirestore, 
  saveLogoToFirestore, 
  saveMenuItemsToFirestore,
  saveGalleryPostsToFirestore,
  saveSiteInfoToFirestore,
  saveMenuCategoriesToFirestore
} from '../services/firebaseService';
import { TricolorBands } from './TricolorBands';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: any[];
  reservations?: any[];
  menuItems?: MenuItem[];
  onMenuItemsUpdated?: (items: MenuItem[]) => void;
  menuCategories?: MenuCategory[];
  onMenuCategoriesUpdated?: (categories: MenuCategory[]) => void;
  socialPosts?: SocialPost[];
  onSocialPostsUpdated?: (posts: SocialPost[]) => void;
  siteInfo?: SiteInfo;
  onSiteInfoUpdated?: (info: SiteInfo) => void;
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
  menuCategories,
  onMenuCategoriesUpdated,
  socialPosts,
  onSocialPostsUpdated,
  siteInfo,
  onSiteInfoUpdated,
  customLogoUrl,
  customEmblemUrl,
  isEmblemEnabled = true,
  onOpenLogoModal,
  onEmblemUpdated,
  onLogoUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'gallery' | 'branding' | 'siteInfo'>('menu');
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

  // ==========================================
  // MENU CATEGORIES (BOTÕES DO CARDÁPIO) STATE
  // ==========================================
  const [currentCategories, setCurrentCategories] = useState<MenuCategory[]>(() => {
    if (menuCategories && menuCategories.length > 0) return menuCategories;
    try {
      const saved = localStorage.getItem('deolinda_custom_menu_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MENU_CATEGORIES;
  });

  useEffect(() => {
    if (menuCategories && menuCategories.length > 0) {
      setCurrentCategories(menuCategories);
    }
  }, [menuCategories]);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    label: '',
    icon: '🍕',
    id: ''
  });
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isConfirmingRestoreDefaultCats, setIsConfirmingRestoreDefaultCats] = useState(false);

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
    const found = currentCategories.find(c => c.id === category);
    if (found) return found.label;
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

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ label: '', icon: '🍕', id: '' });
    setCategoryFormError(null);
    setConfirmDeleteCatId(null);
  };

  const handleOpenEditCategory = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCategoryFormData({
      label: cat.label,
      icon: cat.icon || '🍕',
      id: cat.id
    });
    setCategoryFormError(null);
    setConfirmDeleteCatId(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormError(null);

    const trimmedLabel = categoryFormData.label.trim();
    if (!trimmedLabel) {
      setCategoryFormError('Por favor, informe o nome do botão/categoria.');
      return;
    }

    // Generate or sanitize ID
    let slug = categoryFormData.id.trim()
      ? categoryFormData.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : trimmedLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    if (!slug) {
      slug = `cat-${Date.now()}`;
    }

    // Check duplicate ID
    const duplicate = currentCategories.find(c => c.id === slug && (!editingCategory || editingCategory.id !== slug));
    if (duplicate) {
      setCategoryFormError(`Já existe um botão com o identificador "${slug}". Escolha outro nome ou ID.`);
      return;
    }

    setIsSavingCategory(true);
    try {
      const newCategory: MenuCategory = {
        id: slug,
        label: trimmedLabel,
        icon: categoryFormData.icon.trim() || '🍕'
      };

      let updatedCategories: MenuCategory[];
      if (editingCategory) {
        updatedCategories = currentCategories.map(c => c.id === editingCategory.id ? newCategory : c);

        // If the ID changed, also update items that had the old category ID
        if (editingCategory.id !== slug) {
          const updatedMenuItems = currentMenuItems.map(item => {
            if (item.category === editingCategory.id) {
              return { ...item, category: slug as any };
            }
            return item;
          });
          setCurrentMenuItems(updatedMenuItems);
          if (onMenuItemsUpdated) onMenuItemsUpdated(updatedMenuItems);
          await saveMenuItemsToFirestore(updatedMenuItems);
        }

        setMenuNotice({ type: 'success', text: `Botão "${trimmedLabel}" atualizado com sucesso!` });
      } else {
        updatedCategories = [...currentCategories, newCategory];
        setMenuNotice({ type: 'success', text: `Novo botão "${trimmedLabel}" adicionado ao cardápio!` });
      }

      setCurrentCategories(updatedCategories);
      if (onMenuCategoriesUpdated) {
        onMenuCategoriesUpdated(updatedCategories);
      }
      await saveMenuCategoriesToFirestore(updatedCategories);

      // Reset form
      setEditingCategory(null);
      setCategoryFormData({ label: '', icon: '🍕', id: '' });
      setTimeout(() => setMenuNotice(null), 5000);
    } catch (err) {
      console.error('Erro ao salvar categoria:', err);
      setCategoryFormError('Erro ao salvar o botão. Tente novamente.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catLabel: string) => {
    setIsSavingCategory(true);
    try {
      const updated = currentCategories.filter(c => c.id !== catId);
      setCurrentCategories(updated);
      if (onMenuCategoriesUpdated) {
        onMenuCategoriesUpdated(updated);
      }
      await saveMenuCategoriesToFirestore(updated);
      setConfirmDeleteCatId(null);
      if (editingCategory?.id === catId) {
        setEditingCategory(null);
        setCategoryFormData({ label: '', icon: '🍕', id: '' });
      }
      setMenuNotice({ type: 'success', text: `Botão "${catLabel}" removido do cardápio com sucesso!` });
      setTimeout(() => setMenuNotice(null), 5000);
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
      setCategoryFormError('Erro ao excluir o botão. Tente novamente.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentCategories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...currentCategories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setCurrentCategories(reordered);
    if (onMenuCategoriesUpdated) {
      onMenuCategoriesUpdated(reordered);
    }
    await saveMenuCategoriesToFirestore(reordered);
  };

  const handleRestoreDefaultCategories = async () => {
    setIsSavingCategory(true);
    try {
      setCurrentCategories(DEFAULT_MENU_CATEGORIES);
      if (onMenuCategoriesUpdated) {
        onMenuCategoriesUpdated(DEFAULT_MENU_CATEGORIES);
      }
      await saveMenuCategoriesToFirestore(DEFAULT_MENU_CATEGORIES);
      setIsConfirmingRestoreDefaultCats(false);
      setEditingCategory(null);
      setCategoryFormData({ label: '', icon: '🍕', id: '' });
      setMenuNotice({ type: 'success', text: 'Botões de categoria restaurados para o padrão original!' });
      setTimeout(() => setMenuNotice(null), 5000);
    } catch (err) {
      console.error('Erro ao restaurar categorias padrão:', err);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Item Editor Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteMenuId, setConfirmDeleteMenuId] = useState<string | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isConfirmingRestoreLogo, setIsConfirmingRestoreLogo] = useState(false);

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
    setItemFormError(null);
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
    setItemFormError(null);
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
    setItemFormError(null);
    if (!itemFormData.name.trim()) {
      setItemFormError('Por favor, informe o nome do prato.');
      return;
    }

    const parsedPrice = parsePriceNumber(itemFormData.price);
    if (parsedPrice <= 0) {
      setItemFormError('Por favor, informe um valor de preço válido (ex: R$ 78,00).');
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

    setIsSavingItem(true);
    try {
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
    } catch (err: any) {
      console.error('Erro ao salvar item do cardápio:', err);
      setItemFormError('Erro ao salvar o item. Tente novamente.');
    } finally {
      setIsSavingItem(false);
    }
  };

  const executeDeleteItem = async (id: string, name: string) => {
    setIsDeletingItem(true);
    try {
      const updatedList = currentMenuItems.filter(it => it.id !== id);
      setCurrentMenuItems(updatedList);
      if (onMenuItemsUpdated) {
        onMenuItemsUpdated(updatedList);
      }
      await saveMenuItemsToFirestore(updatedList);
      setItemToDelete(null);
      setConfirmDeleteMenuId(null);
      setMenuNotice({ type: 'success', text: `Item "${name}" foi excluído com sucesso do cardápio!` });
      setTimeout(() => setMenuNotice(null), 5000);
    } catch (err: any) {
      console.error('Erro ao excluir item do cardápio:', err);
      setMenuNotice({ type: 'error', text: `Erro ao excluir "${name}". Tente novamente.` });
    } finally {
      setIsDeletingItem(false);
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
  // FOTOS & MOMENTOS (GALLERY) STATE & CONTROLS
  // ==========================================
  const [currentSocialPosts, setCurrentSocialPosts] = useState<SocialPost[]>(() => {
    if (socialPosts && socialPosts.length > 0) return socialPosts;
    try {
      const saved = localStorage.getItem('deolinda_custom_social_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SOCIAL_POSTS;
  });

  useEffect(() => {
    if (socialPosts && socialPosts.length > 0) {
      setCurrentSocialPosts(socialPosts);
    }
  }, [socialPosts]);

  const [gallerySearch, setGallerySearch] = useState('');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [postFormError, setPostFormError] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<{ id: string; caption: string } | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [galleryNotice, setGalleryNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [postFormData, setPostFormData] = useState({
    imageUrl: '',
    caption: '',
    author: '@deolindapizzaria',
    tagsStr: '#FornoALegna, #DeolindaNapoletana',
    timestamp: 'Recente'
  });
  const postImageInputRef = useRef<HTMLInputElement>(null);

  const galleryPresets = [
    { label: '🍕 Pizza Margherita D.O.P.', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80' },
    { label: '🔥 Pizza no Forno a Lenha', url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80' },
    { label: '✨ Mortadella & Burrata', url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=80' },
    { label: '🧀 Burrata ao Forno Borbulhante', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22521?auto=format&fit=crop&w=800&q=80' },
    { label: '🍰 Tiramisù da Nonna', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80' },
    { label: '🍷 Vinho Chianti & Ambiente', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' }
  ];

  const openAddPostModal = () => {
    setEditingPost(null);
    setPostFormError(null);
    setPostFormData({
      imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
      caption: '',
      author: '@deolindapizzaria',
      tagsStr: '#FornoALegna, #DeolindaNapoletana, #450Graus',
      timestamp: 'Recente'
    });
    setIsPostModalOpen(true);
  };

  const openEditPostModal = (post: SocialPost) => {
    setEditingPost(post);
    setPostFormError(null);
    setPostFormData({
      imageUrl: post.imageUrl,
      caption: post.caption,
      author: post.author || '@deolindapizzaria',
      tagsStr: (post.tags || []).join(', '),
      timestamp: post.timestamp || 'Recente'
    });
    setIsPostModalOpen(true);
  };

  const handleUploadPostImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setPostFormError('Selecione um arquivo de imagem válido (JPG, PNG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPostFormError('A imagem deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPostFormData(prev => ({ ...prev, imageUrl: result }));
          setPostFormError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostFormError(null);
    if (!postFormData.imageUrl.trim()) {
      setPostFormError('Por favor, informe a URL da foto ou selecione um arquivo de imagem.');
      return;
    }
    if (!postFormData.caption.trim()) {
      setPostFormError('Por favor, digite uma legenda / descrição para a foto.');
      return;
    }

    setIsSavingPost(true);
    try {
      const parsedTags = postFormData.tagsStr
        .split(/[\s,]+/)
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      const savedPost: SocialPost = {
        id: editingPost ? editingPost.id : `post-${Date.now()}`,
        imageUrl: postFormData.imageUrl.trim(),
        caption: postFormData.caption.trim(),
        author: postFormData.author.trim() || '@deolindapizzaria',
        timestamp: postFormData.timestamp.trim() || 'Recente',
        tags: parsedTags.length > 0 ? parsedTags : ['#DeolindaNapoletana', '#FornoALegna'],
        likes: editingPost?.likes ?? 100,
        isHotOutOfOven: false
      };

      let updatedPosts: SocialPost[];
      if (editingPost) {
        updatedPosts = currentSocialPosts.map(p => p.id === editingPost.id ? savedPost : p);
        setGalleryNotice({ type: 'success', text: 'Foto e informações atualizadas com sucesso!' });
      } else {
        updatedPosts = [savedPost, ...currentSocialPosts];
        setGalleryNotice({ type: 'success', text: 'Nova foto cadastrada com sucesso na galeria!' });
      }

      setCurrentSocialPosts(updatedPosts);
      if (onSocialPostsUpdated) {
        onSocialPostsUpdated(updatedPosts);
      }
      await saveGalleryPostsToFirestore(updatedPosts);
      setIsPostModalOpen(false);
      setEditingPost(null);
      setTimeout(() => setGalleryNotice(null), 5000);
    } catch (err: any) {
      console.error('Erro ao salvar foto na galeria:', err);
      setPostFormError('Erro ao salvar foto. Tente novamente.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const executeDeletePost = async (id: string) => {
    setIsDeletingPost(true);
    try {
      const updated = currentSocialPosts.filter(p => p.id !== id);
      setCurrentSocialPosts(updated);
      if (onSocialPostsUpdated) {
        onSocialPostsUpdated(updated);
      }
      await saveGalleryPostsToFirestore(updated);
      setPostToDelete(null);
      setConfirmDeletePostId(null);
      setGalleryNotice({ type: 'success', text: 'Foto removida com sucesso da galeria!' });
      setTimeout(() => setGalleryNotice(null), 5000);
    } catch (err) {
      console.error('Erro ao excluir foto:', err);
      setGalleryNotice({ type: 'error', text: 'Erro ao remover foto. Tente novamente.' });
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleRestoreDefaultPosts = async () => {
    setCurrentSocialPosts(SOCIAL_POSTS);
    if (onSocialPostsUpdated) {
      onSocialPostsUpdated(SOCIAL_POSTS);
    }
    await saveGalleryPostsToFirestore(SOCIAL_POSTS);
    setGalleryNotice({ type: 'success', text: 'Galeria restaurada para as fotos padrão com sucesso!' });
    setTimeout(() => setGalleryNotice(null), 5000);
  };

  const filteredGalleryPosts = currentSocialPosts.filter(post => {
    const q = gallerySearch.toLowerCase();
    return !gallerySearch ||
      post.caption.toLowerCase().includes(q) ||
      post.author.toLowerCase().includes(q) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(q)));
  });

  // ==========================================
  // SITE INFORMATION STATE & CONTROLS
  // ==========================================
  const [currentSiteInfo, setCurrentSiteInfo] = useState<SiteInfo>(() => {
    if (siteInfo && typeof siteInfo === 'object') return siteInfo;
    try {
      const saved = localStorage.getItem('deolinda_custom_site_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_SITE_INFO, ...parsed };
        }
      }
    } catch {}
    return DEFAULT_SITE_INFO;
  });

  useEffect(() => {
    if (siteInfo && typeof siteInfo === 'object') {
      setCurrentSiteInfo(prev => ({ ...prev, ...siteInfo }));
    }
  }, [siteInfo]);

  const [siteInfoCategory, setSiteInfoCategory] = useState<'contact' | 'hero' | 'fermentation' | 'story' | 'hours'>('contact');
  const [siteInfoNotice, setSiteInfoNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingSiteInfo, setIsSavingSiteInfo] = useState(false);
  const [isConfirmingResetSiteInfo, setIsConfirmingResetSiteInfo] = useState(false);

  const handleUpdateSiteInfoField = (field: keyof SiteInfo, value: string) => {
    setCurrentSiteInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSiteInfo = async () => {
    setIsSavingSiteInfo(true);
    try {
      if (onSiteInfoUpdated) {
        onSiteInfoUpdated(currentSiteInfo);
      }
      await saveSiteInfoToFirestore(currentSiteInfo);
      setSiteInfoNotice({
        type: 'success',
        text: 'Todas as informações do site foram salvas e sincronizadas com sucesso!'
      });
      setTimeout(() => setSiteInfoNotice(null), 5000);
    } catch (err: any) {
      console.error('Erro ao salvar informações do site:', err);
      setSiteInfoNotice({
        type: 'error',
        text: 'Erro ao salvar informações. Tente novamente.'
      });
    } finally {
      setIsSavingSiteInfo(false);
    }
  };

  const handleResetSiteInfoToDefault = async () => {
    setCurrentSiteInfo(DEFAULT_SITE_INFO);
    setIsConfirmingResetSiteInfo(false);
    setIsSavingSiteInfo(true);
    try {
      if (onSiteInfoUpdated) {
        onSiteInfoUpdated(DEFAULT_SITE_INFO);
      }
      await saveSiteInfoToFirestore(DEFAULT_SITE_INFO);
      setSiteInfoNotice({
        type: 'success',
        text: 'Informações do site restauradas com sucesso para os valores padrão!'
      });
      setTimeout(() => setSiteInfoNotice(null), 5000);
    } catch (err) {
      setSiteInfoNotice({
        type: 'error',
        text: 'Erro ao restaurar padrões.'
      });
    } finally {
      setIsSavingSiteInfo(false);
    }
  };

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
            { id: 'gallery', label: `📸 Fotos & Momentos (${currentSocialPosts.length})` },
            { id: 'siteInfo', label: '🌐 Informações do Site' },
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

              {/* Botão Adicionar Prato */}
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
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
                  <TricolorBands direction="left" theme="light" className="w-5 sm:w-10 shrink-0" size="sm" />
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-[#181513] text-white shadow-sm'
                          : 'bg-[#FAF7F2] text-[#5C554E] hover:bg-[#EAE4D9] border border-[#E0D5C3]'
                      }`}
                    >
                      Todos ({currentMenuItems.length})
                    </button>
                    {currentCategories.map(cat => {
                      const count = currentMenuItems.filter(i => i.category === cat.id).length;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setSelectedCategoryFilter(cat.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategoryFilter === cat.id
                              ? 'bg-[#181513] text-white shadow-sm'
                              : 'bg-[#FAF7F2] text-[#5C554E] hover:bg-[#EAE4D9] border border-[#E0D5C3]'
                          }`}
                        >
                          {cat.icon ? `${cat.icon} ` : ''}{cat.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <TricolorBands direction="right" theme="light" className="w-5 sm:w-10 shrink-0" size="sm" />
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
                      <div
                        onClick={() => openEditItemModal(item)}
                        className="relative h-44 bg-[#181513] overflow-hidden cursor-pointer group/img"
                        title={`Clique para editar "${item.name}"`}
                      >
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
                        <h5
                          onClick={() => openEditItemModal(item)}
                          className="font-serif-italian text-base font-bold text-[#181513] hover:text-[#C24D2C] cursor-pointer transition-colors leading-snug"
                          title={`Clique para editar "${item.name}"`}
                        >
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
                          className="px-3.5 py-1.5 rounded-xl bg-[#181513] hover:bg-[#2A2420] text-white border border-[#E5A93C]/50 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title={`Editar "${item.name}"`}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#E5A93C]" />
                          <span>Editar</span>
                        </button>

                        {confirmDeleteMenuId === item.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-150">
                            <button
                              type="button"
                              onClick={() => executeDeleteItem(item.id, item.name)}
                              disabled={isDeletingItem}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                              title="Confirmar exclusão definitiva deste item"
                            >
                              {isDeletingItem ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Sim, Excluir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMenuId(null)}
                              disabled={isDeletingItem}
                              className="px-2.5 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMenuId(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title={`Excluir "${item.name}" do cardápio`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Excluir</span>
                          </button>
                        )}
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
        {/* Tab 2: Gestão de Fotos & Momentos          */}
        {/* ========================================== */}
        {activeTab === 'gallery' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F4EFE6] space-y-4">
            
            {/* Gallery Notice Alert */}
            {galleryNotice && (
              <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                galleryNotice.type === 'success' 
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-900' 
                  : 'bg-rose-100 border border-rose-300 text-rose-900'
              }`}>
                {galleryNotice.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{galleryNotice.text}</span>
              </div>
            )}

            {/* Header Action Bar */}
            <div className="bg-white rounded-3xl p-5 border border-[#E0D5C3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-[#C24D2C]/10 flex items-center justify-center text-[#C24D2C]">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif-italian text-xl font-bold text-[#181513]">
                    Gestão de Fotos & Momentos
                  </h4>
                </div>
                <p className="text-xs text-[#5C554E]">
                  Altere fotos, legendas, autores e hashtags exibidas na galeria oficial da pizzaria.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleRestoreDefaultPosts}
                  className="px-4 py-2.5 rounded-xl border border-[#E0D5C3] bg-white hover:bg-neutral-100 text-[#5C554E] hover:text-[#181513] font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Restaurar as 6 fotos oficiais originais da galeria"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C24D2C]" />
                  <span>Restaurar Padrão</span>
                </button>

                <button
                  type="button"
                  onClick={openAddPostModal}
                  className="px-5 py-2.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#C24D2C]/25 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#E5A93C]" />
                  <span>Adicionar Nova Foto</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E0D5C3] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                <input
                  type="text"
                  placeholder="Buscar legenda, autor ou tag..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                />
                {gallerySearch && (
                  <button
                    onClick={() => setGallerySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs text-[#5C554E] font-medium flex items-center gap-2 self-start sm:self-center">
                <span>Total de fotos ativas:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#181513] text-white font-bold text-xs">
                  {filteredGalleryPosts.length}
                </span>
              </div>
            </div>

            {/* Gallery Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGalleryPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-[#E0D5C3] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Header with Info Badges */}
                    <div className="relative h-56 bg-[#181513] overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {/* Author badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/70 text-white backdrop-blur-md">
                          {post.author}
                        </span>
                      </div>

                      {/* Timestamp badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-black/60 text-white/90 backdrop-blur-md">
                          {post.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <p className="text-xs text-[#181513] leading-relaxed line-clamp-3">
                        {post.caption}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {post.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#1B382B] text-[11px] font-semibold border border-[#EADFCF]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="p-3 bg-[#FAF7F2] border-t border-[#EADFCF] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditPostModal(post)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-[#181513] hover:text-[#C24D2C] border border-[#E0D5C3] font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      title="Editar foto e informações"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#E5A93C]" />
                      <span>Editar</span>
                    </button>

                    {confirmDeletePostId === post.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in duration-150">
                        <button
                          type="button"
                          onClick={() => executeDeletePost(post.id)}
                          disabled={isDeletingPost}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          title="Confirmar exclusão definitiva desta foto"
                        >
                          {isDeletingPost ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Sim, Excluir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePostId(null)}
                          disabled={isDeletingPost}
                          className="px-2.5 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePostId(post.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                        title="Excluir foto da galeria"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredGalleryPosts.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E0D5C3] max-w-md mx-auto my-8">
                <Camera className="w-12 h-12 text-[#C24D2C] mx-auto mb-3 opacity-60" />
                <h4 className="font-serif-italian text-lg font-bold text-[#181513] mb-1">
                  Nenhuma foto encontrada
                </h4>
                <p className="text-xs text-[#5C554E] mb-4">
                  Nenhuma publicação corresponde à busca ou a galeria está vazia.
                </p>
                <button
                  type="button"
                  onClick={() => { setGallerySearch(''); handleRestoreDefaultPosts(); }}
                  className="px-4 py-2 rounded-xl bg-[#C24D2C] text-white text-xs font-bold uppercase"
                >
                  Restaurar Fotos Padrão
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================== */}
        {/* Tab 3: Informações do Site (Completo)      */}
        {/* ========================================== */}
        {activeTab === 'siteInfo' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F4EFE6] space-y-4">
            
            {/* Notice Alert */}
            {siteInfoNotice && (
              <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                siteInfoNotice.type === 'success' 
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-900' 
                  : 'bg-rose-100 border border-rose-300 text-rose-900'
              }`}>
                {siteInfoNotice.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{siteInfoNotice.text}</span>
              </div>
            )}

            {/* Header Action Bar */}
            <div className="bg-white rounded-3xl p-5 border border-[#E0D5C3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-[#C24D2C]/10 flex items-center justify-center text-[#C24D2C]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif-italian text-xl font-bold text-[#181513]">
                    Alterar Todas as Informações do Site
                  </h4>
                </div>
                <p className="text-xs text-[#5C554E]">
                  Edite textos, contatos, telefones, horários, história e processo de fermentação com sincronização instantânea.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                {isConfirmingResetSiteInfo ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in">
                    <button
                      type="button"
                      onClick={handleResetSiteInfoToDefault}
                      disabled={isSavingSiteInfo}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Confirmar Restauração?</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingResetSiteInfo(false)}
                      disabled={isSavingSiteInfo}
                      className="px-3 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingResetSiteInfo(true)}
                    className="px-4 py-2.5 rounded-xl border border-[#E0D5C3] bg-white hover:bg-neutral-100 text-[#5C554E] hover:text-[#181513] font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    title="Restaurar textos padrão originais da pizzaria"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#C24D2C]" />
                    <span>Restaurar Padrão</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveSiteInfo}
                  disabled={isSavingSiteInfo}
                  className="px-5 py-2.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#C24D2C]/25 hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingSiteInfo ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#E5A93C]" />
                  ) : (
                    <Save className="w-4 h-4 text-[#E5A93C]" />
                  )}
                  <span>Salvar Informações</span>
                </button>
              </div>
            </div>

            {/* Sub-Category Navigation Bar */}
            <div className="bg-white rounded-3xl p-3 border border-[#E0D5C3] shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'contact', label: '📞 Contatos & Localização', icon: Phone },
                { id: 'hero', label: '🍕 Cabeçalho & Destaques', icon: Sparkles },
                { id: 'fermentation', label: '🌾 Fermentação Lenta 72h', icon: Wheat },
                { id: 'story', label: '📜 História da Nonna', icon: BookOpen },
                { id: 'hours', label: '⏰ Horários, Ambiente & Rodapé', icon: Clock }
              ].map((subCat) => {
                const IconComponent = subCat.icon;
                const isSelected = siteInfoCategory === subCat.id;
                return (
                  <button
                    key={subCat.id}
                    type="button"
                    onClick={() => setSiteInfoCategory(subCat.id as any)}
                    className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C24D2C] text-white shadow-md shadow-[#C24D2C]/20'
                        : 'bg-[#FAF7F2] text-[#5C554E] hover:text-[#181513] hover:bg-[#F0EAE1]'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E5A93C]' : 'text-[#8C827A]'}`} />
                    <span>{subCat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Category 1: Contatos, Redes & Localização */}
            {siteInfoCategory === 'contact' && (
              <div className="bg-white rounded-3xl p-6 border border-[#E0D5C3] shadow-xs space-y-6">
                <div>
                  <h5 className="font-serif-italian text-lg font-bold text-[#181513] mb-1">
                    Identidade Principal, Contatos e Redes Sociais
                  </h5>
                  <p className="text-xs text-[#5C554E]">
                    Estes dados são exibidos no cabeçalho, rodapé, botões de ação e na seção de contato do site.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Nome do Restaurante
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.restaurantName}
                      onChange={(e) => handleUpdateSiteInfoField('restaurantName', e.target.value)}
                      placeholder="Ex: Deolinda Pizzaria Napoletana"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Slogan / Subtítulo Institucional
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.slogan}
                      onChange={(e) => handleUpdateSiteInfoField('slogan', e.target.value)}
                      placeholder="Ex: Pizzaria Napoletana D.O.P. • Tradição Centenária"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Telefone Principal de Atendimento
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.phone}
                      onChange={(e) => handleUpdateSiteInfoField('phone', e.target.value)}
                      placeholder="(11) 91533-1853"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Número do WhatsApp (Apenas dígitos com 55 e DDD)
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.whatsappNumber}
                      onChange={(e) => handleUpdateSiteInfoField('whatsappNumber', e.target.value.replace(/\D/g, ''))}
                      placeholder="5511915331853"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Mensagem Inicial Padrão do WhatsApp
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.whatsappMessage}
                      onChange={(e) => handleUpdateSiteInfoField('whatsappMessage', e.target.value)}
                      placeholder="Olá Deolinda Pizzaria! Gostaria de fazer um pedido ou tirar dúvidas."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Instagram (@usuario)
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.instagramHandle}
                      onChange={(e) => handleUpdateSiteInfoField('instagramHandle', e.target.value)}
                      placeholder="@deolindapizzaria"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Link Completo do Instagram
                    </label>
                    <input
                      type="url"
                      value={currentSiteInfo.instagramUrl}
                      onChange={(e) => handleUpdateSiteInfoField('instagramUrl', e.target.value)}
                      placeholder="https://www.instagram.com/deolindapizzaria/"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      value={currentSiteInfo.email}
                      onChange={(e) => handleUpdateSiteInfoField('email', e.target.value)}
                      placeholder="contato@deolindapizzaria.com.br"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Endereço (Rua e Número)
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.address}
                      onChange={(e) => handleUpdateSiteInfoField('address', e.target.value)}
                      placeholder="Rua Santa Cruz, 232"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.addressNeighborhood}
                      onChange={(e) => handleUpdateSiteInfoField('addressNeighborhood', e.target.value)}
                      placeholder="Centro"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Cidade e Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.addressCityState}
                      onChange={(e) => handleUpdateSiteInfoField('addressCityState', e.target.value)}
                      placeholder="Itu - SP"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Link Oficial do Google Maps / Rotas GPS</span>
                      <a 
                        href={currentSiteInfo.mapsUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#C24D2C] hover:underline flex items-center gap-1 text-[11px] normal-case"
                      >
                        <ExternalLink className="w-3 h-3" /> Testar link no Maps
                      </a>
                    </label>
                    <input
                      type="url"
                      value={currentSiteInfo.mapsUrl}
                      onChange={(e) => handleUpdateSiteInfoField('mapsUrl', e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EAE1] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSiteInfo}
                    disabled={isSavingSiteInfo}
                    className="px-6 py-2.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-[#E5A93C]" />
                    <span>Salvar Dados de Contato</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Category 2: Cabeçalho & Destaques (Hero) */}
            {siteInfoCategory === 'hero' && (
              <div className="bg-white rounded-3xl p-6 border border-[#E0D5C3] shadow-xs space-y-6">
                <div>
                  <h5 className="font-serif-italian text-lg font-bold text-[#181513] mb-1">
                    Cabeçalho Principal & Cartões de Destaque (Hero)
                  </h5>
                  <p className="text-xs text-[#5C554E]">
                    Textos e argumentos principais visíveis logo no topo da página inicial.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Badge Superior do Topo
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.heroBadge}
                      onChange={(e) => handleUpdateSiteInfoField('heroBadge', e.target.value)}
                      placeholder="Ex: Tradição Napoletana Desde 1924"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Sub-badge de Destaque
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.heroSubBadge}
                      onChange={(e) => handleUpdateSiteInfoField('heroSubBadge', e.target.value)}
                      placeholder="Ex: Pizzaria Napoletana"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Subtítulo Principal do Hero
                    </label>
                    <textarea
                      rows={3}
                      value={currentSiteInfo.heroSubtitle}
                      onChange={(e) => handleUpdateSiteInfoField('heroSubtitle', e.target.value)}
                      placeholder="Fermentação natural lenta de 72 horas, farinha italiana Tipo 00, ingredientes certificados D.O.P. e o fogo vivo da pedra vulcânica a 450°C."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Texto do Botão Cardápio (CTA 1)
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.heroCtaMenuText}
                      onChange={(e) => handleUpdateSiteInfoField('heroCtaMenuText', e.target.value)}
                      placeholder="Explorar Cardápio"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Texto do Botão WhatsApp (CTA 2)
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.heroCtaWhatsappText}
                      onChange={(e) => handleUpdateSiteInfoField('heroCtaWhatsappText', e.target.value)}
                      placeholder="WhatsApp (11) 91533-1853"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EAE1]">
                  <h6 className="font-bold text-xs uppercase tracking-wider text-[#181513] mb-4">
                    4 Cartões de Destaque Rápido no Hero
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Destaque 1 */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C3] space-y-2">
                      <span className="text-[11px] font-bold text-[#C24D2C] uppercase">1. Fermentação</span>
                      <input
                        type="text"
                        value={currentSiteInfo.heroFermentationHighlight}
                        onChange={(e) => handleUpdateSiteInfoField('heroFermentationHighlight', e.target.value)}
                        placeholder="72 Horas Lenta"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={currentSiteInfo.heroFermentationSubtext}
                        onChange={(e) => handleUpdateSiteInfoField('heroFermentationSubtext', e.target.value)}
                        placeholder="Leve e digestiva"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                      />
                    </div>

                    {/* Destaque 2 */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C3] space-y-2">
                      <span className="text-[11px] font-bold text-[#C24D2C] uppercase">2. Forno Napoletano</span>
                      <input
                        type="text"
                        value={currentSiteInfo.heroOvenHighlight}
                        onChange={(e) => handleUpdateSiteInfoField('heroOvenHighlight', e.target.value)}
                        placeholder="450°C em 90s"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={currentSiteInfo.heroOvenSubtext}
                        onChange={(e) => handleUpdateSiteInfoField('heroOvenSubtext', e.target.value)}
                        placeholder="Pedra vulcânica"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                      />
                    </div>

                    {/* Destaque 3 */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C3] space-y-2">
                      <span className="text-[11px] font-bold text-[#C24D2C] uppercase">3. Farinha & Massa</span>
                      <input
                        type="text"
                        value={currentSiteInfo.heroFlourHighlight}
                        onChange={(e) => handleUpdateSiteInfoField('heroFlourHighlight', e.target.value)}
                        placeholder="Caputo Tipo 00"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={currentSiteInfo.heroFlourSubtext}
                        onChange={(e) => handleUpdateSiteInfoField('heroFlourSubtext', e.target.value)}
                        placeholder="Importada de Nápoles"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                      />
                    </div>

                    {/* Destaque 4 */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C3] space-y-2">
                      <span className="text-[11px] font-bold text-[#C24D2C] uppercase">4. Ingredientes D.O.P.</span>
                      <input
                        type="text"
                        value={currentSiteInfo.heroTomatoHighlight}
                        onChange={(e) => handleUpdateSiteInfoField('heroTomatoHighlight', e.target.value)}
                        placeholder="San Marzano D.O.P."
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={currentSiteInfo.heroTomatoSubtext}
                        onChange={(e) => handleUpdateSiteInfoField('heroTomatoSubtext', e.target.value)}
                        placeholder="Cultivado no Vesúvio"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                      />
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EAE1] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSiteInfo}
                    disabled={isSavingSiteInfo}
                    className="px-6 py-2.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-[#E5A93C]" />
                    <span>Salvar Textos do Hero</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Category 3: Processo de Fermentação Lenta */}
            {siteInfoCategory === 'fermentation' && (
              <div className="bg-white rounded-3xl p-6 border border-[#E0D5C3] shadow-xs space-y-6">
                <div>
                  <h5 className="font-serif-italian text-lg font-bold text-[#181513] mb-1">
                    Processo de Fermentação & Ingredientes D.O.P.
                  </h5>
                  <p className="text-xs text-[#5C554E]">
                    Altere o badge, títulos e o detalhamento das 4 etapas de preparo da massa napolitana.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Badge da Seção
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.fermentationBadge}
                      onChange={(e) => handleUpdateSiteInfoField('fermentationBadge', e.target.value)}
                      placeholder="Processo & Ingredientes D.O.P."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Título da Seção
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.fermentationTitle}
                      onChange={(e) => handleUpdateSiteInfoField('fermentationTitle', e.target.value)}
                      placeholder="O Segredo das 72 Horas de Fermentação Lenta"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Subtítulo / Descrição da Seção
                    </label>
                    <textarea
                      rows={3}
                      value={currentSiteInfo.fermentationSubtitle}
                      onChange={(e) => handleUpdateSiteInfoField('fermentationSubtitle', e.target.value)}
                      placeholder="Nossa massa não é apenas feita; ela é maturada pacientemente..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>
                </div>

                {/* 4 Steps */}
                <div className="space-y-4 pt-4 border-t border-[#F0EAE1]">
                  <h6 className="font-bold text-xs uppercase tracking-wider text-[#181513]">
                    As Etapas do Processo de Maturação
                  </h6>

                  {/* Step 1 */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C3] space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Título da Etapa 1</label>
                        <input
                          type="text"
                          value={currentSiteInfo.fermentationStep1Title}
                          onChange={(e) => handleUpdateSiteInfoField('fermentationStep1Title', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs font-bold"
                        />
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Tempo / Duração</label>
                        <input
                          type="text"
                          value={currentSiteInfo.fermentationStep1Time}
                          onChange={(e) => handleUpdateSiteInfoField('fermentationStep1Time', e.target.value)}
                          placeholder="Hora 0"
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Descrição</label>
                      <textarea
                        rows={2}
                        value={currentSiteInfo.fermentationStep1Desc}
                        onChange={(e) => handleUpdateSiteInfoField('fermentationStep1Desc', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                      />
                    </div>
                  </div>

                  {/* Step 2 (Maturação) */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C3] space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Título da Etapa 2 (Maturação)</label>
                        <input
                          type="text"
                          value={currentSiteInfo.fermentationStep3Title}
                          onChange={(e) => handleUpdateSiteInfoField('fermentationStep3Title', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs font-bold"
                        />
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Tempo / Duração</label>
                        <input
                          type="text"
                          value={currentSiteInfo.fermentationStep3Time}
                          onChange={(e) => handleUpdateSiteInfoField('fermentationStep3Time', e.target.value)}
                          placeholder="Hora 24 a 72"
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Descrição</label>
                      <textarea
                        rows={2}
                        value={currentSiteInfo.fermentationStep3Desc}
                        onChange={(e) => handleUpdateSiteInfoField('fermentationStep3Desc', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                      />
                    </div>
                  </div>

                  {/* Step 3 (Forno / Cocção) */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C3] space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Título da Etapa 3 (Cocção a 450°C)</label>
                        <input
                          type="text"
                          value={currentSiteInfo.fermentationStep4Title}
                          onChange={(e) => handleUpdateSiteInfoField('fermentationStep4Title', e.target.value)}
                          placeholder="3. Cocção a 450°C em 90 Segundos"
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs font-bold"
                        />
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Tempo / Duração</label>
                        <input
                          type="text"
                          value={currentSiteInfo.fermentationStep4Time}
                          onChange={(e) => handleUpdateSiteInfoField('fermentationStep4Time', e.target.value)}
                          placeholder="60 a 90 Segundos"
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#181513] uppercase mb-1">Descrição</label>
                      <textarea
                        rows={2}
                        value={currentSiteInfo.fermentationStep4Desc}
                        onChange={(e) => handleUpdateSiteInfoField('fermentationStep4Desc', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D5C3] text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EAE1] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSiteInfo}
                    disabled={isSavingSiteInfo}
                    className="px-6 py-2.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-[#E5A93C]" />
                    <span>Salvar Fermentação</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Category 4: História & Tradição da Nonna Deolinda */}
            {siteInfoCategory === 'story' && (
              <div className="bg-white rounded-3xl p-6 border border-[#E0D5C3] shadow-xs space-y-6">
                <div>
                  <h5 className="font-serif-italian text-lg font-bold text-[#181513] mb-1">
                    História, Legado Familiar & Nonna Deolinda
                  </h5>
                  <p className="text-xs text-[#5C554E]">
                    Narrativa da família, origem em Nápoles, travessia para o Brasil e a frase marcante da Nonna.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Badge da Seção História
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.storyBadge}
                      onChange={(e) => handleUpdateSiteInfoField('storyBadge', e.target.value)}
                      placeholder="Nossa História • Desde 1924"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Título da Seção História
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.storyTitle}
                      onChange={(e) => handleUpdateSiteInfoField('storyTitle', e.target.value)}
                      placeholder="Uma Tradição que Atravessou o Mediterrâneo"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Subtítulo da Seção História
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.storySubtitle}
                      onChange={(e) => handleUpdateSiteInfoField('storySubtitle', e.target.value)}
                      placeholder="O legado napolitano cultivado através de quatro gerações."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Parágrafo 1 da História
                    </label>
                    <textarea
                      rows={3}
                      value={currentSiteInfo.storyParagraph1}
                      onChange={(e) => handleUpdateSiteInfoField('storyParagraph1', e.target.value)}
                      placeholder="A história da nossa pizzaria começou nos becos ensolarados de Nápoles..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Parágrafo 2 da História
                    </label>
                    <textarea
                      rows={3}
                      value={currentSiteInfo.storyParagraph2}
                      onChange={(e) => handleUpdateSiteInfoField('storyParagraph2', e.target.value)}
                      placeholder="Quando a família decidiu atravessar o Atlântico rumo ao Brasil..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Frase Marcante / Citação da Nonna
                    </label>
                    <textarea
                      rows={2}
                      value={currentSiteInfo.storyQuote}
                      onChange={(e) => handleUpdateSiteInfoField('storyQuote', e.target.value)}
                      placeholder="A pizza napoletana não é só comida, è un atto d'amore..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Autor da Citação
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.storyQuoteAuthor}
                      onChange={(e) => handleUpdateSiteInfoField('storyQuoteAuthor', e.target.value)}
                      placeholder="Nonna Deolinda — Matriarca & Pizzaiola (1902-1988)"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EAE1] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSiteInfo}
                    disabled={isSavingSiteInfo}
                    className="px-6 py-2.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-[#E5A93C]" />
                    <span>Salvar História</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Category 5: Horários, Ambiente & Rodapé */}
            {siteInfoCategory === 'hours' && (
              <div className="bg-white rounded-3xl p-6 border border-[#E0D5C3] shadow-xs space-y-6">
                <div>
                  <h5 className="font-serif-italian text-lg font-bold text-[#181513] mb-1">
                    Horários de Funcionamento, Ambiente & Rodapé
                  </h5>
                  <p className="text-xs text-[#5C554E]">
                    Horários detalhados por dia da semana, avisos de estacionamento e textos do rodapé do site.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Badge da Seção Localização
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.locationBadge}
                      onChange={(e) => handleUpdateSiteInfoField('locationBadge', e.target.value)}
                      placeholder="Onde Nos Encontrar"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Título da Seção Localização
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.locationTitle}
                      onChange={(e) => handleUpdateSiteInfoField('locationTitle', e.target.value)}
                      placeholder="Visite a Deolinda Pizzaria Napoletana"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Subtítulo da Seção Localização
                    </label>
                    <textarea
                      rows={2}
                      value={currentSiteInfo.locationSubtitle}
                      onChange={(e) => handleUpdateSiteInfoField('locationSubtitle', e.target.value)}
                      placeholder="Um refúgio italiano aconchegante com aroma de lenha queimando..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Terça a Quinta-feira
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.hoursTueThu}
                      onChange={(e) => handleUpdateSiteInfoField('hoursTueThu', e.target.value)}
                      placeholder="18h00 às 23h30"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Sexta e Sábado
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.hoursFriSat}
                      onChange={(e) => handleUpdateSiteInfoField('hoursFriSat', e.target.value)}
                      placeholder="18h00 às 00h00"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Domingo
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.hoursSun}
                      onChange={(e) => handleUpdateSiteInfoField('hoursSun', e.target.value)}
                      placeholder="18h00 às 23h00"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Segunda-feira
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.hoursMon}
                      onChange={(e) => handleUpdateSiteInfoField('hoursMon', e.target.value)}
                      placeholder="Fechado (Descanso da Massa)"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Resumo de Horários (Linha Única)
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.openingHoursSummary}
                      onChange={(e) => handleUpdateSiteInfoField('openingHoursSummary', e.target.value)}
                      placeholder="Terça a Domingo das 18h às 23h30"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Informações de Valet / Estacionamento
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.valetInfo}
                      onChange={(e) => handleUpdateSiteInfoField('valetInfo', e.target.value)}
                      placeholder="Serviço de Valet cortesia na porta e convênio com estacionamento ao lado."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Informações do Ambiente & Forno
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.environmentInfo}
                      onChange={(e) => handleUpdateSiteInfoField('environmentInfo', e.target.value)}
                      placeholder="Salão principal com ar condicionado e Jardim do Forno a Lenha ao ar livre pet-friendly."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Texto de Copyright do Rodapé
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.footerCopyright}
                      onChange={(e) => handleUpdateSiteInfoField('footerCopyright', e.target.value)}
                      placeholder="Deolinda Pizzaria Napoletana. Fatta con amore, lievito madre e farina pura."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181513] uppercase tracking-wider mb-1.5">
                      Associação / Certificação no Rodapé
                    </label>
                    <input
                      type="text"
                      value={currentSiteInfo.footerAssociationText}
                      onChange={(e) => handleUpdateSiteInfoField('footerAssociationText', e.target.value)}
                      placeholder="Associazione Verace Pizza Napoletana"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-sm text-[#181513]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EAE1] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSiteInfo}
                    disabled={isSavingSiteInfo}
                    className="px-6 py-2.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-[#E5A93C]" />
                    <span>Salvar Horários & Rodapé</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================== */}
        {/* Tab 4: Branding & Logomarca Management     */}
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
                    <div className="flex items-center gap-2">
                      {isConfirmingRestoreLogo ? (
                        <div className="flex items-center gap-2 animate-in fade-in">
                          <span className="text-xs text-rose-700 font-bold">Confirmar?</span>
                          <button
                            type="button"
                            onClick={async () => {
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
                              } finally {
                                setIsConfirmingRestoreLogo(false);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Sim, Restaurar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingRestoreLogo(false)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-[#5C554E] border border-[#E0D5C3] text-xs font-bold transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsConfirmingRestoreLogo(true)}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Restaurar Padrão</span>
                        </button>
                      )}
                    </div>
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
      {/* Category / Menu Buttons Management Modal   */}
      {/* ========================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] rounded-3xl w-full max-w-2xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-[#E0D5C3]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#181513] text-white flex items-center justify-between border-b border-[#C24D2C]/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#C24D2C] flex items-center justify-center text-white shadow-md">
                  <Tag className="w-5 h-5 text-[#E5A93C]" />
                </div>
                <div>
                  <h4 className="font-serif-italian text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span>Editar Botões do Cardápio</span>
                    <span className="text-xs bg-[#E5A93C]/20 text-[#E5A93C] font-sans px-2 py-0.5 rounded-full border border-[#E5A93C]/40">
                      {currentCategories.length} categorias
                    </span>
                  </h4>
                  <p className="text-xs text-white/70">
                    Acrescente, exclua, reordene ou edite os botões de filtro do cardápio.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setConfirmDeleteCatId(null);
                }}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-grow">
              
              {/* Notice / Status */}
              {menuNotice && (
                <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold ${
                  menuNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {menuNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{menuNotice.text}</span>
                </div>
              )}

              {/* Informative Explanation */}
              <div className="p-3.5 rounded-2xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-xs text-[#5C554E] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#8C5E14] shrink-0 mt-0.5" />
                <p>
                  Estes botões aparecem no topo da página de cardápio do site para os clientes escolherem os tipos de produtos (ex: Pizzas Tradicionais, Especiais, Bebidas, etc.).
                </p>
              </div>

              {/* Form: Add or Edit Category */}
              <form onSubmit={handleSaveCategory} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E0D5C3] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E0D5C3] pb-2.5">
                  <h5 className="font-bold text-sm text-[#181513] flex items-center gap-2">
                    {editingCategory ? (
                      <>
                        <Edit3 className="w-4 h-4 text-[#C24D2C]" />
                        <span>Editando Botão: <strong className="text-[#C24D2C]">{editingCategory.label}</strong></span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#C24D2C]" />
                        <span>Acrescentar Novo Botão ao Cardápio</span>
                      </>
                    )}
                  </h5>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      className="text-xs text-[#5C554E] hover:text-[#181513] underline font-medium cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>

                {categoryFormError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{categoryFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#181513] mb-1">
                      Nome do Botão *
                    </label>
                    <input
                      type="text"
                      required
                      value={categoryFormData.label}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, label: e.target.value })}
                      placeholder="Ex: Pizzas Especiais, Calzones, Vinhos"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-xs sm:text-sm text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>

                  {/* Emoji / Icon */}
                  <div>
                    <label className="block text-xs font-bold text-[#181513] mb-1">
                      Ícone / Emoji
                    </label>
                    <input
                      type="text"
                      value={categoryFormData.icon}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                      placeholder="🍕"
                      maxLength={4}
                      className="w-full px-3.5 py-2.5 text-center text-lg rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                    />
                  </div>
                </div>

                {/* Quick Emoji Selector */}
                <div>
                  <span className="block text-[11px] font-semibold text-[#8C827A] mb-1.5">
                    Sugestões de Ícones rápidos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['🍕', '✨', '🫒', '🍰', '🍷', '🥗', '🥖', '🧀', '🍺', '🍹', '🍝', '🌿', '🔥', '🏆', '🥟', '☕'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCategoryFormData({ ...categoryFormData, icon: emoji })}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                          categoryFormData.icon === emoji
                            ? 'bg-[#181513] text-white scale-110 shadow-sm'
                            : 'bg-[#FAF7F2] hover:bg-[#EAE4D9] border border-[#E0D5C3]'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Custom Slug */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#8C827A] mb-1">
                    Identificador Técnico (Opcional - gerado automaticamente se vazio):
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.id}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, id: e.target.value })}
                    placeholder="ex: especiais, entradas, calzones"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] text-xs text-[#5C554E] font-mono focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      className="px-4 py-2 rounded-xl border border-[#E0D5C3] text-xs font-semibold text-[#5C554E] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingCategory}
                    className="px-5 py-2.5 rounded-xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#C24D2C]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingCategory ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : editingCategory ? (
                      <>
                        <Save className="w-3.5 h-3.5 text-[#E5A93C]" />
                        <span>Salvar Alterações</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-[#E5A93C]" />
                        <span>Acrescentar Botão</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* List of Current Categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-[#181513] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#C24D2C]" />
                    <span>Lista de Botões Cadastrados ({currentCategories.length})</span>
                  </h5>
                  <span className="text-[11px] text-[#8C827A]">
                    Use as setas ↑ ↓ para reordenar
                  </span>
                </div>

                <div className="space-y-2">
                  {currentCategories.map((cat, index) => {
                    const itemCount = currentMenuItems.filter(i => i.category === cat.id).length;
                    const isDeletingThis = confirmDeleteCatId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          editingCategory?.id === cat.id
                            ? 'bg-[#E5A93C]/10 border-[#E5A93C] ring-2 ring-[#E5A93C]/30'
                            : 'bg-white border-[#E0D5C3] hover:border-[#C24D2C]/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          
                          {/* Left: Drag / Order Controls & Info */}
                          <div className="flex items-center gap-3">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                disabled={index === 0 || isSavingCategory}
                                onClick={() => handleMoveCategory(index, 'up')}
                                title="Mover para cima"
                                className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#181513] disabled:opacity-20 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed border border-[#E0D5C3]"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === currentCategories.length - 1 || isSavingCategory}
                                onClick={() => handleMoveCategory(index, 'down')}
                                title="Mover para baixo"
                                className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#181513] disabled:opacity-20 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed border border-[#E0D5C3]"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Icon & Label */}
                            <div className="flex items-center gap-2.5">
                              <span className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] flex items-center justify-center text-xl shrink-0 shadow-xs">
                                {cat.icon || '🍕'}
                              </span>
                              <div>
                                <h6 className="font-bold text-sm text-[#181513] leading-tight">
                                  {cat.label}
                                </h6>
                                <div className="flex items-center gap-2 text-[11px] text-[#8C827A] mt-0.5">
                                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                                    id: {cat.id}
                                  </span>
                                  <span>•</span>
                                  <span className="font-medium text-[#C24D2C]">
                                    {itemCount} {itemCount === 1 ? 'prato vinculado' : 'pratos vinculados'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isDeletingThis ? (
                              <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-200 animate-in fade-in">
                                <span className="text-[11px] text-red-700 font-bold px-1">
                                  Excluir mesmo?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id, cat.label)}
                                  disabled={isSavingCategory}
                                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                  {isSavingCategory ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  <span>Sim</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCatId(null)}
                                  className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#181513] border border-[#E0D5C3] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#C24D2C]" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCatId(cat.id)}
                                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
                              </>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-white border-t border-[#E0D5C3] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Restore Defaults Button */}
              {isConfirmingRestoreDefaultCats ? (
                <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-900 font-semibold">
                    Restaurar 5 categorias originais?
                  </span>
                  <button
                    type="button"
                    onClick={handleRestoreDefaultCategories}
                    disabled={isSavingCategory}
                    className="px-2.5 py-1 rounded-lg bg-[#C24D2C] text-white text-xs font-bold hover:bg-[#A63A1E] transition-colors cursor-pointer"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingRestoreDefaultCats(false)}
                    className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingRestoreDefaultCats(true)}
                  className="text-xs text-[#8C827A] hover:text-[#C24D2C] flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Categorias Originais</span>
                </button>
              )}

              {/* Close / Done Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setConfirmDeleteCatId(null);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#181513] hover:bg-[#2A2420] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Concluir & Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Item Editor / Creator Modal                */}
      {/* ========================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
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
              {itemFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{itemFormError}</span>
                </div>
              )}
              
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
                    {currentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon ? `${cat.icon} ` : ''}{cat.label}
                      </option>
                    ))}
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
                  placeholder="Ex: Massa 72h, Mozzarella de Búfala, Pomodoro San Marzano, Manjericão fresco"
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
              <div className="pt-4 border-t border-[#E0D5C3] flex items-center justify-between gap-3">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = { id: editingItem.id, name: editingItem.name };
                      setIsItemModalOpen(false);
                      setItemToDelete(toDelete);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Excluir este prato do cardápio"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Excluir Prato</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E0D5C3] bg-white text-[#5C554E] hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingItem}
                    className="px-6 py-2.5 rounded-xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingItem ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#E5A93C]" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#E5A93C]" />
                        <span>{editingItem ? 'Salvar Alterações' : 'Cadastrar no Cardápio'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Photo Post Editor / Creator Modal          */}
      {/* ========================================== */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] rounded-3xl w-full max-w-xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-[#E0D5C3]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#181513] text-white flex items-center justify-between border-b border-[#C24D2C]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C24D2C] flex items-center justify-center text-white">
                  <Camera className="w-4 h-4 text-[#E5A93C]" />
                </div>
                <div>
                  <h4 className="font-serif-italian text-lg font-bold text-white">
                    {editingPost ? 'Editar Foto & Informações' : 'Nova Foto & Momento'}
                  </h4>
                  <p className="text-[11px] text-white/70">
                    Personalize a imagem, legenda, autor e hashtags da publicação.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePost} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {postFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{postFormError}</span>
                </div>
              )}

              {/* Photo Preview & Upload Controls */}
              <div>
                <label className="block font-bold text-[#181513] mb-1.5">
                  Foto / Imagem da Publicação *
                </label>

                {/* Preview Box */}
                <div className="relative h-48 w-full rounded-2xl bg-[#181513] overflow-hidden border border-[#E0D5C3] shadow-inner mb-3 flex items-center justify-center group">
                  {postFormData.imageUrl ? (
                    <img
                      src={postFormData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  ) : (
                    <div className="text-center text-white/60 p-4">
                      <Camera className="w-8 h-8 mx-auto mb-1 text-white/40" />
                      <span className="text-xs">Nenhuma imagem selecionada</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => postImageInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-[#181513] font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#C24D2C]" />
                      <span>Trocar Arquivo</span>
                    </button>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={postImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadPostImage}
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => postImageInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#181513] border border-[#E0D5C3] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Upload className="w-4 h-4 text-[#C24D2C]" />
                    <span>Upload do Aparelho / PC</span>
                  </button>

                  <input
                    type="url"
                    value={postFormData.imageUrl}
                    onChange={(e) => setPostFormData({ ...postFormData, imageUrl: e.target.value })}
                    placeholder="Ou cole o link direto da imagem (URL https://...)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#E0D5C3] text-xs focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                  />
                </div>

                {/* Presets suggestions */}
                <div className="mt-2.5">
                  <p className="text-[11px] font-semibold text-[#5C554E] mb-1">
                    Sugestões Rápidas de Fotos:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {galleryPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPostFormData({ ...postFormData, imageUrl: preset.url })}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-[11px] text-[#5C554E] border border-[#E0D5C3] transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Caption field */}
              <div>
                <label className="block font-bold text-[#181513] mb-1">
                  Legenda / Texto da Publicação *
                </label>
                <textarea
                  rows={3}
                  required
                  value={postFormData.caption}
                  onChange={(e) => setPostFormData({ ...postFormData, caption: e.target.value })}
                  placeholder="Ex: Saindo agora do forno a lenha a 450°C! Nossa Deolinda Suprema com stracciatella e perfume de trufas negras..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C] leading-relaxed resize-none"
                />
              </div>

              {/* Row: Author and Timestamp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#181513] mb-1">
                    Autor / Perfil
                  </label>
                  <input
                    type="text"
                    value={postFormData.author}
                    onChange={(e) => setPostFormData({ ...postFormData, author: e.target.value })}
                    placeholder="@deolindapizzaria ou @cliente"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#181513] mb-1">
                    Data / Momento
                  </label>
                  <input
                    type="text"
                    value={postFormData.timestamp}
                    onChange={(e) => setPostFormData({ ...postFormData, timestamp: e.target.value })}
                    placeholder="Ex: Há 15 minutos, Hoje às 20h"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                  />
                </div>
              </div>

              {/* Tags field */}
              <div>
                <label className="block font-bold text-[#181513] mb-1">
                  Hashtags / Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={postFormData.tagsStr}
                  onChange={(e) => setPostFormData({ ...postFormData, tagsStr: e.target.value })}
                  placeholder="#FornoALegna, #DeolindaNapoletana, #450Graus"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0D5C3] text-[#181513] focus:outline-none focus:ring-2 focus:ring-[#C24D2C]/30 focus:border-[#C24D2C]"
                />
              </div>

              {/* Modal Footer Toolbar */}
              <div className="pt-4 border-t border-[#E0D5C3] flex items-center justify-between gap-3">
                {editingPost ? (
                  <button
                    type="button"
                    onClick={() => {
                      const toDel = editingPost.id;
                      setIsPostModalOpen(false);
                      executeDeletePost(toDel);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Excluir Foto</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E0D5C3] bg-white text-[#5C554E] hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingPost}
                    className="px-6 py-2.5 rounded-xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPost ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#E5A93C]" />
                        <span>{editingPost ? 'Salvar Alterações' : 'Cadastrar Foto'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Item Delete Confirmation Dialog (Sem bloqueio de window.confirm) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E0D5C3] shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-serif-italian text-xl font-bold text-[#181513]">
                Excluir Item do Cardápio?
              </h4>
              <p className="text-sm text-[#5C554E] mt-2">
                Tem certeza que deseja remover <strong className="text-[#181513]">"{itemToDelete.name}"</strong>?
              </p>
              <p className="text-xs text-rose-600 font-medium mt-1">
                O prato será excluído imediatamente de todas as telas e do banco de dados em tempo real.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeletingItem}
                className="px-5 py-2.5 rounded-xl border border-[#E0D5C3] bg-white text-[#5C554E] hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeDeleteItem(itemToDelete.id, itemToDelete.name)}
                disabled={isDeletingItem}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingItem ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
