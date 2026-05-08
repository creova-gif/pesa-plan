/**
 * PesaPlan Translation Utility
 *
 * Two-layer system:
 *   1. `t(key, lang)` — synchronous function, safe for class components & contexts
 *   2. `useT()`       — React hook wrapping react-i18next's `useTranslation`,
 *                       auto-reactive when language changes
 */

import { Language } from '@/app/App';

// ── Static fallback map ───────────────────────────────────────────────────────
export const translations = {
  // Splash & Onboarding
  tagline:             { en: 'Control your money, not fear it', sw: 'Dhibiti pesa zako, usiogofe' },
  dailyFinances:       { en: 'Track daily finances with mobile money', sw: 'Fuatilia fedha za kila siku na pesa za simu' },
  fastSetup:           { en: 'Fast setup in under 1 min!', sw: 'Sanidi haraka kwa chini ya dakika 1!' },
  chooseLanguage:      { en: 'Choose Your Language', sw: 'Chagua Lugha Yako' },
  changeLater:         { en: 'Change later in settings', sw: 'Badilisha baadaye kwenye mipangilio' },
  swahili:             { en: 'Swahili', sw: 'Kiswahili' },
  english:             { en: 'English', sw: 'Kiingereza' },
  welcomeQuestion:     { en: 'Hi! What best describes you?', sw: 'Habari! Nini kinakufafanua zaidi?' },
  student:             { en: 'Student / Youth', sw: 'Mwanafunzi / Kijana' },
  biashara:            { en: 'Biashara Owner', sw: 'Mmiliki wa Biashara' },
  informal:            { en: 'Informal Worker', sw: 'Mfanyakazi wa Kawaida' },
  family:              { en: 'Family Planner', sw: 'Mpangaji wa Familia' },
  other:               { en: 'Other', sw: 'Nyingine' },
  incomeQuestion:      { en: 'How do you earn money most often?', sw: 'Unapata pesa mara nyingi vipi?' },
  daily:               { en: 'Daily income', sw: 'Mapato ya kila siku' },
  weekly:              { en: 'Weekly income', sw: 'Mapato ya kila wiki' },
  monthly:             { en: 'Monthly income', sw: 'Mapato ya kila mwezi' },
  irregular:           { en: 'Irregular (mix)', sw: 'Mchanganyiko' },
  goalQuestion:        { en: 'What financial goal matters most?', sw: 'Ni lengo gani la kifedha linalomaanisha zaidi?' },
  schoolFees:          { en: 'School fees', sw: 'Ada za shule' },
  bills:               { en: 'Bills', sw: 'Malipo' },
  emergencyFund:       { en: 'Emergency fund', sw: 'Akiba ya dharura' },
  data:                { en: 'Data & airtime', sw: 'Data na muda wa simu' },
  travel:              { en: 'Travel', sw: 'Safari' },
  custom:              { en: 'Custom goal', sw: 'Lengo maalum' },
  targetAmount:        { en: 'Target amount', sw: 'Kiasi cha lengo' },
  ready:               { en: "Ready! Here's your money map.", sw: 'Tayari! Hii hapa ramani yako ya pesa.' },

  // Dashboard
  yourMoneyToday:      { en: 'Your Money Today', sw: 'Pesa Zako Leo' },
  totalBalance:        { en: 'Total Balance', sw: 'Jumla ya Salio' },
  cash:                { en: 'Cash', sw: 'Taslimu' },
  mobileMoney:         { en: 'Mobile Money', sw: 'Pesa za Simu' },
  bank:                { en: 'Bank', sw: 'Benki' },
  todayIncome:         { en: "Today's Income", sw: 'Mapato ya Leo' },
  todayExpenses:       { en: "Today's Expenses", sw: 'Matumizi ya Leo' },
  remaining:           { en: 'Remaining', sw: 'Iliyobaki' },
  onTrack:             { en: 'On track', sw: 'Uko sawa' },
  caution:             { en: 'Caution', sw: 'Tahadhari' },
  overspent:           { en: 'Overspent', sw: 'Umetumia zaidi' },

  // Nav labels
  home:                { en: 'Home', sw: 'Nyumbani' },
  addExpense:          { en: 'Add Expense', sw: 'Ongeza Matumizi' },
  addIncome:           { en: 'Add Income', sw: 'Ongeza Mapato' },
  addGoal:             { en: 'Add Goal', sw: 'Ongeza Lengo' },
  insights:            { en: 'Insights', sw: 'Maarifa' },
  history:             { en: 'History', sw: 'Historia' },
  goals:               { en: 'Goals', sw: 'Malengo' },
  settings:            { en: 'Settings', sw: 'Mipangilio' },
  challenges:          { en: 'Challenges', sw: 'Changamoto' },
  lessons:             { en: 'Lessons', sw: 'Masomo' },
  notifications:       { en: 'Notifications', sw: 'Arifa' },

  // Period / action labels
  income_label:        { en: 'Income', sw: 'Mapato' },
  spent:               { en: 'Spent', sw: 'Imetumika' },
  left:                { en: 'Left', sw: 'Iliyobaki' },
  today:               { en: 'Today', sw: 'Leo' },
  week:                { en: 'Week', sw: 'Wiki' },
  month:               { en: 'Month', sw: 'Mwezi' },
  all:                 { en: 'All', sw: 'Zote' },
  view:                { en: 'View', sw: 'Tazama' },
  delete:              { en: 'Delete', sw: 'Futa' },
  edit:                { en: 'Edit', sw: 'Hariri' },
  filter:              { en: 'Filter', sw: 'Chujio' },
  share:               { en: 'Share', sw: 'Shiriki' },
  copy:                { en: 'Copy', sw: 'Nakili' },
  copied:              { en: 'Copied!', sw: 'Imenakilwa!' },
  dismiss:             { en: 'Dismiss', sw: 'Funga' },
  dismissAll:          { en: 'Dismiss All', sw: 'Futa Zote' },
  enable:              { en: 'Enable', sw: 'Washa' },
  disable:             { en: 'Disable', sw: 'Zima' },
  confirm:             { en: 'Confirm', sw: 'Thibitisha' },
  back:                { en: 'Back', sw: 'Rudi' },
  viewAll:             { en: 'View All', sw: 'Tazama Zote' },
  suggested:           { en: 'Suggested', sw: 'Pendekezo' },
  type:                { en: 'Type', sw: 'Aina' },
  source:              { en: 'Source', sw: 'Chanzo' },

  // Transaction list
  recentTransactions:  { en: '🕐 Recent Transactions', sw: '🕐 Miamala ya Hivi Karibuni' },
  noTransactions:      { en: 'No transactions yet — start recording!', sw: 'Bado hakuna miamala — anza kurekodi!' },
  swipeHint:           { en: '← Swipe to delete · Swipe → to edit', sw: '← Buruta kufuta · Buruta → kuhariri' },
  contributeToGoal:    { en: 'Contribute to Goal', sw: 'Changia Lengo' },
  suggestions:         { en: 'Suggestions', sw: 'Mapendekezo' },

  // Transactions form
  expense:             { en: 'Expense', sw: 'Matumizi' },
  income:              { en: 'Income', sw: 'Mapato' },
  amount:              { en: 'Amount', sw: 'Kiasi' },
  category:            { en: 'Category', sw: 'Jamii' },
  paymentSource:       { en: 'Payment Source', sw: 'Chanzo cha Malipo' },
  notes:               { en: 'Notes (optional)', sw: 'Maelezo (hiari)' },
  autoDetects:         { en: '(auto-detects category)', sw: '(itatambua jamii otomatifu)' },
  save:                { en: 'Save', sw: 'Hifadhi' },
  cancel:              { en: 'Cancel', sw: 'Ghairi' },

  // Categories
  chakula:             { en: 'Food', sw: 'Chakula' },
  transport:           { en: 'Transport', sw: 'Usafiri' },
  rent:                { en: 'Rent', sw: 'Kodi' },
  billsCategory:       { en: 'Bills', sw: 'Malipo' },
  dataCategory:        { en: 'Data & Airtime', sw: 'Data na Muda' },
  biasharaCosts:       { en: 'Business', sw: 'Biashara' },
  health:              { en: 'Health', sw: 'Afya' },
  entertainment:       { en: 'Entertainment', sw: 'Burudani' },
  familia:             { en: 'Family', sw: 'Familia' },

  // Payment sources
  mpesa:               { en: 'M-Pesa', sw: 'M-Pesa' },
  airtel:              { en: 'Airtel Money', sw: 'Airtel Money' },
  tigo:                { en: 'Tigo Pesa', sw: 'Tigo Pesa' },
  loan:                { en: 'Credit/Loan', sw: 'Mkopo' },

  // Goals
  contributeNow:       { en: 'Contribute now', sw: 'Changia sasa' },
  daysLeft:            { en: 'days left', sw: 'siku zilizobaki' },
  goalAchieved:        { en: 'Congrats! You achieved your goal!', sw: 'Hongera! Umefanikisha lengo lako!' },
  goalCompleted:       { en: '🎉 Goal Completed!', sw: '🎉 Lengo Limefanikiwa!' },
  goalProgress:        { en: 'Goal Progress', sw: 'Maendeleo ya Lengo' },
  goalRemaining:       { en: 'Remaining', sw: 'Iliyobaki' },

  // Budget
  budgetHealth:        { en: 'Budget Health', sw: 'Afya ya Bajeti' },
  noBudgetsSet:        { en: 'No budgets set yet', sw: 'Bado hakuna bajeti zilizowekwa' },
  setBudgets:          { en: 'Set Budgets', sw: 'Weka Bajeti' },
  setBudgetFirst:      { en: 'Set a budget first to track health', sw: 'Weka bajeti kwanza ili kufuatilia afya yako' },

  // Settings
  language:            { en: 'Language', sw: 'Lugha' },
  currency:            { en: 'Currency', sw: 'Sarafu' },
  incomeFrequency:     { en: 'Income Frequency', sw: 'Mara za Mapato' },
  backup:              { en: 'Backup', sw: 'Akiba ya Data' },
  exportHistory:       { en: 'Export History', sw: 'Hamisha Historia' },
  exportCSV:           { en: 'Export CSV', sw: 'Hamisha CSV' },
  deleteData:          { en: 'Delete Data', sw: 'Futa Data' },
  deleteDataConfirm:   { en: 'This will permanently erase all your data. Are you sure?', sw: 'Hii itafuta data yako yote milele. Una uhakika?' },
  privacyPolicy:       { en: 'Privacy Policy', sw: 'Sera ya Faragha' },
  termsOfService:      { en: 'Terms of Service', sw: 'Masharti ya Huduma' },
  legal:               { en: 'Legal & Privacy', sw: 'Kisheria na Faragha' },
  appLock:             { en: 'App Lock', sw: 'Kufunga Programu' },
  pinLock:             { en: 'PIN Lock', sw: 'Kufunga kwa PIN' },
  secureApp:           { en: 'Secure your app with a 4-digit PIN', sw: 'Linda programu yako na PIN ya nambari 4' },

  // Daily summary & misc
  dailySummary:        { en: 'Daily Summary', sw: 'Muhtasari wa Leo' },
  goalContributions:   { en: 'Goal Contributions', sw: 'Michango ya Malengo' },
  viewFullReport:      { en: 'View Full Report', sw: 'Tazama Ripoti Kamili' },
  goodbye:             { en: 'Asante! See you tomorrow 😊', sw: 'Asante! Tutaonana kesho 😊' },
  ok:                  { en: 'OK', sw: 'Sawa' },
  next:                { en: 'Next', sw: 'Endelea' },
  skip:                { en: 'Skip', sw: 'Ruka' },
  continue:            { en: 'Continue', sw: 'Endelea' },
  finish:              { en: 'Finish', sw: 'Maliza' },

  // Insights
  aiInsights:          { en: 'AI Insights', sw: 'Maarifa ya AI' },
  highestSpending:     { en: 'Highest Spending', sw: 'Matumizi Makubwa' },
  savingsTip:          { en: 'Savings Tip', sw: 'Mapendekezo ya Akiba' },
  dataPlans:           { en: 'Data Plans', sw: 'Mipango ya Data' },
  insightOfDay:        { en: 'Insight of the Day', sw: 'Ushauri wa Leo' },
  addTransactionsPrompt: { en: 'Add transactions to see insights!', sw: 'Ongeza miamala ili uone maarifa!' },
  insightsWillAppear:  { en: 'Your insights will appear here', sw: 'Maarifa yataonekana hapa' },

  // Emergency & Round-up
  emergencyMode:       { en: 'Emergency Mode', sw: 'Hali ya Dharura' },
  emergencyModeActive: { en: 'Emergency Mode Active', sw: 'Hali ya Dharura Imewashwa' },
  roundUpSavings:      { en: 'Round-Up Savings', sw: 'Akiba ya Round-Up' },

  // Share & Growth
  shareProgress:       { en: 'Share Your Progress', sw: 'Shiriki Maendeleo Yako' },
  inviteFriend:        { en: 'Invite Friend', sw: 'Alika Rafiki' },
  inviteFriends:       { en: 'Invite Friends', sw: 'Alika Marafiki' },
  copyMessage:         { en: 'Copy Message', sw: 'Nakili Ujumbe' },
  inspireYourFriends:  { en: 'Inspire your friends!', sw: 'Wahamasisha marafiki wako!' },
  shareOnWhatsApp:     { en: 'Share on WhatsApp, TikTok, or Instagram.', sw: 'Shiriki ujumbe huu kwenye WhatsApp, TikTok, au Instagram.' },
  growthTip:           { en: 'Every friend you invite helps them too — teach others to save.', sw: 'Kila rafiki unayemwalika anakusaidia pia — funza wengine jinsi ya kuokoa.' },

  // Greetings by user type
  greetStudent:        { en: 'Hello, Student!', sw: 'Habari, Mwanafunzi!' },
  greetBiashara:       { en: 'Welcome, Entrepreneur!', sw: 'Karibu, Mfanyabiashara!' },
  greetInformal:       { en: 'Good day, Worker!', sw: 'Habari za kazi!' },
  greetFamily:         { en: 'Hello, Family Planner!', sw: 'Habari, Familia!' },
  greetDefault:        { en: 'Hello!', sw: 'Habari!' },

  // Notifications
  noNotifications:     { en: 'No new notifications 🎉', sw: 'Hakuna arifa mpya 🎉' },
  allCaughtUp:         { en: "You're all caught up!", sw: 'Uko vizuri!' },
  dataStoredSecurely:  { en: 'Your data is stored securely on your device.', sw: 'Data zako zimehifadhiwa salama kwenye kifaa chako.' },

  // PIN Lock
  forgotPin:           { en: 'Forgot PIN', sw: 'Sahau PIN' },
  createPin:           { en: 'Create your PIN', sw: 'Weka PIN yako' },
  confirmPin:          { en: 'Confirm your PIN', sw: 'Thibitisha PIN yako' },
  enterPin:            { en: 'Enter PIN to unlock', sw: 'Weka PIN kufungua' },
  chooseDigits:        { en: 'Choose a 4-digit secret code', sw: 'Chagua nambari 4 za siri' },
  reEnterPin:          { en: 'Re-enter your PIN to confirm', sw: 'Ingiza tena PIN yako kuthibitisha' },
  pinsNoMatch:         { en: 'PINs do not match. Try again.', sw: 'PIN hazilingani. Jaribu tena.' },
  pinProtected:        { en: 'PIN Protected', sw: 'PIN Imewezeshwa' },
  pinDisabled:         { en: 'PIN Disabled', sw: 'PIN Imezimwa' },
  disablePinLock:      { en: 'Disable PIN Lock?', sw: 'Zima Kufunga?' },
  pinRecoveryWarning:  { en: 'If you forget your PIN, you will need to clear all app data.', sw: 'Ukisahau PIN yako, itabidi ufute data yote ya programu.' },
  appProtected:        { en: 'PesaPlan is protected', sw: 'PesaPlan imelindwa' },

  // Misc card labels
  netWorth:            { en: 'Net Worth', sw: 'Thamani Halisi' },
  cashflowForecast:    { en: 'Cashflow Forecast', sw: 'Utabiri wa Fedha' },
  financialHealthScore: { en: 'Financial Health Score', sw: 'Alama ya Afya ya Fedha' },
  loanBalance:         { en: 'Loan Balance', sw: 'Salio la Mkopo' },
  streakLabel:         { en: 'Streak', sw: 'Mfululizo' },
  savedLabel:          { en: 'Saved', sw: 'Imeokolewa' },
  lessonsLabel:        { en: 'Lessons', sw: 'Masomo' },
  challengesLabel:     { en: 'Challenges', sw: 'Changamoto' },

  // Security & Settings
  security:            { en: 'Security', sw: 'Usalama' },
  actions:             { en: 'Actions', sw: 'Vitendo' },
  yourName:            { en: 'Your Name', sw: 'Jina Lako' },
  saveChanges:         { en: 'Save Changes', sw: 'Hifadhi Mabadiliko' },
  eraseAllData:        { en: 'Erase all data and restart', sw: 'Futa data zote na anza upya' },
  deleteAllDataTitle:  { en: 'Delete All Data?', sw: 'Futa Data Zote?' },
  yesDelete:           { en: 'Yes, Delete', sw: 'Ndio, Futa' },
  noDataToExport:      { en: 'No data to export', sw: 'Hakuna data ya kuhamisha' },

  // Backup / Restore
  saveBackupJSON:      { en: 'Save Backup (JSON)', sw: 'Hifadhi Nakala (JSON)' },
  fullDataBackup:      { en: 'Full data backup you can restore later', sw: 'Hifadhi data yote kwa usalama' },
  restoreBackupJSON:   { en: 'Restore Backup (JSON)', sw: 'Rejesha Nakala (JSON)' },
  restoreFromFile:     { en: 'Restore from a saved backup file', sw: 'Rejesha kutoka faili ya nakala' },
  restoredDone:        { en: 'Restored!', sw: 'Imerejesha!' },
  restoreBackupTitle:  { en: 'Restore Backup?', sw: 'Rejesha Nakala?' },
  yesRestore:          { en: 'Yes, Restore', sw: 'Ndio, Rejesha' },
  invalidBackupFile:   { en: 'Invalid file — not a PesaPlan backup', sw: 'Faili batili — si faili la PesaPlan' },
  invalidJSONFile:     { en: 'Invalid file — could not parse JSON', sw: 'Faili batili — JSON isiyo sahihi' },
  dataStoredDevice:    { en: 'All data saved on this device', sw: 'Data zote zimehifadhiwa kwenye kifaa' },
  connected:           { en: 'Connected!', sw: 'Umeunganishwa!' },
  noConnection:        { en: 'No connection', sw: 'Hakuna mtandao' },

  // Budget Coach (AIAssistant)
  budgetCoach:         { en: 'Budget Coach', sw: 'Msaidizi wa Bajeti' },
  askAboutSpending:    { en: 'Ask about your spending', sw: 'Maswali kuhusu fedha zako' },
  askMeAnything:       { en: 'Ask me anything...', sw: 'Niulize chochote...' },
  quickQuestions:      { en: 'Quick questions', sw: 'Maswali ya haraka' },

  // History
  noResultsFound:      { en: 'No results found', sw: 'Hakuna matokeo' },
  noTransactionsFilter: { en: 'No transactions match the filter', sw: 'Hakuna miamala inayolingana na kichujio' },
  endOfHistory:        { en: '— End of history —', sw: '— Mwisho wa historia —' },
  clearFilters:        { en: 'Clear all filters', sw: 'Futa kichujio' },
  totalTransactions:   { en: 'Total Transactions', sw: 'Jumla ya Miamala' },
  filtered:            { en: 'filtered', sw: 'imechujwa' },

  // Dashboard / Goals
  repeat:              { en: 'Repeat', sw: 'Rudia' },
  summary:             { en: 'Summary', sw: 'Muhtasari' },
  byCategory:          { en: 'By Category', sw: 'Kwa Jamii' },
  noTransactionsYet:   { en: 'No transactions yet', sw: 'Bado hakuna miamala' },
  saveNow:             { en: 'Save Now', sw: 'Weka Akiba' },
  suggestedToday:      { en: 'Suggested today', sw: 'Pendekezo la leo' },
  overdue:             { en: 'Overdue', sw: 'Imepita' },
  goalName:            { en: 'Goal Name', sw: 'Jina la Lengo' },
  targetAmountLabel:   { en: 'Target Amount', sw: 'Kiasi Lengwa' },
  askAssistantMore:    { en: 'Ask Assistant more →', sw: 'Uliza Msaidizi zaidi →' },

  // Insights
  budgetSuggestions:       { en: '🤖 Budget Suggestions', sw: '🤖 Mapendekezo ya Bajeti' },
  thisWeeksReport:         { en: "📋 This Week's Report", sw: '📋 Ripoti ya Wiki Hii' },
  spentMoreLastWeek:       { en: 'more than last week', sw: 'zaidi kuliko wiki iliyopita' },
  spentLessLastWeek:       { en: 'less than last week', sw: 'chini kuliko wiki iliyopita' },
  dailyAverage:            { en: 'Daily Average', sw: 'Wastani wa Siku' },
  categoryBreakdown:       { en: 'Category Breakdown', sw: 'Mgawanyo wa Jamii' },
  weeklyTrends:            { en: 'Weekly Trends (7 Days)', sw: 'Mwenendo wa Wiki (Siku 7)' },
  addTransactionsForChart: { en: 'Add transactions to see chart', sw: 'Ongeza miamala ili uone grafu' },
  saved:                   { en: 'Saved', sw: 'Imeokolewa' },
  predictiveIntelligence:  { en: '🔮 Predictive Intelligence', sw: '🔮 Utabiri wa Matumizi' },
  financialEducation:      { en: '📚 Financial Education', sw: '📚 Elimu ya Fedha' },

  // Dashboard
  vsLastWeek:          { en: 'vs last week', sw: 'ikilinganishwa na wiki iliyopita' },
  searchPlaceholder:   { en: 'Search... "coffee this week"', sw: 'Tafuta... "chakula wiki hii"' },
  monthlySummary:      { en: 'Monthly Summary', sw: 'Muhtasari wa Mwezi' },
  spendingVsIncome:    { en: 'Spending vs Income', sw: 'Matumizi dhidi ya Mapato' },
  limits:              { en: 'Limits', sw: 'Mipaka' },
  startLoggingToday:   { en: 'Start logging today', sw: 'Anza kurekodi leo' },
  addIncomeOrExpenses: { en: 'Add income or expenses to see your monthly summary here.', sw: 'Ongeza mapato au matumizi ili kuona muhtasari wako wa mwezi.' },
  used:                { en: 'used', sw: 'imetumika' },
  spendingAbovePace:   { en: 'Spending above pace', sw: 'Matumizi ni makubwa' },
  sevenDayTrend:       { en: '7-day trend', sw: 'Mwenendo wa siku 7' },
  budgetAlerts:        { en: 'Budget Alerts', sw: 'Arifa za Bajeti' },
  spendingBreakdown:   { en: 'Spending Breakdown', sw: 'Mgawanyo wa Matumizi' },
  spendingInsight:     { en: 'Spending Insight', sw: 'Maarifa ya Matumizi' },
  startTracking:       { en: 'Start tracking your money', sw: 'Anza kurekodi matumizi yako' },
  tapToBegin:          { en: 'Tap "Expense" or "Income" above to begin', sw: 'Bonyeza "Matumizi" au "Mapato" hapo juu' },
  addFirstEntry:       { en: '+ Add First Entry', sw: '+ Ongeza Kwanza' },

  // History
  yesterday:           { en: 'Yesterday', sw: 'Jana' },
  confirmDelete:       { en: 'Confirm delete', sw: 'Thibitisha ufutaji' },
  deleteTransaction:   { en: 'Delete transaction', sw: 'Futa muamala' },
  clearAll:            { en: 'Clear All', sw: 'Futa Kichujio' },
  showResults:         { en: 'Show Results', sw: 'Tazama Matokeo' },

  // Goals
  goalAdded:           { en: '🎯 Goal added!', sw: '🎯 Lengo limeongezwa!' },
  contributionAdded:   { en: '✅ Contribution added!', sw: '✅ Mchango umeongezwa!' },
  active:              { en: 'active', sw: 'hai' },
  done:                { en: 'Done', sw: 'Imekamilika' },
  completed:           { en: 'Completed!', sw: 'Imekamilika!' },
  setGoalDeadline:     { en: 'Set a goal with a deadline', sw: 'Weka lengo na muda wake' },
  deadlineDaysOptional:{ en: 'Deadline (Days) — Optional', sw: 'Muda (Siku) — Hiari' },
  congratulations:     { en: 'Congratulations!', sw: 'Hongera!' },

  // Smart Budget Builder
  smartBudgetBuilder:  { en: 'Smart Budget Builder', sw: 'Muundaji wa Bajeti' },
  avg:                 { en: 'Avg:', sw: 'Wastani:' },

  // Settings
  countryCurrency:     { en: 'Country / Currency', sw: 'Nchi / Sarafu' },
  notSet:              { en: 'Not set', sw: 'Haijawekwa' },
  dayStreak:           { en: 'Day Streak', sw: 'Siku Mfululizo' },
  myStats:             { en: 'My Stats', sw: 'Takwimu Zangu' },
  downloaded:          { en: 'Downloaded!', sw: 'Imepakuliwa!' },
  enabledTapToChange:  { en: 'Enabled — tap to change', sw: 'Imewezeshwa — gusa kubadilisha' },

  // Budget Limits
  budgetLimitsSaved:    { en: 'Budget limits saved! ✓', sw: 'Mipaka imehifadhiwa! ✓' },
  budgetLimitsTitle:    { en: '🎯 Budget Limits', sw: '🎯 Mipaka ya Bajeti' },
  budgetLimitsSubtitle: { en: 'Set a spending cap for each category', sw: 'Weka kikomo cha matumizi kwa kila aina' },
  saveBudgetLimits:     { en: 'Save Budget Limits', sw: 'Hifadhi Mipaka' },

  // Onboarding
  pickFirstGoal:        { en: 'Pick your first financial goal', sw: 'Chagua lengo lako la kwanza' },
  whereAreYou:          { en: 'Where are you?', sw: 'Uko wapi?' },
  freeTagline:          { en: 'Free · No ads · Works offline', sw: 'Bila malipo · Bila matangazo · Bila mtandao' },
  cashflowHelper:       { en: 'This helps us forecast your cash flow', sw: 'Hii inasaidia kutabiri mwenendo wa pesa' },
  selected:             { en: 'Selected', sw: 'Imechaguliwa' },
  personaliseExperience:{ en: 'We personalise your experience', sw: 'Tunaboresha uzoefu wako' },

  // Misc
  min:                  { en: 'min', sw: 'dak' },
};

export type TranslationKey = keyof typeof translations;

/**
 * Synchronous translation function — safe for use anywhere.
 * Falls back to English if the key or language is missing.
 */
export function t(key: TranslationKey, lang: Language): string {
  return translations[key]?.[lang] ?? translations[key]?.en ?? key;
}
