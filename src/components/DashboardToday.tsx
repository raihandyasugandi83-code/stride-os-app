import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CloudSun,
  Play,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  ActivityLog,
  FatigueStatus,
  PlannedSession,
  TrainingWeek,
  UserProfile,
} from '../types/training';
import { getTodayDayName } from '../utils/trainingEngine';

interface DashboardTodayProps {
  profile: UserProfile;
  currentWeek: TrainingWeek;
  completedSessionIds: string[];
  fatigue: FatigueStatus;
  recentActivity?: ActivityLog;
  onStartTasMode: (session: PlannedSession) => void;
  onLogBadmintonQuick: (session: PlannedSession) => void;
  onGoToPlan: () => void;
}

const WEATHER_PRESETS = [
  { label: 'Pagi Sejuk · 24°C', temp: '24°C', note: 'Udara ideal, target pace bisa dikejar normal.' },
  { label: 'Siang Terik · 32°C', temp: '32°C', note: 'Tambah 10–15 dtk/km dari target pace & bawa hidrasi.' },
  { label: 'Malam Lembap · 28°C', temp: '28°C', note: 'Fokus jaga Zona 2 HR agar tidak overheat.' },
];

export const DashboardToday: React.FC<DashboardTodayProps> = ({
  profile,
  currentWeek,
  completedSessionIds,
  fatigue,
  recentActivity,
  onStartTasMode,
  onLogBadmintonQuick,
  onGoToPlan,
}) => {
  const todayName = getTodayDayName();
  const defaultSession = useMemo(() => {
    return (
      currentWeek.sessions.find((s) => s.day === todayName) ||
      currentWeek.sessions.find((s) => s.type !== 'rest') ||
      currentWeek.sessions[0]
    );
  }, [currentWeek, todayName]);

  const [selectedSessionId, setSelectedSessionId] = useState(defaultSession.id);
  const [weatherIdx, setWeatherIdx] = useState(2);

  const activeSession =
    currentWeek.sessions.find((s) => s.id === selectedSessionId) ||
    defaultSession;

  const isCompleted = completedSessionIds.includes(activeSession.id);
  const weather = WEATHER_PRESETS[weatherIdx];

  const FatigueIcon =
    fatigue.status === 'Aman'
      ? ShieldCheck
      : fatigue.status === 'Waspada'
      ? AlertTriangle
      : ShieldAlert;

  const fatigueColorClass =
    fatigue.status === 'Aman'
      ? 'text-emerald-400'
      : fatigue.status === 'Waspada'
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Greeting & Weather Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Fokus Minggu {currentWeek.week} · {currentWeek.phase}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Halo, {profile.name}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setWeatherIdx((i) => (i + 1) % WEATHER_PRESETS.length)}
          className="min-h-[44px] self-start sm:self-auto px-4 py-2 rounded-xl bg-[#12161D] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Klik untuk ganti simulasi kondisi cuaca"
        >
          <CloudSun className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono tabular-nums">{weather.label}</span>
        </button>
      </div>

      {/* Horizontal 7-Day Rhythm Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {currentWeek.sessions.map((sess) => {
          const active = sess.id === activeSession.id;
          const done = completedSessionIds.includes(sess.id);
          const isToday = sess.day === todayName;
          return (
            <button
              key={sess.id}
              type="button"
              onClick={() => setSelectedSessionId(sess.id)}
              className={`min-h-[56px] min-w-[92px] px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer shrink-0 ${
                active
                  ? 'bg-emerald-500/15 border-emerald-500 text-white'
                  : 'bg-[#12161D] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold mb-0.5">
                <span className={active ? 'text-emerald-400' : ''}>
                  {sess.day.slice(0, 3)}
                  {isToday ? ' · Hari ini' : ''}
                </span>
                {done && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="text-xs font-semibold truncate max-w-[110px]">
                {sess.type === 'badminton'
                  ? 'Badminton'
                  : sess.type === 'rest'
                  ? 'Istirahat'
                  : sess.type === 'interval'
                  ? 'Interval'
                  : sess.type === 'tempo'
                  ? 'Tempo'
                  : sess.type === 'long'
                  ? 'Long Run'
                  : 'Easy Run'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Workout Focus Card (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-xs text-slate-400 font-medium">
                <span>Minggu {currentWeek.week}</span>
                <span className="mx-2 text-slate-600">·</span>
                <span>{activeSession.day}</span>
                <span className="mx-2 text-slate-600">·</span>
                <span className="font-mono tabular-nums">
                  {activeSession.durationMin} menit
                </span>
                {activeSession.distanceKm > 0 && (
                  <>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="font-mono tabular-nums">
                      {activeSession.distanceKm} km
                    </span>
                  </>
                )}
              </div>
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sesi Selesai</span>
                </span>
              )}
            </div>

            <h2 className="font-display text-3xl font-bold text-white tracking-tight mb-2">
              {activeSession.title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              {activeSession.description}
            </p>

            {/* Target Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-[#090B0E] border border-slate-800/90 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 mb-1">Target Pace</div>
                <div className="font-mono tabular-nums text-sm font-bold text-white">
                  {activeSession.targetPace}
                </div>
              </div>
              <div className="bg-[#090B0E] border border-slate-800/90 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 mb-1">Zona HR</div>
                <div className="font-mono tabular-nums text-sm font-bold text-emerald-400">
                  {activeSession.targetZone}
                </div>
              </div>
              <div className="bg-[#090B0E] border border-slate-800/90 rounded-xl p-3.5 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-slate-400 mb-1">Adaptasi Cuaca</div>
                <div className="text-xs font-medium text-slate-200 truncate">
                  {weather.temp} · {weather.note}
                </div>
              </div>
            </div>

            {/* Segment Preview if Running Session */}
            {activeSession.segments && activeSession.segments.length > 0 && (
              <div className="border-t border-slate-800 pt-4 mb-6">
                <div className="text-xs font-semibold text-slate-400 mb-3">
                  Struktur Segmen Tas-Mode ({activeSession.segments.length} blok)
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {activeSession.segments.slice(0, 5).map((seg, idx) => (
                    <div
                      key={seg.id}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono tabular-nums text-slate-500 w-5">
                          0{idx + 1}
                        </span>
                        <span className="text-slate-200 font-medium truncate">
                          {seg.label}
                        </span>
                      </div>
                      <div className="font-mono tabular-nums text-slate-400 whitespace-nowrap shrink-0 ml-3">
                        {Math.round(seg.durationSec / 60)} mnt · {seg.targetZone}
                      </div>
                    </div>
                  ))}
                  {activeSession.segments.length > 5 && (
                    <p className="text-xs text-slate-500 pt-1">
                      + {activeSession.segments.length - 5} segmen lanjutan dalam audio coach
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Primary Action */}
            {activeSession.type === 'badminton' ? (
              <button
                type="button"
                onClick={() => onLogBadmintonQuick(activeSession)}
                className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isCompleted
                    ? 'Catat Sesi Badminton Tambahan'
                    : 'Catat Selesai Sesi Badminton'}
                </span>
              </button>
            ) : activeSession.type === 'rest' ? (
              <button
                type="button"
                onClick={onGoToPlan}
                className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-[#090B0E] border border-slate-700 hover:border-slate-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Hari Istirahat — Lihat Jadwal Minggu Ini</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartTasMode(activeSession)}
                className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Mulai Tas-Mode Workout</span>
              </button>
            )}
          </div>

          {/* Latest Evaluation Snapshot */}
          <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Evaluasi Terakhir
              </h3>
              {recentActivity && (
                <span className="font-mono tabular-nums text-xs text-slate-400">
                  {new Date(recentActivity.dateIso).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              )}
            </div>
            {recentActivity ? (
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                  <span className="text-base font-bold text-white">
                    {recentActivity.title}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-emerald-400">
                    {recentActivity.type === 'run'
                      ? `${recentActivity.distanceKm.toFixed(2)} km · ${Math.floor(
                          recentActivity.avgPaceSec / 60
                        )}:${(recentActivity.avgPaceSec % 60)
                          .toString()
                          .padStart(2, '0')} /km · ${recentActivity.avgHr} bpm`
                      : `${recentActivity.durationMin} menit · ${recentActivity.avgHr} bpm`}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {recentActivity.evaluation}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed">
                Belum ada sesi tercatat minggu ini. Jalankan Tas-Mode Workout pertama untuk memicu rapor evaluasi pace & detak jantung otomatis.
              </p>
            )}
          </div>
        </div>

        {/* Secondary Radar Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Injury & Fatigue Radar
            </div>

            <div className="flex items-center gap-2.5 mb-3">
              <FatigueIcon className={`w-5 h-5 shrink-0 ${fatigueColorClass}`} />
              <span className={`text-sm font-bold ${fatigueColorClass}`}>
                {fatigue.title}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 mb-1">Kesiapan Kaki</div>
                <div className="font-mono tabular-nums text-2xl font-bold text-white">
                  {fatigue.readinessPct}%
                </div>
              </div>
              <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 mb-1">Beban 7 Hari</div>
                <div className="font-mono tabular-nums text-2xl font-bold text-white">
                  {fatigue.weeklyLoadScore}
                  <span className="text-xs text-slate-500 font-normal">
                    /{fatigue.targetLoadCap}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  fatigue.status === 'Aman'
                    ? 'bg-emerald-500'
                    : fatigue.status === 'Waspada'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (fatigue.weeklyLoadScore / fatigue.targetLoadCap) * 100
                    )
                  )}%`,
                }}
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {fatigue.advice}
            </p>
          </div>

          <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Ringkasan Blok Minggu {currentWeek.week}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Lari Mingguan</span>
                <span className="font-mono tabular-nums font-bold text-white">
                  {currentWeek.totalRunKm} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Agenda Badminton</span>
                <span className="font-mono tabular-nums font-bold text-white">
                  {currentWeek.totalBadmintonMin} menit
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frekuensi Lari</span>
                <span className="font-mono tabular-nums font-bold text-emerald-400">
                  {profile.runFreq}x / minggu
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
