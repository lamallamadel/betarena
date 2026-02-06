# SFD : Module N - Le "Mode Imaginaire" (Blitz 5)

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Offrir une expérience "Arcade" et rapide (Daily Fantasy Sports). Permettre aux nouveaux joueurs sans budget de jouer avec des stars et de gagner des Coins immédiatement, sans attendre la fin de la saison.
* **Pour qui ?** Joueur Casual, Utilisateur sans effectif (Rookie), Chercheur d'adrénaline.

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-N1** | **Inscription Tournoi (Pay-to-Play)**<br>En tant que joueur, je veux payer un ticket d'entrée (100 Coins) pour rejoindre un Blitz spécifique (ex: "Soirée LDC"). | Débit immédiat. Alimentation du "Prize Pool". |
| **US-N2** | **Draft Simplifiée**<br>En tant que joueur, je veux choisir mes 5 titulaires parmi une sélection restreinte et aléatoire de 15 cartes proposées par le système. | Génération RNG d'un pool équilibré (5 Or / 5 Argent / 5 Bronze). |
| **US-N3** | **Contrainte Tactique**<br>En tant que joueur, je dois respecter la formation imposée (1 GB, 1 DEF, 2 MIL, 1 ATT) pour valider mon équipe. | Validation bloquante si la structure n'est pas respectée. |
| **US-N4** | **Classement Live & Gains**<br>En tant que participant, je veux voir ma position en temps réel et recevoir ma part du pot si je finis dans les places payées. | Leaderboard dynamique. Distribution automatique post-match. |

---

### 3. Maquettes / UI (Description Textuelle)

**Lobby Blitz (Liste des tournois)**
* **Cartes Tournois :**
    * Titre : "Spécial Ligue des Champions - Mardi".
    * Timer : "Ferme dans 02h 14m".
    * Entrée : "100 Coins".
    * Participants : "452 / Illimité".
    * Pot actuel : "40 500 Coins".
* **Action :** Bouton "Participer (100)".

**Interface de Draft (Sélecteur)**
* **Header :** Formation requise (1 GB - 1 DEF - 2 MIL - 1 ATT).
* **Zone de Sélection (Le Pool) :**
    * Affichage de 15 Cartes faces visibles.
    * Triées par rareté : 5 Or (Stars), 5 Argent (Bons titulaires), 5 Bronze (Pépites/Risques).
* **Zone d'Équipe (My Squad) :**
    * 5 emplacements vides.
    * Clic sur une carte du pool -> Remplit le slot correspondant.
* **Footer :** Bouton "Valider l'équipe" (Actif uniquement si 5/5 slots remplis).

**Résultat Blitz**
* Leaderboard simple : Rang | Pseudo | Points | Gain Estimé.

---

### 4. Flux Fonctionnels

#### A. Inscription & Génération du Pool
1.  L'utilisateur clique sur "Participer".
2.  **Système :** Vérifie solde >= 100. Débite 100 Coins. Ajoute 90 Coins au Pot (10% Rake/Commission).
3.  **Système (RNG) :** Génère une liste temporaire de 15 joueurs *jouant ce soir-là*.
    * Sélectionne 5 joueurs `High Tier` (Or).
    * Sélectionne 5 joueurs `Mid Tier` (Argent).
    * Sélectionne 5 joueurs `Low Tier` (Bronze).
4.  L'utilisateur accède à l'écran de Draft.

#### B. Sélection de l'Équipe (Draft)
1.  L'utilisateur tape sur "Mbappé (Or)". -> Slot ATT rempli.
2.  L'utilisateur tape sur "Donnarumma (Or)". -> Slot GB rempli.
3.  L'utilisateur doit choisir des Silver/Bronze pour les autres postes (stratégie).
4.  Validation de l'équipe. Sauvegarde dans `blitz_entries`.

#### C. Résolution (Fin de soirée)
1.  Tous les matchs du tournoi sont finis.
2.  Le moteur de scoring (identique au Module M) calcule les points des 5 joueurs.
3.  Classement de tous les participants par Score Total décroissant.
4.  **Distribution :**
    * Le Top 10% (ou le Top 1, selon config) se partage le Pot.
    * Crédit des gains.
5.  Les équipes Blitz sont détruites (Éphémère).

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-N01** | **Éphémère (Consommable)** | Les cartes utilisées dans le mode Blitz ne sont PAS possédées par le joueur. Elles sont prêtées le temps du tournoi. Cela n'impacte pas l'inventaire du Module L. |
| **RG-N02** | **Structure du Pool** | Le système doit garantir que dans les 15 cartes proposées, il y a au moins : 2 Gardiens, 2 Défenseurs, 4 Milieux, 2 Attaquants (pour que la formation 1-1-2-1 soit réalisable). |
| **RG-N03** | **Commission (Rake)** | Pour éviter l'inflation des Coins, le système prélève une commission sur chaque ticket d'entrée (ex: 10%). Si 100 joueurs paient 100 Coins, le Pot est de 9000 Coins (et non 10 000). |
| **RG-N04** | **Formation Fixe** | Le Blitz 5 impose une formation unique : 1 Gardien + 1 Défenseur + 2 Milieux + 1 Attaquant. Aucune autre tactique n'est possible pour simplifier la comparaison. |
| **RG-N05** | **Tie-Break (Égalité)** | En cas d'égalité de points entre deux participants, celui qui a validé son équipe le plus tôt (Timestamp `created_at`) l'emporte. |

---

### 6. Données & Technique

**Table `blitz_tournaments`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `name` | VARCHAR | "UCL Tuesday Night". |
| `start_time` | TIMESTAMP | Début des matchs. |
| `entry_fee` | INT | Coût (100). |
| `prize_pool` | INT | Somme cumulée dynamique. |
| `status` | ENUM | `OPEN`, `LIVE`, `COMPLETED`. |

**Table `blitz_entries`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `tournament_id` | UUID | FK. |
| `user_id` | UUID | FK. |
| `draft_pool` | JSON | Liste des 15 IDs proposés (Audit). |
| `selected_lineup` | JSON | Liste des 5 IDs choisis. |
| `total_score` | INT | Score final. |
| `rank` | INT | Position finale. |
| `win_amount` | INT | Gain reçu. |

---

### 7. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Inscription avec solde insuffisant
  Given J'ai 50 Coins
  When Je tente de rejoindre le Blitz à 100 Coins
  Then L'accès est refusé
  And Une modale me propose d'acheter des Coins ou de parier pour en gagner

Scenario: Draft invalide
  Given J'ai sélectionné 1 Gardien et 4 Attaquants
  When Je clique sur "Valider"
  Then Le système bloque (Erreur : "Il faut 2 Milieux et 1 Défenseur")

Scenario: Victoire et Partage du Pot
  Given Il y a 10 participants (Pot total = 900 Coins après taxe)
  And Je finis 1er avec 45 points
  When Le tournoi se termine
  Then Je reçois la part du vainqueur (ex: 50% du pot = 450 Coins)
  And Une notification "Félicitations ! Vous avez gagné le Blitz" est envoyée
```
---

### 8. Diagramme de Séquence (Flux Draft)
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App
    participant API
    participant Wallet
    participant Engine as Draft Engine

    User->>App: Clic "Rejoindre Blitz" (100 Coins)
    App->>API: POST /blitz/{id}/join
    
    API->>Wallet: Check & Debit 100 Coins
    Wallet-->>API: OK (Balance updated)
    
    API->>Engine: Generate Random Pool (15 Players)
    Note right of Engine: Select 5 Gold, 5 Silver, 5 Bronze<br/>Ensure positional coverage
    Engine-->>API: Pool IDs
    
    API->>API: Create Entry (Status: DRAFTING)
    API-->>App: Return Pool List
    
    User->>App: Select 5 Players
    App->>API: POST /blitz/{id}/submit_lineup
    
    API->>API: Validate Formation (1-1-2-1)
    API->>API: Validate Players in Pool (Anti-Cheat)
    API-->>App: Success "Équipe validée !"