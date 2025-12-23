import { Expense } from '../types';

/**
 * Pattern Detection Service
 * Analyzes spending patterns and provides insights
 */

export interface SpendingPattern {
  type: 'recurring' | 'spike' | 'trend' | 'anomaly';
  category: string;
  description: string;
  confidence: number; // 0-1
  data: {
    amount?: number;
    frequency?: string;
    change?: number;
  };
}

/**
 * Detect recurring expenses
 */
function detectRecurringExpenses(expenses: Expense[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  const categoryAmounts: Record<string, { amounts: number[], dates: Date[] }> = {};

  // Group by category
  expenses.forEach(e => {
    if (e.type === 'Expense') {
      if (!categoryAmounts[e.category]) {
        categoryAmounts[e.category] = { amounts: [], dates: [] };
      }
      categoryAmounts[e.category].amounts.push(e.amount);
      categoryAmounts[e.category].dates.push(new Date(e.date));
    }
  });

  // Detect recurring patterns
  Object.entries(categoryAmounts).forEach(([category, data]) => {
    if (data.amounts.length >= 3) {
      const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
      const variance = data.amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / data.amounts.length;
      const stdDev = Math.sqrt(variance);

      // If amounts are consistent (low variance)
      if (stdDev / avgAmount < 0.3) { // Less than 30% variation
        patterns.push({
          type: 'recurring',
          category,
          description: `Regular ${category} expenses around ${avgAmount.toFixed(0)}`,
          confidence: Math.max(0.5, 1 - (stdDev / avgAmount)),
          data: {
            amount: avgAmount,
            frequency: data.amounts.length >= 12 ? 'monthly' : 'regular'
          }
        });
      }
    }
  });

  return patterns;
}

/**
 * Detect spending spikes
 */
function detectSpendingSpikes(expenses: Expense[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  const monthlyExpenses: Record<string, { total: number, byCategory: Record<string, number> }> = {};

  // Group by month
  expenses.forEach(e => {
    if (e.type === 'Expense') {
      const date = new Date(e.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyExpenses[monthKey]) {
        monthlyExpenses[monthKey] = { total: 0, byCategory: {} };
      }

      monthlyExpenses[monthKey].total += e.amount;
      monthlyExpenses[monthKey].byCategory[e.category] =
        (monthlyExpenses[monthKey].byCategory[e.category] || 0) + e.amount;
    }
  });

  const months = Object.keys(monthlyExpenses).sort();
  if (months.length >= 2) {
    const avgMonthlySpending = Object.values(monthlyExpenses).reduce((sum, m) => sum + m.total, 0) / months.length;

    // Check last month for spikes
    const lastMonth = months[months.length - 1];
    const lastMonthData = monthlyExpenses[lastMonth];

    if (lastMonthData.total > avgMonthlySpending * 1.5) {
      // Find which category caused the spike
      Object.entries(lastMonthData.byCategory).forEach(([category, amount]) => {
        const categoryAvg = Object.values(monthlyExpenses)
          .reduce((sum, m) => sum + (m.byCategory[category] || 0), 0) / months.length;

        if (amount > categoryAvg * 2) {
          patterns.push({
            type: 'spike',
            category,
            description: `Unusual spike in ${category} spending`,
            confidence: 0.8,
            data: {
              amount,
              change: ((amount - categoryAvg) / categoryAvg) * 100
            }
          });
        }
      });
    }
  }

  return patterns;
}

/**
 * Detect spending trends
 */
function detectSpendingTrends(expenses: Expense[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  const monthlyTotals: Record<string, number> = {};

  // Group by month
  expenses.forEach(e => {
    if (e.type === 'Expense') {
      const date = new Date(e.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + e.amount;
    }
  });

  const months = Object.keys(monthlyTotals).sort();
  if (months.length >= 3) {
    const recentMonths = months.slice(-3);
    const totals = recentMonths.map(m => monthlyTotals[m]);

    // Check if consistently increasing or decreasing
    const isIncreasing = totals[1] > totals[0] && totals[2] > totals[1];
    const isDecreasing = totals[1] < totals[0] && totals[2] < totals[1];

    if (isIncreasing) {
      const avgIncrease = ((totals[2] - totals[0]) / totals[0]) * 100;
      patterns.push({
        type: 'trend',
        category: 'Overall',
        description: `Spending increasing over last 3 months`,
        confidence: 0.7,
        data: {
          change: avgIncrease
        }
      });
    } else if (isDecreasing) {
      const avgDecrease = ((totals[0] - totals[2]) / totals[0]) * 100;
      patterns.push({
        type: 'trend',
        category: 'Overall',
        description: `Spending decreasing over last 3 months`,
        confidence: 0.7,
        data: {
          change: -avgDecrease
        }
      });
    }
  }

  return patterns;
}

/**
 * Detect anomalies
 */
function detectAnomalies(expenses: Expense[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  const categoryExpenses: Record<string, number[]> = {};

  // Group amounts by category
  expenses.forEach(e => {
    if (e.type === 'Expense') {
      if (!categoryExpenses[e.category]) {
        categoryExpenses[e.category] = [];
      }
      categoryExpenses[e.category].push(e.amount);
    }
  });

  // Find outliers using IQR method
  Object.entries(categoryExpenses).forEach(([category, amounts]) => {
    if (amounts.length >= 5) {
      const sorted = [...amounts].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const upperBound = q3 + (1.5 * iqr);

      const outliers = amounts.filter(a => a > upperBound);
      if (outliers.length > 0) {
        const maxOutlier = Math.max(...outliers);
        patterns.push({
          type: 'anomaly',
          category,
          description: `Unusually high ${category} transaction detected`,
          confidence: 0.6,
          data: {
            amount: maxOutlier
          }
        });
      }
    }
  });

  return patterns;
}

/**
 * Analyze all patterns
 */
export function analyzeSpendingPatterns(expenses: Expense[]): SpendingPattern[] {
  const allPatterns: SpendingPattern[] = [];

  // Run all detection algorithms
  allPatterns.push(...detectRecurringExpenses(expenses));
  allPatterns.push(...detectSpendingSpikes(expenses));
  allPatterns.push(...detectSpendingTrends(expenses));
  allPatterns.push(...detectAnomalies(expenses));

  // Sort by confidence
  return allPatterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Generate pattern summary for AI context
 */
export function generatePatternSummary(patterns: SpendingPattern[]): string {
  if (patterns.length === 0) {
    return 'No significant spending patterns detected.';
  }

  const highConfidence = patterns.filter(p => p.confidence >= 0.7);

  let summary = 'Detected Spending Patterns:\n';

  highConfidence.forEach((pattern, idx) => {
    summary += `${idx + 1}. ${pattern.description}`;
    if (pattern.data.amount) {
      summary += ` (Amount: ${pattern.data.amount.toFixed(0)})`;
    }
    if (pattern.data.change) {
      summary += ` (Change: ${pattern.data.change > 0 ? '+' : ''}${pattern.data.change.toFixed(1)}%)`;
    }
    summary += '\n';
  });

  return summary;
}
