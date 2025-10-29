### 🎯 Contexte du Projet (Hackathon Circle x Arc)

Objectif : Construire un **système de paiement intelligent piloté par IA** utilisant :

- **Arc blockchain** (EVM-compatible, USDC natif comme gas)
- **Circle Developer-Controlled Wallets** (custody & automatisation)
- Potentiellement **CCTP** pour cross-chain

Le projet choisi : **TREASURY AUTOPILOT**

---

### 🏦 Idée Centrale

Les entreprises ont souvent **beaucoup de trésorerie inactive** (argent sur un compte bancaire → 0% APY).

**Treasury Autopilot** est un **agent IA autonome** qui :

1. Analyse les flux financiers (prédictions de dépenses et obligations à venir)
2. Décide combien d’argent peut être temporairement investi sans risque
3. Convertit et déploie cet argent en **USDC** dans des **stratégies DeFi** pour générer un rendement
4. **Retire automatiquement** avant les échéances de paiement

→ **Promesse :** *"Ton cash commence à faire 4–6% APY automatiquement, sans rien faire, sans jamais manquer un paiement."*

---

### 🤖 Les 3 Agents IA Clés

| Agent | Rôle | Fonction |
| --- | --- | --- |
| **Cashflow Agent** | Prédiction | Analyse historique et calendrier → prédit besoins futurs |
| **Allocator Agent** | Optimisation | Décide la répartition entre **Tier A (Safe)** et **Tier B (Yield)** |
| **Sentinel Agent** | Sécurité & Surveillance | Surveille risques (peg USDC, TVL protocoles, échéances) et déclenche retraits |

---

### 💰 Stratégie DeFi Simplifiée pour le Hackathon (MVP)

Pour gagner : **simplicité + clarté + démonstration live**

**Tier A (70%) — Safe**

- Vault interne sur Arc (SafeVault.sol)
- Rendement simulé 4% APY
- Liquidité immédiate

**Tier B (30%) — Enhanced**

- Intégration Aave V3 (ou simulation si manque de temps)
- Rendement ~5.5% APY
- Retrait 24–48h

---

### 🧱 Architecture High-Level

```
Next.js Frontend  →  API orchestrator  →  3 IA Agents
                               ↓
                  Circle Developer Wallets
                               ↓
                        Arc Smart Contracts
                  (SafeVault + optional Aave integration)

```

---

### 🎬 Démo Hackathon (5 minutes)

1. Montrer trésorerie d’une entreprise (ex: $2M)
2. Lancer l’agent IA : il décide → "Déployer $1.7M, garder $300k liquidités"
3. Exécuter **transactions en direct** sur Arc testnet (USDC → vault)
4. Simuler passage du temps → Obligation à venir → Retrait automatique
5. Afficher résultat :
    
    *“$84k/an de rendement automatique vs $0 en banque”*
    

→ C’est ici que les juges sont convaincus.

---

### 💸 Post-Hackathon Business Model

- Pricing = abonnement + % du rendement généré
- Cible = startups avec $500k–$20M de trésorerie
- Produit = **AI CFO-as-a-Service**

---

### 📌 Conclusion Synthèse

Nous construisons un **AI CFO Agent** :

- qui **prévoit les dépenses**
- **optimise la trésorerie**
- **investit dans DeFi automatiquement**
- **assure la liquidité parfaite**
- et **génère un rendement mesurable** → démontrable en live.

C’est **exactement** la vision décrite par :

> "Smart Treasury Agents: autonomous agents optimizing working capital."
> 

Mais nous le faisons en **simple**, **clair**, **live**, **réel** → donc **gagnant hackathon**.