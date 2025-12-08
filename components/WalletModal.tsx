
import React, { useState, useEffect } from 'react';
import { Wallet, CurrencyConfig } from '../types';
import { X, Wallet as WalletIcon, Trash2 } from 'lucide-react';
import { convertFromBase, convertToBase, formatCurrency } from '../utils';
import { ConfirmDialog } from './ConfirmDialog';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wallet: Partial<Wallet>) => void;
  onDelete?: (id: string) => void;
  currencyConfig: CurrencyConfig;
  walletToEdit?: Wallet | null;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  currencyConfig,
  walletToEdit
}) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState<string>('');
  
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
      if (walletToEdit) {
        setName(walletToEdit.name);
        // Display current balance
        setBalance(convertFromBase(walletToEdit.balance, currencyConfig).toFixed(isZeroDecimal ? 0 : 2));
      } else {
        setName('');
        setBalance('');
      }
    }
  }, [isOpen, walletToEdit, currencyConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const baseBalance = balance ? convertToBase(parseFloat(balance), currencyConfig) : 0;

    const payload: Partial<Wallet> = {
      id: walletToEdit?.id,
      name,
      type: 'SAVINGS'
    };

    if (!walletToEdit) {
        payload.balance = baseBalance;
    }

    onSave(payload);
    onClose();
  };

  const handleDelete = () => {
    if (walletToEdit && onDelete) {
        if (Math.abs(walletToEdit.balance) > 0.01) {
            setConfirmState({
                isOpen: true,
                type: 'warning',
                title: 'Cannot Delete Wallet',
                message: `This wallet has a non-zero balance (${formatCurrency(walletToEdit.balance, currencyConfig)}). Please transfer funds or zero it out before deleting.`,
                isAlert: true,
                confirmText: 'Understood'
            });
            return;
        }

        setConfirmState({
            isOpen: true,
            type: 'danger',
            title: 'Delete Wallet?',
            message: `Are you sure you want to delete "${walletToEdit.name}"? Transactions associated with it will lose their reference.`,
            confirmText: 'Delete Wallet',
            action: () => {
                onDelete(walletToEdit.id);
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
              <WalletIcon className="text-green-600" size={24} />
              {walletToEdit ? 'Edit Wallet' : 'New Wallet'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Emergency Fund, Crypto"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none placeholder-gray-400 text-gray-900"
              />
            </div>

            {!walletToEdit ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance ({currencyConfig.symbol})</label>
                <input
                  type="number"
                  step={isZeroDecimal ? '1' : '0.01'}
                  placeholder="0"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none placeholder-gray-400 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">This will create an initial deposit transaction.</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold">Current Balance</p>
                  <p className="text-xl font-bold text-gray-800">{formatCurrency(walletToEdit.balance, currencyConfig)}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              {walletToEdit && onDelete && walletToEdit.id !== 'main' && (
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
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                  >
                  Save Wallet
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
