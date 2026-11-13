import React, { useMemo, useState } from 'react';
import { Footprints, HeartPulse, Plus, RotateCcw } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ShoeItem, UserProfile } from '../types/training';
import {
  calculateAge,
  calculateHeartRateZones,
  calculateMaxHr,
  formatPace,
} from '../utils/trainingEngine';

interface DashboardYouProps {
  profile: UserProfile;
  shoes: ShoeItem[];
  onAddShoe: (brandModel: string, initialKm: number) => void;
  onSetPrimaryShoe: (shoeId: string) => void;
  onEditSetup: () => void;
  onResetAll: () => void;
}

export const DashboardYou: React.FC<DashboardYouProps> = ({
  profile,
  shoes,
  onAddShoe,
  onSetPrimaryShoe,
  onEditSetup,
  onResetAll,
}) => {
  const [showAddShoe, setShowAddShoe] = useState(false);
  const [newShoeName, setNewShoeName] = useState('');
  const [newShoeKm, setNewShoeKm] = useState('0');
  const [shoeImgError, setShoeImgError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const zones = useMemo(
    () => calculateHeartRateZones(profile.dob, profile.restingHr),
    [profile.dob, profile.restingHr]
  );
  const maxHr = useMemo(() => calculateMaxHr(profile.dob), [profile.dob]);
  const age = useMemo(() => calculateAge(profile.dob), [profile.dob]);

  const handleAddShoeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShoeName.trim()) return;
    onAddShoe(newShoeName.trim(), Math.max(0, Number(newShoeKm) || 0));
    setNewShoeName('');
    setNewShoeKm('0');
    setShowAddShoe(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Profil Atlet & Perlengkapan
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {profile.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Profile & HR Zones (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Profil & Training Plan
                </h2>
                <p className="text-base font-bold text-white">
                  Target {profile.goal} ({profile.level})
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Usia {age} thn · Berat {profile.weight} kg · Easy Pace{' '}
                  <span className="font-mono tabular-nums text-slate-200">
                    {formatPace(profile.easyPaceSec)} /km
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={onEditSetup}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#090B0E] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Ganti Program / Naik Level
              </button>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <HeartPulse className="w-4 h-4 text-emerald-400" />
                  <span>Zona Detak Jantung Personal</span>
                </div>
                <span className="font-mono tabular-nums text-xs text-slate-300">
                  Max HR {maxHr} bpm
                </span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {zones.map((z) => (
                  <div
                    key={z.zone}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white">
                        {z.zone} · {z.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {z.description}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="text-sm font-bold text-emerald-400">
                        {z.minBpm}–{z.maxBpm} bpm
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {z.pctRange}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Install on iOS / Mobile Card */}
          <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">
                Install sebagai Aplikasi (iOS & Android)
              </h3>
              <p className="text-xs text-slate-400">
                Tambahkan STRIDE OS ke Layar Utama iPhone agar tampil penuh tanpa bar browser dan tetap jalan offline.
              </p>
            </div>
            <PWAInstallButton variant="compact" showFallbackGuide />
          </div>

          {/* Reset Section */}
          <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">
                Data Vault Lokal
              </h3>
              <p className="text-xs text-slate-400">
                Reset seluruh profil, jadwal, dan riwayat latihan dari perangkat ini.
              </p>
            </div>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#090B0E] border border-slate-700 hover:border-red-500/50 text-xs font-semibold text-slate-300 hover:text-red-400 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#090B0E] border border-slate-700 text-xs text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onResetAll}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold cursor-pointer"
                >
                  Ya, Hapus Semua
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Shoe Mileage Vault (5 cols) */}
        <div className="lg:col-span-5 bg-[#12161D] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="aspect-[4/3] w-full bg-[#090B0E] relative overflow-hidden border-b border-slate-800">
            {!shoeImgError ? (
              <img
                src="/src/assets/images/gear_running_shoe_1794551169934.jpg"
                alt="Sepatu lari utama dalam rotasi latihan"
                referrerPolicy="no-referrer"
                onError={() => setShoeImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-emerald-950/30 p-6">
                <Footprints className="w-10 h-10 text-emerald-400 mb-2" />
                <span className="text-xs text-slate-400">Shoe Rotation Vault</span>
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#12161D] via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Shoe Mileage Vault
              </h2>
              <button
                type="button"
                onClick={() => setShowAddShoe((v) => !v)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#090B0E] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sepatu</span>
              </button>
            </div>

            {showAddShoe && (
              <form
                onSubmit={handleAddShoeSubmit}
                className="bg-[#090B0E] border border-slate-800 rounded-xl p-4 space-y-3"
              >
                <input
                  type="text"
                  placeholder="Contoh: Nike Pegasus 41"
                  value={newShoeName}
                  onChange={(e) => setNewShoeName(e.target.value)}
                  className="w-full bg-[#12161D] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Km awal"
                    value={newShoeKm}
                    onChange={(e) => setNewShoeKm(e.target.value)}
                    className="w-28 bg-[#12161D] border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="flex-1 min-h-[38px] rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {shoes.map((shoe) => {
                const pct = Math.min(
                  100,
                  Math.round((shoe.currentKm / shoe.maxKm) * 100)
                );
                const nearLimit = pct >= 85;
                return (
                  <div
                    key={shoe.id}
                    className="bg-[#090B0E] border border-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {shoe.brandModel}
                        </div>
                        <div className="text-xs text-slate-400">
                          {shoe.isPrimary ? 'Sepatu Utama · ' : ''}
                          {nearLimit
                            ? 'Busa mendekati batas 600 km'
                            : 'Kondisi busa masih prima'}
                        </div>
                      </div>
                      {!shoe.isPrimary && (
                        <button
                          type="button"
                          onClick={() => onSetPrimaryShoe(shoe.id)}
                          className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Jadikan Utama
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono tabular-nums mb-1.5">
                      <span className="text-slate-300">
                        {shoe.currentKm.toFixed(1)} / {shoe.maxKm} km
                      </span>
                      <span
                        className={
                          nearLimit ? 'text-amber-400' : 'text-emerald-400'
                        }
                      >
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          nearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
