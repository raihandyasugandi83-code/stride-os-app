import {
  ActivityLog,
  DayName,
  FatigueStatus,
  FitnessLevel,
  GoalDistance,
  HeartRateZone,
  PlannedSession,
  TrainingBlock,
  TrainingWeek,
  UserProfile,
  WorkoutSegment,
} from '../types/training';

export const ALL_DAYS: DayName[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

export function parsePaceToSec(paceStr: string): number {
  const parts = paceStr.trim().split(':');
  if (parts.length !== 2) return 330;
  const min = parseInt(parts[0], 10);
  const sec = parseInt(parts[1], 10);
  if (Number.isNaN(min) || Number.isNaN(sec)) return 330;
  return Math.max(180, Math.min(600, min * 60 + sec));
}

export function formatPace(secPerKm: number): string {
  const clamped = Math.max(150, Math.round(secPerKm));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 28;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(14, Math.min(80, age));
}

export function calculateMaxHr(dob: string): number {
  const age = calculateAge(dob);
  return Math.round(208 - 0.7 * age);
}

export function calculateHeartRateZones(
  dob: string,
  restingHr: number = 58
): HeartRateZone[] {
  const maxHr = calculateMaxHr(dob);
  const hrr = Math.max(60, maxHr - restingHr);

  const calc = (pctLow: number, pctHigh: number) => ({
    minBpm: Math.round(restingHr + hrr * pctLow),
    maxBpm: Math.round(restingHr + hrr * pctHigh),
  });

  return [
    {
      zone: 'Z1',
      name: 'Pemulihan Aktif',
      description: 'Jalan cepat atau joging sangat santai untuk aliran darah.',
      ...calc(0.5, 0.6),
      pctRange: '50–60% HRR',
    },
    {
      zone: 'Z2',
      name: 'Aerobik Dasar',
      description: 'Easy Run & Long Run. Masih nyaman berbicara kalimat penuh.',
      ...calc(0.6, 0.7),
      pctRange: '60–70% HRR',
    },
    {
      zone: 'Z3',
      name: 'Tempo Aerobik',
      description: 'Ritme stabil menantang untuk ketahanan kecepatan.',
      ...calc(0.7, 0.8),
      pctRange: '70–80% HRR',
    },
    {
      zone: 'Z4',
      name: 'Ambang Laktat',
      description: 'Threshold & Interval panjang. Nafas cepat namun terkontrol.',
      ...calc(0.8, 0.9),
      pctRange: '80–90% HRR',
    },
    {
      zone: 'Z5',
      name: 'VO2 Max',
      description: 'Interval pendek intensitas maksimal (400m repeats).',
      ...calc(0.9, 1.0),
      pctRange: '90–100% HRR',
    },
  ];
}

function getGoalWeeks(goal: GoalDistance): number {
  if (goal === '10K') return 10;
  if (goal === '21K') return 12;
  return 8;
}

function getLevelMultiplier(level: FitnessLevel): number {
  if (level === 'Pro') return 1.3;
  if (level === 'Menengah') return 1.12;
  return 1.0;
}

function buildIntervalSegments(
  reps: number,
  workSec: number,
  recSec: number,
  easyPaceSec: number
): WorkoutSegment[] {
  const easyStr = `${formatPace(easyPaceSec)} /km`;
  const intervalStr = `${formatPace(easyPaceSec - 48)} – ${formatPace(
    easyPaceSec - 35
  )} /km`;

  const segments: WorkoutSegment[] = [
    {
      id: 'warmup',
      label: 'Pemanasan Joging Santai',
      durationSec: 480,
      targetPace: easyStr,
      targetZone: 'Z2',
      kind: 'warmup',
    },
  ];

  for (let i = 1; i <= reps; i++) {
    segments.push({
      id: `work-${i}`,
      label: `Interval Cepat #${i} (${reps > 5 ? '400m' : '400m'})`,
      durationSec: workSec,
      targetPace: intervalStr,
      targetZone: 'Z5',
      kind: 'work',
    });
    if (i < reps) {
      segments.push({
        id: `rec-${i}`,
        label: `Pemulihan Jalan / Jog #${i}`,
        durationSec: recSec,
        targetPace: `${formatPace(easyPaceSec + 45)} /km`,
        targetZone: 'Z1',
        kind: 'recover',
      });
    }
  }

  segments.push({
    id: 'cooldown',
    label: 'Pendinginan & Jalan Santai',
    durationSec: 360,
    targetPace: `${formatPace(easyPaceSec + 30)} /km`,
    targetZone: 'Z1',
    kind: 'cooldown',
  });

  return segments;
}

function buildSteadySegments(
  kind: 'easy' | 'tempo' | 'long',
  totalMin: number,
  easyPaceSec: number
): WorkoutSegment[] {
  const totalSec = totalMin * 60;
  if (kind === 'tempo') {
    const tempoSec = Math.max(600, totalSec - 900);
    return [
      {
        id: 'warmup',
        label: 'Pemanasan Easy Pace',
        durationSec: 480,
        targetPace: `${formatPace(easyPaceSec)} /km`,
        targetZone: 'Z2',
        kind: 'warmup',
      },
      {
        id: 'tempo-main',
        label: 'Blok Tempo Stabil',
        durationSec: tempoSec,
        targetPace: `${formatPace(easyPaceSec - 28)} – ${formatPace(
          easyPaceSec - 18
        )} /km`,
        targetZone: 'Z3',
        kind: 'work',
      },
      {
        id: 'cooldown',
        label: 'Pendinginan Santai',
        durationSec: 420,
        targetPace: `${formatPace(easyPaceSec + 25)} /km`,
        targetZone: 'Z1',
        kind: 'cooldown',
      },
    ];
  }

  const pace =
    kind === 'long'
      ? `${formatPace(easyPaceSec + 5)} – ${formatPace(easyPaceSec + 20)} /km`
      : `${formatPace(easyPaceSec - 5)} – ${formatPace(easyPaceSec + 15)} /km`;

  return [
    {
      id: 'warmup',
      label: 'Awali Ritme Santai',
      durationSec: 300,
      targetPace: `${formatPace(easyPaceSec + 20)} /km`,
      targetZone: 'Z1',
      kind: 'warmup',
    },
    {
      id: 'main-steady',
      label: kind === 'long' ? 'Endurance Base Utama' : 'Lari Zona 2 Konsisten',
      durationSec: Math.max(600, totalSec - 480),
      targetPace: pace,
      targetZone: 'Z2',
      kind: 'work',
    },
    {
      id: 'cooldown',
      label: 'Pendinginan Jalan Cepat',
      durationSec: 180,
      targetPace: `${formatPace(easyPaceSec + 45)} /km`,
      targetZone: 'Z1',
      kind: 'cooldown',
    },
  ];
}

export function generateTrainingBlock(profile: UserProfile): TrainingBlock {
  const totalWeeks = getGoalWeeks(profile.goal);
  const mult = getLevelMultiplier(profile.level);
  const badmintonSet = new Set<DayName>(profile.badmintonDays);
  const easyPace = profile.easyPaceSec || 330;

  // Pick optimal non-badminton running days to minimize leg fatigue overlap
  const availableRunDays = ALL_DAYS.filter((d) => !badmintonSet.has(d));
  const fallbackPool = availableRunDays.length >= profile.runFreq
    ? availableRunDays
    : ALL_DAYS;

  // Score each non-badminton day: prefer days not immediately after a badminton night for hard sessions
  const dayScore = (day: DayName): number => {
    const idx = ALL_DAYS.indexOf(day);
    const prevDay = ALL_DAYS[(idx + 6) % 7];
    const nextDay = ALL_DAYS[(idx + 1) % 7];
    let score = 10;
    if (badmintonSet.has(day)) score -= 20;
    if (badmintonSet.has(prevDay)) score -= 4;
    if (badmintonSet.has(nextDay)) score -= 2;
    if (day === 'Minggu' || day === 'Sabtu') score += 3;
    return score;
  };

  // Pick evenly spaced days from fallbackPool
  const chosenRunDays: DayName[] = [];
  const step = Math.max(1, Math.floor(fallbackPool.length / profile.runFreq));
  for (let i = 0; i < fallbackPool.length && chosenRunDays.length < profile.runFreq; i += step) {
    chosenRunDays.push(fallbackPool[i]);
  }
  while (chosenRunDays.length < profile.runFreq) {
    const nextCandidate = fallbackPool.find((d) => !chosenRunDays.includes(d));
    if (!nextCandidate) break;
    chosenRunDays.push(nextCandidate);
  }

  // Sort chosen run days by weekly calendar order
  chosenRunDays.sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b));

  // Assign Long Run to highest-scoring day (preferring weekend), Quality (Interval/Tempo) to best mid-week slot
  const sortedByFreshness = [...chosenRunDays].sort((a, b) => dayScore(b) - dayScore(a));
  const longRunDay =
    sortedByFreshness.find((d) => d === 'Minggu' || d === 'Sabtu') ||
    sortedByFreshness[0];
  const qualityDay =
    sortedByFreshness.find((d) => d !== longRunDay) || chosenRunDays[0];
  const tempoDay =
    profile.runFreq >= 4
      ? sortedByFreshness.find((d) => d !== longRunDay && d !== qualityDay)
      : undefined;

  const weeks: TrainingWeek[] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const progressRatio = w / totalWeeks;
    let phase = 'Fase Dasar';
    if (w > totalWeeks - 2) phase = 'Fase Taper';
    else if (progressRatio > 0.65) phase = 'Fase Puncak';
    else if (progressRatio > 0.35) phase = 'Fase Bangun';

    const volumeScale =
      phase === 'Fase Taper'
        ? 0.72
        : 1 + ((w - 1) / Math.max(1, totalWeeks - 2)) * 0.35;

    const baseDistFactor =
      profile.goal === '21K' ? 1.55 : profile.goal === '10K' ? 1.25 : 1.0;

    const sessions: PlannedSession[] = ALL_DAYS.map((day, idx) => {
      const isBadminton = badmintonSet.has(day);
      const isRun = chosenRunDays.includes(day);

      if (isBadminton && !isRun) {
        return {
          id: `w${w}-d${idx}`,
          week: w,
          day,
          dayIndex: idx,
          title: 'Sesi Badminton (Hybrid)',
          type: 'badminton',
          durationMin: 90,
          distanceKm: 0,
          targetPace: 'Agilitas & Footwork',
          targetZone: 'Z3–Z4',
          description:
            'Beban kejut sendi & eksplosif court. Jaga hidrasi dan lakukan peregangan betis setelah main.',
        };
      }

      if (isRun) {
        if (day === longRunDay) {
          const dist = Number(
            (5.5 * baseDistFactor * mult * volumeScale).toFixed(1)
          );
          const dur = Math.round((dist * (easyPace + 12)) / 60);
          return {
            id: `w${w}-d${idx}`,
            week: w,
            day,
            dayIndex: idx,
            title:
              phase === 'Fase Taper'
                ? 'Long Run Ringan (Taper)'
                : `Long Run ${dist} km (Endurance Base)`,
            type: 'long',
            durationMin: dur,
            distanceKm: dist,
            targetPace: `${formatPace(easyPace + 5)} – ${formatPace(
              easyPace + 20
            )} /km`,
            targetZone: 'Z2',
            description:
              'Bangun kapasitas kapiler otot dan efisiensi pembakaran lemak tanpa memicu stres sendi berlebih.',
            segments: buildSteadySegments('long', dur, easyPace),
            conflictNote: isBadminton
              ? 'Jadwal padat dengan badminton; turunkan durasi 15% jika kaki terasa berat.'
              : undefined,
          };
        }

        if (day === qualityDay) {
          const reps = Math.min(
            8,
            Math.max(4, 4 + Math.floor(w / 2) + (profile.level === 'Pro' ? 2 : 0))
          );
          const isTempoWeek = w % 2 === 0 && phase !== 'Fase Dasar';
          if (isTempoWeek) {
            const dist = Number((4.8 * baseDistFactor * mult).toFixed(1));
            const dur = Math.round((dist * (easyPace - 15)) / 60) + 6;
            return {
              id: `w${w}-d${idx}`,
              week: w,
              day,
              dayIndex: idx,
              title: `Tempo Run (${dist} km)`,
              type: 'tempo',
              durationMin: dur,
              distanceKm: dist,
              targetPace: `${formatPace(easyPace - 28)} – ${formatPace(
                easyPace - 18
              )} /km`,
              targetZone: 'Z3–Z4',
              description:
                'Lari ritme stabil di batas nyaman-keras untuk menaikkan ambang laktat.',
              segments: buildSteadySegments('tempo', dur, easyPace),
            };
          }

          const workSec = Math.round(((easyPace - 42) * 0.4));
          const dist = Number((2.4 + reps * 0.4 + 1.0).toFixed(1));
          const dur = Math.round((14 + (reps * (workSec + 90)) / 60));
          return {
            id: `w${w}-d${idx}`,
            week: w,
            day,
            dayIndex: idx,
            title: `Interval ${reps}x400m`,
            type: 'interval',
            durationMin: dur,
            distanceKm: dist,
            targetPace: `${formatPace(easyPace - 48)} – ${formatPace(
              easyPace - 35
            )} /km`,
            targetZone: 'Z4–Z5',
            description: `${reps} repetisi 400m cepat dengan jeda joging 90 detik antar repetisi.`,
            segments: buildIntervalSegments(reps, workSec, 90, easyPace),
          };
        }

        if (tempoDay && day === tempoDay) {
          const dist = Number((4.5 * baseDistFactor * mult).toFixed(1));
          const dur = Math.round((dist * (easyPace - 15)) / 60) + 5;
          return {
            id: `w${w}-d${idx}`,
            week: w,
            day,
            dayIndex: idx,
            title: 'Progression / Tempo Ringan',
            type: 'tempo',
            durationMin: dur,
            distanceKm: dist,
            targetPace: `${formatPace(easyPace - 22)} /km`,
            targetZone: 'Z3',
            description:
              'Mulai santai, lalu percepat bertahap 10 detik/km di setengah akhir sesi.',
            segments: buildSteadySegments('tempo', dur, easyPace),
          };
        }

        const dist = Number((3.8 * baseDistFactor * mult * volumeScale).toFixed(1));
        const dur = Math.round((dist * easyPace) / 60);
        return {
          id: `w${w}-d${idx}`,
          week: w,
          day,
          dayIndex: idx,
          title: 'Easy Run (Zona 2)',
          type: 'easy',
          durationMin: dur,
          distanceKm: dist,
          targetPace: `${formatPace(easyPace - 5)} – ${formatPace(
            easyPace + 15
          )} /km`,
          targetZone: 'Z2',
          description:
            'Lari aerobik santai untuk mempertebal fondasi kebugaran tanpa membebani pemulihan.',
          segments: buildSteadySegments('easy', dur, easyPace),
        };
      }

      return {
        id: `w${w}-d${idx}`,
        week: w,
        day,
        dayIndex: idx,
        title: 'Rest & Mobilitas Sendi',
        type: 'rest',
        durationMin: 15,
        distanceKm: 0,
        targetPace: 'Pemulihan Total',
        targetZone: 'Z1',
        description:
          'Fokus tidur berkualitas, foam rolling betis/quads, dan mobilitas pergelangan kaki.',
      };
    });

    const totalRunKm = Number(
      sessions.reduce((acc, s) => acc + s.distanceKm, 0).toFixed(1)
    );
    const totalBadmintonMin = sessions
      .filter((s) => s.type === 'badminton')
      .reduce((acc, s) => acc + s.durationMin, 0);

    weeks.push({
      week: w,
      phase,
      totalRunKm,
      totalBadmintonMin,
      sessions,
    });
  }

  const coachInsight =
    profile.badmintonDays.length > 0
      ? `Jadwal badminton lu di hari ${profile.badmintonDays.join(
          ', '
        )} sudah dipisahkan otomatis dari sesi ${qualityDay} (kualitas) dan ${longRunDay} (Long Run) agar tendon Achilles & lutut tetap pulih optimal.`
      : `Fokus 100% progresi lari ${profile.runFreq}x seminggu (${qualityDay} kualitas & ${longRunDay} Long Run) dengan jarak pemulihan ideal antar sesi.`;

  return {
    totalWeeks,
    coachInsight,
    weeks,
  };
}

export function calculateFatigueStatus(
  profile: UserProfile,
  activities: ActivityLog[]
): FatigueStatus {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent = activities.filter(
    (a) => new Date(a.dateIso).getTime() >= sevenDaysAgo
  );

  // If user has no logged activities yet, estimate baseline readiness with scheduled badminton load
  const loggedLoad = recent.reduce((acc, act) => {
    const rpeFactor = act.rpe ? act.rpe / 5 : act.type === 'badminton' ? 1.3 : 1.1;
    return acc + act.durationMin * rpeFactor;
  }, 0);

  const baselineWeeklyBadmintonLoad = profile.badmintonDays.length * 90 * 1.15;
  const effectiveLoad = Math.round(
    recent.length > 0 ? loggedLoad : baselineWeeklyBadmintonLoad * 0.65
  );

  const targetLoadCap =
    profile.level === 'Pro' ? 540 : profile.level === 'Menengah' ? 420 : 320;
  const ratio = effectiveLoad / targetLoadCap;

  if (ratio >= 1.1) {
    return {
      status: 'Risiko Tinggi',
      title: 'Beban Gabungan Tinggi',
      readinessPct: Math.max(48, Math.round(100 - ratio * 40)),
      weeklyLoadScore: effectiveLoad,
      targetLoadCap,
      advice:
        'Akumulasi lari dan badminton 7 hari terakhir melampaui ambang aman. Pertimbangkan mengganti sesi keras berikutnya dengan Easy Run Z2 atau istirahat.',
    };
  }

  if (ratio >= 0.82) {
    return {
      status: 'Waspada',
      title: 'Beban Moderat – Pantau Kaki',
      readinessPct: Math.round(100 - ratio * 25),
      weeklyLoadScore: effectiveLoad,
      targetLoadCap,
      advice:
        'Volume latihan cukup padat. Pastikan pemanasan 8 menit sebelum interval dan jaga hidrasi setelah main badminton.',
    };
  }

  return {
    status: 'Aman',
    title: 'Status Aman · Recovery Optimal',
    readinessPct: Math.min(97, Math.max(78, Math.round(96 - ratio * 15))),
    weeklyLoadScore: effectiveLoad,
    targetLoadCap,
    advice:
      'Akumulasi beban lari dan badminton minggu ini masih dalam batas aman untuk mengejar target pace.',
  };
}

export function evaluateActivity(
  profile: UserProfile,
  sessionInput: {
    type: 'run' | 'badminton';
    durationMin: number;
    distanceKm: number;
    avgPaceSec: number;
    avgHr: number;
    rpe: number;
    targetPaceSec?: number;
  }
): string {
  const zones = calculateHeartRateZones(profile.dob, profile.restingHr);
  const matchedZone =
    zones.find(
      (z) => sessionInput.avgHr >= z.minBpm && sessionInput.avgHr <= z.maxBpm
    ) || (sessionInput.avgHr > zones[4].maxBpm ? zones[4] : zones[0]);

  if (sessionInput.type === 'badminton') {
    if (sessionInput.rpe >= 8) {
      return `Intensitas court tinggi (${sessionInput.durationMin} menit, rata-rata ${sessionInput.avgHr} bpm di ${matchedZone.zone}). Pastikan jeda minimal 24 jam sebelum sesi Interval berikutnya.`;
    }
    return `Sesi badminton ${sessionInput.durationMin} menit tercatat stabil di ${matchedZone.zone} (${matchedZone.name}). Kesiapan kaki aman untuk agenda lari terjadwal.`;
  }

  const easyRef = sessionInput.targetPaceSec || profile.easyPaceSec;
  const paceDiff = sessionInput.avgPaceSec - easyRef;
  const paceStr = formatPace(sessionInput.avgPaceSec);

  if (paceDiff <= -25) {
    return `Pace rata-rata ${paceStr} /km sangat cepat dengan detak jantung ${sessionInput.avgHr} bpm (${matchedZone.zone} · ${matchedZone.name}). Efektivitas anaerobik bagus, jaga pemulihan betis.`;
  }

  if (matchedZone.zone === 'Z2' || matchedZone.zone === 'Z1') {
    return `Pace ${paceStr} /km terkontrol rapi di ${matchedZone.zone} (${sessionInput.avgHr} bpm). Fondasi aerobik bertambah tanpa memicu kelelahan sistemik.`;
  }

  return `Sesi ${sessionInput.distanceKm.toFixed(
    2
  )} km selesai pada pace ${paceStr} /km (HR ${sessionInput.avgHr} bpm · ${
    matchedZone.zone
  }). Konsistensi terjaga dengan baik, ${profile.name}!`;
}

export function getTodayDayName(): DayName {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon
  const map: DayName[] = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];
  return map[jsDay];
}
