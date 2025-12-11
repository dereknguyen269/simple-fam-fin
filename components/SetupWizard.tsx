
import React, { useState, useMemo } from 'react';
import {
  ArrowRight, Users, Shield,
  CheckCircle, Wallet, HelpCircle, ChevronRight, Check, PlayCircle, Globe, LayoutGrid, Plus, Trash2, AlertCircle, CloudLightning, RefreshCw, Upload
} from 'lucide-react';
import { CurrencyCode, MemberItem, GoogleConfig, TransactionType, Wallet as WalletType, SavingsGoal, Expense, CategoryItem, Budget } from '../types';
import { AVAILABLE_CURRENCIES, CURRENCY_SYMBOLS, DEFAULT_MEMBER_ITEMS, DEFAULT_CATEGORY_ITEMS, CURRENCY_RATES } from '../constants';
import { CustomSelect } from './CustomSelect';
import { saveGoogleConfig, saveCurrencyCode, saveMembers, saveWallets, saveExpenses, saveGoals, setSetupComplete, saveCategories, saveBudgets, saveGoogleSyncEnabled } from '../services/storageService';
import { convertToBase, calculateWalletBalances, formatCurrency } from '../utils';
import { initializeGapiClient, handleAuthClick, fetchExpensesFromSheet, fetchRefData, saveRefData, saveExpensesToSheet, saveGoalsToSheet, saveBudgetsToSheet } from '../services/googleSheetsService';
import { Dialog } from './Dialog';

interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Start your journey' },
  { id: 'data', title: 'Data Source', description: 'Where to store data' },
  { id: 'currency', title: 'Currency', description: 'Select your base currency' },
  { id: 'family', title: 'Family', description: 'Add family members' },
  { id: 'wallets', title: 'Balances', description: 'Set initial funds' }
];

const TIPS = [
  { title: "Did you know?", text: "Tracking expenses together promotes financial transparency and reduces stress." },
  { title: "Privacy First", text: "Local storage keeps data on your device. Google Sheets puts you in control of your cloud data." },
  { title: "Why Currency?", text: "We use a base currency to unify spending reports, even if you travel." },
  { title: "Family Roles", text: " Assigning transactions to specific members helps visualize who spends on what." },
  { title: "Initial Boost", text: "Setting accurate starting balances ensures your Net Worth calculation is correct from Day 1." }
];

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // State for Wizard
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [members, setMembers] = useState<MemberItem[]>(DEFAULT_MEMBER_ITEMS);
  const [newMemberName, setNewMemberName] = useState('');

  const [configType, setConfigType] = useState<'LOCAL' | 'IMPORT' | 'MANUAL'>('LOCAL');
  const [importString, setImportString] = useState('');
  const [manualConfig, setManualConfig] = useState<GoogleConfig>({
    clientId: '',
    apiKey: '',
    spreadsheetId: ''
  });

  const [useServiceCreds, setUseServiceCreds] = useState<boolean>(!!(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_API_KEY));

  // Google Sync State
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [fetchedData, setFetchedData] = useState<{
    expenses: Expense[];
    wallets: WalletType[];
    categories: CategoryItem[] | null;
    members: MemberItem[] | null;
    goals: SavingsGoal[] | null;
    budgets: Budget[] | null;
  } | null>(null);

  const [mainWalletBalance, setMainWalletBalance] = useState<string>('');

  // Temp inputs
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [additionalWallets, setAdditionalWallets] = useState<WalletType[]>([]);

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const addMember = () => {
    if (newMemberName.trim()) {
      if (members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
        setDialogState({
          isOpen: true,
          title: 'Duplicate Member',
          message: 'A member with this name already exists. Please use a different name.',
          type: 'warning'
        });
        return;
      }
      setMembers([...members, {
        id: Math.random().toString(36).substr(2, 9),
        name: newMemberName.trim(),
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      }]);
      setNewMemberName('');
    }
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const addWallet = () => {
    if (newWalletName.trim()) {
      setAdditionalWallets([...additionalWallets, {
        id: Math.random().toString(36).substr(2, 9),
        name: newWalletName.trim(),
        type: 'SAVINGS',
        balance: parseFloat(newWalletBalance) || 0
      }]);
      setNewWalletName('');
      setNewWalletBalance('');
    }
  };

  const handleConnect = async () => {
    let configToUse = { ...manualConfig };

    if (useServiceCreds) {
      const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const envApiKey = import.meta.env.VITE_GOOGLE_API_KEY;

      // console.log("[Setup] Check Env Vars:", { hasClientId: !!envClientId, hasApiKey: !!envApiKey });

      if (!envApiKey) {
        setDialogState({
          isOpen: true,
          title: 'Configuration Error',
          message: 'VITE_GOOGLE_API_KEY is missing.\n\nIf you just added the .env file, please restart the development server.',
          type: 'error'
        });
        return;
      }

      configToUse.clientId = envClientId;
      configToUse.apiKey = envApiKey;
    }

    // Trim all values before validation
    configToUse.clientId = configToUse.clientId.trim();
    configToUse.apiKey = configToUse.apiKey.trim();
    configToUse.spreadsheetId = configToUse.spreadsheetId.trim();

    // Heuristic Check: API Key vs Spreadsheet ID confusion
    // API Keys usually start with AIza. Spreadsheet IDs start with 1 (and are long)
    if (configToUse.apiKey.startsWith('1') && configToUse.apiKey.length > 30) {
      const source = useServiceCreds ? "ENVIRONMENT VARIABLE (VITE_GOOGLE_API_KEY)" : "Input Field";

      setDialogState({
        isOpen: true,
        title: 'Invalid API Key',
        message: `The API Key loaded from ${source} looks like a Spreadsheet ID (starts with '1').\n\nPlease check your .env file or configuration.`,
        type: 'error'
      });
      console.error("Suspicious API Key (looks like ID):", configToUse.apiKey);
      return;
    }

    if (!configToUse.apiKey.startsWith('AIza')) {
      console.warn(`Warning: API Key from ${useServiceCreds ? "Env Var" : "Input"} does not start with 'AIza'. This might be incorrect.`);
    }

    if (!configToUse.clientId || !configToUse.apiKey || !configToUse.spreadsheetId) {
      setDialogState({
        isOpen: true,
        title: 'Missing Configuration',
        message: 'Please fill in all Google Cloud fields (or check environment configuration).',
        type: 'warning'
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      await initializeGapiClient(configToUse);
      await handleAuthClick(configToUse.clientId);

      const { expenses, wallets } = await fetchExpensesFromSheet(configToUse.spreadsheetId);
      const refData = await fetchRefData(configToUse.spreadsheetId);

      setFetchedData({
        expenses,
        wallets,
        categories: refData.categories,
        members: refData.members,
        goals: refData.goals,
        budgets: refData.budgets
      });

      // If remote members exist, populate local state so user can edit them in Step 3
      if (refData.members && refData.members.length > 0) {
        setMembers(refData.members);
      }

      setConnectionStatus('success');
      setConnectionMessage(`Success! Found ${expenses.length} txns.`);

    } catch (error: any) {
      console.error("Connection failed. Config used:", { ...configToUse, apiKey: '***' });
      console.error(error);
      setConnectionStatus('error');

      let msg = "Connection failed.";
      if (error.result && error.result.error && error.result.error.message) {
        msg += " " + error.result.error.message;
      } else if (error.message) {
        msg += " " + error.message;
      } else if (typeof error === 'string') {
        msg += " " + error;
      }

      setConnectionMessage(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  // Determine if we found existing data to display
  const hasExistingData = configType === 'MANUAL' && connectionStatus === 'success' && fetchedData && fetchedData.expenses.length > 0;

  // Calculate balances for display if we have existing data
  const existingBalances = useMemo(() => {
    if (!hasExistingData || !fetchedData) return [];
    // Ensure wallets exists
    const currentWallets = fetchedData.wallets && fetchedData.wallets.length > 0
      ? fetchedData.wallets
      : [{ id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 }];

    return calculateWalletBalances(currentWallets as WalletType[], fetchedData.expenses);
  }, [hasExistingData, fetchedData]);


  const handleFinish = async () => {
    saveCurrencyCode(currency);
    saveCategories(DEFAULT_CATEGORY_ITEMS);

    if (configType === 'IMPORT' && importString) {
      try {
        const decoded = atob(importString.split('config=')[1] || importString);
        const imported = JSON.parse(decoded);
        saveGoogleConfig(imported);
      } catch (e) {
        console.error("Invalid config string");
      }
    } else if (configType === 'MANUAL') {
      let configToSave = { ...manualConfig };

      if (useServiceCreds) {
        configToSave.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        configToSave.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
      }

      saveGoogleConfig(configToSave);

      // If user successfully connected during setup, mark sync as enabled
      if (connectionStatus === 'success') {
        saveGoogleSyncEnabled(true);
      }

      // Save members from state (allows for edits during wizard)
      saveMembers(members);

      if (hasExistingData && fetchedData) {
        // USE SYNCED DATA
        if (fetchedData.categories) saveCategories(fetchedData.categories);
        else saveCategories(DEFAULT_CATEGORY_ITEMS);

        if (fetchedData.goals) saveGoals(fetchedData.goals);
        else saveGoals([]);

        if (fetchedData.budgets) saveBudgets(fetchedData.budgets);
        else saveBudgets([]);

        if (fetchedData.wallets && fetchedData.wallets.length > 0) saveWallets(fetchedData.wallets);
        else saveWallets([{ id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 }]);

        saveExpenses(fetchedData.expenses);

        // Sync updated members back to sheet
        await saveRefData(configToSave.spreadsheetId, fetchedData.categories || DEFAULT_CATEGORY_ITEMS, members);

      } else {
        // MANUAL but NO data found -> Treat as new setup and push to sheet
        const allWallets: WalletType[] = [
          { id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 },
          ...additionalWallets
        ];
        saveWallets(allWallets);

        const initialExpenses: Expense[] = [];

        const tempCurrencyConfig = {
          code: currency,
          symbol: CURRENCY_SYMBOLS[currency],
          rate: 1 // Force rate to 1 to store raw value in sheet
        };

        const mainBal = parseFloat(mainWalletBalance);
        if (mainBal > 0) {
          initialExpenses.push({
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            description: 'Initial Balance Setup',
            category: 'Other',
            amount: convertToBase(mainBal, tempCurrencyConfig),
            member: members[0]?.name || 'Admin',
            type: TransactionType.INCOME,
            walletId: 'main'
          });
        }

        additionalWallets.forEach(w => {
          if (w.balance && w.balance > 0) {
            initialExpenses.push({
              id: Math.random().toString(36).substr(2, 9),
              date: new Date().toISOString().split('T')[0],
              description: 'Initial Deposit',
              category: 'Other',
              amount: convertToBase(w.balance, tempCurrencyConfig),
              member: members[0]?.name || 'Admin',
              type: TransactionType.INCOME,
              walletId: w.id
            });
          }
        });

        saveExpenses(initialExpenses);
        saveGoals([]);

        // Push to Sheet
        await saveExpensesToSheet(configToSave.spreadsheetId, initialExpenses, allWallets);
        await saveRefData(configToSave.spreadsheetId, DEFAULT_CATEGORY_ITEMS, members);
      }

    } else {
      // LOCAL STORAGE MODE
      saveMembers(members);

      const allWallets: WalletType[] = [
        { id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 },
        ...additionalWallets
      ];
      saveWallets(allWallets);

      const initialExpenses: Expense[] = [];
      const tempCurrencyConfig = {
        code: currency,
        symbol: CURRENCY_SYMBOLS[currency],
        rate: 1 // Force rate to 1 to store raw value locally too
      };

      const mainBal = parseFloat(mainWalletBalance);
      if (mainBal > 0) {
        initialExpenses.push({
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0],
          description: 'Initial Balance Setup',
          category: 'Other',
          amount: convertToBase(mainBal, tempCurrencyConfig),
          member: members[0]?.name || 'Admin',
          type: TransactionType.INCOME,
          walletId: 'main'
        });
      }

      additionalWallets.forEach(w => {
        if (w.balance && w.balance > 0) {
          initialExpenses.push({
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            description: 'Initial Deposit',
            category: 'Other',
            amount: convertToBase(w.balance, tempCurrencyConfig),
            member: members[0]?.name || 'Admin',
            type: TransactionType.INCOME,
            walletId: w.id
          });
        }
      });

      saveExpenses(initialExpenses);
      saveGoals([]);
    }

    setSetupComplete(true);
    onComplete();
  };

  // --- Step Content ---

  const renderWelcomeStep = () => (
    <div className="flex flex-col items-center text-center justify-center h-full max-w-lg mx-auto animate-fade-in">
      <div className="mb-6">
        <img src="/images/simple_famfin.png" alt="SimpleFamFin Logo" className="h-24 w-auto object-contain" />
      </div>
      <p className="text-gray-600 mb-8 text-lg leading-relaxed">
        Master your household budget with privacy-focused tracking and powerful insights.
        <br /><span className="text-sm text-gray-400 mt-2 block">Takes about 2 minutes to set up.</span>
      </p>

      <div className="w-full space-y-3">
        <button
          onClick={nextStep}
          className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          Let's Start <ArrowRight size={20} />
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 text-gray-500 font-medium hover:text-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <PlayCircle size={16} /> Skip & View Demo
        </button>
      </div>
    </div>
  );

  const renderCurrencyStep = () => (
    <div className="animate-fade-in space-y-6 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Select Currency</h2>
        <p className="text-gray-500">What currency do you primarily use?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {['USD', 'EUR', 'GBP', 'JPY'].map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c as CurrencyCode)}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${currency === c
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-100 hover:border-gray-300 text-gray-600 bg-white'
              }`}
          >
            <span className="text-2xl font-bold">{CURRENCY_SYMBOLS[c as CurrencyCode]}</span>
            <span className="text-xs font-semibold">{c}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Other Currencies</label>
        <CustomSelect
          value={currency}
          onChange={(v) => setCurrency(v as CurrencyCode)}
          options={AVAILABLE_CURRENCIES.map(c => ({ value: c, label: `${c} (${CURRENCY_SYMBOLS[c]})` }))}
          className="bg-white"
        />
      </div>
    </div>
  );

  const renderFamilyStep = () => (
    <div className="animate-fade-in space-y-6 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Who's involved?</h2>
        <p className="text-gray-500">
          {hasExistingData ? "Review members found in your sheet." : "Add family members to track individual spending."}
        </p>
      </div>

      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 mb-2">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Users className="text-gray-500" size={20} />
        </div>
        <input
          type="text"
          value={newMemberName}
          onChange={e => setNewMemberName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addMember()}
          placeholder="Member Name (e.g. Dad)"
          className="flex-1 outline-none text-gray-800 font-medium placeholder-gray-400 bg-transparent"
          autoFocus
        />
        <button
          onClick={addMember}
          disabled={!newMemberName.trim()}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-sm" style={{ backgroundColor: m.color }}>
                {m.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-gray-700">{m.name}</span>
            </div>
            {members.length > 1 && (
              <button onClick={() => removeMember(m.id)} className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDataStep = () => (
    <div className="animate-fade-in space-y-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Where to save?</h2>
        <p className="text-gray-500">Choose how you want to store your financial data.</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => setConfigType('LOCAL')}
          className={`relative p-5 rounded-xl border-2 text-left transition-all ${configType === 'LOCAL' ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${configType === 'LOCAL' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              <Shield size={24} />
            </div>
            {configType === 'LOCAL' && <CheckCircle className="text-green-500" size={24} />}
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Local Storage</h3>
          <p className="text-sm text-gray-500 mt-1">Data stays on this device. Best for privacy and single-user use.</p>
        </button>

        <button
          onClick={() => setConfigType('MANUAL')}
          className={`relative p-5 rounded-xl border-2 text-left transition-all ${configType === 'MANUAL' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${configType === 'MANUAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              <Globe size={24} />
            </div>
            {configType === 'MANUAL' && <CheckCircle className="text-blue-500" size={24} />}
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Google Sheets Sync</h3>
          <p className="text-sm text-gray-500 mt-1">Real-time sync. Best for sharing with family and owning your data.</p>
        </button>

        <button
          onClick={() => setConfigType('IMPORT')}
          className={`relative p-5 rounded-xl border-2 text-left transition-all ${configType === 'IMPORT' ? 'border-purple-500 bg-purple-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${configType === 'IMPORT' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              <Upload size={24} />
            </div>
            {configType === 'IMPORT' && <CheckCircle className="text-purple-500" size={24} />}
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Import from JSON</h3>
          <p className="text-sm text-gray-500 mt-1">Load configuration from a file.</p>
        </button>
      </div>

      {configType === 'IMPORT' && (
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl animate-in slide-in-from-top-2">
          <p className="text-xs text-purple-800 mb-3 font-semibold">Upload your configuration file:</p>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-purple-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-purple-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-purple-500" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">JSON file only</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".json,.env,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      let newConfig: Partial<GoogleConfig> = {};

                      try {
                        // Try parsing as JSON first
                        try {
                          const json = JSON.parse(content);
                          const configData = json.config || json;

                          // Check if this is a Managed Service export
                          const isManagedService = json.isManagedService === true ||
                            (typeof configData.note === 'string' && configData.note.includes('Managed Service'));

                          if (isManagedService) {
                            // Managed Service config - only has Spreadsheet ID
                            if (configData.spreadsheetId) {
                              setManualConfig(prev => ({
                                ...prev,
                                spreadsheetId: configData.spreadsheetId
                              }));
                              setConfigType('MANUAL');
                              setDialogState({
                                isOpen: true,
                                title: 'Managed Service Config Imported',
                                message: 'Spreadsheet ID imported successfully!\n\nThis configuration uses Managed Service credentials.\n\nClick "Managed Service" and connect.',
                                type: 'success'
                              });
                            } else {
                              throw new Error("Missing Spreadsheet ID");
                            }
                          } else {
                            // Custom Config - has all credentials
                            newConfig = {
                              clientId: configData.clientId,
                              apiKey: configData.apiKey,
                              spreadsheetId: configData.spreadsheetId
                            };

                            if (newConfig.clientId && newConfig.apiKey) {
                              setManualConfig(prev => ({
                                ...prev,
                                clientId: newConfig.clientId || prev.clientId,
                                apiKey: newConfig.apiKey || prev.apiKey,
                                spreadsheetId: newConfig.spreadsheetId || prev.spreadsheetId
                              }));
                              setConfigType('MANUAL');

                              if (!newConfig.spreadsheetId) {
                                setDialogState({
                                  isOpen: true,
                                  title: 'Credentials Imported',
                                  message: 'Client ID and API Key imported successfully! Please manually enter your Spreadsheet ID to continue.',
                                  type: 'success'
                                });
                              }
                            } else {
                              setDialogState({
                                isOpen: true,
                                title: 'Invalid Configuration',
                                message: 'File is missing required credentials (Client ID or API Key).',
                                type: 'error'
                              });
                            }
                          }
                        } catch (jsonErr) {
                          // Try .env parsing
                          const lines = content.split('\n');
                          const envConfig: any = {};

                          lines.forEach(line => {
                            const match = line.match(/^\s*(?:export\s+)?(?:VITE_)?([A-Z0-9_]+)\s*=\s*(.*?)(\s*#.*)?$/);
                            if (match) {
                              const key = match[1];
                              let value = match[2].trim();
                              if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.slice(1, -1);
                              }

                              if (key === 'GOOGLE_CLIENT_ID') envConfig.clientId = value;
                              else if (key === 'GOOGLE_API_KEY') envConfig.apiKey = value;
                              // Do not parse spreadsheet ID
                            }
                          });

                          if (Object.keys(envConfig).length > 0) {
                            newConfig = envConfig;
                            setManualConfig(prev => ({
                              ...prev,
                              clientId: newConfig.clientId || prev.clientId,
                              apiKey: newConfig.apiKey || prev.apiKey
                            }));
                            setConfigType('MANUAL');
                            setDialogState({
                              isOpen: true,
                              title: 'Credentials Imported',
                              message: 'Client ID and API Key imported from .env file! Please enter your Spreadsheet ID to continue.',
                              type: 'success'
                            });
                          } else {
                            throw new Error("No config found");
                          }
                        }
                      } catch (err) {
                        setDialogState({
                          isOpen: true,
                          title: 'Parse Error',
                          message: 'Failed to parse configuration file.',
                          type: 'error'
                        });
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      )}

      {configType === 'MANUAL' && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl animate-in slide-in-from-top-2">
          {(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_API_KEY) && (
            <div className="mb-4 p-1 bg-white/50 rounded-lg flex text-sm">
              <button
                onClick={() => {
                  setUseServiceCreds(true);
                  // Dynamic merge in handleConnect handles credentials
                }}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all ${useServiceCreds ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}
              >
                Managed Service
              </button>
              <button
                onClick={() => {
                  setUseServiceCreds(false);
                  // Don't auto-fill env vars, let user type own or use import
                }}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all ${!useServiceCreds ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}
              >
                Custom Config
              </button>
            </div>
          )}

          {useServiceCreds ? (
            <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3 text-blue-800 text-sm flex items-center gap-2">
              <Shield size={18} className="shrink-0 text-blue-600" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider text-blue-600">Service Configured</p>
                <p className="text-xs opacity-80">Credentials provided by environment. Just enter the Sheet ID.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-blue-800 mb-3 font-semibold">Enter your Google Cloud credentials:</p>
              <div className="space-y-3 mb-3">
                <input
                  type="text"
                  placeholder="Client ID"
                  value={manualConfig.clientId}
                  onChange={e => setManualConfig({ ...manualConfig, clientId: e.target.value })}
                  className="w-full p-2.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <input
                  type="text"
                  placeholder="API Key"
                  value={manualConfig.apiKey}
                  onChange={e => setManualConfig({ ...manualConfig, apiKey: e.target.value })}
                  className="w-full p-2.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </>
          )}

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Spreadsheet ID"
              value={manualConfig.spreadsheetId}
              onChange={e => setManualConfig({ ...manualConfig, spreadsheetId: e.target.value })}
              className="w-full p-2.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 transition-colors"
              >
                {isConnecting ? <RefreshCw className="animate-spin" size={14} /> : <CloudLightning size={14} />}
                {isConnecting ? 'Connecting...' : 'Connect & Sync'}
              </button>

              {connectionStatus === 'success' && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                  <CheckCircle size={14} /> {connectionMessage}
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                  <AlertCircle size={14} /> Failed
                </div>
              )}
            </div>
            {hasExistingData && (
              <p className="text-xs text-blue-600 italic">
                Found existing data. You can skip balance setup.
              </p>
            )}
          </div>
        </div>
      )
      }
    </div >
  );

  const renderWalletsStep = () => {
    // If we have existing data, show read-only list instead of input form
    if (hasExistingData) {
      const tempCurrencyConfig = {
        code: currency,
        symbol: CURRENCY_SYMBOLS[currency],
        rate: 1 // Force rate to 1 to read/display stored values as-is
      };

      return (
        <div className="animate-fade-in space-y-6 max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Current Balances</h2>
            <p className="text-gray-500">We found the following wallets in your sheet.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {existingBalances.map(w => (
              <div key={w.id} className="flex justify-between items-center p-4">
                <div>
                  <p className="font-bold text-gray-800">{w.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{w.type.toLowerCase()}</p>
                </div>
                <div className="font-mono font-bold text-gray-900">
                  {formatCurrency(w.balance, tempCurrencyConfig)}
                </div>
              </div>
            ))}
            {existingBalances.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">No wallets found or balance is zero.</div>
            )}
          </div>

          <p className="text-xs text-center text-gray-400">
            Click "Finish" to proceed to dashboard.
          </p>
        </div>
      );
    }

    return (
      <div className="animate-fade-in space-y-6 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Initial Balance</h2>
          <p className="text-gray-500">How much money is currently in your main wallet?</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Main Wallet Balance ({currency})</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg">
              {CURRENCY_SYMBOLS[currency] || '$'}
            </span>
            <input
              type="number"
              value={mainWalletBalance}
              onChange={e => setMainWalletBalance(e.target.value)}
              className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
              placeholder="0.00"
              autoFocus
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <LayoutGrid size={18} /> Additional Wallets
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Name (e.g. Savings)"
              value={newWalletName}
              onChange={e => setNewWalletName(e.target.value)}
              className="flex-1 p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-green-500"
            />
            <input
              type="number"
              placeholder="Balance"
              value={newWalletBalance}
              onChange={e => setNewWalletBalance(e.target.value)}
              className="w-24 p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-green-500"
            />
            <button onClick={addWallet} className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {additionalWallets.map(w => (
              <div key={w.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{w.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{w.balance.toFixed(2)}</div>
                </div>
                <button onClick={() => setAdditionalWallets(additionalWallets.filter(x => x.id !== w.id))} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ ...dialogState, isOpen: false })}
        onConfirm={() => setDialogState({ ...dialogState, isOpen: false })}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        showCancel={false}
      />

      <div className="min-h-screen bg-gray-50 flex items-stretch">

        {/* Left Sidebar - Visual Stepper */}
        <div className="hidden lg:flex w-1/3 bg-green-900 text-white p-12 flex-col justify-between relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-white blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-green-400 blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <button
                onClick={onBack}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                title="Back to landing page"
              >
                <img src="/images/simple_famfin_light_v2.png" alt="SimpleFamFin Logo" className="h-16 w-auto object-contain" />
              </button>
            </div>

            <div className="space-y-1">
              {STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div key={step.id} className="flex items-start gap-4 p-2 transition-all">
                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isActive ? 'bg-white text-green-900 scale-110' : isCompleted ? 'bg-green-700 text-green-200' : 'bg-green-900/50 border border-green-700 text-green-700'}`}>
                      {isCompleted ? <Check size={14} /> : index + 1}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-green-200' : 'text-green-800'}`}>
                        {step.title}
                      </h4>
                      {isActive && (
                        <p className="text-xs text-green-300 mt-1 animate-in fade-in slide-in-from-left-2">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2 text-green-200 font-semibold text-sm">
              <HelpCircle size={16} /> {TIPS[currentStep]?.title || "Tip"}
            </div>
            <p className="text-sm text-green-50 leading-relaxed">
              {TIPS[currentStep]?.text}
            </p>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={onBack}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                title="Back to landing page"
              >
                <img src="/images/simple_famfin.png" alt="SimpleFamFin Logo" className="h-8 w-auto object-contain" />
              </button>
              <div className="text-xs font-medium text-gray-500">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>
          </div>

          {/* Progress Bar (Mobile) */}
          <div className="lg:hidden w-full h-1 bg-gray-100">
            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}></div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 flex flex-col">
            <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
              {currentStep === 0 && renderWelcomeStep()}
              {currentStep === 1 && renderDataStep()}
              {currentStep === 2 && renderCurrencyStep()}
              {currentStep === 3 && renderFamilyStep()}
              {currentStep === 4 && renderWalletsStep()}
            </div>
          </div>

          {/* Footer Navigation */}
          {currentStep > 0 && (
            <div className="p-6 lg:px-12 border-t border-gray-100 bg-gray-50 lg:bg-white flex justify-between items-center max-w-full">
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                Back
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm"
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-md shadow-green-200"
                >
                  {hasExistingData ? "Finish Setup" : "Complete Setup"} <Check size={18} />
                </button>
              )}
            </div>
          )}
        </div>
        <Dialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.type}
        />
      </div>
    </>
  );
};
