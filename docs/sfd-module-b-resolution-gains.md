# SFD: Module B Moteur de Résolution des Gains & Leaderboards

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Automatiser la distribution des récompenses (Coins) et la mise à jour des classements sans intervention humaine. Le système doit supporter une forte charge (> 10 000 utilisateurs) lors des fins de matchs populaires.
* **Pour qui ?** Backend System (Worker), Administrateur.

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-01** | **Configuration des Règles**<br>En tant qu'Admin, je veux définir des stratégies de gains par compétition (ex: Coupe du Monde = Prolongations incluses). | Flexibilité du moteur de calcul. |
| **US-02** | **Résolution "Penalty Raté"**<br>En tant que Joueur, je gagne si le tireur désigné échoue, peu importe la raison (arrêt, poteau, hors cadre). | Agrégation des statuts API "Saved", "Missed", "Woodwork". |
| **US-03** | **Classement Scalable**<br>En tant que Système, je veux mettre à jour les classements de manière asynchrone pour ne pas bloquer la base de données. | Latence acceptée < 5 min pour > 10k utilisateurs. |
| **US-04** | **Départage au Mérite**<br>En tant que Joueur, si j'ai le même solde qu'un autre, je veux être mieux classé si j'ai trouvé plus de "Scores Exacts". | Règle de tri multi-critères. |

---

### 3. Flux Fonctionnels (Backend Process)

#### A. Trigger de Résolution (Fin de Match)
1.  **Réception du Webhook** ou Polling API Sport : Statut `MATCH_FINISHED`.
2.  **Verrouillage** définitif des paris (Sécurité anti-triche).
3.  **Récupération des résultats officiels :**
    * Score 90min.
    * Score Final (incluant Prolongations/TAB selon config).
    * Liste des événements "Penalty" (Tireur + Résultat).

#### B. Calcul & Distribution (Job Worker)
1.  Le système itère sur tous les paris `PENDING` liés au match.
2.  **Application des Règles :**
    * *1N2 :* Comparaison simple.
    * *Score Exact :* Comparaison stricte avec le score retenu.
    * *Penalty Raté :* Si Event(Penalty) pour le Joueur X a un résultat != "Goal" -> GAGNÉ.
3.  **Mise à jour Atomique :**
    * Passage du statut du pari à `WON` ou `LOST`.
    * Crédit du Wallet utilisateur (+ Gain).
    * Incrémentation du compteur personnel `correct_exact_scores` (si applicable).

#### C. Mise à jour Leaderboards (Process Asynchrone)
1.  Une fois la distribution terminée, un événement `LEADERBOARD_UPDATE_REQ` est publié.
2.  Le service de classement recalcule les positions (Batch ou Redis ZSET).
3.  **Scalabilité :** Si Charge > 10 000 users, passage en mode "Consistance Éventuelle" (Mise à jour du cache toutes les X minutes, pas de temps réel strict).

---

### 4. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-01** | **Scope Résultat** | Par défaut, le résultat pris en compte inclut **Prolongations + Tirs au but** (sauf configuration contraire par compétition). |
| **RG-02** | **Définition "Penalty Raté"** | Un penalty est considéré "Raté" si le ballon ne franchit pas la ligne de but. <br>Include : `Saved` (Arrêt), `Missed` (Hors cadre), `Woodwork` (Poteau/Barre). |
| **RG-03** | **Critères de Tri (Classement)** | Le classement est ordonné selon la priorité suivante :<br>1. **Solde de Coins** (Décroissant)<br>2. **Nombre de Scores Exacts justes** (Décroissant)<br>3. **Date d'inscription** (Croissant - Premier arrivé, premier servi). |
| **RG-04** | **Idempotence** | Le script de résolution doit pouvoir être relancé plusieurs fois sans créditer les utilisateurs en double. Vérification stricte du statut `PENDING` avant traitement. |
| **RG-05** | **Règle d'Annulation (Void)** | Si un joueur sur lequel on a parié "Rate son TAB" ne participe pas à la séance de tirs au but, le pari est **Remboursé** (Statut `VOID`). |

---

### 5. Données & Technique

**Table `leaderboard_snapshot` (Optimisation lecture)**

| Champ | Type | Description |
| :--- | :--- | :--- |
| `user_id` | UUID | FK User. |
| `season_id` | UUID | FK Saison (Nullable pour Global). |
| `total_coins` | DECIMAL | Critère de tri #1. |
| `exact_score_count` | INT | Critère de tri #2. |
| `rank` | INT | Position calculée. |
| `updated_at` | TIMESTAMP | Date du dernier recalcul. |

**Stack Recommandée (Performance)** :
* Utilisation de **Redis Sorted Sets** (ZSET) pour gérer le classement.
* Score ZSET composite pour gérer le tri secondaire nativement.

---

### 6. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Résolution Penalty Arrêté par le gardien
  Given J'ai parié que "Mbappé" raterait son tir au but
  When "Mbappé" tire et le gardien arrête le ballon (Statut API: "Saved")
  Then Mon pari est considéré comme GAGNANT (Car pas de but)
  And Mon solde est crédité

Scenario: Calcul du Classement avec égalité de coins
  Given User_A a 1000 Coins et 5 Scores Exacts trouvés
  And User_B a 1000 Coins et 2 Scores Exacts trouvés
  When Le leaderboard est mis à jour
  Then User_A est classé DEVANT User_B (Règle du mérite)

Scenario: Scalabilité de la mise à jour
  Given Il y a 50 000 utilisateurs actifs
  When Le match se termine
  Then Les gains sont distribués immédiatement (Priorité 1)
  But Le classement est mis à jour 2 minutes plus tard (Consistance éventuelle)

```

### 6. Diagramme de sequence (Mathematica)

```mermaid
sequenceDiagram
    autonumber
    participant Provider as API Sport (Webhook)
    participant Worker as Resolution Worker
    participant DB as PostgreSQL (Core)
    participant Redis as Redis (Leaderboard)
    participant Notif as Notification Service

    Note over Provider, Worker: 1. Déclenchement (Fin du Match)

    Provider->>Worker: POST /webhook/match-finished (MatchID, FinalScore, Events)
    activate Worker
    
    Worker->>DB: UPDATE matches SET status='FINISHED'
    
    Note over Worker, DB: 2. Verrouillage & Récupération
    
    Worker->>DB: SELECT * FROM predictions WHERE match_id=ID AND status='PENDING'
    DB-->>Worker: Liste des paris en attente

    Note over Worker, DB: 3. Boucle de Résolution (Batch)

    loop Pour chaque Pari
        Worker->>Worker: Comparer Pronostic vs Résultat Officiel
        
        alt Pari GAGNANT
            Worker->>DB: TRANSACTION START
            Worker->>DB: UPDATE predictions SET status='WON'
            Worker->>DB: UPDATE users SET coins = coins + Gain
            Worker->>DB: UPDATE users SET correct_exact_scores + 1 (si applicable)
            Worker->>DB: TRANSACTION COMMIT
            Worker->>Notif: Enqueue "Tu as gagné X coins !"
        else Pari PERDANT
            Worker->>DB: UPDATE predictions SET status='LOST'
        else Pari ANNULÉ (Ex: Joueur n'a pas tiré)
            Worker->>DB: TRANSACTION START
            Worker->>DB: UPDATE predictions SET status='VOID'
            Worker->>DB: UPDATE users SET coins = coins + Mise (Remboursement)
            Worker->>DB: TRANSACTION COMMIT
        end
    end

    Note over Worker, Redis: 4. Mise à jour Classement (Async)

    Worker->>Redis: ZADD leaderboard_season (Score=Coins, Member=UserID)
    Worker->>Redis: ZADD leaderboard_global (Score=Coins, Member=UserID)
    
    Note right of Redis: Utilisation de ZSET pour tri performant
    
    deactivate Worker