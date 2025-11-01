import { AllocatorInput } from '../types/agents.types';

/**
 * Scenario 1: Allocation normale valide
 * - 60% Tier A, 40% Tier B
 * - Respecte toutes les policies
 */
export const mockAllocatorNormal: AllocatorInput = {
  allocation: {
    totalAmount: 1_000_000,
    tierA: {
      amount: 600_000,
      percent: 0.60,
      target: 'SafeVault'
    },
    tierB: {
      amount: 400_000,
      percent: 0.40,
      target: 'Aave'
    }
  },
  policy: {
    minTierAPercent: 0.50,
    maxTierBPercent: 0.50,
    minDeploymentAmount: 50_000,
    maxSingleTransaction: 1_000_000,
    allowedProtocols: ['SafeVault', 'Aave', 'Compound']
  },
  blockchain: {
    currentBalance: 2_000_000,
    gasPrice: 20,
    slippageTolerance: 0.5
  }
};

/**
 * Scenario 2: Violation - Tier B trop élevé
 * - 30% Tier A, 70% Tier B
 * - Dépasse la limite de Tier B (max 50%)
 */
export const mockAllocatorViolationTierB: AllocatorInput = {
  allocation: {
    totalAmount: 1_000_000,
    tierA: {
      amount: 300_000,
      percent: 0.30,
      target: 'SafeVault'
    },
    tierB: {
      amount: 700_000,
      percent: 0.70,
      target: 'Aave'
    }
  },
  policy: {
    minTierAPercent: 0.50,
    maxTierBPercent: 0.50,
    minDeploymentAmount: 50_000,
    maxSingleTransaction: 1_000_000,
    allowedProtocols: ['SafeVault', 'Aave', 'Compound']
  },
  blockchain: {
    currentBalance: 2_000_000,
    gasPrice: 20,
    slippageTolerance: 0.5
  }
};

/**
 * Scenario 3: Violation - Montant trop petit
 * - $30,000 total (en dessous du minimum de $50,000)
 */
export const mockAllocatorViolationMinAmount: AllocatorInput = {
  allocation: {
    totalAmount: 30_000,
    tierA: {
      amount: 20_000,
      percent: 0.67,
      target: 'SafeVault'
    },
    tierB: {
      amount: 10_000,
      percent: 0.33,
      target: 'Aave'
    }
  },
  policy: {
    minTierAPercent: 0.50,
    maxTierBPercent: 0.50,
    minDeploymentAmount: 50_000,
    maxSingleTransaction: 1_000_000,
    allowedProtocols: ['SafeVault', 'Aave', 'Compound']
  },
  blockchain: {
    currentBalance: 2_000_000,
    gasPrice: 20,
    slippageTolerance: 0.5
  }
};

/**
 * Scenario 4: Violation - Balance insuffisant
 * - Essaie d'allouer $3M mais n'a que $2M
 */
export const mockAllocatorViolationBalance: AllocatorInput = {
  allocation: {
    totalAmount: 3_000_000,
    tierA: {
      amount: 1_800_000,
      percent: 0.60,
      target: 'SafeVault'
    },
    tierB: {
      amount: 1_200_000,
      percent: 0.40,
      target: 'Aave'
    }
  },
  policy: {
    minTierAPercent: 0.50,
    maxTierBPercent: 0.50,
    minDeploymentAmount: 50_000,
    maxSingleTransaction: 5_000_000,
    allowedProtocols: ['SafeVault', 'Aave', 'Compound']
  },
  blockchain: {
    currentBalance: 2_000_000,
    gasPrice: 20,
    slippageTolerance: 0.5
  }
};

/**
 * Scenario 5: Allocation conservatrice (80% Tier A)
 * - 80% Tier A, 20% Tier B
 * - Très sécuritaire, devrait être approuvé
 */
export const mockAllocatorConservative: AllocatorInput = {
  allocation: {
    totalAmount: 500_000,
    tierA: {
      amount: 400_000,
      percent: 0.80,
      target: 'SafeVault'
    },
    tierB: {
      amount: 100_000,
      percent: 0.20,
      target: 'Compound'
    }
  },
  policy: {
    minTierAPercent: 0.50,
    maxTierBPercent: 0.50,
    minDeploymentAmount: 50_000,
    maxSingleTransaction: 1_000_000,
    allowedProtocols: ['SafeVault', 'Aave', 'Compound']
  },
  blockchain: {
    currentBalance: 1_000_000,
    gasPrice: 15,
    slippageTolerance: 0.3
  }
};
