import React, { useState } from 'react';
import { ArrowRight, Play, ShieldCheck, Volume2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface WelcomeScreenProps {
  onStartSetup: () => void;
  onLoadDemo: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartSetup,
  onLoadDemo,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="min-h-screen bg-[#090B0E] text-slate-100 flex flex-col lg:grid lg:grid-cols-12">
      {/* Left Narrative Column */}
      <div className="lg:col-span-6 flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 lg:py-14 relative z-10">
        <header className="flex items-center justify-between gap-8">
          <span className="font-display text-2xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0">
            STRIDE <span className="text-emerald-400">OS</span>
          </span>
          <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
            Hybrid Training
          </span>
        </header>

        <main className="my-auto py-12 max-w-xl">
          <p className="text-xs font-semibold tracking-wider uppercase text-emerald-400 mb-3">
            Lari Terjadwal · Agenda Badminton · Tas-Mode Audio Coach
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[0.98] text-balance mb-5">
            Perjalanan latihan hybrid personal lu dimulai dari sini.
          </h1>
          <p className="text-base text-slate-400 leading-relaxed max-w-lg mb-8">
            Sinkronkan blok latihan 5K, 10K, atau Half Marathon dengan jadwal rutin
            badminton tanpa bentrok kelelahan otot. Dilengkapi Tas-Mode Audio Coach
            agar HP cukup disimpan di tas saat berlari.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onStartSetup}
              className="min-h-[48px] px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              <span>Mulai Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onLoadDemo}
              className="min-h-[48px] px-6 py-3.5 rounded-xl bg-[#12161D] hover:bg-[#19202B] border border-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Lihat Contoh Program</span>
            </button>

            <PWAInstallButton variant="compact" />
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tas-Mode Audio Coach</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Jeda persiapan 10 detik lalu hitung mundur nada otomatis untuk tiap segmen interval.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Data Tersimpan Lokal</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seluruh profil fisik, zona detak jantung, dan catatan sepatu tersimpan aman di perangkat lu.
              </p>
            </div>
          </div>
        </main>

        <footer className="text-xs text-slate-500 flex items-center justify-between">
          <span>STRIDE OS · Personal Endurance & Court System</span>
        </footer>
      </div>

      {/* Right Visual Column */}
      <div className="lg:col-span-6 relative min-h-[280px] lg:min-h-screen bg-[#0D1117] overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800/80">
        {!imgError ? (
          <img
            src="/src/assets/images/hero_stride_runner_1794551169998.jpg"
            alt="Pelari berlatih interval di lintasan stadion pada dini hari"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center lg:absolute lg:inset-0"
          />
        ) : (
          <div className="w-full h-full min-h-[280px] bg-gradient-to-br from-[#0F172A] via-[#090B0E] to-emerald-950/40 flex items-center justify-center p-8">
            <div className="text-center">
              <p className="font-display text-4xl font-bold text-emerald-400 tracking-tight">
                STRIDE OS
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hybrid Track & Court Conditioning
              </p>
            </div>
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#090B0E] via-[#090B0E]/35 to-transparent lg:bg-gradient-to-r lg:from-[#090B0E]/90 lg:via-[#090B0E]/20 lg:to-transparent"
          aria-hidden="true"
        />

        {/* Subtle Anchored Track Summary */}
        <div className="absolute bottom-6 left-6 right-6 lg:left-10 lg:right-10 lg:bottom-10 bg-[#090B0E]/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-5">
          <p className="text-xs font-semibold text-emerald-400 mb-1">
            Penjadwalan Anti-Bentrok
          </p>
          <p className="text-sm text-slate-200 leading-snug">
            Otomatis memisahkan sesi Interval & Long Run dari malam rutin badminton agar lutut dan tendon Achilles tetap aman.
          </p>
        </div>
      </div>
    </div>
  );
};
