
import React, { useState, useMemo } from 'react';
import { Expense, CurrencyConfig, TransactionType, CategoryItem, Wallet, RecurringExpense } from '../types';
import { formatCurrency, convertFromBase, convertToBase, calculateNextDate } from '../utils';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  TrendingUp,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Wallet as WalletIcon,
  HelpCircle
} from 'lucide-react';
import { ExpenseModal } from './ExpenseModal';
import { Dialog } from './Dialog';

interface HomeProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onAddRecurring?: (expense: Omit<RecurringExpense, 'id'>) => void;
  currencyConfig: CurrencyConfig;
  categoryItems: CategoryItem[];
  members: string[];
  categoryColors?: Record<string, string>;
  wallets?: Wallet[];
  onUpdateExpense?: (expense: Expense) => void;
  onDeleteExpense?: (id: string) => void;
  onHelpClick?: () => void;
}

export const Home: React.FC<HomeProps> = ({
  expenses,
  onAddExpense,
  onAddRecurring,
  currencyConfig,
  categoryItems,
  members,
  categoryColors = {},
  wallets = [],
  onUpdateExpense,
  onDeleteExpense,
  onHelpClick
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter today's transactions (excluding transfers)
  const todayTransactions = useMemo(() => {
    return expenses
      .filter(e => e.date === today && e.type !== TransactionType.TRANSFER)
      .map(e => ({
        ...e,
        amount: convertFromBase(e.amount, currencyConfig)
      }))
      .sort((a, b) => {
        // Sort by id (most recent first) as proxy for time since we don't have time
        return b.id.localeCompare(a.id);
      });
  }, [expenses, today, currencyConfig]);

  // Calculate today's summary (excluding transfers)
  const todaySummary = useMemo(() => {
    const income = todayTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = todayTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, balance: income - expense };
  }, [todayTransactions]);

  const handleSaveTransaction = (data: Partial<Expense>) => {
    // Allow empty description - only validate amount and date
    if (data.amount !== undefined && data.date) {
      const baseAmount = convertToBase(data.amount, currencyConfig);
      const type = data.type || TransactionType.EXPENSE;
      const description = data.description || ''; // Ensure description is always a string

      if (editingExpense && onUpdateExpense) {
        onUpdateExpense({
          ...editingExpense,
          ...data,
          description, // Use sanitized description
          amount: baseAmount,
          category: data.category!,
          member: data.member!,
          type: type,
          paymentMethod: data.paymentMethod,
          walletId: data.walletId || 'main'
        } as Expense);
      } else {
        // Add Expense
        onAddExpense({
          date: data.date,
          description, // Use sanitized description
          amount: baseAmount,
          category: data.category!,
          member: data.member!,
          recurrence: data.recurrence,
          type: type,
          paymentMethod: data.paymentMethod,
          walletId: data.walletId || 'main'
        });

        // Add Recurring Rule if requested
        if (data.recurrence && onAddRecurring) {
          onAddRecurring({
            description: description || 'Recurring', // Fallback for recurring
            category: data.category!,
            amount: baseAmount,
            member: data.member!,
            frequency: data.recurrence,
            nextDueDate: calculateNextDate(data.date, data.recurrence),
            active: true,
            type: type,
            paymentMethod: data.paymentMethod,
            walletId: data.walletId || 'main'
          });
        }
      }
    }
    setEditingExpense(null);
  };

  const handleEditClick = (displayTransaction: Expense) => {
    // Find the original expense with base amount
    const original = expenses.find(e => e.id === displayTransaction.id);
    if (original) {
      setEditingExpense(original);
      setIsModalOpen(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (onDeleteExpense) {
      setDeleteId(id);
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = () => {
    if (deleteId && onDeleteExpense) {
      onDeleteExpense(deleteId);
    }
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-xl shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Calendar size={150} />
        </div>
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} />
              <span className="text-sm font-medium opacity-90">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Welcome Back!</h1>
            <p className="text-green-100">Here is your financial summary for today.</p>

            {/* Help & Tutorials Link */}
            {onHelpClick && (
              <button
                onClick={onHelpClick}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-white underline underline-offset-2 hover:text-green-50 transition-colors"
              >
                <HelpCircle size={16} />
                <span>Help & Tutorials</span>
              </button>
            )}
          </div>

          {/* Main Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-green-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-green-50 hover:scale-105 transition-all transform active:scale-95"
          >
            <Plus size={24} />
            <span className="text-lg">Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="text-green-600" size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Today's Income</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(todaySummary.income, { ...currencyConfig, rate: 1 })}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowDownCircle className="text-red-600" size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Today's Expenses</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(todaySummary.expense, { ...currencyConfig, rate: 1 })}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${todaySummary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
              <TrendingUp className={todaySummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'} size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Net Balance</h3>
          </div>
          <p className={`text-2xl font-bold ${todaySummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(todaySummary.balance, { ...currencyConfig, rate: 1 })}
          </p>
        </div>
      </div>

      {/* Today's Transactions List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            Today's Transactions
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {todayTransactions.length} {todayTransactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        {todayTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No transactions today</p>
            <p className="text-sm">Click the button above to add one.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {todayTransactions.map((transaction) => {
              const isIncome = transaction.type === TransactionType.INCOME;
              const categoryColor = categoryColors[transaction.category] || '#6B7280';

              return (
                <div
                  key={transaction.id}
                  onClick={() => handleEditClick(transaction)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4 w-full sm:flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      {isIncome ? (
                        <ArrowUpCircle size={24} style={{ color: categoryColor }} />
                      ) : (
                        <ArrowDownCircle size={24} style={{ color: categoryColor }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{transaction.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                        <span
                          className="px-2 py-0.5 rounded-full font-medium whitespace-nowrap max-w-[120px] sm:max-w-none truncate block"
                          style={{
                            backgroundColor: `${categoryColor}20`,
                            color: categoryColor
                          }}
                        >
                          {transaction.category}
                        </span>
                        <span>•</span>
                        <span>{transaction.member}</span>
                        {transaction.paymentMethod && (
                          <>
                            <span>•</span>
                            <span>{transaction.paymentMethod}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto text-right sm:ml-4 mt-3 sm:mt-0 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                    {/* On mobile: Date left, Amount right. On desktop: Amount top, Date bottom right */}
                    <p className="text-xs text-gray-400 sm:order-2 sm:mt-0.5">
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className={`text-lg font-bold sm:order-1 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, { ...currencyConfig, rate: 1 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(transaction.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTransaction}
        currencyConfig={currencyConfig}
        categoryItems={categoryItems}
        members={members}
        expenseToEdit={editingExpense}
      />

      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        type="error"
        confirmText="Delete"
        showCancel
      />
    </div>
  );
};
