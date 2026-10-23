import React, { useState } from 'react';
import { ShieldCheck, Lock, X, KeyRound, AlertCircle, Flame, Eye, EyeOff } from 'lucide-react';
import { unlockAudio } from '../utils/audioAlert';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customAdminPassword?: string | null;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customAdminPassword
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const savedCustomPassword = (customAdminPassword || localStorage.getItem('deolinda_admin_password') || '').trim();
    const enteredPin = pin.trim();
    const cleanEnteredPin = enteredPin.toLowerCase();

    // Default master pins
    const defaultPins = ['1234', 'admin', 'admin123', 'deolinda', 'kds450', 'deolinda123', 'pizza', 'pizzaria', '450'];

    let isAuthorized = false;

    // Check custom password if configured
    if (savedCustomPassword) {
      if (enteredPin === savedCustomPassword || cleanEnteredPin === savedCustomPassword.toLowerCase()) {
        isAuthorized = true;
      }
    }

    // Check default pins
    if (defaultPins.includes(cleanEnteredPin)) {
      isAuthorized = true;
    }

    setTimeout(() => {
      setIsLoading(false);
      if (isAuthorized) {
        // Unlock browser audio context on user authentication action
        unlockAudio();
        onSuccess();
        // Do NOT call onClose() here: App handles closing auth modal and opening AdminDashboard!
        setPin('');
      } else {
        setError('Senha ou PIN incorreto. Acesso restrito a gestores.');
      }
    }, 200);
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181513] text-[#FAF7F2] border border-[#C24D2C]/40 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-[#120F0D] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C24D2C]/20 border border-[#C24D2C]/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#E5A93C]" />
            </div>
            <div>
              <h3 className="font-serif-italian font-bold text-base text-[#FAF7F2]">
                Área do Administrador
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#E5A93C] mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-xs text-white/80 font-medium">
              Digite a senha ou PIN de acesso da equipe:
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/5 border border-white/20 text-[#FAF7F2] placeholder-white/30 text-sm tracking-widest text-center focus:outline-none focus:border-[#C24D2C] focus:ring-1 focus:ring-[#C24D2C]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isLoading || !pin.trim()}
              className="w-full py-3 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#C24D2C]/30 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-[#E5A93C]" />
              <span>{isLoading ? 'Verificando...' : 'Acessar Painel'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar e voltar ao Cardápio
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
