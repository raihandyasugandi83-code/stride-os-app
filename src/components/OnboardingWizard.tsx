import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  DayName,
  FitnessLevel,
  GoalDistance,
  UserProfile,
} from '../types/training';
import {
  ALL_DAYS,
  calculateHeartRateZones,
  calculateMaxHr,
  formatPace,
  parsePaceToSec,
} from '../utils/trainingEngine';

interface OnboardingWizardProps {
  initialProfile?: UserProfile | null;
  onCancel: () => void;
  onComplete: (profile: UserProfile) => void;
}

const TOTAL_STEPS = 6;

const GOAL_OPTIONS: {
  value: GoalDistance;
  title: string;
  desc: string;
}[] = [
  {
    value: '5K',
    title: 'Program 5K (8 Minggu)',
    desc: 'Bangun kecepatan & ketahanan dasar. Sempurna untuk awalan.',
  },
  {
    value: '10K',
    title: 'Progresi 10K (10 Minggu)',
    desc: 'Dorong batas daya tahan aerobik jarak menengah.',
  },
  {
    value: '21K',
    title: 'Half Marathon (12 Minggu)',
    desc: 'Uji ketahanan level lanjut hingga 21.1 km.',
  },
];

const LEVEL_OPTIONS: {
  value: FitnessLevel;
  title: string;
  desc: string;
}[] = [
  {
    value: 'Pemula',
    title: 'Pemula (Beginner)',
    desc: 'Baru mulai rutin lari atau baru kembali dari masa istirahat.',
  },
  {
    value: 'Menengah',
    title: 'Menengah (Intermediate)',
    desc: 'Sudah aktif lari, ingin memecahkan rekor waktu terbaik (PB).',
  },
  {
    value: 'Pro',
    title: 'Lanjut (Advanced)',
    desc: 'Pelari berpengalaman dengan volume latihan tinggi.',
  },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialProfile,
  onCancel,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialProfile?.name || '');
  const [goal, setGoal] = useState<GoalDistance>(initialProfile?.goal || '5K');
  const [level, setLevel] = useState<FitnessLevel>(
    initialProfile?.level || 'Pemula'
  );
  const [runFreq, setRunFreq] = useState<2 | 3 | 4>(
    initialProfile?.runFreq || 3
  );
  const [badmintonDays, setBadmintonDays] = useState<DayName[]>(
    initialProfile?.badmintonDays || ['Jumat']
  );
  const [dob, setDob] = useState(initialProfile?.dob || '1996-05-15');
  const [weight, setWeight] = useState(
    initialProfile?.weight ? String(initialProfile.weight) : '65'
  );
  const [paceInput, setPaceInput] = useState(
    initialProfile?.easyPaceSec
      ? formatPace(initialProfile.easyPaceSec)
      : '5:30'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const previewZones = useMemo(() => calculateHeartRateZones(dob, 58), [dob]);
  const previewMaxHr = useMemo(() => calculateMaxHr(dob), [dob]);
  const parsedEasyPace = useMemo(() => parsePaceToSec(paceInput), [paceInput]);

  const toggleBadmintonDay = (day: DayName) => {
    setBadmintonDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      onCancel();
    }
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1 && name.trim().length > 25) {
      setErrorMsg('Nama panggilan maksimal 25 karakter.');
      return;
    }
    if (step === 6) {
      const wNum = Number(weight);
      if (Number.isNaN(wNum) || wNum < 35 || wNum > 180) {
        setErrorMsg('Masukkan berat badan yang valid antara 35 – 180 kg.');
        return;
      }
      if (!/^\d{1,2}:\d{2}$/.test(paceInput.trim())) {
        setErrorMsg('Gunakan format pace Menit:Detik, contoh 5:30.');
        return;
      }

      onComplete({
        name: name.trim() || 'Runner',
        goal,
        level,
        runFreq,
        badmintonDays,
        dob,
        weight: wNum,
        easyPaceSec: parsedEasyPace,
        restingHr: initialProfile?.restingHr || 58,
        createdAt: initialProfile?.createdAt || new Date().toISOString(),
      });
      return;
    }
    setStep((s) => s + 1);
  };

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-[#090B0E] text-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:px-8">
      <div className="w-full max-w-xl bg-[#12161D] border border-slate-800 rounded-2xl p-6 sm:p-8">
        {/* Top Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-[44px] px-2 -ml-2 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <span className="text-xs font-mono tabular-nums text-slate-400 whitespace-nowrap shrink-0">
            Langkah {step} / {TOTAL_STEPS}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-emerald-500 transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] flex flex-col justify-between">
          {step === 1 && (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Siapa nama panggilan lu?
              </h1>
              <p className="text-sm text-slate-400 mb-6">
                Biar AI Coach dan audio prompt bisa menyapa lu secara personal.
              </p>
              <label
                htmlFor="setup-name"
                className="block text-xs font-semibold text-slate-300 mb-2"
              >
                Nama Panggilan
              </label>
              <input
                id="setup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                placeholder="Contoh: Bray / Rehan"
                className="w-full bg-[#090B0E] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3.5 text-base text-white placeholder:text-slate-600 outline-none transition-colors"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Apa target utama lu?
              </h1>
              <p className="text-sm text-slate-400 mb-6">
                Pilih blok latihan awal. Lu bisa naik level kapan saja nanti.
              </p>
              <div className="space-y-3">
                {GOAL_OPTIONS.map((opt) => {
                  const selected = goal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGoal(opt.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                        selected
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-[#090B0E] border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-base mb-0.5">
                          {opt.title}
                        </div>
                        <div className="text-xs text-slate-400">{opt.desc}</div>
                      </div>
                      {selected && (
                        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Seberapa rutin lu lari?
              </h1>
              <p className="text-sm text-slate-400 mb-6">
                Kita sesuaikan intensitas dan jarak blok latihan dengan kondisi fisik lu.
              </p>
              <div className="space-y-3">
                {LEVEL_OPTIONS.map((opt) => {
                  const selected = level === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLevel(opt.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                        selected
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-[#090B0E] border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-base mb-0.5">
                          {opt.title}
                        </div>
                        <div className="text-xs text-slate-400">{opt.desc}</div>
                      </div>
                      {selected && (
                        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Jadwal Hybrid Lu
              </h1>
              <p className="text-sm text-slate-400 mb-6">
                Biar sistem memisahkan jadwal lari berat dari agenda badminton.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Target Lari Seminggu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: 2, label: '2x / Mgg', sub: 'Maintenance' },
                    { val: 3, label: '3x / Mgg', sub: 'Optimal' },
                    { val: 4, label: '4x / Mgg', sub: 'Agresif' },
                  ] as const).map((item) => {
                    const active = runFreq === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setRunFreq(item.val)}
                        className={`min-h-[56px] p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                          active
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-[#090B0E] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-sm font-bold whitespace-nowrap">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Hari Rutin Badminton (Pilih semua yang sesuai)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const active = badmintonDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleBadmintonDay(day)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                            : 'bg-[#090B0E] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Kapan tanggal lahir lu?
              </h1>
              <p className="text-sm text-slate-400 mb-6">
                Dibutuhkan untuk mengkalkulasi Zona Detak Jantung (HRR) secara akurat.
              </p>

              <label
                htmlFor="setup-dob"
                className="block text-xs font-semibold text-slate-300 mb-2"
              >
                Tanggal Lahir
              </label>
              <input
                id="setup-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#090B0E] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3.5 text-base font-mono tabular-nums text-white outline-none mb-5"
              />

              <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Estimasi Max Heart Rate</span>
                  <span className="font-mono tabular-nums text-white font-bold">
                    {previewMaxHr} bpm
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Target Zona 2 (Easy Run)</span>
                  <span className="font-mono tabular-nums text-emerald-400 font-bold">
                    {previewZones[1].minBpm}–{previewZones[1].maxBpm} bpm
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Detail Fisik Terakhir
              </h1>
              <p className="text-sm text-slate-400 mb-6">
                Menentukan takaran pace aman untuk melindungi sendi dan memicu progresi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label
                    htmlFor="setup-weight"
                    className="block text-xs font-semibold text-slate-300 mb-2"
                  >
                    Berat Badan (kg)
                  </label>
                  <input
                    id="setup-weight"
                    type="number"
                    min={35}
                    max={180}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-[#090B0E] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-base font-mono tabular-nums text-white outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="setup-pace"
                    className="block text-xs font-semibold text-slate-300 mb-2"
                  >
                    Pace Santai / Easy Run (Menit/Km)
                  </label>
                  <input
                    id="setup-pace"
                    type="text"
                    value={paceInput}
                    onChange={(e) => setPaceInput(e.target.value)}
                    placeholder="5:30"
                    className="w-full bg-[#090B0E] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-base font-mono tabular-nums text-white outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#090B0E] border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Kalkulasi Target Interval (Z5)</span>
                  <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                    {formatPace(parsedEasyPace - 48)} –{' '}
                    {formatPace(parsedEasyPace - 35)} /km
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Kalkulasi Target Tempo (Z3–Z4)</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {formatPace(parsedEasyPace - 28)} –{' '}
                    {formatPace(parsedEasyPace - 18)} /km
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            {errorMsg && (
              <p className="text-xs text-red-400 mb-3" role="alert">
                {errorMsg}
              </p>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>
                {step === TOTAL_STEPS ? 'Buat Program Gue' : 'Lanjut'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
