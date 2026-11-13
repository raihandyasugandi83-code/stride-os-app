import React, { useState } from 'react';
import {
  Download,
  PlusSquare,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'default' | 'compact';
  showFallbackGuide?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'default',
  showFallbackGuide = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowIOSGuide(true);
    }
  };

  const shouldShowButton = isInstallable || isIOS || showFallbackGuide;
  if (!shouldShowButton) {
    return null;
  }

  const label = isInstallable
    ? 'Install Aplikasi'
    : isIOS
    ? 'Install di iPhone'
    : 'Panduan Install iOS / HP';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'compact'
            ? 'min-h-[44px] px-4 py-2 rounded-xl bg-[#090B0E] border border-slate-700 hover:border-emerald-500/60 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0'
            : 'min-h-[46px] w-full px-4 py-2.5 rounded-xl bg-[#090B0E] border border-slate-700 hover:border-emerald-500/60 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0'
        }
      >
        {isInstallable ? (
          <Download className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span>{label}</span>
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Panduan Install di iPhone"
        >
          <div className="w-full max-w-md bg-[#12161D] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-1">
                  PWA Home Screen Install
                </p>
                <h3 className="font-display text-2xl font-bold text-white">
                  Install STRIDE OS di iPhone
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Tutup panduan"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-[#090B0E] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                  01
                </span>
                <div>
                  <p className="font-semibold text-white mb-0.5">
                    Buka di browser Safari iPhone
                  </p>
                  <p className="text-xs text-slate-400">
                    Pastikan link dibuka di <strong>Safari</strong> (bukan browser dalam aplikasi seperti WhatsApp/Instagram).
                  </p>
                </div>
              </div>

              <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                  02
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Ketuk ikon Share</span>
                    <Share className="w-3.5 h-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-xs text-slate-400">
                    Ikon kotak dengan panah ke atas di bar bagian bawah Safari.
                  </p>
                </div>
              </div>

              <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                  03
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Pilih Add to Home Screen</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-xs text-slate-400">
                    Atau <strong>Tambah ke Layar Utama</strong>, lalu ketuk <strong>Add / Tambah</strong> di pojok kanan atas.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[46px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Mode Offline — Data lokal tetap aktif</span>
    </div>
  );
};
