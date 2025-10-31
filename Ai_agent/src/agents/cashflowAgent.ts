import { Mistral } from '@mistralai/mistralai';
import { CashflowInput, CashflowOutput } from '../types/agents.types';

export class CashflowAgent {
  private client: Mistral;
  private model: string;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
    this.model = 'mistral-small-2506';
  }

  /**
   * Analyser les flux de trésorerie et prédire le montant déployable
   */
  async analyze(input: CashflowInput): Promise<CashflowOutput> {
    try {
      console.log('💰 Cashflow Agent: Starting analysis...');

      // Step 1: Calculer statistiques de base
      const stats = this.calculateStatistics(input);

      // Step 2: Utiliser Mistral pour l'analyse intelligente
      const llmAnalysis = await this.analyzewithLLM(input, stats);

      // Step 3: Compiler le résultat final
      const result: CashflowOutput = {
        success: true,
        agent: 'cashflow',
        timestamp: new Date(),
        data: {
          upcomingObligations: llmAnalysis.upcomingObligations,
          analysis: stats,
          recommendations: {
            minimumBuffer: llmAnalysis.minimumBuffer,
            deployableAmount: llmAnalysis.deployableAmount,
            confidenceScore: llmAnalysis.confidenceScore,
            reasoning: llmAnalysis.reasoning
          },
          warnings: llmAnalysis.warnings
        }
      };

      console.log(`✅ Cashflow Agent: Analysis complete`);
      console.log(`   Deployable: $${result.data.recommendations.deployableAmount.toLocaleString()}`);
      console.log(`   Buffer: $${result.data.recommendations.minimumBuffer.toLocaleString()}`);

      return result;

    } catch (error: any) {
      console.error('❌ Cashflow Agent error:', error.message);
      return {
        success: false,
        agent: 'cashflow',
        timestamp: new Date(),
        data: {
          upcomingObligations: [],
          analysis: {
            avgMonthlyExpenses: 0,
            avgMonthlyIncome: 0,
            burnRate: 0,
            volatility: 0
          },
          recommendations: {
            minimumBuffer: 0,
            deployableAmount: 0,
            confidenceScore: 0,
            reasoning: 'Analysis failed'
          },
          warnings: [error.message]
        },
        error: error.message
      };
    }
  }

  /**
   * Calculer les statistiques de base (sans LLM)
   */
  private calculateStatistics(input: CashflowInput) {
    const expenses = input.transactions.filter(t => t.type === 'expense');
    const income = input.transactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    // Période en mois (approximatif)
    const monthsInPeriod = input.analysisPeriod / 30;

    const avgMonthlyExpenses = totalExpenses / monthsInPeriod;
    const avgMonthlyIncome = totalIncome / monthsInPeriod;

    // Burn rate = dépenses par jour
    const burnRate = totalExpenses / input.analysisPeriod;

    // Volatilité = écart-type des dépenses mensuelles
    const expensesByMonth = this.groupByMonth(expenses);
    const monthlyTotals = Object.values(expensesByMonth);
    const volatility = this.calculateStdDev(monthlyTotals);

    return {
      avgMonthlyExpenses: Math.round(avgMonthlyExpenses),
      avgMonthlyIncome: Math.round(avgMonthlyIncome),
      burnRate: Math.round(burnRate),
      volatility: Math.round(volatility)
    };
  }

  /**
   * Analyser avec Mistral LLM
   */
  private async analyzewithLLM(input: CashflowInput, stats: any) {
    const prompt = this.buildPrompt(input, stats);

    const response = await this.client.chat.complete({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      maxTokens: 1000,
      responseFormat: {
        type: 'json_object' // Force JSON output
      }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid LLM response');
    }

    // Avec responseFormat: json_object, content est du JSON pur
    return JSON.parse(content);
  }

  /**
   * Construire le prompt pour Mistral
   */
  private buildPrompt(input: CashflowInput, stats: any): string {
    return `You are a treasury cashflow analyst for a $${input.currentBalance.toLocaleString()} USDC treasury.

## Historical Analysis (${input.analysisPeriod} days)
- Average monthly expenses: $${stats.avgMonthlyExpenses.toLocaleString()}
- Average monthly income: $${stats.avgMonthlyIncome.toLocaleString()}
- Daily burn rate: $${stats.burnRate.toLocaleString()}
- Volatility (std dev): $${stats.volatility.toLocaleString()}

## Recurring Obligations
${input.recurringObligations.map(o =>
  `- ${o.name}: $${o.amount.toLocaleString()} (${o.frequency}, next: ${o.nextDueDate})`
).join('\n')}

## Recent Transactions (last 10)
${input.transactions.slice(-10).map(t =>
  `${t.date}: ${t.type === 'expense' ? '-' : '+'}$${Math.abs(t.amount).toLocaleString()} (${t.category})`
).join('\n')}

## Your Task
Predict upcoming obligations for the next ${input.forecastHorizon} days and determine:
1. Minimum buffer to keep liquid
2. Deployable amount that can be safely invested

## Safety Rules
- Buffer must cover all obligations + safety margin
- Safety margin based on volatility:
  - Low volatility (< $20k): 1.2x multiplier
  - Medium volatility ($20-50k): 1.5x multiplier
  - High volatility (> $50k): 2.0x multiplier
- If deployable amount < $50k, recommend 0 (not worth deploying)

## REQUIRED Output Format (JSON ONLY - no markdown, no text outside JSON)

You MUST respond with a valid JSON object with this EXACT structure:

{
  "upcomingObligations": [
    {
      "date": "2025-11-01",
      "amount": 50000,
      "category": "payroll",
      "confidence": 0.95,
      "source": "recurring"
    }
  ],
  "minimumBuffer": 200000,
  "deployableAmount": 1800000,
  "confidenceScore": 0.87,
  "reasoning": "Based on 3-month average, upcoming payroll and vendor payments total $130k. Applied 1.5x safety multiplier due to medium volatility. Deployable: $2M - $200k buffer = $1.8M",
  "warnings": []
}

CRITICAL RULES:
- ALL fields are REQUIRED
- upcomingObligations must include all predicted expenses
- reasoning must explain your calculation clearly
- If balance < buffer, deployableAmount = 0
- warnings array for any concerns

Current date: ${input.currentDate}
Current balance: $${input.currentBalance.toLocaleString()}

Return ONLY the JSON object, nothing else.`;
  }

  /**
   * Grouper transactions par mois
   */
  private groupByMonth(transactions: any[]): Record<string, number> {
    const byMonth: Record<string, number[]> = {};

    transactions.forEach(t => {
      const month = t.date.substring(0, 7); // "2025-10"
      if (!byMonth[month]) {
        byMonth[month] = [];
      }
      byMonth[month].push(Math.abs(t.amount));
    });

    // Calculer total par mois
    const totals: Record<string, number> = {};
    Object.entries(byMonth).forEach(([month, amounts]) => {
      totals[month] = amounts.reduce((sum, a) => sum + a, 0);
    });

    return totals;
  }

  /**
   * Calculer écart-type
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

    return Math.sqrt(variance);
  }
}
