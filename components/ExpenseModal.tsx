
import React, { useState, useEffect, useMemo } from 'react';
import { Expense, RecurrenceFrequency, CurrencyConfig, TransactionType, CategoryItem } from '../types';
import { FREQUENCIES, PAYMENT_METHODS } from '../constants';
import { X, Save, Tag, User, FileText, RotateCw, ArrowDownCircle, ArrowUpCircle, CheckCircle, Calculator, Delete, AlertTriangle, CreditCard } from 'lucide-react';
import { convertFromBase } from '../utils';
import { DatePicker } from './DatePicker';
import { CustomSelect } from './CustomSelect';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Expense>) => void;
  currencyConfig: CurrencyConfig;
  categoryItems: CategoryItem[];
  members: string[];
  expenseToEdit?: Expense | null;
  defaultValues?: Partial<Expense>;
}

type ExpenseFormData = Partial<Omit<Expense, 'amount'>> & { amount?: string | number };

const safeEvaluate = (str: string) => {
  try {
    // Basic sanitization: only allow digits, operators, dot, parens
    if (!/^[0-9+\-*/.() ]+$/.test(str)) return 'Error';
    // eslint-disable-next-line no-new-func
    const res = new Function('return ' + str)();
    if (!isFinite(res) || isNaN(res)) return 'Error';
    return String(res);
  } catch {
    return 'Error';
  }
};

// Format number with thousand separator (e.g., 20000 → 20,000)
const formatNumberWithSeparator = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return '';

  const numStr = String(value);
  const parts = numStr.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
};

// Parse formatted number back to plain number string (e.g., 20,000 → 20000)
const parseFormattedNumber = (formatted: string): string => {
  return formatted.replace(/,/g, '');
};

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currencyConfig,
  categoryItems,
  members,
  expenseToEdit,
  defaultValues
}) => {
  // Helpers
  const getCategoriesByType = (type: TransactionType) => categoryItems.filter(c => c.type === type).map(c => c.name);

  const getInitialState = (): ExpenseFormData => {
    // Default to Expense
    const defaultType = defaultValues?.type || TransactionType.EXPENSE;
    const initialCats = getCategoriesByType(defaultType);

    return {
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '' as string | number,
      category: initialCats[0] || '',
      member: members[0] || 'General',
      recurrence: undefined,
      type: defaultType,
      paymentMethod: 'Cash',
      ...defaultValues // Override defaults with passed values
    };
  };

  const [formData, setFormData] = useState<ExpenseFormData>(getInitialState());
  const [initialState, setInitialState] = useState<ExpenseFormData>(getInitialState());
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');

  // Filter available categories based on current form type
  const availableCategories = useMemo(() => {
    const type = formData.type || TransactionType.EXPENSE;
    return getCategoriesByType(type);
  }, [formData.type, categoryItems]);

  // Track the expense ID to detect when we're editing a different expense
  const [lastExpenseId, setLastExpenseId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      // Only reset form when:
      // 1. Modal just opened (isOpen changed)
      // 2. Editing a different expense (expenseToEdit.id changed)
      // 3. Switching between edit mode and add mode

      // Use a special marker for add mode to distinguish from edit mode
      const currentExpenseId = expenseToEdit?.id ?? '__ADD_MODE__';
      const shouldReset = lastExpenseId !== currentExpenseId;

      if (shouldReset) {
        let startState: ExpenseFormData;

        if (expenseToEdit) {
          // Edit Mode: Populate form with existing data
          // Convert base amount to display currency
          const isZeroDecimal = currencyConfig.code === 'JPY' || currencyConfig.code === 'VND';
          const displayAmount = convertFromBase(expenseToEdit.amount, currencyConfig).toFixed(isZeroDecimal ? 0 : 2);

          startState = {
            ...expenseToEdit,
            amount: displayAmount,
            paymentMethod: expenseToEdit.paymentMethod || 'Cash'
          };
        } else {
          // Add Mode: Reset to default (merged with defaultValues)
          startState = getInitialState();
        }

        // Pre-validate category to ensure initialState matches any potential auto-correction
        const type = startState.type || TransactionType.EXPENSE;
        const validCategories = getCategoriesByType(type);
        const currentCategory = startState.category;

        // If category is invalid or empty but we have options, pick the first one
        if (validCategories.length > 0) {
          if (!currentCategory || !validCategories.includes(currentCategory)) {
            startState.category = validCategories[0];
          }
        }

        setFormData(startState);
        setInitialState(startState);
        setShowCalculator(false);
        setCalcExpression('');
        setShowConfirmClose(false);
        setLastExpenseId(currentExpenseId);
      }
    } else {
      // Reset tracking ID when closed so next open triggers a full reset to ensure fresh state (e.g. new Date)
      setLastExpenseId(undefined);
    }
  }, [isOpen, expenseToEdit?.id]);

  // When type changes, ensure category is valid for that type
  useEffect(() => {
    const currentCategory = formData.category;
    const type = formData.type || TransactionType.EXPENSE;
    const validCategories = getCategoriesByType(type);

    const needsCorrection = (currentCategory && !validCategories.includes(currentCategory) && validCategories.length > 0) ||
      (!currentCategory && validCategories.length > 0);

    if (needsCorrection) {
      const newCategory = validCategories[0];
      setFormData(prev => ({ ...prev, category: newCategory }));

      setInitialState(prev => {
        if (prev.category === currentCategory) {
          return { ...prev, category: newCategory };
        }
        return prev;
      });
    }
  }, [formData.type, categoryItems, formData.category]);

  // Calculator Logic
  const handleCalcInput = (key: string) => {
    if (key === 'C') {
      setCalcExpression('');
    } else if (key === 'backspace') {
      setCalcExpression(prev => prev.slice(0, -1));
    } else if (key === '=') {
      const res = safeEvaluate(calcExpression);
      if (res !== 'Error') {
        setCalcExpression(res);
        setFormData(prev => ({ ...prev, amount: res }));
      } else {
        setCalcExpression('Error');
      }
    } else {
      // If display shows Error, reset on new input
      if (calcExpression === 'Error') {
        setCalcExpression(key);
      } else {
        setCalcExpression(prev => prev + key);
      }
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    // Check if form data has changed from initial state
    const isDirty = formData.description !== initialState.description ||
      formData.amount !== initialState.amount ||
      formData.date !== initialState.date ||
      formData.category !== initialState.category ||
      formData.member !== initialState.member ||
      formData.recurrence !== initialState.recurrence ||
      formData.paymentMethod !== initialState.paymentMethod;

    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let currentAmount = formData.amount;

    // If calculator is open, try to evaluate and save that result
    if (showCalculator) {
      const res = safeEvaluate(calcExpression);
      if (res === 'Error') {
        alert("Invalid calculation");
        return;
      }
      if (res !== '') {
        currentAmount = res;
      }
    }

    const finalAmount = (currentAmount !== undefined && currentAmount !== '')
      ? parseFloat(currentAmount.toString())
      : 0;

    const dataToSave: Partial<Expense> = {
      ...formData,
      amount: finalAmount
    }

    onSave(dataToSave);
    // Close immediately without delay for better UX
    onClose();
  };

  // Currency formatting helpers
  const isZeroDecimal = currencyConfig.code === 'JPY' || currencyConfig.code === 'VND';
  const step = isZeroDecimal ? '1' : '0.01';
  const placeholder = isZeroDecimal ? '0' : '0.00';

  const handleAmountBlur = () => {
    if (formData.amount !== '' && formData.amount !== undefined) {
      const val = parseFloat(formData.amount.toString());
      if (!isNaN(val)) {
        setFormData({
          ...formData,
          amount: val.toFixed(isZeroDecimal ? 0 : 2)
        });
      }
    }
  };

  const isIncome = formData.type === TransactionType.INCOME;
  const isEditMode = !!expenseToEdit;
  const ThemeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;

  const headerIconBg = isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600';
  const amountContainerClass = isIncome ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100';
  const amountLabelClass = isIncome ? 'text-green-700' : 'text-red-700';
  const amountSymbolClass = isIncome ? 'text-green-600' : 'text-red-600';
  const amountInputClass = isIncome
    ? 'text-green-800 placeholder-green-300 border-green-200 focus:border-green-500'
    : 'text-red-800 placeholder-red-300 border-red-200 focus:border-red-500';
  const saveButtonClass = isIncome ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

  // Calculator button styles
  const calcBtnBase = "p-2 rounded-lg text-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center";
  const calcBtnPrimary = "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200";
  const calcBtnSecondary = isIncome
    ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
    : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200";
  const calcBtnAction = isIncome
    ? "bg-green-600 text-white hover:bg-green-700"
    : "bg-red-600 text-white hover:bg-red-700";

  // Prepare options for custom select
  const categoryOptions = availableCategories.map(cat => {
    const item = categoryItems.find(c => c.name === cat);
    return { value: cat, label: cat, color: item?.color };
  });

  const memberOptions = members.map(m => ({ value: m, label: m }));

  const recurrenceOptions = [
    { value: '', label: 'One-time' },
    ...FREQUENCIES.map(f => ({ value: f, label: f }))
  ];

  const paymentMethodOptions = PAYMENT_METHODS.map(p => ({ value: p, label: p }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className={`p-1.5 sm:p-2 rounded-lg ${headerIconBg}`}>
              <ThemeIcon size={18} className="sm:w-5 sm:h-5" />
            </div>
            {isEditMode
              ? (isIncome ? 'Edit Income' : 'Edit Expense')
              : (isIncome ? 'Add Income' : 'Add Expense')
            }
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar pb-24 sm:pb-6">
          <form id="expense-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

            {/* Type Switcher Segmented Control */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-3 sm:py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 min-h-[44px] ${!isIncome
                  ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                onClick={() => setFormData({ ...formData, type: TransactionType.EXPENSE })}
              >
                <ArrowDownCircle size={16} />
                Expense
              </button>
              <button
                type="button"
                className={`flex-1 py-3 sm:py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 min-h-[44px] ${isIncome
                  ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                onClick={() => setFormData({ ...formData, type: TransactionType.INCOME })}
              >
                <ArrowUpCircle size={16} />
                Income
              </button>
            </div>

            {/* Amount Section with Calculator Toggle */}
            <div className={`p-4 rounded-xl border transition-colors duration-200 ${amountContainerClass}`}>
              <div className="flex justify-between items-center mb-1">
                <div className="w-4"></div> {/* Spacer */}
                <label className={`block text-xs font-semibold uppercase tracking-wide ${amountLabelClass}`}>
                  Amount ({currencyConfig.code})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!showCalculator) {
                      // Convert current val to string for calc
                      setCalcExpression(formData.amount ? String(formData.amount) : '');
                    } else {
                      // If switching back, try to apply valid result
                      const res = safeEvaluate(calcExpression);
                      if (res !== 'Error' && res !== '') {
                        setFormData(prev => ({ ...prev, amount: res }));
                      }
                    }
                    setShowCalculator(!showCalculator);
                  }}
                  className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors ${isIncome ? 'text-green-700' : 'text-red-700'}`}
                  title={showCalculator ? "Switch to Input" : "Open Calculator"}
                >
                  {showCalculator ? <FileText size={18} /> : <Calculator size={18} />}
                </button>
              </div>


              {showCalculator ? (
                <div className="animate-in fade-in slide-in-from-top-2">
                  {/* Calc Display */}
                  <div className={`w-full bg-white/60 p-3 rounded-lg text-right text-2xl font-mono font-bold tracking-wider mb-3 overflow-x-auto whitespace-nowrap border ${isIncome ? 'border-green-200 text-green-900' : 'border-red-200 text-red-900'}`}>
                    {(() => {
                      // Format the display: show formatted number if it's just a number, otherwise show expression as-is
                      const expr = calcExpression || '0';
                      // Check if expression is just a number (no operators)
                      if (/^[\d.]+$/.test(expr)) {
                        return formatNumberWithSeparator(expr);
                      }
                      return expr;
                    })()}
                  </div>

                  {/* Calc Grid */}
                  <div className="grid grid-cols-4 gap-2 select-none">
                    <button type="button" onClick={() => handleCalcInput('C')} className={calcBtnSecondary}>C</button>
                    <button type="button" onClick={() => handleCalcInput('/')} className={calcBtnSecondary}>/</button>
                    <button type="button" onClick={() => handleCalcInput('*')} className={calcBtnSecondary}>*</button>
                    <button type="button" onClick={() => handleCalcInput('backspace')} className={calcBtnSecondary}><Delete size={20} /></button>

                    <button type="button" onClick={() => handleCalcInput('7')} className={calcBtnPrimary}>7</button>
                    <button type="button" onClick={() => handleCalcInput('8')} className={calcBtnPrimary}>8</button>
                    <button type="button" onClick={() => handleCalcInput('9')} className={calcBtnPrimary}>9</button>
                    <button type="button" onClick={() => handleCalcInput('-')} className={calcBtnSecondary}>-</button>

                    <button type="button" onClick={() => handleCalcInput('4')} className={calcBtnPrimary}>4</button>
                    <button type="button" onClick={() => handleCalcInput('5')} className={calcBtnPrimary}>5</button>
                    <button type="button" onClick={() => handleCalcInput('6')} className={calcBtnPrimary}>6</button>
                    <button type="button" onClick={() => handleCalcInput('+')} className={calcBtnSecondary}>+</button>

                    <button type="button" onClick={() => handleCalcInput('1')} className={calcBtnPrimary}>1</button>
                    <button type="button" onClick={() => handleCalcInput('2')} className={calcBtnPrimary}>2</button>
                    <button type="button" onClick={() => handleCalcInput('3')} className={calcBtnPrimary}>3</button>
                    <button type="button" onClick={() => handleCalcInput('=')} className={`${calcBtnAction} row-span-2`}>=</button>

                    <button type="button" onClick={() => handleCalcInput('0')} className={`${calcBtnPrimary} col-span-2`}>0</button>
                    <button type="button" onClick={() => handleCalcInput('.')} className={calcBtnPrimary}>.</button>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-center text-center">
                  <span className={`text-3xl font-bold mr-2 ${amountSymbolClass}`}>{currencyConfig.symbol}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required={!showCalculator}
                    placeholder={placeholder}
                    className={`bg-transparent text-4xl font-bold w-48 text-center border-b-2 outline-none transition-colors ${amountInputClass}`}
                    value={formatNumberWithSeparator(formData.amount || '')}
                    onChange={e => {
                      const val = e.target.value;
                      // Remove commas for storage
                      const parsed = parseFormattedNumber(val);
                      // Validate: only allow numbers and one decimal point
                      if (parsed === '' || /^\d*\.?\d*$/.test(parsed)) {
                        setFormData({ ...formData, amount: parsed === '' ? '' : parsed });
                      }
                    }}
                    onBlur={handleAmountBlur}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FileText size={16} className="text-gray-400" />
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="What is this transaction?"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white text-gray-900"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date - Custom DatePicker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  className="bg-white"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <CreditCard size={16} className="text-gray-400" />
                  Payment
                </label>
                <CustomSelect
                  value={formData.paymentMethod || 'Cash'}
                  onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                  options={paymentMethodOptions}
                  placeholder="Select Method"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Tag size={16} className="text-gray-400" />
                  Category
                </label>
                <CustomSelect
                  value={formData.category || ''}
                  onChange={(val) => setFormData({ ...formData, category: val })}
                  options={categoryOptions}
                  placeholder={categoryOptions.length === 0 ? "No categories" : "Select Category"}
                  disabled={categoryOptions.length === 0}
                  className="bg-white"
                />
              </div>

              {/* Member */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User size={16} className="text-gray-400" />
                  Member
                </label>
                <CustomSelect
                  value={formData.member || ''}
                  onChange={(val) => setFormData({ ...formData, member: val })}
                  options={memberOptions}
                  placeholder="Select Member"
                  className="bg-white"
                />
              </div>
            </div>

            {/* Recurrence (Optional Row) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <RotateCw size={16} className="text-gray-400" />
                Repeat (Optional)
              </label>
              <CustomSelect
                value={formData.recurrence || ''}
                onChange={(val) => setFormData({ ...formData, recurrence: val ? val as RecurrenceFrequency : undefined })}
                options={recurrenceOptions}
                placeholder="Frequency"
                className="bg-white"
              />
            </div>
          </form>
        </div>

        {/* Footer - Fixed on mobile for better accessibility */}
        <div className="fixed sm:relative bottom-0 left-0 right-0 p-4 sm:p-4 border-t border-gray-100 bg-white sm:bg-gray-50 flex justify-end gap-3 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:shadow-none z-10">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 sm:px-5 py-3 sm:py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors min-h-[48px] sm:min-h-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="expense-form"
            className={`flex-1 sm:flex-none px-5 py-3 sm:py-2.5 text-sm font-medium text-white rounded-lg shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all transform active:scale-95 min-h-[48px] sm:min-h-0 ${saveButtonClass}`}
          >
            <Save size={18} />
            {isEditMode ? 'Update' : 'Save'} {isIncome ? 'Income' : 'Expense'}
          </button>
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      {showConfirmClose && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Discard Changes?</h3>
              <p className="text-sm text-gray-500 mb-6">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowConfirmClose(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => { setShowConfirmClose(false); onClose(); }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
