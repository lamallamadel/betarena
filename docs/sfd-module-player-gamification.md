# SFD : Module Player Flow, Gamification & Économie

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Maximiser la "Life Time Value" (LTV). Le parrainage gère l'acquisition, le leveling gère la rétention, et la boutique sert de puits de dépense (Sink) pour contrôler l'inflation.
* **Pour qui ?** Nouvel inscrit (Onboarding) et Joueur récurrent (Progression).

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-01** | **Parrainage Sécurisé**<br>En tant que nouvel inscrit, je veux utiliser un code parrain. Le bonus ne doit se débloquer que si je suis un vrai joueur. | Validation du bonus au 1er pari du filleul (Anti-Bot). |
| **US-02** | **Progression (Leveling)**<br>En tant que joueur, je veux gagner de l'XP à chaque action pour monter de niveau et montrer mon expertise. | Courbe de difficulté exponentielle. |
| **US-03** | **Personnalisation**<br>En tant que joueur, je veux dépenser mes coins pour acheter et équiper un Avatar ET un Cadre simultanément. | Gestion des slots d'équipement distincts. |
| **US-04** | **Bonus Quotidien (Rétention)**<br>En tant que joueur fauché (ou non), je veux recevoir un cadeau de coins chaque jour à ma première connexion. | Reset à 00:00 UTC. Pop-up de réclamation. |

---

### 3. Maquettes / UI (Description Textuelle)

**Page Profil ("Mon Vestiaire")**
* **Header Personnalisable :**
    * Zone centrale : Avatar (Image) superposé par le Cadre (Bordure).
    * Sous le pseudo : Titre honorifique (ex: "Expert Liga").
* **Jauge de Niveau :** Barre de progression fluide (`CurrentXP` / `NextLevelThreshold`).
* **KPIs :** Solde Coins | Total Paris | Winrate %.
* **Inventaire Rapide :** Grille des items possédés. Un clic ouvre le menu "Équiper".

**Boutique (Shop)**
* **Onglets :** "Avatars", "Cadres", "Titres".
* **Carte Item :**
    * Visuel de l'objet.
    * Prix (en Coins) ou mention "Acheté".
    * *État Verrouillé :* Cadenas + "Niv. 10 Requis".
    * *État Possédé :* Bouton "Équiper".

**Pop-up Daily Bonus**
* Apparaît à la première ouverture de l'app de la journée.
* Visuel : Coffre qui s'ouvre.
* Action : Bouton "Réclamer +100 Coins".

---

### 4. Flux Fonctionnels

#### A. Inscription & Parrainage (Sécurisé)
1.  **Inscription :** User A (Filleul) s'inscrit avec le code de User B (Parrain).
2.  **Liaison :** Le système enregistre `referred_by = User_B` dans le profil de A, mais le statut du bonus est `PENDING`.
3.  **Activation :** User A valide son **premier pronostic**.
4.  **Transaction :**
    * User A reçoit son Bonus Bienvenue (+500) + Bonus Filleul (+200).
    * User B reçoit son Bonus Parrain (+200).
    * Notification Push pour B : "Votre filleul a joué ! +200 Coins pour vous."

#### B. Gestion du Level Up
1.  L'utilisateur effectue une action rémunératrice (ex: Pronostic Gagnant).
2.  Le système calcule : `NewXP = CurrentXP + ActionXP`.
3.  **Check Level Up :**
    * Le système récupère le seuil du niveau suivant : $Seuil = 100 \times (CurrentLevel)^{1.5}$.
    * Si `NewXP >= Seuil` :
        * `Level = Level + 1`.
        * Affichage Modal "LEVEL UP!".
        * Déblocage des items du shop liés au nouveau niveau.
4.  Sauvegarde en base.

#### C. Achat & Équipement (Cosmétique)
1.  User sélectionne un Cadre "Or" (Prix: 1000, Niv requis: 5).
2.  **Vérifications Serveur :**
    * `User.Level >= 5` ? OUI.
    * `User.Wallet >= 1000` ? OUI.
3.  **Transaction :**
    * Débit wallet (-1000).
    * Insert dans `User_Inventory` (Item="Cadre Or").
4.  **Équipement :**
    * User clique sur "Équiper".
    * Update `User_Profile` : set `equipped_frame_id = ItemID`.
    * Update Front : Le cadre apparaît autour de l'avatar partout (Chat, Leaderboard).

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-01** | **Daily Bonus (Anti-Banqueroute)** | Chaque utilisateur reçoit 100 Coins une fois par jour (reset 00:00 UTC). Si l'utilisateur a < 50 coins, le bonus est boosté à 200 Coins (mécanique "Comeback"). |
| **RG-02** | **Courbe d'XP** | Formule progressive. Niv 1->2 = 100 XP. Niv 5->6 = ~1100 XP. Cela garantit que les premiers niveaux sont rapides (gratification immédiate) et les suivants longs (engagement). |
| **RG-03** | **Trigger Parrainage** | Le crédit des coins liés au parrainage est strictement conditionné à la validation d'un premier pari (mise > 0) par le filleul. Empêche la création de comptes fantômes juste pour les coins. |
| **RG-04** | **Slots d'Équipement** | Les items sont indépendants. Un joueur peut équiper : 1 Avatar + 1 Cadre + 1 Titre. Si un nouvel item du même type est équipé, il remplace le précédent (l'ancien retourne dans l'inventaire, pas perdu). |
| **RG-05** | **Gains d'XP** | - Connexion Daily : +10 XP<br>- Pari Validé : +10 XP<br>- Pari Gagné : +50 XP<br>- Partage Social : +30 XP |

---

### 6. Données & Technique

**Modèle de Données (Extension)**

**Table `users` (Mise à jour)**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `level` | INT | Défaut 1. |
| `xp` | INT | Cumulatif total. |
| `wallet` | INT | Solde courant. |
| `last_daily_bonus` | DATE | Pour vérifier l'éligibilité RG-01. |
| `equipped_avatar_id` | UUID | FK vers ShopItems. |
| `equipped_frame_id` | UUID | FK vers ShopItems. |

**Table `referrals` (Traçabilité)**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `referrer_id` | UUID | Le Parrain. |
| `referee_id` | UUID | Le Filleul. |
| `status` | ENUM | `PENDING`, `VALIDATED`. |
| `created_at` | TIMESTAMP | Date inscription. |

**Table `shop_items`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `category` | ENUM | `AVATAR`, `FRAME`, `TITLE`. |
| `price` | INT | Coût en coins. |
| `min_level` | INT | Condition de déblocage. |
| `assets` | JSON | `{"url_png": "...", "url_lottie": "..."}`. |

---

### 7. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Réclamation du Daily Bonus
  Given Je ne me suis pas connecté aujourd'hui
  And Mon solde est de 0 Coin
  When J'ouvre l'application
  Then Une pop-up "Bonus Quotidien" s'affiche
  When Je clique sur "Réclamer"
  Then Mon solde passe à 200 Coins (Bonus Boosté car solde < 50)

Scenario: Tentative d'équipement sans achat
  Given L'item "Cadre Diamant" est dans la boutique mais pas dans mon inventaire
  When J'essaie d'appeler l'API pour l'équiper
  Then Le système renvoie une erreur 403 (Item not owned)

Scenario: Validation Parrainage
  Given J'ai parrainé "Toto" (Statut Pending)
  When "Toto" valide son premier pari sur un match
  Then Mon solde augmente de 200 Coins
  And Je reçois une notification "Toto a validé son compte !"

```

---

8. Diagramme de Séquence (Achat Boutique)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App
    participant API
    participant DB

    User->>App: Clic "Acheter Cadre Or" (1000 Coins)
    App->>API: POST /shop/buy {itemId: "cadre-or"}
    
    API->>DB: Fetch User Profile & Item Info
    
    alt Conditions Non Remplies
        DB-->>API: Level=4 (Requis 5) OU Wallet=500
        API-->>User: Erreur "Niveau insuffisant" ou "Fonds insuffisants"
    else Conditions OK
        DB-->>API: Level=6, Wallet=2000
        API->>DB: START TRANSACTION
        API->>DB: UPDATE users SET wallet = wallet - 1000
        API->>DB: INSERT INTO user_inventory (user_id, item_id)
        API->>DB: COMMIT
        API-->>User: Succès "Item ajouté !"
        
        User->>App: Clic "Équiper"
        App->>API: POST /profile/equip {slot: "FRAME", itemId: "cadre-or"}
        API->>DB: UPDATE users SET equipped_frame_id = "cadre-or"
        API-->>App: Profil mis à jour
    end