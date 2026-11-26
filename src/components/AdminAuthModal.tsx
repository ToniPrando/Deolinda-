import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, X, KeyRound, AlertCircle, Flame, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { unlockAudio } from '../utils/audioAlert';
import { getAdminAuthStatus, loginAdminWithPassword, setupAdminPassword } from '../services/firebaseService';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [usesEnvPasscode, setUsesEnvPasscode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setError('');
    setPin('');
    setConfirmPin('');
    setIsCheckingStatus(true);
    getAdminAuthStatus()
      .then((status) => {
        if (!active) return;
        setRequiresSetup(Boolean(status.requiresSetup));
        setUsesEnvPasscode(Boolean(status.usesEnvPasscode));
      })
      .catch(() => {
        if (!active) return;
        setRequiresSetup(false);
      })
      .finally(() => {
        if (active) setIsCheckingStatus(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const enteredPin = pin.trim();
    if (!enteredPin) {
      setError('Informe a senha de acesso.');
      return;
    }

    if (requiresSetup) {
      if (enteredPin.length < 4) {
        setError('A senha inicial deve conter pelo menos 4 caracteres.');
        return;
      }
      if (enteredPin !== confirmPin.trim()) {
        setError('As senhas digitadas não conferem.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (requiresSetup) {
        await setupAdminPassword(enteredPin);
      } else {
        await loginAdminWithPassword(enteredPin);
      }
      unlockAudio();
      setPin('');
      setConfirmPin('');
      onSuccess();
    } catch (err: any) {
      if (err?.requiresSetup) {
        setRequiresSetup(true);
      }
      setError(err?.message || 'Senha incorreta. Acesso restrito a gestores.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setConfirmPin('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1B1815] text-[#181513] dark:text-[#FAF7F2] border border-[#E0D5C3] dark:border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-[#FAF7F2] dark:bg-[#141210] border-b border-[#EADFCF] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C24D2C]/10 dark:bg-[#E5A93C]/15 border border-[#C24D2C]/30 dark:border-[#E5A93C]/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#C24D2C] dark:text-[#E5A93C]" />
            </div>
            <div>
              <h3 className="font-serif-italian font-bold text-base text-[#181513] dark:text-[#FAF7F2]">
                Área do Administrador
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-[#5C554E] dark:text-[#C2B8AD] hover:text-[#181513] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7F2] dark:bg-[#24201C] border border-[#E0D5C3] dark:border-white/10 flex items-center justify-center text-[#C24D2C] dark:text-[#E5A93C] mb-2 shadow-2xs">
              {requiresSetup ? <ShieldAlert className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <p className="text-xs text-[#5C554E] dark:text-[#C2B8AD] font-medium">
              {isCheckingStatus
                ? 'Verificando configuração de acesso...'
                : requiresSetup
                ? 'Primeiro acesso: defina uma senha forte para proteger o painel administrativo.'
                : 'Digite a senha de acesso da gerência:'}
            </p>
            {usesEnvPasscode && !requiresSetup && (
              <p className="text-[11px] text-[#8C827A] dark:text-[#A39A90]">
                Autenticação controlada via Secrets do servidor.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                disabled={isCheckingStatus}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder={requiresSetup ? "Nova senha (mín. 4 caracteres)" : "••••••••"}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#12100E] border border-[#E0D5C3] dark:border-white/15 text-[#181513] dark:text-[#FAF7F2] placeholder-[#8C827A] text-sm tracking-widest text-center focus:outline-none focus:border-[#C24D2C] focus:bg-white dark:focus:bg-[#181513] focus:ring-2 focus:ring-[#C24D2C]/20 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#181513] dark:hover:text-white transition-colors cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {requiresSetup && (
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value);
                    setError('');
                  }}
                  placeholder="Confirmar nova senha"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#12100E] border border-[#E0D5C3] dark:border-white/15 text-[#181513] dark:text-[#FAF7F2] placeholder-[#8C827A] text-sm tracking-widest text-center focus:outline-none focus:border-[#C24D2C] focus:bg-white dark:focus:bg-[#181513] focus:ring-2 focus:ring-[#C24D2C]/20 shadow-2xs"
                />
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isLoading || isCheckingStatus || !pin.trim() || (requiresSetup && !confirmPin.trim())}
              className="w-full py-3 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#C24D2C]/30 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-[#E5A93C]" />
              <span>
                {isLoading
                  ? 'Verificando...'
                  : requiresSetup
                  ? 'Definir Senha e Acessar'
                  : 'Acessar Painel'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 text-xs text-[#5C554E] dark:text-[#C2B8AD] hover:text-[#181513] dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancelar e voltar ao Cardápio
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
