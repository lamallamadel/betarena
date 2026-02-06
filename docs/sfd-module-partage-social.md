# SFD : Module Partage Social & Viralité (Social Share)

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Transformer les utilisateurs en ambassadeurs actifs (User Acquisition gratuite) et renforcer la rétention par la gratification sociale (Ego).
* **Pour qui ?** Utilisateurs Connectés.

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-01** | **Partage Visuel (Défi)**<br>En tant que joueur, je veux générer une image de mon pronostic pour défier mes amis sur les réseaux sociaux. | Image générée < 1s. Branding app visible. |
| **US-02** | **Partage de Performance (Brag)**<br>En tant que gagnant, je veux partager une image stylisée de mon gain ou de mon classement. | Templates variés (Dark/Light/Club). |
| **US-03** | **Récompense (Incentive)**<br>En tant que joueur, je veux gagner des Coins lorsque je partage, pour augmenter ma bankroll. | Système anti-abus (Quota + Cooldown). |
| **US-04** | **Acquisition (Smart Links)**<br>En tant que Système, je veux que le lien partagé redirige vers le store si l'ami n'a pas l'app, ou directement sur le match s'il l'a déjà. | Intégration Firebase Dynamic Links ou Branch.io. |

---

### 3. Maquettes / UI (Description Textuelle)

**Points d'entrée (Bouton Share)**
* Icône "Share" standard présente sur :
    1.  Carte de Pronostic validé.
    2.  Modal de Résultat (Gain/Perte).
    3.  Ligne personnelle dans le Leaderboard.

**Modal de Prévisualisation (Interstitiel)**
* **Header :** Titre "Partager ma performance".
* **Zone Centrale (Preview) :** Affiche l'image générée dynamiquement (Bitmap).
    * *Contenu :* Logo App + Score/Gain + Pseudo + Fond graphique contextuel.
* **Sélecteur de Template (Carrousel bas) :**
    * Options : "Classique", "Dark Mode", "Club Colors" (si supporté).
* **Footer (Actions) :**
    * Bouton Principal : "Partager (+10 Coins)" (ou juste "Partager" si quota atteint).
    * Mention légale discrète : "Le jeu d'argent est interdit aux mineurs..." (si applicable légalement).

---

### 4. Flux Fonctionnels

#### A. Cas Nominal : Partage Rémunéré
1.  L'utilisateur clique sur l'icône "Share" d'un pari gagnant.
2.  L'application génère l'image en local (Client-side) et la stocke dans le **Cache Temporaire** (pas de pollution Galerie).
3.  Le système vérifie l'éligibilité récompense (Quota non atteint ET Cooldown expiré).
4.  L'utilisateur clique sur "Partager sur Instagram".
5.  L'OS ouvre la Share Sheet.
6.  **Au retour (Callback) :**
    * Le système détecte l'action "Intent Launched".
    * Crédit du wallet (+10 Coins).
    * Toast : "Image partagée ! +10 Coins ajoutés."
    * Enregistrement du log (Timestamp).

#### B. Cas Alternatif : Abus / Limites
1.  L'utilisateur partage à nouveau 2 minutes plus tard.
2.  Le système vérifie l'éligibilité : **KO (Cooldown actif).**
3.  L'image est générée et partagée normalement.
4.  **Au retour :**
    * Pas de crédit.
    * Toast : "Merci pour le partage ! (Récompense disponible dans 8min)".

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-01** | **Templates Contextuels** | - **Prono :** "Mon prono : 2-1" (Focus Défi).<br>- **Gain :** "WINNER ! +500 Coins" (Focus Succès).<br>- **Leaderboard :** "Top 10 Saison" (Focus Rang). |
| **RG-02** | **Règles de Récompense** | - **Montant :** 10 Coins par partage.<br>- **Quota Journalier :** Max 3 récompenses / jour (reset à 00:00 UTC).<br>- **Cooldown :** Min 10 minutes entre deux récompenses (Anti-Farming). |
| **RG-03** | **Preuve de Partage** | On récompense l'ouverture de la fenêtre de partage système (Intent). On ne peut pas techniquement vérifier si le post est publié sur Instagram/WhatsApp. Le Cooldown (RG-02) compense cette faiblesse. |
| **RG-04** | **Smart Linking** | Le message texte accompagnant l'image contient un lien universel (ex: `https://link.myapp.com/match/123`).<br>- **Si App installée :** Ouvre le match.<br>- **Si App absente :** Redirige vers App Store / Play Store avec tracking de la source (Referral). |
| **RG-05** | **Gestion Fichiers** | Les images générées sont stockées dans le dossier `Caches` de l'OS. Elles sont supprimées automatiquement par l'OS si besoin d'espace ou au redémarrage de l'app. Pas de demande de permission `WRITE_EXTERNAL_STORAGE`. |

---

### 6. Données & Technique

**Génération Image (Client-Side)**
* Techno : `react-native-view-shot` ou Flutter `RepaintBoundary`.
* Format : JPG (Qualité 80%, suffisant et léger).

**Table `user_share_logs`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK User. |
| `shared_at` | TIMESTAMP | Date du partage. |
| `context` | ENUM | `PRONO`, `WIN`, `RANK`. |
| `rewarded` | BOOLEAN | `true` si des coins ont été donnés. |

**API Endpoints**
* `POST /api/v1/user/share/reward`
    * Trigger : Appelé après le retour de la Share Sheet.
    * Logic : Vérifie les logs en base. Si éligible -> Crédite -> Retourne `success: true`.

---

### 7. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Lien dynamique pour un nouvel utilisateur
  Given Je n'ai pas l'application installée
  When Je clique sur le lien reçu par WhatsApp "[https://link.myapp.com/match/123](https://link.myapp.com/match/123)"
  Then Je suis redirigé vers l'App Store
  And Après installation, l'application s'ouvre directement sur le match 123 (Deferred Deep Linking)

Scenario: Tentative de Farming (Cooldown)
  Given J'ai partagé une image et reçu 10 coins il y a 2 minutes
  When Je tente de partager une nouvelle image
  Then L'image est générée et partagée
  But Mon solde de Coins reste inchangé
  And Un message m'informe du délai d'attente restant

Scenario: Permission Stockage
  Given Je suis sur Android 13+
  When Je clique sur partager
  Then L'application ne me demande AUCUNE permission de stockage (Usage du Cache)
```

---

8. Diagramme de Séquence (Flux de Récompense)
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App
    participant OS as Système (Share Sheet)
    participant API as Backend

    User->>App: Clic "Partager"
    App->>App: Génération Bitmap (Cache)
    App->>OS: Ouvre Share Sheet (Image + SmartLink)
    
    OS-->>User: Affiche les apps (Insta, Whatsapp...)
    User->>OS: Sélectionne l'app ou revient en arrière
    
    OS-->>App: Callback (Focus retour)
    
    Note right of App: L'utilisateur est revenu dans l'app
    
    App->>API: POST /share/reward
    
    alt Eligible (Quota OK + Cooldown OK)
        API->>API: Crédit Wallet (+10)
        API->>API: Log Share (Rewarded=True)
        API-->>App: Success (Reward=10)
        App-->>User: Toast "+10 Coins !"
    else Non Eligible
        API->>API: Log Share (Rewarded=False)
        API-->>App: Success (Reward=0)
        App-->>User: Toast "Partage effectué (Pas de gain)"
    end