# SFD : Module Live Match Center & Flux d'Événements

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Fournir la "vérité terrain" en temps réel. C'est la source de données unique qui arbitre les paris, alimente les discussions et crée l'engagement émotionnel.
* **Pour qui ?** Utilisateurs Connectés et Invités.

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-01** | **Suivi Temps Réel**<br>En tant qu'utilisateur, je veux que le fil des événements se mette à jour sans rafraîchir la page. | Latence technique < 2s après réception provider. Polling provider : 5s. |
| **US-02** | **Détails Pertinents**<br>En tant qu'utilisateur, je veux voir les actions décisives (Buts, Cartons, Tirs cadrés, Corners) mais pas les actions mineures (Touches) pour ne pas noyer l'info. | Filtrage en backend (White-listing). |
| **US-03** | **Gestion VAR**<br>En tant qu'utilisateur, je veux comprendre si un but est annulé sans qu'il disparaisse simplement de l'écran. | Affichage barré + Mention "Annulé VAR". |
| **US-04** | **Indicateurs Visuels**<br>En tant qu'utilisateur, je veux une animation forte lors d'un but pour ressentir l'intensité. | Flash écran + Vibration haptique. |

---

### 3. Maquettes / UI (Description Textuelle)

**Header Match**
* **Score :** Grande taille, centré. Animation "Pulse" lors du changement.
* **Chrono :** `MM:SS` (ou `MM+` si temps additionnel). Clignote en rouge si match arrêté.
* **Statut :** Badge "LIVE" (Vert) / "MI-TEMPS" (Orange) / "FINI" (Gris).

**Timeline Verticale (Feed)**
* **Tri :** Chronologique inversé (Le plus récent en haut).
* **Layout :**
    * *Domicile :* Aligné Gauche.
    * *Extérieur :* Aligné Droite.
    * *Système (Mi-temps, VAR) :* Centré.
* **Composant Événement :**
    * Minute (`34'`).
    * Icône (Ballon, Carton Jaune/Rouge, Drapeau, Flèches substitution).
    * Description ("But - K. Mbappé").
    * *Si Annulé :* Texte barré (~~But - K. Mbappé~~) + Icône VAR.

---

### 4. Flux Fonctionnels

#### A. Cas Nominal : Réception & Diffusion (Proxy Pattern)
1.  **Backend (Job Cron/Loop) :** Interroge l'API Provider toutes les **5 secondes**.
2.  **Diffing :** Le backend compare le JSON reçu avec la dernière version en cache/BDD.
3.  **Filtrage :** Si un nouvel événement est détecté ET qu'il fait partie de la "Whitelist" (But, Carton, Corner, Penalty, Changement, Occasion nette).
4.  **Broadcast :** Le backend envoie un payload WebSocket sur le channel `match_{id}`.
5.  **App Mobile :** Reçoit l'événement -> Animation `FadeIn` en haut de liste -> Update Score Header.

#### B. Cas Alternatif : Annulation VAR
1.  Le Provider change le statut d'un événement existant (ex: Goal -> Cancelled) et décrémente le score.
2.  **Backend :** Détecte la modification d'un ID d'événement déjà traité.
3.  **Broadcast :** Envoie un payload de type `EVENT_UPDATE` (et non `EVENT_NEW`).
4.  **App Mobile :**
    * Recherche l'événement dans la liste locale via `event_id`.
    * Applique le style "Barré / Grisé".
    * Met à jour le score dans le Header (-1).

#### C. Cas Alternatif : Connexion/Déconnexion
1.  **Ouverture App :** L'app appelle l'API REST `GET /matches/{id}/events` pour charger l'historique initial.
2.  **Background :** Si l'utilisateur quitte l'app ou verrouille l'écran, le socket `unsubscribe` (Économie batterie & data).
3.  **Foreground :** Au retour, l'app appelle l'API REST pour combler le "trou" (Gap sync) puis se reconnecte au Socket.

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-01** | **Whitelist Événements** | **Inclus :** Goal, Card (Yellow/Red), Substitution, Corner, Penalty, Missed Penalty, VAR Decision. <br>**Exclus :** Throw-in (Touche), Free Kick (Coup franc milieu terrain), Goal Kick (6m), Offside (Hors-jeu sans but). |
| **RG-02** | **Fréquence de Mise à Jour** | Polling Provider fixé à **5 secondes**. Compromis optimal entre coût API et expérience "Live". |
| **RG-03** | **Immutabilité Historique** | Un événement n'est jamais supprimé physiquement de la BDD une fois diffusé (sauf erreur technique grave). En cas d'annulation terrain, il passe au statut `CANCELLED`. |
| **RG-04** | **Chronologie** | Tri primaire : `minute` (DESC). Tri secondaire : `id` (DESC) ou `timestamp_created`. Les événements de temps additionnel (45+2) apparaissent avant la 45ème. |

---

### 6. Données & Technique

**Modèle `match_events`**

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK interne. |
| `provider_id` | String | ID unique côté fournisseur (pour dédoublonnage). |
| `match_id` | UUID | FK Match. |
| `team_id` | UUID | FK Team (Nullable si événement système). |
| `type` | ENUM | `GOAL`, `CARD`, `SUB`, `CORNER`, `VAR`, `PERIOD_START`, `PERIOD_END`. |
| `minute` | Int | Minute du match. |
| `extra_minute` | Int | Temps additionnel. |
| `player_main` | String | Nom du joueur principal (Buteur). |
| `player_assist` | String | Nom du passeur (Nullable). |
| `is_cancelled` | Bool | Default False. (Gestion VAR). |

**Payload WebSocket (`EVENT_UPDATE`)**
```json
{
  "type": "EVENT_UPDATE",
  "match_id": "123-abc",
  "data": {
    "event_id": "evt-789",
    "type": "GOAL",
    "team": "HOME",
    "minute": 34,
    "score": { "home": 1, "away": 0 },
    "is_cancelled": true,
    "display_text": "But annulé - Hors jeu"
  }
}
```

---

### 7. Critères d'Acceptation (Gherkin)
```gherkin
Scenario: Réception d'un But
  Given Je suis sur le match "PSG - OM" (0-0)
  When Le backend détecte un but pour le PSG
  Then Le score passe à 1-0 avec une animation
  And Une carte "But" s'ajoute en haut du flux
  And Le téléphone vibre (Haptic feedback)

Scenario: Annulation VAR
  Given Le score est de 1-0 et l'événement "But" est affiché
  When La VAR annule le but
  Then Le score repasse à 0-0
  And L'événement "But" reste visible mais devient barré (strikethrough)
  And Une icône "VAR" apparaît à côté

Scenario: Filtrage Touche
  Given Le match est en cours
  When Une "Touche" est signalée par le provider
  Then Aucun événement n'est ajouté au flux (Filtrage Backend actif)
```
---

### 8. Diagramme de Séquence (Architecture Proxy)
```mermaid
sequenceDiagram
    autonumber
    participant App as App Mobile
    participant WS as WebSocket Server
    participant Back as Backend (Cron)
    participant Provider as API Sport (Externe)

    Note over Back, Provider: Boucle infinie (Toutes les 5s)

    Back->>Provider: GET /fixtures/events (MatchID)
    Provider-->>Back: JSON [Events List]
    
    Back->>Back: Diff (Nouveau vs DB) & Filtre (Whitelist)
    
    alt Nouvel Événement Majeur (ex: But)
        Back->>DB: INSERT event
        Back->>WS: PUBLISH match_123 (Payload)
        WS-->>App: Broadcast (Event)
        App->>App: Update UI & Vibrate
    else Mise à jour Statut (ex: VAR Cancel)
        Back->>DB: UPDATE event SET cancelled=true
        Back->>WS: PUBLISH match_123 (Payload Update)
        WS-->>App: Broadcast (Update)
        App->>App: Update UI (Strike-through)
    end
