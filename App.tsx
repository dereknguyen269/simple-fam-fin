import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Expense,
  RecurringExpense,
  SavingsGoal,
  Budget,
  Wallet,
  CategoryItem,
  MemberItem,
  GoogleConfig,
  CurrencyCode,
  TransactionType,
  CurrencyConfig,
  UserProfile
} from './types';
import {
  CURRENCY_SYMBOLS,
  AVAILABLE_CURRENCIES,
  DEFAULT_MEMBER_ITEMS,
  DEFAULT_CATEGORY_ITEMS
} from './constants';
import {
  getExpenses,
  getRecurringExpenses,
  getGoals,
  getBudgets,
  getWallets,
  getCurrencyCode,
  getCategories,
  getMembers,
  getGoogleConfig,
  getGoogleSyncEnabled,
  saveExpenses,
  saveRecurringExpenses,
  saveGoals,
  saveBudgets,
  saveWallets,
  saveCurrencyCode,
  saveCategories,
  saveMembers,
  saveGoogleConfig,
  saveGoogleSyncEnabled,
  isSetupComplete,
  setSetupComplete,
  getCategoryColorsMap,
  getGoogleToken,
  saveGoogleToken
} from './services/storageService';
import {
  initializeGapiClient,
  handleAuthClick,
  trySilentAuth,
  handleSignOut,
  fetchExpensesFromSheet,
  saveExpensesToSheet,
  fetchRefData,
  saveRefData,
  saveGoalsToSheet,
  saveBudgetsToSheet,
  getUserProfile,
  ensureValidToken
} from './services/googleSheetsService';
import {
  calculateWalletBalances,
  calculateNextDate,
  generateFullDemoData,
  convertToBase
} from './utils';
import { Dashboard } from './components/Dashboard';
import { ExpenseTable } from './components/ExpenseTable';
import { GoalsView } from './components/GoalsView';
import { Home } from './components/Home';
import { LandingPage } from './components/LandingPage';
import { SetupWizard } from './components/SetupWizard';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { Dialog } from './components/Dialog';
import { FeedbackModal } from './components/FeedbackModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { AboutPage } from './components/AboutPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { CookiesPage } from './components/CookiesPage';
import { ContactPage } from './components/ContactPage';
import { ReconnectModal } from './components/ReconnectModal';
import {
  Wallet as WalletIcon,
  LayoutDashboard,
  Table2,
  Target,
  HelpCircle,
  Settings,
  CloudLightning,
  LogOut,
  LogIn,
  Menu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  CircleUserRound,
  Home as HomeIcon,
  MessageSquare
} from 'lucide-react';


enum View {
  HOME = 'home',
  DASHBOARD = 'dashboard',
  EXPENSES = 'expenses',
  GOALS = 'goals',
  SETTINGS = 'settings',
}

const App: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // App State
  const [needsSetup, setNeedsSetup] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // App Data State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // Ref Data State
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>(DEFAULT_CATEGORY_ITEMS);
  const [memberItems, setMemberItems] = useState<MemberItem[]>(DEFAULT_MEMBER_ITEMS);

  // View state - no URL routing
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Google Sheets Integration State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Used for manual sync button
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig | null>(null);

  // Live Sync State
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'offline' | 'fetching'>('offline');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isRemoteUpdate = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncStatusRef = useRef(syncStatus); // Ref to track status inside async polling closures
  const isSavingRef = useRef(false); // Prevent concurrent saves
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Currency State
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Helper to show dialog
  const showDialog = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    onConfirm?: () => void,
    showCancel: boolean = false
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      showCancel
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };


  // Helper to get color map for visualizations
  const categoryColors = useMemo(() => getCategoryColorsMap(categoryItems), [categoryItems]);

  // Member helpers
  const memberList = useMemo(() => memberItems.map(m => m.name), [memberItems]);
  const memberColors = useMemo(() => {
    const map: Record<string, string> = {};
    memberItems.forEach(m => map[m.name] = m.color);
    return map;
  }, [memberItems]);

  // Compute live wallet balances
  const computedWallets = useMemo(() => calculateWalletBalances(wallets, expenses), [wallets, expenses]);

  const isSyncEnabled = getGoogleSyncEnabled();

  const refreshLocalData = () => {
    setExpenses(getExpenses());
    setRecurringExpenses(getRecurringExpenses());
    setGoals(getGoals());
    setBudgets(getBudgets());
    setWallets(getWallets());
    setCurrencyCode(getCurrencyCode());
    setCategoryItems(getCategories());
    setMemberItems(getMembers());
  };

  // Keep ref in sync with state for polling
  useEffect(() => {
    syncStatusRef.current = syncStatus;
  }, [syncStatus]);

  // Redirect from / to /app when user has started
  useEffect(() => {
    if (!isLoading && !needsSetup && hasStarted && location.pathname === '/') {
      navigate('/app', { replace: true });
    }
  }, [isLoading, needsSetup, hasStarted, location.pathname, navigate]);

  // Helper to process recurring logic
  const processRecurringExpenses = (currentExpenses: Expense[], currentRecurring: RecurringExpense[]) => {
    const today = new Date().toISOString().split('T')[0];
    const newExpenses: Expense[] = [];
    let hasChanges = false;

    const updatedRecurring = currentRecurring.map(rule => {
      let currentRule = { ...rule };
      while (currentRule.nextDueDate <= today && currentRule.active) {
        hasChanges = true;
        newExpenses.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date: currentRule.nextDueDate,
          description: `${currentRule.description} (Recurring)`,
          category: currentRule.category,
          amount: currentRule.amount,
          member: currentRule.member,
          recurrence: currentRule.frequency,
          type: currentRule.type || TransactionType.EXPENSE,
          walletId: currentRule.walletId || 'main'
        });
        currentRule.nextDueDate = calculateNextDate(currentRule.nextDueDate, currentRule.frequency);
      }
      return currentRule;
    });

    let finalExpenses = currentExpenses;
    if (hasChanges) {
      finalExpenses = [...newExpenses, ...currentExpenses].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    return { expenses: finalExpenses, recurring: updatedRecurring, hasChanges };
  };

  // Helper to sync ref data
  const syncRefData = async (spreadsheetId: string) => {
    const refData = await fetchRefData(spreadsheetId);
    if (refData.categories && refData.categories.length > 0) {
      setCategoryItems(refData.categories);
      saveCategories(refData.categories);
    }
    if (refData.members && refData.members.length > 0) {
      setMemberItems(refData.members);
      saveMembers(refData.members);
    }
    if (refData.goals && refData.goals.length > 0) {
      setGoals(refData.goals);
      saveGoals(refData.goals);
    }
    if (refData.budgets && refData.budgets.length > 0) {
      setBudgets(refData.budgets);
      saveBudgets(refData.budgets);
    }
  };

  // Initial Load
  useEffect(() => {
    const initApp = async () => {
      // 0. Check Setup
      if (!isSetupComplete()) {
        setNeedsSetup(true);
        setIsLoading(false);
        return;
      }

      refreshLocalData();

      // Process Recurring Locally
      const loadedExpenses = getExpenses();
      const loadedRecurring = getRecurringExpenses();
      const processed = processRecurringExpenses(loadedExpenses, loadedRecurring);
      setExpenses(processed.expenses);
      setRecurringExpenses(processed.recurring);

      // Check Google Config
      const config = getGoogleConfig();
      console.log('🟢 [DEBUG] App Init: Google config loaded:', config ? 'Yes' : 'No');
      if (config && config.clientId && config.apiKey) {
        setGoogleConfig(config);

        try {
          console.log('🟢 [DEBUG] App Init: Initializing GAPI client...');
          await initializeGapiClient(config);

          if (getGoogleSyncEnabled()) {
            console.log('🟢 [DEBUG] App Init: Google Sync is enabled');
            // Check if we have a valid token already
            let hasToken = window.gapi?.client?.getToken();
            console.log('🟡 [DEBUG] App Init: Has token in memory?', hasToken ? 'Yes' : 'No');

            // Only attempt silent auth if we have a SAVED token to refresh
            // Don't attempt silent auth for initial authentication (would trigger popup)
            if (!hasToken) {
              const savedToken = getGoogleToken();
              console.log('🟡 [DEBUG] App Init: Has saved token in storage?', savedToken ? 'Yes' : 'No');
              if (savedToken && savedToken.access_token) {
                console.log('🟡 [DEBUG] App Init: Attempting silent token refresh...');
                // We have a saved token, try to refresh it silently
                try {
                  await trySilentAuth();
                  hasToken = window.gapi?.client?.getToken();
                  console.log('✅ [DEBUG] App Init: Silent refresh result:', hasToken ? 'Success' : 'Failed');
                } catch (e: any) {
                  // Only log if it's not an expected error
                  if (!e?.expected) {
                    console.warn("Silent token refresh failed:", e);
                  }
                  // If silent refresh fails, user will need to reconnect manually
                }
              }
              // If no saved token, don't attempt silent auth - let user click Connect
            }

            if (hasToken) {
              console.log('🟢 [DEBUG] App Init: Has valid token, fetching data...');
              // We have a token, try to use it
              try {
                setIsSyncing(true);
                setSyncStatus('fetching');
                setIsGoogleConnected(true);

                if (config.spreadsheetId) {
                  // Fetch All Data
                  isRemoteUpdate.current = true;
                  const { expenses: sheetExpenses, wallets: sheetWallets } = await fetchExpensesFromSheet(config.spreadsheetId);

                  if (sheetExpenses) {
                    setExpenses(sheetExpenses);
                    saveExpenses(sheetExpenses);
                  }
                  if (sheetWallets && sheetWallets.length > 0) {
                    setWallets(sheetWallets);
                    saveWallets(sheetWallets);
                  }

                  await syncRefData(config.spreadsheetId);
                  setSyncStatus('synced');
                  setLastSynced(new Date());
                  setSyncError(null);
                  setTimeout(() => isRemoteUpdate.current = false, 500);
                }
              } catch (err: any) {
                console.warn("Token expired or invalid, user needs to reconnect.", err);
                setIsGoogleConnected(false);
                setSyncStatus('offline');
                setSyncError('Session expired. Please reconnect.');
                // Clear the invalid token
                if (window.gapi?.client) {
                  window.gapi.client.setToken(null);
                }
              } finally {
                setIsSyncing(false);
              }
            } else {
              // No token available, user needs to manually connect
              console.log("No auth token found. User needs to connect manually.");
              setIsGoogleConnected(false);
              setSyncStatus('offline');
              setSyncError(null);
            }
          }
        } catch (err) {
          console.error("GAPI Init Error", err);
          setSyncStatus('offline');
        }
      }
      setIsLoading(false);
    };

    initApp();

    // Check for shared configuration in URL
    const checkSharedConfig = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedConfig = urlParams.get('config');

      if (encodedConfig) {
        try {
          const jsonString = atob(encodedConfig);
          const sharedConfig = JSON.parse(jsonString);

          if (sharedConfig.clientId && sharedConfig.apiKey && sharedConfig.spreadsheetId) {
            const shouldImport = window.confirm(
              "This link contains a Data Source configuration.\n\n" +
              "Would you like to import it?\n\n" +
              "This will update your Google Sheets connection settings."
            );

            if (shouldImport) {
              setGoogleConfig(sharedConfig);
              saveGoogleConfig(sharedConfig);
              setIsSettingsOpen(true);

              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              // Clean up URL without importing
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (e) {
          console.error("Failed to parse shared configuration", e);
          // Clean up URL on error
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    checkSharedConfig();
  }, []);

  // --- Live Sync Logic ---

  // 1. Enhanced Debounced Auto-Save with Retry Logic
  useEffect(() => {
    // Save to LocalStorage immediately
    saveExpenses(expenses);
    saveRecurringExpenses(recurringExpenses);
    saveGoals(goals);
    saveBudgets(budgets);
    saveWallets(wallets);
    saveCategories(categoryItems);
    saveMembers(memberItems);

    // Cloud Sync Logic
    if (!isGoogleConnected || !googleConfig?.spreadsheetId) {
      setSyncStatus('offline');
      setSyncError(null);
      return;
    }

    // Skip if this change came from a cloud fetch
    if (isRemoteUpdate.current) return;

    // Skip if already saving
    if (isSavingRef.current) {
      console.log('Save already in progress, skipping...');
      return;
    }

    // Clear existing timer
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setSyncStatus('saving');
    setSyncError(null);

    // Debounce 2s
    saveTimeoutRef.current = setTimeout(async () => {
      // Double-check we're not already saving
      if (isSavingRef.current) return;

      isSavingRef.current = true;

      try {
        // Verify connection before attempting save
        if (!window.gapi?.client?.getToken()) {
          throw new Error('Not authenticated. Please reconnect.');
        }

        // Proactively refresh token if needed (within 5 minutes of expiry)
        try {
          const tokenValid = await ensureValidToken();
          if (!tokenValid) {
            await trySilentAuth();
          }
        } catch (tokenError: any) {
          // Only log unexpected errors
          if (!tokenError?.expected) {
            console.warn('Token refresh attempt failed before save:', tokenError);
          }
          // Continue with save attempt - might still work if token is valid
        }

        await Promise.all([
          saveExpensesToSheet(googleConfig.spreadsheetId, expenses, wallets),
          saveRefData(googleConfig.spreadsheetId, categoryItems, memberItems),
          saveGoalsToSheet(googleConfig.spreadsheetId, goals),
          saveBudgetsToSheet(googleConfig.spreadsheetId, budgets)
        ]);

        setSyncStatus('synced');
        setLastSynced(new Date());
        setSyncError(null);
        retryCountRef.current = 0; // Reset retry count on success

      } catch (e: any) {
        console.error("Auto-save failed", e);

        // Handle specific error types
        if (e.status === 401 || e.status === 403 || e.message?.includes('authenticated')) {
          setSyncError('Authentication expired. Please reconnect.');
          setSyncStatus('error');
          setIsGoogleConnected(false);
          retryCountRef.current = 0;
        } else if (e.status === 404) {
          setSyncError('Spreadsheet not found. Check your configuration.');
          setSyncStatus('error');
        } else if (e.message?.includes('network') || e.message?.includes('fetch')) {
          setSyncError('Network error. Will retry automatically.');
          setSyncStatus('error');

          // Retry logic for network errors
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            console.log(`Retrying save (attempt ${retryCountRef.current}/${MAX_RETRIES})...`);

            setTimeout(() => {
              isSavingRef.current = false;
              // Trigger a re-save by updating a dummy state
              setLastSynced(new Date());
            }, 3000 * retryCountRef.current); // Exponential backoff
          } else {
            setSyncError('Failed after multiple retries. Please check your connection.');
          }
        } else {
          setSyncError(e.message || 'Unknown error occurred');
          setSyncStatus('error');
        }
      } finally {
        isSavingRef.current = false;
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [expenses, wallets, goals, budgets, categoryItems, memberItems, recurringExpenses, isGoogleConnected, googleConfig]);

  // 2. Enhanced Background Polling (Every 30s) with Health Checks
  useEffect(() => {
    if (!isGoogleConnected || !googleConfig?.spreadsheetId) {
      // Clean up any existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const performPoll = async () => {
      // Don't pull if we are currently trying to push local changes to avoid conflicts
      if (syncStatusRef.current === 'saving' || isSavingRef.current) {
        console.log('Skipping poll: save in progress');
        return;
      }

      try {
        // Health check: verify we're still authenticated
        if (!window.gapi?.client?.getToken()) {
          console.warn('Poll skipped: not authenticated');
          setIsGoogleConnected(false);
          setSyncStatus('error');
          setSyncError('Session expired. Please reconnect.');
          return;
        }

        // Proactively refresh token if needed (within 5 minutes of expiry)
        try {
          const tokenValid = await ensureValidToken();
          if (!tokenValid) {
            await trySilentAuth();
          }
        } catch (tokenError: any) {
          // Only log unexpected errors
          if (!tokenError?.expected) {
            console.warn('Token refresh attempt failed, will try API call anyway:', tokenError);
          }
        }

        setSyncStatus('fetching');

        const { expenses: sheetExpenses, wallets: sheetWallets } = await fetchExpensesFromSheet(googleConfig.spreadsheetId);
        const refData = await fetchRefData(googleConfig.spreadsheetId);

        // Double check status after fetch to ensure user didn't start editing during the fetch
        if (syncStatusRef.current === 'saving' || isSavingRef.current) {
          console.log("User started editing during poll, discarding remote data to prevent overwrite.");
          setSyncStatus('synced');
          return;
        }

        isRemoteUpdate.current = true;

        if (sheetExpenses) setExpenses(sheetExpenses);
        if (sheetWallets && sheetWallets.length > 0) setWallets(sheetWallets);
        if (refData.categories) setCategoryItems(refData.categories);
        if (refData.members) setMemberItems(refData.members);
        if (refData.goals) setGoals(refData.goals);
        if (refData.budgets) setBudgets(refData.budgets);

        setLastSynced(new Date());
        setSyncStatus('synced');
        setSyncError(null);

        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 500);

      } catch (e: any) {
        console.error("Poll failed", e);

        // Handle auth errors
        if (e.status === 401 || e.status === 403) {
          try {
            await trySilentAuth();
            console.log("✓ Silent refresh successful during poll recovery");
            // Do not disconnect. Next poll will pick up the new token.
          } catch (refreshErr: any) {
            // Only log and disconnect for unexpected errors
            if (!refreshErr?.expected) {
              console.warn("Silent refresh failed during poll:", refreshErr);
            }
            setIsGoogleConnected(false);
            setSyncStatus('error');
            setSyncError('Authentication expired. Please reconnect.');

            // Clear the interval on auth failure
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } else {
          // Don't set error status for transient poll failures
          // Just log and continue polling
          console.warn('Poll failed, will retry on next interval:', e.message);
        }
      }
    };

    // Perform initial poll
    performPoll();

    // Set up interval
    pollIntervalRef.current = setInterval(performPoll, 30000); // 30s

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isGoogleConnected, googleConfig]);

  // 3. Periodic Token Refresh Check (Every 4 minutes)
  // This ensures tokens are refreshed proactively even when user is idle
  useEffect(() => {
    if (!isGoogleConnected) {
      // Clean up any existing interval
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
      return;
    }

    const checkAndRefreshToken = async () => {
      try {
        const tokenValid = await ensureValidToken();
        if (!tokenValid) {
          console.log('Token check: No valid token found');
          // Don't disconnect here - let the next API call handle it
        }
      } catch (error) {
        console.warn('Periodic token refresh check failed:', error);
        // Don't disconnect - this is just a proactive check
      }
    };

    // Perform initial check
    checkAndRefreshToken();

    // Set up interval - check every 4 minutes (240000ms)
    // This is less than the 5-minute threshold, ensuring we catch tokens before they expire
    tokenRefreshIntervalRef.current = setInterval(checkAndRefreshToken, 240000);

    return () => {
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
    };
  }, [isGoogleConnected]);


  const handleSetupComplete = async () => {
    setNeedsSetup(false);
    refreshLocalData();

    // Check if user configured manual google connection in setup
    const config = getGoogleConfig();
    const syncEnabled = getGoogleSyncEnabled();

    if (config && config.clientId && syncEnabled) {
      setGoogleConfig(config);

      try {
        await initializeGapiClient(config);

        // Check if we have a saved token from the setup wizard
        const savedToken = getGoogleToken();
        if (savedToken && window.gapi?.client) {
          window.gapi.client.setToken(savedToken);

          try {
            // Try to fetch data to verify connection
            const { expenses: sheetExpenses, wallets: sheetWallets } = await fetchExpensesFromSheet(config.spreadsheetId);

            if (sheetExpenses) {
              setExpenses(sheetExpenses);
              saveExpenses(sheetExpenses);
            }
            if (sheetWallets) {
              setWallets(sheetWallets);
              saveWallets(sheetWallets);
            }

            await syncRefData(config.spreadsheetId);

            // Successfully connected!
            setIsGoogleConnected(true);
            setSyncStatus('synced');
            setLastSynced(new Date());

            // Load user profile
            const profile = await getUserProfile();
            if (profile) setUserProfile(profile);

          } catch (fetchError) {
            console.error("Failed to fetch data after setup:", fetchError);
            // Token might be expired, user will need to reconnect
            setIsGoogleConnected(false);
            setSyncStatus('offline');
          }
        } else {
          // No token, user will need to manually connect
          setIsGoogleConnected(false);
          setSyncStatus('offline');
        }
      } catch (err) {
        console.error("GAPI Init Error after setup", err);
        setSyncStatus('offline');
      }
    }
  };

  // Fetch user profile if connected but missing (e.g. on reload)
  useEffect(() => {
    const loadProfile = async () => {
      if (isGoogleConnected && !userProfile) {
        const profile = await getUserProfile();
        if (profile) setUserProfile(profile);
      }
    };
    loadProfile();
  }, [isGoogleConnected, userProfile]);

  const handleSkipSetup = () => {
    const demoData = generateFullDemoData();
    setExpenses(demoData.expenses);
    setRecurringExpenses([]);
    setGoals(demoData.goals);
    setBudgets([]);
    setWallets(demoData.wallets);

    saveExpenses(demoData.expenses);
    saveRecurringExpenses([]);
    saveGoals(demoData.goals);
    saveBudgets([]);
    saveWallets(demoData.wallets);
    saveCategories(DEFAULT_CATEGORY_ITEMS);
    saveMembers(DEFAULT_MEMBER_ITEMS);

    setSetupComplete(true);
    setNeedsSetup(false);
    refreshLocalData();
  };

  // Derived Currency Config Object
  const currencyConfig: CurrencyConfig = {
    code: currencyCode,
    symbol: CURRENCY_SYMBOLS[currencyCode],
    rate: 1
  };

  // Handlers
  const addExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: Date.now().toString(),
      walletId: newExpenseData.walletId || 'main',
      description: newExpenseData.description || '' // Ensure description is always a string
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? {
      ...updatedExpense,
      description: updatedExpense.description || '' // Ensure description is always a string
    } : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addRecurringExpense = (newRuleData: Omit<RecurringExpense, 'id'>) => {
    const newRule: RecurringExpense = {
      ...newRuleData,
      id: Date.now().toString(),
      walletId: newRuleData.walletId || 'main'
    };
    const processed = processRecurringExpenses(expenses, [...recurringExpenses, newRule]);
    setExpenses(processed.expenses);
    setRecurringExpenses(processed.recurring);
  };

  const deleteRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const addGoal = (newGoalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...newGoalData,
      id: Date.now().toString()
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (updatedGoal: SavingsGoal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addBudget = (newBudget: Budget) => {
    setBudgets(prev => [...prev, newBudget]);
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const updateBudget = (updatedBudget: Budget) => {
    setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b));
  };

  const addWallet = (newWalletData: Omit<Wallet, 'id'>) => {
    const newWalletId = Math.random().toString(36).substr(2, 9);

    const newWallet: Wallet = {
      ...newWalletData,
      id: newWalletId,
      balance: 0
    };

    setWallets(prev => [...prev, newWallet]);

    if (newWalletData.balance > 0) {
      addExpense({
        date: new Date().toISOString().split('T')[0],
        description: 'Initial Deposit',
        category: 'Other',
        amount: newWalletData.balance,
        member: memberItems[0]?.name || 'Admin',
        type: TransactionType.INCOME,
        walletId: newWalletId
      });
    }
  };

  const updateWallet = (updatedWallet: Wallet) => {
    setWallets(prev => prev.map(w => w.id === updatedWallet.id ? updatedWallet : w));
  };

  const deleteWallet = (id: string) => {
    setWallets(prev => prev.filter(w => w.id !== id));
  };

  const handleTransfer = (data: { sourceId: string; destId: string; amount: number; date: string; description: string }) => {
    addExpense({
      date: data.date,
      description: data.description,
      amount: data.amount,
      category: 'Transfer',
      member: memberItems[0]?.name || 'Admin',
      type: TransactionType.TRANSFER,
      walletId: data.sourceId,
      transferToWalletId: data.destId
    });

    const sourceGoal = goals.find(g => g.id === data.sourceId);
    if (sourceGoal) {
      updateGoal({ ...sourceGoal, currentAmount: sourceGoal.currentAmount - data.amount });
    }

    const destGoal = goals.find(g => g.id === data.destId);
    if (destGoal) {
      updateGoal({ ...destGoal, currentAmount: destGoal.currentAmount + data.amount });
    }
  };

  const handleUpdateCategoryItems = async (items: CategoryItem[]) => {
    setCategoryItems(items);
    saveCategories(items);

    if (isGoogleConnected && isSyncEnabled && googleConfig.spreadsheetId) {
      await saveRefData(googleConfig.spreadsheetId, items, memberItems);
    }
  };

  const handleUpdateMembers = async (items: MemberItem[]) => {
    setMemberItems(items);
    saveMembers(items);

    if (isGoogleConnected && isSyncEnabled && googleConfig.spreadsheetId) {
      await saveRefData(googleConfig.spreadsheetId, categoryItems, items);
    }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const updatedExpenses = expenses.map(e =>
      e.category === oldName ? { ...e, category: newName } : e
    );
    setExpenses(updatedExpenses);
    const updatedRecurring = recurringExpenses.map(r =>
      r.category === oldName ? { ...r, category: newName } : r
    );
    setRecurringExpenses(updatedRecurring);
    setBudgets(prev => prev.map(b => b.category === oldName ? { ...b, category: newName } : b));
  };

  const handleConnectGoogle = async (config: GoogleConfig, refOverrides?: { categories: CategoryItem[], members: MemberItem[] }) => {
    console.log('🔵 [DEBUG] handleConnectGoogle called');
    setGoogleConfig(config);
    saveGoogleConfig(config);

    // If overrides provided, update state immediately to reflect what we are about to save
    if (refOverrides) {
      setCategoryItems(refOverrides.categories);
      setMemberItems(refOverrides.members);
      saveCategories(refOverrides.categories);
      saveMembers(refOverrides.members);
    }

    if (!config.clientId || !config.apiKey || !config.spreadsheetId) {
      setIsGoogleConnected(false);
      saveGoogleSyncEnabled(false);
      setSyncError('Missing configuration. Please provide all required fields.');
      setSyncStatus('error');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncStatus('fetching');
      setSyncError(null);

      await initializeGapiClient(config);

      // Check if we already have a token to avoid opening popup unnecessarily
      const savedToken = getGoogleToken();
      console.log('🟡 [DEBUG] handleConnectGoogle: Has saved token?', savedToken ? 'Yes' : 'No');
      if (!savedToken) {
        console.log('🔵 [DEBUG] handleConnectGoogle: Calling handleAuthClick (popup expected)');
        await handleAuthClick(config.clientId);
      }

      isRemoteUpdate.current = true;
      let sheetData;

      try {
        sheetData = await fetchExpensesFromSheet(config.spreadsheetId);
      } catch (err: any) {
        // If auth failed and we skipped auth (because we had a token), try authenticating now
        if (savedToken && (err.status === 401 || err.status === 403 || err.message?.includes('authenticated'))) {
          console.log("Token expired or invalid, triggering re-auth...");
          await handleAuthClick(config.clientId);
          // Retry fetch
          sheetData = await fetchExpensesFromSheet(config.spreadsheetId);
        } else {
          // Re-throw if it's not an auth error or if we shouldn't retry
          throw err;
        }
      }

      const { expenses: sheetExpenses, wallets: sheetWallets } = sheetData;

      const isSheetEmpty = sheetExpenses.length === 0;

      if (!isSheetEmpty) {
        setExpenses(sheetExpenses);
        if (sheetWallets && sheetWallets.length > 0) {
          setWallets(sheetWallets);
        }

        // CRITICAL: If we have overrides (user just saved settings), PUSH them to sheet.
        // Otherwise, PULL from sheet (normal sync).
        if (refOverrides) {
          await saveRefData(config.spreadsheetId, refOverrides.categories, refOverrides.members);
        } else {
          await syncRefData(config.spreadsheetId);
        }

      } else {
        if (expenses.length > 0 || wallets.length > 1) {
          await saveExpensesToSheet(config.spreadsheetId, expenses, wallets);
          // Use overrides if available, otherwise current state
          const catsToSave = refOverrides?.categories || categoryItems;
          const memsToSave = refOverrides?.members || memberItems;
          await saveRefData(config.spreadsheetId, catsToSave, memsToSave);

          await saveGoalsToSheet(config.spreadsheetId, goals);
          await saveBudgetsToSheet(config.spreadsheetId, budgets);
        }
      }

      const profile = await getUserProfile();
      if (profile) setUserProfile(profile);

      setIsGoogleConnected(true);
      saveGoogleSyncEnabled(true);
      setSyncStatus('synced');
      setLastSynced(new Date());
      setSyncError(null);
      setTimeout(() => isRemoteUpdate.current = false, 500);
    } catch (error: any) {
      console.error("[OAuth] Connection error:", error);
      console.error("[OAuth] Error details:", {
        message: error.message,
        status: error.status,
        result: error.result,
        originalError: error.originalError
      });

      let errorMessage = 'Failed to connect to Google Sheets.';
      let errorTitle = 'Connection Failed';

      // Handle popup blocked errors
      if (error.message === 'SAFARI_POPUP_BLOCKED') {
        errorTitle = 'Popup Blocked by Safari';
        errorMessage = 'Safari blocked the Google Sign-In popup.\n\n' +
          'To fix this:\n' +
          '1. Look for the popup blocker icon in Safari\'s address bar (usually on the left)\n' +
          '2. Click it and select "Always Allow Pop-ups on This Website"\n' +
          '3. Try connecting again\n\n' +
          'Alternatively, go to Safari → Settings → Websites → Pop-up Windows and allow popups for this site.';
      } else if (error.message === 'POPUP_BLOCKED') {
        errorTitle = 'Popup Blocked';
        errorMessage = 'Your browser blocked the Google Sign-In popup.\n\n' +
          'Please allow popups for this site and try again.';
      } else if (error.message?.includes('client_id') || error.message?.includes('apiKey')) {
        errorMessage = 'Invalid API credentials. Please check your Client ID and API Key.';
      } else if (error.message?.includes('idpiframe_initialization_failed')) {
        errorTitle = 'OAuth Configuration Error';
        errorMessage = `Google OAuth initialization failed.\n\n` +
          `Current origin: ${window.location.origin}\n\n` +
          `Please ensure this origin is added to "Authorized JavaScript origins" in Google Cloud Console:\n` +
          `https://console.cloud.google.com/apis/credentials\n\n` +
          `Error: ${error.message}`;
      } else if (error.status === 404) {
        errorMessage = 'Spreadsheet not found. Please check the Spreadsheet ID.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. Please check spreadsheet permissions.';
      } else if (error.message?.includes('not loaded')) {
        errorMessage = 'Google API failed to load. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSyncError(errorMessage);
      setSyncStatus('error');

      showDialog(
        errorTitle,
        errorMessage,
        'error',
        undefined
      );

      setIsGoogleConnected(false);
      saveGoogleSyncEnabled(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    showDialog(
      'Confirm Sign Out',
      'Are you sure you want to sign out?\n\nAll your data will be synced to Google Sheets and then cleared from this device. You will be redirected to the landing page.',
      'warning',
      async () => {
        try {
          // Wait for any pending saves to complete
          if (syncStatus === 'saving' || isSavingRef.current) {
            setSyncStatus('saving');
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait up to 3s
          }

          // Perform one final sync to ensure everything is saved
          if (isGoogleConnected && googleConfig?.spreadsheetId) {
            setSyncStatus('saving');

            try {
              await Promise.all([
                saveExpensesToSheet(googleConfig.spreadsheetId, expenses, wallets),
                saveRefData(googleConfig.spreadsheetId, categoryItems, memberItems),
                saveGoalsToSheet(googleConfig.spreadsheetId, goals),
                saveBudgetsToSheet(googleConfig.spreadsheetId, budgets)
              ]);

              console.log("Final sync completed successfully");
            } catch (syncError) {
              console.error("Final sync failed:", syncError);
              // Continue with sign out even if sync fails
            }
          }

          // Sign out from Google
          handleSignOut();

          // Clear all state
          setIsGoogleConnected(false);
          saveGoogleSyncEnabled(false);
          setSyncStatus('offline');
          setSyncError(null);
          setUserProfile(null);

          // Clean up polling interval
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Clear all local data
          localStorage.clear();

          // Reset to landing page by clearing setup flag
          setNeedsSetup(false);
          setHasStarted(false);

          // Reload to show landing page
          window.location.reload();

        } catch (error) {
          console.error("Error during sign out:", error);
          // Force sign out anyway
          handleSignOut();
          localStorage.clear();
          window.location.reload();
        }
      },
      true  // Show cancel button
    );
  };

  const handleManualSync = async () => {
    if (!googleConfig) {
      setIsSettingsOpen(true);
      return;
    }

    setIsSyncing(true);
    setSyncStatus('fetching');
    try {
      if (!isGoogleConnected) {
        try {
          await initializeGapiClient(googleConfig);
          await handleAuthClick(googleConfig.clientId);
          setIsGoogleConnected(true);
          saveGoogleSyncEnabled(true);
        } catch (e) {
          console.error("Re-auth failed", e);
          setIsSyncing(false);
          setSyncStatus('error');
          return;
        }
      }

      isRemoteUpdate.current = true;
      const { expenses: sheetExpenses, wallets: sheetWallets } = await fetchExpensesFromSheet(googleConfig.spreadsheetId);
      if (sheetExpenses) {
        setExpenses(sheetExpenses);
      }
      if (sheetWallets) {
        setWallets(sheetWallets);
      }
      await syncRefData(googleConfig.spreadsheetId);
      setSyncStatus('synced');
      setLastSynced(new Date());

      if (!userProfile) {
        const profile = await getUserProfile();
        if (profile) setUserProfile(profile);
      }

      setTimeout(() => isRemoteUpdate.current = false, 500);

    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      try {
        await handleAuthClick(googleConfig?.clientId);
        setIsGoogleConnected(true);
      } catch (authErr) {
        setIsGoogleConnected(false);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = () => {
    const demoData = generateFullDemoData();
    setExpenses(demoData.expenses);
    setRecurringExpenses([]);
    setGoals(demoData.goals);
    setBudgets([]);
    setWallets(demoData.wallets);
    saveCategories(DEFAULT_CATEGORY_ITEMS);
    saveMembers(DEFAULT_MEMBER_ITEMS);

    handleDisconnectGoogle();
    refreshLocalData();
  };

  const handleClearData = () => {
    setExpenses([]);
    setRecurringExpenses([]);
    setGoals([]);
    setBudgets([]);
    setWallets([{ id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 }]);
    handleDisconnectGoogle();
  };

  const handleStartFresh = () => {
    // Clear all local storage
    localStorage.clear();

    // Reload the page to restart from landing page
    window.location.reload();
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  if (needsSetup) {
    if (!hasStarted) {
      return (
        <Routes>
          <Route path="/" element={
            <LandingPage
              onGetStarted={() => setHasStarted(true)}
            />
          } />
          <Route path="/about" element={<AboutPage onBack={() => navigate('/')} />} />
          <Route path="/privacy" element={<PrivacyPage onBack={() => navigate('/')} />} />
          <Route path="/terms" element={<TermsPage onBack={() => navigate('/')} />} />
          <Route path="/cookies" element={<CookiesPage onBack={() => navigate('/')} />} />
          <Route path="/contact" element={<ContactPage onBack={() => navigate('/')} />} />
        </Routes>
      );
    }
    return <SetupWizard onComplete={handleSetupComplete} onSkip={handleSkipSetup} onBack={() => setHasStarted(false)} />;
  }

  // Helper for Status Badge
  const getStatusBadge = () => {
    if (!isGoogleConnected) return null;

    if (syncStatus === 'saving') {
      return (
        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
          <RefreshCw size={10} className="animate-spin" /> {t('sync.saving')}
        </span>
      );
    }
    if (syncStatus === 'fetching') {
      return (
        <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
          <Loader2 size={10} className="animate-spin" /> {t('sync.syncing')}
        </span>
      );
    }
    if (syncStatus === 'error') {
      return (
        <span
          className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100 cursor-help"
          title={syncError || 'Sync error occurred'}
        >
          <AlertTriangle size={10} /> {t('sync.syncError')}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100" title={`Last synced: ${lastSynced?.toLocaleTimeString()}`}>
        <CheckCircle2 size={10} /> {t('sync.live')}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConnect={handleConnectGoogle}
        onDisconnect={handleDisconnectGoogle}
        isConnected={isGoogleConnected}
        onCurrencyChange={setCurrencyCode}
        onResetData={handleResetData}
        onClearData={handleClearData}
        categoryItems={categoryItems}
        members={memberItems}
        onUpdateCategoryItems={handleUpdateCategoryItems}
        onUpdateMembers={handleUpdateMembers}
        onRenameCategory={handleRenameCategory}
        userProfile={userProfile}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}

      <Dialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        showCancel={dialogState.showCancel}
      />

      {/* Blocking Reconnect Modal - Forces user to reconnect when sync is paused */}
      <ReconnectModal
        isOpen={!isGoogleConnected && isSyncEnabled && !needsSetup}
        onReconnect={handleManualSync}
        onStartFresh={handleStartFresh}
        errorMessage={syncError || 'Your session has expired. Please reconnect to continue using the app.'}
        isReconnecting={isSyncing}
      />

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside className={`
        hidden lg:flex
        lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200
      `}>
        <div className="h-full flex flex-col">
          <div className="py-6 px-6 flex items-center justify-center border-b border-gray-100">
            <img src="/images/simple_famfin.png" alt="SimpleFamFin Logo" className="w-48 h-auto object-contain" />
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => { setCurrentView(View.HOME); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentView === View.HOME
                ? 'bg-green-50 text-green-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <HomeIcon size={20} />
              {t('navigation.home')}
            </button>
            <button
              onClick={() => { setCurrentView(View.DASHBOARD); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentView === View.DASHBOARD
                ? 'bg-green-50 text-green-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <LayoutDashboard size={20} />
              {t('navigation.dashboard')}
            </button>
            <button
              onClick={() => { setCurrentView(View.EXPENSES); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentView === View.EXPENSES
                ? 'bg-green-50 text-green-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Table2 size={20} />
              {t('navigation.transactions')}
            </button>
            <button
              onClick={() => { setCurrentView(View.GOALS); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentView === View.GOALS
                ? 'bg-green-50 text-green-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Target size={20} />
              {t('navigation.goals')}
            </button>
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-2">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all"
            >
              <HelpCircle size={20} />
              {t('navigation.help')}
            </button>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all"
            >
              <MessageSquare size={20} />
              {t('navigation.feedback')}
            </button>
            <button
              onClick={() => { setCurrentView(View.SETTINGS); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentView === View.SETTINGS
                ? 'bg-green-50 text-green-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Settings size={20} />
              {t('navigation.settings')}
            </button>

            {isGoogleConnected ? (
              <>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing || syncStatus === 'saving'}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
                >
                  <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? t('sync.refreshing') : t('sync.refreshData')}
                </button>
                <div className="text-[10px] text-center text-gray-400">
                  {syncStatus === 'saving' ? (
                    <span className="text-amber-600 font-medium animate-pulse">{t('sync.autoSaving')}</span>
                  ) : syncStatus === 'error' && syncError ? (
                    <span className="text-red-600 font-medium">{syncError}</span>
                  ) : (
                    lastSynced ? `Synced: ${lastSynced.toLocaleTimeString()}` : ''
                  )}
                </div>
                <button
                  onClick={handleDisconnectGoogle}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all mt-2 border border-transparent hover:border-red-100"
                >
                  <LogOut size={20} />
                  {t('header.signOut')}
                </button>
              </>
            ) : (
              <button
                onClick={isSyncEnabled ? handleManualSync : () => setIsSettingsOpen(true)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all mt-2 ${isSyncEnabled ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <LogIn size={20} />
                {isSyncEnabled ? t('sync.reconnectNow') : t('sync.connectCloud')}
              </button>
            )}

          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative pb-16 lg:pb-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          {/* Mobile: Logo only on left */}
          <img
            src="/images/simple_famfin.png"
            alt="SimpleFamFin"
            className="lg:hidden h-8 w-auto object-contain"
          />

          {/* Desktop: Text title only */}
          <h2 className="hidden lg:block text-lg font-semibold text-gray-800">
            {currentView === View.HOME ? t('navigation.home') : currentView === View.DASHBOARD ? t('header.walletOverview') : currentView === View.EXPENSES ? t('navigation.transactions') : currentView === View.SETTINGS ? t('navigation.settings') : t('header.financialGoals')}
          </h2>
          <div className="hidden lg:flex items-center gap-4 relative">
            {getStatusBadge()}

            {/* <LanguageSwitcher /> */}

            <div className="relative">
              <button
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                className="flex flex-col items-end px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              >
                <span className="text-xs text-gray-500">{t('header.currency')}</span>
                <span className="text-sm font-semibold text-gray-800">{currencyCode} ({CURRENCY_SYMBOLS[currencyCode]})</span>
              </button>

              {/* Currency Dropdown */}
              {isCurrencyMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsCurrencyMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-96 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-600 px-2">{t('header.selectCurrency')}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {AVAILABLE_CURRENCIES.map((currency) => (
                        <button
                          key={currency}
                          onClick={() => {
                            setCurrencyCode(currency);
                            saveCurrencyCode(currency);
                            setIsCurrencyMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${currencyCode === currency
                            ? 'bg-green-50 text-green-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{CURRENCY_SYMBOLS[currency]}</span>
                            <span>{currency}</span>
                          </span>
                          {currencyCode === currency && (
                            <CheckCircle2 size={16} className="text-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isGoogleConnected && (
              <button
                onClick={isSyncEnabled ? handleManualSync : () => setIsSettingsOpen(true)}
                className={`hidden xl:flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg shadow-sm transition-all ${isSyncEnabled
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {isSyncEnabled ? <RefreshCw size={14} /> : <CloudLightning size={14} />}
                {isSyncEnabled ? t('header.reconnect') : t('header.connect')}
              </button>
            )}

            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="relative focus:outline-none transition-transform active:scale-95"
            >
              {userProfile?.picture ? (
                <img
                  src={userProfile.picture}
                  alt={userProfile.name}
                  className={`w-10 h-10 rounded-full border-2 shadow-lg object-cover ${isProfileMenuOpen ? 'border-green-500 ring-2 ring-green-100' : 'border-white'}`}
                />
              ) : (
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 border-2 shadow-lg flex items-center justify-center ${isProfileMenuOpen ? 'border-green-500' : 'border-white'}`}>
                  <CircleUserRound className="text-white" size={24} strokeWidth={2} />
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {userProfile ? (
                  <div className="p-5 border-b border-gray-50 bg-gradient-to-b from-gray-50 to-white">
                    <div className="flex flex-col items-center text-center">
                      {userProfile.picture ? (
                        <img src={userProfile.picture} alt={userProfile.name} className="w-16 h-16 rounded-full border-4 border-white shadow-md mb-3" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-2xl mb-3 border-4 border-white shadow-md">
                          {userProfile.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900 text-lg">{userProfile.name}</h3>
                      <p className="text-sm text-gray-500">{userProfile.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center border-b border-gray-50">
                    <p className="text-sm text-gray-500 italic">{t('header.guestUser')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('header.signInToSync')}</p>
                  </div>
                )}

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => { setIsSettingsOpen(true); setIsProfileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings size={18} className="text-gray-400" />
                    {t('navigation.settings')}
                  </button>

                  {isGoogleConnected && (
                    <button
                      onClick={() => { handleDisconnectGoogle(); setIsProfileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={18} />
                      {t('header.signOut')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {!isGoogleConnected && !isSyncEnabled && (
          <div className="border-b px-6 py-2 flex items-center justify-between shrink-0 bg-gray-50 border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <AlertTriangle size={14} className="text-gray-400" />
              <span className="font-semibold">{t('sync.localStorageMode')}</span>
              <span>{t('sync.dataSavedLocally')}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === View.HOME ? (
              <Home
                expenses={expenses}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onAddRecurring={addRecurringExpense}
                currencyConfig={currencyConfig}
                categoryItems={categoryItems}
                members={memberList}
                categoryColors={categoryColors}
                wallets={computedWallets}
                onHelpClick={() => setIsHelpOpen(true)}
              />
            ) : currentView === View.DASHBOARD ? (
              <Dashboard
                expenses={expenses}
                currencyConfig={currencyConfig}
                categoryColors={categoryColors}
                memberColors={memberColors}
                budgets={budgets}
                onAddBudget={addBudget}
                onDeleteBudget={deleteBudget}
                onUpdateBudget={updateBudget}
                categoryItems={categoryItems}
                wallets={computedWallets}
                goals={goals}
              />
            ) : currentView === View.EXPENSES ? (
              <ExpenseTable
                expenses={expenses}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                recurringExpenses={recurringExpenses}
                onAddRecurring={addRecurringExpense}
                onDeleteRecurring={deleteRecurringExpense}
                currencyConfig={currencyConfig}
                categoryItems={categoryItems}
                members={memberList}
                categoryColors={categoryColors}
                wallets={computedWallets}
                goals={goals}
              />
            ) : currentView === View.SETTINGS ? (
              <div className="h-full">
                {/* Settings Modal rendered as a page */}
                <SettingsModal
                  isOpen={true}
                  asPage={true}
                  onClose={() => setCurrentView(View.HOME)}
                  onConnect={handleConnectGoogle}
                  onDisconnect={handleDisconnectGoogle}
                  isConnected={isGoogleConnected}
                  onCurrencyChange={setCurrencyCode}
                  onResetData={handleResetData}
                  onClearData={handleClearData}
                  categoryItems={categoryItems}
                  members={memberItems}
                  onUpdateCategoryItems={handleUpdateCategoryItems}
                  onUpdateMembers={handleUpdateMembers}
                  onRenameCategory={handleRenameCategory}
                  userProfile={userProfile}
                />
              </div>
            ) : (
              <GoalsView
                goals={goals}
                wallets={computedWallets}
                onAddGoal={addGoal}
                onUpdateGoal={updateGoal}
                onDeleteGoal={deleteGoal}
                onAddWallet={addWallet}
                onUpdateWallet={updateWallet}
                onDeleteWallet={deleteWallet}
                onTransfer={handleTransfer}
                currencyConfig={currencyConfig}
                onAddExpense={addExpense}
                categoryItems={categoryItems}
                members={memberList}
              />
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            <button
              onClick={() => setCurrentView(View.HOME)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${currentView === View.HOME
                ? 'text-green-600'
                : 'text-gray-500'
                }`}
            >
              <HomeIcon size={20} className={currentView === View.HOME ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[9px] font-medium truncate max-w-full px-1">{t('navigation.home')}</span>
            </button>

            <button
              onClick={() => setCurrentView(View.DASHBOARD)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${currentView === View.DASHBOARD
                ? 'text-green-600'
                : 'text-gray-500'
                }`}
            >
              <LayoutDashboard size={20} className={currentView === View.DASHBOARD ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[9px] font-medium truncate max-w-full px-1">{t('navigation.dashboard')}</span>
            </button>

            <button
              onClick={() => setCurrentView(View.EXPENSES)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${currentView === View.EXPENSES
                ? 'text-green-600'
                : 'text-gray-500'
                }`}
            >
              <Table2 size={20} className={currentView === View.EXPENSES ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[9px] font-medium truncate max-w-full px-1">{t('navigation.transactions')}</span>
            </button>

            <button
              onClick={() => setCurrentView(View.GOALS)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${currentView === View.GOALS
                ? 'text-green-600'
                : 'text-gray-500'
                }`}
            >
              <Target size={20} className={currentView === View.GOALS ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[9px] font-medium truncate max-w-full px-1">{t('navigation.goals')}</span>
            </button>

            <button
              onClick={() => setCurrentView(View.SETTINGS)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${currentView === View.SETTINGS
                ? 'text-green-600'
                : 'text-gray-500'
                }`}
            >
              <Settings size={20} className={currentView === View.SETTINGS ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[9px] font-medium truncate max-w-full px-1">{t('navigation.settings')}</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
};

export default App;
