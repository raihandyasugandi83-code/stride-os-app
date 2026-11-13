import React, { useMemo, useState } from 'react';
import { BarChart3, Plus, Trash2, X } from 'lucide-react';
import { ActivityLog, ShoeItem, UserProfile } from '../types/training';
import {
  evaluateActivity,
  formatPace,
  parsePaceToSec,
} from '../utils/trainingEngine';

interface DashboardActivitiesProps {
  profile: UserProfile;
  activities: ActivityLog[];
  shoes: ShoeItem[];
  onAddManualActivity: (activity: Omit<ActivityLog, 'id' | 'dateIso' | 'evaluation'>) => void;
  onDeleteActivity: (id: string) => void;
}

export const DashboardActivities: React.FC<DashboardActivitiesProps> = ({
  profile,
  activities,
  shoes,
  onAddManualActivity,
  onDeleteActivity,
}) => {
  const [filter, setFilter] = useState<'all' | 'run' | 'badminton'>('all');
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState<'run' | 'badminton'>('run');
  const [title, setTitle] = useState('Easy Run Sore');
  const [distanceKm, setDistanceKm] = useState('5.0');
  const [durationMin, setDurationMin] = useState('28');
  const [avgPaceInput, setAvgPaceInput] = useState(
    formatPace(profile.easyPaceSec)
  );
  const [avgHr, setAvgHr] = useState('148');
  const [rpe, setRpe] = useState('6');
  const [shoeId, setShoeId] = useState(
    shoes.find((s) => s.isPrimary)?.id || shoes[0]?.id || ''
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return activities;
    return activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  const latestRun = activities.find((a) => a.type === 'run') || activities[0];

  const totalRunKm = useMemo(
    () =>
      activities
        .filter((a) => a.type === 'run')
        .reduce((acc, a) => acc + a.distanceKm, 0),
    [activities]
  );

  const totalSessions = activities.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dist = type === 'run' ? Math.max(0.5, Number(distanceKm) || 5) : 0;
    const dur = Math.max(5, Number(durationMin) || 30);
    const paceSec = type === 'run' ? parsePaceToSec(avgPaceInput) : 0;
    const hr = Math.max(85, Math.min(210, Number(avgHr) || 145));
    const rpeNum = Math.max(1, Math.min(10, Number(rpe) || 6));

    onAddManualActivity({
      title:
        title.trim() ||
        (type === 'badminton' ? 'Sesi Badminton' : 'Sesi Lari Manual'),
      type,
      durationMin: dur,
      distanceKm: dist,
      avgPaceSec: paceSec,
      avgHr: hr,
      rpe: rpeNum,
      shoeId: type === 'run' && shoeId ? shoeId : undefined,
      tasModeUsed: false,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Analisis & Riwayat Latihan
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Rapor Evaluasi Pace & HR
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="min-h-[44px] self-start sm:self-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Tutup Form' : 'Catat Latihan Manual'}</span>
        </button>
      </div>

      {/* Manual Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#12161D] border border-emerald-500/35 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setType('run');
                setTitle('Easy Run Sore');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                type === 'run'
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                  : 'bg-[#090B0E] border-slate-800 text-slate-300'
              }`}
            >
              Lari
            </button>
            <button
              type="button"
              onClick={() => {
                setType('badminton');
                setTitle('Sesi Badminton Malam');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                type === 'badminton'
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                  : 'bg-[#090B0E] border-slate-800 text-slate-300'
              }`}
            >
              Badminton
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Sesi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#090B0E] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                required
              />
            </div>

            {type === 'run' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jarak (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full bg-[#090B0E] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono tabular-nums text-white outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Durasi (menit)
              </label>
              <input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="w-full bg-[#090B0E] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono tabular-nums text-white outline-none"
                required
              />
            </div>

            {type === 'run' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pace Rata-rata (MM:SS)
                </label>
                <input
                  type="text"
                  value={avgPaceInput}
                  onChange={(e) => setAvgPaceInput(e.target.value)}
                  className="w-full bg-[#090B0E] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono tabular-nums text-white outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rata-rata HR (bpm)
              </label>
              <input
                type="number"
                value={avgHr}
                onChange={(e) => setAvgHr(e.target.value)}
                className="w-full bg-[#090B0E] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono tabular-nums text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                RPE / Skala Berat (1–10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className="w-full bg-[#090B0E] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono tabular-nums text-white outline-none"
                required
              />
            </div>

            {type === 'run' && shoes.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sepatu
                </label>
                <select
                  value={shoeId}
                  onChange={(e) => setShoeId(e.target.value)}
                  className="w-full bg-[#090B0E] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                >
                  {shoes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.brandModel}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer"
            >
              Simpan & Evaluasi
            </button>
          </div>
        </form>
      )}

      {/* Top Evaluation & Volume Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#12161D] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span>Evaluator Otomatis</span>
          </div>
          {latestRun ? (
            <>
              <h2 className="text-lg font-bold text-white mb-1">
                {latestRun.title}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {latestRun.evaluation ||
                  evaluateActivity(profile, {
                    type: latestRun.type,
                    durationMin: latestRun.durationMin,
                    distanceKm: latestRun.distanceKm,
                    avgPaceSec: latestRun.avgPaceSec,
                    avgHr: latestRun.avgHr,
                    rpe: latestRun.rpe,
                  })}
              </p>
              <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Durasi</span>
                  <span className="font-mono tabular-nums text-white font-bold text-sm">
                    {latestRun.durationMin} mnt
                  </span>
                </div>
                {latestRun.type === 'run' && (
                  <>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Jarak</span>
                      <span className="font-mono tabular-nums text-white font-bold text-sm">
                        {latestRun.distanceKm.toFixed(2)} km
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Pace Rata-rata</span>
                      <span className="font-mono tabular-nums text-emerald-400 font-bold text-sm">
                        {formatPace(latestRun.avgPaceSec)} /km
                      </span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-slate-400 block mb-0.5">Detak Jantung</span>
                  <span className="font-mono tabular-nums text-white font-bold text-sm">
                    {latestRun.avgHr} bpm
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed">
              Belum ada sesi latihan tercatat. Selesaikan latihan pertama dengan Tas-Mode atau catat latihan manual untuk memicu Evaluator AI!
            </p>
          )}
        </div>

        <div className="lg:col-span-4 bg-[#12161D] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Total Akumulasi
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Total Jarak Lari</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-white">
                {totalRunKm.toFixed(1)} km
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Sesi Selesai</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-emerald-400">
                {totalSessions}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Activity Log */}
      <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Riwayat Aktivitas</h2>

          <div className="inline-flex items-center gap-1 p-1 bg-[#090B0E] border border-slate-800 rounded-xl self-start">
            {([
              { id: 'all', label: 'Semua' },
              { id: 'run', label: 'Lari' },
              { id: 'badminton', label: 'Badminton' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-400 mb-3">
              Belum ada catatan pada filter ini.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#090B0E] border border-slate-700 text-xs font-semibold text-white hover:border-slate-500 cursor-pointer"
            >
              Catat Latihan Pertama
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map((act) => (
              <div
                key={act.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs text-slate-400 mb-1">
                    <span>
                      {new Date(act.dateIso).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span className="mx-1.5 text-slate-600">·</span>
                    <span>{act.type === 'run' ? 'Lari' : 'Badminton'}</span>
                    {act.tasModeUsed && (
                      <>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span className="text-emerald-400 font-medium">
                          Tas-Mode
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {act.title}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {act.evaluation}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="font-mono tabular-nums text-xs text-right">
                    <div className="text-white font-bold">
                      {act.type === 'run'
                        ? `${act.distanceKm.toFixed(2)} km · ${formatPace(
                            act.avgPaceSec
                          )} /km`
                        : `${act.durationMin} menit`}
                    </div>
                    <div className="text-slate-400">
                      {act.avgHr} bpm · RPE {act.rpe}/10
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteActivity(act.id)}
                    aria-label={`Hapus ${act.title}`}
                    className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
