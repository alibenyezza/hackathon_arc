import { SentinelInput } from '../types/agents.types';

// Policy standard pour tous les tests
const standardPolicy = {
  usdcPegMin: 0.998,
  usdcPegMax: 1.002,
  tvlDropThreshold: 35, // %
  liquidityRatioMin: 0.15,
  maxAllocTierB: 0.40
};

// Scénario 1: Tout est normal, pas de risque
export const mockSentinelNormal: SentinelInput = {
  metrics: {
    usdcPeg: {
      value: 1.000,
      timestamp: new Date('2025-10-30T10:00:00Z'),
      source: 'chainlink'
    },
    protocolHealth: [
      {
        protocol: 'safevault',
        tvl: 500000000, // $500M
        tvlChange24h: 2.5, // +2.5%
        liquidityRatio: 0.95,
        utilizationRate: 0.05
      },
      {
        protocol: 'aave',
        tvl: 2000000000, // $2B
        tvlChange24h: 1.2, // +1.2%
        liquidityRatio: 0.25,
        utilizationRate: 0.75
      }
    ],
    portfolioMetrics: {
      totalDeployed: 1800000,
      tierA: 1200000, // 66.7%
      tierB: 600000,  // 33.3%
      liquidBalance: 200000
    }
  },
  policy: standardPolicy,
  lastCheckTimestamp: new Date('2025-10-30T09:30:00Z'),
  alertHistory: []
};

// Scénario 2: WARNING - USDC peg légèrement bas
export const mockSentinelWarningPeg: SentinelInput = {
  metrics: {
    usdcPeg: {
      value: 0.997, // Sous le seuil de 0.998
      timestamp: new Date('2025-10-30T10:00:00Z'),
      source: 'chainlink'
    },
    protocolHealth: [
      {
        protocol: 'safevault',
        tvl: 500000000,
        tvlChange24h: 0.5,
        liquidityRatio: 0.95,
        utilizationRate: 0.05
      },
      {
        protocol: 'aave',
        tvl: 2000000000,
        tvlChange24h: -2.0, // Légère baisse
        liquidityRatio: 0.22,
        utilizationRate: 0.78
      }
    ],
    portfolioMetrics: {
      totalDeployed: 1800000,
      tierA: 1200000,
      tierB: 600000,
      liquidBalance: 200000
    }
  },
  policy: standardPolicy,
  lastCheckTimestamp: new Date('2025-10-30T09:30:00Z'),
  alertHistory: []
};

// Scénario 3: CRITICAL - TVL drop massif sur Aave
export const mockSentinelCriticalTVL: SentinelInput = {
  metrics: {
    usdcPeg: {
      value: 1.000,
      timestamp: new Date('2025-10-30T10:00:00Z'),
      source: 'chainlink'
    },
    protocolHealth: [
      {
        protocol: 'safevault',
        tvl: 500000000,
        tvlChange24h: 0,
        liquidityRatio: 0.95,
        utilizationRate: 0.05
      },
      {
        protocol: 'aave',
        tvl: 1200000000, // Baisse de $2B à $1.2B
        tvlChange24h: -40.0, // -40% (au-dessus du seuil de 35%)
        liquidityRatio: 0.12, // Sous le seuil de 0.15
        utilizationRate: 0.88
      }
    ],
    portfolioMetrics: {
      totalDeployed: 1800000,
      tierA: 1200000,
      tierB: 600000, // Tout est sur Aave !
      liquidBalance: 200000
    }
  },
  policy: standardPolicy,
  lastCheckTimestamp: new Date('2025-10-30T09:30:00Z'),
  alertHistory: []
};

// Scénario 4: CRITICAL - USDC depeg sévère
export const mockSentinelCriticalDepeg: SentinelInput = {
  metrics: {
    usdcPeg: {
      value: 0.992, // Très bas, depeg sévère
      timestamp: new Date('2025-10-30T10:00:00Z'),
      source: 'chainlink'
    },
    protocolHealth: [
      {
        protocol: 'safevault',
        tvl: 500000000,
        tvlChange24h: -10.0, // Baisse aussi
        liquidityRatio: 0.80,
        utilizationRate: 0.20
      },
      {
        protocol: 'aave',
        tvl: 1800000000,
        tvlChange24h: -15.0, // Baisse
        liquidityRatio: 0.18,
        utilizationRate: 0.82
      }
    ],
    portfolioMetrics: {
      totalDeployed: 1800000,
      tierA: 1200000,
      tierB: 600000,
      liquidBalance: 200000
    }
  },
  policy: standardPolicy,
  lastCheckTimestamp: new Date('2025-10-30T09:30:00Z'),
  alertHistory: []
};

// Scénario 5: Multi-WARNING - Plusieurs signaux faibles
export const mockSentinelMultiWarning: SentinelInput = {
  metrics: {
    usdcPeg: {
      value: 0.997, // Légèrement bas
      timestamp: new Date('2025-10-30T10:00:00Z'),
      source: 'chainlink'
    },
    protocolHealth: [
      {
        protocol: 'safevault',
        tvl: 490000000, // Légère baisse
        tvlChange24h: -2.0,
        liquidityRatio: 0.90,
        utilizationRate: 0.10
      },
      {
        protocol: 'aave',
        tvl: 1700000000,
        tvlChange24h: -15.0, // Baisse notable mais pas critique
        liquidityRatio: 0.16, // Juste au-dessus du seuil
        utilizationRate: 0.84
      }
    ],
    portfolioMetrics: {
      totalDeployed: 1800000,
      tierA: 1080000, // 60%
      tierB: 720000,  // 40% (limite max)
      liquidBalance: 200000
    }
  },
  policy: standardPolicy,
  lastCheckTimestamp: new Date('2025-10-30T09:30:00Z'),
  alertHistory: [
    {
      timestamp: new Date('2025-10-30T08:00:00Z'),
      level: 'WARNING',
      trigger: 'USDC peg below threshold'
    }
  ]
};
