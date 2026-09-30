import { CustomerUser, Order } from '../types';

export interface CustomerLoyaltyDetails {
  points: number;
  tier: 'Amici di Deolinda' | 'Pizzaiolo Appassionato' | 'Maestro Napoletano';
  tierBadgeColor: string;
  tierIcon: string;
  memberCode: string;
  totalOrders: number;
  canRedeemAppetizer: boolean; // 120 pts (Bruschetta)
  canRedeemDessert: boolean;   // 220 pts (Tiramisù)
  canRedeemPizza: boolean;     // 400 pts (Pizza Margherita Inteira)
  canRedeemWine: boolean;      // 750 pts (Chianti DOCG)
  nextReward: {
    title: string;
    pointsNeeded: number;
    pointsRemaining: number;
    progressPercent: number;
  };
}

/**
 * Calculates tier name based on point balance
 */
export function getTierFromPoints(points: number): 'Amici di Deolinda' | 'Pizzaiolo Appassionato' | 'Maestro Napoletano' {
  if (points >= 600) return 'Maestro Napoletano';
  if (points >= 300) return 'Pizzaiolo Appassionato';
  return 'Amici di Deolinda';
}

/**
 * Computes full loyalty details for a customer given their point balance and order count
 */
export function calculateLoyaltyDetails(points: number, memberCode?: string, totalOrders: number = 1): CustomerLoyaltyDetails {
  const safePoints = Math.max(0, points);
  const tier = getTierFromPoints(safePoints);

  let tierBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  let tierIcon = '🍕';

  if (tier === 'Maestro Napoletano') {
    tierBadgeColor = 'bg-[#181513] text-[#E5A93C] border-[#E5A93C]/50 shadow-sm';
    tierIcon = '👑';
  } else if (tier === 'Pizzaiolo Appassionato') {
    tierBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    tierIcon = '⭐';
  }

  const canRedeemAppetizer = safePoints >= 120;
  const canRedeemDessert = safePoints >= 220;
  const canRedeemPizza = safePoints >= 400;
  const canRedeemWine = safePoints >= 750;

  // Determine next milestone
  let nextRewardTitle = 'Entrada Bruschetta al Pomodoro (120 pts)';
  let targetPts = 120;

  if (safePoints >= 400) {
    nextRewardTitle = 'Garrafa de Vinho Chianti DOCG (750 pts)';
    targetPts = 750;
  } else if (safePoints >= 220) {
    nextRewardTitle = 'Pizza Margherita Inteira Grátis (400 pts)';
    targetPts = 400;
  } else if (safePoints >= 120) {
    nextRewardTitle = 'Tiramisù della Nonna (220 pts)';
    targetPts = 220;
  }

  const pointsRemaining = Math.max(0, targetPts - safePoints);
  const progressPercent = Math.min(100, Math.round((safePoints / targetPts) * 100));

  return {
    points: safePoints,
    tier,
    tierBadgeColor,
    tierIcon,
    memberCode: memberCode || `DEO-${Math.floor(1000 + (safePoints * 7) % 9000)}-VIP`,
    totalOrders: Math.max(1, totalOrders),
    canRedeemAppetizer,
    canRedeemDessert,
    canRedeemPizza,
    canRedeemWine,
    nextReward: {
      title: nextRewardTitle,
      pointsNeeded: targetPts,
      pointsRemaining,
      progressPercent
    }
  };
}

/**
 * Gets a customer's stored loyalty points or estimates from order history
 */
export function getCustomerStoredLoyalty(
  phone?: string,
  email?: string,
  customerName?: string
): CustomerLoyaltyDetails {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const cleanName = customerName ? customerName.toLowerCase().trim() : '';

  // 1. Check direct phone-based loyalty storage
  if (cleanPhone) {
    try {
      const stored = localStorage.getItem(`deolinda_points_${cleanPhone}`);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          return calculateLoyaltyDetails(parsed, `DEO-${cleanPhone.slice(-4)}-FEDELTA`);
        }
      }
    } catch {}
  }

  // 2. Check current logged-in user in localStorage
  try {
    const userStr = localStorage.getItem('deolinda_customer_user');
    if (userStr) {
      const user: CustomerUser = JSON.parse(userStr);
      const uPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
      const uEmail = user.email ? user.email.toLowerCase().trim() : '';
      const uName = user.name ? user.name.toLowerCase().trim() : '';

      if (
        (cleanPhone && uPhone === cleanPhone) ||
        (cleanEmail && uEmail === cleanEmail) ||
        (cleanName && uName === cleanName)
      ) {
        if (typeof user.loyaltyPoints === 'number') {
          return calculateLoyaltyDetails(user.loyaltyPoints, user.memberCode, user.totalOrdersCount || 1);
        }
      }
    }
  } catch {}

  // 3. Known initial sample customers fallback for testing and demo realism
  if (cleanName.includes('matheus') || cleanPhone.includes('987654321')) {
    return calculateLoyaltyDetails(340, 'DEO-8491-FEDELTA', 3);
  }
  if (cleanName.includes('camila') || cleanPhone.includes('971238899')) {
    return calculateLoyaltyDetails(680, 'DEO-8492-VIP', 6);
  }
  if (cleanName.includes('luciano') || cleanPhone.includes('993412030')) {
    return calculateLoyaltyDetails(210, 'DEO-8493-FEDELTA', 2);
  }

  // 4. Default new customer loyalty with welcome bonus (150 pts)
  return calculateLoyaltyDetails(150, undefined, 1);
}

/**
 * Calculates customer loyalty point balance dynamically from database orders and user profile
 */
export function calculateCustomerLoyaltyFromOrders(
  user: CustomerUser | null,
  orders: Order[] = []
): CustomerLoyaltyDetails & {
  ordersPointsTotal: number;
  welcomeBonusPoints: number;
  ordersCount: number;
} {
  if (!user) {
    return {
      ...calculateLoyaltyDetails(0, undefined, 0),
      ordersPointsTotal: 0,
      welcomeBonusPoints: 0,
      ordersCount: 0
    };
  }

  // Calculate points generated from all orders in database
  const ordersPointsTotal = orders.reduce((sum, ord) => {
    if (ord.status === 'cancelled') return sum;
    const pts = typeof ord.pointsEarnedThisOrder === 'number'
      ? ord.pointsEarnedThisOrder
      : Math.floor(ord.total || 0);
    return sum + pts;
  }, 0);

  const welcomeBonusPoints = 150; // Bônus de boas-vindas do Club Fedeltà Deolinda
  
  // Stored points or calculated sum
  let totalBalance = welcomeBonusPoints + ordersPointsTotal;

  // If user profile has an explicitly higher custom balance, use it
  if (typeof user.loyaltyPoints === 'number' && user.loyaltyPoints > totalBalance) {
    totalBalance = user.loyaltyPoints;
  }

  const memberCode = user.memberCode || `DEO-${(user.phone ? user.phone.slice(-4) : '8490')}-VIP`;
  const ordersCount = orders.length;

  const baseDetails = calculateLoyaltyDetails(totalBalance, memberCode, ordersCount || 1);

  return {
    ...baseDetails,
    ordersPointsTotal,
    welcomeBonusPoints,
    ordersCount
  };
}

/**
 * Saves or updates customer points in local storage and returns updated points
 */
export function saveCustomerLoyaltyPoints(
  phone: string,
  pointsToAdd: number,
  email?: string,
  name?: string
): number {
  const cleanPhone = phone.replace(/\D/g, '');
  const current = getCustomerStoredLoyalty(cleanPhone, email, name);
  const updatedPoints = current.points + pointsToAdd;

  if (cleanPhone) {
    try {
      localStorage.setItem(`deolinda_points_${cleanPhone}`, updatedPoints.toString());
    } catch {}
  }

  // Update customer user if matching
  try {
    const userStr = localStorage.getItem('deolinda_customer_user');
    if (userStr) {
      const user: CustomerUser = JSON.parse(userStr);
      const uPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
      if (!cleanPhone || uPhone === cleanPhone) {
        user.loyaltyPoints = updatedPoints;
        user.tier = getTierFromPoints(updatedPoints);
        user.totalOrdersCount = (user.totalOrdersCount || 0) + 1;
        localStorage.setItem('deolinda_customer_user', JSON.stringify(user));
      }
    }
  } catch {}

  return updatedPoints;
}
