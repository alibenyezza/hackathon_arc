/**
 * Treasury Autopilot Orchestrator
 *
 * Point d'entrée principal du système agentic.
 * Exécute le Manager Agent avec function calling pour orchestrer
 * les sub-agents (Cashflow, Sentinel, Allocator).
 *
 * Usage:
 *   import { TreasuryOrchestrator } from './orchestrator';
 *
 *   const orchestrator = new TreasuryOrchestrator({
 *     mistralApiKey: process.env.MISTRAL_API_KEY,
 *     mode: 'mock' // ou 'real' quand Epic 1 est prêt
 *   });
 *
 *   await orchestrator.run();
 */

import * as dotenv from 'dotenv';
import { ManagerAgentV2 } from './agents/managerAgentV2';
import { MockDataProvider, RealDataProvider, IDataProvider } from './providers/DataProvider';
import { ManagerOutput } from './types/agents.types';

dotenv.config();

export interface OrchestratorConfig {
  mistralApiKey?: string;
  mode?: 'mock' | 'real';
  arcRpcUrl?: string;
  circleApiKey?: string;
  runMode?: 'normal' | 'emergency' | 'simulation';
  userOverride?: {
    forceAction: 'ALLOCATE' | 'WITHDRAW' | 'HOLD';
    reason: string;
  };
}

export class TreasuryOrchestrator {
  private manager: ManagerAgentV2;
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = config;

    // Valider l'API key
    const apiKey = config.mistralApiKey || process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is required');
    }

    // Créer le data provider approprié
    const dataProvider = this.createDataProvider(config);

    // Initialiser le Manager Agent
    this.manager = new ManagerAgentV2(apiKey, dataProvider);
  }

  /**
   * Créer le data provider (mock ou real)
   */
  private createDataProvider(config: OrchestratorConfig): IDataProvider {
    if (config.mode === 'real') {
      console.log('⚙️  Using RealDataProvider (Epic 1 integration)');

      if (!config.arcRpcUrl || !config.circleApiKey) {
        throw new Error('arcRpcUrl and circleApiKey required for real mode');
      }

      return new RealDataProvider({
        arcRpcUrl: config.arcRpcUrl,
        circleApiKey: config.circleApiKey
      });
    }

    console.log('⚙️  Using MockDataProvider (for testing)');
    return new MockDataProvider();
  }

  /**
   * Exécuter un cycle d'orchestration
   */
  async run(): Promise<ManagerOutput> {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 TREASURY AUTOPILOT - AGENTIC ORCHESTRATION');
    console.log('='.repeat(80));

    const startTime = Date.now();

    try {
      // Exécuter le Manager avec function calling
      const orchestrateParams: {
        mode?: 'normal' | 'emergency' | 'simulation';
        userOverride?: { forceAction: 'ALLOCATE' | 'WITHDRAW' | 'HOLD'; reason: string };
      } = {
        mode: this.config.runMode || 'normal'
      };

      if (this.config.userOverride) {
        orchestrateParams.userOverride = this.config.userOverride;
      }

      const result = await this.manager.orchestrate(orchestrateParams);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('\n' + '='.repeat(80));
      console.log('✅ ORCHESTRATION COMPLETE');
      console.log('='.repeat(80));
      console.log(`Decision: ${result.data.decision}`);
      console.log(`Confidence: ${(result.data.reasoning.confidence * 100).toFixed(1)}%`);
      console.log(`Duration: ${duration}s`);
      console.log(`Reports analyzed: ${result.data.reportsAnalyzed.join(', ')}`);

      if (result.data.action) {
        console.log(`\nAction taken: ${result.data.action.type} → ${result.data.action.target}`);
        if (result.data.action.params.amount) {
          console.log(`Amount: $${result.data.action.params.amount.toLocaleString()}`);
        }
      }

      console.log('\n' + '-'.repeat(80));
      console.log('Summary:');
      console.log(result.data.reasoning.summary);
      console.log('='.repeat(80) + '\n');

      return result;

    } catch (error: any) {
      console.error('\n' + '='.repeat(80));
      console.error('❌ ORCHESTRATION FAILED');
      console.error('='.repeat(80));
      console.error(`Error: ${error.message}`);
      console.error('='.repeat(80) + '\n');

      throw error;
    }
  }

  /**
   * Exécuter en mode scheduling (pour production)
   */
  async runScheduled(intervalHours: number = 24): Promise<void> {
    console.log(`\n⏰ Starting scheduled mode (every ${intervalHours} hours)...\n`);

    // Exécution immédiate
    await this.run();

    // Puis exécuter périodiquement
    setInterval(async () => {
      console.log(`\n⏰ Scheduled execution triggered (${new Date().toISOString()})\n`);
      await this.run();
    }, intervalHours * 60 * 60 * 1000);
  }

  /**
   * Afficher le statut du système
   */
  async getStatus(): Promise<{
    mode: string;
    dataProvider: string;
    agentsInitialized: boolean;
  }> {
    return {
      mode: this.config.runMode || 'normal',
      dataProvider: this.config.mode || 'mock',
      agentsInitialized: true
    };
  }
}

/**
 * CLI Entry point
 * Permet de lancer l'orchestrator depuis la ligne de commande
 */
export async function main() {
  console.log('🏦 Treasury Autopilot - Agentic AI System\n');

  // Parser les arguments CLI
  const args = process.argv.slice(2);
  const mode = args.includes('--real') ? 'real' : 'mock';
  const runMode = args.includes('--emergency') ? 'emergency'
    : args.includes('--simulation') ? 'simulation'
    : 'normal';

  const scheduled = args.includes('--scheduled');
  const intervalHours = args.includes('--interval')
    ? parseInt(args[args.indexOf('--interval') + 1] || '24')
    : 24;

  try {
    const config: OrchestratorConfig = {
      mode: mode as 'mock' | 'real',
      runMode: runMode as 'normal' | 'emergency' | 'simulation'
    };

    if (mode === 'real') {
      if (!process.env.ARC_RPC_URL || !process.env.CIRCLE_API_KEY) {
        throw new Error('ARC_RPC_URL and CIRCLE_API_KEY required for real mode');
      }
      config.arcRpcUrl = process.env.ARC_RPC_URL;
      config.circleApiKey = process.env.CIRCLE_API_KEY;
    }

    const orchestrator = new TreasuryOrchestrator(config);

    if (scheduled) {
      await orchestrator.runScheduled(intervalHours);
    } else {
      await orchestrator.run();
    }

  } catch (error: any) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Si exécuté directement (pas importé comme module)
if (require.main === module) {
  main().catch(console.error);
}
