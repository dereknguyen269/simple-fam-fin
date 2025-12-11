
import { Expense, GoogleConfig, CategoryItem, TransactionType, RecurrenceFrequency, MemberItem, SavingsGoal, Wallet, Budget } from '../types';
import { saveGoogleToken, getGoogleToken, clearGoogleToken } from './storageService';

// Declare global variables for Google APIs
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

export const getUserProfile = async (): Promise<{ name: string; email: string; picture: string } | null> => {
  try {
    if (!window.gapi || !window.gapi.client) return null;

    // Use the userinfo endpoint which is simpler than People API for basic info
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${window.gapi.client.getToken().access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        name: data.name,
        email: data.email,
        picture: data.picture
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile", error);
    return null;
  }
};

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initializeGapiClient = async (config: GoogleConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Validate required config before attempting init
    if (!config.clientId || !config.apiKey) {
      reject(new Error("Missing required parameter client_id or apiKey"));
      return;
    }

    if (!window.gapi) {
      reject("Google API script not loaded");
      return;
    }

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: config.apiKey,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;

        // Try to restore saved token
        const savedToken = getGoogleToken();
        if (savedToken && window.gapi.client) {
          window.gapi.client.setToken(savedToken);
        }

        if (gisInited) resolve();
      } catch (err) {
        reject(err);
      }
    });

    if (window.google) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: SCOPES,
        callback: '', // defined later in requestAccessToken
      });
      gisInited = true;
      if (gapiInited) resolve();
    } else {
      reject("Google Identity script not loaded");
    }
  });
};

export const handleAuthClick = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject("Token client not initialized");
      return;
    }

    if (!window.gapi || !window.gapi.client) {
      reject("GAPI client not loaded");
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
        return;
      }

      // Set the token for gapi client
      if (resp.access_token && window.gapi.client) {
        window.gapi.client.setToken(resp);
        // Save token to localStorage for persistence
        saveGoogleToken(resp);
      }

      resolve();
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export const trySilentAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject("Token client not initialized");
      return;
    }

    if (!window.gapi || !window.gapi.client) {
      reject("GAPI client not loaded");
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        // Silent auth failed
        reject(resp);
      } else {
        // Silent auth success
        if (resp.access_token && window.gapi.client) {
          window.gapi.client.setToken(resp);
        }
        resolve();
      }
    };

    // Attempt to get token without prompt using 'none'
    tokenClient.requestAccessToken({ prompt: 'none' });
  });
};

export const handleSignOut = () => {
  if (!window.gapi || !window.gapi.client) return;

  const token = window.gapi.client.getToken();
  if (token !== null) {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      window.google.accounts.oauth2.revoke(token.access_token, () => { });
    }
    window.gapi.client.setToken('');
  }

  // Clear saved token from localStorage
  clearGoogleToken();
};

// Data Transformation
const HEADERS = ['ID', 'Date', 'Type', 'Description', 'Category', 'Member', 'Amount', 'Recurrence', 'Payment Method', 'Transfer To'];

const expenseToRow = (e: Expense): (string | number)[] => {
  return [
    e.id,
    e.date,
    e.type || TransactionType.EXPENSE,
    e.description,
    e.category,
    e.member,
    e.amount,
    e.recurrence || '',
    e.paymentMethod || '',
    e.transferToWalletId || ''
  ];
};

const rowToExpense = (row: any[], walletId: string): Expense | null => {
  if (!row || row.length < 6) return null;
  // Basic validation to skip header if it looks like header
  if (row[0] === 'ID' && (row[1] === 'Date' || row[2] === 'Type')) return null;

  return {
    id: row[0],
    date: row[1],
    type: (row[2] as TransactionType) || TransactionType.EXPENSE,
    description: row[3],
    category: row[4],
    member: row[5],
    amount: Number(row[6]),
    recurrence: row[7] ? row[7] as RecurrenceFrequency : undefined,
    paymentMethod: row[8] || 'Cash',
    walletId: walletId,
    transferToWalletId: row[9] || undefined
  };
};

// Determine Sheet Name for a Wallet
const getWalletSheetName = (wallet: Wallet): string => {
  if (wallet.id === 'main') return 'Main Wallet';
  return wallet.name;
};

// Helper to safely quote sheet names if they have spaces
const safeQuoteSheetName = (name: string): string => {
  // If already quoted, leave it
  if (name.startsWith("'") && name.endsWith("'")) return name;
  // If spaces or special chars, quote it
  if (/[\s\W]/.test(name)) return `'${name}'`;
  return name;
};

// Fetch Expenses iterating over all known wallets
export const fetchExpensesFromSheet = async (spreadsheetId: string): Promise<{ expenses: Expense[], wallets: Wallet[] }> => {
  try {
    if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) {
      throw new Error("GAPI Sheets client not loaded");
    }

    // 1. Fetch Wallets Metadata first
    const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitles = meta.result.sheets?.map((s: any) => s.properties.title) || [];

    let wallets: Wallet[] = [];

    if (sheetTitles.includes('Ref_Wallets')) {
      const wResp = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Ref_Wallets!A2:C'
      });
      if (wResp.result.values) {
        wallets = wResp.result.values.map((r: string[]) => ({
          id: r[0],
          name: r[1],
          type: r[2] as any,
          balance: 0
        }));
      }
    }

    // Fallback if no wallet meta found
    if (wallets.length === 0) {
      wallets.push({ id: 'main', name: 'Main Wallet', type: 'MAIN', balance: 0 });
    }

    // 2. Fetch Expenses for each wallet
    let allExpenses: Expense[] = [];

    // Construct request ranges for existing sheets only
    const rangesToRequest: string[] = [];
    const walletMap: Record<number, Wallet> = {}; // Maps the index in rangesToRequest to a Wallet

    wallets.forEach((w) => {
      const rawName = getWalletSheetName(w);
      // Check against sheetTitles (raw names)
      if (sheetTitles.includes(rawName)) {
        // Construct valid A1 notation (quoted if needed)
        rangesToRequest.push(`${safeQuoteSheetName(rawName)}!A:J`);
        walletMap[rangesToRequest.length - 1] = w;
      } else if (w.id === 'main' && sheetTitles.includes('Sheet1')) {
        // Fallback for Main Wallet if it might be named Sheet1 (legacy)
        rangesToRequest.push(`Sheet1!A:J`);
        walletMap[rangesToRequest.length - 1] = w;
      }
    });

    if (rangesToRequest.length > 0) {
      const batchResp = await window.gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: rangesToRequest
      });

      const valueRanges = batchResp.result.valueRanges;

      if (valueRanges) {
        valueRanges.forEach((vr: any, index: number) => {
          // Use index to find the corresponding wallet, instead of parsing range string
          const wallet = walletMap[index];

          if (wallet && vr.values) {
            const rows = vr.values;
            // Skip header if present (check ID col)
            const startIdx = (rows.length > 0 && rows[0][0] === 'ID') ? 1 : 0;
            for (let i = startIdx; i < rows.length; i++) {
              const exp = rowToExpense(rows[i], wallet.id);
              if (exp) allExpenses.push(exp);
            }
          }
        });
      }
    }

    return { expenses: allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), wallets };

  } catch (err) {
    console.error("Error fetching from sheet", err);
    throw err;
  }
};

export const saveExpensesToSheet = async (spreadsheetId: string, expenses: Expense[], wallets: Wallet[]): Promise<void> => {
  try {
    if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) {
      throw new Error("GAPI Sheets client not loaded");
    }

    // CRITICAL: Verify authentication BEFORE doing anything destructive
    const token = window.gapi.client.getToken();
    if (!token || !token.access_token) {
      throw new Error("Not authenticated. Please reconnect to Google.");
    }

    // 1. Ensure Metadata Sheets and Wallet Sheets exist
    await ensureRefSheetsExist(spreadsheetId, wallets);

    // 2. Prepare ALL data BEFORE clearing anything
    const walletRows = [['ID', 'Name', 'Type'], ...wallets.map(w => [w.id, w.name, w.type])];

    const walletDataToSave: Array<{ sheetName: string; rows: any[][] }> = [];
    for (const wallet of wallets) {
      const sheetName = safeQuoteSheetName(getWalletSheetName(wallet));
      const walletExpenses = expenses.filter(e => e.walletId === wallet.id);
      const rows = [HEADERS, ...walletExpenses.map(expenseToRow)];
      walletDataToSave.push({ sheetName, rows });
    }

    // 3. Save Wallet Metadata (this is safe, has headers)
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Ref_Wallets!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: walletRows }
    });

    // 4. Save Expenses per Wallet using ATOMIC clear+update approach
    // Use batchUpdate to minimize the window where data is cleared but not written
    for (const { sheetName, rows } of walletDataToSave) {
      // Verify token is still valid before each operation
      const currentToken = window.gapi.client.getToken();
      if (!currentToken || !currentToken.access_token) {
        throw new Error("Authentication lost during save. Data may be incomplete.");
      }

      // Clear and update in quick succession (not truly atomic, but minimizes risk)
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A:J`,
      });

      // Immediately write new data
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: rows },
      });
    }

  } catch (err: any) {
    console.error("Error saving to sheet", err);

    // Provide more helpful error messages
    if (err.message?.includes('authenticated') || err.message?.includes('token')) {
      throw new Error("Authentication expired during save. Please reconnect and try again.");
    } else if (err.status === 401 || err.status === 403) {
      throw new Error("Authentication failed. Please reconnect to Google Sheets.");
    } else if (err.status === 404) {
      throw new Error("Spreadsheet not found. Please check your configuration.");
    }

    throw err;
  }
};

// --- REF DATA, GOALS, BUDGETS SYNC ---

export const fetchRefData = async (spreadsheetId: string): Promise<{
  categories: CategoryItem[] | null,
  members: MemberItem[] | null,
  goals: SavingsGoal[] | null,
  budgets: Budget[] | null
}> => {
  try {
    if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) {
      return { categories: null, members: null, goals: null, budgets: null };
    }

    const response = await window.gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ['Categories!A2:C', 'Members!A2:B', 'Goals!A2:G', 'Budgets!A2:D']
    });

    const valueRanges = response.result.valueRanges;
    let categories: CategoryItem[] | null = null;
    let members: MemberItem[] | null = null;
    let goals: SavingsGoal[] | null = null;
    let budgets: Budget[] | null = null;

    if (valueRanges && valueRanges.length >= 3) {
      const catRows = valueRanges[0].values;
      const memRows = valueRanges[1].values;
      const goalRows = valueRanges[2].values;
      const budgetRows = valueRanges[3]?.values;

      if (catRows && catRows.length > 0) {
        categories = catRows.map((r: any[]) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: r[0],
          type: (r[1] === 'Income' || r[1] === 'Expense') ? r[1] : TransactionType.EXPENSE,
          color: r[2] || '#888888'
        })).filter((v: any) => v);
      }

      if (memRows && memRows.length > 0) {
        members = memRows.map((r: any[]) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: r[0],
          color: r[1] || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        })).filter((v: any) => v);
      }

      if (goalRows && goalRows.length > 0) {
        goals = goalRows.map((r: any[]) => {
          if (!r[0]) return null;
          return {
            id: r[0],
            name: r[1],
            targetAmount: Number(r[2]),
            currentAmount: Number(r[3]),
            deadline: r[4] || '',
            color: r[5] || '#3B82F6',
            walletId: r[6] || ''
          };
        }).filter((v: any) => v);
      }

      if (budgetRows && budgetRows.length > 0) {
        budgets = budgetRows.map((r: any[]) => {
          if (!r[0]) return null;
          return {
            id: r[0],
            category: r[1],
            limit: Number(r[2]),
            period: r[3] || 'MONTHLY'
          };
        }).filter((v: any) => v);
      }
    }

    return { categories, members, goals, budgets };
  } catch (err) {
    return { categories: null, members: null, goals: null, budgets: null };
  }
};

const ensureRefSheetsExist = async (spreadsheetId: string, wallets: Wallet[]) => {
  try {
    const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitles = meta.result.sheets?.map((s: any) => s.properties.title) || [];

    const requests = [];
    // Static Refs
    if (!sheetTitles.includes('Ref_Wallets')) {
      requests.push({ addSheet: { properties: { title: 'Ref_Wallets', gridProperties: { frozenRowCount: 1 } } } });
    }
    if (!sheetTitles.includes('Categories')) {
      requests.push({ addSheet: { properties: { title: 'Categories', gridProperties: { frozenRowCount: 1 } } } });
    }
    if (!sheetTitles.includes('Members')) {
      requests.push({ addSheet: { properties: { title: 'Members', gridProperties: { frozenRowCount: 1 } } } });
    }
    if (!sheetTitles.includes('Goals')) {
      requests.push({ addSheet: { properties: { title: 'Goals', gridProperties: { frozenRowCount: 1 } } } });
    }
    if (!sheetTitles.includes('Budgets')) {
      requests.push({ addSheet: { properties: { title: 'Budgets', gridProperties: { frozenRowCount: 1 } } } });
    }

    // Wallet Sheets
    wallets.forEach(w => {
      const name = getWalletSheetName(w);
      if (!sheetTitles.includes(name)) {
        requests.push({ addSheet: { properties: { title: name, gridProperties: { frozenRowCount: 1 } } } });
      }
    });

    if (requests.length > 0) {
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests }
      });
    }
  } catch (e) {
    console.error("Error ensuring ref sheets exist", e);
  }
};

export const saveRefData = async (spreadsheetId: string, categories: CategoryItem[], members: MemberItem[]): Promise<void> => {
  try {
    if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) return;

    const catData = [['Category Name', 'Type', 'Color'], ...categories.map(c => [c.name, c.type, c.color])];
    const memData = [['Member Name', 'Color'], ...members.map(m => [m.name, m.color])];

    await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        data: [
          { range: 'Categories!A1', values: catData },
          { range: 'Members!A1', values: memData }
        ],
        valueInputOption: 'USER_ENTERED'
      }
    });
  } catch (err) {
    console.error("Error saving ref data", err);
  }
};

export const saveGoalsToSheet = async (spreadsheetId: string, goals: SavingsGoal[]): Promise<void> => {
  try {
    if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) return;

    const rows = [['ID', 'Goal Name', 'Target Amount', 'Current Saved', 'Deadline', 'Color', 'Wallet ID'],
    ...goals.map(g => [g.id, g.name, g.targetAmount, g.currentAmount, g.deadline, g.color, g.walletId || ''])];

    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Goals!A:G',
    });

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Goals!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

  } catch (err) {
    console.error("Error saving goals to sheet", err);
  }
};

export const saveBudgetsToSheet = async (spreadsheetId: string, budgets: Budget[]): Promise<void> => {
  try {
    if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) return;

    // ID, Category, Limit, Period
    const rows = [['ID', 'Category', 'Limit', 'Period'],
    ...budgets.map(b => [b.id, b.category, b.limit, b.period])];

    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Budgets!A:D',
    });

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Budgets!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

  } catch (err) {
    console.error("Error saving budgets to sheet", err);
  }
};
