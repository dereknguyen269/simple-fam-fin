import { AIProvider, Expense, Budget, SavingsGoal, CategoryItem } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API endpoints for each provider
const API_ENDPOINTS = {
  [AIProvider.GEMINI]: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
  [AIProvider.CHATGPT]: 'https://api.openai.com/v1/chat/completions',
  [AIProvider.CLAUDE]: 'https://api.anthropic.com/v1/messages',
  [AIProvider.OPENROUTER]: 'https://openrouter.ai/api/v1/chat/completions'
};

interface FinancialContext {
  expenses: Expense[];
  budgets?: Budget[];
  goals?: SavingsGoal[];
  categoryItems?: CategoryItem[];
  currencySymbol?: string;
}

/**
 * Generate financial context summary for AI prompts
 */
function generateFinancialSummary(context: FinancialContext): string {
  const { expenses, budgets, goals, currencySymbol = '$' } = context;

  // Calculate basic stats
  const totalExpenses = expenses
    .filter(e => e.type === 'Expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = expenses
    .filter(e => e.type === 'Income')
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryBreakdown = expenses
    .filter(e => e.type === 'Expense')
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: ${currencySymbol}${amt.toFixed(2)}`)
    .join(', ');

  let summary = `Financial Overview:
- Total Income: ${currencySymbol}${totalIncome.toFixed(2)}
- Total Expenses: ${currencySymbol}${totalExpenses.toFixed(2)}
- Net Savings: ${currencySymbol}${(totalIncome - totalExpenses).toFixed(2)}
- Number of Transactions: ${expenses.length}
- Top Spending Categories: ${topCategories || 'None'}`;

  if (budgets && budgets.length > 0) {
    summary += `\n- Active Budgets: ${budgets.length}`;
  }

  if (goals && goals.length > 0) {
    summary += `\n- Savings Goals: ${goals.length}`;
  }

  return summary;
}

/**
 * Test connection to AI provider
 */
export async function testConnection(provider: AIProvider, apiKey: string): Promise<boolean> {
  try {
    const response = await sendMessage(provider, apiKey, 'Hello', {
      expenses: []
    });
    return response.length > 0;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

/**
 * Send message to AI provider and get response
 */
export async function sendMessage(
  provider: AIProvider,
  apiKey: string,
  message: string,
  context: FinancialContext
): Promise<string> {
  const financialSummary = generateFinancialSummary(context);

  switch (provider) {
    case AIProvider.GEMINI:
      return sendToGemini(apiKey, message, financialSummary);
    case AIProvider.CHATGPT:
      return sendToChatGPT(apiKey, message, financialSummary);
    case AIProvider.CLAUDE:
      return sendToClaude(apiKey, message, financialSummary);
    case AIProvider.OPENROUTER:
      return sendToOpenRouter(apiKey, message, financialSummary);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Send message to AI provider with streaming support
 */
export async function* sendMessageStream(
  provider: AIProvider,
  apiKey: string,
  message: string,
  context: FinancialContext
): AsyncGenerator<string, void, unknown> {
  const financialSummary = generateFinancialSummary(context);

  switch (provider) {
    case AIProvider.GEMINI:
      yield* streamGemini(apiKey, message, financialSummary);
      break;
    case AIProvider.CHATGPT:
      yield* streamChatGPT(apiKey, message, financialSummary);
      break;
    case AIProvider.CLAUDE:
      yield* streamClaude(apiKey, message, financialSummary);
      break;
    case AIProvider.OPENROUTER:
      yield* streamOpenRouter(apiKey, message, financialSummary);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// --- Gemini Implementation (using SDK) ---

async function sendToGemini(apiKey: string, message: string, context: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const systemPrompt = `You are a helpful financial advisor assistant. You help users understand their spending patterns, create budgets, and achieve their financial goals. Be concise, friendly, and actionable in your advice.

${context}`;

  const prompt = `${systemPrompt}\n\nUser: ${message}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function* streamGemini(apiKey: string, message: string, context: string): AsyncGenerator<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const systemPrompt = `You are a helpful financial advisor assistant. You help users understand their spending patterns, create budgets, and achieve their financial goals. Be concise, friendly, and actionable in your advice.

${context}`;

  const prompt = `${systemPrompt}\n\nUser: ${message}`;

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

// --- ChatGPT Implementation ---

async function sendToChatGPT(apiKey: string, message: string, context: string): Promise<string> {
  const systemPrompt = `You are a helpful financial advisor assistant. You help users understand their spending patterns, create budgets, and achieve their financial goals. Be concise, friendly, and actionable in your advice.

${context}`;

  const response = await fetch(API_ENDPOINTS[AIProvider.CHATGPT], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`ChatGPT API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

async function* streamChatGPT(apiKey: string, message: string, context: string): AsyncGenerator<string> {
  const systemPrompt = `You are a helpful financial advisor assistant. You help users understand their spending patterns, create budgets, and achieve their financial goals. Be concise, friendly, and actionable in your advice.

${context}`;

  const response = await fetch(API_ENDPOINTS[AIProvider.CHATGPT], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`ChatGPT API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// --- Claude Implementation ---

async function sendToClaude(apiKey: string, message: string, context: string): Promise<string> {
  const systemPrompt = `You are a helpful financial advisor assistant. You help users understand their spending patterns, create budgets, and achieve their financial goals. Be concise, friendly, and actionable in your advice.

${context}`;

  const response = await fetch(API_ENDPOINTS[AIProvider.CLAUDE], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'No response';
}

async function* streamClaude(apiKey: string, message: string, context: string): AsyncGenerator<string> {
  const systemPrompt = `You are a helpful financial advisor assistant. You help users understand their spending patterns, create budgets, and achieve their financial goals. Be concise, friendly, and actionable in your advice.

${context}`;

  const response = await fetch(API_ENDPOINTS[AIProvider.CLAUDE], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta') {
            const text = parsed.delta?.text;
            if (text) yield text;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// --- OpenRouter Implementation ---

async function sendToOpenRouter(apiKey: string, message: string, context: string): Promise<string> {
  const systemPrompt = `You are a helpful financial advisor assistant. You help users understand their spending patterns, create budgets, and achieve their financial goals. Be concise, friendly, and actionable in your advice.

${context}`;

  const response = await fetch(API_ENDPOINTS[AIProvider.OPENROUTER], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'FamilyFinance'
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

async function* streamOpenRouter(apiKey: string, message: string, context: string): AsyncGenerator<string> {
  const systemPrompt = `You are a helpful financial advisor assistant. You help users understand their spending patterns, create budgets, and achieve their financial goals. Be concise, friendly, and actionable in your advice.

${context}`;

  const response = await fetch(API_ENDPOINTS[AIProvider.OPENROUTER], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'FamilyFinance'
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

/**
 * Get suggested prompts based on financial data
 */
export function getSuggestedPrompts(context: FinancialContext): string[] {
  const prompts = [
    'Analyze my spending this month',
    'How can I save more money?',
    'What are my biggest expenses?',
  ];

  if (context.budgets && context.budgets.length > 0) {
    prompts.push('Am I staying within my budgets?');
  }

  if (context.goals && context.goals.length > 0) {
    prompts.push('How can I reach my savings goals faster?');
  }

  return prompts;
}
