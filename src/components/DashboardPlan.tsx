import React from 'react';
import { CheckCircle2, Play, Sparkles } from 'lucide-react';
import {
  PlannedSession,
  TrainingBlock,
  UserProfile,
} from '../types/training';

interface DashboardPlanProps {
  profile: UserProfile;
  block: TrainingBlock;
  selectedWeekNum: number;
  completedSessionIds: string[];
  onSelectWeek: (weekNum: number) => void;
  onStartSession: (session: PlannedSession) => void;
  onToggleComplete: (session: PlannedSession) => void;
}

export const DashboardPlan: React.FC<DashboardPlanProps> = ({
  profile,
  block,
  selectedWeekNum,
  completedSessionIds,
  onSelectWeek,
  onStartSession,
  onToggleComplete,
}) => {
  const activeWeek =
    block.weeks.find((w) => w.week === selectedWeekNum) || block.weeks[0];

  return (
    <div className="space-y-6">
      {/* Plan Summary Header */}
      <div className="bg-[#12161D] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Blok Latihan Saat Ini
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Program {profile.goal} {profile.level}
            </h1>
            <p className="text-sm font-semibold text-emerald-400 mt-1">
              Minggu {activeWeek.week} dari {block.totalWeeks} · {activeWeek.phase}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#090B0E] border border-slate-800 rounded-xl px-4 py-3 self-start sm:self-auto">
            <div className="text-center">
              <div className="font-mono tabular-nums text-xl font-bold text-white">
                {profile.runFreq}x
              </div>
              <div className="text-[11px] text-slate-400">Lari/Mgg</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <div className="font-mono tabular-nums text-xl font-bold text-emerald-400">
                {activeWeek.totalRunKm} km
              </div>
              <div className="text-[11px] text-slate-400">Volume M{activeWeek.week}</div>
            </div>
          </div>
        </div>

        {/* Coach Insight Banner */}
        <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            <span className="font-bold text-emerald-400">Coach Insight: </span>
            {block.coachInsight}
          </p>
        </div>

        {/* Interactive Week Navigator */}
        <div className="mt-5 pt-5 border-t border-slate-800">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {block.weeks.map((w) => {
              const active = w.week === activeWeek.week;
              return (
                <button
                  key={w.week}
                  type="button"
                  onClick={() => onSelectWeek(w.week)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                      : 'bg-[#090B0E] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  M{w.week}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7-Day Session Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeWeek.sessions.map((sess) => {
          const isCompleted = completedSessionIds.includes(sess.id);
          const isBadminton = sess.type === 'badminton';
          const isRest = sess.type === 'rest';
          const isKeyRun =
            sess.type === 'interval' ||
            sess.type === 'tempo' ||
            sess.type === 'long';

          return (
            <div
              key={sess.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                isCompleted
                  ? 'bg-emerald-500/8 border-emerald-500/35'
                  : isBadminton
                  ? 'bg-[#12161D] border-emerald-500/25'
                  : isKeyRun
                  ? 'bg-[#12161D] border-slate-700'
                  : 'bg-[#12161D]/70 border-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isBadminton || isCompleted
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {sess.day} · {sess.durationMin} menit
                    {sess.distanceKm > 0 ? ` · ${sess.distanceKm} km` : ''}
                  </span>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesai</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  {sess.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {sess.description}
                </p>

                <div className="text-xs font-mono tabular-nums text-slate-300">
                  <span>{sess.targetPace}</span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-emerald-400">{sess.targetZone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                {!isRest && !isBadminton && (
                  <button
                    type="button"
                    onClick={() => onStartSession(sess)}
                    className="min-h-[44px] flex-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Tas-Mode</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onToggleComplete(sess)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isRest || isBadminton ? 'flex-1' : ''
                  } ${
                    isCompleted
                      ? 'bg-[#090B0E] border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-[#090B0E] border-slate-800 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isCompleted ? 'Batalkan Selesai' : 'Tandai Selesai'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
