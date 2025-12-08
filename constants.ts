
import { Category, FamilyMember, RecurrenceFrequency, CurrencyCode, TransactionType, CategoryItem, MemberItem, SavingsGoal } from './types';

export const DEFAULT_MEMBERS = Object.values(FamilyMember);
export const FREQUENCIES = Object.values(RecurrenceFrequency);
export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Mobile Payment', 'Other'];

export const INITIAL_EXPENSES = [
  { id: '1', date: '2023-10-01', description: 'Grocery Run', category: Category.FOOD, amount: 120.50, member: FamilyMember.DAD, type: TransactionType.EXPENSE, paymentMethod: 'Credit Card', walletId: 'main' },
  { id: '2', date: '2023-10-02', description: 'Gas Station', category: Category.TRANSPORT, amount: 45.00, member: FamilyMember.MOM, type: TransactionType.EXPENSE, paymentMethod: 'Credit Card', walletId: 'main' },
];

export const INITIAL_RECURRING_EXPENSES: any[] = [];

export const INITIAL_GOALS: SavingsGoal[] = [];

// Base currency is USD. Rates are approximate.
export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.5,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83.3,
  VND: 25450,
  CNY: 7.24,
  KRW: 1380,
  BRL: 5.20,
  RUB: 91.0,
  TRY: 32.4,
  ZAR: 18.5,
  SGD: 1.35,
  HKD: 7.82,
  NZD: 1.65,
  CHF: 0.91,
  SEK: 10.9,
  NOK: 11.0,
  MXN: 17.1,
  SAR: 3.75,
  AED: 3.67,
  THB: 36.8,
  IDR: 16100,
  MYR: 4.77,
  PHP: 57.5,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
  VND: '₫',
  CNY: '¥',
  KRW: '₩',
  BRL: 'R$',
  RUB: '₽',
  TRY: '₺',
  ZAR: 'R',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  CHF: 'Fr',
  SEK: 'kr',
  NOK: 'kr',
  MXN: '$',
  SAR: '﷼',
  AED: 'د.إ',
  THB: '฿',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
};

export const AVAILABLE_CURRENCIES: CurrencyCode[] = Object.keys(CURRENCY_RATES).sort() as CurrencyCode[];

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  [Category.FOOD]: '#FF6B6B',
  [Category.TRANSPORT]: '#4ECDC4',
  [Category.UTILITIES]: '#45B7D1',
  [Category.ENTERTAINMENT]: '#96CEB4',
  [Category.HEALTH]: '#FFCC5C',
  [Category.EDUCATION]: '#FFEEAD',
  [Category.SALARY]: '#88D8B0',
  [Category.INVESTMENT]: '#2F4858',
  [Category.PROFIT]: '#98D7C2',
  [Category.OTHER]: '#D4A5A5',
};

// Default Categories with Types
export const DEFAULT_CATEGORY_ITEMS: CategoryItem[] = [
  { id: 'cat_1', name: Category.SALARY, type: TransactionType.INCOME, color: DEFAULT_CATEGORY_COLORS[Category.SALARY] },
  { id: 'cat_2', name: Category.PROFIT, type: TransactionType.INCOME, color: DEFAULT_CATEGORY_COLORS[Category.PROFIT] },
  { id: 'cat_3', name: Category.INVESTMENT, type: TransactionType.INCOME, color: DEFAULT_CATEGORY_COLORS[Category.INVESTMENT] },
  { id: 'cat_4', name: Category.OTHER, type: TransactionType.INCOME, color: DEFAULT_CATEGORY_COLORS[Category.OTHER] },
  
  { id: 'cat_5', name: Category.FOOD, type: TransactionType.EXPENSE, color: DEFAULT_CATEGORY_COLORS[Category.FOOD] },
  { id: 'cat_6', name: Category.TRANSPORT, type: TransactionType.EXPENSE, color: DEFAULT_CATEGORY_COLORS[Category.TRANSPORT] },
  { id: 'cat_7', name: Category.UTILITIES, type: TransactionType.EXPENSE, color: DEFAULT_CATEGORY_COLORS[Category.UTILITIES] },
  { id: 'cat_8', name: Category.ENTERTAINMENT, type: TransactionType.EXPENSE, color: DEFAULT_CATEGORY_COLORS[Category.ENTERTAINMENT] },
  { id: 'cat_9', name: Category.HEALTH, type: TransactionType.EXPENSE, color: DEFAULT_CATEGORY_COLORS[Category.HEALTH] },
  { id: 'cat_10', name: Category.EDUCATION, type: TransactionType.EXPENSE, color: DEFAULT_CATEGORY_COLORS[Category.EDUCATION] },
  { id: 'cat_11', name: Category.OTHER, type: TransactionType.EXPENSE, color: DEFAULT_CATEGORY_COLORS[Category.OTHER] },
];

export const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_ITEMS.map(c => c.name);

export const DEFAULT_MEMBER_ITEMS: MemberItem[] = [
  { id: 'mem_1', name: 'Admin', color: '#3B82F6' }
];
