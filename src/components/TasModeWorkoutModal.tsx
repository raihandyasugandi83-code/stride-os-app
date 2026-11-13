import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Flag,
  Pause,
  Play,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  ActivitySplit,
  PlannedSession,
  ShoeItem,
  UserProfile,
} from '../types/training';
import { audioCoach } from '../utils/audioCoach';
import {
  calculateHeartRateZones,
  formatClock,
  formatPace,
  parsePaceToSec,
} from '../utils/trainingEngine';

interface TasModeWorkoutModalProps {
  session: PlannedSession;
  profile: UserProfile;
  shoes: ShoeItem[];
  onClose: () => void;
  onFinishWorkout: (result: {
    session: PlannedSession;
    durationMin: number;
    distanceKm: number;
    avgPaceSec: number;
    avgHr: number;
    rpe: number;
    shoeId?: string;
    splits: ActivitySplit[];
  }) => void;
}

type Phase = 'prep' | 'active' | 'summary';

export const TasModeWorkoutModal: React.FC<TasModeWorkoutModalProps> = ({
  session,
  profile,
  shoes,
  onClose,
  onFinishWorkout,
}) => {
  const segments = useMemo(() => {
    if (session.segments && session.segments.length > 0) {
      return session.segments;
    }
    return [
      {
        id: 'main',
        label: session.title,
        durationSec: Math.max(300, session.durationMin * 60),
        targetPace: session.targetPace,
        targetZone: 'Z2' as const,
        kind: 'work' as const,
      },
    ];
  }, [session]);

  const zones = useMemo(
    () => calculateHeartRateZones(profile.dob, profile.restingHr),
    [profile.dob, profile.restingHr]
  );

  const [phase, setPhase] = useState<Phase>('prep');
  const [prepCountdown, setPrepCountdown] = useState(10);
  const [muted, setMuted] = useState(false);

  // Active state
  const [segIndex, setSegIndex] = useState(0);
  const [segRemainingSec, setSegRemainingSec] = useState(segments[0].durationSec);
  const [totalElapsedSec, setTotalElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [splits, setSplits] = useState<ActivitySplit[]>([]);
  const [simulatedDistKm, setSimulatedDistKm] = useState(0);

  // Summary inputs
  const [rpe, setRpe] = useState(7);
  const [selectedShoeId, setSelectedShoeId] = useState(
    shoes.find((s) => s.isPrimary)?.id || shoes[0]?.id || ''
  );

  const lastCueRef = useRef<string>('');
  const currentSegment = segments[segIndex] || segments[0];

  const activePaceSec = useMemo(() => {
    if (currentSegment.kind === 'work' && session.type === 'interval') {
      return Math.max(195, profile.easyPaceSec - 42);
    }
    if (currentSegment.kind === 'work' && session.type === 'tempo') {
      return Math.max(210, profile.easyPaceSec - 24);
    }
    if (currentSegment.kind === 'recover' || currentSegment.kind === 'cooldown') {
      return profile.easyPaceSec + 35;
    }
    return profile.easyPaceSec;
  }, [currentSegment.kind, profile.easyPaceSec, session.type]);

  const currentHr = useMemo(() => {
    const zMap: Record<string, number> = {
      Z1: Math.round((zones[0].minBpm + zones[0].maxBpm) / 2),
      Z2: Math.round((zones[1].minBpm + zones[1].maxBpm) / 2),
      Z3: Math.round((zones[2].minBpm + zones[2].maxBpm) / 2),
      Z4: Math.round((zones[3].minBpm + zones[3].maxBpm) / 2),
      Z5: Math.round((zones[4].minBpm + zones[4].maxBpm) / 2),
    };
    const base = zMap[currentSegment.targetZone] || zones[1].minBpm;
    const jitter = ((totalElapsedSec % 5) - 2);
    return base + jitter;
  }, [currentSegment.targetZone, totalElapsedSec, zones]);

  useEffect(() => {
    audioCoach.muted = muted;
  }, [muted]);

  useEffect(() => {
    return () => {
      audioCoach.stopSpeech();
    };
  }, []);

  // Prep 10-second countdown with 5-second beeps ("TIT... TIT... TIT... GO!")
  useEffect(() => {
    if (phase !== 'prep') return;

    if (prepCountdown === 10 && lastCueRef.current !== 'prep-start') {
      lastCueRef.current = 'prep-start';
      audioCoach.speak(
        `Tas-Mode aktif. Masukkan HP ke tas atau armband. Hitung mundur mulai.`
      );
    }

    if (prepCountdown <= 5 && prepCountdown >= 1) {
      audioCoach.playCountdownTick();
    }

    if (prepCountdown <= 0) {
      audioCoach.playGoSignal();
      audioCoach.speak(`Mulai! ${segments[0].label}. Target pace ${segments[0].targetPace}`);
      setPhase('active');
      return;
    }

    const timer = setTimeout(() => {
      setPrepCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, prepCountdown, segments]);

  // Active workout timer
  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    const timer = setInterval(() => {
      setTotalElapsedSec((t) => t + 1);
      setSimulatedDistKm((d) => d + 1 / activePaceSec);

      setSegRemainingSec((rem) => {
        if (rem <= 6 && rem >= 2) {
          audioCoach.playCountdownTick();
        }
        if (rem <= 1) {
          if (segIndex + 1 < segments.length) {
            const nextIdx = segIndex + 1;
            const nextSeg = segments[nextIdx];
            setSegIndex(nextIdx);
            audioCoach.playSegmentTransition();
            audioCoach.speak(
              `Ganti segmen: ${nextSeg.label}. Target ${nextSeg.targetZone}.`
            );
            return nextSeg.durationSec;
          } else {
            audioCoach.playGoSignal();
            audioCoach.speak('Sesi latihan selesai. Kerja bagus!');
            setPhase('summary');
            return 0;
          }
        }
        return rem - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isPaused, segIndex, segments, activePaceSec]);

  const handleToggleMute = () => {
    setMuted((m) => !m);
  };

  const handleSkipPrep = () => {
    audioCoach.playGoSignal();
    audioCoach.speak(`Mulai! ${segments[0].label}`);
    setPhase('active');
  };

  const handleSkipSegment = () => {
    if (segIndex + 1 < segments.length) {
      const nextIdx = segIndex + 1;
      setSegIndex(nextIdx);
      setSegRemainingSec(segments[nextIdx].durationSec);
      audioCoach.playSegmentTransition();
    } else {
      setPhase('summary');
    }
  };

  const handleRecordSplit = () => {
    const lapNum = splits.length + 1;
    const dist = Math.max(0.4, Number((simulatedDistKm / Math.max(1, lapNum)).toFixed(2)));
    setSplits((prev) => [
      ...prev,
      {
        lap: lapNum,
        label: currentSegment.label,
        distanceKm: dist,
        durationSec: totalElapsedSec,
        paceSec: activePaceSec,
        avgHr: currentHr,
      },
    ]);
    audioCoach.playTone(1100, 110);
  };

  const handleCompleteAndSave = () => {
    const finalDist =
      simulatedDistKm >= 0.2
        ? Number(simulatedDistKm.toFixed(2))
        : session.distanceKm || 3.5;
    const finalDurMin = Math.max(
      1,
      totalElapsedSec >= 60 ? Math.round(totalElapsedSec / 60) : session.durationMin
    );
    const avgPace =
      simulatedDistKm >= 0.2 && totalElapsedSec > 30
        ? Math.round(totalElapsedSec / simulatedDistKm)
        : parsePaceToSec(session.targetPace.split('–')[0]);

    onFinishWorkout({
      session,
      durationMin: finalDurMin,
      distanceKm: finalDist,
      avgPaceSec: avgPace,
      avgHr: currentHr,
      rpe,
      shoeId: selectedShoeId || undefined,
      splits,
    });
  };

  const segProgressPct = Math.min(
    100,
    Math.round(
      ((currentSegment.durationSec - segRemainingSec) /
        Math.max(1, currentSegment.durationSec)) *
        100
    )
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tas-Mode Audio Coach"
    >
      <div className="w-full max-w-lg bg-[#12161D] border border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <p className="text-xs font-semibold text-emerald-400">
              Tas-Mode Audio Coach
            </p>
            <h2 className="font-display text-2xl font-bold text-white leading-tight">
              {session.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? 'Aktifkan suara' : 'Bisukan suara'}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-[#090B0E] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-5 h-5 text-amber-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                audioCoach.stopSpeech();
                onClose();
              }}
              aria-label="Tutup sesi"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-[#090B0E] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {phase === 'prep' && (
            <div className="text-center py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Jeda Persiapan Memasukkan HP ke Tas
              </p>
              <div className="font-mono tabular-nums text-7xl font-bold text-emerald-400 my-4">
                {prepCountdown}
              </div>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed mb-6">
                Hitung mundur 5 detik terakhir akan membunyikan nada{' '}
                <span className="font-mono text-emerald-400">
                  TIT... TIT... GO!
                </span>{' '}
                secara otomatis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => audioCoach.playCountdownTick()}
                  className="flex-1 min-h-[44px] px-4 py-3 rounded-xl bg-[#090B0E] border border-slate-700 text-slate-200 text-sm font-semibold hover:border-slate-500 cursor-pointer whitespace-nowrap"
                >
                  Uji Nada Audio
                </button>
                <button
                  type="button"
                  onClick={handleSkipPrep}
                  className="flex-1 min-h-[44px] px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold cursor-pointer whitespace-nowrap"
                >
                  Langsung Mulai
                </button>
              </div>
            </div>
          )}

          {phase === 'active' && (
            <>
              <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>
                    Segmen {segIndex + 1} dari {segments.length}
                  </span>
                  <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                    {currentSegment.targetZone} · {currentSegment.targetPace}
                  </span>
                </div>
                <div className="text-lg font-bold text-white mb-4">
                  {currentSegment.label}
                </div>

                <div className="font-mono tabular-nums text-6xl font-bold text-white tracking-tight mb-4">
                  {formatClock(segRemainingSec)}
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${segProgressPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400 mb-1">Total Waktu</div>
                  <div className="font-mono tabular-nums text-lg font-bold text-white">
                    {formatClock(totalElapsedSec)}
                  </div>
                </div>
                <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400 mb-1">Estimasi Jarak</div>
                  <div className="font-mono tabular-nums text-lg font-bold text-white">
                    {simulatedDistKm.toFixed(2)} km
                  </div>
                </div>
                <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400 mb-1">HR / Pace</div>
                  <div className="font-mono tabular-nums text-lg font-bold text-emerald-400">
                    {currentHr} bpm
                  </div>
                  <div className="font-mono tabular-nums text-[11px] text-slate-400">
                    {formatPace(activePaceSec)} /km
                  </div>
                </div>
              </div>

              {splits.length > 0 && (
                <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    Split Tercatat ({splits.length})
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto text-xs font-mono tabular-nums">
                    {splits.map((sp) => (
                      <div
                        key={sp.lap}
                        className="flex justify-between text-slate-300"
                      >
                        <span>
                          Lap {sp.lap} · {sp.label}
                        </span>
                        <span className="text-emerald-400">
                          {formatPace(sp.paceSec)} /km · {sp.avgHr} bpm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#090B0E] border border-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:border-slate-500 cursor-pointer whitespace-nowrap"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span>Lanjut</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Jeda</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRecordSplit}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#090B0E] border border-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:border-slate-500 cursor-pointer whitespace-nowrap"
                >
                  <Flag className="w-4 h-4 text-emerald-400" />
                  <span>Lap</span>
                </button>
                <button
                  type="button"
                  onClick={handleSkipSegment}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#090B0E] border border-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:border-slate-500 cursor-pointer whitespace-nowrap"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Lewati</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('summary')}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesai</span>
                </button>
              </div>
            </>
          )}

          {phase === 'summary' && (
            <div className="space-y-5">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-400 mb-1">
                  Sesi Siap Disimpan
                </p>
                <p className="text-sm text-slate-200">
                  Jarak tercatat{' '}
                  <span className="font-mono font-bold">
                    {(simulatedDistKm >= 0.2
                      ? simulatedDistKm
                      : session.distanceKm || 3.5
                    ).toFixed(2)}{' '}
                    km
                  </span>{' '}
                  dalam{' '}
                  <span className="font-mono font-bold">
                    {totalElapsedSec >= 60
                      ? `${Math.round(totalElapsedSec / 60)} menit`
                      : `${session.durationMin} menit (simulasi cepat)`}
                  </span>
                  .
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>Tingkat Usaha (RPE 1–10)</span>
                  <span className="font-mono text-emerald-400">{rpe} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {shoes.length > 0 && (
                <div>
                  <label
                    htmlFor="workout-shoe-select"
                    className="block text-xs font-semibold text-slate-300 mb-2"
                  >
                    Sepatu Lari yang Dipakai
                  </label>
                  <select
                    id="workout-shoe-select"
                    value={selectedShoeId}
                    onChange={(e) => setSelectedShoeId(e.target.value)}
                    className="w-full bg-[#090B0E] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  >
                    {shoes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.brandModel} ({s.currentKm.toFixed(0)}/{s.maxKm} km)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleCompleteAndSave}
                className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer whitespace-nowrap"
              >
                Simpan ke Rapor Evaluasi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
