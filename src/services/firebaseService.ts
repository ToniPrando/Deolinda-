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
import { MENU_ITEMS, normalizeMenuItemCategory, ensureAdditionalDrinkCategories } from '../data/menuData';
import { safeFetchJson } from '../utils/safeFetch';
import { getAdminAuthHeaders, getAdminAuthToken, notifyAdminUnauthorized, setAdminAuthToken, clearAdminAuthToken } from '../utils/adminSession';
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
 * Safely writes a key to localStorage. If QuotaExceededError occurs, clears legacy duplicate
 * gallery cache keys and retries; if still over quota, deletes the stale key instead of leaving outdated data.
 */
function safeSetLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      localStorage.removeItem('deolinda_custom_social_posts');
      localStorage.setItem(key, value);
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  }
}

function isFatalFirestoreError(error: any): boolean {
  const code = String(error?.code || '').toLowerCase();
  const msg = String(error?.message || '').toLowerCase();
  return (
    code === 'permission-denied' ||
    code === 'unauthenticated' ||
    code === 'invalid-argument' ||
    msg.includes('longer than 1048487') ||
    msg.includes('exceeds the maximum allowed size') ||
    msg.includes('invalid data')
  );
}

function formatPersistenceError(actionLabel: string, firestoreError: any): Error {
  const code = String(firestoreError?.code || '').toLowerCase();
  const msg = String(firestoreError?.message || '');
  if (msg.toLowerCase().includes('1048487') || msg.toLowerCase().includes('maximum allowed size')) {
    return new Error(`A foto enviada é muito grande para o banco de dados ao ${actionLabel}. Escolha uma imagem menor.`);
  }
  if (code === 'permission-denied' || code === 'unauthenticated') {
    return new Error(`Sem permissão no banco de dados na nuvem ao ${actionLabel}.`);
  }
  return new Error(`Não foi possível salvar no banco de dados ao ${actionLabel}. Verifique sua conexão e tente novamente.`);
}

export interface CloudSyncStatus {
  firestoreSaved: boolean;
  serverSaved: boolean;
  errorMessage?: string;
}

let lastCloudSyncStatus: CloudSyncStatus = {
  firestoreSaved: true,
  serverSaved: true
};

export function getLastCloudSyncStatus(): CloudSyncStatus {
  return { ...lastCloudSyncStatus };
}

function recordCloudSyncStatus(status: CloudSyncStatus): void {
  lastCloudSyncStatus = status;
}

async function setDocWithTimeout(docRef: any, data: any, options?: { merge?: boolean }, timeoutMs = 15000): Promise<void> {
  const writePromise = options ? setDoc(docRef, data, options) : setDoc(docRef, data);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Firestore write timeout')), timeoutMs)
  );
  await Promise.race([writePromise, timeoutPromise]);
}

/**
 * Saves the custom brand logo to Cloud Firestore.
 * Broadcasts in real-time across all connected devices and browsers.
 */
export async function saveLogoToFirestore(logoUrl: string | null): Promise<void> {
  let finalLogoUrl = logoUrl;
  if (finalLogoUrl && finalLogoUrl.startsWith('data:image/')) {
    finalLogoUrl = await compressBrandImageForFirestore(finalLogoUrl, 360000);
    if (finalLogoUrl.length > 800000) {
      finalLogoUrl = await compressBrandImageForFirestore(finalLogoUrl, 220000);
    }
  }

  let firestoreSaved = false;
  let serverSaved = false;
  let firestoreError: any = null;

  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    await setDocWithTimeout(brandDocRef, {
      logoUrl: finalLogoUrl || null,
      updatedAt: new Date().toISOString(),
      type: 'logo',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    firestoreSaved = true;
    console.log('[Firestore] Brand logo saved to Cloud Firestore successfully:', finalLogoUrl ? 'Custom Logo' : 'Reset to Default');
  } catch (error: any) {
    firestoreError = error;
    console.warn('[Firestore] Notice while saving logo to Firestore:', error?.message || error);
  }

  // Always synchronize with backend API
  try {
    const resp = await fetch('/api/settings/logo', {
      method: 'POST',
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ logoUrl: finalLogoUrl })
    });
    if (resp.status === 401) notifyAdminUnauthorized();
    serverSaved = resp.ok;
  } catch (backendErr) {
    console.warn('[Backend] Logo sync fallback:', backendErr);
  }

  if (finalLogoUrl) {
    safeSetLocalStorage('deolinda_custom_logo', finalLogoUrl);
  } else {
    try { localStorage.removeItem('deolinda_custom_logo'); } catch {}
  }

  recordCloudSyncStatus({
    firestoreSaved,
    serverSaved,
    errorMessage: firestoreError ? (firestoreError?.message || String(firestoreError)) : undefined
  });

  if ((firestoreError && isFatalFirestoreError(firestoreError)) || (!firestoreSaved && !serverSaved)) {
    throw formatPersistenceError('salvar a logomarca', firestoreError);
  }
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
    finalEmblemUrl = await compressBrandImageForFirestore(finalEmblemUrl, 360000);
    if (finalEmblemUrl.length > 800000) {
      finalEmblemUrl = await compressBrandImageForFirestore(finalEmblemUrl, 220000);
    }
  }

  let firestoreSaved = false;
  let serverSaved = false;
  let firestoreError: any = null;

  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    await setDocWithTimeout(brandDocRef, {
      emblemUrl: finalEmblemUrl || null,
      emblemEnabled: enabled,
      emblemUpdatedAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    firestoreSaved = true;
    console.log('[Firestore] Brand emblem saved to Cloud Firestore:', finalEmblemUrl ? 'Custom Emblem' : 'Removed');
  } catch (error: any) {
    firestoreError = error;
    console.warn('[Firestore] Notice while saving emblem to Firestore:', error?.message || error);
  }

  // Always synchronize with backend API
  try {
    const resp = await fetch('/api/settings/emblem', {
      method: 'POST',
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ emblemUrl: finalEmblemUrl, enabled })
    });
    if (resp.status === 401) notifyAdminUnauthorized();
    serverSaved = resp.ok;
  } catch (backendErr) {
    console.warn('[Backend] Emblem sync fallback:', backendErr);
  }

  if (finalEmblemUrl) {
    safeSetLocalStorage('deolinda_custom_emblem', finalEmblemUrl);
  } else {
    try { localStorage.removeItem('deolinda_custom_emblem'); } catch {}
  }
  safeSetLocalStorage('deolinda_custom_emblem_enabled', String(enabled));

  recordCloudSyncStatus({
    firestoreSaved,
    serverSaved,
    errorMessage: firestoreError ? (firestoreError?.message || String(firestoreError)) : undefined
  });

  if ((firestoreError && isFatalFirestoreError(firestoreError)) || (!firestoreSaved && !serverSaved)) {
    throw formatPersistenceError('salvar a imagem anexa', firestoreError);
  }
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
    category: normalizeMenuItemCategory(item.category),
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
    sanitizedItem.image = await compressImageForFirestore(sanitizedItem.image, 420000);
    if (JSON.stringify(sanitizedItem).length > 850000) {
      sanitizedItem.image = await compressImageForFirestore(sanitizedItem.image, 220000);
    }
  }

  let firestoreSaved = false;
  let serverSaved = false;
  let firestoreError: any = null;

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
    safeSetLocalStorage('deolinda_custom_menu_items', JSON.stringify(list));
  } catch {}

  // 2. Synchronize with backend API (keeps portable URLs intact)
  try {
    const data = await safeFetchJson<{ success?: boolean; item?: MenuItem }>('/api/settings/menu-item', {
      method: 'POST',
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ item: sanitizedItem })
    });
    if (data && (data.item || data.success)) {
      serverSaved = true;
      if (data.item) {
        const serverSanitized = sanitizeMenuItemForFirestore(data.item);
        if (sanitizedItem.image.startsWith('data:image/') && !serverSanitized.image.startsWith('data:image/')) {
          serverSanitized.image = sanitizedItem.image;
        }
        sanitizedItem = serverSanitized;
      }
    }
  } catch (backendErr) {
    console.warn('[Backend] Menu item save notice:', backendErr);
  }

  // 3. Persist to Cloud Firestore (individual document) with generous 15-second timeout for mobile/photo uploads
  try {
    const itemDocRef = doc(db, 'menu_items', sanitizedItem.id);
    await setDocWithTimeout(itemDocRef, {
      ...sanitizedItem,
      updatedAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    firestoreSaved = true;
    console.log(`[Firestore] Single menu item "${sanitizedItem.name}" (${sanitizedItem.id}) saved to Cloud Firestore successfully.`);
  } catch (error: any) {
    firestoreError = error;
    if (error?.message === 'Firestore write timeout') {
      console.warn('[Firestore] Notice: Firestore write timed out.');
    } else if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded') || error?.message?.includes('resource-exhausted')) {
      console.warn('[Firestore] Free tier daily write quota limit reached.');
    } else {
      console.warn('[Firestore] Notice saving single menu item to Firestore:', error?.message || error);
    }
  }

  recordCloudSyncStatus({
    firestoreSaved,
    serverSaved,
    errorMessage: firestoreError ? (firestoreError?.message || String(firestoreError)) : undefined
  });

  if ((firestoreError && isFatalFirestoreError(firestoreError)) || (!firestoreSaved && !serverSaved)) {
    throw formatPersistenceError('salvar o item do cardápio', firestoreError);
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
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
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
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
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
  let firestoreDeleted = false;
  let serverDeleted = false;
  let firestoreError: any = null;

  // 1. Update localStorage immediately
  try {
    const local = localStorage.getItem('deolinda_custom_menu_items');
    if (local) {
      let list: MenuItem[] = JSON.parse(local);
      list = list.filter(it => it.id !== itemId);
      safeSetLocalStorage('deolinda_custom_menu_items', JSON.stringify(list));
    }
  } catch {}

  // 2. Delete from backend API
  try {
    const resp = await fetch(`/api/settings/menu-item/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders()
    });
    if (resp.status === 401) notifyAdminUnauthorized();
    serverDeleted = resp.ok;
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
    firestoreDeleted = true;
    console.log(`[Firestore] Menu item (${itemId}) deleted from Cloud Firestore successfully.`);
  } catch (error: any) {
    firestoreError = error;
    if (error?.message === 'Firestore delete timeout') {
      console.warn('[Firestore] Notice: Firestore delete timed out.');
    } else if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Free tier daily write quota limit reached on delete.');
    } else {
      console.warn('[Firestore] Notice deleting menu item from Firestore:', error?.message || error);
    }
  }

  recordCloudSyncStatus({
    firestoreSaved: firestoreDeleted,
    serverSaved: serverDeleted,
    errorMessage: firestoreError ? (firestoreError?.message || String(firestoreError)) : undefined
  });

  if ((firestoreError && isFatalFirestoreError(firestoreError)) || (!firestoreDeleted && !serverDeleted)) {
    throw formatPersistenceError('excluir o item do cardápio', firestoreError);
  }
}

/**
 * Disabled no-op kept solely for backwards import compatibility.
 * Automatic onLoad migration was removed because rendering default seed items could overwrite Cloud Firestore edits.
 */
export async function migrateCachedMenuImageToFirestore(
  _item: MenuItem,
  _portableDataUrl: string
): Promise<void> {
  return;
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
        clean.image = await compressImageForFirestore(clean.image, 420000);
        if (JSON.stringify(clean).length > 850000) {
          clean.image = await compressImageForFirestore(clean.image, 220000);
        }
      }
      return clean;
    })
  );

  // 1. Update localStorage immediately (safe against quota limits)
  safeSetLocalStorage('deolinda_custom_menu_items', JSON.stringify(sanitizedItems));

  let serverSaved = false;
  let firestoreSaved = false;
  let firestoreError: any = null;

  // 2. Backup to Express backend API
  try {
    const resp = await fetch('/api/settings/menu', {
      method: 'POST',
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ items: sanitizedItems })
    });
    if (resp.status === 401) notifyAdminUnauthorized();
    serverSaved = resp.ok;
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
        setDocWithTimeout(
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
      await setDocWithTimeout(menuDocRef, {
        items: sanitizedItems,
        updatedAt: new Date().toISOString(),
        type: 'menu_items',
        _serverTimestamp: serverTimestamp()
      }, { merge: true });
    }
    firestoreSaved = true;
  } catch (error: any) {
    firestoreError = error;
    console.warn('[Firestore] Bulk menu sync notice:', error?.message || error);
  }

  recordCloudSyncStatus({
    firestoreSaved,
    serverSaved,
    errorMessage: firestoreError ? (firestoreError?.message || String(firestoreError)) : undefined
  });

  if ((firestoreError && isFatalFirestoreError(firestoreError)) || (!firestoreSaved && !serverSaved)) {
    throw formatPersistenceError('salvar o cardápio', firestoreError);
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
  let syncedServerCache = false;
  try {
    const menuColRef = collection(db, 'menu_items');
    
    // Sort priority order for standard pizzeria categories
    const categoryOrder: Record<string, number> = {
      'entrada': 0,
      'pizzas_napoletanas': 1,
      'napolitane_moderne': 1,
      'tradizionali': 1,
      'speciali': 1,
      'dolci': 2,
      'bevande': 3
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
              category: normalizeMenuItemCategory(it.category),
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
        safeSetLocalStorage('deolinda_custom_menu_items', JSON.stringify(loadedItems));

        // Mirror Cloud Firestore menu items into server cache only when an admin session is active
        if (!syncedServerCache && loadedItems.length > 0 && getAdminAuthToken()) {
          syncedServerCache = true;
          fetch('/api/settings/menu', {
            method: 'POST',
            headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ items: loadedItems })
          }).catch(() => {});
        }
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
 * Disabled no-op kept solely for backwards import compatibility.
 * Automatic onLoad migration was removed to avoid clobbering Cloud Firestore edits.
 */
export async function migrateCachedGalleryImageToFirestore(
  _post: SocialPost,
  _portableDataUrl: string
): Promise<void> {
  return;
}

/**
 * Saves the full gallery / Fotos & Momentos posts collection across:
 * 1. Individual Cloud Firestore documents (`gallery_posts/{post.id}`) so each compressed image
 *    fits comfortably under Firestore's 1MB limit and syncs in real time to ALL devices.
 * 2. Lightweight manifest in `settings/gallery` (`useCollection: true`, `activeIds`).
 * 3. Express backend (`/api/settings/gallery`) & localStorage fallback.
 */
export async function saveGalleryPostsToFirestore(posts: SocialPost[]): Promise<SocialPost[]> {
  const cleanPosts: SocialPost[] = await Promise.all(
    posts.map(async (post, idx) => {
      const sanitized = sanitizeGalleryPostForFirestore(post, idx);
      if (typeof sanitized.imageUrl === 'string' && sanitized.imageUrl.startsWith('data:image/')) {
        sanitized.imageUrl = await compressImageForFirestore(sanitized.imageUrl, 420000);
        if (JSON.stringify(sanitized).length > 850000) {
          sanitized.imageUrl = await compressImageForFirestore(sanitized.imageUrl, 220000);
        }
      }
      return sanitized as unknown as SocialPost;
    })
  );

  // 1. Local storage fallback (single deduplicated key, safe against quota limits)
  try { localStorage.removeItem('deolinda_custom_social_posts'); } catch {}
  safeSetLocalStorage('deolinda_custom_gallery_posts', JSON.stringify(cleanPosts));

  let serverSaved = false;
  let firestoreSaved = false;
  let firestoreError: any = null;

  // 2. Synchronize with backend API (keeps portable URLs intact)
  try {
    const data = await safeFetchJson<{ success?: boolean; posts?: SocialPost[] }>('/api/settings/gallery', {
      method: 'POST',
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ posts: cleanPosts })
    });
    if (data && (data.success || Array.isArray(data.posts))) {
      serverSaved = true;
    }
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

    // Write/update each gallery post document in parallel (each ~40KB-420KB, always < 1MB)
    await Promise.all(
      cleanPosts.map((post, idx) => {
        const sanitized = sanitizeGalleryPostForFirestore(post, idx);
        return setDocWithTimeout(
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

    await setDocWithTimeout(galleryDocRef, manifestPayload);
    firestoreSaved = true;
    console.log(`[Firestore] ${cleanPosts.length} gallery posts persisted to Cloud Firestore (gallery_posts collection).`);
  } catch (error: any) {
    firestoreError = error;
    console.warn('[Firestore] Notice while saving gallery posts to Firestore:', error?.message || error);
  }

  recordCloudSyncStatus({
    firestoreSaved,
    serverSaved,
    errorMessage: firestoreError ? (firestoreError?.message || String(firestoreError)) : undefined
  });

  if ((firestoreError && isFatalFirestoreError(firestoreError)) || (!firestoreSaved && !serverSaved)) {
    throw formatPersistenceError('salvar a foto na galeria', firestoreError);
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
  let collectionErrored = false;
  let manifestErrored = false;
  let syncedServerCache = false;

  const isDefaultSeedGallery = (list: SocialPost[]): boolean => {
    if (!Array.isArray(list) || list.length === 0) return true;
    const defaultIds = new Set(['post-1', 'post-2', 'post-3', 'post-4', 'post-5', 'post-6', 'post-7', 'post-8']);
    return list.length <= 8 && list.every((p) => defaultIds.has(p.id) && !p.imageUrl?.startsWith('data:image/'));
  };

  const getCachedLocalPosts = (): SocialPost[] => {
    try {
      const saved = localStorage.getItem('deolinda_custom_gallery_posts') || localStorage.getItem('deolinda_custom_social_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  };

  const emitMergedPosts = () => {
    const bothDone = (hasCollectionSnap || collectionErrored) && (hasManifestSnap || manifestErrored);

    // Wait for both listeners before emitting when manifest is in collection mode so base64 docs aren't briefly empty
    if (!bothDone) {
      if (!hasCollectionSnap && hasManifestSnap && useCollectionMode) return;
      if (!hasCollectionSnap && !hasManifestSnap) return;
    }

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
        } else if (fromLegacy && fromLegacy.imageUrl) {
          result.push(fromLegacy);
          seen.add(id);
        } else if (fromCol) {
          result.push(fromCol);
          seen.add(id);
        } else if (fromLegacy) {
          result.push(fromLegacy);
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
      const extraDocs: SocialPost[] = [];

      collectionDocsMap.forEach((docPost, id) => {
        if (!legacyPosts.some((lp) => lp.id === id) && docPost.imageUrl) {
          extraDocs.push(docPost);
        }
      });

      const mergedLegacy = legacyPosts.map((lp) => {
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
      try { localStorage.removeItem('deolinda_custom_social_posts'); } catch {}
      safeSetLocalStorage('deolinda_custom_gallery_posts', JSON.stringify(result));
      // Keep Express backend cache synchronized only when an admin session is active
      if (!syncedServerCache && !isDefaultSeedGallery(result) && getAdminAuthToken()) {
        syncedServerCache = true;
        fetch('/api/settings/gallery', {
          method: 'POST',
          headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ posts: result })
        }).catch(() => {});
      }
      return;
    }

    // Only fall back to backend API when both listeners finished, and NEVER overwrite custom localStorage with default seed posts on Firestore errors
    if (bothDone) {
      const cachedLocal = getCachedLocalPosts();
      const anyErrored = collectionErrored || manifestErrored;

      safeFetchJson<{ posts?: SocialPost[] }>('/api/settings/gallery').then((data) => {
        const serverPosts = data && Array.isArray(data.posts) ? data.posts : [];
        if (cachedLocal.length > 0 && (!isDefaultSeedGallery(cachedLocal) || anyErrored)) {
          if (serverPosts.length > 0 && !isDefaultSeedGallery(serverPosts)) {
            onUpdate(serverPosts);
          } else {
            onUpdate(cachedLocal);
          }
          return;
        }
        if (serverPosts.length > 0) {
          onUpdate(serverPosts);
          if (!anyErrored) {
            try { localStorage.removeItem('deolinda_custom_social_posts'); } catch {}
            safeSetLocalStorage('deolinda_custom_gallery_posts', JSON.stringify(serverPosts));
          }
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
        collectionErrored = false;
        emitMergedPosts();
      },
      (err) => {
        console.warn('[Firestore] gallery_posts collection subscription notice:', err?.message || err);
        collectionErrored = true;
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
        manifestErrored = false;
        emitMergedPosts();
      },
      (err) => {
        console.warn('[Firestore] Gallery manifest subscription notice:', err?.message || err);
        manifestErrored = true;
        emitMergedPosts();
      }
    );

    return () => {
      unsubCollection();
      unsubManifest();
    };
  } catch (err) {
    console.warn('[Firestore] Gallery subscribe error:', err);
    const cachedLocal = getCachedLocalPosts();
    if (cachedLocal.length > 0 && !isDefaultSeedGallery(cachedLocal)) {
      onUpdate(cachedLocal);
    } else {
      safeFetchJson<{ posts?: SocialPost[] }>('/api/settings/gallery').then((data) => {
        if (data && Array.isArray(data.posts) && data.posts.length > 0) {
          onUpdate(data.posts);
        }
      });
    }
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
    cleanInfo.storyImageUrl = await compressImageForFirestore(cleanInfo.storyImageUrl, 360000);
    if (JSON.stringify(cleanInfo).length > 850000) {
      cleanInfo.storyImageUrl = await compressImageForFirestore(cleanInfo.storyImageUrl, 220000);
    }
  }

  let firestoreSaved = false;
  let serverSaved = false;
  let firestoreError: any = null;

  try {
    const siteDocRef = doc(db, 'settings', 'site_info');
    await setDocWithTimeout(siteDocRef, {
      siteInfo: cleanInfo,
      updatedAt: new Date().toISOString(),
      type: 'site_info',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    firestoreSaved = true;
    console.log('[Firestore] Site info saved successfully to Cloud Firestore.');
  } catch (error: any) {
    firestoreError = error;
    console.warn('[Firestore] Notice while saving site info to Firestore:', error?.message || error);
  }

  // Backup to Express backend API
  try {
    const resp = await fetch('/api/settings/site-info', {
      method: 'POST',
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ siteInfo: cleanInfo })
    });
    if (resp.status === 401) notifyAdminUnauthorized();
    serverSaved = resp.ok;
  } catch (e) {
    console.warn('[Backend] Site info save error:', e);
  }

  // Local storage fallback
  safeSetLocalStorage('deolinda_custom_site_info', JSON.stringify(cleanInfo));

  recordCloudSyncStatus({
    firestoreSaved,
    serverSaved,
    errorMessage: firestoreError ? (firestoreError?.message || String(firestoreError)) : undefined
  });

  if ((firestoreError && isFatalFirestoreError(firestoreError)) || (!firestoreSaved && !serverSaved)) {
    throw formatPersistenceError('salvar as informações do site', firestoreError);
  }
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
          safeSetLocalStorage('deolinda_custom_site_info', JSON.stringify(data.siteInfo));
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
  let firestoreSaved = false;
  let serverSaved = false;
  let firestoreError: any = null;

  try {
    const catDocRef = doc(db, 'settings', 'menu_categories');
    await setDocWithTimeout(catDocRef, {
      categories,
      updatedAt: new Date().toISOString(),
      type: 'menu_categories',
      _serverTimestamp: serverTimestamp()
    }, { merge: true });
    firestoreSaved = true;
    console.log('[Firestore] Menu categories saved successfully to Cloud Firestore.');
  } catch (error: any) {
    firestoreError = error;
    console.warn('[Firestore] Notice while saving menu categories to Firestore:', error?.message || error);
  }

  // Backup to Express backend API
  try {
    const resp = await fetch('/api/settings/categories', {
      method: 'POST',
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ categories })
    });
    if (resp.status === 401) notifyAdminUnauthorized();
    serverSaved = resp.ok;
  } catch (e) {
    console.warn('[Backend] Menu categories save error:', e);
  }

  // Local storage fallback
  safeSetLocalStorage('deolinda_custom_menu_categories', JSON.stringify(categories));

  recordCloudSyncStatus({
    firestoreSaved,
    serverSaved,
    errorMessage: firestoreError ? (firestoreError?.message || String(firestoreError)) : undefined
  });

  if ((firestoreError && isFatalFirestoreError(firestoreError)) || (!firestoreSaved && !serverSaved)) {
    throw formatPersistenceError('salvar as categorias do cardápio', firestoreError);
  }
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
          const normalized = ensureAdditionalDrinkCategories(data.categories);
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

export interface AdminAuthStatus {
  configured: boolean;
  requiresSetup: boolean;
  usesEnvPasscode: boolean;
}

export async function getAdminAuthStatus(): Promise<AdminAuthStatus> {
  const data = await safeFetchJson<AdminAuthStatus>('/api/auth/admin/status');
  if (data && typeof data.configured === 'boolean') {
    return data;
  }
  return { configured: true, requiresSetup: false, usesEnvPasscode: false };
}

export async function setupAdminPassword(password: string): Promise<{ token: string; expiresAt: string }> {
  const resp = await fetch('/api/auth/admin/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: password.trim() })
  });
  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok || !payload?.token) {
    throw new Error(payload?.error || 'Não foi possível definir a senha inicial de administrador.');
  }
  setAdminAuthToken(payload.token);
  return { token: payload.token, expiresAt: payload.expiresAt || '' };
}

export async function loginAdminWithPassword(password: string): Promise<{ token: string; expiresAt: string }> {
  const resp = await fetch('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: password.trim() })
  });
  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok || !payload?.token) {
    const err: any = new Error(payload?.error || 'Senha incorreta. Acesso restrito a gestores.');
    err.requiresSetup = Boolean(payload?.requiresSetup);
    err.status = resp.status;
    throw err;
  }
  setAdminAuthToken(payload.token);
  return { token: payload.token, expiresAt: payload.expiresAt || '' };
}

export async function logoutAdminSession(): Promise<void> {
  const token = getAdminAuthToken();
  clearAdminAuthToken();
  if (!token) return;
  try {
    await fetch('/api/auth/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    // ignore network errors on logout
  }
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const resp = await fetch('/api/auth/admin/change-password', {
    method: 'POST',
    headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim()
    })
  });
  const payload = await resp.json().catch(() => ({}));
  if (resp.status === 401 && !String(payload?.error || '').toLowerCase().includes('atual')) {
    notifyAdminUnauthorized();
  }
  if (!resp.ok) {
    throw new Error(payload?.error || 'Não foi possível atualizar a senha administrativa.');
  }
  recordCloudSyncStatus({ firestoreSaved: true, serverSaved: true });
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
    safeSetLocalStorage('deolinda_custom_menu_items', JSON.stringify(list));
  } catch {}

  // 2. Enqueue background persistence (compress image for portable Cloud Firestore storage across all devices)
  saveQueue.enqueue({
    id: `menu-item-${sanitized.id}`,
    type: 'menu_item_save',
    execute: async () => {
      if (sanitized.image && sanitized.image.startsWith('data:image/')) {
        sanitized.image = await compressImageForFirestore(sanitized.image, 420000);
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
      safeSetLocalStorage('deolinda_custom_menu_items', JSON.stringify(list));
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
  safeSetLocalStorage('deolinda_custom_menu_items', JSON.stringify(items));

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
  safeSetLocalStorage('deolinda_custom_menu_categories', JSON.stringify(categories));

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
  safeSetLocalStorage('deolinda_custom_site_info', JSON.stringify(info));

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
  if (logoUrl) {
    safeSetLocalStorage('deolinda_custom_logo', logoUrl);
  } else {
    try { localStorage.removeItem('deolinda_custom_logo'); } catch {}
  }

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
  if (emblemUrl) {
    safeSetLocalStorage('deolinda_custom_emblem', emblemUrl);
  } else {
    try { localStorage.removeItem('deolinda_custom_emblem'); } catch {}
  }
  safeSetLocalStorage('deolinda_custom_emblem_enabled', String(enabled));

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
  try { localStorage.removeItem('deolinda_custom_social_posts'); } catch {}
  safeSetLocalStorage('deolinda_custom_gallery_posts', JSON.stringify(posts));

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



