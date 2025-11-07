# TreasuryPilot - Architecture complète

## Vue d'ensemble du système

TreasuryPilot est un système autonome de gestion de trésorerie qui utilise l'IA pour optimiser automatiquement les rendements des fonds USDC d'entreprise sur la blockchain Arc.

## Architecture On-Chain (Arc Testnet)

### Smart Contracts

```
┌─────────────────────────────────────────────────────────┐
│                      SafeVault                          │
│              (Treasury Management)                      │
│                                                         │
│  - Détient les fonds USDC de l'entreprise             │
│  - Permet les dépôts/retraits                         │
│  - Émit des alertes pour l'AI agent                   │
│  - Owner: 0x594CF75585509740F8ae7F148e9e0287BeE098F9  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ L'AI Agent alloue les fonds
                            ▼
        ┌───────────────────┴───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ YieldPoolStable │ │YieldPoolModerate│ │YieldPoolHighYield│
│                 │ │                 │ │                 │
│  APY: 3%        │ │  APY: 5%        │ │  APY: 9%        │
│  Risk: Low (1)  │ │  Risk: Med (2)  │ │  Risk: High (3) │
│                 │ │                 │ │                 │
│  Simule un pool │ │  Simule un pool │ │  Simule un pool │
│  DeFi conserv.  │ │  DeFi équilibré │ │  DeFi agressif  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Architecture Off-Chain (AI Agent)

```
┌──────────────────────────────────────────────────────────┐
│                    AI Agent System                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         1. Data Fetcher Module                 │    │
│  │  - Lit les APY de chaque pool                  │    │
│  │  - Lit les allocations actuelles               │    │
│  │  - Lit le solde de SafeVault                   │    │
│  └────────────────────────────────────────────────┘    │
│                         │                               │
│                         ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │         2. LLM Reasoning Engine                │    │
│  │  - Compare rendements vs risques               │    │
│  │  - Applique les contraintes de politique       │    │
│  │  - Décide des réallocations optimales          │    │
│  │  - Génère des explications humaines            │    │
│  └────────────────────────────────────────────────┘    │
│                         │                               │
│                         ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │         3. Transaction Executor                │    │
│  │  - Construit les transactions                  │    │
│  │  - Signe avec wallet owner                     │    │
│  │  - Envoie sur Arc testnet                      │    │
│  │  - Vérifie la confirmation                     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Flux de fonctionnement autonome

### Boucle d'exécution (toutes les 30-60 secondes)

```
1. READ PHASE
   │
   ├─→ SafeVault.totalUsdcBalance()
   ├─→ YieldPoolStable.currentAPY()
   ├─→ YieldPoolModerate.currentAPY()
   ├─→ YieldPoolHighYield.currentAPY()
   ├─→ SafeVault.getYieldRate() (baseline)
   │
2. REASONING PHASE
   │
   ├─→ L'AI compare les APYs
   ├─→ Évalue les risques de chaque pool
   ├─→ Applique les contraintes (ex: max 40% en high-risk)
   ├─→ Calcule l'allocation optimale
   ├─→ Génère un plan de réallocation
   │
3. DECISION PHASE
   │
   ├─→ Si amélioration > seuil → REBALANCE
   ├─→ Sinon → SKIP (attendre prochain cycle)
   │
4. EXECUTION PHASE (si rebalance nécessaire)
   │
   ├─→ Construire transaction:
   │   • SafeVault.withdraw(amount, yieldPool)
   │   • YieldPool.deposit(amount)
   │
   ├─→ Signer avec owner wallet
   ├─→ Broadcaster sur Arc testnet
   ├─→ Attendre confirmation
   │
5. LOGGING PHASE
   │
   ├─→ Enregistrer l'action
   ├─→ Générer explication humaine
   ├─→ Mettre à jour le dashboard UI
   │
   └─→ Retour à l'étape 1
```

## Détails techniques

### Configuration Arc Network

- **USDC Address**: `0x3600000000000000000000000000000000000000`
- **Owner Wallet**: `0x594CF75585509740F8ae7F148e9e0287BeE098F9`
- **Network**: Arc L1 (EVM-Compatible)
- **Gas**: Payé en USDC (feature unique d'Arc)
- **Finality**: Sub-second deterministic finality

### Règles de sécurité On-Chain

Toutes les contraintes sont codées dans les smart contracts, pas dans l'AI :

1. **Ownership**: Seul le owner peut retirer des fonds
2. **ReentrancyGuard**: Protection contre les attaques de réentrance
3. **Balance checks**: Vérification des soldes avant/après transfert
4. **Input validation**: Montants > 0, adresses non-nulles

### Exemple de décision AI

```json
{
  "timestamp": "2025-11-07T12:00:00Z",
  "current_state": {
    "safeVault_balance": 100000,
    "poolStable_allocation": 30000,
    "poolModerate_allocation": 50000,
    "poolHighYield_allocation": 20000
  },
  "market_data": {
    "poolStable_apy": 3.0,
    "poolModerate_apy": 5.2,
    "poolHighYield_apy": 9.5
  },
  "ai_decision": {
    "action": "REBALANCE",
    "changes": [
      {
        "from": "poolStable",
        "to": "poolModerate",
        "amount": 10000,
        "reason": "Moderate pool APY increased from 5.0% to 5.2% with same risk tier"
      }
    ],
    "expected_yield_improvement": "+$200/year",
    "risk_assessment": "Within safe limits (20% high-risk allocation)"
  }
}
```

## Déploiement

### Ordre de déploiement

1. **SafeVault** (déjà déployé dans `/Arc`)
2. **YieldPoolStable** (dans `/YieldPoolStable`)
3. **YieldPoolModerate** (dans `/YieldPoolModerate`)
4. **YieldPoolHighYield** (dans `/YieldPoolHighYield`)

### Commandes de build

```bash
# YieldPoolStable
cd YieldPoolStable && forge build

# YieldPoolModerate
cd YieldPoolModerate && forge build

# YieldPoolHighYield
cd YieldPoolHighYield && forge build
```

### Commandes de déploiement

```bash
# Définir les variables d'environnement
export ARC_RPC_URL="<arc_testnet_rpc>"
export PRIVATE_KEY="<your_private_key>"

# Déployer YieldPoolStable
cd YieldPoolStable
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Déployer YieldPoolModerate
cd ../YieldPoolModerate
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Déployer YieldPoolHighYield
cd ../YieldPoolHighYield
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Prochaines étapes

1. ✅ Smart contracts créés et structurés
2. ⏳ Build et test des contracts
3. ⏳ Déploiement sur Arc testnet
4. ⏳ Développement de l'AI agent (off-chain)
5. ⏳ Développement du frontend/dashboard
6. ⏳ Tests end-to-end

## Stack technologique

- **Blockchain**: Arc L1 (EVM-Compatible)
- **Smart Contracts**: Solidity 0.8.24
- **Framework**: Foundry (Forge)
- **Standards**: OpenZeppelin (Ownable, ReentrancyGuard)
- **AI Agent**: Node.js + ethers.js + OpenAI API (à développer)
- **Frontend**: React + Web3.js (à développer)

## Ressources

- [Documentation Arc](https://docs.arc.network)
- [Arc Explorer](https://explorer.arc.network)
- [Arc Faucet](https://faucet.arc.network)

