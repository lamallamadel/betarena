# 🧬 GENIUS PROTOCOL (V1) - Master Spec
**Date:** 09/02/2026
**Statut:** Validé pour Prod
**Module:** Cross-System (Career ↔ Gaming ↔ Market)

## 1. Vision Stratégique
Transformer l'optimisation de carrière (corvée) en avantage compétitif (jeu).
Le but est de créer une boucle virale :
1.  **Work:** L'utilisateur améliore son CV (Data réelle).
2.  **Earn:** Il gagne un accès à l'Oracle (Item "Scout Report").
3.  **Win:** L'Oracle lui donne un avantage d'information sur le marché des transferts.
4.  **Flex:** Sa victoire est notifiée à sa ligue, créant de la jalousie (FOMO).

---

## 2. Parcours Utilisateur (The Loop)

### Phase A : Le Sas (Career Module)
* **Acteur:** Imad (IA Sévère) & Wiam (IA Coach).
* **Trigger:** Upload CV.
* **Action:**
    1.  Imad critique le manque de métriques ("Runtime Error").
    2.  Bouton "Lancer la Contre-Attaque".
    3.  Wiam propose un template à trous ("J'ai généré X€ en Y temps").
* **Output:** CV Validé ("Green Build").

### Phase B : L'Injection (Inventory)
* **Récompense:** Loot Box contenant `consumable_scout_report_legendary`.
* **Visuel:** Un dossier "Top Secret" brillant dans l'inventaire.

### Phase C : L'Oracle (Genius Revelation)
* **Action:** Consommation de l'objet sur une cible (ex: Lamine Yamal).
* **Surchauffe:** Cooldown de 24h après usage (Mécanique de rareté).
* **Data:** L'IA révèle le "Shadow Rating" (Note cachée supérieure à la note publique).
* **Verdict:** "BUY NOW" (Rupture statistique imminente).

### Phase D : La Domination (Social)
* **Event:** Le joueur performe IRL.
* **Broadcast:** Notification envoyée à tous les rivaux de la ligue.
* **Message:** "FC [User] a utilisé Genius pour sniper ce joueur. Vous dormiez ?"

---

## 3. Architecture Technique

### A. Types de Données (`src/types/types.ts`)
```typescript
export interface UserProfile {
  genius_last_use?: number;       // Timestamp dernier usage
  genius_cooldown_end?: number;   // Fin de la surchauffe
}

export interface ScoutReport {
  id: string;
  type: 'BREAKOUT' | 'CEILING' | 'RISK';
  analysis: {
    visible_form: number;
    shadow_rating: number; // La "Vérité"
    volatility_index: number;
  };
  narrative: {
    headline: string;
    deep_dive: string;
    recommendation: 'BUY_NOW' | 'WATCHLIST';
  };
}
```
---

### B. Cloud Functions (functions/src/genius.ts & social.ts)
generateScoutReport:

Vérifie le cooldown.

Simule une analyse Monte Carlo (Mock pour V1).

Débite l'item de l'inventaire.

Met à jour le timestamp genius_cooldown_end.

broadcastGeniusVictory:

Trigger: Résolution de match avec gain > X%.

Action: Envoie une notif GENIUS_VICTORY à la collection users (membres de la ligue).

### C. Frontend Components
ScoutReportModal.tsx: Interface "Hacker/Terminal" affichant le gap entre note publique et shadow rating.

InventoryView.tsx: Gestion de l'onglet "Consommables" et du bouton d'activation (avec état de Surchauffe).

ProfileView.tsx: Affichage du badge "GENIUS" et accès au protocole si débloqué.

## 4. Règles Business (Game Design)
Rareté: L'objet ne s'obtient que par des actions à haute valeur (CV update, Parrainage, Victoire Ligue).

Régulation: Le Cooldown est strict (24h). Pas de "Pay-to-Skip" pour l'instant (évite le Pay-to-Win trop agressif).

Viralité: La notification de victoire est le moteur d'acquisition principal.
