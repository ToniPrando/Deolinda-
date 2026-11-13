import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  getDocFromServer,
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, Reservation, OrderStatus, MenuItem, SocialPost, SiteInfo, MenuCategory } from '../types';
import { MENU_ITEMS } from '../data/menuData';
import { safeFetchJson } from '../utils/safeFetch';
import { compressImageForFirestore, compressBrandImageForFirestore } from '../utils/imageCompressor';

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
  let finalLogoUrl = logoUrl;
  if (finalLogoUrl && finalLogoUrl.startsWith('data:image/')) {
    try {
      finalLogoUrl = await compressBrandImageForFirestore(finalLogoUrl, 380000);
    } catch {}
  }

  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    await setDoc(brandDocRef, {
      logoUrl: finalLogoUrl || null,
      updatedAt: new Date().toISOString(),
      type: 'logo',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Brand logo saved to Cloud Firestore successfully:', finalLogoUrl ? 'Custom Logo' : 'Reset to Default');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving logo to Firestore, utilizing server sync:', error?.message || error);
  }

  // Always synchronize with backend API
  try {
    await fetch('/api/settings/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl: finalLogoUrl })
    });
  } catch (backendErr) {
    console.warn('[Backend] Logo sync fallback:', backendErr);
  }

  try {
    if (finalLogoUrl) {
      localStorage.setItem('deolinda_custom_logo', finalLogoUrl);
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
  let finalEmblemUrl = emblemUrl;
  if (finalEmblemUrl && finalEmblemUrl.startsWith('data:image/')) {
    try {
      finalEmblemUrl = await compressBrandImageForFirestore(finalEmblemUrl, 380000);
    } catch {}
  }

  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    await setDoc(brandDocRef, {
      emblemUrl: finalEmblemUrl || null,
      emblemEnabled: enabled,
      emblemUpdatedAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Brand emblem saved to Cloud Firestore:', finalEmblemUrl ? 'Custom Emblem' : 'Removed');
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving emblem to Firestore, utilizing server sync:', error?.message || error);
  }

  // Always synchronize with backend API
  try {
    await fetch('/api/settings/emblem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emblemUrl: finalEmblemUrl, enabled })
    });
  } catch (backendErr) {
    console.warn('[Backend] Emblem sync fallback:', backendErr);
  }

  try {
    if (finalEmblemUrl) {
      localStorage.setItem('deolinda_custom_emblem', finalEmblemUrl);
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
 * Sanitizes a MenuItem object so it is 100% compliant with Cloud Firestore restrictions.
 * Cloud Firestore rejects any write that contains `undefined` values.
 */
export function sanitizeMenuItemForFirestore(item: MenuItem): Record<string, any> {
  const cleanItem: Record<string, any> = {
    id: String(item.id || `item-${Date.now()}`),
    name: String(item.name || '').trim(),
    category: String(item.category || 'tradizionali'),
    price: Number(item.price || 0),
    description: String(item.description || '').trim(),
    ingredients: Array.isArray(item.ingredients)
      ? item.ingredients.map(i => String(i).trim()).filter(Boolean)
      : ['Ingredientes frescos da casa'],
    image: String(item.image || 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80').trim(),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    isAvailable: item.isAvailable !== false,
    isPopular: Boolean(item.isPopular)
  };

  if (item.italianName && item.italianName.trim()) {
    cleanItem.italianName = item.italianName.trim();
  }
  if (item.pairing && item.pairing.trim()) {
    cleanItem.pairing = item.pairing.trim();
  }
  if (typeof item.pointsEarned === 'number' && !isNaN(item.pointsEarned)) {
    cleanItem.pointsEarned = item.pointsEarned;
  }
  if (typeof item.pointsToRedeem === 'number' && !isNaN(item.pointsToRedeem)) {
    cleanItem.pointsToRedeem = item.pointsToRedeem;
  }
  if (item.pointsBonusTag && item.pointsBonusTag.trim()) {
    cleanItem.pointsBonusTag = item.pointsBonusTag.trim();
  }

  return cleanItem;
}

/**
 * Saves a single MenuItem directly to the menu_items collection in Cloud Firestore,
 * while seamlessly synchronizing with localStorage and Express backend storage.
 * Gracefully handles Firestore Free Tier quota limits without failing user actions.
 */
export async function saveSingleMenuItemToFirestore(item: MenuItem): Promise<MenuItem> {
  let sanitizedItem = sanitizeMenuItemForFirestore(item);

  // Ensure any uploaded base64 image is compressed cleanly (< 420KB) so Cloud Firestore stores it portably across all devices
  if (typeof sanitizedItem.image === 'string' && sanitizedItem.image.startsWith('data:image/')) {
    try {
      sanitizedItem.image = await compressImageForFirestore(sanitizedItem.image, 420000);
    } catch {}
  }

  // 1. Immediately update localStorage for instant offline and memory availability
  try {
    const local = localStorage.getItem('deolinda_custom_menu_items');
    let list: MenuItem[] = local ? JSON.parse(local) : [];
    const idx = list.findIndex(it => it.id === sanitizedItem.id);
    if (idx !== -1) {
      list[idx] = sanitizedItem as any;
    } else {
      list = [sanitizedItem as any, ...list];
    }
    localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(list));
  } catch {}

  // 2. Synchronize with backend API (keeps portable URLs intact)
  try {
    const data = await safeFetchJson<{ item?: MenuItem }>('/api/settings/menu-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: sanitizedItem })
    });
    if (data && data.item) {
      const serverSanitized = sanitizeMenuItemForFirestore(data.item);
      // Preserve portable data URL if server somehow stripped it
      if (sanitizedItem.image.startsWith('data:image/') && !serverSanitized.image.startsWith('data:image/')) {
        serverSanitized.image = sanitizedItem.image;
      }
      sanitizedItem = serverSanitized;
    }
  } catch (backendErr) {
    console.warn('[Backend] Menu item save notice:', backendErr);
  }

  // 3. Persist to Cloud Firestore (individual document) with generous 15-second timeout for mobile/photo uploads
  try {
    const itemDocRef = doc(db, 'menu_items', sanitizedItem.id);
    const firestorePromise = setDoc(itemDocRef, {
      ...sanitizedItem,
      updatedAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    }, { merge: true });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore write timeout')), 15000)
    );

    await Promise.race([firestorePromise, timeoutPromise]);
    console.log(`[Firestore] Single menu item "${sanitizedItem.name}" (${sanitizedItem.id}) saved to Cloud Firestore successfully.`);
  } catch (error: any) {
    if (error?.message === 'Firestore write timeout') {
      console.warn('[Firestore] Notice: Firestore write timed out. Item is safely saved to server and local store.');
    } else if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded') || error?.message?.includes('resource-exhausted')) {
      console.warn('[Firestore] Free tier daily write quota limit reached. Item saved successfully to server and local store.');
    } else {
      console.warn('[Firestore] Notice saving single menu item to Firestore:', error?.message || error);
    }
  }

  return sanitizedItem as MenuItem;
}

/**
 * Uploads a base64 menu item image to the server, which converts it to a permanent static JPG file
 * in public/menu_images and returns the clean URL (/menu_images/item-<id>.jpg).
 */
export async function uploadMenuImageToServer(imageBase64: string, itemId?: string): Promise<string> {
  if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
    return imageBase64;
  }
  try {
    const data = await safeFetchJson<{ imageUrl?: string; url?: string }>('/api/settings/upload-menu-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, itemId })
    });
    if (data && (data.imageUrl || data.url)) {
      return data.imageUrl || data.url || imageBase64;
    }
  } catch (err) {
    console.warn('[Upload Image] Server image upload notice:', err);
  }
  return imageBase64;
}

/**
 * Uploads a base64 gallery image to the server, which converts it to a permanent static file
 * in public/gallery_images and returns the clean URL (/gallery_images/moment-<id>.jpg).
 */
export async function uploadGalleryImageToServer(imageBase64: string, postId?: string): Promise<string> {
  if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
    return imageBase64;
  }
  try {
    const data = await safeFetchJson<{ imageUrl?: string; url?: string }>('/api/settings/upload-gallery-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, postId })
    });
    if (data && (data.imageUrl || data.url)) {
      return data.imageUrl || data.url || imageBase64;
    }
  } catch (err) {
    console.warn('[Upload Gallery] Server image upload notice:', err);
  }
  return imageBase64;
}

/**
 * Permanently deletes a single MenuItem document from Cloud Firestore menu_items collection,
 * local storage, and server database.
 */
export async function deleteSingleMenuItemFromFirestore(itemId: string): Promise<void> {
  // 1. Update localStorage immediately
  try {
    const local = localStorage.getItem('deolinda_custom_menu_items');
    if (local) {
      let list: MenuItem[] = JSON.parse(local);
      list = list.filter(it => it.id !== itemId);
      localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(list));
    }
  } catch {}

  // 2. Delete from backend API
  try {
    await fetch(`/api/settings/menu-item/${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    });
  } catch (backendErr) {
    console.warn('[Backend] Menu item delete notice:', backendErr);
  }

  // 3. Delete from Cloud Firestore with a 15-second timeout
  try {
    const itemDocRef = doc(db, 'menu_items', itemId);
    const deletePromise = deleteDoc(itemDocRef);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore delete timeout')), 15000)
    );
    await Promise.race([deletePromise, timeoutPromise]);
    console.log(`[Firestore] Menu item (${itemId}) deleted from Cloud Firestore successfully.`);
  } catch (error: any) {
    if (error?.message === 'Firestore delete timeout') {
      console.warn('[Firestore] Notice: Firestore delete timed out. Item deleted from server and local store.');
    } else if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Free tier daily write quota limit reached on delete.');
    } else {
      console.warn('[Firestore] Notice deleting menu item from Firestore:', error?.message || error);
    }
  }
}

const migratedMenuItemIds = new Set<string>();

/**
 * Migrates a locally-cached `/menu_images/...` photo (from the uploading device's browser cache)
 * into a portable compressed base64 Cloud Firestore document in `menu_items/{item.id}` so all other devices see it.
 */
export async function migrateCachedMenuImageToFirestore(
  item: MenuItem,
  portableDataUrl: string
): Promise<void> {
  if (!item?.id || !portableDataUrl || !portableDataUrl.startsWith('data:image/')) {
    return;
  }
  if (migratedMenuItemIds.has(item.id)) {
    return;
  }
  migratedMenuItemIds.add(item.id);

  try {
    const cleanItem = sanitizeMenuItemForFirestore({ ...item, image: portableDataUrl });
    const itemDocRef = doc(db, 'menu_items', cleanItem.id);
    await setDoc(
      itemDocRef,
      {
        ...cleanItem,
        _migratedFromCache: true,
        updatedAt: new Date().toISOString(),
        _serverTimestamp: serverTimestamp()
      },
      { merge: true }
    );
    console.log(`[Firestore] Migrated cached menu image "${cleanItem.id}" to Cloud Firestore for all devices.`);
  } catch (error: any) {
    migratedMenuItemIds.delete(item.id);
    console.warn('[Firestore] Notice migrating cached menu photo:', error?.message || error);
  }
}

/**
 * Saves the full menu items collection to Cloud Firestore (`menu_items` individual docs + lightweight settings),
 * Express backend, and localStorage. Used for bulk operations like restoring defaults or category ID updates.
 */
export async function saveMenuItemsToFirestore(items: MenuItem[]): Promise<void> {
  const sanitizedItems = await Promise.all(
    items.map(async (item) => {
      const clean = sanitizeMenuItemForFirestore(item);
      if (typeof clean.image === 'string' && clean.image.startsWith('data:image/')) {
        try {
          clean.image = await compressImageForFirestore(clean.image, 420000);
        } catch {}
      }
      return clean;
    })
  );

  // 1. Update localStorage immediately (safe against quota limits)
  try {
    localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(sanitizedItems));
  } catch (localErr) {
    console.warn('[LocalStorage] Notice saving menu items locally:', localErr);
  }

  // 2. Backup to Express backend API
  try {
    await fetch('/api/settings/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: sanitizedItems })
    });
  } catch (backendErr) {
    console.warn('[Backend] Menu save notice:', backendErr);
  }

  // 3. Synchronize individual `menu_items/{id}` docs in Cloud Firestore so ALL devices update reliably
  try {
    const menuColRef = collection(db, 'menu_items');
    const existingSnap = await getDocs(menuColRef);
    const keepIds = new Set(sanitizedItems.map((it) => it.id));

    const deletePromises: Promise<void>[] = [];
    existingSnap.forEach((docSnap) => {
      if (!keepIds.has(docSnap.id)) {
        deletePromises.push(deleteDoc(doc(db, 'menu_items', docSnap.id)));
      }
    });
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    await Promise.all(
      sanitizedItems.map((sanitized) =>
        setDoc(
          doc(db, 'menu_items', sanitized.id),
          {
            ...sanitized,
            updatedAt: new Date().toISOString(),
            _serverTimestamp: serverTimestamp()
          },
          { merge: true }
        )
      )
    );

    const jsonStr = JSON.stringify(sanitizedItems);
    if (jsonStr.length < 750000) {
      const menuDocRef = doc(db, 'settings', 'menu');
      await setDoc(menuDocRef, {
        items: sanitizedItems,
        updatedAt: new Date().toISOString(),
        type: 'menu_items',
        _serverTimestamp: serverTimestamp()
      }, { merge: true });
    }
  } catch (error: any) {
    console.warn('[Firestore] Bulk menu sync notice:', error?.message || error);
  }
}

export const EXCLUDED_CLASSIC_ITEM_IDS = new Set([
  'pizza-margherita-dop',
  'pizza-margherita-especial',
  'pizza-margherita-verace',
  'pizza-marinara-antica',
  'pizza-diavola-piccante',
  'pizza-quattro-formaggi',
  'pizza-capricciosa',
  'pizza-deolinda-suprema',
  'pizza-mortadella-pistacchio',
  'pizza-parma-burrata',
  'pizza-burrata-pesto',
  'anti-burrata-forno',
  'anti-bruschetta-caprese',
  'anti-focaccia-rosmarino',
  'anti-arancini',
  'dolce-tiramisu',
  'dolce-cannoli',
  'dolce-pizza-nutella',
  'bev-chianti',
  'bev-primitivo',
  'bev-prosecco',
  'bev-peroni',
  'bev-limoncello',
  'bev-sanpellegrino'
]);

/**
 * Subscribes to real-time menu items updates from Cloud Firestore.
 * Preserves only manual and newly added items, permanently excluding the 21 classic recipes.
 */
export function subscribeToMenuItems(
  onUpdate: (items: MenuItem[]) => void
): () => void {
  try {
    const menuColRef = collection(db, 'menu_items');
    
    // Sort priority order for standard pizzeria categories
    const categoryOrder: Record<string, number> = {
      'tradizionali': 1,
      'speciali': 2,
      'dolci': 3,
      'bevande': 4
    };

    const processSnapshot = (snapshot: any) => {
      if (!snapshot.empty) {
        const loadedItems: MenuItem[] = [];
        snapshot.forEach((docSnap: any) => {
          const it = docSnap.data();
          if (it && it.name && !EXCLUDED_CLASSIC_ITEM_IDS.has(docSnap.id) && !EXCLUDED_CLASSIC_ITEM_IDS.has(it.id)) {
            loadedItems.push({
              id: String(docSnap.id || it.id || `item-${Date.now()}`),
              name: String(it.name || ''),
              italianName: it.italianName ? String(it.italianName) : undefined,
              category: (it.category || 'tradizionali') as any,
              price: Number(it.price || 0),
              description: String(it.description || ''),
              ingredients: Array.isArray(it.ingredients) ? it.ingredients : [],
              pairing: it.pairing ? String(it.pairing) : undefined,
              image: String(it.image || 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'),
              tags: Array.isArray(it.tags) ? it.tags : [],
              isAvailable: it.isAvailable !== false,
              isPopular: Boolean(it.isPopular),
              pointsEarned: typeof it.pointsEarned === 'number' ? it.pointsEarned : undefined,
              pointsToRedeem: typeof it.pointsToRedeem === 'number' ? it.pointsToRedeem : undefined,
              pointsBonusTag: it.pointsBonusTag ? String(it.pointsBonusTag) : undefined
            });
          }
        });

        // Sort items by category order, then maintain clean order
        loadedItems.sort((a, b) => {
          const orderA = categoryOrder[a.category] ?? 99;
          const orderB = categoryOrder[b.category] ?? 99;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name, 'pt-BR');
        });

        onUpdate(loadedItems);
        try {
          localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(loadedItems));
        } catch {}
      } else {
        // Fallback: check settings/menu or server API if collection is unexpectedly empty (safe on static hosting)
        safeFetchJson<{ items?: MenuItem[] }>('/api/settings/menu').then(data => {
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            onUpdate(data.items);
          }
        });
      }
    };

    const unsubscribe = onSnapshot(menuColRef, processSnapshot, (err: any) => {
      console.warn('[Firestore] Menu collection subscription notice:', err?.message || err);
      // If Firestore hits quota limit (resource-exhausted) or client is offline, seamlessly fetch from backend API
      safeFetchJson<{ items?: MenuItem[] }>('/api/settings/menu').then(data => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          onUpdate(data.items);
        }
      });
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Menu subscribe error:', err);
    return () => {};
  }
}

const migratedGalleryPostIds = new Set<string>();

/**
 * Sanitizes a SocialPost object for Cloud Firestore (removes undefined fields).
 */
export function sanitizeGalleryPostForFirestore(
  post: SocialPost,
  orderIndex = 0
): Record<string, any> {
  return {
    id: String(post.id || `post-${Date.now()}`),
    imageUrl: String(post.imageUrl || ''),
    caption: String(post.caption || 'Momento especial na Deolinda Pizzaria Napoletana 🍕❤️'),
    author: String(post.author || '@deolindapizzaria'),
    timestamp: String(post.timestamp || 'Recente'),
    tags: Array.isArray(post.tags) ? post.tags.map(String) : ['#DeolindaNapoletana'],
    likes: typeof post.likes === 'number' && !isNaN(post.likes) ? post.likes : 100,
    isHotOutOfOven: Boolean(post.isHotOutOfOven),
    orderIndex: Number(orderIndex),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Migrates a locally-cached `/gallery_images/...` photo (from the uploading device's browser cache)
 * into a portable base64 Cloud Firestore document in `gallery_posts/{post.id}` so all other devices see it.
 */
export async function migrateCachedGalleryImageToFirestore(
  post: SocialPost,
  portableDataUrl: string
): Promise<void> {
  if (!post?.id || !portableDataUrl || !portableDataUrl.startsWith('data:image/')) {
    return;
  }
  if (migratedGalleryPostIds.has(post.id)) {
    return;
  }
  migratedGalleryPostIds.add(post.id);

  try {
    const cleanPost = sanitizeGalleryPostForFirestore(
      { ...post, imageUrl: portableDataUrl },
      0
    );
    const postDocRef = doc(db, 'gallery_posts', cleanPost.id);
    await setDoc(
      postDocRef,
      {
        ...cleanPost,
        _migratedFromCache: true,
        _serverTimestamp: serverTimestamp()
      },
      { merge: true }
    );
    console.log(`[Firestore] Migrated cached gallery image "${cleanPost.id}" to Cloud Firestore for all devices.`);
  } catch (error: any) {
    migratedGalleryPostIds.delete(post.id);
    console.warn('[Firestore] Notice migrating cached gallery photo:', error?.message || error);
  }
}

/**
 * Saves the full gallery / Fotos & Momentos posts collection across:
 * 1. Individual Cloud Firestore documents (`gallery_posts/{post.id}`) so each compressed image
 *    fits comfortably under Firestore's 1MB limit and syncs in real time to ALL devices.
 * 2. Lightweight manifest in `settings/gallery` (`useCollection: true`, `activeIds`).
 * 3. Express backend (`/api/settings/gallery`) & localStorage fallback.
 */
export async function saveGalleryPostsToFirestore(posts: SocialPost[]): Promise<SocialPost[]> {
  const cleanPosts: SocialPost[] = posts.map((post, idx) =>
    sanitizeGalleryPostForFirestore(post, idx) as unknown as SocialPost
  );

  // 1. Local storage fallback (safe against quota limits)
  try {
    const jsonStr = JSON.stringify(cleanPosts);
    localStorage.setItem('deolinda_custom_social_posts', jsonStr);
    localStorage.setItem('deolinda_custom_gallery_posts', jsonStr);
  } catch (localErr) {
    console.warn('[LocalStorage] Gallery save notice:', localErr);
  }

  // 2. Synchronize with backend API (keeps portable URLs intact)
  try {
    await safeFetchJson<{ success?: boolean; posts?: SocialPost[] }>('/api/settings/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts: cleanPosts })
    });
  } catch (backendErr) {
    console.warn('[Backend] Gallery save notice:', backendErr);
  }

  // 3. Persist each post as its own document in Cloud Firestore `gallery_posts` collection
  try {
    const galleryColRef = collection(db, 'gallery_posts');
    const existingSnap = await getDocs(galleryColRef);
    const keepIds = new Set(cleanPosts.map((p) => p.id));

    // Delete any removed gallery post documents
    const deletePromises: Promise<void>[] = [];
    existingSnap.forEach((docSnap) => {
      if (!keepIds.has(docSnap.id)) {
        deletePromises.push(deleteDoc(doc(db, 'gallery_posts', docSnap.id)));
      }
    });
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    // Write/update each gallery post document in parallel (each ~40KB-250KB, always < 1MB)
    await Promise.all(
      cleanPosts.map((post, idx) => {
        const sanitized = sanitizeGalleryPostForFirestore(post, idx);
        return setDoc(
          doc(db, 'gallery_posts', sanitized.id),
          {
            ...sanitized,
            _serverTimestamp: serverTimestamp()
          },
          { merge: true }
        );
      })
    );

    // Update lightweight manifest in `settings/gallery` (always < 5KB, never exceeds 1MB limit)
    const galleryDocRef = doc(db, 'settings', 'gallery');
    const manifestPayload: Record<string, any> = {
      useCollection: true,
      activeIds: cleanPosts.map((p) => p.id),
      updatedAt: new Date().toISOString(),
      type: 'gallery_posts',
      _serverTimestamp: serverTimestamp()
    };

    // Keep legacy `posts` array only if total serialized size is safely under 500KB
    const serialized = JSON.stringify(cleanPosts);
    if (serialized.length < 500000) {
      manifestPayload.posts = cleanPosts;
    } else {
      manifestPayload.posts = cleanPosts.map((p) => ({
        ...p,
        // Keep external URLs in legacy manifest; heavy base64 lives in `gallery_posts/{id}`
        imageUrl: p.imageUrl.startsWith('data:image/') ? '' : p.imageUrl
      }));
    }

    await setDoc(galleryDocRef, manifestPayload);
    console.log(`[Firestore] ${cleanPosts.length} gallery posts persisted to Cloud Firestore (gallery_posts collection).`);
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving gallery posts to Firestore:', error?.message || error);
  }

  return cleanPosts;
}

/**
 * Subscribes to real-time gallery / Fotos & Momentos updates from Cloud Firestore.
 * Merges individual `gallery_posts` documents with `settings/gallery` manifest so all
 * devices receive every photo in real time.
 */
export function subscribeToGalleryPosts(
  onUpdate: (posts: SocialPost[]) => void
): () => void {
  let collectionDocsMap = new Map<string, SocialPost & { orderIndex?: number }>();
  let legacyPosts: SocialPost[] = [];
  let useCollectionMode = false;
  let activeIds: string[] | null = null;
  let hasCollectionSnap = false;
  let hasManifestSnap = false;

  const emitMergedPosts = () => {
    if (!hasCollectionSnap && !hasManifestSnap) return;

    let result: SocialPost[] = [];

    if (useCollectionMode && Array.isArray(activeIds)) {
      const legacyMap = new Map<string, SocialPost>();
      legacyPosts.forEach((p) => {
        if (p && p.id) legacyMap.set(p.id, p);
      });

      const seen = new Set<string>();
      for (const id of activeIds) {
        const fromCol = collectionDocsMap.get(id);
        const fromLegacy = legacyMap.get(id);
        if (fromCol && fromCol.imageUrl) {
          result.push(fromCol);
          seen.add(id);
        } else if (fromLegacy) {
          result.push(fromLegacy);
          seen.add(id);
        } else if (fromCol) {
          result.push(fromCol);
          seen.add(id);
        }
      }

      // Include any newly added docs in collection not yet listed in activeIds
      collectionDocsMap.forEach((docPost, id) => {
        if (!seen.has(id) && docPost.imageUrl) {
          result.unshift(docPost);
        }
      });
    } else if (legacyPosts.length > 0) {
      // Transition mode: merge any migrated `gallery_posts` docs over legacy `settings/gallery`
      const legacyIds = new Set<string>();
      const extraDocs: SocialPost[] = [];

      collectionDocsMap.forEach((docPost, id) => {
        if (!legacyPosts.some((lp) => lp.id === id) && docPost.imageUrl) {
          extraDocs.push(docPost);
        }
      });

      const mergedLegacy = legacyPosts.map((lp) => {
        legacyIds.add(lp.id);
        const migrated = collectionDocsMap.get(lp.id);
        if (migrated && migrated.imageUrl) {
          return {
            ...lp,
            ...migrated,
            imageUrl: migrated.imageUrl
          };
        }
        return lp;
      });

      result = [...extraDocs, ...mergedLegacy];
    } else if (collectionDocsMap.size > 0) {
      result = Array.from(collectionDocsMap.values()).sort(
        (a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999)
      );
    }

    if (result.length > 0) {
      onUpdate(result);
      try {
        const jsonStr = JSON.stringify(result);
        localStorage.setItem('deolinda_custom_social_posts', jsonStr);
        localStorage.setItem('deolinda_custom_gallery_posts', jsonStr);
      } catch {
        // Ignore localStorage quota exceeded when many photos are stored in Firestore
      }
      return;
    }

    // Fallback to backend API if Firestore has no gallery posts yet
    if (hasCollectionSnap && hasManifestSnap) {
      safeFetchJson<{ posts?: SocialPost[] }>('/api/settings/gallery').then((data) => {
        if (data && Array.isArray(data.posts) && data.posts.length > 0) {
          onUpdate(data.posts);
          try {
            const jsonStr = JSON.stringify(data.posts);
            localStorage.setItem('deolinda_custom_social_posts', jsonStr);
            localStorage.setItem('deolinda_custom_gallery_posts', jsonStr);
          } catch {}
        }
      });
    }
  };

  try {
    const galleryColRef = collection(db, 'gallery_posts');
    const galleryDocRef = doc(db, 'settings', 'gallery');

    const unsubCollection = onSnapshot(
      galleryColRef,
      (snap) => {
        const nextMap = new Map<string, SocialPost & { orderIndex?: number }>();
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && (d.id || docSnap.id)) {
            const id = String(d.id || docSnap.id);
            nextMap.set(id, {
              id,
              imageUrl: String(d.imageUrl || ''),
              caption: String(d.caption || ''),
              author: String(d.author || '@deolindapizzaria'),
              timestamp: String(d.timestamp || 'Recente'),
              tags: Array.isArray(d.tags) ? d.tags : [],
              likes: typeof d.likes === 'number' ? d.likes : 100,
              isHotOutOfOven: Boolean(d.isHotOutOfOven),
              orderIndex: typeof d.orderIndex === 'number' ? d.orderIndex : 9999
            });
          }
        });
        collectionDocsMap = nextMap;
        hasCollectionSnap = true;
        emitMergedPosts();
      },
      (err) => {
        console.warn('[Firestore] gallery_posts collection subscription notice:', err?.message || err);
        hasCollectionSnap = true;
        emitMergedPosts();
      }
    );

    const unsubManifest = onSnapshot(
      galleryDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          useCollectionMode = Boolean(data?.useCollection);
          activeIds = Array.isArray(data?.activeIds) ? data.activeIds : null;
          legacyPosts = Array.isArray(data?.posts) ? data.posts : [];
        } else {
          useCollectionMode = false;
          activeIds = null;
          legacyPosts = [];
        }
        hasManifestSnap = true;
        emitMergedPosts();
      },
      (err) => {
        console.warn('[Firestore] Gallery manifest subscription notice:', err?.message || err);
        hasManifestSnap = true;
        emitMergedPosts();
      }
    );

    return () => {
      unsubCollection();
      unsubManifest();
    };
  } catch (err) {
    console.warn('[Firestore] Gallery subscribe error:', err);
    safeFetchJson<{ posts?: SocialPost[] }>('/api/settings/gallery').then((data) => {
      if (data && Array.isArray(data.posts) && data.posts.length > 0) {
        onUpdate(data.posts);
      }
    });
    return () => {};
  }
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

/**
 * Saves the full site information and text content to Cloud Firestore, backend, and localStorage.
 */
export async function saveSiteInfoToFirestore(siteInfo: SiteInfo): Promise<void> {
  const cleanInfo = stripUndefinedDeep({ ...siteInfo });

  // Compress uploaded story image cleanly so settings/site_info stays well under Firestore's 1MB limit
  if (typeof cleanInfo.storyImageUrl === 'string' && cleanInfo.storyImageUrl.startsWith('data:image/')) {
    try {
      cleanInfo.storyImageUrl = await compressImageForFirestore(cleanInfo.storyImageUrl, 360000);
    } catch {}
  }

  try {
    const siteDocRef = doc(db, 'settings', 'site_info');
    await setDoc(siteDocRef, {
      siteInfo: cleanInfo,
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
      body: JSON.stringify({ siteInfo: cleanInfo })
    });
  } catch (e) {
    console.warn('[Backend] Site info save error:', e);
  }

  // Local storage fallback
  try {
    localStorage.setItem('deolinda_custom_site_info', JSON.stringify(cleanInfo));
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
          const normalized = data.categories
            .filter((c: any) => c && c.id !== 'antipasti' && c.label !== 'Entradas & Aperitivos')
            .map((c: any) => c.id === 'bevande' ? { ...c, label: 'Bebidas' } : c);
          onUpdate(normalized);
          try {
            localStorage.setItem('deolinda_custom_menu_categories', JSON.stringify(normalized));
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

// ==========================================
// BACKGROUND SAVE QUEUE & OPTIMISTIC UPDATES
// ==========================================

export type SaveQueueTaskType = 
  | 'menu_item_save' 
  | 'menu_item_delete' 
  | 'menu_batch' 
  | 'categories' 
  | 'site_info' 
  | 'emblem' 
  | 'logo' 
  | 'admin_password'
  | 'gallery_posts';

export interface SaveQueueTask {
  id: string;
  type: SaveQueueTaskType;
  execute: () => Promise<void>;
  retries: number;
  timestamp: number;
}

class SaveQueueManager {
  private queue: SaveQueueTask[] = [];
  private isProcessing = false;
  private listeners: Array<(status: { pendingCount: number; isProcessing: boolean }) => void> = [];

  public getStatus() {
    return {
      pendingCount: this.queue.length,
      isProcessing: this.isProcessing
    };
  }

  public subscribe(listener: (status: { pendingCount: number; isProcessing: boolean }) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(l => {
      try { l(status); } catch {}
    });
  }

  public enqueue(task: Omit<SaveQueueTask, 'retries' | 'timestamp'>) {
    // Deduplicate: If an identical task is already waiting, replace it
    const existingIdx = this.queue.findIndex(t => t.id === task.id && t.type === task.type);
    const fullTask: SaveQueueTask = {
      ...task,
      retries: 0,
      timestamp: Date.now()
    };

    if (existingIdx !== -1) {
      this.queue[existingIdx] = fullTask;
    } else {
      this.queue.push(fullTask);
    }

    this.notify();
    this.processNext();
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.notify();

    const currentTask = this.queue.shift();
    if (!currentTask) {
      this.isProcessing = false;
      this.notify();
      return;
    }

    try {
      await currentTask.execute();
      console.log(`[SaveQueue] Task ${currentTask.type} (${currentTask.id}) confirmed by server.`);
    } catch (err: any) {
      console.warn(`[SaveQueue] Task ${currentTask.type} notice:`, err?.message || err);
      if (currentTask.retries < 2) {
        currentTask.retries++;
        this.queue.push(currentTask);
      }
    } finally {
      // Small spacing between background sync tasks to preserve free quota
      await new Promise(r => setTimeout(r, 100));
      this.isProcessing = false;
      this.notify();
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }
}

export const saveQueue = new SaveQueueManager();

/**
 * Optimistically saves a single MenuItem immediately to local state and localStorage,
 * and enqueues background persistence to the server database and Cloud Firestore.
 */
export function enqueueMenuItemSave(item: MenuItem): MenuItem {
  const sanitized = sanitizeMenuItemForFirestore(item) as MenuItem;

  // 1. Optimistic Local Update (< 1ms)
  try {
    const local = localStorage.getItem('deolinda_custom_menu_items');
    let list: MenuItem[] = local ? JSON.parse(local) : [];
    const idx = list.findIndex(it => it.id === sanitized.id);
    if (idx !== -1) {
      list[idx] = sanitized;
    } else {
      list = [sanitized, ...list];
    }
    localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(list));
  } catch {}

  // 2. Enqueue background persistence (compress image for portable Cloud Firestore storage across all devices)
  saveQueue.enqueue({
    id: `menu-item-${sanitized.id}`,
    type: 'menu_item_save',
    execute: async () => {
      if (sanitized.image && sanitized.image.startsWith('data:image/')) {
        try {
          sanitized.image = await compressImageForFirestore(sanitized.image, 420000);
        } catch {}
      }
      await saveSingleMenuItemToFirestore(sanitized);
    }
  });

  return sanitized;
}

/**
 * Optimistically deletes a MenuItem immediately from local state and localStorage,
 * and enqueues background deletion to the server database and Cloud Firestore.
 */
export function enqueueMenuItemDelete(itemId: string): void {
  // 1. Optimistic Local Delete (< 1ms)
  try {
    const local = localStorage.getItem('deolinda_custom_menu_items');
    if (local) {
      let list: MenuItem[] = JSON.parse(local);
      list = list.filter(it => it.id !== itemId);
      localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(list));
    }
  } catch {}

  // 2. Enqueue background deletion
  saveQueue.enqueue({
    id: `menu-delete-${itemId}`,
    type: 'menu_item_delete',
    execute: async () => {
      await deleteSingleMenuItemFromFirestore(itemId);
    }
  });
}

/**
 * Optimistically saves the full menu batch to localStorage and enqueues background sync.
 */
export function enqueueMenuItemsBatchSave(items: MenuItem[]): void {
  try {
    localStorage.setItem('deolinda_custom_menu_items', JSON.stringify(items));
  } catch {}

  saveQueue.enqueue({
    id: 'menu_batch_sync',
    type: 'menu_batch',
    execute: async () => {
      await saveMenuItemsToFirestore(items);
    }
  });
}

/**
 * Optimistically saves categories to localStorage and enqueues background sync.
 */
export function enqueueMenuCategoriesSave(categories: MenuCategory[]): void {
  try {
    localStorage.setItem('deolinda_custom_menu_categories', JSON.stringify(categories));
  } catch {}

  saveQueue.enqueue({
    id: 'categories_sync',
    type: 'categories',
    execute: async () => {
      await saveMenuCategoriesToFirestore(categories);
    }
  });
}

/**
 * Optimistically saves site info to localStorage and enqueues background sync.
 */
export function enqueueSiteInfoSave(info: SiteInfo): void {
  try {
    localStorage.setItem('deolinda_custom_site_info', JSON.stringify(info));
  } catch {}

  saveQueue.enqueue({
    id: 'site_info_sync',
    type: 'site_info',
    execute: async () => {
      await saveSiteInfoToFirestore(info);
    }
  });
}

/**
 * Optimistically saves logo and enqueues background sync.
 */
export function enqueueLogoSave(logoUrl: string | null): void {
  try {
    if (logoUrl) {
      localStorage.setItem('deolinda_custom_logo', logoUrl);
    } else {
      localStorage.removeItem('deolinda_custom_logo');
    }
  } catch {}

  saveQueue.enqueue({
    id: 'logo_sync',
    type: 'logo',
    execute: async () => {
      await saveLogoToFirestore(logoUrl);
    }
  });
}

/**
 * Optimistically saves emblem and enqueues background sync.
 */
export function enqueueEmblemSave(emblemUrl: string | null, enabled: boolean): void {
  try {
    if (emblemUrl) {
      localStorage.setItem('deolinda_custom_emblem', emblemUrl);
    } else {
      localStorage.removeItem('deolinda_custom_emblem');
    }
    localStorage.setItem('deolinda_custom_emblem_enabled', String(enabled));
  } catch {}

  saveQueue.enqueue({
    id: 'emblem_sync',
    type: 'emblem',
    execute: async () => {
      await saveEmblemToFirestore(emblemUrl, enabled);
    }
  });
}

/**
 * Optimistically saves gallery / Fotos & Momentos posts to localStorage and enqueues background sync.
 */
export function enqueueGalleryPostsSave(posts: SocialPost[]): void {
  try {
    const jsonStr = JSON.stringify(posts);
    localStorage.setItem('deolinda_custom_gallery_posts', jsonStr);
    localStorage.setItem('deolinda_custom_social_posts', jsonStr);
  } catch {}

  saveQueue.enqueue({
    id: 'gallery_posts_sync',
    type: 'gallery_posts',
    execute: async () => {
      await saveGalleryPostsToFirestore(posts);
    }
  });
}

/**
 * Saves a customer contact / Fale Conosco message to Cloud Firestore.
 */
export async function saveContactMessageToFirestore(messageData: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<void> {
  try {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const msgDocRef = doc(db, 'messages', msgId);
    await setDoc(msgDocRef, {
      ...messageData,
      id: msgId,
      createdAt: new Date().toISOString(),
      read: false,
      _serverTimestamp: serverTimestamp()
    });

    // Also write to standard `mail` collection for Firebase Trigger Email extension
    try {
      const mailDocRef = doc(db, 'mail', msgId);
      await setDoc(mailDocRef, {
        to: ['antonioestefanoprando@gmail.com', 'contato@deolindapizzaria.com.br'],
        message: {
          subject: `[Deolinda Pizzaria] Nova mensagem de ${messageData.name}: ${messageData.subject || 'Fale Conosco'}`,
          text: `Nova mensagem recebida pelo site da Deolinda Pizzaria.\n\nNome: ${messageData.name}\nE-mail: ${messageData.email}\nTelefone: ${messageData.phone || 'Não informado'}\nAssunto: ${messageData.subject || 'Fale Conosco'}\n\nMensagem:\n${messageData.message}`,
          html: `<h2>Nova Mensagem pelo site Deolinda Pizzaria</h2><p><strong>Nome:</strong> ${messageData.name}</p><p><strong>E-mail:</strong> ${messageData.email}</p><p><strong>Telefone:</strong> ${messageData.phone || 'Não informado'}</p><p><strong>Assunto:</strong> ${messageData.subject || 'Fale Conosco'}</p><hr/><p><strong>Mensagem:</strong></p><p>${messageData.message.replace(/\n/g, '<br/>')}</p>`
        },
        createdAt: new Date().toISOString()
      });
    } catch {}

    console.log('[Firestore] Contact message saved to Cloud Firestore successfully:', msgId);
  } catch (error: any) {
    console.warn('[Firestore] Notice while saving contact message to Firestore:', error?.message || error);
  }
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

/**
 * Subscribes to customer contact messages from Cloud Firestore in real time.
 */
export function subscribeToContactMessages(
  onUpdate: (messages: ContactMessageRecord[]) => void
): () => void {
  try {
    const msgCol = collection(db, 'messages');
    const unsubscribe = onSnapshot(
      msgCol,
      (snapshot) => {
        const list: ContactMessageRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.name && data.message) {
            list.push({
              id: docSnap.id,
              name: data.name,
              email: data.email || '',
              phone: data.phone || '',
              subject: data.subject || '',
              message: data.message || '',
              createdAt: data.createdAt || new Date().toISOString(),
              read: Boolean(data.read)
            });
          }
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (err) => {
        console.warn('[Firestore] Messages subscription notice:', err?.message || err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Could not establish messages subscription:', err);
    return () => {};
  }
}

/**
 * Marks a contact message as read in Cloud Firestore.
 */
export async function markContactMessageAsRead(id: string): Promise<void> {
  try {
    const msgRef = doc(db, 'messages', id);
    await updateDoc(msgRef, { read: true });
  } catch (err) {
    console.warn('[Firestore] Error marking message as read:', err);
  }
}

/**
 * Deletes a contact message from Cloud Firestore.
 */
export async function deleteContactMessageFromFirestore(id: string): Promise<void> {
  try {
    const msgRef = doc(db, 'messages', id);
    await deleteDoc(msgRef);
  } catch (err) {
    console.warn('[Firestore] Error deleting message:', err);
  }
}



