import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  FolderOpen,
  ClipboardPaste,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';
import { saveLogoToFirestore, saveEmblemToFirestore } from '../services/firebaseService';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string | null;
  currentEmblemUrl?: string | null;
  isEmblemEnabled?: boolean;
  initialTab?: 'logo' | 'emblem';
  onLogoUpdated: (newLogoUrl: string | null) => void;
  onEmblemUpdated?: (newEmblemUrl: string | null, enabled?: boolean) => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  currentEmblemUrl = null,
  isEmblemEnabled = true,
  initialTab = 'logo',
  onLogoUpdated,
  onEmblemUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'logo' | 'emblem'>('logo');

  // --- LOGO TAB STATE ---
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoFileDetails, setLogoFileDetails] = useState<{ name: string; size: string } | null>(null);

  // --- EMBLEM TAB STATE ---
  const [emblemPreviewUrl, setEmblemPreviewUrl] = useState<string | null>(null);
  const [emblemBase64, setEmblemBase64] = useState<string | null>(null);
  const [emblemUrlInput, setEmblemUrlInput] = useState('');
  const [emblemEnabled, setEmblemEnabled] = useState(true);
  const [emblemFileDetails, setEmblemFileDetails] = useState<{ name: string; size: string } | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      
      // Logo tab sync
      setLogoPreviewUrl(currentLogoUrl || null);
      setLogoBase64(null);
      setLogoUrlInput('');
      setLogoFileDetails(null);

      // Emblem tab sync
      setEmblemPreviewUrl(currentEmblemUrl || null);
      setEmblemBase64(null);
      setEmblemUrlInput('');
      setEmblemEnabled(isEmblemEnabled !== false);
      setEmblemFileDetails(null);

      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, currentLogoUrl, currentEmblemUrl, isEmblemEnabled, initialTab]);

  // Support paste from clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            setSuccessMessage('Imagem colada da área de transferência com sucesso!');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, activeTab]);

  // Support closing modal with Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP ou SVG).');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const details = {
      name: file.name,
      size: formatFileSize(file.size)
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (activeTab === 'logo') {
        setLogoPreviewUrl(result);
        setLogoBase64(result);
        setLogoFileDetails(details);
      } else {
        setEmblemPreviewUrl(result);
        setEmblemBase64(result);
        setEmblemFileDetails(details);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleOpenFilePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const optimizeImage = (dataUrl: string, maxDim = 500): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.92));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // --- SAVE LOGO ---
  const handleSaveLogo = async () => {
    if (!logoBase64 && !logoUrlInput.trim()) {
      setErrorMessage('Por favor, selecione uma imagem ou informe um link válido antes de salvar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let finalLogoUrl = logoUrlInput.trim() || logoBase64;
      if (logoBase64) {
        finalLogoUrl = await optimizeImage(logoBase64, 450);
      }

      // 1. Direct Cloud Firestore write
      await saveLogoToFirestore(finalLogoUrl);

      // 2. Local backend fallback
      try {
        await fetch('/api/settings/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoUrl: finalLogoUrl })
        });
      } catch (backendErr) {
        console.warn('Backend server logo endpoint fallback error:', backendErr);
      }

      setSuccessMessage('Logotipo sincronizado na nuvem e atualizado em todos os dispositivos!');
      onLogoUpdated(finalLogoUrl);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving logo:', err);
      setErrorMessage('Erro ao salvar o logotipo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- RESET LOGO ---
  const handleResetLogo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await saveLogoToFirestore(null);
      try {
        await fetch('/api/settings/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoUrl: null, imageBase64: null })
        });
      } catch (e) {
        console.warn(e);
      }

      onLogoUpdated(null);
      setLogoPreviewUrl(null);
      setLogoBase64(null);
      setLogoUrlInput('');
      setLogoFileDetails(null);
      setSuccessMessage('Logotipo restaurado para o padrão oficial da Deolinda.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Erro ao restaurar o logotipo padrão.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- SAVE EMBLEM ---
  const handleSaveEmblem = async () => {
    if (!emblemBase64 && !emblemUrlInput.trim() && !emblemPreviewUrl) {
      setErrorMessage('Por favor, selecione uma imagem ou link para o emblema anexo.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let finalEmblemUrl = emblemUrlInput.trim() || emblemBase64 || emblemPreviewUrl;
      if (emblemBase64) {
        finalEmblemUrl = await optimizeImage(emblemBase64, 600);
      }

      // 1. Direct Cloud Firestore write
      await saveEmblemToFirestore(finalEmblemUrl, emblemEnabled);

      // 2. Local backend fallback
      try {
        await fetch('/api/settings/emblem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emblemUrl: finalEmblemUrl,
            enabled: emblemEnabled
          })
        });
      } catch (backendErr) {
        console.warn('Backend server emblem endpoint fallback error:', backendErr);
      }

      setSuccessMessage('Imagem anexa sincronizada com sucesso no cabeçalho e página inicial!');
      if (onEmblemUpdated) {
        onEmblemUpdated(finalEmblemUrl, emblemEnabled);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving emblem:', err);
      setErrorMessage('Erro ao salvar a imagem anexa. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- REMOVE / RESET EMBLEM ---
  const handleRemoveEmblem = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await saveEmblemToFirestore(null, false);
      try {
        await fetch('/api/settings/emblem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emblemUrl: null, enabled: false })
        });
      } catch (e) {
        console.warn(e);
      }

      if (onEmblemUpdated) {
        onEmblemUpdated(null, false);
      }
      setEmblemPreviewUrl(null);
      setEmblemBase64(null);
      setEmblemUrlInput('');
      setEmblemFileDetails(null);
      setSuccessMessage('Imagem anexa removida com sucesso de todas as páginas.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Erro ao remover a imagem anexa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#181513] border-2 border-[#E5A93C]/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-[#FAF7F2] p-5 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#C24D2C]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C24D2C] to-[#8C2A12] border border-[#E5A93C]/40 flex items-center justify-center text-[#E5A93C] shadow-lg shadow-[#C24D2C]/30">
              <Sparkles className="w-5 h-5 text-[#FAF7F2]" />
            </div>
            <div>
              <h3 className="font-serif-italian text-xl font-bold text-[#FAF7F2]">
                Personalizar Logotipos & Imagens
              </h3>
              <p className="text-xs text-[#FAF7F2]/65">
                Pizzaria Deolinda — Atualização em tempo real na nuvem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#FAF7F2]/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="mt-4 flex p-1 bg-white/5 border border-white/10 rounded-2xl gap-1 relative z-10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('logo');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'logo'
                ? 'bg-gradient-to-r from-[#C24D2C] to-[#E5A93C] text-white shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>1. Logotipo Principal (Circular)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('emblem');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'emblem'
                ? 'bg-gradient-to-r from-[#C24D2C] to-[#E5A93C] text-white shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Imagem Anexa (Ao lado & Embaixo)</span>
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: LOGOTIPO PRINCIPAL (CIRCULAR) */}
        {/* ========================================================= */}
        {activeTab === 'logo' && (
          <div className="mt-4 space-y-4 relative z-10">
            <p className="text-xs text-white/70 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
              Altera a insígnia circular oficial da Pizzaria Deolinda exibida no topo do cabeçalho, no banner principal e nos documentos.
            </p>

            {/* Drop & Select Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                dragActive 
                  ? 'border-[#E5A93C] bg-[#E5A93C]/15 scale-[1.01]' 
                  : 'border-white/20 bg-white/[0.03] hover:border-[#E5A93C]/60 hover:bg-white/[0.06]'
              }`}
            >
              {logoPreviewUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0D0B0A] border-2 border-[#E5A93C]/60 p-2 flex items-center justify-center overflow-hidden shadow-2xl relative">
                    <img
                      src={logoPreviewUrl}
                      alt="Prévia do logotipo"
                      className="w-full h-full object-contain filter drop-shadow-md"
                    />
                  </div>

                  <div className="text-center">
                    <span className="text-xs text-[#E5A93C] font-bold block">
                      {logoBase64 ? '✨ Nova imagem carregada e pronta para aplicar!' : 'Logotipo atual em exibição'}
                    </span>
                    {logoFileDetails && (
                      <span className="text-[11px] text-white/70 block mt-0.5 font-mono">
                        {logoFileDetails.name} ({logoFileDetails.size})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#FAF7F2] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <FolderOpen className="w-4 h-4 text-[#E5A93C]" />
                    <span>Escolher outro arquivo do computador</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C24D2C]/30 to-[#8C2A12]/30 border border-[#E5A93C]/40 flex items-center justify-center text-[#E5A93C] shadow-lg">
                    <Upload className="w-6 h-6 text-[#E5A93C]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Arraste o arquivo aqui ou clique abaixo
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">
                      PNG (fundo transparente recomendado), JPG, WebP ou SVG
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    className="mt-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C24D2C] to-[#E5A93C] hover:brightness-110 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#C24D2C]/40 transition-all cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Selecionar Imagem do Computador</span>
                  </button>

                  <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                    <ClipboardPaste className="w-3.5 h-3.5 text-[#E5A93C]" />
                    <span>Dica: cole direto com <strong>Ctrl + V</strong></span>
                  </p>
                </div>
              )}
            </div>

            {/* Direct URL Alternative */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
                <span>Ou cole o link direto da imagem (URL)</span>
                <ImageIcon className="w-3.5 h-3.5 text-[#E5A93C]" />
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/logotipo.png"
                  value={logoUrlInput}
                  onChange={(e) => {
                    setLogoUrlInput(e.target.value);
                    if (e.target.value.startsWith('http')) {
                      setLogoPreviewUrl(e.target.value);
                      setLogoBase64(null);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#E5A93C] transition-colors"
                />
                {logoUrlInput.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoPreviewUrl(logoUrlInput.trim());
                      setLogoBase64(null);
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-xs text-[#E5A93C] font-semibold rounded-xl border border-white/20 cursor-pointer"
                  >
                    Ver Prévia
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetLogo}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-950/40 text-white/60 hover:text-rose-300 border border-transparent hover:border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveLogo}
                  disabled={isLoading || (!logoBase64 && !logoUrlInput.trim())}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C24D2C] via-[#D95F38] to-[#E5A93C] text-white text-xs font-bold shadow-xl shadow-[#C24D2C]/40 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aplicar Logotipo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: IMAGEM ANEXA (AO LADO DO CABEÇALHO & EMBAIXO NO HERO) */}
        {/* ========================================================= */}
        {activeTab === 'emblem' && (
          <div className="mt-4 space-y-4 relative z-10">
            <div className="bg-[#FAF7F2]/10 p-3.5 rounded-2xl border border-[#E5A93C]/30 text-xs text-white/85 space-y-1">
              <p className="font-bold text-[#E5A93C] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#E5A93C]" />
                Ferramenta de Imagem Anexa:
              </p>
              <p className="leading-relaxed">
                Esta imagem será posicionada <strong>ao lado</strong> do logo no cabeçalho e centralizada <strong>embaixo</strong> do logo na página principal, preservando 100% a forma íntegra e sem cortes.
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <span className="text-xs font-bold text-white block">Exibir imagem no site</span>
                <span className="text-[11px] text-white/60">
                  {emblemEnabled ? 'Visível no cabeçalho e página principal' : 'Oculto temporariamente'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEmblemEnabled(!emblemEnabled)}
                className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  emblemEnabled 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {emblemEnabled ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ativado</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Desativado</span>
                  </>
                )}
              </button>
            </div>

            {/* Drop & Select Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                dragActive 
                  ? 'border-[#E5A93C] bg-[#E5A93C]/15 scale-[1.01]' 
                  : 'border-white/20 bg-white/[0.03] hover:border-[#E5A93C]/60 hover:bg-white/[0.06]'
              }`}
            >
              {emblemPreviewUrl ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  {/* Interactive Dual Preview Simulator */}
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    {/* 1. Header simulator (ao lado do logo) */}
                    <div className="p-3 rounded-xl bg-[#120F0D] border border-white/15">
                      <span className="text-[10px] font-bold text-[#E5A93C] uppercase tracking-wider block mb-2">
                        1. Ao lado no Cabeçalho:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-[#181513] border border-[#E5A93C] p-0.5 shrink-0 overflow-hidden">
                          <img
                            src={logoPreviewUrl || currentLogoUrl || "/deolinda_logo.png"}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <img
                          src={emblemPreviewUrl}
                          alt="Imagem anexa ao lado"
                          className="h-8 w-auto max-w-[120px] object-contain drop-shadow-md"
                        />
                        <span className="text-[8px] uppercase font-extrabold text-[#E5A93C] bg-[#C24D2C]/30 px-1 py-0.5 rounded border border-[#E5A93C]/30">
                          D.O.P.
                        </span>
                      </div>
                    </div>

                    {/* 2. Hero simulator (embaixo do logo) */}
                    <div className="p-3 rounded-xl bg-[#14110F] border border-white/15 text-center">
                      <span className="text-[10px] font-bold text-[#E5A93C] uppercase tracking-wider block mb-1">
                        2. Embaixo na Página Principal:
                      </span>
                      <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                        <div className="w-10 h-10 rounded-full bg-[#181513] border border-[#E5A93C] p-0.5 shrink-0 overflow-hidden">
                          <img
                            src={logoPreviewUrl || currentLogoUrl || "/deolinda_logo.png"}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <img
                          src={emblemPreviewUrl}
                          alt="Imagem anexa embaixo"
                          className="h-9 w-auto max-w-[130px] object-contain drop-shadow-md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-xs text-[#E5A93C] font-bold block">
                      {emblemBase64 ? '✨ Nova imagem carregada e pronta para salvar!' : 'Imagem anexa configurada'}
                    </span>
                    {emblemFileDetails && (
                      <span className="text-[11px] text-white/70 block mt-0.5 font-mono">
                        {emblemFileDetails.name} ({emblemFileDetails.size})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#FAF7F2] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <FolderOpen className="w-4 h-4 text-[#E5A93C]" />
                    <span>Escolher outro arquivo do computador</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C24D2C]/30 to-[#8C2A12]/30 border border-[#E5A93C]/40 flex items-center justify-center text-[#E5A93C] shadow-lg">
                    <Upload className="w-6 h-6 text-[#E5A93C]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Arraste a imagem anexa aqui ou clique abaixo
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">
                      Ficará ao lado do logo no topo e embaixo na home
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    className="mt-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C24D2C] to-[#E5A93C] hover:brightness-110 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#C24D2C]/40 transition-all cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Selecionar Imagem Anexa</span>
                  </button>

                  <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                    <ClipboardPaste className="w-3.5 h-3.5 text-[#E5A93C]" />
                    <span>Dica: cole direto com <strong>Ctrl + V</strong></span>
                  </p>
                </div>
              )}
            </div>

            {/* Direct URL Alternative */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
                <span>Ou informe o link direto da imagem (URL)</span>
                <ImageIcon className="w-3.5 h-3.5 text-[#E5A93C]" />
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/emblema.png"
                  value={emblemUrlInput}
                  onChange={(e) => {
                    setEmblemUrlInput(e.target.value);
                    if (e.target.value.startsWith('http')) {
                      setEmblemPreviewUrl(e.target.value);
                      setEmblemBase64(null);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#E5A93C] transition-colors"
                />
                {emblemUrlInput.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmblemPreviewUrl(emblemUrlInput.trim());
                      setEmblemBase64(null);
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-xs text-[#E5A93C] font-semibold rounded-xl border border-white/20 cursor-pointer"
                  >
                    Ver Prévia
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRemoveEmblem}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-950/40 text-white/60 hover:text-rose-300 border border-transparent hover:border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Imagem Anexa</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmblem}
                  disabled={isLoading || (!emblemBase64 && !emblemUrlInput.trim() && !emblemPreviewUrl)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C24D2C] via-[#D95F38] to-[#E5A93C] text-white text-xs font-bold shadow-xl shadow-[#C24D2C]/40 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Salvar Imagem Anexa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
