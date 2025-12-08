
import React, { useState } from 'react';
import { SavingsGoal, CurrencyConfig, Expense, TransactionType, CategoryItem, Wallet } from '../types';
import { Plus, Target, Calendar, Pencil, Trash2, TrendingUp, Clock, Wallet as WalletIcon, ArrowRightLeft, Trophy, AlertCircle } from 'lucide-react';
import { formatCurrency, hexToRgba, convertToBase } from '../utils';
import { GoalModal } from './GoalModal';
import { WalletModal } from './WalletModal';
import { TransferModal } from './TransferModal';
import { ConfirmDialog } from './ConfirmDialog';

interface GoalsViewProps {
  goals: SavingsGoal[];
  wallets: Wallet[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  
  onAddWallet: (wallet: Omit<Wallet, 'id'>) => void;
  onUpdateWallet: (wallet: Wallet) => void;
  onDeleteWallet: (id: string) => void;
  
  onTransfer: (data: any) => void;

  currencyConfig: CurrencyConfig;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void; // Legacy
  categoryItems: CategoryItem[];
  members: string[];
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  wallets,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddWallet,
  onUpdateWallet,
  onDeleteWallet,
  onTransfer,
  currencyConfig,
  onAddExpense, // Keep for backward compat or specialized use
  categoryItems,
  members
}) => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaults, setTransferDefaults] = useState({ sourceId: 'main', destId: '' });

  // Confirmation Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'success' | 'info';
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

  // Filter out Main wallet for the "Other Wallets" display
  const displayWallets = wallets.filter(w => w.id !== 'main');
  
  // Check if transfer is possible (Needs at least 2 entities total)
  const canTransfer = (wallets.length + goals.length) >= 2;

  // --- Handlers ---

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setIsWalletModalOpen(true);
  };

  const handleFinishGoal = (goal: SavingsGoal) => {
    if (goal.currentAmount <= 0.01) {
        setConfirmState({
            isOpen: true,
            type: 'info',
            title: 'Goal Empty',
            message: 'This goal has no funds to withdraw.',
            isAlert: true,
            confirmText: 'OK'
        });
        return;
    }

    setConfirmState({
        isOpen: true,
        type: 'success',
        title: 'Finish Goal?',
        message: `Congratulations on reaching your goal! This will withdraw ${formatCurrency(goal.currentAmount, currencyConfig)} from "${goal.name}" to your Main Wallet.`,
        confirmText: 'Withdraw Funds',
        action: () => {
            onTransfer({
                sourceId: goal.id,
                destId: 'main',
                amount: goal.currentAmount,
                date: new Date().toISOString().split('T')[0],
                description: `Goal Finished: ${goal.name}`
            });
        }
    });
  };

  const handleDeleteGoal = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    // Strict check: Balance must be zero (tolerance for float errors < 0.01)
    if (goal.currentAmount > 0.01) {
        setConfirmState({
            isOpen: true,
            type: 'warning',
            title: 'Cannot Delete Goal',
            message: `You cannot delete the goal "${goal.name}" because it still has funds (${formatCurrency(goal.currentAmount, currencyConfig)}). Please withdraw or transfer the funds first.`,
            isAlert: true, // This hides the confirm button, acting as a blocker
            confirmText: 'Understood'
        });
        return;
    }

    setConfirmState({
        isOpen: true,
        type: 'danger',
        title: 'Delete Goal?',
        message: `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
        confirmText: 'Delete Goal',
        isAlert: false,
        action: () => onDeleteGoal(id)
    });
  };

  const handleDeleteWallet = (id: string) => {
    const wallet = wallets.find(w => w.id === id);
    if (!wallet) return;

    if (Math.abs(wallet.balance) > 0.01) {
        setConfirmState({
            isOpen: true,
            type: 'warning',
            title: 'Cannot Delete Wallet',
            message: `The wallet "${wallet.name}" has a non-zero balance (${formatCurrency(wallet.balance, currencyConfig)}). Please transfer funds or zero it out before deleting.`,
            isAlert: true,
            confirmText: 'Understood'
        });
        return;
    }
    setConfirmState({
        isOpen: true,
        type: 'danger',
        title: 'Delete Wallet?',
        message: `Are you sure you want to delete "${wallet.name}"? Transactions associated with it will lose their reference.`,
        confirmText: 'Delete Wallet',
        action: () => onDeleteWallet(id)
    });
  };

  const handleSaveGoal = (goalData: Partial<SavingsGoal>) => {
    if (editingGoal) {
      onUpdateGoal({ ...editingGoal, ...goalData } as SavingsGoal);
    } else {
      onAddGoal(goalData as Omit<SavingsGoal, 'id'>);
    }
  };

  const handleSaveWallet = (walletData: Partial<Wallet>) => {
    if (editingWallet) {
        onUpdateWallet({ ...editingWallet, ...walletData } as Wallet);
    } else {
        onAddWallet(walletData as Omit<Wallet, 'id'>);
    }
  };

  const openTransfer = (sourceId: string = 'main', destId: string = '') => {
      setTransferDefaults({ sourceId, destId });
      setIsTransferModalOpen(true);
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const end = new Date(deadline);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-wrap gap-3 justify-end sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 py-2 border-b border-gray-200">
         <div className="group relative">
            <button 
              onClick={() => { setTransferDefaults({sourceId:'main', destId:''}); setIsTransferModalOpen(true); }}
              disabled={!canTransfer}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all font-medium text-sm ${
                canTransfer 
                  ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50' 
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft size={16} />
              Transfer Funds
            </button>
            {!canTransfer && (
              <div className="absolute right-0 mt-2 w-48 p-2 bg-black/80 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                You need at least two wallets or goals to transfer funds.
              </div>
            )}
         </div>

         <button 
           onClick={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
           className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all font-medium text-sm"
         >
           <WalletIcon size={16} />
           Add Wallet
         </button>
         <button 
           onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
           className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all font-medium text-sm"
         >
           <Plus size={16} />
           New Goal
         </button>
      </div>

      {/* SECTION 1: GOALS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="text-blue-600" size={24} />
            Savings Goals
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {goals.map(goal => {
            const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
            const daysLeft = getDaysRemaining(goal.deadline);
            
            return (
                <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition-all">
                <div className="h-2 w-full absolute top-0 left-0" style={{ backgroundColor: goal.color }}></div>
                
                <div className="p-6 pt-7">
                    <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-full bg-gray-50 border border-gray-100">
                        <Target size={24} style={{ color: goal.color }} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                        onClick={() => handleFinishGoal(goal)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Finish & Withdraw"
                        >
                        <Trophy size={16} />
                        </button>
                        <button 
                        onClick={() => handleEditGoal(goal)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Goal"
                        >
                        <Pencil size={16} />
                        </button>
                        <button 
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Goal"
                        >
                        <Trash2 size={16} />
                        </button>
                    </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-1">{goal.name}</h3>
                    
                    <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(goal.currentAmount, currencyConfig)}</span>
                    <span className="text-sm text-gray-400">of {formatCurrency(goal.targetAmount, currencyConfig)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-2 shadow-inner border border-gray-100">
                    <div 
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{ 
                            width: `${progress}%`, 
                            background: `linear-gradient(90deg, ${goal.color}, ${hexToRgba(goal.color, 0.85)})`,
                            boxShadow: `0 2px 4px ${hexToRgba(goal.color, 0.2)}`
                        }}
                    >
                        <div className="absolute inset-0 w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                    </div>
                    </div>
                    
                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-6">
                    <span>{progress.toFixed(0)}% Saved</span>
                    <span>{formatCurrency(remaining, currencyConfig)} to go</span>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                    {goal.deadline ? (
                        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${daysLeft !== null && daysLeft < 30 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            <Calendar size={12} />
                            {daysLeft !== null && daysLeft < 0 ? 'Overdue' : daysLeft !== null ? `${daysLeft} days left` : 'No date'}
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} /> No deadline
                        </div>
                    )}
                    
                    <button 
                        onClick={() => openTransfer('main', goal.id)}
                        className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                        <TrendingUp size={14} /> Add Funds
                    </button>
                    </div>
                </div>
                </div>
            );
            })}

            {goals.length === 0 && (
            <div className="col-span-full py-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Target size={20} />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">No active goals</h3>
                <p className="text-xs text-gray-500 mb-3">Create a goal to start saving.</p>
            </div>
            )}
        </div>
      </div>

      {/* SECTION 2: OTHER WALLETS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <WalletIcon className="text-green-600" size={24} />
            My Wallets
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayWallets.map(wallet => (
                <div key={wallet.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition-all">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-full bg-green-50 border border-green-100">
                                <WalletIcon size={24} className="text-green-600" />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                onClick={() => handleEditWallet(wallet)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                <Pencil size={16} />
                                </button>
                                <button 
                                onClick={() => handleDeleteWallet(wallet.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-1">{wallet.name}</h3>
                        <p className="text-sm text-gray-500 mb-4 capitalize">{wallet.type.toLowerCase()}</p>
                        
                        <div className="text-3xl font-bold text-gray-900 mb-6">
                            {formatCurrency(wallet.balance, currencyConfig)}
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                            <button 
                                onClick={() => openTransfer('main', wallet.id)}
                                className="flex-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <TrendingUp size={14} /> Deposit
                            </button>
                            <button 
                                onClick={() => openTransfer(wallet.id, 'main')}
                                className="flex-1 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <ArrowRightLeft size={14} /> Withdraw
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {displayWallets.length === 0 && (
                <div className="col-span-full py-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <WalletIcon size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">No additional wallets</h3>
                    <p className="text-xs text-gray-500 mb-3">Add buckets for savings, emergency funds, or cash.</p>
                </div>
            )}
        </div>
      </div>

      <GoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        onDelete={onDeleteGoal}
        currencyConfig={currencyConfig}
        goalToEdit={editingGoal}
      />

      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSave={handleSaveWallet}
        onDelete={onDeleteWallet}
        currencyConfig={currencyConfig}
        walletToEdit={editingWallet}
      />

      <TransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={onTransfer}
        wallets={wallets}
        goals={goals}
        currencyConfig={currencyConfig}
        defaultSourceId={transferDefaults.sourceId}
        defaultDestId={transferDefaults.destId}
      />

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
    </div>
  );
};
