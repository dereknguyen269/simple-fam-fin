import { Expense } from '../types';

// Feature removed - functions stubbed to prevent errors if referenced elsewhere
export const initializeChat = (expenses: Expense[]) => {
  // No-op
};

export const sendMessageToGemini = async function* (message: string, currentExpenses: Expense[]) {
  // No-op
  yield "";
};

// Helper to reset chat when data changes
export const resetChat = (expenses: Expense[]) => {
  // No-op
};