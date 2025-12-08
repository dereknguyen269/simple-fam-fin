
import React, { useState, useEffect } from 'react';
import { Budget, CategoryItem, CurrencyConfig, TransactionType } from '../types';
import { X, Plus, Trash2, PieChart, AlertCircle } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { convertFromBase, convertToBase, formatCurrency } from '../utils';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  onAddBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  onUpdateBudget: (budget: Budget) => void;
  categoryItems: CategoryItem[];
  currencyConfig: CurrencyConfig;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgets,
  onAddBudget,
  onDeleteBudget,
  onUpdateBudget,
  categoryItems,
  currencyConfig
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filter categories that don't have budgets yet and are Expenses
  const availableCategories = categoryItems
    .filter(c => c.type === TransactionType.EXPENSE && !budgets.some(b => b.category === c.name))
    .map(c => ({ value: c.name, label: c.name, color: c.color }));

  const handleAdd = () => {
    if (!newCategory || !newLimit) {
      setError('Please select a category and limit.');
      return;
    }

    const limit = parseFloat(newLimit);
    if (isNaN(limit) || limit <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const baseLimit = convertToBase(limit, currencyConfig);

    onAddBudget({
      id: Math.random().toString(36).substr(2, 9),
      category: newCategory,
      limit: baseLimit,
      period: 'MONTHLY'
    });

    setNewCategory('');
    setNewLimit('');
    setError(null);
  };

  const isZeroDecimal = currencyConfig.code === 'JPY' || currencyConfig.code === 'VND';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PieChart className="text-purple-600" size={24} />
            Manage Budgets
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Add Form */}
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">Set Monthly Limit</h3>
            <div className="flex flex-col gap-3">
              <CustomSelect 
                value={newCategory}
                onChange={setNewCategory}
                options={availableCategories}
                placeholder={availableCategories.length === 0 ? "All categories have budgets" : "Select Category"}
                disabled={availableCategories.length === 0}
                className="bg-white"
              />
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencyConfig.symbol}</span>
                   <input 
                     type="number"
                     value={newLimit}
                     onChange={e => setNewLimit(e.target.value)}
                     placeholder="0.00"
                     className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                   />
                </div>
                <button 
                  onClick={handleAdd}
                  disabled={!newCategory || !newLimit}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> Add
                </button>
              </div>
              {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
            </div>
          </div>

          {/* List */}
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Active Budgets</h3>
          <div className="space-y-3">
            {budgets.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No budgets set yet.</p>}
            
            {budgets.map(budget => {
              const displayLimit = convertFromBase(budget.limit, currencyConfig).toFixed(isZeroDecimal ? 0 : 2);
              
              return (
                <div key={budget.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div>
                    <div className="font-semibold text-gray-800">{budget.category}</div>
                    <div className="text-xs text-gray-500">Monthly Limit: <span className="font-medium text-gray-700">{currencyConfig.symbol}{displayLimit}</span></div>
                  </div>
                  <button 
                    onClick={() => onDeleteBudget(budget.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
