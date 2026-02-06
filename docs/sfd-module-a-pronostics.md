# SFD : Module A Pronostics Sportifs (1N2 & Score Exact)

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Gamifier l'expérience utilisateur en permettant de miser de la monnaie virtuelle ("Coins") sur les matchs. Le système doit supporter deux modèles de gains (Cotes Fixes et Pari Mutuel) pour maximiser l'engagement.
* **Pour qui ?** Utilisateur Connecté (Joueur).

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-01** | **Parier sur le Vainqueur (1N2)**<br>En tant que joueur, je veux miser sur l'issue du match avant le coup d'envoi. | Validation impossible après Kickoff. Calcul du gain potentiel affiché. |
| **US-02** | **Parier sur le Score Exact (Live)**<br>En tant que joueur, je veux prédire le score final et pouvoir **modifier mon pronostic et ma mise** jusqu'au début de la 2ème mi-temps. | Modification = Remboursement ancienne mise + Débit nouvelle mise. |
| **US-03** | **Visualiser la Tendance**<br>En tant que joueur, je veux voir la répartition des votes (%) sans voir le détail des choix des autres avant le match. | Données agrégées anonymes. |

---

### 3. Maquettes / UI (Description Textuelle)

**Composant : Carte de Pronostic (Match Detail)**

1.  **Sélecteur de Mode (Tabs) :**
    * Onglet [Vainqueur du Match] (Actif par défaut).
    * Onglet [Score Exact].

2.  **Affichage des Gains (Dynamique selon paramétrage match) :**
    * *Si Cotes Fixes :* Affiche le multiplicateur (ex: "x 1.50").
    * *Si Pari Mutuel :* Affiche "Gain estimé" ou la répartition du pool.

3.  **Zone de Saisie (Input) :**
    * **1N2 :** 3 Boutons "Radio" (Domicile / Nul / Extérieur).
    * **Score Exact :** Deux steppers numériques [ 0 ] - [ 0 ].
    * **Mise (Stake) :** Champ numérique éditable. Affiche le solde disponible à côté.

4.  **Actions :**
    * Bouton Primaire : "Valider (Montant Coins)".
    * *Si déjà parié :* Le bouton devient "Mettre à jour le pari".
    * *Si verrouillé :* Bouton gris "Les paris sont fermés".

5.  **Feedback Visuel :**
    * Barre de tendance (Progress Bar) : % Domicile (Bleu) / % Nul (Gris) / % Extérieur (Rouge).

---

### 4. Flux Fonctionnels

#### A. Cas Nominal : Création d'un pronostic (1N2 ou Score)
1.  L'utilisateur sélectionne une issue et saisit une mise (ex: 100 Coins).
2.  Le système calcule le **Gain Potentiel** (Mise * Cote ou Estimation Pool).
3.  L'utilisateur clique sur "Valider".
4.  Le système vérifie `Solde Utilisateur >= Mise`.
5.  Le système **débite** les 100 Coins.
6.  Le système enregistre le pari.
7.  Notification : "Pari validé !".

#### B. Cas Nominal : Modification d'un pronostic (Score Exact - Live)
*Contexte : L'utilisateur a déjà misé 100 Coins sur "1-0". Il veut changer pour "2-1" avec une mise de 150 Coins.*
1.  L'utilisateur change le score et le montant de la mise.
2.  Clic sur "Mettre à jour".
3.  Le système vérifie que le match est toujours éligible (avant 2ème MT).
4.  **Transaction Atomique :**
    * Remboursement de l'ancienne mise (+100 Coins).
    * Vérification du nouveau solde total.
    * Débit de la nouvelle mise (-150 Coins).
5.  Mise à jour de l'enregistrement en base.

#### C. Cas d'Erreur & Limites
* **Solde Insuffisant (Lors de l'update) :** Si l'utilisateur augmente sa mise mais n'a pas les fonds (même après remboursement théorique), l'action est bloquée. Message : "Solde insuffisant pour cette mise".
* **Conflit Temporel :** L'utilisateur tente de valider un 1N2 à 20h00m01s alors que le match (Kickoff) était à 20h00m00s.
    * Action : Rejet API (403 Forbidden).
    * UI : Rafraîchissement de la page et verrouillage des inputs.

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-01** | **Deadlines de Validation** | **1N2 :** Strictement avant `kickoff_timestamp`.<br>**Score Exact :** Strictement avant le début de la 2ème mi-temps (`match_status != 2ND_HALF` ET `minutes < 46`). |
| **RG-02** | **Gestion Financière (Update)** | Toute modification entraîne une opération comptable : `Remboursement(Mise_N-1)` puis `Débit(Mise_N)`. Le solde ne doit jamais être négatif. |
| **RG-03** | **Coexistence des Paris** | Un utilisateur peut avoir **1 pari de type 1N2** ET **1 pari de type Score Exact** sur le même match (cumul autorisé). |
| **RG-04** | **Unicité par Type** | Impossible d'avoir deux pronostics 1N2 sur le même match. Une nouvelle validation **écrase** la précédente (Update) au lieu de créer une nouvelle ligne. |
| **RG-05** | **Système de Gains (Hybride)** | Le système doit gérer le calcul du gain selon la config du match :<br>- **Fixed Odds :** `Gain = Mise * Cote_au_moment_validation`.<br>- **Pool :** `Gain = (Mise / Total_Mises_Gagnantes) * Total_Pool`. |
| **RG-06** | **Annulation Match** | Si le match est annulé ou reporté > 24h, un script batch doit rembourser toutes les mises (Status `REFUNDED`). |

---

### 6. Données & Technique

**Modèle de données cible (Table `predictions`)**

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Clé primaire. |
| `user_id` | UUID | FK vers User. |
| `match_id` | UUID | FK vers Match. |
| `bet_type` | ENUM | `1N2`, `EXACT_SCORE`. |
| `selection` | JSON | Ex: `{"outcome": "1"}` ou `{"home": 2, "away": 1}`. |
| `stake_amount` | DECIMAL | Montant de la mise (Coins). |
| `odds_at_placement`| DECIMAL | Nullable. Valeur de la cote au moment du pari (si mode Fixe). |
| `status` | ENUM | `ACTIVE`, `WON`, `LOST`, `REFUNDED`. |
| `created_at` | DATETIME | |

**Contrainte d'Unicité BDD :**
`UNIQUE INDEX idx_user_match_type (user_id, match_id, bet_type)`

---

### 7. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Modification de mise sur Score Exact avec solde limite
  Given J'ai parié 100 Coins sur le score "1-0" (Mon solde actuel est 0)
  And Le match est à la mi-temps (Modification autorisée)
  When Je modifie mon pari pour le score "2-0" avec une mise de 150 Coins
  Then Le système refuse la transaction (Erreur "Solde insuffisant")
  # Explication : Remboursement 100 -> Solde 100. Besoin 150. Manque 50.

Scenario: Modification de mise sur Score Exact réussie
  Given J'ai parié 100 Coins sur le score "1-0" (Mon solde actuel est 50)
  And Le match est à la mi-temps
  When Je modifie mon pari pour le score "2-0" avec une mise de 120 Coins
  Then Le système accepte la transaction
  And Mon nouveau solde est de 30 Coins
  # Calcul : Solde initial (50) + Remboursement (100) - Nouvelle Mise (120) = 30.

```
```mermaid
sequenceDiagram
    autonumber
    actor User as Joueur
    participant API as Backend API
    participant Wallet as Service Wallet
    participant DB as Base de Données

    Note over User, DB: Scénario : Modification d'un score exact (Mise 100 -> Mise 150)

    User->>API: POST /predict (MatchID, Score="2-1", Mise=150)
    
    rect rgb(30, 30, 30)
        Note right of API: Début Transaction Atomique
        API->>DB: Récupérer ancien pari (Mise=100)
        
        par Remboursement théorique
            API->>Wallet: Créditer(User, 100)
        and Vérification Solde
            Wallet-->>API: Nouveau Solde calculé
        end
        
        alt Solde < 150
            API->>Wallet: Rollback (Annuler crédit)
            API-->>User: Erreur 400 "Fonds insuffisants"
        else Solde >= 150
            API->>Wallet: Débiter(User, 150)
            API->>DB: UPDATE predictions SET score="2-1", mise=150
            
            Note right of API: Commit Transaction
            API-->>User: Succès 200 "Pari modifié"
        end
    end