import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Minimize2,
  Maximize2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AIMessage, AIProvider, Expense, Budget, SavingsGoal, CategoryItem } from '../types';
import { sendMessageStream, getSuggestedPrompts } from '../services/aiService';

interface AIAssistantProps {
  expenses: Expense[];
  budgets: Budget[];
  goals: SavingsGoal[];
  categoryItems: CategoryItem[];
  aiProvider: AIProvider | null;
  aiApiKey: string | null;
  enabled: boolean;
  currencySymbol: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  expenses,
  budgets,
  goals,
  categoryItems,
  aiProvider,
  aiApiKey,
  enabled,
  currencySymbol
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history from knowledge base on mount
  useEffect(() => {
    const loadKnowledge = async () => {
      const { getAIKnowledge } = await import('../services/aiKnowledgeService');
      const knowledge = getAIKnowledge();
      if (knowledge?.conversationHistory && knowledge.conversationHistory.length > 0) {
        setMessages(knowledge.conversationHistory);
      }
    };
    loadKnowledge();
  }, []);

  // Save conversation history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const saveKnowledge = async () => {
        const { updateConversationHistory } = await import('../services/aiKnowledgeService');
        updateConversationHistory(messages);
      };
      saveKnowledge();
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check if AI is configured
    if (!aiProvider || !aiApiKey) {
      setError(t('ai.errors.noApiKey'));
      return;
    }

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: AIMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const context = {
        expenses,
        budgets,
        goals,
        categoryItems,
        currencySymbol
      };

      // Stream the response
      let fullResponse = '';
      // Pass previous messages as conversation history (exclude the current assistant placeholder)
      const conversationHistory = messages.filter(msg => msg.id !== assistantMessageId);

      for await (const chunk of sendMessageStream(aiProvider, aiApiKey, userMessage.content, context, conversationHistory)) {
        fullResponse += chunk;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

    } catch (err: any) {
      console.error('AI Error:', err);
      setError(err.message || t('ai.errors.apiError'));

      // Remove the failed assistant message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleClearChat = async () => {
    setMessages([]);
    setError(null);
    const { clearAIKnowledge } = await import('../services/aiKnowledgeService');
    clearAIKnowledge();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!enabled) return null;

  const suggestedPrompts = getSuggestedPrompts({ expenses, budgets, goals, categoryItems });

  return (
    <>
      {/* Floating Action Button - Mobile Optimized */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label={t('ai.title')}
        >
          <Sparkles size={24} className="md:w-6 md:h-6" />
        </button>
      )}

      {/* Chat Panel - Responsive Design */}
      {isOpen && (
        <div className={`fixed z-50 transition-all duration-300 ${isMinimized
          ? 'bottom-4 right-4 w-72'
          : 'bottom-0 right-0 md:bottom-4 md:right-4 w-full h-full md:w-96 md:h-[600px] md:max-h-[80vh]'
          }`}>
          <div className="bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden border border-gray-200">

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-semibold text-base md:text-lg">{t('ai.title')}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors hidden md:block"
                  aria-label={isMinimized ? t('ai.maximize') : t('ai.minimize')}
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={handleClearChat}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      aria-label={t('ai.clear')}
                      title="Clear chat history"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <Sparkles size={48} className="mx-auto text-purple-400 mb-4" />
                      <p className="text-gray-600 mb-4 text-sm md:text-base">
                        {t('ai.welcome', 'Hi! I\'m your AI financial assistant. Ask me anything about your finances!')}
                      </p>

                      {/* Quick Actions - Mobile Optimized */}
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium mb-2">{t('ai.quickActions.title', 'Quick Actions:')}</p>
                        <div className="grid grid-cols-1 gap-2">
                          {suggestedPrompts.map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickAction(prompt)}
                              className="text-left px-3 py-2 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-colors text-xs md:text-sm text-gray-700"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 py-2 md:px-4 md:py-2.5 ${msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                          }`}
                      >
                        <div className="text-sm md:text-base whitespace-pre-wrap break-words">
                          {msg.role === 'assistant' ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: msg.content
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/`(.*?)`/g, '<code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 0.875em;">$1</code>')
                                  .replace(/\n/g, '<br/>')
                              }}
                            />
                          ) : (
                            msg.content
                          )}
                          {msg.isStreaming && (
                            <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                          }`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Mobile Optimized */}
                <div className="p-3 md:p-4 bg-white border-t border-gray-200">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('ai.chatPlaceholder')}
                      disabled={isLoading}
                      className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 md:px-4 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base"
                      rows={1}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl px-3 md:px-4 py-2 md:py-2.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px] md:min-w-[48px]"
                      aria-label={t('ai.send')}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={18} className="md:w-5 md:h-5" />
                      )}
                    </button>
                  </div>

                  {!aiProvider && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {t('ai.errors.noApiKey')}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Minimized State */}
            {isMinimized && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600">{t('ai.minimized', 'Chat minimized')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
