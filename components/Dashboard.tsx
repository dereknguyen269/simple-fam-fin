
import React, { useMemo, useState } from 'react';
import { Expense, CurrencyConfig, TransactionType, Budget, Wallet, SavingsGoal } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Filter, CreditCard, Wallet as WalletIcon, AlertTriangle, ArrowRightLeft, Target, Edit, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency, convertFromBase } from '../utils';
import { DatePicker } from './DatePicker';
import { BudgetModal } from './BudgetModal';

interface DashboardProps {
  expenses: Expense[];
  currencyConfig: CurrencyConfig;
  categoryColors?: Record<string, string>;
  memberColors?: Record<string, string>;
  budgets?: Budget[];
  onAddBudget?: (b: Budget) => void;
  onDeleteBudget?: (id: string) => void;
  onUpdateBudget?: (b: Budget) => void;
  categoryItems?: any[];
  wallets?: Wallet[];
  goals?: SavingsGoal[];
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

type FilterType = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  currencyConfig,
  categoryColors = {},
  memberColors = {},
  budgets = [],
  onAddBudget,
  onDeleteBudget,
  onUpdateBudget,
  categoryItems = [],
  wallets = [],
  goals = []
}) => {
  const [filterType, setFilterType] = useState<FilterType>('THIS_MONTH');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // 1. Convert all base expenses to display currency first
  const displayExpenses = useMemo(() => {
    return expenses.map(e => ({
      ...e,
      amount: convertFromBase(e.amount, currencyConfig)
    }));
  }, [expenses, currencyConfig]);

  // 2. Separate Income/Expenses for the "Global/Snapshot" view (unfiltered by date for the monthly widget)
  const allExpensesOnly = useMemo(() => displayExpenses.filter(e => e.type !== TransactionType.INCOME && e.type !== TransactionType.TRANSFER), [displayExpenses]);

  // 3. Calculate Date Range for Filtering
  const dateFilterRange = useMemo(() => {
    const now = new Date();
    // Reset time part to avoid issues, though we operate on strings mostly
    now.setHours(0, 0, 0, 0);

    let startStr = '1970-01-01';
    let endStr = '9999-12-31';

    const pad = (n: number) => n.toString().padStart(2, '0');
    const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

    switch (filterType) {
      case 'TODAY': {
        const str = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
        startStr = str;
        endStr = str;
        break;
      }
      case 'THIS_WEEK': {
        // Calculate Monday of current week
        const d = new Date(now);
        const currentDay = d.getDay(); // 0 is Sunday
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
        d.setDate(now.getDate() - distanceToMonday);

        const monday = new Date(d);
        const sunday = new Date(d);
        sunday.setDate(monday.getDate() + 6);

        startStr = toDateStr(monday.getFullYear(), monday.getMonth() + 1, monday.getDate());
        endStr = toDateStr(sunday.getFullYear(), sunday.getMonth() + 1, sunday.getDate());
        break;
      }
      case 'THIS_MONTH': {
        startStr = toDateStr(now.getFullYear(), now.getMonth() + 1, 1);
        endStr = toDateStr(now.getFullYear(), now.getMonth() + 1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
        break;
      }
      case 'LAST_MONTH': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startStr = toDateStr(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1);
        endStr = toDateStr(lastMonth.getFullYear(), lastMonth.getMonth() + 1, new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate());
        break;
      }
      case 'THIS_YEAR': {
        startStr = toDateStr(now.getFullYear(), 1, 1);
        endStr = toDateStr(now.getFullYear(), 12, 31);
        break;
      }
      case 'CUSTOM': {
        if (customDateRange.start) startStr = customDateRange.start;
        if (customDateRange.end) endStr = customDateRange.end;
        break;
      }
      case 'ALL':
      default:
        break;
    }
    return { start: startStr, end: endStr };
  }, [filterType, customDateRange]);

  // 4. Apply Date Filter
  const filteredDisplayExpenses = useMemo(() => {
    return displayExpenses.filter(e => {
      if (!e.date) return false;
      return e.date >= dateFilterRange.start && e.date <= dateFilterRange.end;
    });
  }, [displayExpenses, dateFilterRange]);

  // 5. Derive Filtered Subsets for Charts/KPIs
  const filteredExpensesOnly = useMemo(() => filteredDisplayExpenses.filter(e => e.type === TransactionType.EXPENSE), [filteredDisplayExpenses]);
  const filteredIncomeOnly = useMemo(() => filteredDisplayExpenses.filter(e => e.type === TransactionType.INCOME), [filteredDisplayExpenses]);

  // KPI Calculations (Based on Filtered Data)
  const totalSpending = useMemo(() => filteredExpensesOnly.reduce((sum, item) => sum + item.amount, 0), [filteredExpensesOnly]);
  const totalIncome = useMemo(() => filteredIncomeOnly.reduce((sum, item) => sum + item.amount, 0), [filteredIncomeOnly]);

  // 6. Payment Method Breakdown logic for Net Balance Enhancement
  const spendingByMethod = useMemo(() => {
    let credit = 0;
    let cash = 0;

    filteredExpensesOnly.forEach(e => {
      const method = e.paymentMethod?.toLowerCase() || '';
      // Identify credit card transactions
      if (method.includes('credit')) {
        credit += e.amount;
      } else {
        cash += e.amount;
      }
    });

    return { credit, cash };
  }, [filteredExpensesOnly]);

  const cashFlow = totalIncome - spendingByMethod.cash;
  const netBalance = totalIncome - totalSpending;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Charts Data (Based on Filtered Data)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpensesOnly.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpensesOnly]);

  const memberData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpensesOnly.forEach(e => {
      map.set(e.member, (map.get(e.member) || 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpensesOnly]);

  const averageCategoryData = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    filteredExpensesOnly.forEach(e => {
      const current = map.get(e.category) || { total: 0, count: 0 };
      map.set(e.category, {
        total: current.total + e.amount,
        count: current.count + 1
      });
    });
    return Array.from(map.entries())
      .map(([name, { total, count }]) => ({ name, value: total / count }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpensesOnly]);

  // Daily Trend Data Calculation
  const dailyTrendData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number }>();

    filteredDisplayExpenses.forEach(e => {
      const date = e.date;
      if (!map.has(date)) {
        map.set(date, { date, income: 0, expense: 0 });
      }
      const entry = map.get(date)!;
      if (e.type === TransactionType.INCOME) {
        entry.income += e.amount;
      } else if (e.type === TransactionType.EXPENSE) {
        entry.expense += e.amount;
      }
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => {
        // Format date for display (MM/DD)
        const [y, m, d] = item.date.split('-');
        return {
          ...item,
          displayDate: `${m}/${d}`
        };
      });
  }, [filteredDisplayExpenses]);

  // Monthly Snapshot Logic (Independent of Filter, always compares Actual Current Month vs Last Month)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Previous month logic
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    let currentTotal = 0;
    let prevTotal = 0;

    allExpensesOnly.forEach(e => {
      // Parse YYYY-MM-DD safely
      const [y, m, d] = e.date.split('-').map(Number);
      const expenseMonth = m - 1;
      const expenseYear = y;

      if (expenseMonth === currentMonth && expenseYear === currentYear) {
        currentTotal += e.amount;
      } else if (expenseMonth === prevMonth && expenseYear === prevYear) {
        prevTotal += e.amount;
      }
    });

    const diff = currentTotal - prevTotal;
    const percentage = prevTotal === 0
      ? (currentTotal > 0 ? 100 : 0)
      : (diff / prevTotal) * 100;

    return {
      currentTotal,
      prevTotal,
      percentage,
      monthName: now.toLocaleString('default', { month: 'long' }),
      prevMonthName: prevDate.toLocaleString('default', { month: 'long' }),
      isIncrease: diff > 0,
      diff: Math.abs(diff)
    };
  }, [allExpensesOnly]);

  // Budget Calculations
  const budgetStats = useMemo(() => {
    if (!budgets || budgets.length === 0) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate spend per category for THIS MONTH regardless of dashboard filter
    const currentMonthSpend = new Map<string, number>();

    allExpensesOnly.forEach(e => {
      const [y, m] = e.date.split('-').map(Number);
      if (y === currentYear && m - 1 === currentMonth) {
        currentMonthSpend.set(e.category, (currentMonthSpend.get(e.category) || 0) + e.amount);
      }
    });

    return budgets.map(b => {
      const spend = currentMonthSpend.get(b.category) || 0;
      const limitDisplay = convertFromBase(b.limit, currencyConfig);
      const percent = (spend / limitDisplay) * 100;
      return {
        ...b,
        spend,
        limitDisplay,
        percent
      };
    }).sort((a, b) => b.percent - a.percent);

  }, [budgets, allExpensesOnly, currencyConfig]);

  const formatValue = (val: number) => formatCurrency(val, { ...currencyConfig, rate: 1 }); // Already converted

  const getFilterLabel = () => {
    if (filterType === 'CUSTOM') return 'Custom Range';
    if (filterType === 'ALL') return 'All Time';
    return filterType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* 1. Monthly Snapshot (Pinned Widget) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Calendar size={100} className="text-blue-500" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Current Month Snapshot ({monthlyStats.monthName})
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800">{formatValue(monthlyStats.currentTotal)}</span>
              <span className="text-sm text-gray-500">spent so far</span>
            </div>
          </div>

          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${monthlyStats.percentage === 0 ? 'bg-gray-50 border-gray-200 text-gray-600' :
            monthlyStats.isIncrease ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
            }`}>
            {monthlyStats.percentage === 0 ? (
              <Minus size={24} />
            ) : monthlyStats.isIncrease ? (
              <TrendingUp size={24} />
            ) : (
              <TrendingDown size={24} />
            )}
            <div>
              <p className="text-sm font-bold">
                {Math.abs(monthlyStats.percentage).toFixed(1)}% {monthlyStats.isIncrease ? 'Higher' : 'Lower'}
              </p>
              <p className="text-xs opacity-80">
                vs {monthlyStats.prevMonthName} ({formatValue(monthlyStats.prevTotal)})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet & Goals Overview Widget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <WalletIcon size={20} className="text-green-600" />
              Wallets & Goals
            </h3>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
            {/* Wallets Section */}
            {wallets.length === 0 ? (
              <p className="text-sm text-gray-400">No wallets found.</p>
            ) : (
              wallets.map(w => (
                <div key={w.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{w.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{w.type.toLowerCase()}</p>
                  </div>
                  <p className={`font-bold font-mono ${w.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(w.balance, currencyConfig)}
                  </p>
                </div>
              ))
            )}

            {/* Goals Section */}
            {goals.length > 0 && (
              <>
                <div className="pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Target size={12} /> Savings Goals
                </div>
                {goals.map(g => (
                  <div key={g.id} className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }}></div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{g.name}</p>
                        <p className="text-xs text-gray-500">Target: {formatCurrency(g.targetAmount, currencyConfig)}</p>
                      </div>
                    </div>
                    <p className="font-bold font-mono text-gray-900">
                      {formatCurrency(g.currentAmount, currencyConfig)}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Budget Widget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Target size={20} className="text-purple-500" />
              Monthly Budgets
            </h3>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-xs font-medium text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
            >
              <Edit size={12} /> Manage
            </button>
          </div>

          {budgetStats.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg">
              No budgets set. Click "Manage" to start tracking.
            </div>
          ) : (
            <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
              {budgetStats.map(b => (
                <div key={b.id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-medium text-sm text-gray-700">{b.category}</span>
                    <span className="text-xs text-gray-500">
                      <span className={`font-bold ${b.spend > b.limitDisplay ? 'text-red-600' : 'text-gray-800'}`}>
                        {formatValue(b.spend)}
                      </span> / {formatValue(b.limitDisplay)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${b.percent > 100 ? 'bg-red-500' :
                        b.percent > 75 ? 'bg-yellow-400' :
                          'bg-green-500'
                        }`}
                      style={{ width: `${Math.min(b.percent, 100)}%` }}
                    ></div>
                  </div>
                  {b.percent > 100 && (
                    <div className="mt-1 text-[10px] text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle size={10} /> Over budget by {formatValue(b.spend - b.limitDisplay)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Filter Controls and others... */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        {/* ... existing filter controls ... */}
        <div className="flex items-center gap-2 px-2">
          <Filter size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Analysis Period:</span>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR', 'ALL'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${filterType === type
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {type === 'TODAY' ? 'Today' :
                type === 'THIS_WEEK' ? 'This Week' :
                  type === 'THIS_MONTH' ? 'This Month' :
                    type === 'LAST_MONTH' ? 'Last Month' :
                      type === 'THIS_YEAR' ? 'This Year' : 'All Time'}
            </button>
          ))}

          <button
            onClick={() => setFilterType('CUSTOM')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${filterType === 'CUSTOM'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Inputs (Conditional) */}
      {filterType === 'CUSTOM' && (
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-xs text-gray-500">From</label>
            <DatePicker
              value={customDateRange.start}
              onChange={(date) => setCustomDateRange({ ...customDateRange, start: date })}
            />
          </div>
          <span className="text-gray-400 pt-4">-</span>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-xs text-gray-500">To</label>
            <DatePicker
              value={customDateRange.end}
              onChange={(date) => setCustomDateRange({ ...customDateRange, end: date })}
            />
          </div>
        </div>
      )}

      {/* 3. KPI Cards (Filtered) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Income */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">Filtered Income</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{formatValue(totalIncome)}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredIncomeOnly.length} transactions</p>
        </div>

        {/* Card 2: Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">Filtered Expenses</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatValue(totalSpending)}</p>
          <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><WalletIcon size={12} className="text-gray-400" /> Cash</span>
              <span className="font-medium">{formatValue(spendingByMethod.cash)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><CreditCard size={12} className="text-purple-400" /> Credit</span>
              <span className="font-medium text-purple-600">{formatValue(spendingByMethod.credit)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Net Balance (Accrual) - Simplified for clarity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            Net Balance
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Accrual</span>
          </h3>
          <p className={`text-2xl font-bold mt-2 ${netBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
            {formatValue(netBalance)}
          </p>
          <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${netBalance >= 0 ? 'bg-gray-600' : 'bg-red-500'}`}
              style={{ width: `${Math.min(Math.abs(savingsRate), 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {netBalance >= 0 ? `${savingsRate.toFixed(1)}% savings rate` : 'Overspending'}
          </p>
        </div>

        {/* Card 4: Cash Flow (Realized) - The Nuanced Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">Est. Cash Flow</h3>
            {cashFlow < 0 && netBalance > 0 && (
              <div className="text-amber-500" title="Low Liquidity Warning">
                <AlertTriangle size={16} />
              </div>
            )}
          </div>

          <p className={`text-2xl font-bold mt-2 ${cashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatValue(cashFlow)}
          </p>

          <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Credit Float:</span>
              <span className="font-bold text-purple-600">+{formatValue(spendingByMethod.credit)}</span>
            </div>
            {cashFlow > 0 && netBalance < 0 && (
              <div className="mt-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 inline-flex items-center gap-1">
                <ArrowRightLeft size={10} /> Debt Accumulating
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Daily Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-indigo-500" />
          Daily Trends
        </h3>
        {dailyTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailyTrendData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                dy={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `${currencyConfig.symbol}${value}`}
              />
              <Tooltip
                formatter={(value: number) => formatValue(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 0, fill: '#10B981' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 0, fill: '#EF4444' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No trend data available for this period.
          </div>
        )}
      </div>

      {/* 5. Charts (Filtered) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[500px] flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Expense Breakdown</h3>
          <div className="flex-1 min-h-0 flex flex-col">
            {totalSpending > 0 ? (
              <>
                <div className="flex-1 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.filter(item => !collapsedCategories.has(item.name))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.filter(item => !collapsedCategories.has(item.name)).map((entry, index) => {
                          const originalIndex = categoryData.findIndex(cat => cat.name === entry.name);
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={categoryColors[entry.name] || DEFAULT_COLORS[originalIndex % DEFAULT_COLORS.length]}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatValue(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text for Total */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 font-medium uppercase">
                        {collapsedCategories.size > 0 ? 'Visible' : 'Total'}
                      </p>
                      <p className="text-lg font-bold text-gray-700">
                        {formatValue(
                          categoryData
                            .filter(item => !collapsedCategories.has(item.name))
                            .reduce((sum, item) => sum + item.value, 0)
                        )}
                      </p>
                      {collapsedCategories.size > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {collapsedCategories.size} hidden
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed List with Toggle */}
                <div className="mt-4 flex-shrink-0 space-y-1 overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
                  {categoryData.map((item, index) => {
                    const color = categoryColors[item.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                    const isCollapsed = collapsedCategories.has(item.name);

                    const toggleCategory = () => {
                      setCollapsedCategories(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(item.name)) {
                          newSet.delete(item.name);
                        } else {
                          newSet.add(item.name);
                        }
                        return newSet;
                      });
                    };

                    return (
                      <div key={item.name} className="rounded border border-gray-100 overflow-hidden hover:border-gray-300 transition-colors">
                        <button
                          onClick={toggleCategory}
                          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 text-sm transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                            >
                              <ChevronRight size={14} className="text-gray-400" />
                            </span>
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                            <span className="text-gray-700 font-medium">{item.name}</span>
                          </div>
                          {!isCollapsed && (
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">{formatValue(item.value)}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full min-w-[3rem] text-center">
                                {(totalSpending > 0 ? (item.value / totalSpending) * 100 : 0).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                No expenses found for this period.
              </div>
            )}
          </div>
        </div>

        {/* Spending by Member */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[500px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Member</h3>
          {totalSpending > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={memberData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatValue(value)} />
                <Legend />
                <Bar dataKey="value" name="Amount Spent" radius={[4, 4, 0, 0]}>
                  {memberData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={memberColors[entry.name] || '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No data available.
            </div>
          )}
        </div>
      </div>

      {/* Average Spending per Category Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Average Transaction Size</h3>
        {totalSpending > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={averageCategoryData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatValue(value)} />
              <Legend />
              <Bar dataKey="value" name="Avg. Amount" fill="#FF8042" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No data available.
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgets={budgets}
        onAddBudget={onAddBudget!}
        onDeleteBudget={onDeleteBudget!}
        onUpdateBudget={onUpdateBudget!}
        categoryItems={categoryItems}
        currencyConfig={currencyConfig}
      />
    </div>
  );
};
