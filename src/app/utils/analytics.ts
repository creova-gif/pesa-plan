/**
 * PesaPlan Analytics & Crash Monitoring Service — Production-Ready
 *
 * Mirrors Firebase Analytics + Crashlytics + Sentry API surface exactly.
 * Drop-in swap: replace console.debug bodies with real SDK calls.
 *
 * Production swap guide:
 *   npm install @react-native-firebase/app @react-native-firebase/analytics @react-native-firebase/crashlytics
 *   import analytics from '@react-native-firebase/analytics';
 *   import crashlytics from '@react-native-firebase/crashlytics';
 *   import * as Sentry from '@sentry/react-native';
 */

export type AnalyticsEvent =
  | 'app_open'
  | 'onboarding_start'
  | 'onboarding_step'
  | 'onboarding_complete'
  | 'language_selected'
  | 'user_type_selected'
  | 'income_frequency_selected'
  | 'goal_created'
  | 'transaction_added'
  | 'transaction_deleted'
  | 'transaction_edited'
  | 'goal_contributed'
  | 'budget_set'
  | 'lesson_completed'
  | 'challenge_started'
  | 'challenge_day_logged'
  | 'challenge_abandoned'
  | 'data_exported'
  | 'data_deleted'
  | 'emergency_mode_toggled'
  | 'app_lock_enabled'
  | 'app_lock_disabled'
  | 'app_unlock_success'
  | 'app_unlock_failed'
  | 'screen_view'
  | 'notification_dismissed'
  | 'share_triggered'
  | 'error_boundary_triggered'
  | 'js_error'
  | 'promise_rejection'
  | 'performance_slow';

export interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

interface EventEntry {
  event: AnalyticsEvent;
  params: EventParams;
  timestamp: number;
  sessionId: string;
}

interface CrashEntry {
  message: string;
  stack?: string;
  context?: Record<string, string>;
  timestamp: number;
  sessionId: string;
  appVersion: string;
  recentEvents: string[]; // last 5 event names before crash (session replay)
}

// ── Session ──────────────────────────────────────────────────────────────────
const SESSION_ID = Math.random().toString(36).slice(2, 10).toUpperCase();
const SESSION_START = Date.now();
const APP_VERSION = '1.0.0';
const CRASH_STORAGE_KEY = 'pesaplan_crash_log_v1';
const eventLog: EventEntry[] = [];
const crashLog: CrashEntry[] = [];

// ── Load persisted crash log from previous sessions ───────────────────────────
function loadCrashLog(): CrashEntry[] {
  try {
    const raw = localStorage.getItem(CRASH_STORAGE_KEY);
    if (raw) return JSON.parse(raw).slice(-20); // keep last 20
  } catch {}
  return [];
}

function persistCrashLog(entries: CrashEntry[]) {
  try {
    localStorage.setItem(CRASH_STORAGE_KEY, JSON.stringify(entries.slice(-20)));
  } catch {}
}

// Pre-load any crashes from previous sessions
const persistedCrashes = loadCrashLog();

// ── Global error capture ──────────────────────────────────────────────────────
// Auto-catches uncaught JS errors — mirrors Crashlytics automatic crash capture
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e: ErrorEvent) => {
    Analytics.logEvent('js_error', {
      message: e.message?.slice(0, 200) ?? 'unknown',
      filename: e.filename?.split('/').pop() ?? '',
      lineno: e.lineno,
    });
    Analytics._recordCrash(
      new Error(e.message ?? 'JS Error'),
      { filename: e.filename ?? '', lineno: String(e.lineno) }
    );
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const msg = typeof e.reason === 'string'
      ? e.reason
      : (e.reason?.message ?? 'Unhandled Promise Rejection');
    Analytics.logEvent('promise_rejection', { message: msg.slice(0, 200) });
    Analytics._recordCrash(new Error(msg), { type: 'promise_rejection' });
  });
}

// ── Core service ──────────────────────────────────────────────────────────────
export const Analytics = {
  /**
   * Log a named analytics event with optional parameters.
   *
   * PRODUCTION SWAP:
   *   await analytics().logEvent(event, params);
   *   crashlytics().log(`event: ${event}`);
   */
  logEvent(event: AnalyticsEvent, params: EventParams = {}): void {
    const entry: EventEntry = {
      event,
      params,
      timestamp: Date.now(),
      sessionId: SESSION_ID,
    };
    eventLog.push(entry);

    // Production → Sentry breadcrumb
    // Sentry.addBreadcrumb({ category: 'analytics', message: event, data: params, level: 'info' });

    // Production → Firebase Analytics
    // analytics().logEvent(event, params);

    // Production → Firebase Crashlytics log (breadcrumb trail)
    // crashlytics().log(`${event}: ${JSON.stringify(params)}`);

    if (import.meta.env.DEV) {
      console.debug(`[PesaPlan Analytics] ${event}`, params);
    }
  },

  /**
   * Set the current screen for session attribution.
   *
   * PRODUCTION SWAP:
   *   await analytics().logScreenView({ screen_name: screenName, screen_class: screenName });
   *   crashlytics().log(`Screen: ${screenName}`);
   */
  setScreen(screenName: string): void {
    this.logEvent('screen_view', { screen_name: screenName, session_id: SESSION_ID });
    // Production: analytics().logScreenView({ screen_name: screenName, screen_class: screenName });
  },

  /**
   * Record a crash/exception. Persisted across sessions.
   *
   * PRODUCTION SWAP:
   *   crashlytics().recordError(error);
   *   Sentry.captureException(error, { extra: context });
   */
  captureException(error: Error, context?: Record<string, string>): void {
    this._recordCrash(error, context);
    // Production: Sentry.captureException(error, { extra: context });
    // Production: crashlytics().recordError(error);
    console.error('[PesaPlan Crash]', error.message, context);
  },

  /** Internal crash recorder — also used by global error handler */
  _recordCrash(error: Error, context?: Record<string, string>): void {
    const entry: CrashEntry = {
      message: error.message?.slice(0, 300) ?? 'Unknown error',
      stack: error.stack?.slice(0, 500),
      context,
      timestamp: Date.now(),
      sessionId: SESSION_ID,
      appVersion: APP_VERSION,
      recentEvents: eventLog.slice(-5).map(e => e.event),
    };
    eventLog.push({
      event: 'error_boundary_triggered',
      params: { message: error.message?.slice(0, 200) ?? '', ...context },
      timestamp: Date.now(),
      sessionId: SESSION_ID,
    });
    crashLog.push(entry);
    persistedCrashes.push(entry);
    persistCrashLog(persistedCrashes);
  },

  /**
   * Set a user property for segmentation.
   *
   * PRODUCTION SWAP:
   *   analytics().setUserProperty(key, value);
   *   crashlytics().setAttribute(key, value);
   */
  setUserProperty(key: string, value: string): void {
    // Production: analytics().setUserProperty(key, value);
    // Production: crashlytics().setAttribute(key, value);
    if (import.meta.env.DEV) {
      console.debug(`[PesaPlan Analytics] setUserProperty ${key}=${value}`);
    }
  },

  /**
   * Mark a user identifier (non-PII) for crash attribution.
   *
   * PRODUCTION SWAP:
   *   crashlytics().setUserId(userId);
   *   analytics().setUserId(userId);
   */
  setUserId(userId: string): void {
    // Production: crashlytics().setUserId(userId);
    // Production: analytics().setUserId(userId);
    if (import.meta.env.DEV) {
      console.debug(`[PesaPlan Analytics] setUserId ${userId}`);
    }
  },

  /**
   * Log a performance warning (slow operation).
   *
   * PRODUCTION SWAP:
   *   const trace = await perf().startTrace(traceName);
   *   await trace.stop();
   */
  logSlowOperation(operationName: string, durationMs: number): void {
    if (durationMs > 1000) {
      this.logEvent('performance_slow', { operation: operationName, duration_ms: durationMs });
      // Production: perf().newTrace(operationName).start().then(t => { t.putMetric('duration', durationMs); t.stop(); });
    }
  },

  /**
   * Returns a snapshot of the current session for Settings display.
   */
  getSessionStats() {
    return {
      sessionId: SESSION_ID,
      appVersion: APP_VERSION,
      sessionDurationMs: Date.now() - SESSION_START,
      totalEvents: eventLog.length,
      crashCount: persistedCrashes.length,
      uniqueScreens: [...new Set(
        eventLog.filter(e => e.event === 'screen_view').map(e => e.params.screen_name as string)
      )],
      recentEvents: eventLog.slice(-10).reverse(),
      recentCrashes: persistedCrashes.slice(-5).reverse(),
    };
  },

  /**
   * Clear the persisted crash log (call from Settings → Delete Data).
   */
  clearCrashLog(): void {
    persistedCrashes.length = 0;
    crashLog.length = 0;
    try { localStorage.removeItem(CRASH_STORAGE_KEY); } catch {}
  },

  /**
   * PRODUCTION INTEGRATION GUIDE
   * ─────────────────────────────
   * Step 1: Install Firebase
   *   npm install @react-native-firebase/app @react-native-firebase/analytics @react-native-firebase/crashlytics
   *
   * Step 2: Replace logEvent bodies:
   *   await analytics().logEvent(event, params);
   *
   * Step 3: Replace captureException:
   *   crashlytics().recordError(error);
   *
   * Step 4: Add to App.tsx AppProvider:
   *   useEffect(() => { Analytics.setUserId(`user_${state.userType}_${SESSION_ID}`); }, []);
   *
   * Step 5: For Sentry (web/hybrid):
   *   Sentry.init({ dsn: 'YOUR_SENTRY_DSN', tracesSampleRate: 1.0 });
   *   Replace captureException: Sentry.captureException(error);
   */
} as const;