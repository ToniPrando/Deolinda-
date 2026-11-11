import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { StorySection } from './components/StorySection';
import { SocialFeedSection } from './components/SocialFeedSection';
import { LocationSection } from './components/LocationSection';
import { CartDrawer } from './components/CartDrawer';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAuthModal } from './components/AdminAuthModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { LogoUploadModal } from './components/LogoUploadModal';
import { Footer } from './components/Footer';
import { CartItem, Order, Reservation, OrderStatus, CustomerUser, MenuItem, SocialPost, SiteInfo, MenuCategory } from './types';
import { MENU_ITEMS, DEFAULT_MENU_CATEGORIES } from './data/menuData';
import { SOCIAL_POSTS } from './data/socialData';
import { DEFAULT_SITE_INFO } from './data/siteInfoData';
import { 
  subscribeToOrders, 
  subscribeToReservations, 
  updateOrderStatusInFirestore, 
  saveOrderToFirestore,
  saveReservationToFirestore,
  subscribeToLogo,
  subscribeToBrandSettings,
  subscribeToMenuItems,
  subscribeToGalleryPosts,
  subscribeToSiteInfo,
  subscribeToMenuCategories,
  subscribeToAdminPassword,
  enqueueMenuItemsBatchSave,
  enqueueMenuCategoriesSave,
  enqueueSiteInfoSave,
  enqueueLogoSave,
  enqueueEmblemSave,
  enqueueGalleryPostsSave
} from './services/firebaseService';
import { navigateToSection, getRouteByPath, getRouteById } from './utils/navigationRouter';
import { safeFetchJson } from './utils/safeFetch';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const route = getRouteByPath(pathname) || (hash ? getRouteByPath(hash) : undefined);
      if (route) return route.id;
    }
    return 'hero';
  });
  const isNavigatingRef = useRef(false);

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('deolinda_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cartDrawerTab, setCartDrawerTab] = useState<'order' | 'history' | 'account'>('order');

  // Dynamic Menu Items State (Synchronized with Firestore, backend API and localStorage)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('deolinda_custom_menu_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MENU_ITEMS;
  });

  // Dynamic Menu Categories (Botões do Cardápio)
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(() => {
    try {
      const saved = localStorage.getItem('deolinda_custom_menu_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed
            .filter((c: any) => c && c.id !== 'antipasti' && c.label !== 'Entradas & Aperitivos')
            .map((c: any) => c.id === 'bevande' ? { ...c, label: 'Bebidas' } : c);
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch {}
    return DEFAULT_MENU_CATEGORIES;
  });

  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() => {
    try {
      const saved = localStorage.getItem('deolinda_custom_social_posts') || localStorage.getItem('deolinda_custom_gallery_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SOCIAL_POSTS;
  });

  const cleanSiteInfoSubtitle = (info: SiteInfo): SiteInfo => {
    if (!info || typeof info !== 'object') return info;
    if (
      !info.heroSubtitle ||
      info.heroSubtitle.includes('D.O.P') ||
      info.heroSubtitle.includes('DOP') ||
      info.heroSubtitle.includes('450') ||
      info.heroSubtitle.includes('farinha italiana Tipo 00')
    ) {
      return {
        ...info,
        heroSubtitle: DEFAULT_SITE_INFO.heroSubtitle
      };
    }
    return info;
  };

  const [siteInfo, setSiteInfo] = useState<SiteInfo>(() => {
    try {
      const saved = localStorage.getItem('deolinda_custom_site_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return cleanSiteInfoSubtitle({ ...DEFAULT_SITE_INFO, ...parsed });
        }
      }
    } catch {}
    return DEFAULT_SITE_INFO;
  });

  const handleOpenAuth = () => {
    setCartDrawerTab('account');
    setIsCartOpen(true);
  };

  const handleOpenCart = () => {
    if (!currentUser) {
      setCartDrawerTab('account');
    } else {
      setCartDrawerTab('order');
    }
    setIsCartOpen(true);
  };

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('deolinda_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('deolinda_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'ORD-8491',
        customerName: 'Matheus Silveira',
        phone: '(11) 98765-4321',
        items: [
          { name: 'Margherita Verace', quantity: 2, price: 136.0, crust: 'Borda Clássica Napoletana', notes: 'Bastante manjericão fresco' },
          { name: 'Cannoli Siciliani Tradizionali', quantity: 2, price: 56.0 }
        ],
        total: 192.0,
        type: 'delivery',
        address: 'Rua Augusta, 1420 - Apto 82, Consolação',
        paymentMethod: 'Pix',
        status: 'baking',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        estimatedMinutes: 20
      },
      {
        id: 'ORD-8492',
        customerName: 'Camila Fernandes',
        phone: '(11) 97123-8899',
        items: [
          { name: 'Deolinda Suprema al Tartufo', quantity: 1, price: 107.0, crust: 'Borda Recheada com Ricotta de Búfala', notes: '' },
          { name: 'Burrata al Forno a Legna', quantity: 1, price: 48.0 },
          { name: 'Chianti Classico DOCG (750ml)', quantity: 1, price: 145.0 }
        ],
        total: 300.0,
        type: 'table',
        tableNumber: 'Mesa 03 (Jardim do Forno)',
        paymentMethod: 'Cartão',
        status: 'preparing',
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        estimatedMinutes: 25
      },
      {
        id: 'ORD-8493',
        customerName: 'Luciano Rossi',
        phone: '(11) 99341-2030',
        items: [
          { name: 'Mortadella & Pistacchio di Bronte', quantity: 1, price: 86.0, crust: 'Borda Clássica Napoletana', notes: '' },
          { name: 'Tiramisù Tradizionale al Mascarpone', quantity: 1, price: 32.0 }
        ],
        total: 118.0,
        type: 'pickup',
        paymentMethod: 'Pix',
        status: 'received',
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        estimatedMinutes: 30
      }
    ];
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem('deolinda_reservations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'RES-401',
        name: 'Giulia Bertolli',
        email: 'giulia.bertolli@gmail.com',
        phone: '(11) 98877-6655',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        guests: 4,
        area: 'Jardim do Forno a Lenha',
        occasion: 'Aniversário',
        notes: 'Mesa próxima ao forno para vermos os pizzaiolos.',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      },
      {
        id: 'RES-402',
        name: 'Rodrigo Mendonça',
        email: 'rodrigo.m@outlook.com',
        phone: '(11) 97654-3210',
        date: new Date().toISOString().split('T')[0],
        time: '21:00',
        guests: 2,
        area: 'Varanda Rústica Romântica',
        occasion: 'Jantar Romântico',
        notes: 'Comemoração de aniversário de namoro.',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [customAdminPassword, setCustomAdminPassword] = useState<string | null>(() => {
    try {
      return localStorage.getItem('deolinda_admin_password');
    } catch {
      return null;
    }
  });

  // Real-Time Customer Order Live Tracking Modal & Persistent Active Order
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('deolinda_active_tracking_order');
      if (saved) {
        const parsed: Order = JSON.parse(saved);
        if (parsed && parsed.status !== 'completed' && parsed.status !== 'cancelled') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Custom Header Logo State & Modal
  // Custom Header Logo & Attached Emblem State
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('deolinda_custom_logo');
    } catch {
      return null;
    }
  });

  const [customEmblemUrl, setCustomEmblemUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('deolinda_custom_emblem');
    } catch {
      return null;
    }
  });

  const [isEmblemEnabled, setIsEmblemEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('deolinda_custom_emblem_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoModalInitialTab, setLogoModalInitialTab] = useState<'logo' | 'emblem'>('logo');

  // Subscribe to real-time Cloud Firestore logo & emblem updates across all devices
  useEffect(() => {
    // 1. Subscribe to Cloud Firestore in real time for all brand settings
    const unsubscribeBrand = subscribeToBrandSettings(({ logoUrl, emblemUrl, emblemEnabled }) => {
      console.log('[App] Real-time brand settings from Firestore:', { logoUrl, emblemUrl, emblemEnabled });
      setCustomLogoUrl(logoUrl);
      setCustomEmblemUrl(emblemUrl);
      setIsEmblemEnabled(emblemEnabled);
      try {
        if (logoUrl) {
          localStorage.setItem('deolinda_custom_logo', logoUrl);
        } else {
          localStorage.removeItem('deolinda_custom_logo');
        }

        if (emblemUrl) {
          localStorage.setItem('deolinda_custom_emblem', emblemUrl);
        } else {
          localStorage.removeItem('deolinda_custom_emblem');
        }

        localStorage.setItem('deolinda_custom_emblem_enabled', String(emblemEnabled));
      } catch {}
    });

    // 2. Fetch from backend API as initial quick fallback (safe on static hosting/deploy)
    safeFetchJson<{ logoUrl?: string | null }>('/api/settings/logo').then(data => {
      if (data && data.logoUrl) {
        setCustomLogoUrl(prev => prev || data.logoUrl || null);
        try {
          localStorage.setItem('deolinda_custom_logo', data.logoUrl);
        } catch {}
      }
    });

    safeFetchJson<{ emblemUrl?: string | null; emblemEnabled?: boolean }>('/api/settings/emblem').then(data => {
      if (data && data.emblemUrl) {
        setCustomEmblemUrl(prev => prev || data.emblemUrl || null);
        setIsEmblemEnabled(data.emblemEnabled !== false);
        try {
          localStorage.setItem('deolinda_custom_emblem', data.emblemUrl);
          localStorage.setItem('deolinda_custom_emblem_enabled', String(data.emblemEnabled !== false));
        } catch {}
      }
    });

    // 2. Fetch menu items from backend API
    safeFetchJson<{ items?: MenuItem[] }>('/api/settings/menu').then(data => {
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setMenuItems(prev => {
          if (prev.length > (data.items?.length || 0) && prev !== MENU_ITEMS) {
            return prev;
          }
          return data.items || prev;
        });
        try {
          localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(data.items));
        } catch {}
      }
    });

    // 3. Subscribe to Firestore menu items in real-time
    const unsubMenu = subscribeToMenuItems((items) => {
      if (items && items.length > 0) {
        setMenuItems(items);
      }
    });

    // 4. Fetch gallery posts from backend API
    safeFetchJson<{ posts?: SocialPost[] }>('/api/settings/gallery').then(data => {
      if (data && Array.isArray(data.posts) && data.posts.length > 0) {
        setSocialPosts(data.posts);
        localStorage.setItem('deolinda_custom_social_posts', JSON.stringify(data.posts));
      }
    });

    // 5. Subscribe to Firestore gallery posts in real-time
    const unsubGallery = subscribeToGalleryPosts((posts) => {
      if (posts && posts.length > 0) {
        setSocialPosts(posts);
      }
    });

    // 6. Fetch site info from backend API
    safeFetchJson<{ siteInfo?: SiteInfo }>('/api/settings/site-info').then(data => {
      if (data && data.siteInfo && typeof data.siteInfo === 'object') {
        const cleaned = cleanSiteInfoSubtitle({ ...DEFAULT_SITE_INFO, ...data.siteInfo });
        setSiteInfo(cleaned);
        localStorage.setItem('deolinda_custom_site_info', JSON.stringify(cleaned));
      }
    });

    // 7. Subscribe to Firestore site info in real-time
    const unsubSiteInfo = subscribeToSiteInfo((info) => {
      if (info && typeof info === 'object') {
        const cleaned = cleanSiteInfoSubtitle({ ...DEFAULT_SITE_INFO, ...info });
        setSiteInfo(cleaned);
        localStorage.setItem('deolinda_custom_site_info', JSON.stringify(cleaned));
      }
    });

    // 8. Fetch menu categories from backend API
    safeFetchJson<{ categories?: MenuCategory[] }>('/api/settings/categories').then(data => {
      if (data && Array.isArray(data.categories) && data.categories.length > 0) {
        const cleaned = data.categories
          .filter((c: any) => c && c.id !== 'antipasti' && c.label !== 'Entradas & Aperitivos')
          .map((c: any) => c.id === 'bevande' ? { ...c, label: 'Bebidas' } : c);
        setMenuCategories(cleaned);
        localStorage.setItem('deolinda_custom_menu_categories', JSON.stringify(cleaned));
      }
    });

    // 9. Subscribe to Firestore menu categories in real-time
    const unsubCategories = subscribeToMenuCategories((cats) => {
      if (cats && cats.length > 0) {
        const cleaned = cats
          .filter((c: any) => c && c.id !== 'antipasti' && c.label !== 'Entradas & Aperitivos')
          .map((c: any) => c.id === 'bevande' ? { ...c, label: 'Bebidas' } : c);
        setMenuCategories(cleaned);
      }
    });

    // 10. Subscribe to Firestore admin password in real-time
    const unsubAdminPwd = subscribeToAdminPassword((pwd) => {
      setCustomAdminPassword(pwd);
      try {
        if (pwd) {
          localStorage.setItem('deolinda_admin_password', pwd);
        } else {
          localStorage.removeItem('deolinda_admin_password');
        }
      } catch {}
    });

    return () => {
      unsubscribeBrand();
      unsubMenu();
      unsubGallery();
      unsubSiteInfo();
      unsubCategories();
      unsubAdminPwd();
    };
  }, []);

  const handleOptimisticMenuItemsUpdated = (updatedItems: MenuItem[]) => {
    setMenuItems(updatedItems);
    try {
      localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(updatedItems));
    } catch {}
    enqueueMenuItemsBatchSave(updatedItems);
  };

  const handleOptimisticMenuCategoriesUpdated = (updatedCategories: MenuCategory[]) => {
    setMenuCategories(updatedCategories);
    try {
      localStorage.setItem('deolinda_custom_menu_categories', JSON.stringify(updatedCategories));
    } catch {}
    enqueueMenuCategoriesSave(updatedCategories);
  };

  const handleOptimisticSiteInfoUpdated = (updatedInfo: SiteInfo) => {
    setSiteInfo(updatedInfo);
    try {
      localStorage.setItem('deolinda_custom_site_info', JSON.stringify(updatedInfo));
    } catch {}
    enqueueSiteInfoSave(updatedInfo);
  };

  const handleOptimisticSocialPostsUpdated = (updatedPosts: SocialPost[]) => {
    setSocialPosts(updatedPosts);
    try {
      const jsonStr = JSON.stringify(updatedPosts);
      localStorage.setItem('deolinda_custom_gallery_posts', jsonStr);
      localStorage.setItem('deolinda_custom_social_posts', jsonStr);
    } catch {}
    enqueueGalleryPostsSave(updatedPosts);
  };

  const handleLogoUpdated = (newUrl: string | null) => {
    setCustomLogoUrl(newUrl);
    enqueueLogoSave(newUrl);
  };

  const handleEmblemUpdated = (newUrl: string | null, enabled: boolean = true) => {
    setCustomEmblemUrl(newUrl);
    setIsEmblemEnabled(enabled);
    enqueueEmblemSave(newUrl, enabled);
  };

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deolinda_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Persist orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deolinda_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Persist reservations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deolinda_reservations', JSON.stringify(reservations));
    } catch (e) {
      console.error(e);
    }
  }, [reservations]);

  // Real-time Cloud Firestore subscription for Orders and Reservations
  useEffect(() => {
    // 1. Subscribe to Cloud Firestore orders in real-time
    const unsubscribeOrders = subscribeToOrders((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);

        // Also update active tracking order with latest status if exists
        if (activeTrackingOrder?.id) {
          const matched = cloudOrders.find((o: Order) => o.id === activeTrackingOrder.id);
          if (matched) {
            if (matched.status === 'completed' || matched.status === 'cancelled') {
              setActiveTrackingOrder(null);
              setIsTrackingModalOpen(false);
              try {
                localStorage.removeItem('deolinda_active_tracking_order');
              } catch {
                // ignore
              }
            } else if (matched.status !== activeTrackingOrder.status) {
              setActiveTrackingOrder(matched);
              try {
                localStorage.setItem('deolinda_active_tracking_order', JSON.stringify(matched));
              } catch {
                // ignore
              }
            }
          }
        }
      }
    });

    // 2. Subscribe to Cloud Firestore reservations in real-time
    const unsubscribeReservations = subscribeToReservations((cloudReservations) => {
      if (cloudReservations && cloudReservations.length > 0) {
        setReservations(cloudReservations);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeReservations();
    };
  }, [activeTrackingOrder?.id, activeTrackingOrder?.status]);

  // Fallback backend polling for server routes (safe on static hosting)
  const syncBackendData = async () => {
    try {
      const data = await safeFetchJson<{ orders?: Order[] }>('/api/orders', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (data && Array.isArray(data.orders) && data.orders.length > 0) {
        setOrders((prev) => {
          if (prev.length === 0) return data.orders || [];
          const map = new Map<string, Order>();
          prev.forEach(o => map.set(o.id, o));
          (data.orders || []).forEach((o: Order) => map.set(o.id, o));
          return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
      }
    } catch {
      // Handled by Firestore
    }
  };

  // Cart operations
  const handleAddToCart = (newItem: CartItem) => {
    if (!currentUser) {
      handleOpenAuth();
      return;
    }

    setCartItems((prev) => {
      // Check if identical item configuration exists
      const existingIndex = prev.findIndex(
        (it) =>
          it.menuItem.id === newItem.menuItem.id &&
          it.crustOption === newItem.crustOption &&
          JSON.stringify(it.extraIngredients) === JSON.stringify(newItem.extraIngredients) &&
          it.specialNotes === newItem.specialNotes
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + newItem.quantity;
        const unitPrice = existing.itemTotalPrice / existing.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          itemTotalPrice: unitPrice * newQty
        };
        return updated;
      }

      return [...prev, newItem];
    });
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const unitPrice = item.itemTotalPrice / item.quantity;
          return {
            ...item,
            quantity: newQty,
            itemTotalPrice: unitPrice * newQty
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderPlaced = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setActiveTrackingOrder(newOrder);
    setIsTrackingModalOpen(true);
    try {
      localStorage.setItem('deolinda_active_tracking_order', JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  };

  const handleReservationCreated = (newRes: Reservation) => {
    setReservations((prev) => [newRes, ...prev]);
  };

  const handleOrderCompleted = () => {
    setActiveTrackingOrder(null);
    setIsTrackingModalOpen(false);
    try {
      localStorage.removeItem('deolinda_active_tracking_order');
    } catch {
      // ignore
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    // Sync tracked order if matching
    if (activeTrackingOrder && activeTrackingOrder.id === orderId) {
      if (status === 'completed' || status === 'cancelled') {
        setActiveTrackingOrder(null);
        setIsTrackingModalOpen(false);
        try {
          localStorage.removeItem('deolinda_active_tracking_order');
        } catch {
          // ignore
        }
      } else {
        const updated = { ...activeTrackingOrder, status };
        setActiveTrackingOrder(updated);
        try {
          localStorage.setItem('deolinda_active_tracking_order', JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
    }

    // 1. Sync status directly to Cloud Firestore
    try {
      await updateOrderStatusInFirestore(orderId, status);
    } catch (err) {
      console.warn('Firestore status update error:', err);
    }

    // 2. Also notify backend API endpoint
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {
      // Handled
    }
  };

  const handleUpdateReservationStatus = async (resId: string, status: any) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, status } : r))
    );
    try {
      await fetch(`/api/reservations/${resId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {
      // Handled
    }
  };

  const handleNavigate = (id: string, pathOverride?: string, pushHistory = true) => {
    setActiveSection(id);
    navigateToSection(id, pathOverride, pushHistory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminAuth = () => {
    setIsAdminAuthOpen(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState({ section: 'admin' }, '', '/admin');
    }
    document.title = 'Área do Administrador | Deolinda Pizzaria Napoletana';
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthOpen(false);
    setIsAdminOpen(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState({ section: 'admin' }, '', '/admin');
    }
    document.title = 'Painel do Administrador | Deolinda Pizzaria Napoletana';
  };

  const handleCloseAdminAuth = () => {
    setIsAdminAuthOpen(false);
    if (!isAdminOpen && window.location.pathname === '/admin') {
      const route = getRouteById(activeSection);
      window.history.pushState({ section: activeSection }, '', route ? route.path : '/');
      document.title = route ? route.title : 'Deolinda Pizzaria Napoletana | Fermentação Lenta & Tradição';
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    setIsAdminAuthOpen(false);
    try {
      sessionStorage.removeItem('deolinda_admin_authenticated');
      localStorage.removeItem('deolinda_admin_authenticated');
    } catch {}
    const route = getRouteById(activeSection);
    const targetPath = route ? route.path : '/';
    if (window.location.pathname === '/admin') {
      window.history.pushState({ section: activeSection }, '', targetPath);
    }
    document.title = route ? route.title : 'Deolinda Pizzaria Napoletana | Fermentação Lenta & Tradição';
  };

  // 1. Initial deep linking by pathname or hash, and browser history popstate
  useEffect(() => {
    const resolveCurrentRoute = () => {
      const currentPath = window.location.pathname;
      const currentHash = window.location.hash;

      if (currentPath === '/admin' || currentHash === '#admin' || currentHash === '#/admin') {
        setIsAdminAuthOpen(true);
        document.title = 'Área do Administrador | Deolinda Pizzaria Napoletana';
        return;
      }

      const route = getRouteByPath(currentPath) || (currentHash ? getRouteByPath(currentHash) : undefined);
      if (route) {
        setActiveSection(route.id);
        document.title = route.title;
      } else {
        setActiveSection('hero');
        document.title = 'Deolinda Pizzaria Napoletana | Fermentação Lenta & Tradição';
      }
    };

    resolveCurrentRoute();

    const handleNavigationEvent = () => {
      const currentPath = window.location.pathname;
      const currentHash = window.location.hash;

      if (currentPath === '/admin' || currentHash === '#admin' || currentHash === '#/admin') {
        setIsAdminAuthOpen(true);
        return;
      } else {
        setIsAdminOpen(false);
        setIsAdminAuthOpen(false);
      }

      const route = getRouteByPath(currentPath) || (currentHash ? getRouteByPath(currentHash) : undefined);
      if (route) {
        setActiveSection(route.id);
        document.title = route.title;
      } else {
        setActiveSection('hero');
        document.title = 'Deolinda Pizzaria Napoletana | Fermentação Lenta & Tradição';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handleNavigationEvent);
    window.addEventListener('hashchange', handleNavigationEvent);
    return () => {
      window.removeEventListener('popstate', handleNavigationEvent);
      window.removeEventListener('hashchange', handleNavigationEvent);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#181513] font-sans selection:bg-[#C24D2C] selection:text-white transition-colors duration-200">
      
      {/* Navigation */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        currentUser={currentUser}
        customLogoUrl={customLogoUrl}
        customEmblemUrl={customEmblemUrl}
        isEmblemEnabled={isEmblemEnabled}
        siteInfo={siteInfo}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Content: Renderiza uma página diferente para cada link do menu */}
      <main className="flex-grow">
        {/* Página 1: Cardápio (/cardapio) */}
        {activeSection === 'cardapio' && (
          <div className="animate-fade-in">
            <MenuSection 
              menuItems={menuItems}
              menuCategories={menuCategories}
              onAddToCart={handleAddToCart}
              currentUser={currentUser}
              onRequireLogin={handleOpenAuth}
              siteInfo={siteInfo}
            />
          </div>
        )}

        {/* Página 3: Nossa História & Tradição (/historia) */}
        {activeSection === 'historia' && (
          <div className="animate-fade-in">
            <StorySection siteInfo={siteInfo} />
          </div>
        )}

        {/* Página 4: Fotos & Momentos (/galeria) */}
        {activeSection === 'galeria' && (
          <div className="animate-fade-in">
            <SocialFeedSection posts={socialPosts} />
          </div>
        )}

        {/* Página 5: Localização & Horários (/localizacao) */}
        {activeSection === 'localizacao' && (
          <div className="animate-fade-in">
            <LocationSection siteInfo={siteInfo} />
          </div>
        )}

        {/* Página Inicial: Home (/) */}
        {activeSection === 'hero' && (
          <div className="animate-fade-in">
            <Hero
              customLogoUrl={customLogoUrl}
              customEmblemUrl={customEmblemUrl}
              isEmblemEnabled={isEmblemEnabled}
              siteInfo={siteInfo}
              onNavigate={handleNavigate}
            />
            {/* Galeria de Fotos e Momentos da Pizzaria na Página Inicial */}
            <SocialFeedSection posts={socialPosts} />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={handleOpenAdminAuth}
        siteInfo={siteInfo}
        customLogoUrl={customLogoUrl}
        onNavigate={handleNavigate}
      />

      {/* Slide-out Order Cart */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        currentUser={currentUser}
        onUpdateUser={setCurrentUser}
        initialTab={cartDrawerTab}
        onOpenAdmin={handleOpenAdminAuth}
        onOpenTracking={(ord) => {
          setActiveTrackingOrder(ord);
          setIsTrackingModalOpen(true);
        }}
      />

      {/* Live Order Tracking Modal Window */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen && !!activeTrackingOrder && activeTrackingOrder.status !== 'completed' && activeTrackingOrder.status !== 'cancelled'}
        order={activeTrackingOrder}
        onClose={() => setIsTrackingModalOpen(false)}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Administrator Protected Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={handleCloseAdminAuth}
        onSuccess={handleAdminAuthSuccess}
        customAdminPassword={customAdminPassword}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        menuItems={menuItems}
        onMenuItemsUpdated={handleOptimisticMenuItemsUpdated}
        menuCategories={menuCategories}
        onMenuCategoriesUpdated={handleOptimisticMenuCategoriesUpdated}
        socialPosts={socialPosts}
        onSocialPostsUpdated={handleOptimisticSocialPostsUpdated}
        siteInfo={siteInfo}
        onSiteInfoUpdated={handleOptimisticSiteInfoUpdated}
        orders={orders}
        reservations={reservations}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateReservationStatus={handleUpdateReservationStatus}
        onRefreshOrders={syncBackendData}
        customLogoUrl={customLogoUrl}
        customEmblemUrl={customEmblemUrl}
        isEmblemEnabled={isEmblemEnabled}
        customAdminPassword={customAdminPassword}
        onAdminPasswordUpdated={setCustomAdminPassword}
        onOpenLogoModal={(initialTab) => {
          setLogoModalInitialTab(initialTab || 'logo');
          setIsLogoModalOpen(true);
        }}
        onEmblemUpdated={handleEmblemUpdated}
        onLogoUpdated={handleLogoUpdated}
      />

      {/* Logo & Attached Emblem Upload Modal (Overlaid on top of all pages, dashboards and modals) */}
      <LogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogoUrl={customLogoUrl}
        currentEmblemUrl={customEmblemUrl}
        isEmblemEnabled={isEmblemEnabled}
        initialTab={logoModalInitialTab}
        onLogoUpdated={handleLogoUpdated}
        onEmblemUpdated={handleEmblemUpdated}
      />

    </div>
  );
}
