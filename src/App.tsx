import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Compass,
  Play,
  User,
} from 'lucide-react';
import { DashboardActivities } from './components/DashboardActivities';
import { DashboardPlan } from './components/DashboardPlan';
import { DashboardToday } from './components/DashboardToday';
import { DashboardYou } from './components/DashboardYou';
import { OnboardingWizard } from './components/OnboardingWizard';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { TasModeWorkoutModal } from './components/TasModeWorkoutModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import {
  ActivityLog,
  ActivitySplit,
  PlannedSession,
  ShoeItem,
  UserProfile,
} from './types/training';
import {
  calculateFatigueStatus,
  evaluateActivity,
  generateTrainingBlock,
  parsePaceToSec,
} from './utils/trainingEngine';

type AppScreen = 'welcome' | 'onboarding' | 'dashboard';
type DashboardTab = 'today' | 'plan' | 'activities' | 'you';

const STORAGE_KEYS = {
  profile: 'stride_os_profile_v1',
  activities: 'stride_os_activities_v1',
  completed: 'stride_os_completed_v1',
  shoes: 'stride_os_shoes_v1',
};

const DEFAULT_SHOES: ShoeItem[] = [
  {
    id: 'shoe-default-1',
    brandModel: 'Asics Novablast',
    currentKm: 210,
    maxKm: 600,
    isPrimary: true,
    addedAt: new Date().toISOString(),
  },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    readStorage<UserProfile | null>(STORAGE_KEYS.profile, null)
  );
  const [activities, setActivities] = useState<ActivityLog[]>(() =>
    readStorage<ActivityLog[]>(STORAGE_KEYS.activities, [])
  );
  const [completedSessionIds, setCompletedSessionIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.completed, [])
  );
  const [shoes, setShoes] = useState<ShoeItem[]>(() =>
    readStorage<ShoeItem[]>(STORAGE_KEYS.shoes, DEFAULT_SHOES)
  );

  const [screen, setScreen] = useState<AppScreen>(() =>
    readStorage<UserProfile | null>(STORAGE_KEYS.profile, null)
      ? 'dashboard'
      : 'welcome'
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>('today');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [tasModeSession, setTasModeSession] = useState<PlannedSession | null>(
    null
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (profile) {
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
      } else {
        localStorage.removeItem(STORAGE_KEYS.profile);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities));
    } catch {
      // Ignore
    }
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.completed,
        JSON.stringify(completedSessionIds)
      );
    } catch {
      // Ignore
    }
  }, [completedSessionIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.shoes, JSON.stringify(shoes));
    } catch {
      // Ignore
    }
  }, [shoes]);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const trainingBlock = useMemo(() => {
    if (!profile) return null;
    return generateTrainingBlock(profile);
  }, [profile]);

  const currentWeek = useMemo(() => {
    if (!trainingBlock) return null;
    return (
      trainingBlock.weeks.find((w) => w.week === selectedWeekNum) ||
      trainingBlock.weeks[0]
    );
  }, [trainingBlock, selectedWeekNum]);

  const fatigueStatus = useMemo(() => {
    if (!profile) return null;
    return calculateFatigueStatus(profile, activities);
  }, [profile, activities]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handleLoadDemo = () => {
    const demoProfile: UserProfile = {
      name: 'Rehan',
      goal: '5K',
      level: 'Menengah',
      runFreq: 3,
      badmintonDays: ['Jumat'],
      dob: '1997-04-12',
      weight: 65,
      easyPaceSec: 330,
      restingHr: 56,
      createdAt: new Date().toISOString(),
    };
    const demoActivities: ActivityLog[] = [
      {
        id: 'demo-act-1',
        dateIso: new Date(Date.now() - 2 * 86400000).toISOString(),
        title: 'Easy Run (Zona 2)',
        type: 'run',
        durationMin: 26,
        distanceKm: 4.5,
        avgPaceSec: 336,
        avgHr: 142,
        rpe: 5,
        shoeId: 'shoe-default-1',
        tasModeUsed: true,
        evaluation: evaluateActivity(demoProfile, {
          type: 'run',
          durationMin: 26,
          distanceKm: 4.5,
          avgPaceSec: 336,
          avgHr: 142,
          rpe: 5,
        }),
      },
    ];
    setProfile(demoProfile);
    setActivities(demoActivities);
    setShoes(DEFAULT_SHOES);
    setCompletedSessionIds([]);
    setSelectedWeekNum(1);
    setActiveTab('today');
    setScreen('dashboard');
    showToast('Mode contoh dimuat. Program 5K Menengah + Badminton siap digunakan.');
  };

  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setSelectedWeekNum(1);
    setActiveTab('today');
    setScreen('dashboard');
    showToast(`Program ${newProfile.goal} ${newProfile.level} berhasil dibuat untuk ${newProfile.name}.`);
  };

  const handleFinishTasModeWorkout = (result: {
    session: PlannedSession;
    durationMin: number;
    distanceKm: number;
    avgPaceSec: number;
    avgHr: number;
    rpe: number;
    shoeId?: string;
    splits: ActivitySplit[];
  }) => {
    if (!profile) return;

    const targetPaceFirst = parsePaceToSec(
      result.session.targetPace.split('–')[0] || '5:30'
    );
    const evalText = evaluateActivity(profile, {
      type: 'run',
      durationMin: result.durationMin,
      distanceKm: result.distanceKm,
      avgPaceSec: result.avgPaceSec,
      avgHr: result.avgHr,
      rpe: result.rpe,
      targetPaceSec: targetPaceFirst,
    });

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      dateIso: new Date().toISOString(),
      sessionId: result.session.id,
      title: result.session.title,
      type: 'run',
      durationMin: result.durationMin,
      distanceKm: result.distanceKm,
      avgPaceSec: result.avgPaceSec,
      avgHr: result.avgHr,
      rpe: result.rpe,
      shoeId: result.shoeId,
      tasModeUsed: true,
      splits: result.splits,
      evaluation: evalText,
    };

    setActivities((prev) => [newLog, ...prev]);
    setCompletedSessionIds((prev) =>
      prev.includes(result.session.id) ? prev : [...prev, result.session.id]
    );

    if (result.shoeId) {
      setShoes((prev) =>
        prev.map((s) =>
          s.id === result.shoeId
            ? { ...s, currentKm: Number((s.currentKm + result.distanceKm).toFixed(1)) }
            : s
        )
      );
    }

    setTasModeSession(null);
    setActiveTab('activities');
    showToast('Sesi Tas-Mode tersimpan ke Rapor Evaluasi!');
  };

  const handleQuickLogBadminton = (session: PlannedSession) => {
    if (!profile) return;
    const avgHr = 156;
    const evalText = evaluateActivity(profile, {
      type: 'badminton',
      durationMin: session.durationMin,
      distanceKm: 0,
      avgPaceSec: 0,
      avgHr,
      rpe: 7,
    });

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      dateIso: new Date().toISOString(),
      sessionId: session.id,
      title: session.title,
      type: 'badminton',
      durationMin: session.durationMin,
      distanceKm: 0,
      avgPaceSec: 0,
      avgHr,
      rpe: 7,
      tasModeUsed: false,
      evaluation: evalText,
    };

    setActivities((prev) => [newLog, ...prev]);
    setCompletedSessionIds((prev) =>
      prev.includes(session.id) ? prev : [...prev, session.id]
    );
    showToast('Sesi Badminton dicatat & Fatigue Radar diperbarui.');
  };

  const handleToggleSessionComplete = (session: PlannedSession) => {
    const alreadyDone = completedSessionIds.includes(session.id);
    if (alreadyDone) {
      setCompletedSessionIds((prev) => prev.filter((id) => id !== session.id));
      return;
    }

    if (session.type === 'badminton') {
      handleQuickLogBadminton(session);
      return;
    }

    if (session.type === 'rest') {
      setCompletedSessionIds((prev) => [...prev, session.id]);
      showToast('Hari istirahat ditandai selesai.');
      return;
    }

    if (!profile) return;
    const paceSec = parsePaceToSec(session.targetPace.split('–')[0] || '5:30');
    const evalText = evaluateActivity(profile, {
      type: 'run',
      durationMin: session.durationMin,
      distanceKm: session.distanceKm,
      avgPaceSec: paceSec,
      avgHr: 148,
      rpe: 6,
    });

    const primaryShoe = shoes.find((s) => s.isPrimary) || shoes[0];
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      dateIso: new Date().toISOString(),
      sessionId: session.id,
      title: session.title,
      type: 'run',
      durationMin: session.durationMin,
      distanceKm: session.distanceKm,
      avgPaceSec: paceSec,
      avgHr: 148,
      rpe: 6,
      shoeId: primaryShoe?.id,
      tasModeUsed: false,
      evaluation: evalText,
    };

    setActivities((prev) => [log, ...prev]);
    setCompletedSessionIds((prev) => [...prev, session.id]);
    if (primaryShoe && session.distanceKm > 0) {
      setShoes((prev) =>
        prev.map((s) =>
          s.id === primaryShoe.id
            ? { ...s, currentKm: Number((s.currentKm + session.distanceKm).toFixed(1)) }
            : s
        )
      );
    }
    showToast(`${session.title} ditandai selesai!`);
  };

  const handleAddManualActivity = (
    input: Omit<ActivityLog, 'id' | 'dateIso' | 'evaluation'>
  ) => {
    if (!profile) return;
    const evaluation = evaluateActivity(profile, {
      type: input.type,
      durationMin: input.durationMin,
      distanceKm: input.distanceKm,
      avgPaceSec: input.avgPaceSec,
      avgHr: input.avgHr,
      rpe: input.rpe,
    });

    const newLog: ActivityLog = {
      ...input,
      id: `act-${Date.now()}`,
      dateIso: new Date().toISOString(),
      evaluation,
    };

    setActivities((prev) => [newLog, ...prev]);
    if (input.type === 'run' && input.shoeId && input.distanceKm > 0) {
      setShoes((prev) =>
        prev.map((s) =>
          s.id === input.shoeId
            ? { ...s, currentKm: Number((s.currentKm + input.distanceKm).toFixed(1)) }
            : s
        )
      );
    }
    showToast('Aktivitas manual berhasil disimpan & dievaluasi.');
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    showToast('Catatan aktivitas dihapus.');
  };

  const handleAddShoe = (brandModel: string, initialKm: number) => {
    const newShoe: ShoeItem = {
      id: `shoe-${Date.now()}`,
      brandModel,
      currentKm: initialKm,
      maxKm: 600,
      isPrimary: shoes.length === 0,
      addedAt: new Date().toISOString(),
    };
    setShoes((prev) => [...prev, newShoe]);
    showToast(`${brandModel} ditambahkan ke Shoe Vault.`);
  };

  const handleSetPrimaryShoe = (shoeId: string) => {
    setShoes((prev) =>
      prev.map((s) => ({ ...s, isPrimary: s.id === shoeId }))
    );
  };

  const handleResetAll = () => {
    localStorage.clear();
    setProfile(null);
    setActivities([]);
    setCompletedSessionIds([]);
    setShoes(DEFAULT_SHOES);
    setSelectedWeekNum(1);
    setScreen('welcome');
  };

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onStartSetup={() => setScreen('onboarding')}
        onLoadDemo={handleLoadDemo}
      />
    );
  }

  if (screen === 'onboarding' || !profile || !trainingBlock || !currentWeek || !fatigueStatus) {
    return (
      <OnboardingWizard
        initialProfile={profile}
        onCancel={() => setScreen(profile ? 'dashboard' : 'welcome')}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  const navItems: {
    id: DashboardTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'today', label: 'Today', icon: Compass },
    { id: 'plan', label: 'Plan', icon: CalendarDays },
    { id: 'activities', label: 'Activities', icon: BarChart3 },
    { id: 'you', label: 'You', icon: User },
  ];

  const firstRunnableToday =
    currentWeek.sessions.find(
      (s) => s.type !== 'rest' && s.type !== 'badminton'
    ) || currentWeek.sessions[0];

  return (
    <div className="min-h-screen bg-[#090B0E] text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar Rail */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-slate-800/90 bg-[#0C0F14] px-5 py-6 justify-between sticky top-0 h-screen">
        <div>
          <div className="px-2 mb-8">
            <span className="font-display text-2xl font-extrabold tracking-tight text-white">
              STRIDE <span className="text-emerald-400">OS</span>
            </span>
          </div>

          <nav className="space-y-1.5" aria-label="Navigasi Utama">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setTasModeSession(firstRunnableToday)}
            className="w-full min-h-[46px] px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Tas-Mode Cepat</span>
          </button>

          <PWAInstallButton showFallbackGuide />

          <div className="px-2 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="font-semibold text-slate-200 truncate">
              {profile.name}
            </div>
            <div className="truncate">
              {profile.goal} {profile.level} · {profile.runFreq}x/mgg
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Compact Sticky Top Bar (<=52px) */}
      <header className="lg:hidden sticky top-0 z-30 h-13 px-4 bg-[#090B0E]/90 backdrop-blur-md border-b border-slate-800/90 flex items-center justify-between gap-4">
        <span className="font-display text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0">
          STRIDE <span className="text-emerald-400">OS</span>
        </span>
        <button
          type="button"
          onClick={() => setTasModeSession(firstRunnableToday)}
          className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Tas-Mode</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-8 pb-24 lg:pb-12 max-w-6xl w-full mx-auto">
        {toastMsg && (
          <div
            role="status"
            className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs sm:text-sm text-emerald-200 flex items-center justify-between gap-3"
          >
            <span>{toastMsg}</span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer shrink-0"
            >
              Tutup
            </button>
          </div>
        )}

        {activeTab === 'today' && (
          <DashboardToday
            profile={profile}
            currentWeek={currentWeek}
            completedSessionIds={completedSessionIds}
            fatigue={fatigueStatus}
            recentActivity={activities[0]}
            onStartTasMode={(sess) => setTasModeSession(sess)}
            onLogBadmintonQuick={handleQuickLogBadminton}
            onGoToPlan={() => setActiveTab('plan')}
          />
        )}

        {activeTab === 'plan' && (
          <DashboardPlan
            profile={profile}
            block={trainingBlock}
            selectedWeekNum={selectedWeekNum}
            completedSessionIds={completedSessionIds}
            onSelectWeek={setSelectedWeekNum}
            onStartSession={(sess) => setTasModeSession(sess)}
            onToggleComplete={handleToggleSessionComplete}
          />
        )}

        {activeTab === 'activities' && (
          <DashboardActivities
            profile={profile}
            activities={activities}
            shoes={shoes}
            onAddManualActivity={handleAddManualActivity}
            onDeleteActivity={handleDeleteActivity}
          />
        )}

        {activeTab === 'you' && (
          <DashboardYou
            profile={profile}
            shoes={shoes}
            onAddShoe={handleAddShoe}
            onSetPrimaryShoe={handleSetPrimaryShoe}
            onEditSetup={() => setScreen('onboarding')}
            onResetAll={handleResetAll}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#090B0E]/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-4 items-center px-2"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tas-Mode Live Audio Coach Modal */}
      {tasModeSession && (
        <TasModeWorkoutModal
          session={tasModeSession}
          profile={profile}
          shoes={shoes}
          onClose={() => setTasModeSession(null)}
          onFinishWorkout={handleFinishTasModeWorkout}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
