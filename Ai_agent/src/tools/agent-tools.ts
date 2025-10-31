/**
 * Tools definitions for Manager Agent function calling
 * Ces tools permettent au Manager d'appeler dynamiquement les sub-agents
 */

export const agentTools = [
  {
    type: "function" as const,
    function: {
      name: "analyze_cashflow",
      description: "Analyze treasury cashflow to predict upcoming obligations and determine deployable amount. Call this to understand liquidity needs before making allocation decisions.",
      parameters: {
        type: "object",
        properties: {
          currentBalance: {
            type: "number",
            description: "Current treasury balance in USDC"
          },
          analysisPeriod: {
            type: "number",
            description: "Number of days to analyze historical data (default: 90)"
          },
          forecastHorizon: {
            type: "number",
            description: "Number of days to forecast future obligations (default: 30)"
          }
        },
        required: ["currentBalance"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "check_risks",
      description: "Check for protocol risks, USDC peg status, and market conditions. Call this to assess if it's safe to deploy capital or if withdrawal is needed.",
      parameters: {
        type: "object",
        properties: {
          totalDeployed: {
            type: "number",
            description: "Total amount currently deployed in DeFi protocols"
          },
          checkDepth: {
            type: "string",
            enum: ["quick", "thorough"],
            description: "Level of risk analysis (quick for routine checks, thorough for critical decisions)"
          }
        },
        required: ["totalDeployed"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "execute_allocation",
      description: "Execute validated allocation to DeFi protocols. Only call this after both cashflow and risk checks are green. This will create real blockchain transactions.",
      parameters: {
        type: "object",
        properties: {
          totalAmount: {
            type: "number",
            description: "Total amount to allocate in USDC"
          },
          tierAAmount: {
            type: "number",
            description: "Amount to allocate to Tier A (SafeVault)"
          },
          tierBAmount: {
            type: "number",
            description: "Amount to allocate to Tier B (Aave/Compound)"
          },
          tierBTarget: {
            type: "string",
            enum: ["Aave", "Compound"],
            description: "Target protocol for Tier B allocation"
          }
        },
        required: ["totalAmount", "tierAAmount", "tierBAmount", "tierBTarget"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "execute_withdrawal",
      description: "Execute withdrawal from DeFi protocols. Call this when Sentinel detects critical risks or when liquidity is needed for obligations.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Amount to withdraw in USDC (use 0 or 'all' for full withdrawal)"
          },
          urgency: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Urgency level (high = immediate, medium = within 24h, low = scheduled)"
          },
          reason: {
            type: "string",
            description: "Reason for withdrawal (for logging)"
          }
        },
        required: ["amount", "urgency", "reason"]
      }
    }
  }
];

/**
 * Type-safe tool call handlers
 */
export interface ToolCallHandlers {
  analyze_cashflow: (params: {
    currentBalance: number;
    analysisPeriod?: number;
    forecastHorizon?: number;
  }) => Promise<any>;

  check_risks: (params: {
    totalDeployed: number;
    checkDepth?: "quick" | "thorough";
  }) => Promise<any>;

  execute_allocation: (params: {
    totalAmount: number;
    tierAAmount: number;
    tierBAmount: number;
    tierBTarget: "Aave" | "Compound";
  }) => Promise<any>;

  execute_withdrawal: (params: {
    amount: number;
    urgency: "low" | "medium" | "high";
    reason: string;
  }) => Promise<any>;
}
