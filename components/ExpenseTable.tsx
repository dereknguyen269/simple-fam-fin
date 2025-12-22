
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, RecurringExpense, CurrencyConfig, TransactionType, CategoryItem, Wallet, SavingsGoal } from '../types';
import { Pencil, Trash2, Plus, Download, RotateCw, Filter, ArrowUpCircle, ArrowDownCircle, ArrowUp, ArrowDown, ArrowUpDown, X, Search, CreditCard, ArrowRightLeft, ArrowRight, Wallet as WalletIcon, Coins, Banknote, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { RecurringExpensesModal } from './RecurringExpensesModal';
import { ExpenseModal } from './ExpenseModal';
import { calculateNextDate, formatCurrency, convertFromBase, convertToBase, hexToRgba } from '../utils';
import { DatePicker } from './DatePicker';
import { CustomSelect } from './CustomSelect';
import { SearchInput } from './SearchInput';
import { PAYMENT_METHODS } from '../constants';

interface ExpenseTableProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;

  // Recurring props
  recurringExpenses: RecurringExpense[];
  onAddRecurring: (expense: Omit<RecurringExpense, 'id'>) => void;
  onDeleteRecurring: (id: string) => void;

  currencyConfig: CurrencyConfig;
  categoryItems: CategoryItem[];
  members: string[];
  categoryColors: Record<string, string>;
  wallets: Wallet[];
  goals: SavingsGoal[];
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  recurringExpenses,
  onAddRecurring,
  onDeleteRecurring,
  currencyConfig,
  categoryItems,
  members,
  categoryColors,
  wallets,
  goals = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Filter State
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [memberFilter, setMemberFilter] = useState<string>('All');
  const [walletFilter, setWalletFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sort State
  type SortKey = 'date' | 'description' | 'amount';
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, memberFilter, walletFilter, paymentMethodFilter, searchQuery, startDate, endDate]);

  // All unique category names for filtering
  const allCategoryNames = useMemo(() => Array.from(new Set(categoryItems.map(c => c.name))), [categoryItems]);

  const categoryOptions = useMemo(() => {
    return [
      { value: 'All', label: 'All Categories' },
      ...allCategoryNames.map(c => ({
        value: c,
        label: c,
        color: categoryColors[c]
      }))
    ];
  }, [allCategoryNames, categoryColors]);

  const memberOptions = useMemo(() => {
    return [
      { value: 'All', label: 'All Members' },
      ...members.map(m => ({ value: m, label: m }))
    ];
  }, [members]);

  const walletOptions = useMemo(() => {
    return [
      { value: 'All', label: 'All Wallets' },
      ...wallets.map(w => ({ value: w.id, label: w.name }))
    ];
  }, [wallets]);

  const paymentMethodOptions = useMemo(() => {
    return [
      { value: 'All', label: 'All Methods' },
      ...PAYMENT_METHODS.map(pm => ({ value: pm, label: pm }))
    ];
  }, []);

  // Memoized Filter Logic
  const filteredExpenses = useMemo(() => expenses.filter(expense => {
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    const matchesMember = memberFilter === 'All' || expense.member === memberFilter;

    // Improved Wallet Logic
    const matchesWallet = walletFilter === 'All' ||
      expense.walletId === walletFilter ||
      expense.transferToWalletId === walletFilter;

    const expenseMethod = expense.paymentMethod || 'Cash';
    const matchesPaymentMethod = paymentMethodFilter === 'All' || expenseMethod === paymentMethodFilter;

    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());

    const expDate = expense.date;
    const matchesStartDate = !startDate || expDate >= startDate;
    const matchesEndDate = !endDate || expDate <= endDate;

    return matchesCategory && matchesMember && matchesWallet && matchesPaymentMethod && matchesSearch && matchesStartDate && matchesEndDate;
  }), [expenses, categoryFilter, memberFilter, walletFilter, paymentMethodFilter, searchQuery, startDate, endDate]);

  // Sort Logic
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedExpenses = useMemo(() => {
    const data = [...filteredExpenses];
    if (!sortConfig) return data;

    return data.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc'
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date);
      }
      if (sortConfig.key === 'description') {
        return sortConfig.direction === 'asc'
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description);
      }
      return 0;
    });
  }, [filteredExpenses, sortConfig]);

  // Pagination Logic
  const totalItems = sortedExpenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = useMemo(() => {
    return sortedExpenses.slice(startIdx, startIdx + itemsPerPage);
  }, [sortedExpenses, startIdx, itemsPerPage]);

  const handleAddNewClick = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleSaveExpense = (data: Partial<Expense>) => {
    if (data.amount !== undefined && data.date) {
      const baseAmount = convertToBase(data.amount, currencyConfig);
      const type = data.type || TransactionType.EXPENSE;
      const description = data.description || ''; // Allow empty description

      if (selectedExpense) {
        onUpdateExpense({
          ...selectedExpense,
          ...data as Expense,
          description,
          amount: baseAmount,
          id: selectedExpense.id
        });
      } else {
        onAddExpense({
          date: data.date,
          description,
          amount: baseAmount,
          category: data.category!,
          member: data.member!,
          recurrence: data.recurrence,
          type: type,
          paymentMethod: data.paymentMethod,
          walletId: data.walletId || 'main'
        });
      }

      const isNewRecurrence = data.recurrence && (!selectedExpense || !selectedExpense.recurrence);

      if (isNewRecurrence && data.recurrence) {
        onAddRecurring({
          description: description || 'Recurring',
          category: data.category!,
          amount: baseAmount,
          member: data.member!,
          frequency: data.recurrence,
          nextDueDate: calculateNextDate(data.date!, data.recurrence),
          active: true,
          type: type,
          paymentMethod: data.paymentMethod,
          walletId: data.walletId || 'main'
        });
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const expense = expenses.find(e => e.id === id);
    if (expense && expense.type === TransactionType.TRANSFER) {
      alert("Transfer transactions cannot be deleted. Please create a counter-transfer to reverse funds.");
      return;
    }
    setExpenseToDelete(id);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      onDeleteExpense(expenseToDelete);
      setExpenseToDelete(null);
    }
  };

  // --- Display Helpers ---

  const getWalletDisplay = (id?: string) => {
    if (!id) return <span className="text-gray-400 text-xs italic">Unknown</span>;

    // Check Goals first (visually distinct)
    const g = goals.find(goal => goal.id === id);
    if (g) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {g.name}
        </span>
      );
    }

    // Check Wallets
    const w = wallets.find(wal => wal.id === id);
    if (w) {
      if (w.id === 'main') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Main
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-100">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
          {w.name}
        </span>
      );
    }

    return <span className="text-gray-400 text-xs italic">Unknown ID</span>;
  };

  const getMethodDisplay = (method?: string) => {
    const m = method || 'Cash';
    let colors = 'bg-gray-100 text-gray-600 border-gray-200';
    let icon = <Coins size={12} />;

    if (m.includes('Cash')) {
      colors = 'bg-emerald-50 text-emerald-700 border-emerald-100';
      icon = <Banknote size={12} />;
    } else if (m.includes('Credit')) {
      colors = 'bg-violet-50 text-violet-700 border-violet-100';
      icon = <CreditCard size={12} />;
    } else if (m.includes('Debit')) {
      colors = 'bg-blue-50 text-blue-700 border-blue-100';
      icon = <CreditCard size={12} />;
    } else if (m.includes('Bank') || m.includes('Transfer')) {
      colors = 'bg-slate-50 text-slate-700 border-slate-100';
      icon = <ArrowRightLeft size={12} />;
    } else if (m.includes('Mobile')) {
      colors = 'bg-pink-50 text-pink-700 border-pink-100';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
        {icon}
        {m}
      </span>
    );
  };

  const exportToCSV = async () => {
    // Optimized CSV Export for large datasets (>1000 rows)
    const totalRows = sortedExpenses.length;
    const isLargeDataset = totalRows > 1000;

    if (isExporting) return; // Prevent multiple simultaneous exports

    setIsExporting(true);
    setExportProgress(0);

    try {
      const headers = ['Date', 'Type', 'Description', 'Category', 'Member', 'Wallet', 'Amount', 'Payment Method', 'Recurrence'];

      // Helper to get raw name for CSV
      const getWalletNameRaw = (id: string) => {
        const w = wallets.find(wal => wal.id === id);
        if (w) return w.name;
        const g = goals.find(goal => goal.id === id);
        if (g) return `Goal: ${g.name}`;
        return 'Unknown';
      };

      // Helper to escape CSV values
      const escapeCSV = (value: string | number) => {
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Process rows in chunks for better performance
      const CHUNK_SIZE = 500;
      const csvLines: string[] = [headers.join(',')];

      // Process in chunks to avoid blocking the UI
      for (let i = 0; i < sortedExpenses.length; i += CHUNK_SIZE) {
        // Use requestAnimationFrame for non-blocking processing
        await new Promise(resolve => requestAnimationFrame(resolve));

        const chunk = sortedExpenses.slice(i, i + CHUNK_SIZE);

        const chunkRows = chunk.map(e => {
          const walletName = e.type === TransactionType.TRANSFER && e.transferToWalletId
            ? `${getWalletNameRaw(e.walletId)} → ${getWalletNameRaw(e.transferToWalletId)}`
            : getWalletNameRaw(e.walletId);

          return [
            e.date,
            e.type || TransactionType.EXPENSE,
            escapeCSV(e.description),
            e.category,
            e.member,
            escapeCSV(walletName),
            formatCurrency(e.amount, currencyConfig),
            e.paymentMethod || 'Cash',
            e.recurrence || 'One-time'
          ].join(',');
        });

        csvLines.push(...chunkRows);

        // Update progress
        const progress = Math.min(((i + CHUNK_SIZE) / totalRows) * 100, 100);
        setExportProgress(progress);
      }

      // Use Blob API for better performance and no size limits (vs data URI)
      const csvContent = csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `family_expenses_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Show completion briefly
      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              Transaction Database
            </h2>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
              Filters
              {(categoryFilter !== 'All' || memberFilter !== 'All' || walletFilter !== 'All' || paymentMethodFilter !== 'All' || searchQuery || startDate || endDate) && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Search Bar - Always Visible */}
          <div className="mb-3 lg:mb-0">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search transactions..."
              className="w-full"
            />
          </div>

          {/* Collapsible Filter Section */}
          <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block space-y-3 mt-3 lg:mt-4`}>
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Range</label>
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Start Date"
                    className="flex-1"
                  />
                  <span className="text-gray-400">→</span>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="End Date"
                    className="flex-1"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate('') }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Clear Date Filter"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <CustomSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categoryOptions}
                  icon={<Filter size={14} />}
                  placeholder="All Categories"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Member</label>
                <CustomSelect
                  value={memberFilter}
                  onChange={setMemberFilter}
                  options={memberOptions}
                  placeholder="All Members"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Wallet</label>
                <CustomSelect
                  value={walletFilter}
                  onChange={setWalletFilter}
                  options={walletOptions}
                  placeholder="All Wallets"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                <CustomSelect
                  value={paymentMethodFilter}
                  onChange={setPaymentMethodFilter}
                  options={paymentMethodOptions}
                  placeholder="All Methods"
                />
              </div>
            </div>

            {/* Clear All Filters */}
            {(categoryFilter !== 'All' || memberFilter !== 'All' || walletFilter !== 'All' || paymentMethodFilter !== 'All' || searchQuery || startDate || endDate) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setCategoryFilter('All');
                    setMemberFilter('All');
                    setWalletFilter('All');
                    setPaymentMethodFilter('All');
                    setSearchQuery('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-gray-600 hover:text-red-600 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 justify-end">
            <button
              onClick={() => setIsRecurringModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RotateCw size={16} />
              <span className="hidden sm:inline">Recurring Rules</span>
              <span className="sm:hidden">Recurring</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={isExporting}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all relative overflow-hidden ${isExporting
                ? 'text-white bg-green-600 border border-green-600 cursor-wait'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              title={isExporting ? `Exporting... ${exportProgress.toFixed(0)}%` : 'Export to CSV'}
            >
              {/* Progress bar background */}
              {isExporting && (
                <div
                  className="absolute inset-0 bg-green-700 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              )}

              {/* Button content */}
              <div className="relative z-10 flex items-center gap-2">
                {isExporting ? (
                  <>
                    <div className="animate-spin">
                      <RotateCw size={16} />
                    </div>
                    <span className="hidden sm:inline">Exporting... {exportProgress.toFixed(0)}%</span>
                    <span className="sm:hidden">{exportProgress.toFixed(0)}%</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </div>
            </button>
            <button
              onClick={handleAddNewClick}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Record</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-gray-50">
          {paginatedExpenses.map(expense => {
            let amountPrefix = '';
            let amountColorClass = 'text-gray-800';
            let typeIcon = <ArrowDownCircle size={16} />;
            let typeColor = 'bg-red-50 text-red-600 border-red-200';

            if (expense.type === TransactionType.INCOME) {
              amountPrefix = '+';
              amountColorClass = 'text-green-600';
              typeIcon = <ArrowUpCircle size={16} />;
              typeColor = 'bg-green-50 text-green-600 border-green-200';
            } else if (expense.type === TransactionType.TRANSFER) {
              typeIcon = <ArrowRightLeft size={16} />;
              typeColor = 'bg-blue-50 text-blue-600 border-blue-200';
              if (walletFilter !== 'All') {
                if (expense.transferToWalletId === walletFilter) {
                  amountPrefix = '+';
                  amountColorClass = 'text-green-600';
                } else if (expense.walletId === walletFilter) {
                  amountPrefix = '-';
                  amountColorClass = 'text-red-600';
                }
              } else {
                amountColorClass = 'text-blue-600';
              }
            }

            return (
              <div
                key={expense.id}
                onClick={() => handleRowClick(expense)}
                className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm active:scale-[0.99] transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${typeColor}`}>
                      {typeIcon}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-gray-800 line-clamp-1 text-sm">{expense.description}</div>
                      <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
                        {expense.date} • <span className="text-gray-500">{expense.member}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-mono font-bold text-sm ${amountColorClass}`}>
                    {amountPrefix}{formatCurrency(expense.amount, currencyConfig)}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                    <span
                      className="text-[10px] font-bold tracking-wider border-l-2 pl-1.5 truncate max-w-[120px]"
                      style={{
                        color: categoryColors[expense.category] || '#4b5563',
                        borderColor: categoryColors[expense.category] || '#e5e7eb'
                      }}
                      title={expense.category}
                    >
                      {expense.category}
                    </span>
                    {expense.type === TransactionType.TRANSFER ? (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5 whitespace-nowrap truncate max-w-[140px]" title={`${expense.walletId} → ${expense.transferToWalletId}`}>
                        <span className="truncate">{getWalletDisplay(expense.walletId)}</span>
                        <ArrowRight size={8} className="shrink-0" />
                        <span className="truncate">{getWalletDisplay(expense.transferToWalletId)}</span>
                      </span>
                    ) : (
                      <span className="truncate max-w-[100px]" title={expense.walletId}>
                        {getWalletDisplay(expense.walletId)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {expense.type !== TransactionType.TRANSFER && (
                      <button
                        onClick={(e) => handleDeleteClick(e, expense.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {paginatedExpenses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Search size={20} />
              </div>
              <p className="text-sm">No transactions found.</p>
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th
                  className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32 cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortConfig?.key === 'date' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-gray-700" /> : <ArrowDown size={14} className="text-gray-700" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-28">Type</th>
                <th
                  className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1">
                    Description
                    {sortConfig?.key === 'description' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-gray-700" /> : <ArrowDown size={14} className="text-gray-700" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-36">Category</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32">Member</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-44">Wallet</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32">Method</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32">Repeat</th>
                <th
                  className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right w-36 cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount ({currencyConfig.symbol})
                    {sortConfig?.key === 'amount' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-gray-700" /> : <ArrowDown size={14} className="text-gray-700" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">

              {paginatedExpenses.map(expense => {
                // Formatting for amount
                let amountPrefix = '';
                let amountColorClass = 'text-gray-800';

                if (expense.type === TransactionType.INCOME) {
                  amountPrefix = '+';
                  amountColorClass = 'text-green-600';
                } else if (expense.type === TransactionType.TRANSFER) {
                  if (walletFilter !== 'All') {
                    if (expense.transferToWalletId === walletFilter) {
                      amountPrefix = '+';
                      amountColorClass = 'text-green-600';
                    } else if (expense.walletId === walletFilter) {
                      amountPrefix = '-';
                      amountColorClass = 'text-red-600';
                    }
                  } else {
                    amountColorClass = 'text-blue-600';
                  }
                }

                return (
                  <tr
                    key={expense.id}
                    onClick={() => handleRowClick(expense)}
                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="p-4 text-sm text-gray-700 font-mono">{expense.date}</td>
                    <td className="p-4 text-sm">
                      {expense.type === TransactionType.INCOME ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit border border-green-200">
                          <ArrowUpCircle size={12} /> Income
                        </span>
                      ) : expense.type === TransactionType.TRANSFER ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full w-fit border border-blue-200">
                          <ArrowRightLeft size={12} /> Transfer
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full w-fit border border-red-200">
                          <ArrowDownCircle size={12} /> Expense
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-800 font-medium">{expense.description}</td>
                    <td className="p-4 text-sm text-gray-600">
                      <span
                        className="text-xs font-medium border-l-2 pl-2"
                        style={{
                          color: categoryColors[expense.category] || '#4b5563',
                          borderColor: categoryColors[expense.category] || '#e5e7eb'
                        }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{expense.member}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {expense.type === TransactionType.TRANSFER && expense.transferToWalletId ? (
                        <div className="flex items-center gap-1">
                          {getWalletDisplay(expense.walletId)}
                          <ArrowRight size={12} className="text-gray-400" />
                          {getWalletDisplay(expense.transferToWalletId)}
                        </div>
                      ) : (
                        getWalletDisplay(expense.walletId)
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {getMethodDisplay(expense.paymentMethod)}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {expense.recurrence ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit border border-blue-100">
                          <RotateCw size={10} />
                          {expense.recurrence}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className={`p-4 text-sm font-mono text-right font-semibold ${amountColorClass}`}>
                      {amountPrefix}{formatCurrency(expense.amount, currencyConfig)}
                    </td>
                    <td className="p-4 text-sm text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {expense.type !== TransactionType.TRANSFER ? (
                          <button onClick={(e) => handleDeleteClick(e, expense.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete"><Trash2 size={16} /></button>
                        ) : (
                          <span className="p-1.5 text-gray-300 cursor-not-allowed" title="Transfers cannot be deleted"><Trash2 size={16} /></span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {paginatedExpenses.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">
                    {expenses.length === 0 ? 'No transactions recorded. Click "Add Record" to start.' : 'No transactions match the selected filters or search query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="hidden sm:inline">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="border-l border-gray-300 pl-4 h-4 flex items-center">
              Showing {totalItems === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + itemsPerPage, totalItems)} of {totalItems}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <RecurringExpensesModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        recurringExpenses={recurringExpenses}
        onAdd={onAddRecurring}
        onDelete={onDeleteRecurring}
        currencyConfig={currencyConfig}
        categories={allCategoryNames}
        members={members}
      />

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        currencyConfig={currencyConfig}
        categoryItems={categoryItems}
        members={members}
        expenseToEdit={selectedExpense}
      />

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setExpenseToDelete(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Transaction?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this record? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setExpenseToDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
