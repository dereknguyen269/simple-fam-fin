
export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  member: string;
  recurrence?: RecurrenceFrequency;
  type: TransactionType;
  paymentMethod?: string;
  walletId: string;
  transferToWalletId?: string; // ID of the destination wallet if type is TRANSFER
}

export interface Wallet {
  id: string;
  name: string;
  type: 'MAIN' | 'SAVINGS' | 'GOAL';
  balance: number; // Calculated field, not necessarily stored
  currency?: string;
  targetAmount?: number; // For goals
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'MONTHLY';
}

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
  TRANSFER = 'Transfer',
}

// Keeping Enums for backwards compatibility with default constants, 
// but the app will primarily use string arrays.
export enum Category {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health',
  EDUCATION = 'Education',
  SALARY = 'Salary',
  INVESTMENT = 'Investment',
  PROFIT = 'Profit',
  OTHER = 'Other',
}

export enum FamilyMember {
  DAD = 'Dad',
  MOM = 'Mom',
  KID1 = 'Alex',
  KID2 = 'Sam',
  GENERAL = 'General',
}

export enum RecurrenceFrequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}

export interface RecurringExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  member: string;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  active: boolean;
  type: TransactionType;
  paymentMethod?: string;
  walletId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface GoogleConfig {
  clientId: string;
  apiKey: string;
  spreadsheetId: string;
}

export type CurrencyCode =
  'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR' | 'VND' |
  'CNY' | 'KRW' | 'BRL' | 'RUB' | 'TRY' | 'ZAR' | 'SGD' | 'HKD' |
  'NZD' | 'CHF' | 'SEK' | 'NOK' | 'MXN' | 'SAR' | 'AED' | 'THB' |
  'IDR' | 'MYR' | 'PHP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // Rate relative to USD (Base)
}

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface MemberItem {
  id: string;
  name: string;
  color: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  icon?: string;
  walletId?: string; // Link to a wallet if it has transactions
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}
