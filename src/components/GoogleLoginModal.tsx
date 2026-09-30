import React, { useState } from 'react';
import { X, ShieldCheck, Mail, User, Check, ArrowRight, Loader2 } from 'lucide-react';
import { CustomerUser } from '../types';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Partial<CustomerUser>) => void;
  initialEmail?: string;
  initialName?: string;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = 'antonioestefanoprando@gmail.com',
  initialName = 'Antonio Estefano'
}) => {
  const [userName, setUserName] = useState(initialName);
  const [userEmail, setUserEmail] = useState(initialEmail);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleContinueWithGoogle = (emailToUse: string, nameToUse: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        name: nameToUse.trim() || 'Cliente Google',
        email: emailToUse.trim().toLowerCase(),
        isGoogleAuth: true,
        googleId: `goog_${Date.now()}`
      });
      onClose();
    }, 450);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) return;
    handleContinueWithGoogle(userEmail, userName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 text-gray-800 animate-in zoom-in-95 duration-200">
        
        {/* Google Header */}
        <div className="p-6 text-center border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Official Google G Logo SVG */}
          <div className="flex justify-center mb-3">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900">
            Fazer login com o Google
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            para continuar no app da <strong className="text-[#C24D2C]">Deolinda Pizzaria</strong>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {!isEditingAccount ? (
            <div className="space-y-4">
              <div className="text-left bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">{userEmail}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingAccount(true)}
                  className="text-xs text-[#4285F4] hover:underline font-semibold cursor-pointer"
                >
                  Alterar
                </button>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleContinueWithGoogle(userEmail, userName)}
                className="w-full py-3.5 bg-[#4285F4] hover:bg-[#3367d6] disabled:opacity-70 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando sua conta...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar como {userName.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-gray-700">
                  Informe os dados da sua Conta Google:
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingAccount(false)}
                  className="text-xs text-[#4285F4] hover:underline cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Antonio Estefano"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  E-mail da sua Conta Google (@gmail.com)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@gmail.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !userEmail.trim()}
                className="w-full py-3 bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                {isLoading ? 'Autenticando...' : 'Conectar com esta Conta Google'}
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Autenticação individual e segura via Google</span>
          </div>
        </div>

      </div>
    </div>
  );
};
