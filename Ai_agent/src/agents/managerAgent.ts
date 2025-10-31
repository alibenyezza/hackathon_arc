import { Mistral } from '@mistralai/mistralai';
import { ManagerInput, ManagerOutput, CashflowOutput, SentinelOutput } from '../types/agents.types';

export class ManagerAgent {
  private client: Mistral;
  private model: string;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
    this.model = 'magistral-medium-2509'; // Reasoning model
  }

  /**
   * Orchestrer les agents et prendre la décision finale
   */
  async decide(input: ManagerInput): Promise<ManagerOutput> {
    try {
      console.log('🎯 Manager Agent: Starting orchestration...');
      console.log(`   Mode: ${input.mode}`);
      console.log(`   Treasury balance: $${input.systemState.treasuryBalance.toLocaleString()}`);

      // Step 1: Vérifications rapides (sans LLM)
      const quickChecks = this.performQuickChecks(input);

      if (quickChecks.immediateAction) {
        console.log(`🚨 Immediate action required: ${quickChecks.immediateAction}`);
        return this.buildImmediateResponse(input, quickChecks);
      }

      // Step 2: Analyse avec Magistral (reasoning)
      const llmDecision = await this.decideWithLLM(input);

      // Step 3: Compiler le résultat final
      const result: ManagerOutput = {
        success: true,
        agent: 'manager',
        timestamp: new Date(),
        data: {
          decision: llmDecision.decision,
          reasoning: {
            summary: llmDecision.summary,
            steps: llmDecision.steps,
            confidence: llmDecision.confidence,
            factors: {
              cashflowAnalysis: llmDecision.cashflowAnalysis,
              sentinelCheck: llmDecision.sentinelCheck,
              policyCompliance: llmDecision.policyCompliance
            }
          },
          action: llmDecision.action,
          reportsAnalyzed: this.getReportsAnalyzed(input),
          executionPlan: llmDecision.executionPlan
        }
      };

      console.log(`✅ Manager Agent: Decision made - ${result.data.decision}`);
      console.log(`   Confidence: ${(result.data.reasoning.confidence * 100).toFixed(1)}%`);
      if (result.data.action) {
        console.log(`   Action: ${result.data.action.type} → ${result.data.action.target}`);
      }

      return result;

    } catch (error: any) {
      console.error('❌ Manager Agent error:', error.message);
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
              cashflowAnalysis: 'N/A',
              sentinelCheck: 'N/A',
              policyCompliance: 'N/A'
            }
          },
          reportsAnalyzed: [],
          executionPlan: 'Hold all positions due to system error'
        },
        error: error.message
      };
    }
  }

  /**
   * Vérifications rapides (rules-based, sans LLM)
   */
  private performQuickChecks(input: ManagerInput): {
    immediateAction?: 'WITHDRAW_ALL' | 'HOLD',
    reason?: string
  } {
    // Check 1: Mode emergency
    if (input.mode === 'emergency') {
      return {
        immediateAction: 'WITHDRAW_ALL',
        reason: 'Emergency mode activated'
      };
    }

    // Check 2: User override
    if (input.userOverride) {
      console.log(`⚠️  User override: ${input.userOverride.forceAction}`);
      // On ne force pas immédiatement, mais on le passe au LLM
    }

    // Check 3: Sentinel CRITICAL
    if (input.reports.sentinel?.data.alertLevel === 'CRITICAL') {
      return {
        immediateAction: 'WITHDRAW_ALL',
        reason: `Sentinel CRITICAL: ${input.reports.sentinel.data.recommendedAction}`
      };
    }

    // Check 4: Balance trop faible
    if (input.systemState.treasuryBalance < 10_000) {
      return {
        immediateAction: 'HOLD',
        reason: 'Treasury balance critically low'
      };
    }

    return {}; // Pas d'action immédiate
  }

  /**
   * Build immediate response (skip LLM for speed)
   */
  private buildImmediateResponse(input: ManagerInput, quickChecks: any): ManagerOutput {
    const isWithdraw = quickChecks.immediateAction === 'WITHDRAW_ALL';

    const baseResponse = {
      success: true,
      agent: 'manager' as const,
      timestamp: new Date(),
      data: {
        decision: isWithdraw ? 'WITHDRAW' as const : 'HOLD' as const,
        reasoning: {
          summary: quickChecks.reason,
          steps: [
            'Quick check detected immediate action required',
            quickChecks.reason,
            isWithdraw ? 'Withdrawing all positions for safety' : 'Holding all positions'
          ],
          confidence: 1.0,
          factors: {
            cashflowAnalysis: 'Skipped due to immediate action',
            sentinelCheck: input.reports.sentinel?.data.alertLevel || 'N/A',
            policyCompliance: 'Emergency override'
          }
        },
        reportsAnalyzed: this.getReportsAnalyzed(input),
        executionPlan: isWithdraw ? 'Execute immediate withdrawal of all positions' : 'Hold all positions, no action taken'
      }
    };

    if (isWithdraw) {
      return {
        ...baseResponse,
        data: {
          ...baseResponse.data,
          action: {
            type: 'withdraw' as const,
            target: 'sentinel' as const,
            params: {
              amount: input.systemState.currentAllocations.tierA + input.systemState.currentAllocations.tierB
            }
          }
        }
      };
    }

    return baseResponse;
  }

  /**
   * Décision avec Magistral (chain-of-thought reasoning)
   */
  private async decideWithLLM(input: ManagerInput) {
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
      maxTokens: 2000,
      responseFormat: {
        type: 'json_object'
      }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid LLM response');
    }

    const parsedContent = JSON.parse(content);

    // Valider et compléter les champs manquants
    if (!parsedContent.decision) parsedContent.decision = 'HOLD';
    if (!parsedContent.steps) parsedContent.steps = ['Decision analysis incomplete'];
    if (!parsedContent.confidence) parsedContent.confidence = 0.5;
    if (!parsedContent.summary) parsedContent.summary = 'Decision made with limited information';

    return parsedContent;
  }

  /**
   * Construire le prompt pour Magistral
   */
  private buildPrompt(input: ManagerInput): string {
    const { reports, systemState, mode, userOverride } = input;

    // Extraire les infos clés
    const cashflowInfo = reports.cashflow ? `
Cashflow Report:
- Deployable amount: $${reports.cashflow.data.recommendations.deployableAmount.toLocaleString()}
- Minimum buffer: $${reports.cashflow.data.recommendations.minimumBuffer.toLocaleString()}
- Confidence: ${(reports.cashflow.data.recommendations.confidenceScore * 100).toFixed(1)}%
- Avg monthly expenses: $${reports.cashflow.data.analysis.avgMonthlyExpenses.toLocaleString()}
- Burn rate: $${reports.cashflow.data.analysis.burnRate.toLocaleString()}/day
- Warnings: ${reports.cashflow.data.warnings.length > 0 ? reports.cashflow.data.warnings.join('; ') : 'None'}
- Reasoning: ${reports.cashflow.data.recommendations.reasoning}
` : 'Cashflow report not available';

    const sentinelInfo = reports.sentinel ? `
Sentinel Report:
- Alert level: ${reports.sentinel.data.alertLevel}
- Recommended action: ${reports.sentinel.data.recommendedAction}
- Urgency: ${reports.sentinel.data.urgency}
- USDC Peg: ${reports.sentinel.data.currentMetrics.usdcPeg}
- Avg TVL change: ${reports.sentinel.data.currentMetrics.avgTvlChange.toFixed(2)}%
- Min liquidity ratio: ${(reports.sentinel.data.currentMetrics.minLiquidityRatio * 100).toFixed(1)}%
- Triggers: ${reports.sentinel.data.triggers.length}
${reports.sentinel.data.triggers.map(t => `  - [${t.severity}] ${t.message}`).join('\n')}
- Reasoning: ${reports.sentinel.data.reasoning.slice(0, 3).join('; ')}
` : 'Sentinel report not available';

    const currentAllocationPercent = systemState.treasuryBalance > 0
      ? ((systemState.currentAllocations.tierA + systemState.currentAllocations.tierB) / systemState.treasuryBalance * 100).toFixed(1)
      : '0';

    return `You are the Manager Agent - the orchestrator and final decision maker for a treasury management system.

## System State
Treasury balance: $${systemState.treasuryBalance.toLocaleString()}
Current allocations:
  - Tier A (Safe): $${systemState.currentAllocations.tierA.toLocaleString()}
  - Tier B (DeFi): $${systemState.currentAllocations.tierB.toLocaleString()}
  - Liquid: $${systemState.currentAllocations.liquid.toLocaleString()}
  - Total deployed: $${(systemState.currentAllocations.tierA + systemState.currentAllocations.tierB).toLocaleString()} (${currentAllocationPercent}%)
Last allocation: ${systemState.lastAllocationDate.toISOString().split('T')[0]}
Cycle number: ${systemState.cycleNumber}
Mode: ${mode}

${userOverride ? `
⚠️  USER OVERRIDE:
  - Force action: ${userOverride.forceAction}
  - Reason: ${userOverride.reason}
` : ''}

## Reports from Sub-Agents

${cashflowInfo}

${sentinelInfo}

## Your Task
Analyze the reports from Cashflow and Sentinel agents, and make the FINAL decision for this cycle.

## Decision Framework

Priority hierarchy (MUST follow):
1. **SAFETY FIRST** (Sentinel)
   - CRITICAL alert → WITHDRAW
   - WARNING alert → Evaluate carefully, may reduce allocation
   - NONE → Proceed with caution

2. **LIQUIDITY SECOND** (Cashflow)
   - Deployable < $50k → HOLD
   - Deployable > $50k → Consider ALLOCATE
   - Always respect minimumBuffer

3. **POLICY COMPLIANCE**
   - Tier A minimum: 50%
   - Tier B maximum: 50%
   - Never violate these rules

4. **CONFIDENCE THRESHOLD**
   - Cashflow confidence < 0.7 → HOLD or reduce allocation
   - Combined risk indicators → Adjust strategy

## Decision Options
- **ALLOCATE**: Deploy new capital (requires deployable amount > $50k)
- **WITHDRAW**: Pull back funds (if Sentinel WARNING/CRITICAL or market conditions deteriorate)
- **HOLD**: Do nothing (if uncertain or conditions not favorable)
- **REBALANCE**: Adjust Tier A/B ratios without new capital

## REQUIRED Output Format (JSON ONLY)

You MUST respond with a valid JSON object with this EXACT structure:

{
  "decision": "ALLOCATE|WITHDRAW|HOLD|REBALANCE",
  "summary": "One sentence explaining the decision",
  "steps": [
    "Step 1: Analyze Sentinel report - what did you find?",
    "Step 2: Analyze Cashflow report - what did you find?",
    "Step 3: Check policy compliance - any issues?",
    "Step 4: Assess combined risk - what's the overall picture?",
    "Step 5: Make final decision - why this action?"
  ],
  "confidence": 0.85,
  "cashflowAnalysis": "Summary of cashflow insights",
  "sentinelCheck": "Summary of risk assessment",
  "policyCompliance": "Are we compliant? Any concerns?",
  "action": {
    "type": "deploy|withdraw|rebalance",
    "target": "allocator|sentinel",
    "params": {
      "amount": 1000000,
      "tierA": 600000,
      "tierB": 400000
    }
  },
  "executionPlan": "Detailed plan of what will happen next"
}

CRITICAL RULES:
- ALL fields are REQUIRED
- steps must have at least 5 reasoning steps
- Show your chain-of-thought clearly
- If decision is HOLD, action can be null or omitted
- If decision is ALLOCATE, action MUST include amount, tierA, tierB
- confidence must be between 0 and 1
- Safety always trumps optimization
- Explain WHY you made this decision

Return ONLY the JSON object, nothing else.`;
  }

  /**
   * Get list of reports analyzed
   */
  private getReportsAnalyzed(input: ManagerInput): string[] {
    const reports: string[] = [];
    if (input.reports.cashflow) reports.push('cashflow');
    if (input.reports.sentinel) reports.push('sentinel');
    return reports;
  }
}
