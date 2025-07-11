import { useCallback } from 'react';

export const useBudgetDetection = () => {
  const extractBudget = useCallback((message: string): number | null => {
    // Patterns to detect budget mentions in Portuguese
    const patterns = [
      /(?:orçamento|budget|tenho|posso gastar|disposto a gastar|disponho|tenho disponível)\s*(?:de|é|até|no máximo)?\s*r?\$?\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i,
      /r?\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i,
      /(\d+(?:\.\d{3})*(?:,\d{2})?)\s*reais/i,
      /até\s*r?\$?\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i,
      /máximo\s*(?:de)?\s*r?\$?\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i,
      /investir\s*(?:até|no máximo)?\s*r?\$?\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i,
      /(?:entre|de)\s*r?\$?\s*\d+\s*(?:a|até)\s*r?\$?\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const budgetStr = match[1].replace(/\./g, '').replace(',', '.');
        const budget = parseFloat(budgetStr);
        if (!isNaN(budget) && budget > 0) {
          return budget;
        }
      }
    }

    return null;
  }, []);

  const detectBudgetFromConversation = useCallback((messages: any[]): number | null => {
    // Check all messages for budget mentions, prioritizing recent ones
    const allMessages = [...messages].reverse(); // Start from most recent
    
    for (const message of allMessages) {
      if (message.role === 'user') {
        const budget = extractBudget(message.content);
        if (budget && budget >= 50) { // Only return valid budgets
          console.log('Budget detected from conversation:', budget);
          return budget;
        }
      }
    }

    console.log('No budget detected in conversation');
    return null;
  }, [extractBudget]);

  return {
    extractBudget,
    detectBudgetFromConversation
  };
};