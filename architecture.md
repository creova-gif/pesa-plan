# Maokoto (PesaPlan) — Application Architecture

## Table of Contents
1. [Overview](#1-overview)
2. [Repository Structure](#2-repository-structure)
3. [Web Application](#3-web-application)
   - 3.1 [Entry Point & Routing](#31-entry-point--routing)
   - 3.2 [Global State Management](#32-global-state-management)
   - 3.3 [Onboarding Flow](#33-onboarding-flow)
   - 3.4 [Dashboard](#34-dashboard)
   - 3.5 [AI Assistant](#35-ai-assistant)
   - 3.6 [Utilities](#36-utilities)
   - 3.7 [UI Primitives](#37-ui-primitives)
   - 3.8 [PWA & Service Worker](#38-pwa--service-worker)
4. [Mobile Application (Expo)](#4-mobile-application-expo)
   - 4.1 [Navigation](#41-navigation)
   - 4.2 [State Management](#42-state-management)
   - 4.3 [Tab Screens](#43-tab-screens)
5. [Data Layer](#5-data-layer)
   - 5.1 [Persistence Strategy](#51-persistence-strategy)
   - 5.2 [Cloud Sync](#52-cloud-sync)
   - 5.3 [Security](#53-security)
6. [Internationalisation](#6-internationalisation)
7. [Analytics & Crash Monitoring](#7-analytics--crash-monitoring)
8. [Key Data Flows](#8-key-data-flows)
9. [Dependency Map](#9-dependency-map)

---

## 1. Overview

Maokoto (formerly PesaPlan) is a bilingual personal finance application targeting the East African market. It ships as two separate runtime environments that share business logic and design language:

| Environment | Runtime | Persistence | Entry |
|---|---|---|---|
| **Web PWA** | React 18 + Vite 6 | `localStorage` | `src/main.tsx` |
| **Mobile** | Expo 52 + React Native | `AsyncStorage` | `app/_layout.tsx` |

The web app is the reference implementation and is feature-complete. The Expo app is a WebView shell (`mobile/`) that loads the deployed web URL, with a second native implementation under `app/` (Expo Router) used for native builds.

Languages: English, Kiswahili, French, Arabic, Portuguese.  
Regions: Tanzania, Kenya, Uganda, Rwanda, Ghana, Nigeria, and generic East Africa.

---

## 2. Repository Structure

```
/
├── src/                          # Web application source
│   ├── main.tsx                  # Web entry point
│   ├── i18n.ts                   # i18next initialisation
│   ├── app/
│   │   ├── App.tsx               # Root component, AppContext, AppProvider
│   │   ├── components/
│   │   │   ├── dashboard/        # All post-onboarding views
│   │   │   │   ├── Dashboard.tsx         # Tab shell & navigation
│   │   │   │   ├── AIAssistant.tsx       # Budget coach (Claude + rule engine)
│   │   │   │   ├── GoalsView.tsx         # Savings goals management
│   │   │   │   ├── HistoryView.tsx       # Transaction history & filtering
│   │   │   │   ├── InsightsView.tsx      # Spending analytics
│   │   │   │   ├── SettingsView.tsx      # App settings & PIN lock
│   │   │   │   ├── BudgetLimitsSheet.tsx # Category budget editor
│   │   │   │   ├── AddTransactionDialog.tsx
│   │   │   │   ├── EditTransactionDialog.tsx
│   │   │   │   ├── DailySummaryDialog.tsx
│   │   │   │   ├── NotificationCenter.tsx
│   │   │   │   ├── SmartBudgetBuilder.tsx
│   │   │   │   ├── NetWorthCard.tsx
│   │   │   │   ├── SpendingHeatmap.tsx
│   │   │   │   ├── CashflowForecast.tsx
│   │   │   │   └── AppLock.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── OnboardingFlow.tsx    # 7-step onboarding
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ui/               # Radix UI primitives wrappers
│   │   └── utils/
│   │       ├── translations.ts   # All localised strings
│   │       ├── currency.ts       # Region config & formatters
│   │       ├── categoryIcons.ts  # Expense category icon map
│   │       └── analytics.ts      # Crash monitoring & event logging
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (optional cloud sync)
│   │   └── cloudSync.ts          # Sync scheduler
│   └── styles/
│       └── index.css             # Tailwind 4 + global CSS
│
├── app/                          # Native Expo Router app
│   ├── _layout.tsx               # Root layout (AppProvider, GestureHandler)
│   ├── index.tsx                 # Guard: onboarding vs tabs redirect
│   ├── onboarding.tsx            # Native onboarding screen
│   └── (tabs)/
│       ├── _layout.tsx           # Bottom tab navigator
│       ├── index.tsx             # Home / Dashboard
│       ├── budget.tsx            # Budget analysis
│       ├── savings.tsx           # Goals & challenges
│       ├── invest.tsx            # Insights & education
│       └── wallet.tsx            # Accounts & quick toggles
│
├── mobile/                       # Expo WebView shell
│   ├── app/index.tsx             # WebView loading APP_URL
│   ├── config.ts                 # APP_URL constant
│   ├── app.json                  # Expo config (bundle ID, owner)
│   └── eas.json                  # EAS build profiles
│
├── lib/
│   ├── AppContext.tsx             # Native app state (mirrors web)
│   └── theme.ts                  # MK design tokens
│
├── supabase/
│   └── migrations/
│       └── 001_user_data.sql     # Cloud sync schema
│
├── guidelines/Guidelines.md      # Coding & UX standards
├── vite.config.ts                # Vite + PWA plugin config
└── architecture.md               # This file
```

---

## 3. Web Application

### 3.1 Entry Point & Routing

```
src/main.tsx
  └─ renders <App />
        └─ <ErrorBoundary>
              └─ <AppProvider>          (state + context)
                    └─ <AppContent>    (routing guard)
                          ├─ <AppLock />         if appLockEnabled && locked
                          ├─ <OnboardingFlow />  if !onboardingComplete
                          └─ <Dashboard />       if onboardingComplete
```

`AppContent` is a pure rendering switch — it reads `state.onboardingComplete` and `state.appLockEnabled` from `AppContext` and renders the correct top-level component. There is no React Router; navigation is state-driven.

---

### 3.2 Global State Management

**File:** `src/app/App.tsx`

#### Context

```ts
const AppContext = createContext<AppContextType | undefined>(undefined);
export function useApp() { ... }   // throws if used outside AppProvider
```

#### AppState Shape

```ts
interface AppState {
  // User profile
  language: 'en' | 'sw' | 'fr' | 'ar' | 'pt';
  region: string;            // e.g. 'TZ', 'KE', 'NG'
  userType: string;          // 'student' | 'biashara' | 'family' | ...
  incomeFrequency: string;   // 'daily' | 'weekly' | 'monthly' | ...
  userName: string;

  // Financial data
  transactions: Transaction[];
  goals: Goal[];
  firstGoal: { title: string; target: number } | null;
  balances: {
    cashBalance: number;
    mobileMoneyBalance: number;
    bankBalance: number;
    loanBalance: number;
  };
  categoryBudgets: Record<string, number>;  // category -> limit (KES/TZS/etc.)

  // Engagement
  challenges: SavingsChallenge[];
  roundUpEnabled: boolean;
  roundUpSavings: number;
  streak: number;
  lastActiveDate: string | null;   // ISO date string
  lessonProgress: string[];        // completed lesson IDs

  // App status
  onboardingComplete: boolean;
  emergencyMode: boolean;
  lastDailySummaryDate: string | null;
  dismissedNotifications: string[];

  // Security
  appLockEnabled: boolean;
  appLockPin: string;              // stretched hash (10k rounds DJB2)
}
```

#### Key Interfaces

```ts
interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  source: 'cash' | 'mpesa' | 'airtel' | 'tigo' | 'bank' | 'loan';
  notes: string;
  date: string;       // ISO date string (user-selectable, can be past dates)
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  completed: boolean;
  milestonesCelebrated: number[];   // % milestones already shown (25, 50, 75, 100)
}

interface SavingsChallenge {
  id: string;
  name: string;
  targetDays: number;
  dailyAmount: number;
  contributions: number[];   // one entry per day
}
```

#### Persistence

The entire `AppState` is serialised to `localStorage` on every state change via a `useEffect`. No partial updates — the full blob is written each time.

```
localStorage key: maokoto_v1
Migration:        reads pesaplan_v1 first and copies to maokoto_v1 if found
Salt key:         maokoto_salt_v2   (16-byte random hex, per-install, for PIN hashing)
```

#### State Mutations (AppContextType functions)

| Function | Description |
|---|---|
| `addTransaction(t)` | Appends transaction, updates the relevant balance account |
| `editTransaction(t)` | Replaces transaction in place, recalculates balance delta |
| `deleteTransaction(id)` | Removes and reverses balance effect |
| `addGoal(g)` | Adds a new Goal |
| `updateGoal(g)` | Replaces goal by id |
| `contributeToGoal(id, amount)` | Increments `goal.current`, marks completed if reached |
| `setFirstGoal(g)` | Sets the onboarding goal |
| `completeOnboarding()` | Sets `onboardingComplete: true` |
| `addChallenge(c)` | Appends a SavingsChallenge |
| `logChallengeContribution(id, amount)` | Adds daily amount to challenge |
| `toggleEmergencyMode()` | Flips `emergencyMode` |
| `toggleRoundUp()` | Flips `roundUpEnabled` |
| `setLanguage(lang)` | Updates language preference |
| `setCategoryBudget(cat, amt)` | Sets budget limit for a category |
| `setAppLock(enabled, pin)` | Enables PIN lock with hashed pin |
| `shouldShowDailySummary()` | Returns `true` if today's summary hasn't been shown |
| `markDailySummaryShown()` | Records today as shown in state |

---

### 3.3 Onboarding Flow

**File:** `src/app/components/onboarding/OnboardingFlow.tsx`

A linear, state-driven flow with 7 steps (index 0–6). Current step is tracked in local `useState`. Each step receives `onNext` and calls it when the user completes the step.

#### Steps

| Step | Component | Data Collected | AppState Key |
|---|---|---|---|
| 0 | `WelcomeStep` | — (animated splash) | — |
| 1 | `LanguageStep` | Language code | `language` |
| 2 | `NameStep` | Preferred name | `userName` |
| 3 | `RegionStep` | Country/region | `region` |
| 4 | `UserTypeStep` | User profile type | `userType` |
| 5 | `IncomeStep` | Income frequency | `incomeFrequency` |
| 6 | `GoalStep` | Goal title + target amount | `firstGoal`, `goals[0]` |

- **Step 0** plays a confetti burst on "Get Started".
- **Step 3** renders country flags and currencies from `REGION_CONFIG` in `currency.ts`.
- **Step 6** offers presets from `GOAL_DEFAULTS` (region-aware amounts) or a custom entry. Minimum amount: 100 units of local currency.

#### Completion

When Step 6 calls `onComplete`, `AppContent` calls `completeOnboarding()`, which sets `state.onboardingComplete = true`. The next render of `AppContent` switches from `<OnboardingFlow>` to `<Dashboard>`.

---

### 3.4 Dashboard

**File:** `src/app/components/dashboard/Dashboard.tsx`

The shell for the entire post-onboarding experience. It renders a fixed top navigation bar, tab content, and a bottom navigation bar.

#### Tabs

```ts
type ActiveTab = 'home' | 'budget' | 'savings' | 'invest' | 'wallet';
const TAB_ORDER: ActiveTab[] = ['home', 'budget', 'savings', 'invest', 'wallet'];
```

| Tab | Key Components Rendered |
|---|---|
| **home** | InsightOfDay, balance card (Total / Today In/Out), NetWorthCard, CashflowForecast, SpendingHeatmap, Recent Transactions |
| **budget** | BudgetHealthBars, category spending vs. limits, SmartBudgetBuilder link |
| **savings** | GoalsView (active + completed goals), SavingsChallenge |
| **invest** | GrowthShareCard, investment lists, financial education |
| **wallet** | Account balances (Cash / M-Pesa / Bank / Loan), quick Send Money |

#### Navigation

- **Bottom bar**: `BottomNav` renders `motion.button` per tab with a sliding `layoutId="nav-indicator"` pill via Framer Motion.
- **Swipe**: `onTouchStart` / `onTouchEnd` on the main container. Horizontal delta > 80px and horizontal:vertical ratio > 2.5 triggers `setActiveTab` to the adjacent tab in `TAB_ORDER`. Calls `navigator.vibrate(10)` for haptic feedback.
- **Animation**: `AnimatePresence` with `tabDirectionRef` controls whether the new tab slides in from left or right.

#### Overlay System

Full-screen views (Settings, History, Insights, Goal Detail) render as absolutely-positioned overlays that slide in from the right, mimicking native push navigation. They are conditionally rendered alongside the tab content, not replacing it.

#### Floating Action Button (FAB)

A central `Plus` icon button. On tap it opens an "Add Entry" sheet offering four types: Income, Expense, Bill, Subscription. The button rotates 45° when the sheet is open (Framer Motion `animate`).

#### AppContext Consumption

```ts
const {
  state,
  addTransaction, deleteTransaction,
  updateGoal, contributeToGoal,
  toggleEmergencyMode,
  shouldShowDailySummary, markDailySummaryShown,
} = useApp();
```

---

### 3.5 AI Assistant

**File:** `src/app/components/dashboard/AIAssistant.tsx`

A floating chat panel called "Maokoto Budget Coach".

#### Architecture: Hybrid Engine

```
User message
    │
    ▼
VITE_ANTHROPIC_API_KEY set?
    ├─ YES → anthropicClient.messages.stream (claude-haiku-4-5-20251001)
    │              │
    │         stream fails / empty?
    │              └─ generateReply() (rule-based fallback)
    │
    └─ NO  → generateReply() (rule-based engine)
```

**Anthropic integration:**
- SDK: `@anthropic-ai/sdk`, initialised with `dangerouslyAllowBrowser: true`.
- Model: `claude-haiku-4-5-20251001`.
- Streaming: `messages.stream` for real-time token rendering.
- System prompt: injected with live user data — name, user type, balances, net worth, spending categories, budget health, and regional context (M-Pesa, local markets, school fees).

**Rule-based engine (`generateReply`):**
- Supports 5 languages: English, Swahili, French, Arabic, Portuguese.
- Intent detection via keyword matching (40+ intents).
- Intent categories: balance, spent, income, loan/debt, networth, cash, mobile money, bank, budget, goal, biggest spending, reduce, today, week, month, emergency, roundup, challenge, school fees, health, transport, hello, thanks, tip/advice.
- Responses incorporate live `AppState` values (balances, category totals, goal progress).

---

### 3.6 Utilities

**`src/app/utils/translations.ts`**

Single source of truth for all UI strings. Exports:
- `t(key, lang)` — synchronous translation function, safe for any context.
- `useT()` — React hook wrapping `react-i18next`'s `useTranslation`.
- All string tables are inlined TypeScript objects (no JSON imports needed).

**`src/app/utils/currency.ts`**

- `REGION_CONFIG` — map of region code → `{ currency, symbol, flag, locale }`.
- `GOAL_DEFAULTS` — map of region code → suggested goal amounts.
- `formatCurrency(amount, region)` — locale-aware number formatter.

**`src/app/utils/categoryIcons.ts`**

Maps expense category names to Lucide React icon components. Used by transaction lists and budget bars.

---

### 3.7 UI Primitives

**`src/app/components/ui/`**

Thin wrappers around Radix UI primitives (Dialog, Sheet, Select, Slider, etc.) pre-styled with Tailwind 4. Consumed throughout dashboard components. Not application-logic-aware.

---

### 3.8 PWA & Service Worker

**`vite.config.ts`** uses `vite-plugin-pwa` in `generateSW` mode.

- **Precache**: 14 entries (~1.25 MB) generated at build time.
- **Runtime caching**: Workbox handles navigation requests.
- **Manifest**:
  - `name`: "Maokoto – Budget & Finance"
  - `display`: standalone
  - `categories`: ["finance", "productivity"]
  - **Icons**: 192px (any), 512px (any), 512px (maskable)
- **Offline**: All app assets and routes are available offline. `localStorage` data persists between sessions.

---

## 4. Mobile Application (Expo)

### 4.1 Navigation

**File:** `app/_layout.tsx`

Root layout wraps the app in `<AppProvider>` (from `lib/AppContext.tsx`) and `<GestureHandlerRootView>`. Defines an Expo Router `Stack` with three routes: `index`, `onboarding`, `(tabs)`.

**File:** `app/index.tsx` — navigation guard:

```ts
if (state.onboardingComplete) router.replace('/(tabs)');
else router.replace('/onboarding');
```

**File:** `app/(tabs)/_layout.tsx`

Uses `@react-navigation/bottom-tabs` to define five tabs with custom icons and the `MK` theme palette.

### 4.2 State Management

**File:** `lib/AppContext.tsx`

Mirrors the web `AppState` structure exactly, but persists to `AsyncStorage` under the key `maokoto_v1`. All mutation functions are identical in contract to the web version.

Additional mobile-specific features:
- **Round-up savings**: On each expense, calculates `ceil(amount / 500) * 500 - amount` and credits `roundUpSavings` if `roundUpEnabled`.
- **Theming**: Reads from `lib/theme.ts` (`MK` object) for consistent design tokens across all native screens.

### 4.3 Tab Screens

| Screen | File | Key Features |
|---|---|---|
| Home | `app/(tabs)/index.tsx` | Total balance, today's net flow, recent transactions, active goals summary |
| Budget | `app/(tabs)/budget.tsx` | Category spending vs. limits (today/week/month), progress bars |
| Savings | `app/(tabs)/savings.tsx` | Goals management, daily challenge tracker |
| Invest | `app/(tabs)/invest.tsx` | Financial health score, net worth, spending heatmap, education lessons |
| Wallet | `app/(tabs)/wallet.tsx` | Account balances (Cash/Mobile Money/Bank/Loan), Emergency Mode toggle, Round-up toggle |

High-level actions (add transaction, view notifications) use React Native `Modal` components rendered within each screen.

---

## 5. Data Layer

### 5.1 Persistence Strategy

| Environment | Storage | Key | Notes |
|---|---|---|---|
| Web | `localStorage` | `maokoto_v1` | Full `AppState` JSON written on every state change |
| Native | `AsyncStorage` | `maokoto_v1` | Same key and structure |
| Legacy migration | `localStorage` | `pesaplan_v1` | Auto-migrated to `maokoto_v1` on first load |
| PIN salt | `localStorage` | `maokoto_salt_v2` | 16-byte hex string, generated once per install |
| Crash log | `localStorage` | `pesaplan_crash_log_v1` | Last 20 crash entries, cross-session |

### 5.2 Cloud Sync

**Files:** `src/lib/supabase.ts`, `src/lib/cloudSync.ts`, `supabase/migrations/001_user_data.sql`

An optional Supabase backend can sync the local state. The `schedulePush` function (called from `AppProvider` after every state update) batches writes to avoid network spam. The database schema stores a single JSON blob per user. This feature is behind a `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` environment variable check — the app runs fully offline if these are absent.

### 5.3 Security

**PIN Lock:**
- User sets a 4-digit PIN in `SettingsView`.
- PIN is hashed using `hashPin(pin, salt)`: 10,000 rounds of a custom DJB2-based algorithm, producing a 48-character hex string.
- Salt is generated once per install and stored in `localStorage` as `maokoto_salt_v2`.
- Stored hash is in `AppState.appLockPin`. The raw PIN is never persisted.
- `verifyPin(input, storedHash, salt)` re-hashes and compares.

**`AppLock` component** (`src/app/components/dashboard/AppLock.tsx`):
- Renders a full-screen PIN entry overlay when `appLockEnabled && !unlocked`.
- 5 failed attempts locks for 30 seconds (exponential backoff pattern).

---

## 6. Internationalisation

**Files:** `src/i18n.ts`, `src/app/utils/translations.ts`

- **Library**: `i18next` + `react-i18next`.
- **Languages**: `en` (English), `sw` (Kiswahili), `fr` (French), `ar` (Arabic), `pt` (Portuguese).
- **Approach**: All translation strings are inlined TypeScript objects inside `translations.ts` — no JSON file loading at runtime. This avoids dynamic import issues in the Vite build.
- **Usage in components**: `const { t } = useT()` (hook) or `t(key, lang)` (standalone function for non-component contexts like analytics or the AI engine).
- **AI Assistant**: The rule-based engine uses the same `t()` function to generate localised responses for all 5 supported languages.

---

## 7. Analytics & Crash Monitoring

**File:** `src/app/utils/analytics.ts`

A production-ready stub that mirrors the Firebase Analytics + Crashlytics + Sentry API surface. Intended for a drop-in swap with real SDKs.

| Method | Description |
|---|---|
| `logEvent(event, params)` | Logs a named analytics event with params |
| `setScreen(name)` | Records a screen view for session attribution |
| `captureException(error, context)` | Persists crash to `pesaplan_crash_log_v1`, logs to console.error |
| `setUserProperty(key, value)` | Attaches a property to the session |
| `setUserId(userId)` | Sets user identifier for crash attribution |

All `console.debug` calls are guarded by `import.meta.env.DEV` — nothing leaks to production bundles. `console.error` in `captureException` is intentional for visibility in all environments.

A global `window.onerror` / `window.onunhandledrejection` handler (registered in `App.tsx`) routes uncaught errors through `analytics.captureException`.

---

## 8. Key Data Flows

### Adding a Transaction (Web)

```
User fills AddTransactionDialog
    │
    └─ calls addTransaction(t) from AppContext
            │
            ├─ appends t to state.transactions
            ├─ updates state.balances[t.source] by ± t.amount
            ├─ if roundUpEnabled: credits roundUpSavings
            └─ useEffect fires → JSON.stringify(state) → localStorage.setItem('maokoto_v1', ...)
                                                        → schedulePush(state) [cloud sync, optional]
```

### Completing a Goal

```
contributeToGoal(id, amount)
    │
    ├─ increments goal.current by amount
    ├─ if goal.current >= goal.target: sets goal.completed = true
    └─ GoalsView reads updated goals from AppContext → re-renders progress ring
         └─ if milestone crossed (25/50/75/100%): triggers celebration animation
```

### Onboarding → Dashboard Switch

```
OnboardingFlow (Step 6) user taps "Start Saving"
    │
    └─ calls onComplete() prop
            │
            └─ AppContent.completeOnboarding()
                    │
                    └─ setState({ onboardingComplete: true })
                            │
                            └─ AppContent re-renders
                                    └─ renders <Dashboard /> instead of <OnboardingFlow />
```

### AI Assistant Query

```
User types message → sends
    │
    ├─ anthropicClient exists?
    │       │
    │       YES → anthropicClient.messages.stream(systemPrompt + history + message)
    │               │                                    ↑
    │               │              (injected: balances, transactions, goals, user profile)
    │               │
    │               ├─ SUCCESS → stream tokens to chat bubble in real time
    │               └─ FAIL   → generateReply(message, state)
    │
    └─ NO → generateReply(message, state)
                    │
                    ├─ detect intent via keyword match (40+ intents, 5 languages)
                    └─ build localised response using live AppState values
```

---

## 9. Dependency Map

### Web Application

| Package | Role |
|---|---|
| `react` 18, `react-dom` | UI rendering |
| `vite` 6, `@vitejs/plugin-react` | Build & HMR |
| `vite-plugin-pwa` | PWA manifest + service worker |
| `tailwindcss` 4 | Utility-first CSS |
| `@radix-ui/*` | Accessible UI primitives |
| `lucide-react` | Icon library |
| `framer-motion` | Animations & gestures |
| `recharts` | Charting (545KB, largest bundle chunk) |
| `i18next`, `react-i18next` | Internationalisation |
| `@anthropic-ai/sdk` | AI assistant (optional, requires API key) |
| `@supabase/supabase-js` | Cloud sync (optional, requires env vars) |
| `workbox-*` | Service worker runtime caching |

### Mobile Application (Native)

| Package | Role |
|---|---|
| `expo` 52, `expo-router` | Native app framework & file routing |
| `react-native` | Native rendering |
| `@react-navigation/bottom-tabs` | Tab navigation |
| `react-native-gesture-handler` | Swipe & touch gestures |
| `@react-native-async-storage/async-storage` | Persistent storage |

### Mobile App (WebView Shell — `mobile/`)

| Package | Role |
|---|---|
| `expo` | App container |
| `react-native-webview` | Loads deployed web URL |
