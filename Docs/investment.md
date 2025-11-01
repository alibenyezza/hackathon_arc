

# Investissements — résumé simple

## 1) Qu’est-ce que Tier A ?

* **Définition courte :** placement « safe », très liquide, faible risque.
* **Exemples concrets :** USDC placés dans des produits « cash-equivalent » / stable yield (ex. USYC, tokenized T-Bills, DSR/Maker pour stable yield).
* **Objectif :** protéger le capital + générer un rendement stable (pour garder de la liquidité pour paiements).
* **Rendement réaliste aujourd’hui :** **~4% / an** (ordre de grandeur : 3.5% → 4.5% selon protocoles / offres institutionnelles).
* **Caractéristiques :**

  * liquidité rapide (instant → 24h),
  * faible volatilité du principal,
  * bon pour la réserve de sécurité (buffer).

## 2) Qu’est-ce que Tier B ?

* **Définition courte :** placement « enhanced », un peu plus risqué, cherche un APY supérieur.
* **Exemples concrets :** lending sur Aave/Compound (USDC supply), vaults DeFi à rendement (Aave V3, Compound, Curve pools).
* **Objectif :** augmenter le rendement global de la trésorerie en acceptant un risque/liquidité plus élevé.
* **Rendement réaliste aujourd’hui :** **~5% → 7% / an** (ordre de grandeur : 5%–6% courant, selon protocole et conditions).
* **Caractéristiques :**

  * liquidité parfois moins immédiate (ex : 24h → plusieurs jours selon protocole),
  * exposition à risques smart-contract / conditions de marché,
  * utilisé pour l’excédent de trésorerie non nécessaire à court terme.

---

# Mix Tier A / Tier B — exemple simple

* **Règle courante (exemple) :** 70% Tier A + 30% Tier B
* **APY mixé (approx.) :**

  * Tier A 4.2% + Tier B 5.8% → mix 70/30 → **~4.7% APY pondéré**
* **Pourquoi :** combine sécurité (liquidité) et optimisation de rendement.

---

# Pour la démo (clé à communiquer simplement)

* **On fera LES DEUX :**

  * **Vraies transactions testnet (REAL)** : on mettra 10 USDC (ou ce qu’on obtient via faucet) pour prouver l’intégration (tx on-chain visible).

    * *Attention :* sur 10 USDC et quelques jours, le rendement réel sera **très petit** (quelques cents).
  * **Simulation / extrapolation (SIMULATED)** : pour montrer l’impact business, on simule un montant industriel (ex : $1.65M) en appliquant les APY réels (4.2% / 5.8%) et on montre le yield projeté.

    * *Important :* la simulation doit être honnête — afficher le taux utilisé et indiquer “EXTRAPOLATION”.

---

# Ce qu’on montrera aux juges (ligne claire)

1. **Preuve technique réelle :** txs testnet (deposit → protocol) — prouve le pipeline.
2. **Petit rendement réel :** on montre le centime gagné (preuve).
3. **Projection honnête :** on affiche combien ça ferait sur $1M+ (formule simple : principal × APY).
4. **Etiquettes claires :** chaque position visible doit porter `REAL` ou `SIMULATED/EXTRAPOLATION`.

---

# Messages courts à utiliser (pendant la démo)

* “Tier A = safe (≈4% APY). Tier B = higher yield (≈5–7% APY).”
* “Nous effectuons une vraie tx sur testnet (voici le hash). Le rendement réel sur 10 USDC est minime — normal. Maintenant on montre une **extrapolation honnête** sur $1M à ces APY.”
* “UI : REAL vs SIMULATED clairement indiqués.”

---

# Rappel technique ultra-léger pour les devs

* **Tier A action real** → appeler le protocole “safe” (ou mock si indisponible).
* **Tier B action real** → appeler Aave/Compound supply (si dispo en testnet).
* **Simulation** → appliquer APY journalier composé off-chain :
  `earned = P * ((1 + apy/365)**days - 1)` → afficher résultat.

