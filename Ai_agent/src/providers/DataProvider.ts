/**
 * DataProvider - Couche d'abstraction pour les données
 *
 * Pour l'instant utilise mock data, mais conçu pour être facilement
 * remplacé par de vraies APIs blockchain quand Epic 1 sera prêt
 */

import { CashflowInput, SentinelInput } from '../types/agents.types';

export interface IDataProvider {
  getCashflowData(params: {
    currentBalance: number;
    analysisPeriod: number;
    forecastHorizon: number;
  }): Promise<CashflowInput>;

  getSentinelData(params: {
    totalDeployed: number;
    checkDepth: "quick" | "thorough";
  }): Promise<SentinelInput>;

  getCurrentBalance(): Promise<number>;
  getCurrentAllocations(): Promise<{
    tierA: number;
    tierB: number;
    liquid: number;
  }>;
}

/**
 * MockDataProvider - Utilise les données mock pour les tests
 * TODO: Remplacer par RealDataProvider quand Epic 1 est prêt
 */
export class MockDataProvider implements IDataProvider {

  async getCashflowData(params: {
    currentBalance: number;
    analysisPeriod: number;
    forecastHorizon: number;
  }): Promise<CashflowInput> {
    // Générer des transactions mock basées sur la balance
    const transactions = this.generateMockTransactions(params.analysisPeriod);

    return {
      transactions,
      recurringObligations: [
        {
          name: "Payroll",
          amount: 50000,
          frequency: "monthly" as const,
          nextDueDate: this.getNextMonthDate(),
          category: "payroll"
        },
        {
          name: "Vendor payments",
          amount: 30000,
          frequency: "monthly" as const,
          nextDueDate: this.getNextMonthDate(),
          category: "operational"
        }
      ],
      currentBalance: params.currentBalance,
      currentDate: new Date().toISOString().split('T')[0] || '2025-01-01',
      analysisPeriod: params.analysisPeriod,
      forecastHorizon: params.forecastHorizon
    };
  }

  async getSentinelData(params: {
    totalDeployed: number;
    checkDepth: "quick" | "thorough";
  }): Promise<SentinelInput> {
    // Mock des métriques de santé des protocoles
    return {
      metrics: {
        usdcPeg: {
          value: 1.0,
          timestamp: new Date(),
          source: "mock_oracle"
        },
        protocolHealth: [
          {
            protocol: "aave" as const,
            tvl: 5_000_000_000,
            tvlChange24h: -1.2,
            liquidityRatio: 0.35,
            utilizationRate: 0.65
          },
          {
            protocol: "compound" as const,
            tvl: 3_000_000_000,
            tvlChange24h: 0.8,
            liquidityRatio: 0.42,
            utilizationRate: 0.58
          },
          {
            protocol: "safevault" as const,
            tvl: 10_000_000,
            tvlChange24h: 2.1,
            liquidityRatio: 1.0,
            utilizationRate: 0.0
          }
        ],
        portfolioMetrics: {
          totalDeployed: params.totalDeployed,
          tierA: params.totalDeployed * 0.6,
          tierB: params.totalDeployed * 0.4,
          liquidBalance: 0
        }
      },
      policy: {
        usdcPegMin: 0.998,
        usdcPegMax: 1.002,
        tvlDropThreshold: 35,
        liquidityRatioMin: 0.15,
        maxAllocTierB: 0.50
      },
      lastCheckTimestamp: new Date(),
      alertHistory: []
    };
  }

  async getCurrentBalance(): Promise<number> {
    // Mock - en production, cela appellerait Circle API ou RPC Arc
    return 2_000_000;
  }

  async getCurrentAllocations(): Promise<{
    tierA: number;
    tierB: number;
    liquid: number;
  }> {
    // Mock - en production, cela lirait les smart contracts
    return {
      tierA: 0,
      tierB: 0,
      liquid: 2_000_000
    };
  }

  /**
   * Helpers pour générer des données mock réalistes
   */
  private generateMockTransactions(days: number): any[] {
    const transactions: any[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Quelques dépenses aléatoires
      if (Math.random() > 0.7) {
        transactions.push({
          date: date.toISOString().split('T')[0] || '2025-01-01',
          amount: Math.floor(Math.random() * 10000) + 1000,
          category: this.randomCategory(),
          type: "expense" as const,
          description: "Mock expense"
        });
      }

      // Quelques revenus
      if (Math.random() > 0.85) {
        transactions.push({
          date: date.toISOString().split('T')[0] || '2025-01-01',
          amount: Math.floor(Math.random() * 50000) + 10000,
          category: "revenue",
          type: "income" as const,
          description: "Mock income"
        });
      }
    }

    return transactions;
  }

  private randomCategory(): string {
    const categories = ["payroll", "vendor", "operational", "marketing", "software"];
    return categories[Math.floor(Math.random() * categories.length)] || "operational";
  }

  private getNextMonthDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    return date.toISOString().split('T')[0] || '2025-01-01';
  }
}

/**
 * RealDataProvider - Pour l'intégration avec Epic 1
 * TODO: Implémenter quand Circle API + Arc RPC sont prêts
 */
export class RealDataProvider implements IDataProvider {
  private arcRpcUrl: string;
  private circleApiKey: string;

  constructor(config: { arcRpcUrl: string; circleApiKey: string }) {
    this.arcRpcUrl = config.arcRpcUrl;
    this.circleApiKey = config.circleApiKey;
  }

  async getCashflowData(params: any): Promise<CashflowInput> {
    // TODO: Fetch real transactions from Arc blockchain
    throw new Error("RealDataProvider not implemented yet - waiting for Epic 1");
  }

  async getSentinelData(params: any): Promise<SentinelInput> {
    // TODO: Fetch real protocol metrics
    throw new Error("RealDataProvider not implemented yet - waiting for Epic 1");
  }

  async getCurrentBalance(): Promise<number> {
    // TODO: Call Circle API
    throw new Error("RealDataProvider not implemented yet - waiting for Epic 1");
  }

  async getCurrentAllocations(): Promise<any> {
    // TODO: Read from smart contracts
    throw new Error("RealDataProvider not implemented yet - waiting for Epic 1");
  }
}
