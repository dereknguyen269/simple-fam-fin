
import { Expense, RecurringExpense, GoogleConfig, CurrencyCode, CategoryItem, TransactionType, MemberItem, SavingsGoal, Wallet, Budget } from '../types';
import { INITIAL_RECURRING_EXPENSES, INITIAL_GOALS, DEFAULT_CATEGORY_ITEMS, DEFAULT_CATEGORY_COLORS, DEFAULT_MEMBER_ITEMS } from '../constants';
import { generateDemoData } from '../utils';

const STORAGE_KEY = 'family_finance_data';
const RECURRING_STORAGE_KEY = 'family_finance_recurring';
const GOALS_KEY = 'family_finance_goals';
const BUDGETS_KEY = 'family_finance_budgets';
const GOOGLE_CONFIG_KEY = 'family_finance_google_config';
const CURRENCY_KEY = 'family_finance_currency';
const GOOGLE_SYNC_ENABLED_KEY = 'family_finance_google_sync_enabled';
const MEMBERS_KEY = 'family_finance_members';
const CATEGORY_ITEMS_KEY = 'family_finance_category_items';
const WALLETS_KEY = 'family_finance_wallets';
const SETUP_COMPLETE_KEY = 'family_finance_setup_complete';
const GOOGLE_TOKEN_KEY = 'family_finance_google_token';
const GOOGLE_TOKEN_EXPIRY_KEY = 'family_finance_google_token_expiry';

// Legacy keys for migration
const LEGACY_CATEGORIES_KEY = 'family_finance_categories';
const LEGACY_COLORS_KEY = 'family_finance_category_colors';

export const getExpenses = (): Expense[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const expenses = JSON.parse(data);
    // Migration: Add walletId if missing
    return expenses.map((e: any) => ({ ...e, walletId: e.walletId || 'main' }));
  } catch (e) {
    console.error("Failed to load expenses", e);
    return [];
  }
};

export const saveExpenses = (expenses: Expense[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error("Failed to save expenses", e);
  }
};

export const getRecurringExpenses = (): RecurringExpense[] => {
  try {
    const data = localStorage.getItem(RECURRING_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_RECURRING_EXPENSES;
  } catch (e) {
    console.error("Failed to load recurring expenses", e);
    return [];
  }
};

export const saveRecurringExpenses = (recurring: RecurringExpense[]): void => {
  try {
    localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(recurring));
  } catch (e) {
    console.error("Failed to save recurring expenses", e);
  }
};

export const getGoals = (): SavingsGoal[] => {
  try {
    const data = localStorage.getItem(GOALS_KEY);
    return data ? JSON.parse(data) : INITIAL_GOALS;
  } catch (e) {
    return INITIAL_GOALS;
  }
};

export const saveGoals = (goals: SavingsGoal[]): void => {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (e) {
    console.error("Failed to save goals", e);
  }
};

export const getBudgets = (): Budget[] => {
  try {
    const data = localStorage.getItem(BUDGETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveBudgets = (budgets: Budget[]): void => {
  try {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  } catch (e) {
    console.error("Failed to save budgets", e);
  }
};

export const getGoogleConfig = (): GoogleConfig | null => {
  try {
    const data = localStorage.getItem(GOOGLE_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const saveGoogleConfig = (config: GoogleConfig): void => {
  localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(config));
};

export const getCurrencyCode = (): CurrencyCode => {
  try {
    const data = localStorage.getItem(CURRENCY_KEY);
    return (data as CurrencyCode) || 'USD';
  } catch (e) {
    return 'USD';
  }
};

export const saveCurrencyCode = (code: CurrencyCode): void => {
  localStorage.setItem(CURRENCY_KEY, code);
};

export const getGoogleSyncEnabled = (): boolean => {
  return localStorage.getItem(GOOGLE_SYNC_ENABLED_KEY) === 'true';
};

export const saveGoogleSyncEnabled = (enabled: boolean): void => {
  localStorage.setItem(GOOGLE_SYNC_ENABLED_KEY, String(enabled));
};

export const getMembers = (): MemberItem[] => {
  try {
    const data = localStorage.getItem(MEMBERS_KEY);
    if (!data) return DEFAULT_MEMBER_ITEMS;

    const parsed = JSON.parse(data);

    // Check if it's the old format (array of strings)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((name: string, index: number) => ({
        id: `migrated_mem_${index}`,
        name: name,
        color: DEFAULT_MEMBER_ITEMS[index % DEFAULT_MEMBER_ITEMS.length]?.color || '#888888'
      }));
    }

    return parsed;
  } catch (e) {
    return DEFAULT_MEMBER_ITEMS;
  }
};

export const saveMembers = (members: MemberItem[]): void => {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
};

// Helper to guess type for legacy migration
const guessType = (name: string): TransactionType => {
  const lower = name.toLowerCase();
  if (['salary', 'profit', 'investment', 'dividend', 'income', 'bonus'].includes(lower)) {
    return TransactionType.INCOME;
  }
  return TransactionType.EXPENSE;
};

export const getCategories = (): CategoryItem[] => {
  try {
    // 1. Try new structured storage
    const data = localStorage.getItem(CATEGORY_ITEMS_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // 2. Migration: Try legacy storage
    const legacyNames = localStorage.getItem(LEGACY_CATEGORIES_KEY);
    const legacyColors = localStorage.getItem(LEGACY_COLORS_KEY);

    if (legacyNames) {
      const names: string[] = JSON.parse(legacyNames);
      const colors: Record<string, string> = legacyColors ? JSON.parse(legacyColors) : DEFAULT_CATEGORY_COLORS;

      const migratedItems: CategoryItem[] = names.map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        type: guessType(name),
        color: colors[name] || '#888888'
      }));

      // Ensure at least one Income category if none guessed
      if (!migratedItems.some(i => i.type === TransactionType.INCOME)) {
        migratedItems.push({ id: 'def_inc', name: 'Other', type: TransactionType.INCOME, color: '#D4A5A5' });
      }

      return migratedItems;
    }

    // 3. Fallback to defaults
    return DEFAULT_CATEGORY_ITEMS;
  } catch (e) {
    return DEFAULT_CATEGORY_ITEMS;
  }
};

export const saveCategories = (categories: CategoryItem[]): void => {
  localStorage.setItem(CATEGORY_ITEMS_KEY, JSON.stringify(categories));
};

// Helpers for backward compatibility with UI that needs Maps
export const getCategoryColorsMap = (items: CategoryItem[]): Record<string, string> => {
  const map: Record<string, string> = {};
  items.forEach(i => map[i.name] = i.color);
  return map;
};

// --- WALLETS ---
export const getWallets = (): Wallet[] => {
  try {
    const data = localStorage.getItem(WALLETS_KEY);
    return data ? JSON.parse(data) : [{ id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 }];
  } catch (e) {
    return [{ id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 }];
  }
};

export const saveWallets = (wallets: Wallet[]): void => {
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
};

// --- SETUP STATUS ---
export const isSetupComplete = (): boolean => {
  return localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
};

export const setSetupComplete = (complete: boolean): void => {
  localStorage.setItem(SETUP_COMPLETE_KEY, String(complete));
};

// --- GOOGLE TOKEN PERSISTENCE ---
export const saveGoogleToken = (token: any): void => {
  try {
    if (token && token.access_token) {
      localStorage.setItem(GOOGLE_TOKEN_KEY, JSON.stringify(token));

      // Calculate expiry time (tokens typically expire in 1 hour)
      const expiryTime = Date.now() + (token.expires_in ? token.expires_in * 1000 : 3600000);
      localStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, String(expiryTime));

      console.log(`🟢 [DEBUG] Token saved. Expires in ${token.expires_in || 3600} seconds at ${new Date(expiryTime).toLocaleTimeString()}`);
    } else {
      console.log('🔴 [DEBUG] saveGoogleToken: Invalid token, not saving');
    }
  } catch (e) {
    console.error("Failed to save Google token", e);
  }
};

export const getGoogleToken = (): any | null => {
  try {
    const tokenData = localStorage.getItem(GOOGLE_TOKEN_KEY);
    const expiryData = localStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);

    console.log('🟡 [DEBUG] getGoogleToken: Token exists?', tokenData ? 'Yes' : 'No', '| Expiry exists?', expiryData ? 'Yes' : 'No');

    if (!tokenData || !expiryData) return null;

    // Check if token is expired
    const expiryTime = parseInt(expiryData);
    if (Date.now() >= expiryTime) {
      // Token expired, clear it
      console.log("Token expired, clearing...");
      clearGoogleToken();
      return null;
    }

    return JSON.parse(tokenData);
  } catch (e) {
    console.error("Failed to load Google token", e);
    return null;
  }
};

export const clearGoogleToken = (): void => {
  localStorage.removeItem(GOOGLE_TOKEN_KEY);
  localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
};

/**
 * Check if token needs refresh (within 5 minutes of expiry)
 * This allows proactive token refresh before it actually expires
 */
export const shouldRefreshToken = (): boolean => {
  try {
    const expiryData = localStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
    if (!expiryData) return false;

    const expiryTime = parseInt(expiryData);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Return true if token expires in less than 5 minutes
    return (expiryTime - now) < fiveMinutes;
  } catch (e) {
    return false;
  }
};

/**
 * Get time remaining until token expires (in seconds)
 */
export const getTokenTimeRemaining = (): number => {
  try {
    const expiryData = localStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
    if (!expiryData) return 0;

    const expiryTime = parseInt(expiryData);
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

    return remaining;
  } catch (e) {
    return 0;
  }
};

// --- AI CONFIGURATION ---
const AI_CONFIG_KEY = 'family_finance_ai_config';

export const getAIConfig = (): import('../types').AIConfig | null => {
  try {
    const data = localStorage.getItem(AI_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to load AI config", e);
    return null;
  }
};

export const saveAIConfig = (config: import('../types').AIConfig): void => {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save AI config", e);
  }
};

export const clearAIConfig = (): void => {
  localStorage.removeItem(AI_CONFIG_KEY);
};

