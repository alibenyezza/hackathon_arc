import { Mistral } from '@mistralai/mistralai';
import { ManagerOutput, CashflowOutput, SentinelOutput, AllocatorOutput } from '../types/agents.types';
import { agentTools, ToolCallHandlers } from '../tools/agent-tools';
import { CashflowAgent } from './cashflowAgent';
import { SentinelAgent } from './sentinelAgent';
import { AllocatorAgent } from './allocatorAgent';
import { IDataProvider } from '../providers/DataProvider';

/**
 * ManagerAgentV2 - Version agentic avec function calling
 *
 * Ce Manager utilise Mistral function calling pour décider dynamiquement
 * quels agents appeler et dans quel ordre.
 */
export class ManagerAgentV2 {
  private client: Mistral;
  private model: string;
  private apiKey: string;
  private dataProvider: IDataProvider;

  // Sub-agents
  private cashflowAgent: CashflowAgent;
  private sentinelAgent: SentinelAgent;
  private allocatorAgent: AllocatorAgent;

  constructor(apiKey: string, dataProvider: IDataProvider) {
    this.client = new Mistral({ apiKey });
    this.model = 'magistral-medium-2509';
    this.apiKey = apiKey;
    this.dataProvider = dataProvider;

    // Initialiser les sub-agents
    this.cashflowAgent = new CashflowAgent(apiKey);
    this.sentinelAgent = new SentinelAgent(apiKey);
    this.allocatorAgent = new AllocatorAgent(apiKey);
  }

  /**
   * Orchestration principale avec function calling
   */
  async orchestrate(params: {
    mode?: 'normal' | 'emergency' | 'simulation';
    userOverride?: { forceAction: 'ALLOCATE' | 'WITHDRAW' | 'HOLD'; reason: string };
  }): Promise<ManagerOutput> {
    try {
      console.log('\n🎯 Manager Agent V2: Starting agentic orchestration...');
      console.log(`   Mode: ${params.mode || 'normal'}`);

      // Récupérer l'état actuel du système
      const currentBalance = await this.dataProvider.getCurrentBalance();
      const currentAllocations = await this.dataProvider.getCurrentAllocations();

      console.log(`   Treasury balance: $${currentBalance.toLocaleString()}`);
      console.log(`   Current allocations: A=$${currentAllocations.tierA.toLocaleString()}, B=$${currentAllocations.tierB.toLocaleString()}`);

      // Vérifications d'urgence
      if (params.mode === 'emergency') {
        console.log('🚨 Emergency mode - immediate withdrawal');
        return this.buildEmergencyResponse(currentAllocations);
      }

      // Construire le contexte initial
      const systemContext = this.buildSystemContext(currentBalance, currentAllocations, params);

      // Créer les tool handlers
      const toolHandlers = this.createToolHandlers();

      // Lancer l'orchestration avec function calling
      const result = await this.runAgenticLoop(systemContext, toolHandlers);

      console.log(`✅ Manager Agent V2: Decision made - ${result.data.decision}`);
      return result;

    } catch (error: any) {
      console.error('❌ Manager Agent V2 error:', error.message);
      return this.buildErrorResponse(error);
    }
  }

  /**
   * Boucle agentic avec function calling
   */
  private async runAgenticLoop(
    systemContext: string,
    toolHandlers: ToolCallHandlers
  ): Promise<ManagerOutput> {
    const messages: any[] = [
      {
        role: 'user',
        content: systemContext
      }
    ];

    let iteration = 0;
    const maxIterations = 10; // Sécurité contre boucles infinies

    // Stocker les résultats des agents pour la décision finale
    let cashflowReport: CashflowOutput | null = null;
    let sentinelReport: SentinelOutput | null = null;
    let allocationResult: AllocatorOutput | null = null;

    while (iteration < maxIterations) {
      iteration++;
      console.log(`\n🔄 Iteration ${iteration}:`);

      // Appeler Mistral avec tools
      const response = await this.client.chat.complete({
        model: this.model,
        messages,
        tools: agentTools,
        toolChoice: 'auto',
        temperature: 0.2,
        maxTokens: 2000
      });

      const assistantMessage = response.choices?.[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from LLM');
      }

      // Ajouter la réponse de l'assistant à l'historique
      messages.push(assistantMessage);

      // Si pas de tool calls, l'assistant a fini
      if (!assistantMessage.toolCalls || assistantMessage.toolCalls.length === 0) {
        console.log('✅ No more tool calls - making final decision');

        // Parser la décision finale
        const content = Array.isArray(assistantMessage.content)
          ? assistantMessage.content.map(c => {
              if (typeof c === 'string') return c;
              if ('text' in c) return c.text;
              return JSON.stringify(c);
            }).join('\n')
          : assistantMessage.content || '';

        const finalDecision = this.parseFinalDecision(
          content,
          cashflowReport,
          sentinelReport,
          allocationResult
        );

        return finalDecision;
      }

      // Exécuter les tool calls
      for (const toolCall of assistantMessage.toolCalls) {
        const functionName = toolCall.function.name as keyof ToolCallHandlers;
        const argsString = typeof toolCall.function.arguments === 'string'
          ? toolCall.function.arguments
          : JSON.stringify(toolCall.function.arguments);
        const args = JSON.parse(argsString);

        console.log(`   📞 Calling tool: ${functionName}`);
        console.log(`      Args: ${JSON.stringify(args, null, 2)}`);

        try {
          // Exécuter le tool
          const toolResult = await toolHandlers[functionName](args);

          // Stocker les résultats
          if (functionName === 'analyze_cashflow') {
            cashflowReport = toolResult;
          } else if (functionName === 'check_risks') {
            sentinelReport = toolResult;
          } else if (functionName === 'execute_allocation') {
            allocationResult = toolResult;
          }

          // Ajouter le résultat à l'historique
          messages.push({
            role: 'tool',
            name: functionName,
            toolCallId: toolCall.id,
            content: JSON.stringify(toolResult, null, 2)
          });

          console.log(`   ✅ Tool result received`);

        } catch (error: any) {
          console.error(`   ❌ Tool error: ${error.message}`);

          // Envoyer l'erreur au LLM
          messages.push({
            role: 'tool',
            name: functionName,
            toolCallId: toolCall.id,
            content: JSON.stringify({ error: error.message })
          });
        }
      }
    }

    throw new Error('Max iterations reached without final decision');
  }

  /**
   * Créer les handlers pour les tools
   */
  private createToolHandlers(): ToolCallHandlers {
    return {
      analyze_cashflow: async (params) => {
        console.log('      💰 Executing Cashflow Agent...');

        const cashflowData = await this.dataProvider.getCashflowData({
          currentBalance: params.currentBalance,
          analysisPeriod: params.analysisPeriod || 90,
          forecastHorizon: params.forecastHorizon || 30
        });

        const result = await this.cashflowAgent.analyze(cashflowData);
        return result;
      },

      check_risks: async (params) => {
        console.log('      🛡️  Executing Sentinel Agent...');

        const sentinelData = await this.dataProvider.getSentinelData({
          totalDeployed: params.totalDeployed,
          checkDepth: params.checkDepth || 'thorough'
        });

        const result = await this.sentinelAgent.checkRisks(sentinelData);
        return result;
      },

      execute_allocation: async (params) => {
        console.log('      🎯 Executing Allocator Agent...');

        const currentBalance = await this.dataProvider.getCurrentBalance();

        const allocationInput = {
          allocation: {
            totalAmount: params.totalAmount,
            tierA: {
              amount: params.tierAAmount,
              percent: params.tierAAmount / params.totalAmount,
              target: 'SafeVault' as const
            },
            tierB: {
              amount: params.tierBAmount,
              percent: params.tierBAmount / params.totalAmount,
              target: params.tierBTarget as 'Aave' | 'Compound'
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
            currentBalance,
            gasPrice: 20,
            slippageTolerance: 0.5
          }
        };

        const result = await this.allocatorAgent.execute(allocationInput);
        return result;
      },

      execute_withdrawal: async (params) => {
        console.log('      💸 Executing withdrawal...');

        // Pour l'instant, retrait simulé
        // TODO: Implémenter avec Epic 1
        return {
          success: true,
          amount: params.amount,
          urgency: params.urgency,
          reason: params.reason,
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          message: `Withdrawal of $${params.amount.toLocaleString()} executed (mock)`
        };
      }
    };
  }

  /**
   * Construire le contexte système pour le LLM
   */
  private buildSystemContext(
    currentBalance: number,
    currentAllocations: any,
    params: any
  ): string {
    return `You are the Manager Agent - the orchestrator for a Treasury Autopilot AI system managing $${currentBalance.toLocaleString()} USDC.

## Your Mission
Analyze the current treasury state and decide the best action: ALLOCATE, WITHDRAW, or HOLD.

## Current System State
Treasury balance: $${currentBalance.toLocaleString()}
Current allocations:
  - Tier A (SafeVault): $${currentAllocations.tierA.toLocaleString()}
  - Tier B (DeFi): $${currentAllocations.tierB.toLocaleString()}
  - Liquid: $${currentAllocations.liquid.toLocaleString()}

Mode: ${params.mode || 'normal'}
${params.userOverride ? `\n⚠️  USER OVERRIDE: ${params.userOverride.forceAction} - ${params.userOverride.reason}` : ''}

## Available Tools
You have access to specialized AI agents via function calls:

1. **analyze_cashflow** - Analyze historical transactions and predict upcoming obligations
   - Use this to understand liquidity needs
   - Returns: deployable amount, minimum buffer, confidence score

2. **check_risks** - Check protocol health, USDC peg, and market conditions
   - Use this to assess safety before deploying capital
   - Returns: alert level (NONE/WARNING/CRITICAL), recommended action, triggers

3. **execute_allocation** - Execute validated allocation to DeFi protocols
   - ONLY call this after both cashflow and risks are checked
   - Requires: totalAmount, tierAAmount, tierBAmount, tierBTarget

4. **execute_withdrawal** - Execute withdrawal from protocols
   - Call this if Sentinel detects critical risks
   - Requires: amount, urgency, reason

## Decision Framework (MANDATORY)

STEP 1: Always start by calling **analyze_cashflow** to understand liquidity
STEP 2: Call **check_risks** to assess market safety
STEP 3: Based on results, decide:
  - If Sentinel = CRITICAL → call execute_withdrawal immediately
  - If Sentinel = NONE and Cashflow > $50k → call execute_allocation
  - If Cashflow < $50k → HOLD (don't call any execution tools)
  - If Sentinel = WARNING → Use judgment (may reduce allocation or hold)

STEP 4: After execution (or decision to hold), provide your final reasoning in natural language.

## Policy Rules (NEVER VIOLATE)
- Minimum Tier A: 50%
- Maximum Tier B: 50%
- Minimum deployment: $50,000
- Always respect minimum buffer from cashflow analysis

## Important
- Call tools in sequence, wait for results before deciding next action
- Safety first - if uncertain, choose HOLD
- Explain your reasoning clearly at the end

Begin by analyzing the cashflow.`;
  }

  /**
   * Parser la décision finale du LLM
   */
  private parseFinalDecision(
    content: string,
    cashflowReport: CashflowOutput | null,
    sentinelReport: SentinelOutput | null,
    allocationResult: AllocatorOutput | null
  ): ManagerOutput {
    // Déterminer la décision basée sur les actions exécutées
    let decision: 'ALLOCATE' | 'WITHDRAW' | 'HOLD' | 'REBALANCE' = 'HOLD';
    let action: any = undefined;

    if (allocationResult && allocationResult.success) {
      decision = 'ALLOCATE';
      action = {
        type: 'deploy' as const,
        target: 'allocator' as const,
        params: {
          amount: allocationResult.data.finalAllocation.total,
          tierA: allocationResult.data.finalAllocation.tierA,
          tierB: allocationResult.data.finalAllocation.tierB
        }
      };
    } else if (sentinelReport?.data.recommendedAction === 'WITHDRAW_ALL') {
      decision = 'WITHDRAW';
      action = {
        type: 'withdraw' as const,
        target: 'sentinel' as const,
        params: {
          amount: sentinelReport.data.withdrawAmount || 0
        }
      };
    }

    return {
      success: true,
      agent: 'manager',
      timestamp: new Date(),
      data: {
        decision,
        reasoning: {
          summary: content.slice(0, 200) + '...',
          steps: this.extractReasoningSteps(content),
          confidence: this.estimateConfidence(cashflowReport, sentinelReport),
          factors: {
            cashflowAnalysis: cashflowReport
              ? `Deployable: $${cashflowReport.data.recommendations.deployableAmount.toLocaleString()}, Buffer: $${cashflowReport.data.recommendations.minimumBuffer.toLocaleString()}`
              : 'Not analyzed',
            sentinelCheck: sentinelReport
              ? `Alert: ${sentinelReport.data.alertLevel}, Action: ${sentinelReport.data.recommendedAction}`
              : 'Not checked',
            policyCompliance: allocationResult
              ? allocationResult.data.policyCheck.passed ? 'Compliant' : 'Violations found'
              : 'N/A'
          }
        },
        action,
        reportsAnalyzed: [
          cashflowReport ? 'cashflow' : null,
          sentinelReport ? 'sentinel' : null,
          allocationResult ? 'allocator' : null
        ].filter(Boolean) as string[],
        executionPlan: content
      }
    };
  }

  /**
   * Extraire les étapes de reasoning du texte
   */
  private extractReasoningSteps(content: string): string[] {
    // Simple extraction - recherche les lignes qui ressemblent à des étapes
    const lines = content.split('\n');
    const steps: string[] = [];

    for (const line of lines) {
      if (
        line.match(/^\d+\./) ||
        line.match(/^Step \d+/i) ||
        line.match(/^-/) ||
        line.trim().startsWith('•')
      ) {
        steps.push(line.trim());
      }
    }

    // Si pas de steps trouvés, retourner un résumé par paragraphe
    if (steps.length === 0) {
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 20);
      return paragraphs.slice(0, 5);
    }

    return steps.slice(0, 10); // Max 10 steps
  }

  /**
   * Estimer la confidence basée sur les rapports
   */
  private estimateConfidence(
    cashflowReport: CashflowOutput | null,
    sentinelReport: SentinelOutput | null
  ): number {
    let confidence = 0.5; // Base

    if (cashflowReport) {
      confidence += cashflowReport.data.recommendations.confidenceScore * 0.3;
    }

    if (sentinelReport) {
      if (sentinelReport.data.alertLevel === 'NONE') {
        confidence += 0.2;
      } else if (sentinelReport.data.alertLevel === 'WARNING') {
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Construire une réponse d'urgence
   */
  private buildEmergencyResponse(currentAllocations: any): ManagerOutput {
    return {
      success: true,
      agent: 'manager',
      timestamp: new Date(),
      data: {
        decision: 'WITHDRAW',
        reasoning: {
          summary: 'Emergency mode activated - immediate withdrawal of all positions',
          steps: [
            'Emergency mode detected',
            'Skipping analysis for speed',
            'Executing immediate withdrawal',
            'All positions being liquidated'
          ],
          confidence: 1.0,
          factors: {
            cashflowAnalysis: 'Skipped (emergency)',
            sentinelCheck: 'Emergency override',
            policyCompliance: 'Emergency protocol'
          }
        },
        action: {
          type: 'withdraw',
          target: 'sentinel',
          params: {
            amount: currentAllocations.tierA + currentAllocations.tierB
          }
        },
        reportsAnalyzed: [],
        executionPlan: 'Immediate withdrawal of all deployed capital due to emergency mode'
      }
    };
  }

  /**
   * Construire une réponse d'erreur
   */
  private buildErrorResponse(error: Error): ManagerOutput {
    return {
      success: false,
      agent: 'manager',
      timestamp: new Date(),
      data: {
        decision: 'HOLD',
        reasoning: {
          summary: 'System error - defaulting to HOLD for safety',
          steps: [error.message],
          confidence: 0,
          factors: {
            cashflowAnalysis: 'Error',
            sentinelCheck: 'Error',
            policyCompliance: 'Error'
          }
        },
        reportsAnalyzed: [],
        executionPlan: 'Hold all positions due to system error'
      },
      error: error.message
    };
  }
}
