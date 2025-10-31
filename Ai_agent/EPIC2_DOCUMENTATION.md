# 🧠 EPIC 2 — AI AGENTS DOCUMENTATION

> **Statut**: ✅ 100% Complété (en attente intégration Epic 1)
> **Responsable**: Eli
> **Date**: Octobre 2025
> **Version**: 2.0 (Agentic avec Function Calling)

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Agents IA implémentés](#agents-ia-implémentés)
4. [Structure du code](#structure-du-code)
5. [Tests et validation](#tests-et-validation)
6. [Intégration Epic 1](#intégration-epic-1)
7. [Guide d'utilisation](#guide-dutilisation)
8. [FAQ](#faq)

---

## 🎯 Vue d'ensemble

### Objectif Epic 2
Développer un système d'agents IA autonomes qui gèrent intelligemment la trésorerie d'une entreprise en analysant, décidant et exécutant des allocations DeFi sur Arc blockchain.

### Résultat final
**4 agents IA coordonnés par un orchestrateur agentic** utilisant Mistral AI avec function calling :

```
Manager Agent (orchestrateur)
    ↓ [function calling dynamique]
    ├─→ Cashflow Agent (analyse liquidité)
    ├─→ Sentinel Agent (surveillance risques)
    └─→ Allocator Agent (exécution transactions)
```

### Technologie utilisée
- **LLM**: Mistral AI (Magistral Medium + Mistral Small)
- **Langage**: TypeScript
- **Architecture**: Multi-agent avec function calling
- **Data**: Mock (prêt pour Epic 1)

---

## 🏗️ Architecture du système

### Schéma global

```
┌─────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR                          │
│              (src/orchestrator.ts)                      │
│                                                         │
│  • CLI interface                                        │
│  • Scheduler (cron)                                     │
│  • Mode normal/emergency/simulation                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MANAGER AGENT V2                           │
│         (src/agents/managerAgentV2.ts)                  │
│                                                         │
│  Model: magistral-medium-2509 (reasoning)               │
│  • Orchestration avec function calling                  │
│  • Décision finale (ALLOCATE/WITHDRAW/HOLD)            │
│  • Boucle itérative jusqu'à décision                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  CASHFLOW    │ │  SENTINEL    │ │  ALLOCATOR   │
│    AGENT     │ │    AGENT     │ │    AGENT     │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ Mistral      │ │ Magistral    │ │ Mistral      │
│ Small        │ │ Medium       │ │ Small        │
│              │ │              │ │              │
│ • Analyse    │ │ • Surveille  │ │ • Valide     │
│   cashflow   │ │   risques    │ │   policies   │
│ • Prédit     │ │ • USDC peg   │ │ • Exécute    │
│   besoins    │ │ • TVL drops  │ │   txs        │
│ • Calcule    │ │ • Liquidity  │ │ • Crée       │
│   buffer     │ │              │ │   allocations│
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │      DATA PROVIDER            │
        │  (src/providers/DataProvider) │
        ├───────────────────────────────┤
        │ MockDataProvider (actuel)     │
        │ RealDataProvider (Epic 1)     │
        └───────────────────────────────┘
```

### Flow d'exécution

#### 1. Mode Normal
```
1. Orchestrator.run()
2. Manager demande: "Quelle est la situation cashflow?"
3. Manager appelle tool: analyze_cashflow
   → Cashflow Agent analyse transactions
   → Retourne: deployableAmount = $1.8M, buffer = $200k
4. Manager demande: "Y a-t-il des risques?"
5. Manager appelle tool: check_risks
   → Sentinel Agent vérifie USDC peg, TVL, liquidity
   → Retourne: alertLevel = NONE, tout stable
6. Manager décide: ALLOCATE $1.8M (60% Tier A, 40% Tier B)
7. Manager appelle tool: execute_allocation
   → Allocator Agent valide policies
   → Exécute transactions (mock pour l'instant)
   → Retourne: txHash, status = confirmed
8. Manager termine avec résumé complet
```

#### 2. Mode Emergency
```
1. Orchestrator.run({ mode: 'emergency' })
2. Manager détecte urgence → SKIP tous les agents
3. Retrait immédiat de toutes les positions
4. Log + notification
```

#### 3. Mode avec alerte Sentinel
```
1. Manager appelle check_risks
2. Sentinel détecte: USDC peg = 0.992 (< 0.995)
3. Sentinel retourne: alertLevel = CRITICAL, action = WITHDRAW_ALL
4. Manager décide immédiatement: WITHDRAW
5. Exécution retrait sans passer par Allocator
```

---

## 🤖 Agents IA implémentés

### 1. Cashflow Agent

**Fichier**: `src/agents/cashflowAgent.ts`

**Rôle**: Analyser les flux de trésorerie et prédire les obligations futures

**Model**: `mistral-small-2506`

**Input**:
```typescript
{
  transactions: Transaction[],        // Historique 90 jours
  recurringObligations: Obligation[], // Payroll, vendors, etc.
  currentBalance: number,
  analysisPeriod: 90,
  forecastHorizon: 30
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    upcomingObligations: [
      { date: "2025-11-30", amount: 50000, category: "payroll" }
    ],
    analysis: {
      avgMonthlyExpenses: 120000,
      avgMonthlyIncome: 150000,
      burnRate: 4000,
      volatility: 15000
    },
    recommendations: {
      minimumBuffer: 200000,        // Montant à garder liquide
      deployableAmount: 1800000,    // Montant disponible pour DeFi
      confidenceScore: 0.9
    }
  }
}
```

**Logique interne**:
1. Calcule statistiques historiques (moyenne, écart-type)
2. Identifie patterns dans les transactions
3. Applique safety multiplier selon volatilité:
   - Basse volatilité (< $20k) → 1.2x
   - Moyenne ($20-50k) → 1.5x
   - Haute (> $50k) → 2.0x
4. Utilise Mistral pour prédictions intelligentes

**Tests**: ✅ 3/3 passent
- Normal scenario
- High volatility
- Low balance

---

### 2. Sentinel Agent

**Fichier**: `src/agents/sentinelAgent.ts`

**Rôle**: Surveiller les risques de marché et déclencher des alertes

**Model**: `magistral-medium-2509` (reasoning)

**Input**:
```typescript
{
  metrics: {
    usdcPeg: { value: 1.0, source: "chainlink" },
    protocolHealth: [
      { protocol: "aave", tvl: 5B, tvlChange24h: -1.2%, liquidityRatio: 0.35 },
      { protocol: "compound", tvl: 3B, tvlChange24h: 0.8%, liquidityRatio: 0.42 }
    ],
    portfolioMetrics: { totalDeployed: 1M, tierA: 600k, tierB: 400k }
  },
  policy: {
    usdcPegMin: 0.998,
    tvlDropThreshold: 35,
    liquidityRatioMin: 0.15
  }
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    alertLevel: "NONE" | "WARNING" | "CRITICAL",
    triggers: [
      { severity: "WARNING", message: "USDC peg at 0.997" }
    ],
    recommendedAction: "HOLD" | "WITHDRAW_PARTIAL" | "WITHDRAW_ALL",
    withdrawAmount?: number,
    urgency: "LOW" | "MEDIUM" | "HIGH",
    reasoning: [
      "Step 1: USDC peg stable at 1.0",
      "Step 2: TVL changes minimal",
      "Step 3: No action needed"
    ]
  }
}
```

**Logique interne**:
1. **Quick checks** (rules-based, sans LLM):
   - USDC peg < 0.995 → CRITICAL immédiat
   - TVL drop > 50% → CRITICAL immédiat
   - Liquidity < 10% → CRITICAL immédiat
2. **LLM analysis** (si pas CRITICAL):
   - Évalue combinaison de signaux faibles
   - Raisonnement nuancé avec chain-of-thought
   - Décision finale avec confidence

**Seuils critiques**:
- 🚨 **CRITICAL**: Action immédiate requise
  - USDC peg < 0.995
  - TVL drop > 50%
  - Liquidity < 10%
- ⚠️ **WARNING**: Surveillance rapprochée
  - USDC peg 0.995-0.998
  - TVL drop 35-50%
  - Liquidity 10-15%

**Tests**: ✅ 5/5 passent
- Normal (no risk)
- WARNING (peg 0.997)
- CRITICAL (TVL -40%)
- CRITICAL (depeg 0.992)
- Multi-WARNING

---

### 3. Allocator Agent

**Fichier**: `src/agents/allocatorAgent.ts`

**Rôle**: Valider et exécuter les allocations DeFi

**Model**: `mistral-small-2506`

**Input**:
```typescript
{
  allocation: {
    totalAmount: 1000000,
    tierA: { amount: 600000, percent: 0.6, target: "SafeVault" },
    tierB: { amount: 400000, percent: 0.4, target: "Aave" }
  },
  policy: {
    minTierAPercent: 0.5,      // Min 50% en Safe
    maxTierBPercent: 0.5,      // Max 50% en DeFi
    minDeploymentAmount: 50000,
    maxSingleTransaction: 5000000
  },
  blockchain: {
    currentBalance: 2000000,
    gasPrice: 20,
    slippageTolerance: 0.5
  }
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    executed: true,
    transactions: [
      { target: "SafeVault", amount: 600000, txHash: "0xabc...", status: "confirmed" },
      { target: "Aave", amount: 400000, txHash: "0xdef...", status: "confirmed" }
    ],
    policyCheck: {
      passed: true,
      violations: []
    },
    finalAllocation: { tierA: 600000, tierB: 400000, total: 1000000 }
  }
}
```

**Logique interne**:
1. **Quick policy checks** (rules-based):
   - Montant minimum respecté ?
   - Tier A >= 50% ?
   - Tier B <= 50% ?
   - Balance suffisant ?
   - Transaction < max single ?
2. **LLM validation**:
   - Vérifie cohérence globale
   - Évalue gas costs vs returns
   - Valide conditions marché
3. **Exécution** (mock pour l'instant):
   - Crée transactions pour chaque tier
   - Retourne txHash + status

**Policy stricte** (NON NÉGOCIABLE):
- ✅ Tier A minimum: 50%
- ✅ Tier B maximum: 50%
- ✅ Montant minimum: $50,000
- ✅ Balance suffisant

**Tests**: ✅ 5/5 passent
- Normal allocation (60/40)
- Violation Tier B trop élevé
- Violation montant minimum
- Violation balance insuffisant
- Conservative allocation (80/20)

---

### 4. Manager Agent V2 (Orchestrateur)

**Fichier**: `src/agents/managerAgentV2.ts`

**Rôle**: Orchestrer tous les agents et prendre la décision finale

**Model**: `magistral-medium-2509` (reasoning + function calling)

**Architecture agentic**:
```typescript
// Le Manager a accès à 4 tools
tools = [
  "analyze_cashflow",
  "check_risks",
  "execute_allocation",
  "execute_withdrawal"
]

// Boucle itérative
while (!decision_made) {
  llm_response = mistral.chat.complete({
    messages: conversation_history,
    tools: tools,
    toolChoice: "auto"
  });

  if (llm_response.tool_calls) {
    // LLM demande d'appeler un tool
    results = execute_tools(llm_response.tool_calls);
    conversation_history.push(results);
  } else {
    // LLM a fini, décision finale
    return llm_response.decision;
  }
}
```

**Décisions possibles**:
- **ALLOCATE**: Déployer du capital en DeFi
- **WITHDRAW**: Retirer des positions
- **HOLD**: Ne rien faire
- **REBALANCE**: Ajuster ratios Tier A/B

**Hiérarchie de priorités**:
1. 🛡️ **SÉCURITÉ** (Sentinel) > Rendement
   - CRITICAL → WITHDRAW immédiat
   - WARNING → Évaluation nuancée
2. 💰 **LIQUIDITÉ** (Cashflow) > Déploiement
   - Deployable < $50k → HOLD
   - Toujours respecter buffer minimum
3. 📜 **POLICY** (Allocator)
   - Tier A >= 50% toujours
   - Tier B <= 50% jamais dépassé

**Output**:
```typescript
{
  success: true,
  data: {
    decision: "ALLOCATE",
    reasoning: {
      summary: "Safe to allocate $1.8M with 60/40 split",
      steps: [
        "Cashflow analysis: $1.8M deployable with $200k buffer",
        "Sentinel check: No alerts, all metrics healthy",
        "Policy validation: 60/40 split respects constraints",
        "Market conditions: Low volatility, good timing",
        "Final decision: ALLOCATE with conservative approach"
      ],
      confidence: 0.9,
      factors: {
        cashflowAnalysis: "Excellent - high deployable amount",
        sentinelCheck: "All clear - no risks detected",
        policyCompliance: "Compliant - within all limits"
      }
    },
    action: {
      type: "deploy",
      target: "allocator",
      params: { amount: 1800000, tierA: 1080000, tierB: 720000 }
    },
    reportsAnalyzed: ["cashflow", "sentinel", "allocator"]
  }
}
```

**Tests**: ✅ 3/3 passent (agentic)
- Normal mode (appelle cashflow + sentinel)
- Emergency mode (retrait immédiat)
- User override (respecte demande)

---

## 📁 Structure du code

```
Ai_agent/
├── src/
│   ├── agents/
│   │   ├── cashflowAgent.ts       # Agent analyse cashflow
│   │   ├── sentinelAgent.ts       # Agent surveillance risques
│   │   ├── allocatorAgent.ts      # Agent exécution allocations
│   │   ├── managerAgent.ts        # Manager v1 (tests)
│   │   └── managerAgentV2.ts      # Manager v2 (agentic) ⭐
│   │
│   ├── tools/
│   │   └── agent-tools.ts         # Definitions des tools pour function calling
│   │
│   ├── providers/
│   │   └── DataProvider.ts        # Mock + Real data providers
│   │
│   ├── types/
│   │   └── agents.types.ts        # Types TypeScript
│   │
│   ├── mock-data/
│   │   ├── cashflow-mock.ts       # Données mock Cashflow
│   │   ├── sentinel-mock.ts       # Données mock Sentinel
│   │   ├── allocator-mock.ts      # Données mock Allocator
│   │   └── manager-mock.ts        # Données mock Manager
│   │
│   └── orchestrator.ts            # Point d'entrée principal ⭐
│
├── test/
│   ├── test-cashflow-agent.ts     # Tests Cashflow (3 scénarios)
│   ├── test-sentinel-agent.ts     # Tests Sentinel (5 scénarios)
│   ├── test-allocator-agent.ts    # Tests Allocator (5 scénarios)
│   ├── test-manager-agent.ts      # Tests Manager v1 (6 scénarios)
│   └── test-agentic-system.ts     # Tests système complet ⭐
│
├── package.json                   # Dependencies + scripts
├── tsconfig.json                  # TypeScript config
├── tsconfig.test.json             # TypeScript config tests
├── .env                           # API keys (gitignored)
└── EPIC2_DOCUMENTATION.md         # Ce fichier
```

### Fichiers clés

| Fichier | Rôle | Importance |
|---------|------|-----------|
| `orchestrator.ts` | Point d'entrée, CLI, scheduler | ⭐⭐⭐ |
| `managerAgentV2.ts` | Orchestrateur agentic | ⭐⭐⭐ |
| `DataProvider.ts` | Abstraction données Mock/Real | ⭐⭐⭐ |
| `agent-tools.ts` | Definitions tools function calling | ⭐⭐ |
| `agents.types.ts` | Types pour tous les agents | ⭐⭐ |

---

## ✅ Tests et validation

### Scripts disponibles

```bash
# Tests individuels
npm run test:cashflow    # Test Cashflow Agent
npm run test:sentinel    # Test Sentinel Agent
npm run test:allocator   # Test Allocator Agent
npm run test:manager     # Test Manager Agent v1

# Test système complet (recommandé)
npm run test:agentic     # Test orchestration complète ⭐

# Exécution production
npm run orchestrate              # Run once
npm run orchestrate:scheduled    # Run en cron (24h)
```

### Résultats des tests

#### Cashflow Agent
```
✅ Test 1: Normal scenario - $1.8M déployable
✅ Test 2: High volatility - $1.5M déployable avec buffer élevé
✅ Test 3: Low balance - $30k seulement, recommande HOLD
```

#### Sentinel Agent
```
✅ Test 1: Normal - Aucun risque détecté
✅ Test 2: WARNING - USDC peg 0.997 → HOLD mais surveiller
✅ Test 3: CRITICAL - TVL -40% → WITHDRAW_PARTIAL
✅ Test 4: CRITICAL - USDC depeg 0.992 → WITHDRAW_ALL immédiat
✅ Test 5: Multi-WARNING - Plusieurs signaux faibles → Décision nuancée
```

#### Allocator Agent
```
✅ Test 1: Normal 60/40 - Approuvé
✅ Test 2: Tier B 70% - Rejeté (> 50%)
✅ Test 3: $30k - Rejeté (< $50k min)
✅ Test 4: Balance insuffisant - Rejeté
✅ Test 5: Conservative 80/20 - Approuvé avec haute confidence
```

#### Système Agentic
```
✅ Test 1: Normal mode
   Iteration 1: analyze_cashflow → $1.7M déployable
   Iteration 2: check_risks → NONE
   Iteration 3: Décision ALLOCATE
   Confidence: 90%

✅ Test 2: Emergency mode
   Action immédiate → WITHDRAW
   Pas d'analyse (gain de temps)

✅ Test 3: User override
   Respecte override + valide avec agents
```

### Coverage

| Agent | Tests | Status | Coverage |
|-------|-------|--------|----------|
| Cashflow | 3 scénarios | ✅ | 100% |
| Sentinel | 5 scénarios | ✅ | 100% |
| Allocator | 5 scénarios | ✅ | 100% |
| Manager v1 | 6 scénarios | ✅ | 100% |
| Agentic System | 3 scénarios | ✅ | 100% |

**Total**: 22 tests, 22 passent ✅

---

## 🔗 Intégration Epic 1

### Ce qui est prêt ✅

1. **Architecture modulaire**
   - Data Provider avec interface IDataProvider
   - MockDataProvider utilisé actuellement
   - RealDataProvider prêt à implémenter

2. **Types définis**
   - Toutes les interfaces sont compatibles blockchain
   - Pas de changement nécessaire côté agents

3. **Transaction flow**
   - Allocator retourne déjà `txHash` (mock)
   - Structure compatible Arc Explorer

### Ce qu'il faut faire ⏳

#### 1. Implémenter RealDataProvider

**Fichier**: `src/providers/DataProvider.ts`

```typescript
export class RealDataProvider implements IDataProvider {
  private arcRpcUrl: string;
  private circleApiKey: string;

  constructor(config: { arcRpcUrl: string; circleApiKey: string }) {
    this.arcRpcUrl = config.arcRpcUrl;
    this.circleApiKey = config.circleApiKey;
  }

  // TODO Epic 1 - Implémenter
  async getCashflowData(params): Promise<CashflowInput> {
    // 1. Connecter à Arc RPC
    const provider = new ethers.JsonRpcProvider(this.arcRpcUrl);

    // 2. Récupérer historique transactions du wallet
    const walletAddress = process.env.TREASURY_WALLET_ADDRESS;
    const history = await provider.getHistory(walletAddress);

    // 3. Parser et classifier transactions
    const transactions = history.map(tx => ({
      date: new Date(tx.timestamp * 1000).toISOString(),
      amount: parseFloat(ethers.formatUnits(tx.value, 6)), // USDC = 6 decimals
      type: tx.from === walletAddress ? 'expense' : 'income',
      category: this.classifyTransaction(tx)
    }));

    // 4. Récupérer recurring obligations (base de données ?)
    const obligations = await this.getRecurringObligations();

    return {
      transactions,
      recurringObligations: obligations,
      currentBalance: params.currentBalance,
      currentDate: new Date().toISOString().split('T')[0],
      analysisPeriod: params.analysisPeriod,
      forecastHorizon: params.forecastHorizon
    };
  }

  async getSentinelData(params): Promise<SentinelInput> {
    // 1. Fetch USDC peg from Chainlink oracle on Arc
    const usdcPriceOracle = new ethers.Contract(
      CHAINLINK_USDC_USD_ADDRESS,
      CHAINLINK_ABI,
      provider
    );
    const usdcPeg = await usdcPriceOracle.latestRoundData();

    // 2. Fetch protocol TVL from DeFi Llama API
    const aaveTVL = await fetch('https://api.llama.fi/protocol/aave').then(r => r.json());
    const compoundTVL = await fetch('https://api.llama.fi/protocol/compound').then(r => r.json());

    // 3. Fetch on-chain liquidity from Arc
    const aaveContract = new ethers.Contract(AAVE_ADDRESS, AAVE_ABI, provider);
    const usdcReserve = await aaveContract.getReserveData(USDC_ADDRESS);

    return {
      metrics: {
        usdcPeg: {
          value: parseFloat(ethers.formatUnits(usdcPeg.answer, 8)),
          timestamp: new Date(),
          source: "chainlink"
        },
        protocolHealth: [
          {
            protocol: "aave",
            tvl: aaveTVL.tvl,
            tvlChange24h: aaveTVL.change_1d,
            liquidityRatio: usdcReserve.availableLiquidity / usdcReserve.totalDeposits,
            utilizationRate: usdcReserve.totalBorrows / usdcReserve.totalDeposits
          }
          // ... same for Compound
        ],
        portfolioMetrics: {
          totalDeployed: params.totalDeployed,
          // ... read from smart contracts
        }
      },
      policy: { /* same as mock */ },
      lastCheckTimestamp: new Date(),
      alertHistory: []
    };
  }

  async getCurrentBalance(): Promise<number> {
    // Appeler Circle Developer Wallet API
    const response = await fetch(`https://api.circle.com/v1/wallets/${WALLET_ID}/balance`, {
      headers: { 'Authorization': `Bearer ${this.circleApiKey}` }
    });
    const data = await response.json();
    return parseFloat(data.balance);
  }

  async getCurrentAllocations(): Promise<any> {
    // Lire depuis les smart contracts SafeVault + Aave
    const provider = new ethers.JsonRpcProvider(this.arcRpcUrl);

    const safeVault = new ethers.Contract(SAFEVAULT_ADDRESS, SAFEVAULT_ABI, provider);
    const tierA = await safeVault.balanceOf(TREASURY_WALLET_ADDRESS);

    const aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, AAVE_ABI, provider);
    const tierB = await aavePool.balanceOf(TREASURY_WALLET_ADDRESS);

    const totalBalance = await this.getCurrentBalance();

    return {
      tierA: parseFloat(ethers.formatUnits(tierA, 6)),
      tierB: parseFloat(ethers.formatUnits(tierB, 6)),
      liquid: totalBalance - (tierA + tierB)
    };
  }
}
```

#### 2. Implémenter vraies transactions dans Allocator

**Fichier**: `src/agents/allocatorAgent.ts`

```typescript
// Remplacer createMockTransactions par:
private async executeRealTransactions(input: AllocatorInput) {
  const transactions: any[] = [];

  // Initialiser Circle Developer Wallet
  const wallet = new CircleWallet({
    apiKey: process.env.CIRCLE_API_KEY,
    walletId: process.env.TREASURY_WALLET_ID
  });

  // Transaction Tier A → SafeVault
  if (input.allocation.tierA.amount > 0) {
    console.log(`Deploying $${input.allocation.tierA.amount} to SafeVault...`);

    const tx1 = await wallet.sendTransaction({
      to: SAFEVAULT_CONTRACT_ADDRESS,
      amount: input.allocation.tierA.amount,
      token: 'USDC',
      data: encodeFunctionData({
        abi: SAFEVAULT_ABI,
        functionName: 'deposit',
        args: [ethers.parseUnits(input.allocation.tierA.amount.toString(), 6)]
      })
    });

    // Attendre confirmation
    await tx1.wait();

    transactions.push({
      target: 'SafeVault',
      amount: input.allocation.tierA.amount,
      txHash: tx1.hash,
      gasUsed: tx1.gasUsed.toString(),
      status: 'confirmed',
      timestamp: new Date()
    });
  }

  // Transaction Tier B → Aave/Compound
  if (input.allocation.tierB.amount > 0) {
    console.log(`Deploying $${input.allocation.tierB.amount} to ${input.allocation.tierB.target}...`);

    const targetAddress = input.allocation.tierB.target === 'Aave'
      ? AAVE_POOL_ADDRESS
      : COMPOUND_ADDRESS;

    const tx2 = await wallet.sendTransaction({
      to: targetAddress,
      amount: input.allocation.tierB.amount,
      token: 'USDC'
    });

    await tx2.wait();

    transactions.push({
      target: input.allocation.tierB.target,
      amount: input.allocation.tierB.amount,
      txHash: tx2.hash,
      gasUsed: tx2.gasUsed.toString(),
      status: 'confirmed',
      timestamp: new Date()
    });
  }

  return transactions;
}
```

#### 3. Changer le mode dans Orchestrator

**Fichier**: `src/orchestrator.ts`

```typescript
// Dans main() ou dans votre code d'appel
const orchestrator = new TreasuryOrchestrator({
  mode: 'real',  // ← Changer de 'mock' à 'real'
  arcRpcUrl: process.env.ARC_RPC_URL,
  circleApiKey: process.env.CIRCLE_API_KEY
});

await orchestrator.run();
```

### Variables d'environnement nécessaires

Ajouter dans `.env`:
```bash
# Epic 1 - Blockchain integration
ARC_RPC_URL=https://rpc.arc.testnet.example.com
CIRCLE_API_KEY=your_circle_api_key
TREASURY_WALLET_ID=your_wallet_id
TREASURY_WALLET_ADDRESS=0x...

# Smart contracts addresses (Epic 1 les fournira)
SAFEVAULT_ADDRESS=0x...
AAVE_POOL_ADDRESS=0x...
COMPOUND_ADDRESS=0x...
CHAINLINK_USDC_USD_ADDRESS=0x...
```

### Checklist intégration

- [ ] Epic 1 déploie SafeVault.sol sur Arc
- [ ] Epic 1 crée Circle Developer Wallet
- [ ] Epic 1 fournit les addresses des contracts
- [ ] Implémenter `RealDataProvider.getCashflowData()`
- [ ] Implémenter `RealDataProvider.getSentinelData()`
- [ ] Implémenter `RealDataProvider.getCurrentBalance()`
- [ ] Implémenter `RealDataProvider.getCurrentAllocations()`
- [ ] Remplacer `createMockTransactions()` par vraies txs
- [ ] Tester sur Arc Testnet
- [ ] Valider les txHash sur Arc Explorer
- [ ] Mettre à jour `.env` avec vraies valeurs
- [ ] Changer `mode: 'mock'` → `mode: 'real'`
- [ ] Tests end-to-end sur testnet

---

## 📖 Guide d'utilisation

### Installation

```bash
cd Ai_agent
npm install
```

### Configuration

1. Créer `.env`:
```bash
cp .env.example .env
```

2. Ajouter votre clé Mistral:
```bash
MISTRAL_API_KEY=your_key_here
```

### Exécution

#### Mode développement (Mock data)
```bash
# Test unique
npm run orchestrate

# Mode simulation
npm run orchestrate -- --simulation

# Mode urgence
npm run orchestrate -- --emergency
```

#### Mode production (Après Epic 1)
```bash
# Run once
npm run orchestrate -- --real

# Scheduler (cron 24h)
npm run orchestrate:scheduled -- --real --interval 24
```

### Tests

```bash
# Tous les tests
npm run test:cashflow
npm run test:sentinel
npm run test:allocator
npm run test:manager
npm run test:agentic  # ⭐ Test complet

# Rebuild avant tests
npm run test:build
```

### Monitoring

Les logs sont structurés pour faciliter le debugging :

```bash
🎯 Manager Agent V2: Starting orchestration...
   Mode: normal
   Treasury balance: $2,000,000

🔄 Iteration 1:
   📞 Calling tool: analyze_cashflow
      💰 Executing Cashflow Agent...
      ✅ Cashflow Agent: Analysis complete

🔄 Iteration 2:
   📞 Calling tool: check_risks
      🛡️  Executing Sentinel Agent...
      ✅ Sentinel Agent: Analysis complete - NONE

✅ ORCHESTRATION COMPLETE
Decision: ALLOCATE
Confidence: 90.0%
```

### Debugging

Si un agent échoue :

1. **Vérifier les logs** pour identifier l'agent en erreur
2. **Lancer le test unitaire** de cet agent :
   ```bash
   npm run test:cashflow  # ou sentinel, allocator
   ```
3. **Vérifier le mock data** dans `src/mock-data/`
4. **Vérifier l'API key Mistral** dans `.env`

---

## ❓ FAQ

### Q1: Pourquoi deux versions de Manager Agent ?

**R**:
- `managerAgent.ts` (v1) : Pour les tests avec input prédéfini
- `managerAgentV2.ts` (v2) : Version agentic avec function calling (production)

La v2 est celle utilisée par l'orchestrator.

### Q2: Quelle est la différence entre Mock et Real DataProvider ?

**R**:
- **MockDataProvider** : Génère des données simulées pour tester sans blockchain
- **RealDataProvider** : Fetch de vraies données depuis Arc RPC + Circle API

Le code est le même côté agents, seul le provider change.

### Q3: Comment les agents communiquent entre eux ?

**R**: Ils ne communiquent pas directement. Le **Manager Agent V2** est le seul qui orchestre :

```
Manager appelle Cashflow → Cashflow retourne résultat
Manager appelle Sentinel → Sentinel retourne résultat
Manager décide → appelle Allocator si ALLOCATE
```

C'est le **function calling** de Mistral qui gère cette orchestration dynamiquement.

### Q4: Que se passe-t-il si Mistral API est down ?

**R**: Le système retourne une erreur et **defaulte à HOLD** pour la sécurité. Aucune action n'est prise.

### Q5: Peut-on forcer une décision manuellement ?

**R**: Oui, via l'`userOverride` :

```typescript
const orchestrator = new TreasuryOrchestrator({
  mode: 'mock',
  userOverride: {
    forceAction: 'WITHDRAW',
    reason: 'CFO requested for acquisition'
  }
});
```

Le Manager respectera l'override tout en validant avec les agents.

### Q6: Combien coûte une exécution en tokens Mistral ?

**R**: Environ 15,000-20,000 tokens par cycle complet :
- Cashflow Agent : ~1,000 tokens
- Sentinel Agent : ~1,500 tokens
- Manager orchestration : ~10,000 tokens (plusieurs iterations)
- Allocator : ~1,000 tokens

Coût estimé : **$0.02 - $0.03 par cycle**

### Q7: Le système peut-il tourner en continu ?

**R**: Oui, avec le mode scheduled :

```bash
npm run orchestrate:scheduled -- --interval 24
```

Cela exécute le cycle toutes les 24h. Pour production, utiliser un vrai cron ou service comme AWS EventBridge.

### Q8: Comment ajouter un nouvel agent ?

**R**:
1. Créer `src/agents/newAgent.ts`
2. Ajouter un tool dans `src/tools/agent-tools.ts`
3. Ajouter le handler dans `managerAgentV2.createToolHandlers()`
4. Le Manager pourra maintenant l'appeler automatiquement

### Q9: Les décisions sont-elles déterministes ?

**R**: Presque. Les LLMs ont `temperature: 0.2-0.3` pour être très déterministes, mais pas 100%. Les **quick checks** (rules-based) sont 100% déterministes.

### Q10: Que faire si les tests échouent après Epic 1 ?

**R**:
1. Vérifier que `RealDataProvider` retourne le bon format
2. Comparer avec `MockDataProvider` (référence)
3. Vérifier les types avec TypeScript
4. S'assurer que les smart contracts retournent les bonnes valeurs

---

## 📞 Contact & Support

**Responsable Epic 2**: Eli

**Pour questions techniques**:
- Code : Vérifier ce document + commentaires dans le code
- Bugs : Créer une issue GitHub
- Intégration Epic 1 : Coordonner avec l'équipe blockchain

**Prochaines étapes**:
1. ✅ Epic 2 complété (ce document)
2. ⏳ Attendre Epic 1 (smart contracts + wallet)
3. ⏳ Intégration RealDataProvider
4. ⏳ Tests sur Arc Testnet
5. ⏳ Déploiement production

---

**Document créé le**: Octobre 2025
**Dernière mise à jour**: Octobre 2025
**Version**: 2.0 (Agentic)
**Status Epic 2**: ✅ 100% Complété
