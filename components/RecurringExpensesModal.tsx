
import React, { useState, useMemo } from 'react';
import { RecurringExpense, RecurrenceFrequency, CurrencyConfig, TransactionType } from '../types';
import { FREQUENCIES, DEFAULT_CATEGORY_COLORS, PAYMENT_METHODS } from '../constants';
import { X, Plus, Trash2, RotateCw, AlertCircle } from 'lucide-react';
import { formatCurrency, convertToBase } from '../utils';
import { DatePicker } from './DatePicker';
import { CustomSelect } from './CustomSelect';

interface RecurringExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringExpenses: RecurringExpense[];
  onAdd: (expense: Omit<RecurringExpense, 'id'>) => void;
  onDelete: (id: string) => void;
  currencyConfig: CurrencyConfig;
  categories: string[];
  members: string[];
}

export const RecurringExpensesModal: React.FC<RecurringExpensesModalProps> = ({
  isOpen,
  onClose,
  recurringExpenses,
  onAdd,
  onDelete,
  currencyConfig,
  categories,
  members
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default new rule state
  const getInitialRuleState = () => ({
    description: '',
    amount: 0,
    category: categories[0] || 'Food',
    member: members[0] || 'General',
    frequency: RecurrenceFrequency.MONTHLY,
    nextDueDate: new Date().toISOString().split('T')[0],
    active: true,
    type: TransactionType.EXPENSE,
    paymentMethod: 'Cash'
  });

  const [newRule, setNewRule] = useState<Partial<RecurringExpense>>(getInitialRuleState());

  // Re-sync initial state if categories change or modal opens
  const activeCategories = useMemo(() => {
     // Ideally pass categoryItems to get colors, but for now we have strings. 
     // We can try to look up default colors if available or just use name.
     return categories.map(c => ({ value: c, label: c, color: DEFAULT_CATEGORY_COLORS[c] }));
  }, [categories]);

  const paymentMethodOptions = PAYMENT_METHODS.map(p => ({ value: p, label: p }));

  if (!isOpen) return null;

  const handleTypeChange = (type: TransactionType) => {
     setNewRule({
       ...newRule,
       type: type
     });
  };

  const handleAdd = () => {
    setError(null);
    if (newRule.description && newRule.amount && newRule.nextDueDate) {
      // Date validation
      const today = new Date().toISOString().split('T')[0];
      if (newRule.nextDueDate < today) {
        setError('Start Date cannot be in the past.');
        return;
      }

      // Store in Base Currency (USD)
      const baseAmount = convertToBase(newRule.amount, currencyConfig);

      onAdd({
        ...newRule as Omit<RecurringExpense, 'id'>,
        amount: baseAmount
      });
      setIsAdding(false);
      // Reset form
      setNewRule(getInitialRuleState());
    } else {
      setError('Please fill in all fields.');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setError(null);
  };

  // Currency Helpers for Input
  const isZeroDecimal = currencyConfig.code === 'JPY' || currencyConfig.code === 'VND';
  const step = isZeroDecimal ? '1' : '0.01';
  const placeholder = isZeroDecimal ? '0' : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <RotateCw className="text-blue-500" size={24} />
            Recurring Transactions
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-gray-500 mb-6 text-sm">
            Set up transactions that happen automatically (e.g., Subscriptions, Salary). The app will generate a new record whenever the due date is reached.
          </p>

          {/* Add New Rule Form */}
          {isAdding ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 animate-fade-in">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">New Recurring Rule</h3>
              
              {error && (
                <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 {/* Type Switcher Small */}
                <div className="col-span-full flex gap-2 mb-2">
                   <button 
                     onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                     className={`text-xs px-3 py-1 rounded-full border ${newRule.type === TransactionType.EXPENSE ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200'}`}
                   >
                     Expense
                   </button>
                   <button 
                     onClick={() => handleTypeChange(TransactionType.INCOME)}
                     className={`text-xs px-3 py-1 rounded-full border ${newRule.type === TransactionType.INCOME ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200'}`}
                   >
                     Income
                   </button>
                </div>

                <input
                  type="text"
                  placeholder="Description"
                  className="p-2 border border-blue-200 rounded text-sm w-full bg-white text-gray-900"
                  value={newRule.description}
                  onChange={e => setNewRule({ ...newRule, description: e.target.value })}
                />
                <div className="relative">
                  <span className="absolute left-2 top-2 text-gray-500 text-sm">{currencyConfig.symbol}</span>
                  <input
                    type="number"
                    step={step}
                    placeholder={placeholder}
                    className="p-2 pl-6 border border-blue-200 rounded text-sm w-full bg-white text-gray-900"
                    value={newRule.amount || ''}
                    onChange={e => setNewRule({ ...newRule, amount: parseFloat(e.target.value) })}
                    onBlur={() => {
                        if (newRule.amount) {
                            // Ensure display rounding
                            const val = parseFloat(newRule.amount.toString());
                            if(!isNaN(val)) {
                                // Just a visual refresh or internal round
                                setNewRule({...newRule, amount: parseFloat(val.toFixed(isZeroDecimal ? 0 : 2))});
                            }
                        }
                    }}
                  />
                </div>
                
                <CustomSelect
                  value={newRule.category || ''}
                  onChange={(val) => setNewRule({ ...newRule, category: val })}
                  options={activeCategories}
                  placeholder="Category"
                  className="bg-white"
                />

                <CustomSelect
                  value={newRule.member || ''}
                  onChange={(val) => setNewRule({ ...newRule, member: val })}
                  options={members.map(m => ({ value: m, label: m }))}
                  placeholder="Member"
                  className="bg-white"
                />

                <CustomSelect
                  value={newRule.paymentMethod || 'Cash'}
                  onChange={(val) => setNewRule({ ...newRule, paymentMethod: val })}
                  options={paymentMethodOptions}
                  placeholder="Method"
                  className="bg-white"
                />

                <CustomSelect
                  value={newRule.frequency || ''}
                  onChange={(val) => setNewRule({ ...newRule, frequency: val as RecurrenceFrequency })}
                  options={FREQUENCIES.map(f => ({ value: f, label: f }))}
                  placeholder="Frequency"
                  className="bg-white"
                />

                <div className="flex flex-col">
                  <span className="text-xs text-blue-600 mb-1">Start Date</span>
                  <DatePicker 
                    value={newRule.nextDueDate}
                    onChange={(date) => {
                      setNewRule({ ...newRule, nextDueDate: date });
                      if (error) setError(null);
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    className={error && newRule.nextDueDate && newRule.nextDueDate < new Date().toISOString().split('T')[0] ? 'border-red-300' : 'border-blue-200'}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                >
                  Save Rule
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 mb-6"
            >
              <Plus size={20} />
              Add Recurring Rule
            </button>
          )}

          {/* List of Rules */}
          <div className="space-y-3">
            {recurringExpenses.length === 0 && !isAdding && (
              <div className="text-center py-8 text-gray-400">
                No recurring rules set up yet.
              </div>
            )}
            
            {recurringExpenses.map(rule => (
              <div key={rule.id} className={`bg-white border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${rule.type === TransactionType.INCOME ? 'border-green-100 hover:border-green-300' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${rule.type === TransactionType.INCOME ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <RotateCw size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                       {rule.description}
                       {rule.type === TransactionType.INCOME && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Income</span>}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{rule.category}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{rule.member}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{rule.paymentMethod || 'Cash'}</span>
                      <span className="font-medium text-blue-600">{rule.frequency}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${rule.type === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900'}`}>
                      {rule.type === TransactionType.INCOME ? '+' : ''}
                      {formatCurrency(rule.amount, currencyConfig)}
                    </p>
                    <p className="text-xs text-gray-500">Next: {rule.nextDueDate}</p>
                  </div>
                  <button 
                    onClick={() => onDelete(rule.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
