import { CashflowInput } from '../types/agents.types';

// Mock data réaliste pour tester le Cashflow Agent
export const mockCashflowInput: CashflowInput = {
  transactions: [
    // Septembre 2025 - Expenses
    { date: "2025-09-01", amount: -50000, category: "payroll", type: "expense", description: "Monthly payroll" },
    { date: "2025-09-05", amount: -15000, category: "vendor", type: "expense", description: "AWS cloud services" },
    { date: "2025-09-10", amount: -8000, category: "vendor", type: "expense", description: "Office supplies" },
    { date: "2025-09-15", amount: -25000, category: "vendor", type: "expense", description: "Marketing campaign" },
    { date: "2025-09-20", amount: -12000, category: "vendor", type: "expense", description: "Legal services" },
    { date: "2025-09-25", amount: -30000, category: "vendor", type: "expense", description: "Equipment purchase" },

    // Septembre 2025 - Income
    { date: "2025-09-10", amount: 200000, category: "revenue", type: "income", description: "Client payments Q3" },

    // Octobre 2025 - Expenses
    { date: "2025-10-01", amount: -50000, category: "payroll", type: "expense", description: "Monthly payroll" },
    { date: "2025-10-05", amount: -15000, category: "vendor", type: "expense", description: "AWS cloud services" },
    { date: "2025-10-10", amount: -10000, category: "vendor", type: "expense", description: "Software licenses" },
    { date: "2025-10-15", amount: -20000, category: "vendor", type: "expense", description: "Marketing campaign" },
    { date: "2025-10-20", amount: -8000, category: "vendor", type: "expense", description: "Office rent" },
    { date: "2025-10-25", amount: -35000, category: "vendor", type: "expense", description: "Contractor payments" },

    // Octobre 2025 - Income
    { date: "2025-10-12", amount: 180000, category: "revenue", type: "income", description: "Client payments Q4" },

    // Août 2025 (historique)
    { date: "2025-08-01", amount: -48000, category: "payroll", type: "expense" },
    { date: "2025-08-05", amount: -14000, category: "vendor", type: "expense" },
    { date: "2025-08-15", amount: -22000, category: "vendor", type: "expense" },
    { date: "2025-08-20", amount: -18000, category: "vendor", type: "expense" },
    { date: "2025-08-10", amount: 190000, category: "revenue", type: "income" },

    // Juillet 2025 (historique)
    { date: "2025-07-01", amount: -50000, category: "payroll", type: "expense" },
    { date: "2025-07-05", amount: -16000, category: "vendor", type: "expense" },
    { date: "2025-07-15", amount: -28000, category: "vendor", type: "expense" },
    { date: "2025-07-25", amount: -20000, category: "vendor", type: "expense" },
    { date: "2025-07-10", amount: 210000, category: "revenue", type: "income" },
  ],

  recurringObligations: [
    {
      name: "Monthly payroll",
      amount: 50000,
      frequency: "monthly",
      nextDueDate: "2025-11-01",
      category: "payroll"
    },
    {
      name: "AWS cloud services",
      amount: 15000,
      frequency: "monthly",
      nextDueDate: "2025-11-05",
      category: "vendor"
    },
    {
      name: "Office rent",
      amount: 8000,
      frequency: "monthly",
      nextDueDate: "2025-11-01",
      category: "vendor"
    },
    {
      name: "Quarterly taxes",
      amount: 80000,
      frequency: "yearly",
      nextDueDate: "2025-12-31",
      category: "taxes"
    }
  ],

  currentBalance: 2000000, // $2M USDC
  currentDate: "2025-10-30",
  analysisPeriod: 90, // 3 mois d'historique
  forecastHorizon: 30 // Prédire 30 jours
};

// Scénario avec volatilité haute
export const mockCashflowHighVolatility: CashflowInput = {
  ...mockCashflowInput,
  transactions: [
    { date: "2025-10-01", amount: -50000, category: "payroll", type: "expense" },
    { date: "2025-10-05", amount: -200000, category: "vendor", type: "expense", description: "Large equipment purchase" },
    { date: "2025-10-10", amount: -5000, category: "vendor", type: "expense" },
    { date: "2025-10-15", amount: -150000, category: "vendor", type: "expense", description: "Emergency repairs" },
    { date: "2025-10-20", amount: 500000, category: "revenue", type: "income", description: "Large contract" },
  ]
};

// Scénario avec balance insuffisante
export const mockCashflowLowBalance: CashflowInput = {
  ...mockCashflowInput,
  currentBalance: 100000, // Seulement $100k
};
