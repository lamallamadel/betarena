# SFD : Module M - Gestion d'Équipe (Ultimate Fantazia)

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** C'est le cœur du gameplay "Saisonnier". Contrairement aux paris ponctuels, ce mode valorise la stratégie à long terme, la connaissance des effectifs réels et la gestion d'actifs (cartes).
* **Pour qui ?** Manager (Utilisateur possédant des cartes).

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-M1** | **Composition Tactique**<br>En tant que Manager, je veux placer mes joueurs sur un terrain virtuel selon une formation (ex: 4-3-3) avant le début de la journée. | Drag & Drop fluide. Validation de position (Gardien dans les buts). |
| **US-M2** | **Banc de Touche & Remplacements**<br>En tant que Manager, je veux définir un banc de remplaçants ordonné qui entrera en jeu automatiquement si un titulaire ne joue pas. | Priorité 1, 2, 3. Remplacement poste pour poste si possible. |
| **US-M3** | **Deadline (Lock)**<br>En tant que Manager, je veux voir un compte à rebours clair avant la validation de mon équipe pour ne pas rater l'échéance. | Équipe figée (Read-only) après la deadline. |
| **US-M4** | **Récompenses (Yield)**<br>En tant que Manager, je veux gagner des Coins et de l'XP chaque semaine en fonction de la performance réelle de mes joueurs. | Calcul batch le Lundi matin. Crédit automatique. |

---

### 3. Maquettes / UI (Description Textuelle)

**Vue "Mon Équipe" (Terrain)**
* **Header :** Gameweek actuelle (ex: "GW 12 - Deadline : Ven 19h00").
* **Sélecteur de Formation :** Dropdown (4-4-2, 4-3-3, 3-5-2, 5-3-2, etc.).
* **Le Terrain (Pitch) :**
    * 11 Slots titulaires positionnés graphiquement.
    * Chaque slot affiche la carte du joueur (Photo, Nom, Club, Indicateur de forme/blessure).
    * *Action :* Tap sur un slot -> Ouvre la liste des joueurs disponibles à ce poste dans l'inventaire.
* **Le Banc (Bench) :**
    * 4 Slots (1 Gardien + 3 Joueurs de champ).
    * Ordre de priorité visuel (1, 2, 3).
* **Footer :** Bouton "Sauvegarder l'équipe" (Grise si équipe incomplète).

**Vue Résultat (Lundi)**
* Affichage du même terrain avec les points gagnés sous chaque joueur (ex: "Mbappé : 12 pts").
* Total Points de la semaine.
* Gain en Coins associé.

---

### 4. Flux Fonctionnels

#### A. Construction de l'Équipe (Semaine)
1.  L'utilisateur ouvre le module "Team".
2.  Il sélectionne une formation (ex: 4-3-3).
3.  Il remplit les slots avec les cartes de son inventaire (Module L).
4.  Le système vérifie la validité (1 Gardien, Pas de doublons, Joueurs possédés).
5.  L'utilisateur sauvegarde.
6.  *État :* `DRAFT` -> `SAVED`.

#### B. Verrouillage (Deadline - Vendredi Soir)
1.  Le Cron Job "Gameweek Lock" s'exécute à l'heure H.
2.  Toutes les équipes `SAVED` sont clonées dans une table d'historique `gameweek_lineups` (Snapshot).
3.  L'interface passe en lecture seule pour la Gameweek en cours.
4.  Les modifications ne sont plus prises en compte pour cette journée (mais comptent pour la suivante).

#### C. Résolution & Scoring (Lundi Matin)
1.  Le système ingère les stats finales des matchs réels via le Provider.
2.  Calcul des points individuels pour chaque joueur réel.
3.  **Algorithme de Remplacement Auto :**
    * Pour chaque équipe utilisateur :
    * Si Titulaire.MinutesJouées == 0 :
    * Vérifier Remplaçant #1. Si Remplaçant.MinutesJouées > 0 et Poste Compatible -> Swap.
    * Sinon vérifier Remplaçant #2, etc.
4.  Somme des points de l'équipe finale.
5.  Distribution des récompenses (Coins/XP).

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-M01** | **Barème de Points** | - **Présence :** > 60 min = +2 pts.<br>- **But :** Attaquant (+4), Milieu (+5), Défenseur (+6), Gardien (+6).<br>- **Passe Dé :** +3 pts (Tout poste).<br>- **Clean Sheet :** Défenseur/Gardien (+4) si joue > 60 min et 0 but encaissé.<br>- **Malus :** Jaune (-1), Rouge (-3), But encaissé (-1 pour le gardien/déf tous les 2 buts). |
| **RG-M02** | **Contraintes de Formation** | Une équipe valide doit comporter au minimum : 1 Gardien, 3 Défenseurs, 1 Attaquant. Formations exotiques (ex: 2-5-3) interdites. |
| **RG-M03** | **Remplacement Tactique** | Un remplaçant n'entre en jeu que si le titulaire a joué **0 minute**. Si le titulaire joue 1 minute et sort blessé, il garde ses points (probablement 1 pt) et le remplaçant ne rentre pas. |
| **RG-M04** | **Propriété des Cartes** | Un joueur ne peut être aligné que s'il est présent dans l'inventaire de l'utilisateur au moment du "Lock". Si la carte est vendue (Module L) entre le moment de la compo et le Lock, elle est retirée de l'équipe automatiquement. |

---

### 6. Données & Technique

**Table `gameweeks`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `number` | INT | Numéro de la journée (ex: 12). |
| `deadline_at` | TIMESTAMP | Date de verrouillage. |
| `status` | ENUM | `OPEN`, `LIVE`, `FINISHED`. |

**Table `lineups`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK User. |
| `gameweek_id` | UUID | FK Gameweek. |
| `formation` | VARCHAR | "4-3-3". |
| `captain_id` | UUID | FK Card (Points x2 - Optionnel). |
| `score_total` | INT | Calculé après matchs. |

**Table `lineup_players`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `lineup_id` | UUID | FK Lineup. |
| `card_id` | UUID | FK Card. |
| `position_slot` | INT | 1-11 (Titu), 12-15 (Banc). |
| `is_subbed_in` | BOOL | True si entré en jeu par l'algo. |

---

### 7. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Validation d'équipe incomplète
  Given J'ai aligné 10 joueurs sur 11
  When Je clique sur "Sauvegarder"
  Then Le système affiche une erreur "Votre équipe doit contenir 11 titulaires"

Scenario: Remplacement Automatique
  Given J'ai aligné "Mbappé" titulaire et "Giroud" remplaçant #1
  And "Mbappé" n'a pas joué le match (Blessé, 0 min)
  And "Giroud" a joué 80 minutes et marqué 1 but
  When Le calcul des points s'exécute le Lundi
  Then "Mbappé" est remplacé par "Giroud" dans mon équipe active
  And Je reçois les points de "Giroud"

Scenario: Score Clean Sheet
  Given J'ai aligné un défenseur du PSG
  And Le PSG gagne 2-0
  And Le défenseur a joué 90 minutes
  When Le score est calculé
  Then Le défenseur reçoit +2 pts (Temps de jeu) + 4 pts (Clean Sheet) = 6 pts
```
---
### 8. Diagramme de Séquence (Flux Scoring)
```mermaid
sequenceDiagram
    autonumber
    participant Provider as Data Provider (Opta)
    participant Cron as Game Engine
    participant DB as Database
    participant Wallet as Wallet Service

    Note over Provider, Wallet: Lundi Matin - Traitement Batch

    Cron->>Provider: GET /fixtures/stats (Tous les matchs du WE)
    Provider-->>Cron: JSON (Minutes, Buts, Cartons...)

    Cron->>DB: Fetch All Lineups (Gameweek Current)
    
    loop Pour chaque Lineup Utilisateur
        Cron->>Cron: Calculate Raw Points (Titulaires)
        
        opt Si un Titulaire a 0 min
            Cron->>Cron: Check Bench & Apply Substitution
        end
        
        Cron->>Cron: Sum Total Points
        Cron->>DB: UPDATE lineups SET score_total = X
        
        alt Si Score > Seuil Récompense
            Cron->>Wallet: Créditer User (Coins + XP)
        end
    end

    Cron->>DB: Update Gameweek Status -> FINISHED