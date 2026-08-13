import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Clock,
  TrendingDown,
  TrendingUp,
  Coins,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/smartApi';

interface SmokeSettingsData {
  avg_per_day: number;
  daily_target: number;
  price_per_cigarette: number;
  quit_goal: string | null;
}

interface SmokeSummaryData {
  todaySmoked: number;
  yesterdaySmoked: number;
  todayResisted: number;
  totalResisted: number;
  lastSmokedTime: string | null;
  currentStreakMs: number;
  longestStreakMs: number;
  todaySmokingCost?: number;
  moneySaved: number;
  settings: SmokeSettingsData;
}

const SmokeTracker: React.FC = () => {
  const [summary, setSummary] = useState<SmokeSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Timer state (5 minutes = 300 seconds)
  const [timerSeconds, setTimerSeconds] = useState<number>(300);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Settings form state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [avgPerDay, setAvgPerDay] = useState<number>(10);
  const [dailyTarget, setDailyTarget] = useState<number>(5);
  const [pricePerCigarette, setPricePerCigarette] = useState<number>(20);
  const [quitGoal, setQuitGoal] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/smoke/summary');
      const data: SmokeSummaryData = response.data;
      setSummary(data);
      if (data.settings) {
        setAvgPerDay(data.settings.avg_per_day);
        setDailyTarget(data.settings.daily_target);
        setPricePerCigarette(
          data.settings.price_per_cigarette !== undefined && data.settings.price_per_cigarette > 0
            ? data.settings.price_per_cigarette
            : 20
        );
        setQuitGoal(data.settings.quit_goal || '');
      }
    } catch (error: any) {
      console.error('Error loading smoke summary:', error);
      toast.error('Failed to load smoke tracker data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Craving Timer countdown handler
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current as NodeJS.Timeout);
            setTimerActive(false);
            setTimerFinished(true);
            toast.success('🎉 You made it 5 minutes! Great job resisting!', { duration: 5000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerActive]);

  const handleStartTimer = () => {
    if (timerSeconds === 0) {
      setTimerSeconds(300);
    }
    setTimerFinished(false);
    setTimerActive(true);
  };

  const handlePauseTimer = () => {
    setTimerActive(false);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(300);
    setTimerFinished(false);
  };

  // Primary Actions
  const handleLogSmoked = async () => {
    try {
      setActionLoading(true);
      await api.post('/smoke/log', { event_type: 'smoked' });
      toast.success('🚬 Cigarette recorded. Keep going.', { icon: '🚬', duration: 4000 });
      await fetchSummary();
    } catch (error) {
      console.error('Error logging cigarette:', error);
      toast.error('Failed to record cigarette');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogResisted = async () => {
    try {
      setActionLoading(true);
      await api.post('/smoke/log', { event_type: 'resisted' });
      toast.success('🔥 You resisted! One craving defeated.', { icon: '🔥', duration: 4000 });
      await fetchSummary();
    } catch (error) {
      console.error('Error logging resisted craving:', error);
      toast.error('Failed to record resisted craving');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(pricePerCigarette) || pricePerCigarette < 0) {
      toast.error('Please enter a valid positive cigarette price (e.g. ₹20).');
      return;
    }
    try {
      setSavingSettings(true);
      await api.put('/smoke/settings', {
        avg_per_day: avgPerDay,
        daily_target: dailyTarget,
        price_per_cigarette: pricePerCigarette,
        quit_goal: quitGoal.trim() || null
      });
      toast.success('Settings updated successfully');
      setShowSettings(false);
      await fetchSummary();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetAll = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all your smoking records and settings? This will clear all logged cigarettes and cravings.'
    );
    if (!confirmed) return;

    try {
      setResetting(true);
      await api.delete('/smoke/reset');
      toast.success('All smoke tracker data has been reset');
      setShowSettings(false);
      await fetchSummary();
    } catch (error) {
      console.error('Error resetting smoke tracker data:', error);
      toast.error('Failed to reset tracker data');
    } finally {
      setResetting(false);
    }
  };

  // Format time helpers
  const formatTimeSinceLast = (lastTimeIso: string | null) => {
    if (!lastTimeIso) return 'No cigarettes recorded today';
    const lastDate = new Date(lastTimeIso);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    if (diffMs < 0) return 'Just now';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    const remMinutes = diffMinutes % 60;
    if (diffHours < 24) {
      return `${diffHours}h ${remMinutes}m ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;
    return `${diffDays}d ${remHours}h ago`;
  };

  const formatDurationMs = (ms: number) => {
    if (!ms || ms <= 0) return '0m';
    const totalMinutes = Math.floor(ms / (1000 * 60));
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours < 24) {
      return `${hours}h ${mins}m`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  };

  const formatTimerDigits = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !summary) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const todaySmoked = summary?.todaySmoked || 0;
  const yesterdaySmoked = summary?.yesterdaySmoked || 0;
  const target = summary?.settings?.daily_target || 5;
  const todayResisted = summary?.todayResisted || 0;
  const totalResisted = summary?.totalResisted || 0;
  const currentPrice = summary?.settings?.price_per_cigarette || 20;
  const todaySmokingCost = summary?.todaySmokingCost !== undefined ? summary.todaySmokingCost : todaySmoked * currentPrice;
  const moneySaved = summary?.moneySaved !== undefined ? summary.moneySaved : totalResisted * currentPrice;
  const diffYesterday = todaySmoked - yesterdaySmoked;

  // Calculate visual progress bar out of 10 segments or percentage
  const progressPercent = Math.min(100, Math.round((todaySmoked / Math.max(1, target)) * 100));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🚭</span> Smoke Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track cigarettes, conquer cravings, and take back control one step at a time.
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Settings className="w-4 h-4 text-gray-500" />
          <span>Settings</span>
          {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Smoke Settings Form */}
      {showSettings && (
        <div className="bg-white p-5 rounded-xl border border-primary-100 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            Smoke Settings
          </h3>
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Average per day
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={avgPerDay}
                onChange={(e) => setAvgPerDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Today's Target
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Cigarette Price (₹)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 text-sm font-bold">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="20"
                  value={pricePerCigarette}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPricePerCigarette(isNaN(val) ? 0 : val);
                  }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-semibold"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Default: ₹20 per cigarette</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Quit Goal (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Quit completely by end of month"
                value={quitGoal}
                onChange={(e) => setQuitGoal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={handleResetAll}
                disabled={resetting || savingSettings}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>{resetting ? 'Resetting...' : 'Reset All Data'}</span>
              </button>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings || resetting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Tracker Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today & Last Cigarette & Smoking Cost */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today</div>
              <div className="text-4xl font-extrabold text-gray-900 mt-1 flex items-baseline gap-2">
                <span>{todaySmoked}</span>
                <span className="text-base font-normal text-gray-500">cigarettes</span>
              </div>
              {/* Today's smoking cost badge */}
              <div className="mt-2 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                <span>💰 Today's smoking cost:</span>
                <span className="font-extrabold text-rose-800 text-base">₹{todaySmokingCost.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last cigarette</div>
              <div className="text-lg font-semibold text-gray-800 mt-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span>{formatTimeSinceLast(summary?.lastSmokedTime || null)}</span>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-700">Today's goal</span>
                <span className="text-gray-900 font-bold">{target} cigarettes</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden border border-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    todaySmoked > target
                      ? 'bg-rose-500'
                      : todaySmoked === target
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (todaySmoked / Math.max(1, target)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{todaySmoked} of {target} target</span>
                <span>{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Yesterday Comparison & Resisted Count */}
          <div className="space-y-4 md:border-l md:border-gray-100 md:pl-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Yesterday</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {yesterdaySmoked} cigarettes
              </div>

              {/* Comparison indicator */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold">
                {diffYesterday < 0 ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-md flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    ↓ {Math.abs(diffYesterday)} fewer than yesterday
                  </span>
                ) : diffYesterday > 0 ? (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-md flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    ↑ {diffYesterday} more than yesterday
                  </span>
                ) : (
                  <span className="bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1 rounded-md">
                    Same as yesterday
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <span>🔥</span> Cravings resisted today
              </div>
              <div className="text-3xl font-extrabold text-amber-600 mt-1 flex items-center gap-2">
                <span>{todayResisted}</span>
                <span className="text-xs font-medium text-gray-500">({totalResisted} total overall)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleLogSmoked}
            disabled={actionLoading}
            className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-3 border border-slate-700 disabled:opacity-50"
          >
            <span className="text-2xl">🚬</span>
            <span>I Smoked</span>
          </button>

          <button
            onClick={handleLogResisted}
            disabled={actionLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-3 border border-emerald-600 disabled:opacity-50"
          >
            <span className="text-2xl">🔥</span>
            <span>I Resisted</span>
          </button>
        </div>
      </div>

      {/* Craving Timer Component */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h2 className="text-lg font-bold text-white">Craving?</h2>
          </div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            5-Min Timer
          </span>
        </div>

        <p className="text-slate-300 text-sm">
          Try waiting 5 minutes. Delaying a craving for just 5 minutes often weakens the impulse completely!
        </p>

        {/* Countdown display */}
        <div className="flex flex-col items-center justify-center py-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-5xl font-mono font-extrabold text-amber-400 tracking-wider">
            {formatTimerDigits(timerSeconds)}
          </div>

          {timerFinished && (
            <div className="mt-3 text-emerald-400 font-bold text-center flex items-center gap-2 animate-bounce">
              <Sparkles className="w-5 h-5" />
              <span>🎉 You made it 5 minutes!</span>
            </div>
          )}

          {/* Timer controls */}
          <div className="flex items-center gap-3 mt-5">
            {!timerActive ? (
              <button
                onClick={handleStartTimer}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow transition-colors flex items-center gap-2 text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{timerSeconds < 300 && timerSeconds > 0 ? 'RESUME' : 'START'}</span>
              </button>
            ) : (
              <button
                onClick={handlePauseTimer}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg shadow transition-colors flex items-center gap-2 text-sm"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </button>
            )}

            <button
              onClick={handleResetTimer}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg border border-slate-700 transition-colors text-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Immediate actions while timer is running or complete */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleLogSmoked}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>🚬 I Smoked</span>
          </button>
          <button
            onClick={handleLogResisted}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm shadow transition-colors flex items-center justify-center gap-2"
          >
            <span>🔥 I Resisted</span>
          </button>
        </div>
      </div>

      {/* Progress & Motivational Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Smoke-Free Duration */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary-600" />
            Current Smoke-Free
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatDurationMs(summary?.currentStreakMs || 0)}
          </div>
          <p className="text-xs text-gray-500">Since last cigarette</p>
        </div>

        {/* Best Smoke-Free Streak */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            Best Streak
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatDurationMs(summary?.longestStreakMs || 0)}
          </div>
          <p className="text-xs text-gray-500">Longest smoke-free period</p>
        </div>

        {/* Cravings Resisted */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            Resisted Cravings
          </div>
          <div className="text-xl font-bold text-amber-600">
            {totalResisted}
          </div>
          <p className="text-xs text-gray-500">Total cravings defeated</p>
        </div>

        {/* Money Saved */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-600" />
            Money Saved
          </div>
          <div className="text-xl font-bold text-emerald-600">
            ₹{moneySaved.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500">From cravings resisted</p>
        </div>
      </div>
    </div>
  );
};

export default SmokeTracker;
