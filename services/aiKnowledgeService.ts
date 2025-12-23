import { AIMessage } from '../types';

// AI Knowledge Base Storage
const AI_KNOWLEDGE_KEY = 'ai_knowledge_base';

interface AIKnowledgeBase {
  conversationHistory: AIMessage[];
  userPreferences?: {
    financialGoals?: string[];
    spendingHabits?: string[];
    budgetingStyle?: string;
  };
  insights?: {
    timestamp: Date;
    insight: string;
    category: string;
  }[];
  lastUpdated: Date;
}

export const getAIKnowledge = (): AIKnowledgeBase | null => {
  try {
    const stored = localStorage.getItem(AI_KNOWLEDGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    if (parsed.conversationHistory) {
      parsed.conversationHistory = parsed.conversationHistory.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    if (parsed.insights) {
      parsed.insights = parsed.insights.map((insight: any) => ({
        ...insight,
        timestamp: new Date(insight.timestamp)
      }));
    }
    parsed.lastUpdated = new Date(parsed.lastUpdated);
    return parsed;
  } catch (error) {
    console.error('Error loading AI knowledge base:', error);
    return null;
  }
};

export const saveAIKnowledge = (knowledge: AIKnowledgeBase): void => {
  try {
    localStorage.setItem(AI_KNOWLEDGE_KEY, JSON.stringify(knowledge));
  } catch (error) {
    console.error('Error saving AI knowledge base:', error);
  }
};

export const updateConversationHistory = (messages: AIMessage[]): void => {
  const knowledge = getAIKnowledge() || {
    conversationHistory: [],
    lastUpdated: new Date()
  };

  knowledge.conversationHistory = messages;
  knowledge.lastUpdated = new Date();

  saveAIKnowledge(knowledge);
};

export const addInsight = (insight: string, category: string): void => {
  const knowledge = getAIKnowledge() || {
    conversationHistory: [],
    insights: [],
    lastUpdated: new Date()
  };

  if (!knowledge.insights) knowledge.insights = [];

  knowledge.insights.push({
    timestamp: new Date(),
    insight,
    category
  });

  // Keep only last 50 insights
  if (knowledge.insights.length > 50) {
    knowledge.insights = knowledge.insights.slice(-50);
  }

  knowledge.lastUpdated = new Date();
  saveAIKnowledge(knowledge);
};

export const clearAIKnowledge = (): void => {
  localStorage.removeItem(AI_KNOWLEDGE_KEY);
};
