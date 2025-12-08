
import React, { useState, useEffect } from 'react';
import { X, Save, Database, AlertCircle, Coins, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Copy, Check, FileSpreadsheet, RotateCcw, Trash2, Unplug, List, Plus, Pencil, ArrowUpCircle, ArrowDownCircle, User, Share2, Download, Upload } from 'lucide-react';
import { GoogleConfig, CurrencyCode, CategoryItem, TransactionType, MemberItem, UserProfile } from '../types';
import { getGoogleConfig, saveGoogleConfig, getCurrencyCode, saveCurrencyCode } from '../services/storageService';
import { AVAILABLE_CURRENCIES, CURRENCY_RATES, CURRENCY_SYMBOLS } from '../constants';
import { CustomSelect } from './CustomSelect';
import { Dialog } from './Dialog';

const ALLOWED_INCOME_CATEGORIES = ['Salary', 'Profit', 'Investment', 'Other', 'Gift', 'Bonus'];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: GoogleConfig) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  onCurrencyChange: (code: CurrencyCode) => void;
  onResetData: () => void;
  onClearData: () => void;
  categoryItems: CategoryItem[];
  members: MemberItem[];
  onUpdateCategoryItems: (items: CategoryItem[]) => void;
  onUpdateMembers: (mems: MemberItem[]) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  userProfile?: UserProfile | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  isConnected,
  onCurrencyChange,
  onResetData,
  onClearData,
  categoryItems,
  members,
  onUpdateCategoryItems,
  onUpdateMembers,
  onRenameCategory,
  userProfile }) => {
  const [config, setConfig] = useState<GoogleConfig>({
    clientId: '',
    apiKey: '',
    spreadsheetId: ''
  });

  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Local state for list editing
  const [localCategoryItems, setLocalCategoryItems] = useState<CategoryItem[]>([]);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const [localMembers, setLocalMembers] = useState<MemberItem[]>([]);
  const [editingMemId, setEditingMemId] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberDeleteId, setMemberDeleteId] = useState<string | null>(null);

  // Inputs
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newExpenseColor, setNewExpenseColor] = useState('#EF4444');

  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newIncomeColor, setNewIncomeColor] = useState('#10B981');

  const [newMember, setNewMember] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#6366f1');

  // Safe origin detection
  const [currentOrigin, setCurrentOrigin] = useState('');

  // Helper to show dialog
  const showDialog = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    onConfirm?: () => void,
    showCancel: boolean = false
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      showCancel
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }

    const savedConfig = getGoogleConfig();
    if (savedConfig) setConfig(savedConfig);

    const savedCurrency = getCurrencyCode();
    setCurrency(savedCurrency);
  }, [isOpen]);

  // Sync props to local state when opening
  useEffect(() => {
    if (isOpen) {
      setLocalCategoryItems(JSON.parse(JSON.stringify(categoryItems)));
      setLocalMembers(JSON.parse(JSON.stringify(members)));
      setEditingCatId(null);
      setEditingMemId(null);
      setMemberError(null);
      setMemberDeleteId(null);
    }
  }, [isOpen, categoryItems, members]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveGoogleConfig(config);
    saveCurrencyCode(currency);

    onConnect(config);
    onCurrencyChange(currency);

    // Process renames for parent to update expenses
    localCategoryItems.forEach(newItem => {
      const original = categoryItems.find(c => c.id === newItem.id);
      if (original && original.name !== newItem.name) {
        onRenameCategory(original.name, newItem.name);
      }
    });

    onUpdateCategoryItems(localCategoryItems);
    onUpdateMembers(localMembers);

    onClose();
  };

  const handleDisconnect = () => {
    showDialog(
      'Confirm Sign Out',
      'Are you sure you want to disconnect from Google Sheets?\n\nYour data will remain in local storage, but live sync will stop until you reconnect.',
      'warning',
      () => {
        onDisconnect();
      },
      true  // Show cancel button
    );
  };

  const copyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTemplate = () => {
    // Template might need updating if structure changes drastically, but for now standard csv works
    const headers = ['ID', 'Date', 'Type', 'Description', 'Category', 'Member', 'Amount', 'Recurrence'];
    const sampleRow = ['SAMPLE_ID', new Date().toISOString().split('T')[0], 'Expense', 'Sample Transaction', 'Food', 'General', '0.00', ''];
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + sampleRow.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "family_finance_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareConfig = () => {
    if (!config.clientId || !config.apiKey || !config.spreadsheetId) {
      showDialog(
        'Missing Configuration',
        'Please fill in and save the configuration fields first.',
        'warning'
      );
      return;
    }

    // Create a shareable URL
    const jsonString = JSON.stringify({
      clientId: config.clientId,
      apiKey: config.apiKey,
      spreadsheetId: config.spreadsheetId
    });

    try {
      const encoded = btoa(jsonString);
      const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
      navigator.clipboard.writeText(url);
      showDialog(
        'Link Copied!',
        'Configuration link copied to clipboard!\n\nSend this link to family members. When they open it, the app will automatically configure the data source.',
        'success'
      );
    } catch (e) {
      showDialog(
        'Error',
        'Failed to generate link.',
        'error'
      );
    }
  };

  const handleExportConfig = () => {
    if (!config.clientId || !config.apiKey || !config.spreadsheetId) {
      showDialog(
        'Missing Configuration',
        'Please fill in the configuration fields first.',
        'warning'
      );
      return;
    }

    const configData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      config: {
        clientId: config.clientId,
        apiKey: config.apiKey,
        spreadsheetId: config.spreadsheetId
      }
    };

    const jsonString = JSON.stringify(configData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `familyfinance-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          const configData = jsonData.config || jsonData;

          // Validate the structure
          if (!configData.clientId || !configData.apiKey || !configData.spreadsheetId) {
            showDialog(
              'Invalid File',
              'Invalid configuration file format. Missing required fields (clientId, apiKey, or spreadsheetId).',
              'error'
            );
            return;
          }

          // Apply the configuration
          setConfig({
            clientId: configData.clientId,
            apiKey: configData.apiKey,
            spreadsheetId: configData.spreadsheetId
          });

          showDialog(
            'Import Successful',
            "Configuration imported successfully!\n\nClick 'Save Changes' to apply and connect.",
            'success'
          );
        } catch (error) {
          showDialog(
            'Import Failed',
            "Failed to parse configuration file. Please ensure it's a valid JSON file.",
            'error'
          );
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const handleResetClick = () => {
    if (confirmReset) {
      onResetData();
      setConfirmReset(false);
      onClose();
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const handleClearClick = () => {
    if (confirmClear) {
      onClearData();
      setConfirmClear(false);
      onClose();
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  // Category Handlers
  const addCategory = (type: TransactionType) => {
    const isIncome = type === TransactionType.INCOME;
    const name = isIncome ? newIncomeCategory.trim() : newExpenseCategory.trim();
    const color = isIncome ? newIncomeColor : newExpenseColor;

    if (name && !localCategoryItems.some(i => i.name === name && i.type === type)) {
      setLocalCategoryItems([
        ...localCategoryItems,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          type: type,
          color: color,
        }
      ]);

      if (isIncome) {
        setNewIncomeCategory('');
        setNewIncomeColor('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
      } else {
        setNewExpenseCategory('');
        setNewExpenseColor('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
      }
    }
  };

  const removeCategoryItem = (id: string) => {
    setLocalCategoryItems(localCategoryItems.filter(i => i.id !== id));
  };

  const updateCategoryItem = (id: string, updates: Partial<CategoryItem>) => {
    setLocalCategoryItems(localCategoryItems.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  // Category List Renderer Helper
  const renderCategoryList = (type: TransactionType) => {
    const items = localCategoryItems.filter(i => i.type === type);
    return (
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 border rounded-lg bg-gray-50 min-h-[100px] content-start">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-white border border-gray-200 px-2 py-1.5 rounded text-sm text-gray-700 shadow-sm justify-between">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="color"
                value={item.color}
                onChange={(e) => updateCategoryItem(item.id, { color: e.target.value })}
                className="w-5 h-5 p-0 border-0 rounded cursor-pointer shrink-0"
                title="Change Color"
              />
              {editingCatId === item.id ? (
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateCategoryItem(item.id, { name: e.target.value })}
                  onBlur={() => setEditingCatId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingCatId(null)}
                  autoFocus
                  className="flex-1 p-1 -my-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              ) : (
                <span
                  className="flex-1 cursor-pointer truncate select-none"
                  onDoubleClick={() => setEditingCatId(item.id)}
                >
                  {item.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditingCatId(editingCatId === item.id ? null : item.id)}
                className={`p-1 rounded hover:bg-gray-100 ${editingCatId === item.id ? 'text-green-500' : 'text-gray-400'}`}
                title={editingCatId === item.id ? "Finish Editing" : "Edit Name"}
              >
                {editingCatId === item.id ? <Check size={14} /> : <Pencil size={14} />}
              </button>
              <button
                onClick={() => removeCategoryItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded"
                title="Delete Category"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No categories defined.</p>}
      </div>
    );
  };

  // Member Handlers
  const addMember = () => {
    const trimmedName = newMember.trim();
    if (!trimmedName) {
      setMemberError('Name cannot be empty');
      return;
    }

    if (localMembers.some(m => m.name.toLowerCase() === trimmedName.toLowerCase())) {
      setMemberError('Member already exists');
      return;
    }

    setMemberError(null);
    setLocalMembers([...localMembers, {
      id: Math.random().toString(36).substr(2, 9),
      name: trimmedName,
      color: newMemberColor
    }]);
    setNewMember('');
    setNewMemberColor('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
  };

  const handleRemoveMember = (id: string) => {
    if (memberDeleteId === id) {
      // Confirmed delete
      setLocalMembers(localMembers.filter(m => m.id !== id));
      setMemberDeleteId(null);
    } else {
      // Request confirmation
      setMemberDeleteId(id);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setMemberDeleteId((currentId) => currentId === id ? null : currentId), 3000);
    }
  };

  const updateMemberItem = (id: string, updates: Partial<MemberItem>) => {
    setLocalMembers(localMembers.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const currencyOptions = AVAILABLE_CURRENCIES.map(c => ({
    value: c,
    label: `${c} (${CURRENCY_SYMBOLS[c]})`
  }));

  const incomeCategoryOptions = [
    { value: '', label: 'Select or Type...' },
    ...ALLOWED_INCOME_CATEGORIES.map(cat => ({
      value: cat,
      label: cat
    }))
  ];

  return (
    <>
      <Dialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        showCancel={dialogState.showCancel}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Database className="text-green-600" size={24} />
              App Settings
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">

            {/* Currency Section */}
            <div className="space-y-4 pb-4 border-b border-gray-100">
              <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <Coins className="text-blue-500" size={20} />
                Currency Preference
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Currency</label>
                  <CustomSelect
                    value={currency}
                    onChange={(val) => setCurrency(val as CurrencyCode)}
                    options={currencyOptions}
                    className="w-full bg-white"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Select the primary currency symbol for your transactions.
              </p>
            </div>

            {/* List Management Section */}
            <div className="space-y-4 pb-4 border-b border-gray-100">
              <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <List className="text-purple-500" size={20} />
                Lists Management
              </h3>
              <p className="text-xs text-gray-500 -mt-2">
                Manage category lists separately for Income and Expenses. {isConnected && "These will be synced to your Google Sheet."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Income Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <ArrowUpCircle size={14} className="text-green-600" /> Income Categories
                  </label>
                  <div className="flex gap-2 mb-2 items-center">
                    <input
                      type="color"
                      value={newIncomeColor}
                      onChange={(e) => setNewIncomeColor(e.target.value)}
                      className="w-8 h-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      title="Pick Color"
                    />
                    <div className="flex-1">
                      <CustomSelect
                        value={newIncomeCategory}
                        onChange={(val) => setNewIncomeCategory(val)}
                        options={incomeCategoryOptions}
                        placeholder="Select or Type..."
                        className="bg-white"
                      />
                    </div>
                    <button
                      onClick={() => addCategory(TransactionType.INCOME)}
                      disabled={!newIncomeCategory}
                      className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed h-full"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {renderCategoryList(TransactionType.INCOME)}
                </div>

                {/* Expense Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <ArrowDownCircle size={14} className="text-red-600" /> Expense Categories
                  </label>
                  <div className="flex gap-2 mb-2 items-center">
                    <input
                      type="color"
                      value={newExpenseColor}
                      onChange={(e) => setNewExpenseColor(e.target.value)}
                      className="w-8 h-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      title="Pick Color"
                    />
                    <input
                      type="text"
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                      placeholder="New Expense..."
                      className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                      onKeyDown={(e) => e.key === 'Enter' && addCategory(TransactionType.EXPENSE)}
                    />
                    <button
                      onClick={() => addCategory(TransactionType.EXPENSE)}
                      disabled={!newExpenseCategory}
                      className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {renderCategoryList(TransactionType.EXPENSE)}
                </div>

                {/* Members Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <User size={14} className="text-purple-600" /> Family Members
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="color"
                      value={newMemberColor}
                      onChange={(e) => setNewMemberColor(e.target.value)}
                      className="w-8 h-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      title="Pick Color"
                    />
                    <input
                      type="text"
                      value={newMember}
                      onChange={(e) => {
                        setNewMember(e.target.value);
                        if (memberError) setMemberError(null);
                      }}
                      placeholder="New Member..."
                      className={`flex-1 p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 ${memberError ? 'border-red-300' : 'border-gray-300'}`}
                      onKeyDown={(e) => e.key === 'Enter' && addMember()}
                    />
                    <button onClick={addMember} className="p-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 border border-purple-200">
                      <Plus size={18} />
                    </button>
                  </div>
                  {memberError && <p className="text-xs text-red-500 mb-2 ml-9">{memberError}</p>}

                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 border rounded-lg bg-gray-50 min-h-[100px] content-start">
                    {localMembers.map(mem => (
                      <div key={mem.id} className="flex items-center gap-2 bg-white border border-gray-200 px-2 py-1.5 rounded text-sm text-gray-700 shadow-sm justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="color"
                            value={mem.color}
                            onChange={(e) => updateMemberItem(mem.id, { color: e.target.value })}
                            className="w-5 h-5 p-0 border-0 rounded cursor-pointer shrink-0"
                            title="Change Color"
                          />
                          {editingMemId === mem.id ? (
                            <input
                              type="text"
                              value={mem.name}
                              onChange={(e) => updateMemberItem(mem.id, { name: e.target.value })}
                              onBlur={() => setEditingMemId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingMemId(null)}
                              autoFocus
                              className="flex-1 p-1 -my-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            />
                          ) : (
                            <span
                              className="flex-1 cursor-pointer truncate select-none"
                              onDoubleClick={() => setEditingMemId(mem.id)}
                            >
                              {mem.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingMemId(editingMemId === mem.id ? null : mem.id)}
                            className={`p-1 rounded hover:bg-gray-100 ${editingMemId === mem.id ? 'text-green-500' : 'text-gray-400'}`}
                            title={editingMemId === mem.id ? "Finish Editing" : "Edit Name"}
                          >
                            {editingMemId === mem.id ? <Check size={14} /> : <Pencil size={14} />}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(mem.id)}
                            className={`p-1 rounded transition-colors ${memberDeleteId === mem.id ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                            title={memberDeleteId === mem.id ? "Click again to confirm" : "Delete Member"}
                          >
                            {memberDeleteId === mem.id ? <Trash2 size={14} /> : <X size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {localMembers.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No members defined.</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Google Sheets Section */}
            <div className="space-y-4 pb-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                  <Database className="text-green-600" size={20} />
                  Data Source
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportConfig}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1.5 rounded bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                    title="Export configuration to file"
                  >
                    <Download size={16} />
                    Export
                  </button>
                  <button
                    onClick={handleImportConfig}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                    title="Import configuration from file"
                  >
                    <Upload size={16} />
                    Import
                  </button>
                  <button
                    onClick={handleShareConfig}
                    className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 px-3 py-1.5 rounded bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors"
                    title="Share configuration link"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                  <button
                    onClick={downloadTemplate}
                    className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 px-3 py-1.5 rounded bg-green-50 border border-green-100 hover:bg-green-100 transition-colors"
                    title="Download CSV Template for Google Sheets"
                  >
                    <FileSpreadsheet size={16} />
                    Template
                  </button>
                  <button
                    onClick={() => setIsHelpOpen(!isHelpOpen)}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                  >
                    <HelpCircle size={16} />
                    {isHelpOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Tutorial Section */}
              {isHelpOpen && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-900 animate-fade-in">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    Setup Instructions
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800" title="Open Google Cloud Console">
                      <ExternalLink size={12} />
                    </a>
                  </h4>
                  <ol className="list-decimal list-inside space-y-3 text-xs">
                    <li>
                      Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline font-medium">Google Cloud Console</a> and create a new project.
                    </li>
                    <li>
                      Search for and enable the <strong>Google Sheets API</strong>.
                    </li>
                    <li>
                      Go to <strong>APIs & Services {'>'} Credentials</strong> and create:
                      <ul className="list-disc list-inside ml-3 mt-1 space-y-2 text-blue-800">
                        <li><strong>OAuth 2.0 Client ID</strong> (Application type: Web application).</li>
                        <li>
                          <strong>Important:</strong> Add the exact URL below to "Authorized JavaScript origins":
                          <div className="mt-1 flex items-start gap-2">
                            <code className="bg-white px-2 py-1.5 rounded border border-blue-200 font-mono text-gray-600 flex-1 break-all text-[11px] leading-relaxed select-all">
                              {currentOrigin}
                            </code>
                            <button
                              onClick={copyOrigin}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors bg-white border border-blue-200 mt-0.5"
                              title="Copy URL"
                            >
                              {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li>
                      Create a blank Google Sheet.
                    </li>
                    <li>
                      Copy the ID from the URL:<br />
                      <div className="mt-1 font-mono bg-white px-2 py-1 rounded border border-blue-200 text-gray-600 overflow-x-auto whitespace-nowrap">
                        docs.google.com/spreadsheets/d/<span className="font-bold text-blue-600">YOUR_SHEET_ID</span>/edit
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {isConnected && userProfile ? (
                <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-4">
                    {userProfile.picture ? (
                      <img src={userProfile.picture} alt="Profile" className="w-12 h-12 rounded-full border-2 border-green-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                        {userProfile.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{userProfile.name}</p>
                      <p className="text-xs text-gray-500">{userProfile.email}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-green-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Connected to Google Sheets
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-start gap-3">
                  <AlertCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">Google Sheets Sync</p>
                    <p>Connect to a real Google Sheet to collaborate. Requires a Google Cloud Project with Sheets API.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Cloud Client ID</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none bg-white text-gray-900"
                  placeholder="12345...apps.googleusercontent.com"
                  value={config.clientId}
                  onChange={e => setConfig({ ...config, clientId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none bg-white text-gray-900"
                  placeholder="AIza..."
                  value={config.apiKey}
                  onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spreadsheet ID</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none bg-white text-gray-900"
                  placeholder="1BxiMVs0XRA5nFMd..."
                  value={config.spreadsheetId}
                  onChange={e => setConfig({ ...config, spreadsheetId: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Found in the URL of your Google Sheet.</p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">Status: <span className={isConnected ? "text-green-600 font-bold" : "text-gray-500 font-medium"}>{isConnected ? "Connected to Google Sheets" : "Using Local Storage"}</span></div>
                {isConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-red-500 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    <Unplug size={12} />
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {/* Data Management Section - Only show when not connected */}
            {!isConnected && (
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                  <RotateCcw className="text-orange-500" size={20} />
                  Data Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex flex-col justify-between gap-3">
                    <div className="text-sm text-orange-900">
                      <p className="font-semibold">Reset to Demo Data</p>
                      <p className="text-xs mt-1">Clears all local data and re-populates with sample transactions.</p>
                    </div>
                    <button
                      onClick={handleResetClick}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors border w-full ${confirmReset ? 'bg-red-600 text-white border-red-600' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-100'}`}
                    >
                      {confirmReset ? 'Confirm Reset?' : 'Reset Data'}
                    </button>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col justify-between gap-3">
                    <div className="text-sm text-red-900">
                      <p className="font-semibold">Clear All Data</p>
                      <p className="text-xs mt-1">Permanently deletes all local records. Useful if you want an empty database.</p>
                    </div>
                    <button
                      onClick={handleClearClick}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors border w-full flex items-center justify-center gap-1 ${confirmClear ? 'bg-red-700 text-white border-red-700' : 'bg-white text-red-600 border-red-200 hover:bg-red-100'}`}
                    >
                      <Trash2 size={12} />
                      {confirmClear ? 'Confirm Clear?' : 'Clear All'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-2"
            >
              <Save size={18} />
              Save & Connect
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
