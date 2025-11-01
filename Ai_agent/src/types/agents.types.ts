// Types pour le système d'agents Treasury Autopilot

export type AgentName = "manager" | "cashflow" | "allocator" | "sentinel";

// ==================== CASHFLOW AGENT ====================

export interface CashflowInput {
  transactions: {
    date: string;
    amount: number;
    category: string;
    type: "income" | "expense";
    description?: string;
  }[];

  recurringObligations: {
    name: string;
    amount: number;
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    nextDueDate: string;
    category: string;
  }[];

  currentBalance: number;
  currentDate: string;
  analysisPeriod: number;
  forecastHorizon: number;
}

export interface CashflowOutput {
  success: boolean;
  agent: "cashflow";
  timestamp: Date;

  data: {
    upcomingObligations: {
      date: string;
      amount: number;
      category: string;
      confidence: number;
      source: "recurring" | "predicted" | "scheduled";
    }[];

    analysis: {
      avgMonthlyExpenses: number;
      avgMonthlyIncome: number;
      burnRate: number;
      volatility: number;
    };

    recommendations: {
      minimumBuffer: number;
      deployableAmount: number;
      confidenceScore: number;
      reasoning: string;
    };

    warnings: string[];
  };

  error?: string;
}

// ==================== SENTINEL AGENT ====================

export interface SentinelInput {
  metrics: {
    usdcPeg: {
      value: number;
      timestamp: Date;
      source: string;
    };

    protocolHealth: {
      protocol: "aave" | "compound" | "safevault";
      tvl: number;
      tvlChange24h: number;
      liquidityRatio: number;
      utilizationRate: number;
    }[];

    portfolioMetrics: {
      totalDeployed: number;
      tierA: number;
      tierB: number;
      liquidBalance: number;
    };
  };

  policy: {
    usdcPegMin: number;
    usdcPegMax: number;
    tvlDropThreshold: number;
    liquidityRatioMin: number;
    maxAllocTierB: number;
  };

  lastCheckTimestamp: Date;
  alertHistory: {
    timestamp: Date;
    level: "WARNING" | "CRITICAL";
    trigger: string;
  }[];
}

export interface SentinelOutput {
  success: boolean;
  agent: "sentinel";
  timestamp: Date;

  data: {
    alertLevel: "NONE" | "WARNING" | "CRITICAL";

    triggers: {
      name: string;
      severity: "WARNING" | "CRITICAL";
      value: number;
      threshold: number;
      message: string;
    }[];

    recommendedAction: "HOLD" | "WITHDRAW_PARTIAL" | "WITHDRAW_ALL";
    withdrawAmount?: number;
    urgency: "LOW" | "MEDIUM" | "HIGH";
    reasoning: string[];

    currentMetrics: {
      usdcPeg: number;
      avgTvlChange: number;
      minLiquidityRatio: number;
    };
  };

  error?: string;
}

// ==================== ALLOCATOR AGENT ====================

export interface AllocatorInput {
  allocation: {
    totalAmount: number;
    tierA: {
      amount: number;
      percent: number;
      target: "SafeVault";
    };
    tierB: {
      amount: number;
      percent: number;
      target: "Aave" | "Compound";
    };
  };

  policy: {
    minTierAPercent: number;
    maxTierBPercent: number;
    minDeploymentAmount: number;
    maxSingleTransaction: number;
    allowedProtocols: string[];
  };

  blockchain: {
    currentBalance: number;
    gasPrice: number;
    slippageTolerance: number;
  };
}

export interface AllocatorOutput {
  success: boolean;
  agent: "allocator";
  timestamp: Date;

  data: {
    executed: boolean;

    transactions: {
      target: "SafeVault" | "Aave";
      amount: number;
      txHash: string;
      gasUsed: string;
      status: "pending" | "confirmed" | "failed";
      timestamp: Date;
    }[];

    policyCheck: {
      passed: boolean;
      violations: string[];
    };

    finalAllocation: {
      tierA: number;
      tierB: number;
      total: number;
    };

    executionTime: number;
  };

  error?: string;
}

// ==================== MANAGER AGENT ====================

export interface ManagerInput {
  reports: {
    cashflow?: CashflowOutput;
    sentinel?: SentinelOutput;
  };

  systemState: {
    treasuryBalance: number;
    currentAllocations: {
      tierA: number;
      tierB: number;
      liquid: number;
    };
    lastAllocationDate: Date;
    cycleNumber: number;
  };

  mode: "normal" | "emergency" | "simulation";
  userOverride?: {
    forceAction: "ALLOCATE" | "WITHDRAW" | "HOLD";
    reason: string;
  };
}

export interface ManagerOutput {
  success: boolean;
  agent: "manager";
  timestamp: Date;

  data: {
    decision: "ALLOCATE" | "WITHDRAW" | "HOLD" | "REBALANCE";

    reasoning: {
      summary: string;
      steps: string[];
      confidence: number;
      factors: {
        cashflowAnalysis: string;
        sentinelCheck: string;
        policyCompliance: string;
      };
    };

    action?: {
      type: "deploy" | "withdraw" | "rebalance";
      target: "allocator" | "sentinel";
      params: {
        amount?: number;
        tierA?: number;
        tierB?: number;
      };
    };

    reportsAnalyzed: string[];
    executionPlan: string;
  };

  error?: string;
}
