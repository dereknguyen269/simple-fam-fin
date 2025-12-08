
import { RecurrenceFrequency, CurrencyConfig, Expense, Category, FamilyMember, TransactionType, Wallet, SavingsGoal } from './types';
import { PAYMENT_METHODS } from './constants';

export const calculateNextDate = (dateStr: string, frequency: RecurrenceFrequency): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const localDate = new Date(y, m - 1, d);

  switch (frequency) {
    case RecurrenceFrequency.DAILY:
      localDate.setDate(localDate.getDate() + 1);
      break;
    case RecurrenceFrequency.WEEKLY:
      localDate.setDate(localDate.getDate() + 7);
      break;
    case RecurrenceFrequency.MONTHLY:
      localDate.setMonth(localDate.getMonth() + 1);
      break;
    case RecurrenceFrequency.YEARLY:
      localDate.setFullYear(localDate.getFullYear() + 1);
      break;
  }
  
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Currency Helpers

export const formatCurrency = (amount: number, config: CurrencyConfig): string => {
  const value = amount * config.rate;
  // Currencies typically displayed without decimals
  const zeroDecimalCurrencies = ['JPY', 'VND', 'KRW', 'IDR', 'CLP', 'HUF', 'TWD'];
  const decimals = zeroDecimalCurrencies.includes(config.code) ? 0 : 2;
  
  const formattedNumber = new Intl.NumberFormat(undefined, {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value));

  const sign = value < 0 ? '-' : '';
  return `${sign}${config.symbol}${formattedNumber}`;
};

export const convertToBase = (amountInSelectedCurrency: number, config: CurrencyConfig): number => {
  return amountInSelectedCurrency / config.rate;
};

export const convertFromBase = (amountInBase: number, config: CurrencyConfig): number => {
  return amountInBase * config.rate;
};

export const hexToRgba = (hex: string, alpha: number): string => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
  }
  return hex; // Fallback if not valid hex
};

export const calculateWalletBalances = (wallets: Wallet[], expenses: Expense[]): Wallet[] => {
  const balanceMap = new Map<string, number>();
  
  // Initialize with 0
  wallets.forEach(w => balanceMap.set(w.id, 0));

  expenses.forEach(e => {
    const amount = e.amount;

    if (e.type === TransactionType.INCOME) {
      const current = balanceMap.get(e.walletId) || 0;
      balanceMap.set(e.walletId, current + amount);
    } else if (e.type === TransactionType.EXPENSE) {
      const current = balanceMap.get(e.walletId) || 0;
      balanceMap.set(e.walletId, current - amount);
    } else if (e.type === TransactionType.TRANSFER) {
      // Subtract from source if it's a known wallet
      if (balanceMap.has(e.walletId)) {
        const src = balanceMap.get(e.walletId) || 0;
        balanceMap.set(e.walletId, src - amount);
      }
      // Add to dest if it's a known wallet
      if (e.transferToWalletId && balanceMap.has(e.transferToWalletId)) {
        const dest = balanceMap.get(e.transferToWalletId) || 0;
        balanceMap.set(e.transferToWalletId, dest + amount);
      }
    }
  });

  return wallets.map(w => ({
    ...w,
    balance: balanceMap.get(w.id) || 0
  }));
};

// Full Demo Data Generator
export const generateFullDemoData = () => {
  const expenses: Expense[] = [];
  const wallets: Wallet[] = [
    { id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 },
    { id: 'wallet_savings', name: 'Emergency Fund', type: 'SAVINGS', balance: 0 },
    { id: 'wallet_cash', name: 'Physical Cash', type: 'MAIN', balance: 0 }
  ];
  
  const goals: SavingsGoal[] = [
    { 
      id: 'goal_vacation', 
      name: 'Japan Trip', 
      targetAmount: 5000, 
      currentAmount: 1200, 
      deadline: new Date(new Date().getFullYear() + 1, 3, 1).toISOString().split('T')[0],
      color: '#F59E0B' // Amber
    }
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  
  const getRandomPaymentMethod = () => {
     return PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
  };

  const getDate = (day: number, monthOffset: number = 0) => {
    const d = new Date(currentYear, currentMonth + monthOffset, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  const addEx = (
    desc: string, 
    cat: string, 
    mem: string, 
    amt: number, 
    day: number, 
    monthOffset: number, 
    type: TransactionType = TransactionType.EXPENSE,
    walletId: string = 'main',
    paymentMethod: string = 'Credit Card'
  ) => {
    expenses.push({
      id: Math.random().toString(36).substr(2, 9),
      date: getDate(day, monthOffset),
      description: desc,
      category: cat,
      amount: amt,
      member: mem,
      type: type,
      recurrence: undefined,
      paymentMethod: paymentMethod,
      walletId: walletId
    });
  };

  // --- Initial Balances / Income ---
  addEx('Initial Balance', 'Other', 'Admin', 2000, 1, -1, TransactionType.INCOME, 'main', 'Bank Transfer');
  addEx('Savings Deposit', 'Other', 'Admin', 5000, 1, -1, TransactionType.INCOME, 'wallet_savings', 'Bank Transfer');
  addEx('Wallet Cash', 'Other', 'Admin', 200, 1, -1, TransactionType.INCOME, 'wallet_cash', 'Cash');

  // --- Current Month ---
  addEx('Monthly Salary', Category.SALARY, FamilyMember.DAD, 5000, 1, 0, TransactionType.INCOME, 'main', 'Bank Transfer');
  addEx('Freelance Work', Category.SALARY, FamilyMember.MOM, 1200, 15, 0, TransactionType.INCOME, 'main', 'Bank Transfer');
  
  addEx('Rent / Mortgage', Category.UTILITIES, FamilyMember.GENERAL, 1500, 1, 0, TransactionType.EXPENSE, 'main', 'Bank Transfer');
  addEx('Weekly Groceries', Category.FOOD, FamilyMember.MOM, 185.50, 3, 0, TransactionType.EXPENSE, 'main', 'Credit Card');
  addEx('Gas Station', Category.TRANSPORT, FamilyMember.DAD, 60.00, 5, 0, TransactionType.EXPENSE, 'main', 'Credit Card');
  addEx('Coffee Run', Category.FOOD, FamilyMember.DAD, 15.00, 6, 0, TransactionType.EXPENSE, 'wallet_cash', 'Cash');
  
  addEx('Emergency Fund Top-up', 'Transfer', 'Admin', 500, 7, 0, TransactionType.TRANSFER, 'main', 'Bank Transfer');
  // Manually link the transfer for demo purposes (App logic usually handles this, but for demo data we simulate the expense record)
  // Note: The logic in calculateWalletBalances handles TRANSFER type by subtracting from walletId. 
  // To simulate the "Receive" side, we usually rely on the single record with `transferToWalletId`.
  expenses[expenses.length - 1].transferToWalletId = 'wallet_savings';

  addEx('Electric Bill', Category.UTILITIES, FamilyMember.GENERAL, 145.20, 10, 0, TransactionType.EXPENSE, 'main', 'Bank Transfer');
  addEx('Netflix', Category.ENTERTAINMENT, FamilyMember.GENERAL, 15.99, 12, 0, TransactionType.EXPENSE, 'main', 'Credit Card');
  addEx('School Lunch Money', Category.EDUCATION, FamilyMember.KID1, 50.00, 14, 0, TransactionType.EXPENSE, 'wallet_cash', 'Cash');
  addEx('Weekend Dining', Category.FOOD, FamilyMember.GENERAL, 120.00, 18, 0, TransactionType.EXPENSE, 'main', 'Credit Card');
  addEx('Gym Membership', Category.HEALTH, FamilyMember.DAD, 45.00, 20, 0, TransactionType.EXPENSE, 'main', 'Credit Card');

  // --- Last Month ---
  addEx('Monthly Salary', Category.SALARY, FamilyMember.DAD, 5000, 1, -1, TransactionType.INCOME, 'main', 'Bank Transfer');
  addEx('Weekly Groceries', Category.FOOD, FamilyMember.MOM, 210.00, 2, -1, TransactionType.EXPENSE, 'main', 'Credit Card');
  addEx('Car Service', Category.TRANSPORT, FamilyMember.DAD, 350.00, 8, -1, TransactionType.EXPENSE, 'wallet_savings', 'Debit Card'); // Paid from savings
  
  // Sort
  expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { expenses, wallets, goals };
};

// Deprecated: kept for compatibility if needed, but redirects to full generator's expenses
export const generateDemoData = (): Expense[] => {
  return generateFullDemoData().expenses;
};
