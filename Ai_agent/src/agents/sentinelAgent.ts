import { Mistral } from '@mistralai/mistralai';
import { SentinelInput, SentinelOutput } from '../types/agents.types';

export class SentinelAgent {
  private client: Mistral;
  private model: string;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
    this.model = 'magistral-medium-2509'; // Reasoning model
  }

  /**
   * Vérifier les risques et déterminer les actions nécessaires
   */
  async checkRisks(input: SentinelInput): Promise<SentinelOutput> {
    try {
      console.log('🛡️  Sentinel Agent: Starting risk analysis...');

      // Step 1: Vérifications rapides (rules-based)
      const quickChecks = this.performQuickChecks(input);

      // Si CRITICAL détecté immédiatement → pas besoin de LLM
      if (quickChecks.alertLevel === 'CRITICAL') {
        console.log('🚨 CRITICAL risk detected immediately!');
        return this.buildCriticalResponse(input, quickChecks);
      }

      // Step 2: Analyse nuancée avec Magistral (reasoning)
      const llmAnalysis = await this.analyzeWithLLM(input, quickChecks);

      // Step 3: Compiler le résultat final
      const result: SentinelOutput = {
        success: true,
        agent: 'sentinel',
        timestamp: new Date(),
        data: {
          alertLevel: llmAnalysis.alertLevel,
          triggers: llmAnalysis.triggers,
          recommendedAction: llmAnalysis.recommendedAction,
          withdrawAmount: llmAnalysis.withdrawAmount,
          urgency: llmAnalysis.urgency,
          reasoning: llmAnalysis.reasoning,
          currentMetrics: {
            usdcPeg: input.metrics.usdcPeg.value,
            avgTvlChange: this.calculateAvgTvlChange(input),
            minLiquidityRatio: this.findMinLiquidityRatio(input)
          }
        }
      };

      console.log(`✅ Sentinel Agent: Analysis complete - ${result.data.alertLevel}`);
      if (result.data.recommendedAction !== 'HOLD') {
        console.log(`   ⚠️  Action: ${result.data.recommendedAction}`);
      }

      return result;

    } catch (error: any) {
      console.error('❌ Sentinel Agent error:', error.message);
      return {
        success: false,
        agent: 'sentinel',
        timestamp: new Date(),
        data: {
          alertLevel: 'CRITICAL',
          triggers: [{
            name: 'SYSTEM_ERROR',
            severity: 'CRITICAL',
            value: 0,
            threshold: 0,
            message: error.message
          }],
          recommendedAction: 'HOLD',
          urgency: 'HIGH',
          reasoning: ['System error occurred, cannot assess risk accurately'],
          currentMetrics: {
            usdcPeg: 0,
            avgTvlChange: 0,
            minLiquidityRatio: 0
          }
        },
        error: error.message
      };
    }
  }

  /**
   * Vérifications rapides des seuils critiques (sans LLM)
   */
  private performQuickChecks(input: SentinelInput): { alertLevel: 'NONE' | 'WARNING' | 'CRITICAL', triggers: any[] } {
    const triggers: any[] = [];
    let alertLevel: 'NONE' | 'WARNING' | 'CRITICAL' = 'NONE';

    // Check 1: USDC Peg
    const peg = input.metrics.usdcPeg.value;
    if (peg < 0.995) {
      triggers.push({
        name: 'USDC_DEPEG_CRITICAL',
        severity: 'CRITICAL',
        value: peg,
        threshold: 0.995,
        message: `USDC peg at ${peg} (critical depeg, below 0.995)`
      });
      alertLevel = 'CRITICAL';
    } else if (peg < input.policy.usdcPegMin) {
      triggers.push({
        name: 'USDC_DEPEG_WARNING',
        severity: 'WARNING',
        value: peg,
        threshold: input.policy.usdcPegMin,
        message: `USDC peg at ${peg} (below ${input.policy.usdcPegMin})`
      });
      if (alertLevel === 'NONE') alertLevel = 'WARNING';
    }

    // Check 2: TVL Changes
    input.metrics.protocolHealth.forEach(protocol => {
      if (protocol.tvlChange24h < -50) {
        triggers.push({
          name: 'TVL_CRASH',
          severity: 'CRITICAL',
          value: protocol.tvlChange24h,
          threshold: -50,
          message: `${protocol.protocol} TVL dropped ${Math.abs(protocol.tvlChange24h).toFixed(1)}% (critical)`
        });
        alertLevel = 'CRITICAL';
      } else if (Math.abs(protocol.tvlChange24h) > input.policy.tvlDropThreshold) {
        triggers.push({
          name: 'TVL_DROP_WARNING',
          severity: 'WARNING',
          value: protocol.tvlChange24h,
          threshold: -input.policy.tvlDropThreshold,
          message: `${protocol.protocol} TVL changed ${protocol.tvlChange24h.toFixed(1)}%`
        });
        if (alertLevel === 'NONE') alertLevel = 'WARNING';
      }

      // Check 3: Liquidity Ratio
      if (protocol.liquidityRatio < 0.10) {
        triggers.push({
          name: 'LIQUIDITY_CRISIS',
          severity: 'CRITICAL',
          value: protocol.liquidityRatio,
          threshold: 0.10,
          message: `${protocol.protocol} liquidity at ${(protocol.liquidityRatio * 100).toFixed(1)}% (critical)`
        });
        alertLevel = 'CRITICAL';
      } else if (protocol.liquidityRatio < input.policy.liquidityRatioMin) {
        triggers.push({
          name: 'LIQUIDITY_WARNING',
          severity: 'WARNING',
          value: protocol.liquidityRatio,
          threshold: input.policy.liquidityRatioMin,
          message: `${protocol.protocol} liquidity at ${(protocol.liquidityRatio * 100).toFixed(1)}%`
        });
        if (alertLevel === 'NONE') alertLevel = 'WARNING';
      }
    });

    return { alertLevel, triggers };
  }

  /**
   * Build immediate critical response (skip LLM for speed)
   */
  private buildCriticalResponse(input: SentinelInput, quickChecks: any): SentinelOutput {
    return {
      success: true,
      agent: 'sentinel',
      timestamp: new Date(),
      data: {
        alertLevel: 'CRITICAL',
        triggers: quickChecks.triggers,
        recommendedAction: 'WITHDRAW_ALL',
        withdrawAmount: input.metrics.portfolioMetrics.totalDeployed,
        urgency: 'HIGH',
        reasoning: [
          'CRITICAL condition detected by quick checks',
          'Immediate withdrawal recommended for safety',
          'Details: ' + quickChecks.triggers.map((t: any) => t.message).join('; ')
        ],
        currentMetrics: {
          usdcPeg: input.metrics.usdcPeg.value,
          avgTvlChange: this.calculateAvgTvlChange(input),
          minLiquidityRatio: this.findMinLiquidityRatio(input)
        }
      }
    };
  }

  /**
   * Analyse nuancée avec Magistral (chain-of-thought reasoning)
   */
  private async analyzeWithLLM(input: SentinelInput, quickChecks: any) {
    const prompt = this.buildPrompt(input, quickChecks);

    const response = await this.client.chat.complete({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Très déterministe pour sécurité
      maxTokens: 1500,
      responseFormat: {
        type: 'json_object' // Force JSON output
      }
    });

    const content = response.choices?.[0]?.message?.content;

    // Avec responseFormat: json_object, content devrait être du JSON pur
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response from LLM');
    }

    const parsedContent = JSON.parse(content);

    // Valider et compléter les champs manquants
    if (!parsedContent.alertLevel) parsedContent.alertLevel = quickChecks.alertLevel;
    if (!parsedContent.triggers) parsedContent.triggers = quickChecks.triggers;
    if (!parsedContent.recommendedAction) parsedContent.recommendedAction = 'HOLD';
    if (!parsedContent.urgency) parsedContent.urgency = 'LOW';
    if (!parsedContent.reasoning) parsedContent.reasoning = ['LLM analysis incomplete'];

    return parsedContent;
  }

  /**
   * Construire le prompt pour Magistral
   */
  private buildPrompt(input: SentinelInput, quickChecks: any): string {
    return `You are the Sentinel Agent - the safety guardian of a treasury management system managing $${input.metrics.portfolioMetrics.totalDeployed.toLocaleString()}.

## Current Metrics
USDC Peg: ${input.metrics.usdcPeg.value} (source: ${input.metrics.usdcPeg.source})

Protocol Health:
${input.metrics.protocolHealth.map(p => `- ${p.protocol.toUpperCase()}
  TVL: $${(p.tvl / 1_000_000).toFixed(0)}M (24h change: ${p.tvlChange24h > 0 ? '+' : ''}${p.tvlChange24h.toFixed(1)}%)
  Liquidity: ${(p.liquidityRatio * 100).toFixed(1)}%
  Utilization: ${(p.utilizationRate * 100).toFixed(1)}%`).join('\n')}

Portfolio Allocation:
- Total deployed: $${input.metrics.portfolioMetrics.totalDeployed.toLocaleString()}
- Tier A (SafeVault): $${input.metrics.portfolioMetrics.tierA.toLocaleString()} (${((input.metrics.portfolioMetrics.tierA / input.metrics.portfolioMetrics.totalDeployed) * 100).toFixed(1)}%)
- Tier B (DeFi): $${input.metrics.portfolioMetrics.tierB.toLocaleString()} (${((input.metrics.portfolioMetrics.tierB / input.metrics.portfolioMetrics.totalDeployed) * 100).toFixed(1)}%)
- Liquid: $${input.metrics.portfolioMetrics.liquidBalance.toLocaleString()}

## Safety Policy (MANDATORY RULES)
- USDC peg must be between ${input.policy.usdcPegMin} and ${input.policy.usdcPegMax}
- TVL drop > ${input.policy.tvlDropThreshold}% = WARNING
- Liquidity ratio < ${input.policy.liquidityRatioMin} = WARNING
- Max TierB allocation: ${input.policy.maxAllocTierB * 100}%

## Quick Check Results
Alert level detected: ${quickChecks.alertLevel}
Triggers found: ${quickChecks.triggers.length}
${quickChecks.triggers.map((t: any) => `- [${t.severity}] ${t.message}`).join('\n')}

## Your Task
Analyze the situation with chain-of-thought reasoning and determine:
1. Final alert level: NONE, WARNING, or CRITICAL
2. Recommended action: HOLD, WITHDRAW_PARTIAL, or WITHDRAW_ALL
3. Urgency level: LOW, MEDIUM, or HIGH

## Decision Framework
CRITICAL conditions (immediate action):
- USDC peg < 0.995 → WITHDRAW_ALL
- TVL drop > 50% → WITHDRAW_ALL
- Liquidity < 10% → WITHDRAW_ALL

WARNING conditions (monitor closely):
- USDC peg 0.995-0.998 → HOLD or WITHDRAW_PARTIAL (depends on other factors)
- TVL drop 35-50% → WITHDRAW_PARTIAL
- Liquidity 10-15% → HOLD but alert

Multiple warnings = escalate severity

## REQUIRED Output Format (JSON ONLY - no markdown, no explanations outside JSON)

You MUST respond with a valid JSON object with this EXACT structure:

{
  "alertLevel": "NONE|WARNING|CRITICAL",
  "triggers": [${quickChecks.triggers.length > 0 ? '...include triggers from quick checks and add more if needed...' : ''}],
  "recommendedAction": "HOLD|WITHDRAW_PARTIAL|WITHDRAW_ALL",
  "withdrawAmount": 0,
  "urgency": "LOW|MEDIUM|HIGH",
  "reasoning": [
    "Step 1: Analyze USDC peg - explain what you found",
    "Step 2: Evaluate TVL changes - explain impact",
    "Step 3: Check liquidity ratios - explain status",
    "Step 4: Consider combined risk - explain decision",
    "Step 5: Final recommendation - explain action"
  ]
}

CRITICAL RULES:
- ALL fields are REQUIRED
- reasoning must have at least 3 steps
- Show your chain-of-thought in reasoning array
- Safety always trumps optimization
- If uncertain, escalate alert level

Return ONLY the JSON object, nothing else.`;
  }

  /**
   * Calculer le changement TVL moyen
   */
  private calculateAvgTvlChange(input: SentinelInput): number {
    const changes = input.metrics.protocolHealth.map(p => p.tvlChange24h);
    return changes.reduce((sum, c) => sum + c, 0) / changes.length;
  }

  /**
   * Trouver le ratio de liquidité minimum
   */
  private findMinLiquidityRatio(input: SentinelInput): number {
    return Math.min(...input.metrics.protocolHealth.map(p => p.liquidityRatio));
  }
}
