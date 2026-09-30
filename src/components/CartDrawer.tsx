import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Bike, 
  Store, 
  UtensilsCrossed, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Sparkles, 
  CheckCircle2,
  Send,
  Flame,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
  Award,
  Edit3,
  Check,
  Clock,
  ChevronRight,
  Receipt,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Search,
  Loader2,
  Star,
  Crown,
  Gift,
  Coins,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, Order, CustomerUser } from '../types';
import { GoogleLoginModal } from './GoogleLoginModal';
import { saveOrderToFirestore } from '../services/firebaseService';
import { fetchViaCep, validateCepAndAddress, CepValidationResult } from '../utils/cepValidation';
import { calculateCustomerLoyaltyFromOrders, saveCustomerLoyaltyPoints, CustomerLoyaltyDetails } from '../utils/loyaltyHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
  onOpenTracking?: (order: Order) => void;
  currentUser?: CustomerUser | null;
  onUpdateUser?: (user: CustomerUser | null) => void;
  onLogout?: () => void;
  initialTab?: 'order' | 'history' | 'account';
  onOpenAdmin?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  onOpenTracking,
  currentUser: propCurrentUser,
  onUpdateUser,
  onLogout,
  initialTab = 'order',
  onOpenAdmin
}) => {
  // Top Active Tab inside Drawer: 'order', 'history', or 'account'
  const [activeTab, setActiveTab] = useState<'order' | 'history' | 'account'>(() => {
    if (!propCurrentUser) return 'account';
    return initialTab;
  });

  // Registered Customer State
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    if (propCurrentUser !== undefined) return propCurrentUser;
    try {
      const saved = localStorage.getItem('deolinda_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync activeTab when initialTab, currentUser or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (!currentUser) {
        setActiveTab('account');
      } else {
        setActiveTab(initialTab || 'order');
      }
    }
  }, [isOpen, initialTab, currentUser]);

  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'table'>('delivery');

  // Sync with propCurrentUser
  useEffect(() => {
    if (propCurrentUser !== undefined) {
      setCurrentUser(propCurrentUser);
    }
  }, [propCurrentUser]);

  // User's order history
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Load user orders from localStorage and database API strictly when currentUser is authenticated
  const refreshOrders = async () => {
    if (!currentUser) {
      setUserOrders([]);
      return;
    }
    const cleanPhone = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';
    const cleanEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : '';
    const cleanName = currentUser.name ? currentUser.name.toLowerCase().trim() : '';

    let combinedOrders: Order[] = [];

    // 1. LocalStorage orders
    try {
      const savedOrdersStr = localStorage.getItem('deolinda_orders');
      if (savedOrdersStr) {
        const localList: Order[] = JSON.parse(savedOrdersStr);
        if (Array.isArray(localList)) {
          combinedOrders = [...localList];
        }
      }
    } catch {}

    // 2. Fetch server / database orders
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const serverList: Order[] = await res.json();
        if (Array.isArray(serverList) && serverList.length > 0) {
          const map = new Map<string, Order>();
          combinedOrders.forEach(o => map.set(o.id, o));
          serverList.forEach(o => map.set(o.id, o));
          combinedOrders = Array.from(map.values());
        }
      }
    } catch {}

    // Filter strictly for this customer
    const customerOrders = combinedOrders.filter(o => {
      const ordPhone = o.phone ? o.phone.replace(/\D/g, '') : '';
      const ordEmail = o.email ? o.email.toLowerCase().trim() : '';
      const ordName = o.customerName ? o.customerName.toLowerCase().trim() : '';
      return (
        (cleanPhone && ordPhone && ordPhone === cleanPhone) ||
        (cleanEmail && ordEmail && ordEmail === cleanEmail) ||
        (cleanName && ordName && ordName === cleanName)
      );
    });

    // Sort newest first
    customerOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setUserOrders(customerOrders);
  };

  useEffect(() => {
    if (currentUser) {
      refreshOrders();
    } else {
      setUserOrders([]);
    }
  }, [currentUser, isOpen]);

  // Dynamic Customer Loyalty Details derived from database orders and user profile
  const loyaltyDetails = calculateCustomerLoyaltyFromOrders(currentUser, userOrders);

  // Google Login Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'edit'>('register');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regNeighborhood, setRegNeighborhood] = useState('');
  const [regCity, setRegCity] = useState('São Paulo');
  const [regCep, setRegCep] = useState('');
  const [regComplement, setRegComplement] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // CEP & Address Verification State
  const [isValidatingCep, setIsValidatingCep] = useState(false);
  const [cepValidationInfo, setCepValidationInfo] = useState<CepValidationResult | null>(null);

  // Order Details
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('Mesa 01 (Salão Principal)');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Cartão' | 'Dinheiro'>('Pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Initialize form and load order history when currentUser exists
  useEffect(() => {
    if (currentUser) {
      if (currentUser.address) {
        setDeliveryAddress(currentUser.address);
      }
      setRegName(currentUser.name || '');
      setRegEmail(currentUser.email || '');
      setRegPhone(currentUser.phone || '');
      setRegCpf(currentUser.cpf || '');
      setRegAddress(currentUser.address || '');
      setRegNeighborhood(currentUser.neighborhood || '');
      setRegCity(currentUser.city || 'São Paulo');
      setRegCep(currentUser.cep || '');
      setRegComplement(currentUser.complement || '');
      if (currentUser.password) setRegPassword(currentUser.password);

      // Load orders for this customer
      refreshOrders();
    } else {
      setUserOrders([]);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const deliveryFee = orderType === 'delivery' ? 12.0 : 0.0;
  const grandTotal = subtotal + deliveryFee;
  const loyaltyPointsEarned = Math.floor(grandTotal);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Phone handler - Allows only digits, enforces format: (XX) XXXXX-XXXX (DDD + 9 digits)
  const handlePhoneInputChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 2 && digits.length <= 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
    setRegPhone(formatted);
  };

  // Cross-validate CEP with user address & autofill official postal data
  const handleLookupAndValidateCep = async (cepToTest?: string, userStreet?: string, userNbh?: string, userCt?: string) => {
    const rawCep = cepToTest || regCep;
    const cleanCep = rawCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepValidationInfo({
        isValid: false,
        message: 'Por favor, digite os 8 números do CEP para consulta oficial.'
      });
      return;
    }

    setIsValidatingCep(true);
    setAuthError('');

    try {
      const data = await fetchViaCep(cleanCep);
      if (!data) {
        setCepValidationInfo({
          isValid: false,
          message: `O CEP ${rawCep} não foi encontrado na base oficial dos Correios. Verifique o número digitado.`
        });
        setIsValidatingCep(false);
        return;
      }

      // If user hasn't filled street/neighborhood yet, autofill with official data
      const currentStreet = (userStreet !== undefined ? userStreet : regAddress).trim();
      const currentNbh = (userNbh !== undefined ? userNbh : regNeighborhood).trim();
      const currentCt = (userCt !== undefined ? userCt : regCity).trim();

      if (!currentStreet && data.logradouro) {
        setRegAddress(data.logradouro);
      }
      if (!currentNbh && data.bairro) {
        setRegNeighborhood(data.bairro);
      }
      if (!currentCt && data.localidade) {
        setRegCity(data.localidade);
      }

      const targetStreet = currentStreet || data.logradouro;
      const targetNbh = currentNbh || data.bairro;
      const targetCt = currentCt || data.localidade;

      const result = await validateCepAndAddress(cleanCep, targetStreet, targetNbh, targetCt);
      setCepValidationInfo(result);
      if (!result.isValid) {
        setAuthError(result.message);
      }
    } catch (err) {
      console.warn('Erro ao consultar CEP:', err);
    } finally {
      setIsValidatingCep(false);
    }
  };

  const applyOfficialCepAddress = () => {
    if (!cepValidationInfo?.officialData) return;
    const { logradouro, bairro, localidade } = cepValidationInfo.officialData;
    if (logradouro) setRegAddress(logradouro);
    if (bairro) setRegNeighborhood(bairro);
    if (localidade) setRegCity(localidade);
    
    setCepValidationInfo({
      isValid: true,
      message: `Endereço oficial aplicado: ${logradouro}, ${bairro} - ${localidade}. Lembre-se de incluir o número da residência!`,
      officialData: cepValidationInfo.officialData
    });
    setAuthError('');
  };

  // CEP handler - Allows ONLY numbers, enforces format: 00000-000 (8 digits max)
  const handleCepInputChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 5) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    setRegCep(formatted);
    setCepValidationInfo(null);

    // If 8 digits typed, trigger auto-check & comparison
    if (digits.length === 8) {
      handleLookupAndValidateCep(formatted);
    }
  };

  // Google Login / Link Initiation Handler - Enforces prior registration
  const handleInitiateGoogleLink = async () => {
    setAuthError('');
    setSaveSuccessMsg('');
    if (!currentUser) {
      const nameTrimmed = regName.trim();
      const nameParts = nameTrimmed.split(/\s+/).filter(Boolean);
      if (nameParts.length < 2 || nameParts.some(p => p.length < 2)) {
        setAuthError('Por favor, informe seu Nome e Sobrenome completos no cadastro antes de vincular sua Conta Google (ex: Maria Silva).');
        return;
      }
      const phoneDigits = regPhone.replace(/\D/g, '');
      if (phoneDigits.length !== 11) {
        setAuthError('Por favor, informe seu WhatsApp/Celular válido no padrão DDD (2 números) + 9 números do celular.');
        return;
      }
      const emailTrimmed = regEmail.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (emailTrimmed && !emailRegex.test(emailTrimmed)) {
        setAuthError('Por favor, informe um e-mail válido no formato padrão (ex: seu.nome@dominio.com).');
        return;
      }
      if (!regAddress.trim()) {
        setAuthError('Por favor, preencha o endereço de entrega no cadastro antes de vincular sua Conta Google.');
        return;
      }

      if (regCep.trim()) {
        const cepCheck = await validateCepAndAddress(regCep, regAddress, regNeighborhood, regCity);
        if (!cepCheck.isValid) {
          setAuthError(cepCheck.message);
          setCepValidationInfo(cepCheck);
          return;
        }
      }
    }
    setIsGoogleModalOpen(true);
  };

  // Google Login Success Handler
  const handleGoogleSuccess = (googleData: Partial<CustomerUser>) => {
    setAuthError('');
    setSaveSuccessMsg('');

    // Check if user already exists
    const existing = localStorage.getItem('deolinda_customer_user');
    let existingUser: CustomerUser | null = null;
    if (existing) {
      try {
        existingUser = JSON.parse(existing);
      } catch {
        // ignore
      }
    }

    const fullAddress = [
      regAddress.trim() || existingUser?.address || deliveryAddress || '',
      regComplement.trim() ? `(${regComplement.trim()})` : '',
      regNeighborhood.trim() ? `- ${regNeighborhood.trim()}` : '',
      regCity.trim() ? `${regCity.trim()}` : '',
      regCep.trim() ? `CEP: ${regCep.trim()}` : ''
    ].filter(Boolean).join(' ');

    const updated: CustomerUser = {
      id: existingUser?.id || `CUST-G${Date.now().toString().slice(-4)}`,
      name: regName.trim() || googleData.name || existingUser?.name || 'Cliente Google',
      email: googleData.email || regEmail.trim() || existingUser?.email || '',
      phone: regPhone.trim() || existingUser?.phone || '(11) 99999-9999',
      cpf: regCpf.trim() || existingUser?.cpf || undefined,
      address: fullAddress || existingUser?.address || regAddress || deliveryAddress || '',
      neighborhood: regNeighborhood.trim() || existingUser?.neighborhood || undefined,
      city: regCity.trim() || existingUser?.city || 'São Paulo',
      cep: regCep.trim() || existingUser?.cep || undefined,
      complement: regComplement.trim() || existingUser?.complement || undefined,
      isGoogleAuth: true,
      googleId: googleData.googleId,
      avatarUrl: googleData.avatarUrl,
      createdAt: existingUser?.createdAt || new Date().toISOString()
    };

    localStorage.setItem('deolinda_customer_user', JSON.stringify(updated));
    setCurrentUser(updated);
    onUpdateUser?.(updated);
    if (updated.address) {
      setDeliveryAddress(updated.address);
    }
    setRegName(updated.name);
    setRegEmail(updated.email);
    if (updated.phone) setRegPhone(updated.phone);

    // Save to list
    try {
      const existingListStr = localStorage.getItem('deolinda_customers_list');
      const list: CustomerUser[] = existingListStr ? JSON.parse(existingListStr) : [];
      const idx = list.findIndex(c => c.id === updated.id || c.email === updated.email);
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      localStorage.setItem('deolinda_customers_list', JSON.stringify(list));
    } catch {
      // ignore
    }

    // Inform backend
    try {
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {
      // ignore
    }

    setSaveSuccessMsg(`Cadastro vinculado com sucesso à sua conta Google (${updated.email})!`);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (cartItems.length > 0) {
      setTimeout(() => {
        setActiveTab('order');
        setSaveSuccessMsg('');
      }, 1000);
    }
  };

  // Handle Customer Registration / Edit
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSaveSuccessMsg('');

    // 1. Validar Nome e Sobrenome (mínimo 2 palavras completas)
    const nameTrimmed = regName.trim();
    const nameParts = nameTrimmed.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2 || nameParts.some(p => p.length < 2)) {
      setAuthError('Por favor, informe seu Nome e Sobrenome completos (ex: Giovanni Rossi).');
      return;
    }

    // 2. Validar WhatsApp / Celular (Padrão DD + 9 números do celular, sem texto)
    const phoneDigits = regPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      setAuthError('WhatsApp / Celular inválido. Informe o DDD (2 números) seguido dos 9 números do celular (ex: (11) 99999-9999).');
      return;
    }

    // 3. Validar E-mail (Apenas e-mail padrão com @ e extensão)
    const emailTrimmed = regEmail.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailTrimmed)) {
      setAuthError('E-mail inválido. Informe um e-mail no formato correto com @ e extensão (ex: cliente@email.com).');
      return;
    }

    // 4. Validar CEP (Apenas números) e comparar com o Endereço oficial
    if (regCep.trim()) {
      const cepDigits = regCep.replace(/\D/g, '');
      if (cepDigits.length !== 8) {
        setAuthError('CEP inválido. O CEP deve conter exatamente 8 números (ex: 01426-001).');
        return;
      }

      setIsValidatingCep(true);
      const cepCheck = await validateCepAndAddress(regCep, regAddress, regNeighborhood, regCity);
      setIsValidatingCep(false);

      if (!cepCheck.isValid) {
        setAuthError(cepCheck.message);
        setCepValidationInfo(cepCheck);
        return;
      }
      setCepValidationInfo(cepCheck);
    }

    if (!regAddress.trim()) {
      setAuthError('Por favor, informe seu endereço de entrega (Rua/Avenida e número).');
      return;
    }

    if (authMode === 'register' && !regPassword.trim()) {
      setAuthError('Por favor, defina uma senha de acesso para proteger sua conta.');
      return;
    }

    const fullAddress = [
      regAddress.trim(),
      regComplement.trim() ? `(${regComplement.trim()})` : '',
      regNeighborhood.trim() ? `- ${regNeighborhood.trim()}` : '',
      regCity.trim() ? `${regCity.trim()}` : '',
      regCep.trim() ? `CEP: ${regCep.trim()}` : ''
    ].filter(Boolean).join(' ');

    const updatedUser: CustomerUser = {
      id: currentUser ? currentUser.id : `CUST-${Date.now().toString().slice(-4)}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      cpf: regCpf.trim() || undefined,
      address: fullAddress || regAddress.trim(),
      neighborhood: regNeighborhood.trim() || undefined,
      city: regCity.trim() || 'São Paulo',
      cep: regCep.trim() || undefined,
      complement: regComplement.trim() || undefined,
      isGoogleAuth: currentUser?.isGoogleAuth || false,
      password: regPassword.trim() || (currentUser ? currentUser.password : '123456'),
      createdAt: currentUser ? currentUser.createdAt : new Date().toISOString()
    };

    localStorage.setItem('deolinda_customer_user', JSON.stringify(updatedUser));
    try {
      const existingListStr = localStorage.getItem('deolinda_customers_list');
      const list: CustomerUser[] = existingListStr ? JSON.parse(existingListStr) : [];
      const idx = list.findIndex(c => c.id === updatedUser.id || c.email.toLowerCase() === updatedUser.email.toLowerCase() || c.phone.replace(/\D/g, '') === updatedUser.phone.replace(/\D/g, ''));
      if (idx >= 0) {
        list[idx] = updatedUser;
      } else {
        list.unshift(updatedUser);
      }
      localStorage.setItem('deolinda_customers_list', JSON.stringify(list));
    } catch {
      // ignore
    }

    setCurrentUser(updatedUser);
    onUpdateUser?.(updatedUser);
    setDeliveryAddress(updatedUser.address || '');

    // Send to backend API
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
    } catch {
      console.log('Customer stored locally');
    }

    setSaveSuccessMsg(authMode === 'edit' ? 'Cadastro atualizado com sucesso!' : 'Cadastro e senha criados com sucesso! Você já pode realizar seus pedidos.');
    
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (cartItems.length > 0) {
      setTimeout(() => {
        setActiveTab('order');
        setSaveSuccessMsg('');
      }, 1200);
    }
  };

  // Handle Customer Login with Email/Phone AND Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSaveSuccessMsg('');

    const identifier = loginEmailOrPhone.trim();
    const passwordInput = loginPassword.trim();

    if (!identifier) {
      setAuthError('Informe seu e-mail ou WhatsApp cadastrado.');
      return;
    }

    if (!passwordInput) {
      setAuthError('Por favor, informe sua senha de acesso cadastrada.');
      return;
    }

    const cleanIdent = identifier.toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, '');

    // 1. Search in local customer list
    let matchedCustomer: CustomerUser | null = null;
    try {
      const existingListStr = localStorage.getItem('deolinda_customers_list');
      const list: CustomerUser[] = existingListStr ? JSON.parse(existingListStr) : [];
      
      matchedCustomer = list.find(c => 
        (c.email && c.email.toLowerCase() === cleanIdent) ||
        (c.phone && cleanPhone.length >= 8 && c.phone.replace(/\D/g, '') === cleanPhone)
      ) || null;

      // Also check if current saved user in localStorage matches
      if (!matchedCustomer) {
        const savedUserStr = localStorage.getItem('deolinda_customer_user');
        if (savedUserStr) {
          const savedUser: CustomerUser = JSON.parse(savedUserStr);
          if (
            (savedUser.email && savedUser.email.toLowerCase() === cleanIdent) ||
            (savedUser.phone && cleanPhone.length >= 8 && savedUser.phone.replace(/\D/g, '') === cleanPhone)
          ) {
            matchedCustomer = savedUser;
          }
        }
      }
    } catch (err) {
      console.warn('Error reading local customer list:', err);
    }

    // 2. If not found locally, check backend API
    if (!matchedCustomer) {
      try {
        const res = await fetch('/api/customers');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.customers)) {
            matchedCustomer = data.customers.find((c: CustomerUser) => 
              (c.email && c.email.toLowerCase() === cleanIdent) ||
              (c.phone && cleanPhone.length >= 8 && c.phone.replace(/\D/g, '') === cleanPhone)
            ) || null;
          }
        }
      } catch (err) {
        console.warn('Backend customer lookup error:', err);
      }
    }

    if (matchedCustomer) {
      // Validate Password if user has a password set
      if (matchedCustomer.password && matchedCustomer.password.trim() !== '') {
        if (matchedCustomer.password !== passwordInput) {
          setAuthError('Senha incorreta. Verifique sua senha e tente novamente.');
          return;
        }
      } else {
        // Register password for existing account without password
        matchedCustomer.password = passwordInput;
      }

      localStorage.setItem('deolinda_customer_user', JSON.stringify(matchedCustomer));
      setCurrentUser(matchedCustomer);
      onUpdateUser?.(matchedCustomer);
      if (matchedCustomer.address) setDeliveryAddress(matchedCustomer.address);
      
      setLoginPassword('');
      setSaveSuccessMsg(`Bem-vindo(a) de volta, ${matchedCustomer.name}!`);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (cartItems.length > 0) {
        setTimeout(() => {
          setActiveTab('order');
          setSaveSuccessMsg('');
        }, 1000);
      }
      return;
    }

    // If user not found in records:
    setAuthError('Nenhum cadastro encontrado com este e-mail ou telefone. Por favor, crie seu cadastro na aba "Cadastro".');
  };

  const handleLogout = () => {
    localStorage.removeItem('deolinda_customer_user');
    setCurrentUser(null);
    setUserOrders([]);
    onUpdateUser?.(null);
    onLogout?.();
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegAddress('');
    setRegCpf('');
    setRegNeighborhood('');
    setRegCep('');
    setRegComplement('');
    setRegPassword('');
    setLoginEmailOrPhone('');
    setLoginPassword('');
    setAuthError('');
    setSaveSuccessMsg('Você desconectou da sua conta. Por segurança, o histórico de pedidos foi ocultado.');
    setAuthMode('login');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setActiveTab('account');
      setAuthError('Por favor, faça login com o Google ou complete seu cadastro rápido para enviar o pedido à cozinha.');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setActiveTab('account');
      setAuthMode('edit');
      setAuthError('Por favor, informe seu endereço de entrega no cadastro.');
      return;
    }

    setIsSubmitting(true);

    const pointsEarnedThisOrder = loyaltyPointsEarned;
    const updatedLoyaltyPoints = (loyaltyDetails.points || 0) + pointsEarnedThisOrder;

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: currentUser.name,
      phone: currentUser.phone,
      email: currentUser.email,
      items: cartItems.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.itemTotalPrice,
        crust: item.crustOption,
        notes: item.specialNotes,
        extras: item.extraIngredients.map(e => e.name)
      })),
      total: grandTotal,
      type: orderType,
      address: orderType === 'delivery' ? deliveryAddress : undefined,
      tableNumber: orderType === 'table' ? tableNumber : undefined,
      paymentMethod,
      status: 'received',
      createdAt: new Date().toISOString(),
      estimatedMinutes: orderType === 'delivery' ? 35 : 20,
      customerLoyaltyPoints: updatedLoyaltyPoints,
      pointsEarnedThisOrder: pointsEarnedThisOrder,
      customerTier: loyaltyDetails.tier,
      customerMemberCode: loyaltyDetails.memberCode,
      customerTotalOrders: userOrders.length + 1
    };

    let confirmedServerOrder = newOrder;
    // 1. Instantly push to Cloud Firestore for global real-time cross-device sync
    try {
      await saveOrderToFirestore(newOrder);
      console.log('Order synced to Cloud Firestore:', newOrder.id);
    } catch (fsErr) {
      console.warn('Firestore direct write fallback:', fsErr);
    }

    // 2. Also send to Express backend
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(newOrder)
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData && resData.order) {
          confirmedServerOrder = resData.order;
        }
      }
    } catch (err) {
      console.warn('Backend order sync fallback to local store:', err);
    }

    try {
      const savedOrdersStr = localStorage.getItem('deolinda_orders');
      const savedOrdersList: Order[] = savedOrdersStr ? JSON.parse(savedOrdersStr) : [];
      savedOrdersList.unshift(confirmedServerOrder);
      localStorage.setItem('deolinda_orders', JSON.stringify(savedOrdersList));
      setUserOrders(prev => [confirmedServerOrder, ...prev]);
    } catch {
      // ignore
    }

    // Update customer loyalty points in storage and parent state
    try {
      saveCustomerLoyaltyPoints(currentUser.phone || '', pointsEarnedThisOrder, currentUser.email, currentUser.name);
      const updatedUser: CustomerUser = {
        ...currentUser,
        loyaltyPoints: updatedLoyaltyPoints,
        tier: loyaltyDetails.tier,
        memberCode: loyaltyDetails.memberCode,
        totalOrdersCount: userOrders.length + 1
      };
      setCurrentUser(updatedUser);
      onUpdateUser?.(updatedUser);
    } catch {}

    onOrderPlaced(confirmedServerOrder);
    setConfirmedOrder(confirmedServerOrder);
    setIsSubmitting(false);
    onClearCart();

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.5 }
    });

    if (onOpenTracking) {
      setTimeout(() => {
        onOpenTracking(confirmedServerOrder);
      }, 700);
    }
  };

  const generateWhatsAppOrderLink = () => {
    if (!confirmedOrder) return '#';
    let text = `🍕 *NOVO PEDIDO - DEOLINDA PIZZARIA NAPOLETANA*\n`;
    text += `*Pedido:* #${confirmedOrder.id}\n`;
    text += `*Cliente:* ${confirmedOrder.customerName} (${confirmedOrder.phone})\n`;
    text += `*Tipo:* ${confirmedOrder.type === 'delivery' ? `Delivery (${confirmedOrder.address})` : confirmedOrder.type === 'table' ? confirmedOrder.tableNumber : 'Retirada no Balcão'}\n\n`;
    text += `*ITENS:*\n`;
    confirmedOrder.items.forEach(it => {
      text += `• ${it.quantity}x ${it.name} ${it.crust ? `[${it.crust}]` : ''} - ${formatBRL(it.price)}\n`;
      if (it.extras && it.extras.length > 0) text += `  + Extras: ${it.extras.join(', ')}\n`;
      if (it.notes) text += `  Obs: ${it.notes}\n`;
    });
    text += `\n*TOTAL:* ${formatBRL(confirmedOrder.total)} (${confirmedOrder.paymentMethod})`;

    return `https://wa.me/5511999999999?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end">
        <div className="bg-[#FAF7F2] w-full max-w-lg h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="bg-[#181513] text-white border-b border-[#C24D2C]/40 shadow-md">
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C24D2C] to-[#8C2710] flex items-center justify-center text-white shadow-inner border border-[#E5A93C]/40">
                  <ShoppingBag className="w-5 h-5 text-[#E5A93C]" />
                </div>
                <div>
                  <h3 className="font-serif-italian text-lg font-bold text-white flex items-center gap-2">
                    <span>Meu Pedido Deolinda</span>
                    <span className="text-[10px] bg-[#C24D2C] text-[#FAF7F2] px-2 py-0.5 rounded-full font-sans uppercase font-bold tracking-wider">
                      D.O.P.
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#FAF7F2]/70 flex items-center gap-1.5">
                    {currentUser ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Cliente: {currentUser.name.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-[#E5A93C]">Autêntica Tradição Napolitana D.O.P.</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar painel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MAIN TABS SWITCHER: Carrinho e Histórico só aparecem quando logado */}
            {currentUser ? (
              <div className="flex border-t border-white/10 px-2 sm:px-4 bg-black/30">
                <button
                  type="button"
                  onClick={() => setActiveTab('order')}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'order'
                      ? 'border-[#C24D2C] text-[#E5A93C] bg-white/5'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Carrinho</span>
                  {cartItems.length > 0 && (
                    <span className="bg-[#C24D2C] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                      {cartItems.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    refreshOrders();
                    setActiveTab('history');
                  }}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'border-[#C24D2C] text-[#E5A93C] bg-white/5'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Histórico</span>
                  {userOrders.length > 0 && (
                    <span className="bg-[#1B382B] text-[#E5A93C] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-[#E5A93C]/40">
                      {userOrders.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'account'
                      ? 'border-[#C24D2C] text-[#E5A93C] bg-white/5'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="truncate max-w-[80px] sm:max-w-[100px]">{currentUser.name.split(' ')[0]}</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 bg-black/40 text-xs">
                <div className="flex items-center gap-2 text-amber-200">
                  <Lock className="w-4 h-4 text-[#E5A93C]" />
                  <span className="font-semibold text-xs">Acesso Restrito ao Cliente</span>
                </div>
                <span className="text-[10px] bg-[#C24D2C] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Faça Login / Cadastre-se
                </span>
              </div>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto">
            
            {/* TAB 1: ORDER & CHECKOUT SCREEN (Visível apenas quando logado) */}
            {activeTab === 'order' && currentUser && (
              <div>
                {confirmedOrder ? (
                  /* Order Confirmation Screen */
                  <div className="p-6 space-y-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#1B382B] text-[#E5A93C] mx-auto flex items-center justify-center shadow-xl border border-[#E5A93C]/40">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div>
                      <span className="text-xs uppercase font-bold text-[#C24D2C] tracking-wider">
                        Pedido Enviado para a Cozinha!
                      </span>
                      <h4 className="font-serif-italian text-2xl font-bold text-[#181513] mt-1">
                        #{confirmedOrder.id}
                      </h4>
                      <p className="text-xs text-[#5C554E] mt-1">
                        Grazie, {confirmedOrder.customerName}! Seu pedido foi registrado e já está no fluxo de preparo.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#EADFCF] text-xs text-left space-y-2.5 shadow-sm">
                      <div className="flex justify-between">
                        <span className="text-[#5C554E]">Tempo Estimado:</span>
                        <span className="font-bold text-[#C24D2C]">~{confirmedOrder.estimatedMinutes} minutos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5C554E]">Total:</span>
                        <span className="font-bold text-[#181513]">{formatBRL(confirmedOrder.total)} ({confirmedOrder.paymentMethod})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5C554E]">Modalidade:</span>
                        <span className="font-bold text-[#181513] capitalize">{confirmedOrder.type}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#F0EAE1]">
                        <span className="text-[#5C554E] flex items-center gap-1 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-[#E5A93C] text-[#E5A93C]" />
                          Pontos Ganho Neste Pedido:
                        </span>
                        <span className="font-extrabold text-emerald-700 font-mono">
                          +{confirmedOrder.pointsEarnedThisOrder || Math.floor(confirmedOrder.total)} pts
                        </span>
                      </div>
                      <div className="flex justify-between bg-[#1B382B]/10 p-2 rounded-xl text-[11px] font-bold text-[#1B382B]">
                        <span>Novo Saldo Club Fedeltà:</span>
                        <span className="font-mono text-[#C24D2C] text-xs font-black">
                          {confirmedOrder.customerLoyaltyPoints || loyaltyDetails.points} pts ({confirmedOrder.customerTier || loyaltyDetails.tier})
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {onOpenTracking && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenTracking(confirmedOrder);
                            onClose();
                          }}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C24D2C] to-[#8C2710] hover:from-[#d15430] hover:to-[#9c2b12] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg border border-[#E5A93C]/40 transition-all cursor-pointer animate-pulse"
                        >
                          <Flame className="w-4 h-4 text-[#E5A93C]" />
                          <span>Acompanhar Pedido ao Vivo (Forno 450°C)</span>
                        </button>
                      )}

                      {/* Go to Order History Button */}
                      <button
                        type="button"
                        onClick={() => {
                          refreshOrders();
                          setActiveTab('history');
                          setConfirmedOrder(null);
                        }}
                        className="w-full py-3 rounded-2xl bg-[#1B382B] hover:bg-[#254E3C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md border border-[#2D5F49] transition-all cursor-pointer"
                      >
                        <Receipt className="w-4 h-4 text-[#E5A93C]" />
                        <span>Ver Histórico de Pedidos</span>
                      </button>

                      <a
                        href={generateWhatsAppOrderLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>Confirmar no WhatsApp</span>
                      </a>

                      <button
                        onClick={() => {
                          setConfirmedOrder(null);
                          onClose();
                        }}
                        className="w-full py-2.5 rounded-2xl bg-[#F4EFE6] text-[#181513] font-bold text-xs uppercase tracking-wider hover:bg-[#EADFCF] cursor-pointer"
                      >
                        Fazer Novo Pedido
                      </button>
                    </div>
                  </div>
                ) : cartItems.length === 0 ? (
                  /* Clean Empty Cart State */
                  <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[380px] space-y-4">
                    <div className="w-20 h-20 rounded-full bg-white border border-[#EADFCF] flex items-center justify-center text-[#C24D2C] shadow-sm">
                      <ShoppingBag className="w-10 h-10 opacity-40" />
                    </div>
                    
                    <div>
                      <h4 className="font-serif-italian text-xl font-bold text-[#181513] mb-1">
                        Seu carrinho está vazio
                      </h4>
                      <p className="text-xs text-[#5C554E] max-w-xs leading-relaxed">
                        Escolha suas pizzas napoletanas artesanais e entradas no forno a lenha no cardápio.
                      </p>
                    </div>

                    {userOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          refreshOrders();
                          setActiveTab('history');
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-[#1B382B] text-[#E5A93C] font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-[#254E3C] border border-[#E5A93C]/30 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Ver Histórico de Pedidos ({userOrders.length})</span>
                      </button>
                    )}

                    <button
                      onClick={onClose}
                      className="px-6 py-3 rounded-full bg-[#C24D2C] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#A63A1E] transition-all cursor-pointer"
                    >
                      Explorar Cardápio Napolitano
                    </button>
                  </div>
                ) : (
                  /* Active Cart & Checkout Flow */
                  <div className="p-4 sm:p-5 space-y-5">
                    
                    {/* CUSTOMER LOYALTY BALANCE CARD IN MEU PEDIDO */}
                    {currentUser && (
                      <div className="p-3.5 bg-gradient-to-br from-[#181513] via-[#241C16] to-[#181513] rounded-3xl border border-[#E5A93C]/40 text-white shadow-md space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E5A93C] to-[#B37D1A] text-[#181513] flex items-center justify-center font-black shadow">
                              {loyaltyDetails.tierIcon === '👑' ? <Crown className="w-5 h-5" /> : <Star className="w-5 h-5 fill-[#181513]" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-serif-italian font-bold text-xs text-white">
                                  {currentUser.name}
                                </span>
                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                  loyaltyDetails.tier === 'Maestro Napoletano'
                                    ? 'bg-[#E5A93C] text-[#181513] border-[#E5A93C]'
                                    : loyaltyDetails.tier === 'Pizzaiolo Appassionato'
                                      ? 'bg-emerald-500 text-white border-emerald-400'
                                      : 'bg-amber-500/30 text-[#E5A93C] border-[#E5A93C]/50'
                                }`}>
                                  {loyaltyDetails.tier}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/70 font-mono">
                                {loyaltyDetails.memberCode} • {loyaltyDetails.ordersCount} pedido(s) realizados
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-[#E5A93C] uppercase font-bold tracking-wider block">Saldo de Pontos</span>
                            <div className="flex items-center gap-1 justify-end">
                              <Star className="w-3.5 h-3.5 fill-[#E5A93C] text-[#E5A93C]" />
                              <span className="text-base font-extrabold text-[#E5A93C] font-mono">
                                {loyaltyDetails.points}
                              </span>
                              <span className="text-[10px] text-white/70 font-bold">pts</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Point Accrual Preview for Current Cart */}
                        <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#E5A93C] shrink-0" />
                            <div className="text-[11px] leading-tight">
                              <span className="text-white font-medium">Neste pedido: </span>
                              <span className="text-emerald-400 font-extrabold font-mono">+{loyaltyPointsEarned} pts</span>
                              <span className="text-white/60 text-[10px] block sm:inline sm:ml-1">
                                (Total após compra: <strong className="text-[#E5A93C]">{loyaltyDetails.points + loyaltyPointsEarned} pts</strong>)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              refreshOrders();
                              setActiveTab('history');
                            }}
                            className="text-[10px] font-bold text-[#E5A93C] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>Ver Extrato</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Progress towards Next Reward */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-white/80">
                            <span className="flex items-center gap-1 text-white/90">
                              <Gift className="w-3 h-3 text-[#E5A93C]" />
                              Próximo Resgate: <strong>{loyaltyDetails.nextReward.title}</strong>
                            </span>
                            <span className="text-[#E5A93C] font-bold">
                              {loyaltyDetails.nextReward.pointsRemaining > 0 
                                ? `Faltam ${loyaltyDetails.nextReward.pointsRemaining} pts` 
                                : '🎉 Pronto para resgate!'}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-[#E5A93C] to-[#C24D2C] h-full rounded-full transition-all duration-500"
                              style={{ width: `${loyaltyDetails.nextReward.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Type Toggle */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C554E] block mb-1.5">
                        Modalidade do Pedido
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-2xl border border-[#E0D5C3] shadow-sm">
                        <button
                          type="button"
                          onClick={() => setOrderType('delivery')}
                          className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            orderType === 'delivery' ? 'bg-[#C24D2C] text-white shadow-sm' : 'text-[#5C554E] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <Bike className="w-4 h-4" />
                          <span>Delivery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('pickup')}
                          className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            orderType === 'pickup' ? 'bg-[#C24D2C] text-white shadow-sm' : 'text-[#5C554E] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <Store className="w-4 h-4" />
                          <span>Balcão</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('table')}
                          className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            orderType === 'table' ? 'bg-[#C24D2C] text-white shadow-sm' : 'text-[#5C554E] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <UtensilsCrossed className="w-4 h-4" />
                          <span>Na Mesa</span>
                        </button>
                      </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5C554E]">
                        <span>Pizzas & Itens Escolhidos ({cartItems.length})</span>
                        <button
                          type="button"
                          onClick={onClearCart}
                          className="text-red-500 hover:underline normal-case font-medium text-[11px] cursor-pointer"
                        >
                          Limpar itens
                        </button>
                      </div>

                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-white rounded-2xl border border-[#EADFCF] flex items-start justify-between gap-3 text-xs shadow-sm"
                          >
                            <div className="flex-1">
                              <h5 className="font-bold text-[#181513] text-sm">{item.menuItem.name}</h5>
                              <p className="text-[11px] text-[#C24D2C] font-semibold">{item.crustOption}</p>
                              {item.extraIngredients.length > 0 && (
                                <p className="text-[10px] text-[#5C554E]">
                                  + {item.extraIngredients.map(e => e.name).join(', ')}
                                </p>
                              )}
                              {item.specialNotes && (
                                <p className="text-[10px] text-gray-500 italic mt-0.5">Obs: "{item.specialNotes}"</p>
                              )}
                              <p className="font-bold text-[#181513] mt-1">{formatBRL(item.itemTotalPrice)}</p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.id)}
                                className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E0D5C3] rounded-lg px-2 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                  className="font-bold text-gray-600 hover:text-black text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-bold px-1 text-xs">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                  className="font-bold text-gray-600 hover:text-black text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address or Table Option */}
                    {orderType === 'delivery' && (
                      <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-[#E0D5C3]">
                        <label className="text-[11px] font-bold text-[#181513] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#C24D2C]" />
                            Endereço de Entrega:
                          </span>
                          {currentUser && (
                            <button
                              type="button"
                              onClick={() => {
                                setAuthMode('edit');
                                setActiveTab('account');
                              }}
                              className="text-[10px] text-[#C24D2C] hover:underline"
                            >
                              Alterar no cadastro
                            </button>
                          )}
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Ex: Rua Oscar Freire, 1200 - Apto 42, Jardins, São Paulo"
                          className="w-full p-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C24D2C]"
                        />
                      </div>
                    )}

                    {orderType === 'table' && (
                      <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-[#E0D5C3]">
                        <label className="text-[11px] font-bold text-[#181513] flex items-center gap-1.5">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-[#C24D2C]" />
                          Número da Mesa / Ambiente:
                        </label>
                        <input
                          type="text"
                          required
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="Ex: Mesa 04 (Jardim de Inverno)"
                          className="w-full p-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#E0D5C3] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C24D2C]"
                        />
                      </div>
                    )}

                    {/* Payment Method Selection */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C554E] block mb-1.5">
                        Forma de Pagamento
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'Pix', label: 'Pix Instantâneo', icon: QrCode },
                          { id: 'Cartão', label: 'Cartão na Entrega', icon: CreditCard },
                          { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote }
                        ].map((pm) => (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id as any)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              paymentMethod === pm.id
                                ? 'border-[#C24D2C] bg-[#FFF5F2] text-[#C24D2C] shadow-sm'
                                : 'border-[#E0D5C3] bg-white text-[#5C554E] hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <pm.icon className="w-4 h-4" />
                            <span>{pm.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Loyalty Points Banner */}
                    <div className="p-3 bg-gradient-to-r from-[#1B382B]/15 via-[#E5A93C]/10 to-[#1B382B]/15 rounded-2xl border border-[#1B382B]/25 text-xs text-[#1B382B] flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-[#E5A93C] text-[#E5A93C] shrink-0" />
                        <div>
                          <span className="font-bold text-[#181513]">Você acumulará +{loyaltyPointsEarned} pontos neste pedido!</span>
                          <span className="text-[10px] text-gray-600 block">
                            Saldo após confirmação: <strong className="text-[#C24D2C]">{(loyaltyDetails.points || 0) + loyaltyPointsEarned} pts</strong> (1 pt = R$ 1)
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-[#1B382B] text-[#E5A93C] px-2 py-0.5 rounded-full border border-[#E5A93C]/40 shrink-0">
                        {loyaltyDetails.tier}
                      </span>
                    </div>

                    {/* Pricing Summary & Checkout Button */}
                    <div className="pt-3 border-t border-[#E0D5C3] space-y-2">
                      <div className="flex justify-between text-xs text-[#5C554E]">
                        <span>Subtotal dos itens:</span>
                        <span>{formatBRL(subtotal)}</span>
                      </div>
                      {orderType === 'delivery' && (
                        <div className="flex justify-between text-xs text-[#5C554E]">
                          <span>Taxa de Entrega Segura:</span>
                          <span>{formatBRL(deliveryFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-extrabold text-[#181513] pt-1">
                        <span>Total do Pedido:</span>
                        <span className="text-[#C24D2C]">{formatBRL(grandTotal)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer ${
                          !currentUser
                            ? 'bg-[#1B382B] hover:bg-[#152e23] text-white shadow-[#1B382B]/30'
                            : 'bg-gradient-to-r from-[#C24D2C] to-[#A63A1E] hover:from-[#A63A1E] text-white shadow-[#C24D2C]/30'
                        }`}
                      >
                        <Flame className="w-4 h-4 text-[#E5A93C]" />
                        <span>
                          {!currentUser 
                            ? `Preencher Cadastro para Enviar (${formatBRL(grandTotal)})` 
                            : isSubmitting 
                              ? 'Enviando para a Cozinha...' 
                              : `Enviar Pedido (${formatBRL(grandTotal)})`}
                        </span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HISTÓRICO DE PEDIDOS REALIZADOS (Visível apenas quando logado) */}
            {activeTab === 'history' && currentUser && (
              <div className="p-4 sm:p-5 space-y-4">
                
                {/* CONNECTED STATE: ORDER HISTORY */}
                <div className="space-y-4">
                    
                    {/* CUSTOMER LOYALTY POINTS COMPREHENSIVE STATEMENT CARD */}
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-[#181513] via-[#241C16] to-[#181513] rounded-3xl border border-[#E5A93C]/40 text-white shadow-lg space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E5A93C] to-[#B37D1A] text-[#181513] flex items-center justify-center font-black text-xl shadow border border-[#E5A93C] shrink-0">
                            {loyaltyDetails.tierIcon === '👑' ? <Crown className="w-7 h-7 text-[#181513]" /> : <Star className="w-7 h-7 fill-[#181513] text-[#181513]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif-italian font-bold text-base text-white">
                                {currentUser.name}
                              </h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                loyaltyDetails.tier === 'Maestro Napoletano'
                                  ? 'bg-[#E5A93C] text-[#181513] border-[#E5A93C]'
                                  : loyaltyDetails.tier === 'Pizzaiolo Appassionato'
                                    ? 'bg-emerald-500 text-white border-emerald-400'
                                    : 'bg-amber-500/30 text-[#E5A93C] border-[#E5A93C]/50'
                              }`}>
                                {loyaltyDetails.tier}
                              </span>
                            </div>
                            <p className="text-xs text-white/70">
                              Membro Club Fedeltà • <span className="font-mono text-[#E5A93C] font-semibold">{loyaltyDetails.memberCode}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-center"
                          title="Sair da sua conta neste dispositivo"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sair da Conta</span>
                        </button>
                      </div>

                      {/* Points Metrics Breakdown */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-white/60 uppercase block font-semibold">Saldo Atual</span>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <Star className="w-4 h-4 fill-[#E5A93C] text-[#E5A93C]" />
                            <span className="text-lg font-black text-[#E5A93C] font-mono">
                              {loyaltyDetails.points}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#E5A93C] font-bold">Pontos Válidos</span>
                        </div>

                        <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-white/60 uppercase block font-semibold">Em Pedidos</span>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-lg font-black text-emerald-400 font-mono">
                              +{loyaltyDetails.ordersPointsTotal}
                            </span>
                          </div>
                          <span className="text-[9px] text-white/60 font-semibold">{userOrders.length} pedido(s)</span>
                        </div>

                        <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-white/60 uppercase block font-semibold">Bônus Cadastro</span>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <Gift className="w-4 h-4 text-amber-300" />
                            <span className="text-lg font-black text-amber-300 font-mono">
                              +{loyaltyDetails.welcomeBonusPoints}
                            </span>
                          </div>
                          <span className="text-[9px] text-amber-300 font-semibold">Boas-vindas</span>
                        </div>
                      </div>

                      {/* Rewards Status Overview */}
                      <div className="bg-black/30 p-3 rounded-2xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#E5A93C]">
                          <span className="flex items-center gap-1.5">
                            <Gift className="w-4 h-4" />
                            <span>Resgates por Pontos Acumulados:</span>
                          </span>
                          <span className="text-[10px] text-white/70">1 pt = R$ 1</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className={`p-2 rounded-xl border flex items-center justify-between ${
                            loyaltyDetails.canRedeemAppetizer ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-white/60'
                          }`}>
                            <span>Bruschetta (120 pts)</span>
                            <span className="font-bold">{loyaltyDetails.canRedeemAppetizer ? '✓ Liberado' : `${Math.max(0, 120 - loyaltyDetails.points)} pts`}</span>
                          </div>
                          <div className={`p-2 rounded-xl border flex items-center justify-between ${
                            loyaltyDetails.canRedeemDessert ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-white/60'
                          }`}>
                            <span>Tiramisù (220 pts)</span>
                            <span className="font-bold">{loyaltyDetails.canRedeemDessert ? '✓ Liberado' : `${Math.max(0, 220 - loyaltyDetails.points)} pts`}</span>
                          </div>
                          <div className={`p-2 rounded-xl border flex items-center justify-between ${
                            loyaltyDetails.canRedeemPizza ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-white/60'
                          }`}>
                            <span>Pizza Margherita (400 pts)</span>
                            <span className="font-bold">{loyaltyDetails.canRedeemPizza ? '✓ Liberado' : `${Math.max(0, 400 - loyaltyDetails.points)} pts`}</span>
                          </div>
                          <div className={`p-2 rounded-xl border flex items-center justify-between ${
                            loyaltyDetails.canRedeemWine ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-white/60'
                          }`}>
                            <span>Vinho DOCG (750 pts)</span>
                            <span className="font-bold">{loyaltyDetails.canRedeemWine ? '✓ Liberado' : `${Math.max(0, 750 - loyaltyDetails.points)} pts`}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h5 className="font-serif-italian font-bold text-sm text-[#181513] flex items-center gap-1.5">
                          <Receipt className="w-4 h-4 text-[#C24D2C]" />
                          <span>Meus Pedidos Realizados</span>
                        </h5>
                        <span className="text-xs text-[#5C554E] font-semibold">
                          Total: {userOrders.length} pedido(s)
                        </span>
                      </div>

                      {userOrders.length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl border border-[#E0D5C3] text-center space-y-4 shadow-sm">
                          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#EADFCF] flex items-center justify-center text-[#C24D2C] mx-auto">
                            <Receipt className="w-8 h-8 opacity-40" />
                          </div>
                          <div>
                            <h6 className="font-serif-italian font-bold text-base text-[#181513] mb-1">
                              Nenhum pedido encontrado
                            </h6>
                            <p className="text-xs text-[#5C554E] max-w-xs mx-auto">
                              Assim que você confirmar seu primeiro pedido napolitano, ele aparecerá aqui e acumulará pontos automaticamente no seu saldo.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('order')}
                            className="px-5 py-2.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                          >
                            Ir para o Carrinho de Compras
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {userOrders.map((ord) => {
                            const isLiveOrder = ord.status !== 'completed' && ord.status !== 'cancelled';
                            const pointsFromThisOrder = typeof ord.pointsEarnedThisOrder === 'number' 
                              ? ord.pointsEarnedThisOrder 
                              : Math.floor(ord.total || 0);

                            const formattedDate = ord.createdAt 
                              ? new Date(ord.createdAt).toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : 'Recentemente';

                            return (
                              <div
                                key={ord.id}
                                className={`p-4 sm:p-5 rounded-3xl bg-white border transition-all shadow-sm space-y-3 ${
                                  isLiveOrder ? 'border-[#C24D2C]/40 ring-2 ring-[#C24D2C]/10' : 'border-[#E0D5C3]'
                                }`}
                              >
                                {/* Order Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F0EAE1]">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-serif-italian font-bold text-base text-[#181513]">
                                        #{ord.id}
                                      </span>
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                                        ord.status === 'completed'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : ord.status === 'baking'
                                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                                            : ord.status === 'out_for_delivery'
                                              ? 'bg-orange-100 text-orange-900 animate-pulse'
                                              : 'bg-blue-100 text-blue-900'
                                      }`}>
                                        {ord.status === 'received' && 'Recebido'}
                                        {ord.status === 'preparing' && 'Em Preparo'}
                                        {ord.status === 'baking' && '🔥 No Forno 450°C'}
                                        {ord.status === 'out_for_delivery' && '🛵 Em Rota de Entrega'}
                                        {ord.status === 'completed' && '✓ Concluído'}
                                        {ord.status === 'cancelled' && '✕ Cancelado'}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-[#5C554E] flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3 text-[#C24D2C]" />
                                      <span>{formattedDate}</span>
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-[10px] text-[#5C554E] uppercase block font-semibold">Valor Total</span>
                                    <span className="font-extrabold text-sm text-[#C24D2C]">
                                      {formatBRL(ord.total)}
                                    </span>
                                  </div>
                                </div>

                                {/* Order Points Accrual Badge */}
                                <div className="bg-[#1B382B]/10 p-2.5 rounded-2xl border border-[#1B382B]/20 flex items-center justify-between text-xs text-[#1B382B]">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <Star className="w-3.5 h-3.5 fill-[#E5A93C] text-[#E5A93C]" />
                                    <span>+{pointsFromThisOrder} Pontos de Fidelidade acumulados</span>
                                  </div>
                                  <span className="text-[10px] font-extrabold text-[#181513] bg-white px-2 py-0.5 rounded-lg border border-[#1B382B]/20">
                                    {ord.customerTier || loyaltyDetails.tier}
                                  </span>
                                </div>

                                {/* Order Items List */}
                                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#EADFCF] space-y-2 text-xs">
                                  {ord.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start gap-2">
                                      <div>
                                        <span className="font-bold text-[#181513]">
                                          {item.quantity}x {item.name}
                                        </span>
                                        {item.crust && (
                                          <p className="text-[10px] text-[#C24D2C] font-semibold">
                                            Borda: {item.crust}
                                          </p>
                                        )}
                                        {item.extras && item.extras.length > 0 && (
                                          <p className="text-[10px] text-[#5C554E]">
                                            Extras: {item.extras.join(', ')}
                                          </p>
                                        )}
                                      </div>
                                      <span className="font-semibold text-gray-700 shrink-0">
                                        {formatBRL(item.price)}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Order Details Footer */}
                                <div className="text-xs text-[#5C554E] flex flex-wrap items-center justify-between gap-2 pt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-800 text-[10px] font-bold capitalize">
                                      {ord.type === 'delivery' ? '🛵 Delivery' : ord.type === 'table' ? `🍽️ ${ord.tableNumber || 'Mesa'}` : '🏬 Retirada no Balcão'}
                                    </span>
                                    <span className="text-[11px] font-semibold text-[#181513]">
                                      Pagamento: {ord.paymentMethod}
                                    </span>
                                  </div>

                                  {ord.address && ord.type === 'delivery' && (
                                    <div className="text-[11px] text-gray-500 truncate max-w-xs flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-[#C24D2C] shrink-0" />
                                      <span className="truncate">{ord.address}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Order Actions */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0EAE1]">
                                  {isLiveOrder && onOpenTracking && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onOpenTracking(ord);
                                        onClose();
                                      }}
                                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C24D2C] to-[#8C2710] hover:from-[#d15430] hover:to-[#9c2b12] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                    >
                                      <Flame className="w-3.5 h-3.5 text-[#E5A93C]" />
                                      <span>Acompanhar ao Vivo</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('order');
                                    }}
                                    className="py-2.5 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EADFCF] text-[#181513] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#E0D5C3] transition-all cursor-pointer"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5 text-[#C24D2C]" />
                                    <span>Pedir Novamente</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                {/* Back to Shopping Button */}
                <button
                  type="button"
                  onClick={() => setActiveTab('order')}
                  className="w-full py-3.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#E5A93C]" />
                  <span>Voltar ao Carrinho de Pedidos</span>
                </button>
              </div>
            )}

            {/* TAB 3: REGISTRATION, GOOGLE LINK & MINHA CONTA */}
            {(activeTab === 'account' || !currentUser) && (
              <div className="p-4 sm:p-5 space-y-4">
                
                {/* Header Title for Account Section */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E0D5C3]">
                  <div>
                    <h4 className="font-serif-italian text-lg font-bold text-[#181513] flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[#C24D2C]" />
                      <span>{currentUser ? 'Minha Conta de Cliente' : 'Identificação & Acesso'}</span>
                    </h4>
                    <p className="text-xs text-[#5C554E]">
                      {currentUser 
                        ? 'Gerencie seus dados cadastrais, endereço e acesse seu histórico' 
                        : 'Identifique-se para acessar o carrinho e histórico de pedidos'}
                    </p>
                  </div>
                </div>

                {/* Secure notice banner when logged out */}
                {!currentUser && (
                  <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E0D5C3] flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-[#181513] text-[#E5A93C] flex items-center justify-center shrink-0 border border-[#E5A93C]/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 text-xs text-[#181513]">
                      <h5 className="font-bold text-[12px] text-[#181513]">Acesso Seguro ao Carrinho & Histórico</h5>
                      <p className="text-[11px] text-[#5C554E] leading-snug">
                        Para visualizar seu <strong>Carrinho de Compras</strong> e o <strong>Histórico de Pedidos</strong>, faça login com sua conta cadastrada ou utilize o Google.
                      </p>
                    </div>
                  </div>
                )}

                {/* Alert Messages */}
                {authError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {currentUser && authMode !== 'edit' ? (
                  /* CURRENTLY LOGGED IN CLIENT PROFILE CARD */
                  <div className="space-y-4">
                    <div className="p-5 bg-white rounded-3xl border-2 border-[#1B382B]/30 shadow-md space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#1B382B] text-white flex items-center justify-center font-serif-italian text-xl font-bold border border-[#E5A93C]">
                            {currentUser.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-[#181513]">{currentUser.name}</h5>
                              {currentUser.isGoogleAuth ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                                  Google Conectado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                                  Cadastrado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#5C554E]">{currentUser.email}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#5C554E] block uppercase font-bold">Club Fedeltà</span>
                          <span className="text-sm font-extrabold text-[#C24D2C] flex items-center gap-1 justify-end">
                            <Award className="w-4 h-4 text-[#E5A93C]" />
                            120 pts
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E0D5C3] text-xs space-y-2">
                        <div className="flex items-center gap-2 text-[#181513]">
                          <Phone className="w-3.5 h-3.5 text-[#C24D2C]" />
                          <span className="font-semibold">{currentUser.phone || 'Sem WhatsApp informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5C554E]">
                          <Mail className="w-3.5 h-3.5 text-[#C24D2C]" />
                          <span>{currentUser.email}</span>
                        </div>
                        {currentUser.cpf && (
                          <div className="flex items-center gap-2 text-[#5C554E]">
                            <span className="font-semibold text-gray-700">CPF:</span>
                            <span>{currentUser.cpf}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-[#5C554E] pt-1 border-t border-[#EAE3D7]">
                          <MapPin className="w-3.5 h-3.5 text-[#C24D2C] shrink-0 mt-0.5" />
                          <span>{currentUser.address || 'Endereço não cadastrado'}</span>
                        </div>
                      </div>

                      {/* Google Link Status / Action for Registered Users */}
                      {!currentUser.isGoogleAuth && (
                        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between gap-2">
                          <div className="text-xs text-blue-900">
                            <p className="font-bold text-[11px]">Vincular com o Google</p>
                            <p className="text-[10px] text-blue-700">Conecte sua conta Google a este cadastro.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleInitiateGoogleLink}
                            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-blue-300 text-blue-800 text-[11px] font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"/>
                              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                            </svg>
                            <span>Vincular</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAuthMode('edit')}
                          className="flex-1 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EADFCF] text-[#181513] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#E0D5C3] transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#C24D2C]" />
                          <span>Editar Cadastro</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            refreshOrders();
                            setActiveTab('history');
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-[#1B382B] hover:bg-[#254E3C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-[#E5A93C]" />
                          <span>Ver Histórico</span>
                        </button>
                      </div>

                      {/* PROMINENT LOGOUT BUTTON */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair da Minha Conta</span>
                      </button>
                    </div>

                    {/* Return to Order Button */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('order')}
                      className="w-full py-3.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#E5A93C]" />
                      <span>Ir para o Carrinho de Compras</span>
                    </button>
                  </div>
                ) : (
                  /* REGISTRATION OR LOGIN OR EDIT FORM */
                  <div className="space-y-4">
                    
                    {/* Mode selector (Novo Cadastro / Entrar) */}
                    {authMode !== 'edit' && (
                      <div className="flex bg-white p-1 rounded-2xl border border-[#E0D5C3] text-xs font-bold shadow-sm">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('register'); setAuthError(''); }}
                          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            authMode === 'register' ? 'bg-[#C24D2C] text-white shadow-sm' : 'text-[#5C554E] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Cadastro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setAuthError(''); }}
                          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            authMode === 'login' ? 'bg-[#C24D2C] text-white shadow-sm' : 'text-[#5C554E] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Já Tenho Conta</span>
                        </button>
                      </div>
                    )}

                    {authMode === 'register' || authMode === 'edit' ? (
                      /* CLIENT REGISTRATION / EDIT FORM */
                      <form onSubmit={handleSaveCustomer} className="space-y-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#E0D5C3] shadow-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#181513]">
                            {authMode === 'edit' ? 'Editar Dados do Cliente' : 'Cadastro de Cliente'}
                          </span>
                          {authMode === 'edit' && (
                            <button
                              type="button"
                              onClick={() => setAuthMode('register')}
                              className="text-[11px] text-[#C24D2C] hover:underline cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>

                        {/* Name */}
                        <div>
                          <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                            Nome Completo (Nome e Sobrenome) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Giovanni Rossi"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                          />
                        </div>

                        {/* Phone & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                              WhatsApp / Celular (DDD + 9 dígitos) *
                            </label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              required
                              placeholder="(11) 99999-9999"
                              value={regPhone}
                              onChange={(e) => handlePhoneInputChange(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                              E-mail (Padrão com @ e extensão) *
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="seu.nome@dominio.com"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                            />
                          </div>
                        </div>

                        {/* Senha de Acesso */}
                        <div>
                          <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                            {authMode === 'edit' ? 'Alterar Senha de Acesso (opcional)' : 'Criar Senha de Acesso *'}
                          </label>
                          <div className="relative">
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              required={authMode === 'register'}
                              placeholder={authMode === 'edit' ? 'Deixe em branco para manter a atual' : 'Digite uma senha segura (ex: 1234)'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full p-2.5 pl-9 pr-10 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                            />
                            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                              title={showRegPassword ? 'Ocultar senha' : 'Ver senha'}
                            >
                              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-1">
                            Sua senha protege seu histórico e endereço contra acessos anônimos.
                          </span>
                        </div>

                        {/* Address Fields */}
                        {/* Address Fields */}
                        <div className="pt-2 border-t border-[#F0EAE1] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-[#C24D2C] block">
                              Endereço de Entrega & Validação de CEP
                            </span>
                            <span className="text-[10px] text-[#5C554E] flex items-center gap-1 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Checagem Oficial Correios
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-1">
                              <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                                CEP (8 Dígitos) *
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="01426-001"
                                  value={regCep}
                                  onChange={(e) => handleCepInputChange(e.target.value)}
                                  onBlur={() => {
                                    if (regCep.replace(/\D/g, '').length === 8) {
                                      handleLookupAndValidateCep();
                                    }
                                  }}
                                  className="w-full p-2.5 pr-8 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleLookupAndValidateCep()}
                                  disabled={isValidatingCep || regCep.replace(/\D/g, '').length !== 8}
                                  title="Validar CEP e Comparar Endereço"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5C554E] hover:text-[#C24D2C] disabled:opacity-30 cursor-pointer"
                                >
                                  {isValidatingCep ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C24D2C]" />
                                  ) : (
                                    <Search className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                                Rua / Avenida e Número *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ex: Rua Oscar Freire, 1200"
                                value={regAddress}
                                onChange={(e) => {
                                  setRegAddress(e.target.value);
                                  if (regCep.replace(/\D/g, '').length === 8) {
                                    handleLookupAndValidateCep(regCep, e.target.value, regNeighborhood, regCity);
                                  }
                                }}
                                className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                                Bairro
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Jardins"
                                value={regNeighborhood}
                                onChange={(e) => setRegNeighborhood(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                                Complemento / Apto
                              </label>
                              <input
                                type="text"
                                placeholder="Apto 42, Bloco B"
                                value={regComplement}
                                onChange={(e) => setRegComplement(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                              Cidade / UF
                            </label>
                            <input
                              type="text"
                              value={regCity}
                              onChange={(e) => setRegCity(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                            />
                          </div>

                          {/* CEP & Address Validation Feedback Card */}
                          {isValidatingCep && (
                            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
                              <span>Comparando endereço e CEP com a base oficial dos Correios...</span>
                            </div>
                          )}

                          {!isValidatingCep && cepValidationInfo && (
                            <div
                              className={`p-3 rounded-2xl border text-xs transition-all ${
                                cepValidationInfo.isValid
                                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                {cepValidationInfo.isValid ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                )}
                                <div className="space-y-1 text-left flex-1">
                                  <p className="font-semibold text-[11px] leading-snug">
                                    {cepValidationInfo.message}
                                  </p>
                                  {cepValidationInfo.officialData && !cepValidationInfo.isValid && (
                                    <div className="pt-1 flex flex-wrap gap-2 items-center">
                                      <button
                                        type="button"
                                        onClick={applyOfficialCepAddress}
                                        className="px-2.5 py-1 rounded-lg bg-[#181513] text-white hover:bg-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3 h-3 text-[#E5A93C]" />
                                        <span>Usar Logradouro Oficial deste CEP</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Save Buttons & Google Link Action */}
                        <div className="space-y-2 pt-2">
                          <button
                            type="submit"
                            className="w-full py-3.5 rounded-2xl bg-[#1B382B] hover:bg-[#152e23] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-[#E5A93C]" />
                            <span>{authMode === 'edit' ? 'Atualizar Meu Cadastro' : 'Salvar Cadastro e Pedir'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleInitiateGoogleLink}
                            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm hover:shadow transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"/>
                              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                            </svg>
                            <span>Vincular com a Conta Google</span>
                          </button>
                          
                          <p className="text-[10px] text-gray-500 text-center">
                            * Preencha os campos obrigatórios acima para vincular sua conta Google.
                          </p>
                        </div>
                      </form>
                    ) : (
                      /* CLIENT LOGIN FORM */
                      <form onSubmit={handleLogin} className="space-y-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#E0D5C3] shadow-sm">
                        <div className="pb-2 border-b border-[#F0EAE1] flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#181513]">
                            Entrar com Minha Conta
                          </span>
                          <span className="text-[10px] bg-[#181513] text-[#E5A93C] px-2 py-0.5 rounded-full font-bold">
                            Acesso Seguro
                          </span>
                        </div>

                        {/* E-mail / WhatsApp */}
                        <div>
                          <label className="text-[10px] font-bold text-[#5C554E] uppercase block mb-1">
                            E-mail ou WhatsApp Cadastrado *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="seu@email.com ou (11) 99999-9999"
                              value={loginEmailOrPhone}
                              onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                              className="w-full p-2.5 pl-9 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                            />
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        {/* Senha */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-[#5C554E] uppercase block">
                              Senha de Acesso *
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type={showLoginPassword ? 'text' : 'password'}
                              required
                              placeholder="Digite sua senha cadastrada"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full p-2.5 pl-9 pr-10 rounded-xl border border-[#E0D5C3] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                            />
                            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                              title={showLoginPassword ? 'Ocultar senha' : 'Ver senha'}
                            >
                              {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 rounded-2xl bg-[#181513] hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2"
                        >
                          <LogIn className="w-4 h-4 text-[#E5A93C]" />
                          <span>Entrar na Minha Conta</span>
                        </button>

                        {/* Divider */}
                        <div className="relative flex items-center justify-center my-3">
                          <div className="border-t border-[#E0D5C3] w-full" />
                          <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-gray-400">
                            ou acesse com
                          </span>
                        </div>

                        {/* Google Direct Login Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError('');
                            setIsGoogleModalOpen(true);
                          }}
                          className="w-full py-3 rounded-2xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                          <span>Entrar com a Conta Google</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Rodapé da Janela de Cadastro: Link para Acesso do Administrador (Gestão de Pedidos & Estoque) */}
                <div className="pt-6 pb-4 mt-6 border-t border-[#E0D5C3] text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmin?.();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold text-[#5C554E] hover:text-[#C24D2C] bg-white hover:bg-[#F5EFE6] border border-[#E0D5C3] hover:border-[#C24D2C]/40 transition-all cursor-pointer shadow-sm group"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C24D2C] group-hover:scale-110 transition-transform" />
                    <span>Acesso do Administrador • Pedidos & Estoque</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Acesso restrito à gerência para controle do KDS de pedidos em tempo real e controle de estoque de produtos.
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>
      </div>

      {/* Google Login Modal Popup */}
      <GoogleLoginModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
        initialEmail={currentUser?.email || (regEmail.trim() || 'antonioestefanoprando@gmail.com')}
        initialName={currentUser?.name || (regName.trim() || 'Antonio Estefano')}
      />
    </>
  );
};
