# 🚀 TreasuryPilot - Contrats Déployés sur Arc Testnet

## 📍 Network Information

- **Network**: Arc Testnet
- **Chain ID**: 5042002
- **RPC URL**: https://rpc.testnet.arc.network
- **Explorer**: https://testnet.arcscan.net (à vérifier)

## 👤 Owner Wallet

**Address**: `0x594CF75585509740F8ae7F148e9e0287BeE098F9`

## 🏦 Smart Contracts Deployed

### 1. SafeVault (Treasury Management)

**Status**: ✅ Déjà déployé
- **Contract**: SafeVault
- **Address**: `TBD` (à récupérer depuis le dossier Arc)
- **Function**: Gestion principale de la trésorerie USDC
- **Features**:
  - Dépôt/retrait USDC
  - Alertes pour l'AI agent
  - Yield rate tracking

---

### 2. YieldPoolStable (Low Risk Pool)

**Status**: ✅ Déployé le 2025-11-07
- **Contract**: YieldPoolStable
- **Address**: `0x3892f5b89ec544cBA3a65462FAF2F7182A4eac0F`
- **APY**: 3% (300 basis points)
- **Risk Tier**: 1 (Low)
- **Transaction Hash**: `0x237085bd3bbfa8c2d793b0c3a561c3d492a3c5249ad817f1486db930c2a5c4bf`
- **Block**: 9952534
- **Gas Used**: 1,384,598
- **Deployment Cost**: 0.222920278 ETH

**Features**:
- Conservative DeFi lending simulation
- Deposit/withdraw USDC
- Yield accumulation
- Dynamic APY adjustment

---

### 3. YieldPoolModerate (Medium Risk Pool)

**Status**: ✅ Déployé le 2025-11-07
- **Contract**: YieldPoolModerate
- **Address**: `0xaB13BCe7803eC1E2f119391c47F27fC42A921597`
- **APY**: 5% (500 basis points)
- **Risk Tier**: 2 (Medium)
- **Transaction Hash**: `0x286c85ef5bdecdb16fc3859b5334d3703e9bd3cc7237ca7e1eb4ec07d970ca77`
- **Block**: 9952763
- **Gas Used**: 1,384,814
- **Deployment Cost**: 0.2232320168 ETH

**Features**:
- Balanced DeFi lending simulation
- Deposit/withdraw USDC
- Yield accumulation
- Dynamic APY adjustment

---

### 4. YieldPoolHighYield (High Risk Pool)

**Status**: ✅ Déployé le 2025-11-07
- **Contract**: YieldPoolHighYield
- **Address**: `0x313e6fA23577f9A3c97F79de4D120b544159b61F`
- **APY**: 9% (900 basis points)
- **Risk Tier**: 3 (High)
- **Transaction Hash**: `0x780e145a089fad867c67eea9a1159414c14c77a949bdf76ab2e2f758124e9c6f`
- **Block**: 9952886
- **Gas Used**: 1,384,922
- **Deployment Cost**: 0.222972442 ETH

**Features**:
- Aggressive DeFi lending simulation
- Deposit/withdraw USDC
- Yield accumulation
- Dynamic APY adjustment

---

## 💰 Token Addresses

### USDC on Arc Testnet
**Address**: `0x3600000000000000000000000000000000000000`

---

## 🔗 System Architecture

```
SafeVault (Treasury)
0x[TBD]
    │
    ├─→ YieldPoolStable
    │   0x3892f5b89ec544cBA3a65462FAF2F7182A4eac0F
    │   APY: 3% | Risk: Low
    │
    ├─→ YieldPoolModerate
    │   0xaB13BCe7803eC1E2f119391c47F27fC42A921597
    │   APY: 5% | Risk: Medium
    │
    └─→ YieldPoolHighYield
        0x313e6fA23577f9A3c97F79de4D120b544159b61F
        APY: 9% | Risk: High
```

---

## 🤖 AI Agent Configuration

Pour configurer l'AI agent, utilise ces adresses :

```javascript
const contracts = {
  network: {
    chainId: 5042002,
    rpcUrl: "https://rpc.testnet.arc.network",
    name: "Arc Testnet"
  },
  safeVault: {
    address: "0x[TBD]", // À mettre à jour
    abi: "./abis/SafeVault.json"
  },
  yieldPools: [
    {
      name: "Stable",
      address: "0x3892f5b89ec544cBA3a65462FAF2F7182A4eac0F",
      apy: 300, // 3%
      riskTier: 1,
      abi: "./abis/YieldPoolStable.json"
    },
    {
      name: "Moderate",
      address: "0xaB13BCe7803eC1E2f119391c47F27fC42A921597",
      apy: 500, // 5%
      riskTier: 2,
      abi: "./abis/YieldPoolModerate.json"
    },
    {
      name: "HighYield",
      address: "0x313e6fA23577f9A3c97F79de4D120b544159b61F",
      apy: 900, // 9%
      riskTier: 3,
      abi: "./abis/YieldPoolHighYield.json"
    }
  ],
  usdc: {
    address: "0x3600000000000000000000000000000000000000"
  },
  owner: {
    address: "0x594CF75585509740F8ae7F148e9e0287BeE098F9"
  }
};
```

---

## 🔍 Verification Links (Arc Testnet Explorer)

- **YieldPoolStable**: https://testnet.arcscan.net/address/0x3892f5b89ec544cBA3a65462FAF2F7182A4eac0F
- **YieldPoolModerate**: https://testnet.arcscan.net/address/0xaB13BCe7803eC1E2f119391c47F27fC42A921597
- **YieldPoolHighYield**: https://testnet.arcscan.net/address/0x313e6fA23577f9A3c97F79de4D120b544159b61F

---

## 📝 Total Deployment Costs

| Contract | Gas Used | Cost (ETH) |
|----------|----------|------------|
| YieldPoolStable | 1,384,598 | 0.222920278 |
| YieldPoolModerate | 1,384,814 | 0.2232320168 |
| YieldPoolHighYield | 1,384,922 | 0.222972442 |
| **TOTAL** | **4,154,334** | **0.6691247368 ETH** |

---

## ✅ Next Steps

1. **Mettre à jour l'adresse SafeVault** dans ce fichier
2. **Développer l'AI Agent** avec ces adresses
3. **Créer le frontend/dashboard** pour visualiser les allocations
4. **Tester les interactions** entre SafeVault et les YieldPools
5. **Implémenter la logique de rebalancing** automatique

---

## 🔐 Security Notes

- Tous les contrats partagent le même owner: `0x594CF75585509740F8ae7F148e9e0287BeE098F9`
- OpenZeppelin standards utilisés (Ownable, ReentrancyGuard)
- Balance checks avant/après chaque transfert
- Input validation complète

---

## 📞 Support & Resources

- **Arc Documentation**: https://docs.arc.network
- **Arc Faucet**: https://faucet.arc.network
- **Project Repository**: [Local path]

---

*Document généré automatiquement après le déploiement sur Arc Testnet - 2025-11-07*

