import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  getDocFromServer,
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, Reservation, OrderStatus, MenuItem, SocialPost, SiteInfo, MenuCategory } from '../types';

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if configured
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

/**
 * Validates Firestore database connectivity at startup.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Connected to Cloud Firestore successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline or database configuration needs attention:', error.message);
    } else {
      console.log('[Firestore] Connectivity probe verified (database reachable).');
    }
    return true;
  }
}

// Run connection probe asynchronously
testFirestoreConnection().catch(() => {});

/**
 * Saves the custom brand logo to Cloud Firestore.
 * Broadcasts in real-time across all connected devices and browsers.
 */
export async function saveLogoToFirestore(logoUrl: string | null): Promise<void> {
  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    await setDoc(brandDocRef, {
      logoUrl: logoUrl || null,
      updatedAt: new Date().toISOString(),
      type: 'logo',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Brand logo saved to Cloud Firestore successfully:', logoUrl ? 'Custom Logo' : 'Reset to Default');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving logo to Firestore, utilizing server sync:', error?.message || error);
  }

  // Always synchronize with backend API
  try {
    await fetch('/api/settings/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl })
    });
  } catch (backendErr) {
    console.warn('[Backend] Logo sync fallback:', backendErr);
  }

  try {
    if (logoUrl) {
      localStorage.setItem('deolinda_custom_logo', logoUrl);
    } else {
      localStorage.removeItem('deolinda_custom_logo');
    }
  } catch {}
}

/**
 * Reads the current custom brand logo from Cloud Firestore once.
 */
export async function getLogoFromFirestore(): Promise<string | null> {
  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    const snap = await getDoc(brandDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data && typeof data.logoUrl === 'string') ? data.logoUrl : null;
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] Error fetching brand logo from Firestore:', error);
    return null;
  }
}

/**
 * Subscribes to real-time custom brand logo updates from Cloud Firestore.
 * Any device that uploads or changes the logo will instantly trigger this callback
 * on all other connected devices without needing a page refresh.
 */
export function subscribeToLogo(
  onLogoUpdate: (logoUrl: string | null) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    const unsubscribe = onSnapshot(
      brandDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const logo = (data && typeof data.logoUrl === 'string') ? data.logoUrl : null;
          onLogoUpdate(logo);
        } else {
          onLogoUpdate(null);
        }
      },
      (err) => {
        console.warn('[Firestore] Logo real-time subscription error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firestore] Could not establish logo subscription:', error);
    return () => {};
  }
}

/**
 * Saves the custom attached emblem / lettering image to Cloud Firestore.
 * Placed next to header logo and below hero logo in the main page.
 */
export async function saveEmblemToFirestore(emblemUrl: string | null, enabled: boolean = true): Promise<void> {
  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    await setDoc(brandDocRef, {
      emblemUrl: emblemUrl || null,
      emblemEnabled: enabled,
      emblemUpdatedAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Brand emblem saved to Cloud Firestore:', emblemUrl ? 'Custom Emblem' : 'Removed');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving emblem to Firestore, utilizing server sync:', error?.message || error);
  }

  // Always synchronize with backend API
  try {
    await fetch('/api/settings/emblem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emblemUrl, enabled })
    });
  } catch (backendErr) {
    console.warn('[Backend] Emblem sync fallback:', backendErr);
  }

  try {
    if (emblemUrl) {
      localStorage.setItem('deolinda_custom_emblem', emblemUrl);
    } else {
      localStorage.removeItem('deolinda_custom_emblem');
    }
    localStorage.setItem('deolinda_custom_emblem_enabled', String(enabled));
  } catch {}
}

/**
 * Reads the current custom attached emblem from Cloud Firestore once.
 */
export async function getEmblemFromFirestore(): Promise<{ emblemUrl: string | null; enabled: boolean }> {
  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    const snap = await getDoc(brandDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        emblemUrl: (data && typeof data.emblemUrl === 'string') ? data.emblemUrl : null,
        enabled: data && data.emblemEnabled !== undefined ? Boolean(data.emblemEnabled) : true
      };
    }
    return { emblemUrl: null, enabled: true };
  } catch (error) {
    console.warn('[Firestore] Error fetching brand emblem from Firestore:', error);
    return { emblemUrl: null, enabled: true };
  }
}

/**
 * Subscribes to real-time custom brand settings (both primary logo and attached emblem)
 */
export function subscribeToBrandSettings(
  onUpdate: (settings: { logoUrl: string | null; emblemUrl: string | null; emblemEnabled: boolean }) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    const unsubscribe = onSnapshot(
      brandDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const logo = (data && typeof data.logoUrl === 'string') ? data.logoUrl : null;
          const emblem = (data && typeof data.emblemUrl === 'string') ? data.emblemUrl : null;
          const enabled = data && data.emblemEnabled !== undefined ? Boolean(data.emblemEnabled) : true;
          onUpdate({ logoUrl: logo, emblemUrl: emblem, emblemEnabled: enabled });
        } else {
          onUpdate({ logoUrl: null, emblemUrl: null, emblemEnabled: true });
        }
      },
      (err) => {
        console.warn('[Firestore] Brand settings real-time subscription error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firestore] Could not establish brand settings subscription:', error);
    return () => {};
  }
}

/**
 * Saves or pushes a new pizza order to Cloud Firestore.
 * Automatically broadcasts to all connected admin and customer devices in real-time.
 */
export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', order.id);
    const cleanOrderData: Record<string, any> = {
      id: order.id,
      customerName: order.customerName || 'Cliente',
      phone: order.phone || '',
      total: Number(order.total || 0),
      type: order.type || 'delivery',
      paymentMethod: order.paymentMethod || 'Pix',
      status: order.status || 'received',
      createdAt: order.createdAt || new Date().toISOString(),
      estimatedMinutes: Number(order.estimatedMinutes || 35),
      items: order.items.map(item => ({
        name: item.name || 'Pizza',
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        crust: item.crust || 'Tradicional Napolitana',
        notes: item.notes || '',
        extras: item.extras || []
      })),
      _updatedAt: serverTimestamp()
    };

    if (order.email) cleanOrderData.email = order.email;
    if (order.address) cleanOrderData.address = order.address;
    if (order.tableNumber) cleanOrderData.tableNumber = order.tableNumber;
    if (typeof order.customerLoyaltyPoints === 'number') cleanOrderData.customerLoyaltyPoints = order.customerLoyaltyPoints;
    if (typeof order.pointsEarnedThisOrder === 'number') cleanOrderData.pointsEarnedThisOrder = order.pointsEarnedThisOrder;
    if (order.customerTier) cleanOrderData.customerTier = order.customerTier;
    if (order.customerMemberCode) cleanOrderData.customerMemberCode = order.customerMemberCode;
    if (typeof order.customerTotalOrders === 'number') cleanOrderData.customerTotalOrders = order.customerTotalOrders;

    await setDoc(orderDocRef, cleanOrderData, { merge: true });
    console.log(`[Firestore] Order ${order.id} persisted to Cloud Firestore successfully.`);
  } catch (error) {
    console.error('[Firestore] Error saving order to Firestore:', error);
    throw error;
  }
}

/**
 * Updates an order status in Cloud Firestore
 */
export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      status,
      _updatedAt: serverTimestamp()
    });
    console.log(`[Firestore] Order ${orderId} updated to status "${status}" in Cloud Firestore.`);
  } catch (error) {
    console.error('[Firestore] Error updating order status in Firestore:', error);
    throw error;
  }
}

/**
 * Subscribes to real-time pizza orders from Cloud Firestore.
 * Automatically notifies callback whenever any device places a new order or updates status.
 */
export function subscribeToOrders(
  onOrdersUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const ordersCol = collection(db, 'orders');
    const unsubscribe = onSnapshot(
      ordersCol,
      (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.id) {
            ordersList.push({
              id: data.id,
              customerName: data.customerName || 'Cliente',
              phone: data.phone || '',
              email: data.email,
              address: data.address,
              type: data.type || 'delivery',
              tableNumber: data.tableNumber,
              items: Array.isArray(data.items) ? data.items.map((it: any) => ({
                name: it.name || 'Item',
                quantity: Number(it.quantity || 1),
                price: Number(it.price || 0),
                crust: it.crust,
                notes: it.notes,
                extras: it.extras || []
              })) : [],
              total: Number(data.total || 0),
              paymentMethod: data.paymentMethod || 'Pix',
              status: (data.status as OrderStatus) || 'received',
              createdAt: data.createdAt || new Date().toISOString(),
              estimatedMinutes: Number(data.estimatedMinutes || 35),
              customerLoyaltyPoints: typeof data.customerLoyaltyPoints === 'number' ? data.customerLoyaltyPoints : undefined,
              pointsEarnedThisOrder: typeof data.pointsEarnedThisOrder === 'number' ? data.pointsEarnedThisOrder : undefined,
              customerTier: data.customerTier,
              customerMemberCode: data.customerMemberCode,
              customerTotalOrders: typeof data.customerTotalOrders === 'number' ? data.customerTotalOrders : undefined
            });
          }
        });

        // Sort descending by creation date
        ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onOrdersUpdate(ordersList);
      },
      (err) => {
        console.warn('[Firestore] Orders subscription error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('[Firestore] Could not establish Firestore subscription:', error);
    return () => {};
  }
}

/**
 * Saves a table reservation to Cloud Firestore
 */
export async function saveReservationToFirestore(reservation: Reservation): Promise<void> {
  try {
    const resDocRef = doc(db, 'reservations', reservation.id);
    const cleanResData: Record<string, any> = {
      id: reservation.id,
      name: reservation.name,
      phone: reservation.phone,
      email: reservation.email || '',
      guests: Number(reservation.guests || 2),
      date: reservation.date,
      time: reservation.time,
      status: reservation.status || 'confirmed',
      createdAt: reservation.createdAt || new Date().toISOString(),
      _updatedAt: serverTimestamp()
    };
    if (reservation.area) cleanResData.area = reservation.area;
    if (reservation.occasion) cleanResData.occasion = reservation.occasion;
    if (reservation.notes) cleanResData.notes = reservation.notes;

    await setDoc(resDocRef, cleanResData, { merge: true });
    console.log(`[Firestore] Reservation ${reservation.id} persisted to Cloud Firestore.`);
  } catch (error) {
    console.error('[Firestore] Error saving reservation to Firestore:', error);
    throw error;
  }
}

/**
 * Subscribes to real-time reservations from Cloud Firestore
 */
export function subscribeToReservations(
  onReservationsUpdate: (reservations: Reservation[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const reservationsCol = collection(db, 'reservations');
    const unsubscribe = onSnapshot(
      reservationsCol,
      (snapshot) => {
        const reservationsList: Reservation[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.id) {
            reservationsList.push({
              id: data.id,
              name: data.name || '',
              phone: data.phone || '',
              email: data.email || '',
              guests: Number(data.guests || 2),
              date: data.date || '',
              time: data.time || '',
              area: data.area || 'Jardim do Forno a Lenha',
              occasion: data.occasion,
              status: data.status || 'confirmed',
              notes: data.notes,
              createdAt: data.createdAt || new Date().toISOString()
            });
          }
        });
        onReservationsUpdate(reservationsList);
      },
      (err) => {
        console.warn('[Firestore] Reservations subscription error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('[Firestore] Could not establish Firestore reservations subscription:', error);
    return () => {};
  }
}

/**
 * Saves the full menu items collection to Cloud Firestore, backend, and localStorage.
 */
export async function saveMenuItemsToFirestore(items: MenuItem[]): Promise<void> {
  try {
    const menuDocRef = doc(db, 'settings', 'menu');
    await setDoc(menuDocRef, {
      items,
      updatedAt: new Date().toISOString(),
      type: 'menu_items',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Menu items saved successfully to Cloud Firestore.');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving menu items to Firestore:', error?.message || error);
  }

  // Backup to Express backend API
  try {
    await fetch('/api/settings/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
  } catch (e) {
    console.warn('[Backend] Menu save error:', e);
  }

  // Local storage fallback
  try {
    localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(items));
  } catch {}
}

/**
 * Subscribes to real-time menu items updates from Cloud Firestore
 */
export function subscribeToMenuItems(
  onUpdate: (items: MenuItem[]) => void
): () => void {
  try {
    const menuDocRef = doc(db, 'settings', 'menu');
    const unsubscribe = onSnapshot(menuDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          onUpdate(data.items);
          try {
            localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(data.items));
          } catch {}
        }
      }
    }, (err) => {
      console.warn('[Firestore] Menu subscription notice:', err?.message || err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Menu subscribe error:', err);
    return () => {};
  }
}

/**
 * Saves the full gallery / Fotos & Momentos posts collection to Cloud Firestore, backend, and localStorage.
 */
export async function saveGalleryPostsToFirestore(posts: SocialPost[]): Promise<void> {
  try {
    const galleryDocRef = doc(db, 'settings', 'gallery');
    await setDoc(galleryDocRef, {
      posts,
      updatedAt: new Date().toISOString(),
      type: 'gallery_posts',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Gallery posts saved successfully to Cloud Firestore.');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving gallery posts to Firestore:', error?.message || error);
  }

  // Backup to Express backend API
  try {
    await fetch('/api/settings/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts })
    });
  } catch (e) {
    console.warn('[Backend] Gallery save error:', e);
  }

  // Local storage fallback
  try {
    localStorage.setItem('deolinda_custom_social_posts', JSON.stringify(posts));
  } catch {}
}

/**
 * Subscribes to real-time gallery / Fotos & Momentos updates from Cloud Firestore
 */
export function subscribeToGalleryPosts(
  onUpdate: (posts: SocialPost[]) => void
): () => void {
  try {
    const galleryDocRef = doc(db, 'settings', 'gallery');
    const unsubscribe = onSnapshot(galleryDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.posts) && data.posts.length > 0) {
          onUpdate(data.posts);
          try {
            localStorage.setItem('deolinda_custom_social_posts', JSON.stringify(data.posts));
          } catch {}
        }
      }
    }, (err) => {
      console.warn('[Firestore] Gallery subscription notice:', err?.message || err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Gallery subscribe error:', err);
    return () => {};
  }
}

/**
 * Saves the full site information and text content to Cloud Firestore, backend, and localStorage.
 */
export async function saveSiteInfoToFirestore(siteInfo: SiteInfo): Promise<void> {
  try {
    const siteDocRef = doc(db, 'settings', 'site_info');
    await setDoc(siteDocRef, {
      siteInfo,
      updatedAt: new Date().toISOString(),
      type: 'site_info',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Site info saved successfully to Cloud Firestore.');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving site info to Firestore:', error?.message || error);
  }

  // Backup to Express backend API
  try {
    await fetch('/api/settings/site-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteInfo })
    });
  } catch (e) {
    console.warn('[Backend] Site info save error:', e);
  }

  // Local storage fallback
  try {
    localStorage.setItem('deolinda_custom_site_info', JSON.stringify(siteInfo));
  } catch {}
}

/**
 * Subscribes to real-time site info updates from Cloud Firestore
 */
export function subscribeToSiteInfo(
  onUpdate: (siteInfo: SiteInfo) => void
): () => void {
  try {
    const siteDocRef = doc(db, 'settings', 'site_info');
    const unsubscribe = onSnapshot(siteDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.siteInfo && typeof data.siteInfo === 'object') {
          onUpdate(data.siteInfo);
          try {
            localStorage.setItem('deolinda_custom_site_info', JSON.stringify(data.siteInfo));
          } catch {}
        }
      }
    }, (err) => {
      console.warn('[Firestore] Site info subscription notice:', err?.message || err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Site info subscribe error:', err);
    return () => {};
  }
}

/**
 * Saves the custom menu categories (buttons) to Cloud Firestore, backend, and localStorage.
 */
export async function saveMenuCategoriesToFirestore(categories: MenuCategory[]): Promise<void> {
  try {
    const catDocRef = doc(db, 'settings', 'menu_categories');
    await setDoc(catDocRef, {
      categories,
      updatedAt: new Date().toISOString(),
      type: 'menu_categories',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Menu categories saved successfully to Cloud Firestore.');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving menu categories to Firestore:', error?.message || error);
  }

  // Backup to Express backend API
  try {
    await fetch('/api/settings/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories })
    });
  } catch (e) {
    console.warn('[Backend] Menu categories save error:', e);
  }

  // Local storage fallback
  try {
    localStorage.setItem('deolinda_custom_menu_categories', JSON.stringify(categories));
  } catch {}
}

/**
 * Subscribes to real-time menu categories updates from Cloud Firestore
 */
export function subscribeToMenuCategories(
  onUpdate: (categories: MenuCategory[]) => void
): () => void {
  try {
    const catDocRef = doc(db, 'settings', 'menu_categories');
    const unsubscribe = onSnapshot(catDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.categories)) {
          onUpdate(data.categories);
          try {
            localStorage.setItem('deolinda_custom_menu_categories', JSON.stringify(data.categories));
          } catch {}
        }
      }
    }, (err) => {
      console.warn('[Firestore] Menu categories subscription notice:', err?.message || err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Menu categories subscribe error:', err);
    return () => {};
  }
}

/**
 * Saves the custom admin password to Cloud Firestore, backend API and localStorage.
 */
export async function saveAdminPasswordToFirestore(newPassword: string): Promise<void> {
  const cleanPassword = newPassword.trim();
  try {
    const authDocRef = doc(db, 'settings', 'admin_auth');
    await setDoc(authDocRef, {
      adminPassword: cleanPassword,
      updatedAt: new Date().toISOString(),
      type: 'admin_auth',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Admin password saved successfully to Cloud Firestore.');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving admin password to Firestore:', error?.message || error);
  }

  // Backup to Express backend API
  try {
    await fetch('/api/settings/admin-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: cleanPassword })
    });
  } catch (e) {
    console.warn('[Backend] Admin password save error:', e);
  }

  // Local storage fallback
  try {
    localStorage.setItem('deolinda_admin_password', cleanPassword);
  } catch {}
}

/**
 * Gets the custom admin password from Cloud Firestore once.
 */
export async function getAdminPasswordFromFirestore(): Promise<string | null> {
  try {
    const authDocRef = doc(db, 'settings', 'admin_auth');
    const snap = await getDoc(authDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && typeof data.adminPassword === 'string' && data.adminPassword.trim()) {
        return data.adminPassword.trim();
      }
    }
  } catch (error) {
    console.warn('[Firestore] Error getting admin password:', error);
  }
  return null;
}

/**
 * Subscribes to real-time admin password updates from Cloud Firestore.
 */
export function subscribeToAdminPassword(
  onUpdate: (password: string | null) => void
): () => void {
  try {
    const authDocRef = doc(db, 'settings', 'admin_auth');
    const unsubscribe = onSnapshot(authDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && typeof data.adminPassword === 'string' && data.adminPassword.trim()) {
          const pwd = data.adminPassword.trim();
          onUpdate(pwd);
          try {
            localStorage.setItem('deolinda_admin_password', pwd);
          } catch {}
          return;
        }
      }
      onUpdate(null);
    }, (err) => {
      console.warn('[Firestore] Admin password subscription notice:', err?.message || err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Admin password subscribe error:', err);
    return () => {};
  }
}


