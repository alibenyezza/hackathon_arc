import { ManagerInput, CashflowOutput, SentinelOutput } from '../types/agents.types';

/**
 * Helper: Créer un rapport Cashflow mock
 */
function createMockCashflowReport(
  deployableAmount: number,
  minimumBuffer: number,
  confidence: number,
  warnings: string[] = []
): CashflowOutput {
  return {
    success: true,
    agent: 'cashflow',
    timestamp: new Date(),
    data: {
      upcomingObligations: [
        {
          date: '2025-11-01',
          amount: 50000,
          category: 'payroll',
          confidence: 0.95,
          source: 'recurring'
        }
      ],
      analysis: {
        avgMonthlyExpenses: 120000,
        avgMonthlyIncome: 150000,
        burnRate: 4000,
        volatility: 15000
      },
      recommendations: {
        minimumBuffer,
        deployableAmount,
        confidenceScore: confidence,
        reasoning: `Based on 90-day analysis, keeping $${minimumBuffer.toLocaleString()} buffer. Safe to deploy $${deployableAmount.toLocaleString()}.`
      },
      warnings
    }
  };
}

/**
 * Helper: Créer un rapport Sentinel mock
 */
function createMockSentinelReport(
  alertLevel: 'NONE' | 'WARNING' | 'CRITICAL',
  recommendedAction: 'HOLD' | 'WITHDRAW_PARTIAL' | 'WITHDRAW_ALL',
  usdcPeg: number = 1.0,
  triggers: any[] = []
): SentinelOutput {
  const baseData = {
    alertLevel,
    triggers,
    recommendedAction,
    urgency: alertLevel === 'CRITICAL' ? 'HIGH' as const : alertLevel === 'WARNING' ? 'MEDIUM' as const : 'LOW' as const,
    reasoning: [
      `USDC peg at ${usdcPeg} - ${usdcPeg >= 0.998 ? 'stable' : 'concerning'}`,
      `TVL changes minimal, protocols healthy`,
      `Liquidity ratios acceptable`,
      `Overall risk: ${alertLevel}`,
      `Recommendation: ${recommendedAction}`
    ],
    currentMetrics: {
      usdcPeg,
      avgTvlChange: -1.2,
      minLiquidityRatio: 0.25
    }
  };

  if (alertLevel === 'CRITICAL') {
    return {
      success: true,
      agent: 'sentinel',
      timestamp: new Date(),
      data: {
        ...baseData,
        withdrawAmount: 800000
      }
    };
  }

  return {
    success: true,
    agent: 'sentinel',
    timestamp: new Date(),
    data: baseData
  };
}

/**
 * Scenario 1: Normal - Tout va bien, on peut allouer
 * - Cashflow: $1.8M déployable, confidence 0.9
 * - Sentinel: NONE, tout stable
 * - Décision attendue: ALLOCATE
 */
export const mockManagerNormal: ManagerInput = {
  reports: {
    cashflow: createMockCashflowReport(1_800_000, 200_000, 0.9),
    sentinel: createMockSentinelReport('NONE', 'HOLD', 1.0)
  },
  systemState: {
    treasuryBalance: 2_000_000,
    currentAllocations: {
      tierA: 0,
      tierB: 0,
      liquid: 2_000_000
    },
    lastAllocationDate: new Date('2025-10-15'),
    cycleNumber: 1
  },
  mode: 'normal'
};

/**
 * Scenario 2: Sentinel WARNING - Réduire allocation
 * - Cashflow: $1.5M déployable
 * - Sentinel: WARNING (USDC peg 0.997)
 * - Décision attendue: ALLOCATE mais conservateur (70/30 au lieu de 60/40)
 */
export const mockManagerSentinelWarning: ManagerInput = {
  reports: {
    cashflow: createMockCashflowReport(1_500_000, 300_000, 0.85),
    sentinel: createMockSentinelReport(
      'WARNING',
      'HOLD',
      0.997,
      [{
        name: 'USDC_DEPEG_WARNING',
        severity: 'WARNING' as const,
        value: 0.997,
        threshold: 0.998,
        message: 'USDC peg at 0.997 (below 0.998)'
      }]
    )
  },
  systemState: {
    treasuryBalance: 1_800_000,
    currentAllocations: {
      tierA: 300_000,
      tierB: 200_000,
      liquid: 1_300_000
    },
    lastAllocationDate: new Date('2025-10-20'),
    cycleNumber: 3
  },
  mode: 'normal'
};

/**
 * Scenario 3: Sentinel CRITICAL - Retrait immédiat
 * - Sentinel: CRITICAL (USDC depeg 0.992)
 * - Décision attendue: WITHDRAW_ALL (sans même regarder Cashflow)
 */
export const mockManagerSentinelCritical: ManagerInput = {
  reports: {
    cashflow: createMockCashflowReport(1_000_000, 250_000, 0.8),
    sentinel: createMockSentinelReport(
      'CRITICAL',
      'WITHDRAW_ALL',
      0.992,
      [{
        name: 'USDC_DEPEG_CRITICAL',
        severity: 'CRITICAL' as const,
        value: 0.992,
        threshold: 0.995,
        message: 'USDC peg at 0.992 (critical depeg)'
      }]
    )
  },
  systemState: {
    treasuryBalance: 2_500_000,
    currentAllocations: {
      tierA: 600_000,
      tierB: 400_000,
      liquid: 1_500_000
    },
    lastAllocationDate: new Date('2025-10-25'),
    cycleNumber: 5
  },
  mode: 'normal'
};

/**
 * Scenario 4: Cashflow faible - HOLD
 * - Cashflow: Seulement $30k déployable (< $50k minimum)
 * - Sentinel: NONE
 * - Décision attendue: HOLD (pas assez de capital)
 */
export const mockManagerLowCashflow: ManagerInput = {
  reports: {
    cashflow: createMockCashflowReport(
      30_000,
      150_000,
      0.75,
      ['Upcoming large payment in 2 weeks', 'Volatility higher than usual']
    ),
    sentinel: createMockSentinelReport('NONE', 'HOLD', 1.0)
  },
  systemState: {
    treasuryBalance: 180_000,
    currentAllocations: {
      tierA: 0,
      tierB: 0,
      liquid: 180_000
    },
    lastAllocationDate: new Date('2025-10-28'),
    cycleNumber: 2
  },
  mode: 'normal'
};

/**
 * Scenario 5: User override - Force WITHDRAW
 * - User demande un retrait
 * - Décision attendue: Suivre l'override (avec validation)
 */
export const mockManagerUserOverride: ManagerInput = {
  reports: {
    cashflow: createMockCashflowReport(800_000, 200_000, 0.88),
    sentinel: createMockSentinelReport('NONE', 'HOLD', 1.0)
  },
  systemState: {
    treasuryBalance: 1_500_000,
    currentAllocations: {
      tierA: 400_000,
      tierB: 300_000,
      liquid: 800_000
    },
    lastAllocationDate: new Date('2025-10-29'),
    cycleNumber: 4
  },
  mode: 'normal',
  userOverride: {
    forceAction: 'WITHDRAW',
    reason: 'Need liquidity for upcoming acquisition'
  }
};

/**
 * Scenario 6: Emergency mode
 * - Mode emergency activé
 * - Décision attendue: WITHDRAW_ALL immédiat
 */
export const mockManagerEmergency: ManagerInput = {
  reports: {
    cashflow: createMockCashflowReport(1_000_000, 200_000, 0.85),
    sentinel: createMockSentinelReport('WARNING', 'HOLD', 0.998)
  },
  systemState: {
    treasuryBalance: 2_000_000,
    currentAllocations: {
      tierA: 500_000,
      tierB: 300_000,
      liquid: 1_200_000
    },
    lastAllocationDate: new Date('2025-10-30'),
    cycleNumber: 6
  },
  mode: 'emergency'
};
