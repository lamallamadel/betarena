# SFD : Module I - Classements & Stats (Real Standings)

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Donner les clés à l'utilisateur pour analyser la forme des équipes avant de parier.
* **Pour qui ?** Parieur / Analyste.

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-I1** | **Analyse de Forme**<br>En tant que parieur, je veux voir les 5 derniers résultats d'une équipe pour juger de sa dynamique actuelle. | Affichage graphique (Pastilles). Sens de lecture adapté (Récent à Gauche). |
| **US-I2** | **Filtres Domicile/Extérieur**<br>En tant qu'analyste, je veux filtrer le classement pour voir uniquement les performances à domicile ou à l'extérieur. | Système d'onglets instantané. |
| **US-I3** | **Zones Qualificatives**<br>En tant qu'utilisateur, je veux identifier visuellement qui va en Ligue des Champions ou qui descend. | Codes couleurs sur les rangs (1-4 Bleu, 18-20 Rouge). |
| **US-I4** | **Règles de Tri Spécifiques**<br>En tant qu'expert, je veux que le classement respecte les règles officielles de la ligue (Différence de buts vs Confrontations directes). | Utilisation de l'ordre fourni par le Provider (qui gère la complexité). |

---

### 3. Maquettes / UI (Description Textuelle)

**Fiche Compétition > Onglet "Classement"**

1.  **Filtres (Tabs) :**
    * [Général] | [Domicile] | [Extérieur] | [Forme]

2.  **Tableau de Données (Liste Verticale) :**
    * **En-tête :** `#`, `Équipe`, `MJ`, `Diff`, `Pts`, `Forme`.
    * **Ligne Équipe :**
        * **Col 1 (Rang) :** Chiffre sur fond coloré (Bleu=LDC, Orange=Europa, Rouge=Descente, Gris=Ventre mou).
        * **Col 2 (Identité) :** Petit Logo + Nom court (ex: "Man. City").
        * **Col 3 (Stats) :** `MJ` (Joués), `Diff` (+/-), **`Pts`** (Gras).
        * **Col 4 (Forme) :** 5 petites pastilles rondes.
            * *Vert* (V), *Gris* (N), *Rouge* (D).
            * **Ordre LTR (Français/Anglais) :** `[Récent] O O O O O [Ancien]`.
            * **Ordre RTL (Arabe - Futur) :** `[Ancien] O O O O O [Récent]`.

3.  **Légende (Bas de page) :**
    * 🔵 Qualification LDC
    * 🔴 Relégation

---

### 4. Flux Fonctionnels

#### A. Synchronisation des Classements
1.  **Backend (Cron/Webhook) :** Récupère les données de classement via l'API Provider (`GET /standings`).
2.  **Traitement :**
    * Stockage du JSON brut (incluant le rang calculé par le provider).
    * Mapping des "Descriptions" (ex: "Promotion - Champions League") vers des codes couleurs internes (`CHAMPIONS_LEAGUE`, `RELEGATION`).
3.  **Frontend :** Affiche les données stockées.

#### B. Mise à jour Live (Pendant les matchs)
1.  Si le Provider supporte les "Live Standings", le backend met à jour la table en temps réel lors des événements de match.
2.  Sinon, le classement est mis à jour uniquement au statut `FINISHED` des matchs.

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-I01** | **Source de Vérité (Tri)** | L'application ne recalcule PAS le classement complexe (Head-to-Head vs Goal Diff) en interne. Elle fait confiance à l'ordre (`rank`) envoyé par le Provider API, qui intègre les règles spécifiques de chaque compétition (Liga, Premier League, etc.). |
| **RG-I02** | **Visualisation de la Forme** | La chaîne de caractères de forme (ex: "WWDLW") doit être parsée.<br>- **W** (Win) -> Vert.<br>- **D** (Draw) -> Gris.<br>- **L** (Loss) -> Rouge.<br>**Sens de lecture :** Le caractère le plus à gauche de la chaîne API correspond au match le plus récent. |
| **RG-I03** | **Code Couleur (Promotion/Relégation)** | Le système doit mapper dynamiquement les zones selon la compétition :<br>- Premier League : 1-4 (LDC), 5 (Europa), 18-20 (Descente).<br>- Ligue 1 : Règles spécifiques (Barrages).<br>Ces règles sont configurables dans le Back-Office Admin ou déduites du champ `description` de l'API. |
| **RG-I04** | **Internationalisation (i18n)** | L'UI doit supporter le "Mirroring" pour la langue Arabe. La colonne "Équipe" passe à droite, et l'ordre des pastilles de forme est inversé visuellement. |

---

### 6. Données & Technique

**Modèle de Données : `standings`**

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `competition_id` | UUID | FK. |
| `season` | INT | Ex: 2023. |
| `type` | ENUM | `TOTAL`, `HOME`, `AWAY`. |
| `rank` | INT | Position (1 à 20). |
| `team_id` | UUID | FK. |
| `points` | INT | |
| `goals_diff` | INT | |
| `form` | VARCHAR | Ex: "WWLDD". |
| `status_code` | VARCHAR | Ex: `PROMOTION_CL`, `RELEGATION`. |
| `updated_at` | TIMESTAMP | |

**API Endpoint : `GET /api/v1/competitions/{id}/standings`**
* Retourne un JSON structuré contenant les 3 tables (Total, Home, Away) pour éviter de multiples appels.

---

### 7. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Affichage de la Forme (LTR)
  Given L'équipe "Arsenal" a les résultats récents : Gagné, Gagné, Nul, Perdu, Gagné
  When J'affiche le classement en Français
  Then Je vois les pastilles de gauche à droite : Vert, Vert, Gris, Rouge, Vert

Scenario: Tri spécifique Liga (Confrontation directe)
  Given Le Real Madrid et le Barça ont le même nombre de points
  And Le Barça a une meilleure différence de buts générale
  But Le Real a gagné les confrontations directes (Règle Liga)
  When Je consulte le classement
  Then Le Real Madrid est classé DEVANT le Barça (Respect de l'ordre Provider)

Scenario: Filtre Domicile
  Given Je suis sur le classement général
  When Je clique sur l'onglet "Domicile"
  Then Le tableau se rafraîchit
  And Je ne vois que les points et buts acquis lors des matchs à domicile
```
---

```ascii
+--------------------------------------------------+
|  LIGUE 1 (France)                                |
|  [Général]   Domicile   Extérieur                |
+--------------------------------------------------+
| #  | Équipe       | MJ | +/- | Pts | Forme       |
+--------------------------------------------------+
| 1  | PSG          | 12 | +25 | 34  | 🟢🟢🟢⚪🔴 |  <-- (Récent à gauche)
| 2  | Monaco       | 12 | +12 | 28  | 🟢🔴🟢🟢⚪ |
| ...|              |    |     |     |             |
| 17 | Nantes       | 12 | -8  | 10  | 🔴🔴⚪🔴🔴 |
| 18 | Metz         | 12 | -14 | 8   | 🔴🔴🔴🔴🔴 |
+--------------------------------------------------+
Legende: 🔵 LDC  🔴 Relégation
