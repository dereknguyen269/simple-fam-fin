
import React, { useState, useEffect } from 'react';
import { SavingsGoal, CurrencyConfig } from '../types';
import { X, Target, Trash2 } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { convertFromBase, convertToBase, formatCurrency } from '../utils';
import { ConfirmDialog } from './ConfirmDialog';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<SavingsGoal>) => void;
  onDelete?: (id: string) => void;
  currencyConfig: CurrencyConfig;
  goalToEdit?: SavingsGoal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  currencyConfig,
  goalToEdit
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#3B82F6');

  // Confirmation State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning';
    title: string;
    message: string;
    action?: () => void;
    isAlert?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    type: 'danger',
    title: '',
    message: ''
  });

  const isZeroDecimal = currencyConfig.code === 'JPY' || currencyConfig.code === 'VND';

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setName(goalToEdit.name);
        setTargetAmount(convertFromBase(goalToEdit.targetAmount, currencyConfig).toFixed(isZeroDecimal ? 0 : 2));
        setCurrentAmount(convertFromBase(goalToEdit.currentAmount, currencyConfig).toFixed(isZeroDecimal ? 0 : 2));
        setDeadline(goalToEdit.deadline || '');
        setColor(goalToEdit.color);
      } else {
        // Reset
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setDeadline('');
        setColor('#3B82F6');
      }
    }
  }, [isOpen, goalToEdit, currencyConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    // Convert display amounts back to Base (USD)
    const baseTarget = convertToBase(parseFloat(targetAmount), currencyConfig);
    const baseCurrent = convertToBase(parseFloat(currentAmount) || 0, currencyConfig);

    onSave({
      id: goalToEdit?.id,
      name,
      targetAmount: baseTarget,
      currentAmount: baseCurrent,
      deadline,
      color
    });
    onClose();
  };

  const handleDelete = () => {
    if (goalToEdit && onDelete) {
        if (goalToEdit.currentAmount > 0.01) {
             setConfirmState({
                isOpen: true,
                type: 'warning',
                title: 'Cannot Delete Goal',
                message: `This goal has saved funds (${formatCurrency(goalToEdit.currentAmount, currencyConfig)}). Please transfer funds out first.`,
                isAlert: true,
                confirmText: 'Understood'
             });
             return;
        }

        setConfirmState({
            isOpen: true,
            type: 'danger',
            title: 'Delete Goal?',
            message: `Are you sure you want to delete "${goalToEdit.name}"? This action cannot be undone.`,
            confirmText: 'Delete Goal',
            action: () => {
                onDelete(goalToEdit.id);
                onClose();
            }
        });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Target className="text-blue-600" size={24} />
              {goalToEdit ? 'Edit Goal' : 'New Financial Goal'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
              <input
                type="text"
                required
                placeholder="e.g., New Car, Dream Home"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target ({currencyConfig.symbol})</label>
                <input
                  type="number"
                  step={isZeroDecimal ? '1' : '0.01'}
                  required
                  placeholder="0"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saved So Far ({currencyConfig.symbol})</label>
                <input
                  type="number"
                  step={isZeroDecimal ? '1' : '0.01'}
                  placeholder="0"
                  value={currentAmount}
                  onChange={e => setCurrentAmount(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <DatePicker 
                  value={deadline} 
                  onChange={setDeadline} 
                  placeholder="Optional"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color Code</label>
                <div className="flex items-center gap-2 h-10 border border-gray-300 rounded-lg px-2 bg-white">
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs text-gray-500">{color}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              {goalToEdit && onDelete && (
                  <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                      <Trash2 size={16} /> Delete
                  </button>
              )}
              
              <div className="flex gap-3 ml-auto">
                  <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                  Cancel
                  </button>
                  <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                  Save Goal
                  </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        isAlert={confirmState.isAlert}
        confirmText={confirmState.confirmText}
      />
    </>
  );
};
