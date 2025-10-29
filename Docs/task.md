# 🪙 SAFE DEFI TREASURY AI — ARC-ONLY VERSION

> Objectif : Construire une trésorerie intelligente sur Arc gérée par des agents IA (Cashflow, Allocator, Sentinel) interagissant directement avec des smart contracts SafeVault.sol et des Circle Developer-Controlled Wallets, en USDC.
> 

---

## 🧱 EPIC E1 — ARC INFRASTRUCTURE & SMART CONTRACTS

### 🎯 Objectif

Mettre en place tout l’environnement Arc Testnet (RPC, wallets, contrat SafeVault, logs on-chain).

---

### **Tâche E1.1 — Configuration Environnement Arc**

- **Description :**
    
    Configurer `ARC_RPC_URL`, `PRIVATE_KEY`, `CIRCLE_API_KEY`. Tester la connexion RPC via Foundry/Hardhat.
    
- **Résultat attendu :**
    
    `cast block-number` retourne un numéro valide.
    
- **Résultat obtenu :**

---

### **Tâche E1.2 — Création Wallet Circle (Arc)**

- **Description :**
    
    Créer un wallet “Developer Controlled” sur Arc, y transférer du gas USDC.
    
- **Résultat attendu :**
    
    Adresse + balance visibles avec `cast balance <address>`.
    
- **Résultat obtenu :**

---

### **Tâche E1.3 — Déploiement Smart Contract SafeVault.sol**

- **Description :**
    
    Déployer le contrat EVM Arc avec :
    
    - `deposit(amount)`
    - `withdraw(amount)`
    - `getBalances()`
    - `getYieldRate()`
    - Events `Deposit`, `Withdraw`, `AlertTriggered`.
- **Résultat attendu :**
    
    Contrat déployé ; adresse et hash visibles sur Arc Explorer.
    
- **Résultat obtenu :**

---

### **Tâche E1.4 — Test Transactions USDC**

- **Description :**
    
    Effectuer manuellement un `deposit()` et `withdraw()` de test via cast/forge ou backend API.
    
- **Résultat attendu :**
    
    Transactions confirmées sur Arc Explorer.
    
- **Résultat obtenu :**

---

## 🧠 EPIC E2 — AI AGENTS (ORCHESTRATION ARC-SIDE)

### 🎯 Objectif

Développer trois agents IA interagissant avec Arc : **Cashflow**, **Allocator**, **Sentinel**.

---

### **Tâche E2.1 — CashflowAgent (Prévision & Buffer)**

- **Description :**
    
    Analyse historique → prédit obligations et buffer à maintenir sur Arc.
    
- **Résultat attendu :**

```json
{
  "obligations": [{"date":"2025-11-30","montant":80000}],
  "buffer":120000
}

```

- **Résultat obtenu :**

---

### **Tâche E2.2 — AllocatorAgent (Allocation USDC sur Arc)**

- **Description :**
    
    Lit la balance USDC, applique `policy.json` (TierA ≥ 60 %, TierB ≤ 40 %), exécute `deposit()` sur SafeVault.
    
- **Résultat attendu :**

```json
{"txHash":"0xabc...","allocation":{"TierA":0.7,"TierB":0.3}}

```

- **Résultat obtenu :**

---

### **Tâche E2.3 — SentinelAgent (Surveillance & Auto-retrait)**

- **Description :**
    
    Surveille le peg USDC (via Chainlink ou API Circle) et les TVL des protocoles Arc (Aave/Compound).
    
    Déclenche `withdraw()` si peg < 0.998 ou TVL drop > 35 %.
    
- **Résultat attendu :**
    
    Transaction retrait confirmée sur Arc Explorer.
    
- **Résultat obtenu :**

---

### **Tâche E2.4 — Orchestrator Scheduler**

- **Description :**
    
    Cron qui exécute périodiquement les agents IA et enregistre les actions.
    
- **Résultat attendu :**
    
    Logs :
    

```
[ARC] AllocatorAgent → deposit 70% TierA (tx: 0x...)

```

- **Résultat obtenu :**

---

## 💰 EPIC E3 — DASHBOARD ARC TREASURY (UI)

### 🎯 Objectif

Interface Next.js connectée à Arc pour afficher balances, yields et logs on-chain.

---

### **Tâche E3.1 — Setup UI**

- **Description :**
    
    Initialiser Next.js + shadcn + layout Dashboard.
    
- **Résultat attendu :**
    
    Dashboard accessible sur `/dashboard`.
    
- **Résultat obtenu :**

---

### **Tâche E3.2 — Vue Trésorerie**

- **Description :**
    
    Afficher total USDC, montant investi, rendement APY (calculé depuis SafeVault).
    
- **Résultat attendu :**
    
    Cartes dynamiques mises à jour via backend.
    
- **Résultat obtenu :**

---

### **Tâche E3.3 — Vue Agents IA**

- **Description :**
    
    Montrer statut (Cashflow/Allocator/Sentinel) et dernière action.
    
- **Résultat attendu :**
    
    Composant “AI Agent Status” avec icônes.
    
- **Résultat obtenu :**

---

### **Tâche E3.4 — Logs On-Chain**

- **Description :**
    
    Afficher les events du Smart Contract (via RPC Arc).
    
- **Résultat attendu :**
    
    Table logs en temps réel.
    
- **Résultat obtenu :**

---

## 🛡 EPIC E4 — ARC SECURITY MONITORING & ALERTS

### 🎯 Objectif

Surveiller les risques directement sur Arc et protéger les fonds.

---

### **Tâche E4.1 — Peg USDC**

- **Description :**
    
    Requêtes API Circle ou Chainlink → si peg < 0.998 → event `AlertTriggered`.
    
- **Résultat attendu :**
    
    Alerte + transaction `pause()` sur SafeVault.
    
- **Résultat obtenu :**

---

### **Tâche E4.2 — TVL Monitoring**

- **Description :**
    
    Comparer la TVL Aave/Compound sur Arc avec historique 24 h.
    
- **Résultat attendu :**
    
    Si drop > 35 % → `withdrawAll()` exécuté.
    
- **Résultat obtenu :**

---

### **Tâche E4.3 — Notifications Admin**

- **Description :**
    
    Notifier CFO/Admin (email, Discord) lors de retraits automatiques.
    
- **Résultat attendu :**
    
    Message :
    

> [ARC ALERT] Sentinel withdraw 30 000 USDC (tx: 0x...)
> 
- **Résultat obtenu :**

---

## 🧩 EPIC E5 — DEMO & SIMULATION ARC

### 🎯 Objectif

Simuler un cycle complet Arc-native pour la présentation du hackathon.

---

### **Tâche E5.1 — Script de Démo**

- **Description :**
    
    Timeline : Jour 1 deposit → Jour 3 yield → Jour 4 alert → Jour 5 withdraw.
    
- **Résultat attendu :**
    
    Logs cohérents avec transactions Arc.
    
- **Résultat obtenu :**

---

### **Tâche E5.2 — Fast-Forward**

- **Description :**
    
    Accélérer 7 jours en 30 s, avec données Arc mockées.
    
- **Résultat attendu :**
    
    Graphiques et hashs mis à jour.
    
- **Résultat obtenu :**

---

### **Tâche E5.3 — Vidéo Pitch**

- **Description :**
    
    Filmer le flow IA → Arc → Sentinel → retrait.
    
- **Résultat attendu :**
    
    Vidéo 90 s prête pour soumission.
    
- **Résultat obtenu :**

---

## ⚙️ EPIC E6 — LOGGING & ADMIN CONTROL

### 🎯 Objectif

Assurer la traçabilité des actions IA/Arc et le contrôle manuel du système.

---

### **Tâche E6.1 — Logger Backend**

- **Description :**
    
    Sauvegarder timestamp, agent, action, txHash.
    
- **Résultat attendu :**
    
    Logs persistants (fichier ou DB).
    
- **Résultat obtenu :**

---

### **Tâche E6.2 — UI Logs**

- **Description :**
    
    Page Dashboard “Agent Activity” avec filtres.
    
- **Résultat attendu :**
    
    Table filtrable par agent.
    
- **Résultat obtenu :**

---

### **Tâche E6.3 — Pause/Resume**

- **Description :**
    
    Bouton Admin pour suspendre ou relancer le scheduler IA.
    
- **Résultat attendu :**
    
    `AI status: paused|running`.
    
- **Résultat obtenu :**

---

## 🧾 EPIC E7 — DOCS & SUBMISSION HACKATHON

### 🎯 Objectif

Préparer les livrables (README, Slides, Vidéo, Soumission Lablab.ai).

---

### **Tâche E7.1 — README GitHub**

- **Description :**
    
    Documenter l’architecture Arc-only, agents, contrat, et commandes `forge deploy`.
    
- **Résultat attendu :**
    
    README clair, avec schéma Arc.
    
- **Résultat obtenu :**

---

### **Tâche E7.2 — Pitch Deck**

- **Description :**
    
    Slides : Problème | Solution IA + Arc | Architecture | Demo | Impact.
    
- **Résultat attendu :**
    
    PDF 5 slides max.
    
- **Résultat obtenu :**

---

### **Tâche E7.3 — Soumission Lablab.ai**

- **Description :**
    
    Uploader vidéo + repo GitHub + liens Arc Explorer.
    
- **Résultat attendu :**
    
    Soumission validée et visible sur leaderboard.
    
- **Résultat obtenu :**