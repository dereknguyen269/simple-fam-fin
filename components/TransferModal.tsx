
import React, { useState, useEffect } from 'react';
import { Wallet, CurrencyConfig, SavingsGoal } from '../types';
import { X, ArrowRightLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { convertToBase, formatCurrency, convertFromBase } from '../utils';
import { CustomSelect } from './CustomSelect';
import { DatePicker } from './DatePicker';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (data: { 
    sourceId: string; 
    destId: string; 
    amount: number; 
    date: string; 
    description: string;
  }) => void;
  wallets: Wallet[];
  goals: SavingsGoal[];
  currencyConfig: CurrencyConfig;
  defaultSourceId?: string;
  defaultDestId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onTransfer,
  wallets,
  goals,
  currencyConfig,
  defaultSourceId = 'main',
  defaultDestId = ''
}) => {
  const [sourceId, setSourceId] = useState(defaultSourceId);
  const [destId, setDestId] = useState(defaultDestId);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSourceId(defaultSourceId || 'main');
      setDestId(defaultDestId || '');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setError(null);
    }
  }, [isOpen, defaultSourceId, defaultDestId]);

  if (!isOpen) return null;

  const getBalance = (id: string): number => {
    const wallet = wallets.find(w => w.id === id);
    if (wallet) return wallet.balance;
    const goal = goals.find(g => g.id === id);
    if (goal) return goal.currentAmount;
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sourceId || !destId) {
      setError('Please select both source and destination.');
      return;
    }
    if (sourceId === destId) {
      setError('Source and destination cannot be the same.');
      return;
    }
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const baseAmount = convertToBase(val, currencyConfig);
    const sourceBalance = getBalance(sourceId);

    // Check balance in base currency
    if (sourceBalance < baseAmount) {
        setError(`Insufficient funds. Max transfer: ${formatCurrency(sourceBalance, currencyConfig)}`);
        return;
    }

    onTransfer({
      sourceId,
      destId,
      amount: baseAmount,
      date,
      description: description || 'Fund Transfer'
    });
    onClose();
  };

  const walletOptions = wallets.map(w => ({ value: w.id, label: w.name + (w.id === 'main' ? ' (Main)' : '') }));
  const goalOptions = goals.map(g => ({ value: g.id, label: `Goal: ${g.name}`, color: g.color }));
  
  // Helpers to build filtered lists
  const buildOptions = (excludeId: string) => {
    const opts = [];
    const filteredWallets = walletOptions.filter(w => w.value !== excludeId);
    const filteredGoals = goalOptions.filter(g => g.value !== excludeId);

    if (filteredWallets.length > 0) {
        if (filteredGoals.length > 0) opts.push({ value: 'wallets_header', label: '--- Wallets ---', disabled: true });
        opts.push(...filteredWallets);
    }
    if (filteredGoals.length > 0) {
        opts.push({ value: 'goals_header', label: '--- Goals ---', disabled: true });
        opts.push(...filteredGoals);
    }
    return opts;
  };

  const sourceOptions = buildOptions(destId);
  const destOptions = buildOptions(sourceId);

  const sourceBalance = getBalance(sourceId);
  const destBalance = destId ? getBalance(destId) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowRightLeft className="text-blue-600" size={24} />
            Transfer Funds
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="flex items-center gap-4">
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
               <CustomSelect 
                 value={sourceId}
                 onChange={setSourceId}
                 options={sourceOptions}
                 className="bg-white"
               />
               <p className="text-xs text-gray-500 mt-1 text-right">
                 Available: <span className="font-semibold text-gray-700">{formatCurrency(sourceBalance, currencyConfig)}</span>
               </p>
             </div>
             <div className="pt-1 text-gray-400">
               <ArrowRight size={20} />
             </div>
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
               <CustomSelect 
                 value={destId}
                 onChange={setDestId}
                 options={destOptions}
                 className="bg-white"
                 placeholder="Select..."
               />
                {destId && (
                   <p className="text-xs text-gray-500 mt-1 text-right">
                     Current: <span className="font-semibold text-gray-700">{formatCurrency(destBalance, currencyConfig)}</span>
                   </p>
                )}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({currencyConfig.symbol})</label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={amount}
                onChange={e => {
                    setAmount(e.target.value);
                    if(error) setError(null);
                }}
                className={`w-full p-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900 ${error ? 'border-red-300' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <DatePicker 
                value={date} 
                onChange={setDate} 
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g., Monthly Savings"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2"
            >
              Transfer Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
