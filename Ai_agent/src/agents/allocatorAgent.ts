import { Mistral } from '@mistralai/mistralai';
import { AllocatorInput, AllocatorOutput } from '../types/agents.types';

export class AllocatorAgent {
  private client: Mistral;
  private model: string;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
    this.model = 'mistral-small-2506';
  }

  /**
   * Valider et exécuter les allocations
   */
  async execute(input: AllocatorInput): Promise<AllocatorOutput> {
    try {
      console.log('🎯 Allocator Agent: Starting execution...');

      // Step 1: Vérification rapide des policies (sans LLM)
      const quickCheck = this.performQuickPolicyCheck(input);

      if (!quickCheck.passed) {
        console.log('❌ Policy violations detected');
        return this.buildRejectionResponse(input, quickCheck.violations);
      }

      // Step 2: Analyse avec Mistral pour validation intelligente
      const llmValidation = await this.validateWithLLM(input);

      // Si LLM détecte des problèmes, on rejette
      if (!llmValidation.approved) {
        console.log('⚠️  LLM rejected allocation');
        return this.buildRejectionResponse(input, llmValidation.concerns);
      }

      // Step 3: Exécuter les transactions (mock pour l'instant)
      const transactions = this.createMockTransactions(input);

      // Step 4: Compiler le résultat final
      const result: AllocatorOutput = {
        success: true,
        agent: 'allocator',
        timestamp: new Date(),
        data: {
          executed: true,
          transactions,
          policyCheck: {
            passed: true,
            violations: []
          },
          finalAllocation: {
            tierA: input.allocation.tierA.amount,
            tierB: input.allocation.tierB.amount,
            total: input.allocation.totalAmount
          },
          executionTime: Date.now()
        }
      };

      console.log(`✅ Allocator Agent: Execution complete`);
      console.log(`   Tier A: $${result.data.finalAllocation.tierA.toLocaleString()}`);
      console.log(`   Tier B: $${result.data.finalAllocation.tierB.toLocaleString()}`);
      console.log(`   Transactions: ${result.data.transactions.length}`);

      return result;

    } catch (error: any) {
      console.error('❌ Allocator Agent error:', error.message);
      return {
        success: false,
        agent: 'allocator',
        timestamp: new Date(),
        data: {
          executed: false,
          transactions: [],
          policyCheck: {
            passed: false,
            violations: [error.message]
          },
          finalAllocation: {
            tierA: 0,
            tierB: 0,
            total: 0
          },
          executionTime: 0
        },
        error: error.message
      };
    }
  }

  /**
   * Vérification rapide des policies (rules-based, sans LLM)
   */
  private performQuickPolicyCheck(input: AllocatorInput): {
    passed: boolean,
    violations: string[]
  } {
    const violations: string[] = [];
    const { allocation, policy, blockchain } = input;

    // Check 1: Montant minimum
    if (allocation.totalAmount < policy.minDeploymentAmount) {
      violations.push(
        `Total amount $${allocation.totalAmount.toLocaleString()} below minimum $${policy.minDeploymentAmount.toLocaleString()}`
      );
    }

    // Check 2: Tier A minimum
    if (allocation.tierA.percent < policy.minTierAPercent) {
      violations.push(
        `Tier A allocation ${(allocation.tierA.percent * 100).toFixed(1)}% below minimum ${(policy.minTierAPercent * 100).toFixed(1)}%`
      );
    }

    // Check 3: Tier B maximum
    if (allocation.tierB.percent > policy.maxTierBPercent) {
      violations.push(
        `Tier B allocation ${(allocation.tierB.percent * 100).toFixed(1)}% exceeds maximum ${(policy.maxTierBPercent * 100).toFixed(1)}%`
      );
    }

    // Check 4: Transaction unique trop grande
    if (allocation.tierA.amount > policy.maxSingleTransaction) {
      violations.push(
        `Tier A transaction $${allocation.tierA.amount.toLocaleString()} exceeds max single transaction $${policy.maxSingleTransaction.toLocaleString()}`
      );
    }

    if (allocation.tierB.amount > policy.maxSingleTransaction) {
      violations.push(
        `Tier B transaction $${allocation.tierB.amount.toLocaleString()} exceeds max single transaction $${policy.maxSingleTransaction.toLocaleString()}`
      );
    }

    // Check 5: Balance suffisant
    if (allocation.totalAmount > blockchain.currentBalance) {
      violations.push(
        `Insufficient balance: need $${allocation.totalAmount.toLocaleString()}, have $${blockchain.currentBalance.toLocaleString()}`
      );
    }

    // Check 6: Protocoles autorisés
    const allowedTargets = ['SafeVault', 'Aave', 'Compound'];
    if (!allowedTargets.includes(allocation.tierA.target)) {
      violations.push(`Tier A target "${allocation.tierA.target}" not in allowed protocols`);
    }
    if (!allowedTargets.includes(allocation.tierB.target)) {
      violations.push(`Tier B target "${allocation.tierB.target}" not in allowed protocols`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Validation intelligente avec Mistral
   */
  private async validateWithLLM(input: AllocatorInput) {
    const prompt = this.buildPrompt(input);

    const response = await this.client.chat.complete({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Très déterministe
      maxTokens: 800,
      responseFormat: {
        type: 'json_object'
      }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid LLM response');
    }

    return JSON.parse(content);
  }

  /**
   * Construire le prompt pour Mistral
   */
  private buildPrompt(input: AllocatorInput): string {
    return `You are the Allocator Agent - responsible for validating and executing treasury allocations.

## Proposed Allocation
Total amount: $${input.allocation.totalAmount.toLocaleString()}

Tier A (Safe): $${input.allocation.tierA.amount.toLocaleString()} (${(input.allocation.tierA.percent * 100).toFixed(1)}%)
  Target: ${input.allocation.tierA.target}

Tier B (DeFi): $${input.allocation.tierB.amount.toLocaleString()} (${(input.allocation.tierB.percent * 100).toFixed(1)}%)
  Target: ${input.allocation.tierB.target}

## Safety Policy (STRICT RULES)
- Minimum Tier A: ${(input.policy.minTierAPercent * 100).toFixed(1)}%
- Maximum Tier B: ${(input.policy.maxTierBPercent * 100).toFixed(1)}%
- Minimum deployment: $${input.policy.minDeploymentAmount.toLocaleString()}
- Max single transaction: $${input.policy.maxSingleTransaction.toLocaleString()}
- Allowed protocols: ${input.policy.allowedProtocols.join(', ')}

## Blockchain State
Current balance: $${input.blockchain.currentBalance.toLocaleString()}
Gas price: ${input.blockchain.gasPrice} gwei
Slippage tolerance: ${input.blockchain.slippageTolerance}%

## Your Task
Validate this allocation and determine if it should be approved for execution.

Consider:
1. Policy compliance (already checked, but double-check)
2. Risk balance (is the Tier A/B split reasonable?)
3. Gas costs (will fees eat into returns?)
4. Market conditions (is slippage acceptable?)

## REQUIRED Output Format (JSON ONLY)

You MUST respond with a valid JSON object with this EXACT structure:

{
  "approved": true,
  "confidence": 0.95,
  "concerns": [],
  "adjustments": [],
  "reasoning": "Clear explanation of why this allocation is safe and appropriate"
}

OR if rejected:

{
  "approved": false,
  "confidence": 0.0,
  "concerns": ["List of specific concerns"],
  "adjustments": ["Suggested fixes"],
  "reasoning": "Clear explanation of why this allocation was rejected"
}

CRITICAL RULES:
- ALL fields are REQUIRED
- approved must be boolean
- confidence between 0 and 1
- Safety first - reject if uncertain
- Be specific in concerns and adjustments

Return ONLY the JSON object, nothing else.`;
  }

  /**
   * Créer des transactions mock (blockchain intégration vient plus tard)
   */
  private createMockTransactions(input: AllocatorInput) {
    const transactions: any[] = [];

    // Transaction Tier A
    if (input.allocation.tierA.amount > 0) {
      transactions.push({
        target: input.allocation.tierA.target as "SafeVault" | "Aave",
        amount: input.allocation.tierA.amount,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        gasUsed: (21000 + Math.floor(Math.random() * 50000)).toString(),
        status: 'confirmed' as const,
        timestamp: new Date()
      });
    }

    // Transaction Tier B
    if (input.allocation.tierB.amount > 0) {
      transactions.push({
        target: input.allocation.tierB.target as "SafeVault" | "Aave",
        amount: input.allocation.tierB.amount,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        gasUsed: (21000 + Math.floor(Math.random() * 50000)).toString(),
        status: 'confirmed' as const,
        timestamp: new Date()
      });
    }

    return transactions;
  }

  /**
   * Construire une réponse de rejet
   */
  private buildRejectionResponse(input: AllocatorInput, violations: string[]): AllocatorOutput {
    return {
      success: false,
      agent: 'allocator',
      timestamp: new Date(),
      data: {
        executed: false,
        transactions: [],
        policyCheck: {
          passed: false,
          violations
        },
        finalAllocation: {
          tierA: 0,
          tierB: 0,
          total: 0
        },
        executionTime: 0
      },
      error: `Policy violations: ${violations.join('; ')}`
    };
  }
}
