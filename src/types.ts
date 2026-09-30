export type CategoryType = 'tradizionali' | 'speciali' | 'antipasti' | 'dolci' | 'bevande';

export interface MenuItem {
  id: string;
  name: string;
  italianName?: string;
  category: CategoryType;
  description: string;
  price: number;
  image: string;
  tags: ('D.O.P.' | 'Vegetariana' | 'Picante' | 'Chef Choice' | 'Sem Lactose Adaptável')[];
  ingredients: string[];
  pairing?: string; // Wine or beer pairing
  isPopular?: boolean;
  calories?: string;
  isAvailable?: boolean;
  pointsEarned?: number; // Pontos de fidelidade que o cliente ganha ao comprar este item
  pointsToRedeem?: number; // Pontos necessários para resgatar este item de graça
  pointsBonusTag?: string; // Tag de bônus (ex: '+20 pts Bônus', '2x Pontos')
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  crustOption: string;
  extraIngredients: { name: string; price: number }[];
  specialNotes?: string;
  itemTotalPrice: number;
}

export type OrderStatus = 'received' | 'preparing' | 'baking' | 'out_for_delivery' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    crust?: string;
    notes?: string;
    extras?: string[];
  }[];
  total: number;
  type: 'delivery' | 'pickup' | 'table';
  address?: string;
  tableNumber?: string;
  paymentMethod: 'Pix' | 'Cartão' | 'Dinheiro';
  status: OrderStatus;
  createdAt: string;
  estimatedMinutes: number;
  // Informações de Fidelidade do Cliente que fez o Pedido
  customerLoyaltyPoints?: number; // Saldo de pontos do cliente (antes/total com este pedido)
  pointsEarnedThisOrder?: number; // Pontos gerados neste pedido específico
  customerTier?: 'Amici di Deolinda' | 'Pizzaiolo Appassionato' | 'Maestro Napoletano' | string;
  customerMemberCode?: string;
  customerTotalOrders?: number;
}

export type ReservationStatus = 'confirmed' | 'pending' | 'seated' | 'cancelled';

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  area: string;
  occasion?: string;
  notes?: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  cep?: string;
  complement?: string;
  password?: string;
  avatarUrl?: string;
  isGoogleAuth?: boolean;
  googleId?: string;
  createdAt: string;
  loyaltyPoints?: number;
  tier?: 'Amici di Deolinda' | 'Pizzaiolo Appassionato' | 'Maestro Napoletano' | string;
  memberCode?: string;
  totalOrdersCount?: number;
}

export interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  tier: 'Amici di Deolinda' | 'Pizzaiolo Appassionato' | 'Maestro Napoletano';
  joinedDate: string;
  memberCode: string;
  freePizzasEarned: number;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsRequired: number;
  category: string;
  description: string;
  iconName: string;
}

export interface SocialPost {
  id: string;
  imageUrl: string;
  caption: string;
  author: string;
  likes: number;
  timestamp: string;
  isHotOutOfOven?: boolean;
  tags: string[];
}
