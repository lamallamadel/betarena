# SFD : Module Chat & Social Interaction (Live & Groups)

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Augmenter la rétention (Time in App) et créer un effet "Second Screen" communautaire.
* **Pour qui ?** Utilisateurs Connectés (Actifs), Invités (Passifs/Lecteurs).

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-01** | **Navigation Multi-Canaux**<br>En tant qu'utilisateur, je veux basculer entre le Chat Global, le Chat Match et mes Groupes Privés. | Changement de room WebSocket fluide (< 200ms). |
| **US-02** | **Réactions Riches (GIFs)**<br>En tant qu'utilisateur, je veux envoyer des GIFs via une bibliothèque intégrée (Giphy/Tenor) pour réagir sans uploader de fichiers. | Intégration API Tiers. Pas d'upload d'images perso (Sécurité). |
| **US-03** | **Mode Spectateur (Invité)**<br>En tant qu'invité, je veux voir le flux de messages en temps réel pour ressentir l'ambiance, mais sans pouvoir écrire. | Input bloqué + Call-to-Action (CTA) inscription. |
| **US-04** | **Modération Automatique**<br>En tant qu'Admin, je veux que les messages contenant des mots interdits soient bloqués avant diffusion. | Filtrage Synchrone (Blacklist). |
| **US-05** | **Scalabilité (Sharding)**<br>En tant que Système, je veux répartir les utilisateurs du chat "Global" dans des sous-salons (Global #1, #2...) pour éviter la saturation. | Limite paramétrable (ex: 500 users/room). |

---

### 3. Maquettes / UI (Description Textuelle)

**Zone de Chat (Main View)**
1.  **Header (Sélecteur) :**
    * Dropdown ou Tabs scrollables : "Global #1", "Match: PSG-OM", "Groupe: Les Potos".
    * Indicateur "Live" (Pastille verte) + Nombre de connectés dans la room.

2.  **Flux de Messages (List) :**
    * Messages affichés de bas en haut.
    * **Bulle Moi :** Alignée droite, couleur accent.
    * **Bulle Autres :** Alignée gauche, gris clair + Avatar + Pseudo.
    * **Contenu :** Texte et/ou GIF animé.
    * **Action :** Appui long -> "Signaler" (Report).

3.  **Input Area (Footer) :**
    * *Si Connecté :* Champ texte + Icône "GIF" + Bouton "Envoyer".
    * *Si Invité :* Zone floutée ou grisés avec texte "Connectez-vous pour participer !".

---

### 4. Flux Fonctionnels

#### A. Connexion & Sharding (Join Room)
1.  L'utilisateur entre dans la section "Chat Global".
2.  Le système vérifie le nombre d'utilisateurs dans "Global #1".
3.  **Règle de Sharding :**
    * Si `Users < MAX_CAPACITY` : Assigner à "Global #1".
    * Si `Users >= MAX_CAPACITY` : Assigner à "Global #2" (et ainsi de suite).
4.  Connexion WebSocket établie sur la room assignée.
5.  Récupération des 50 derniers messages (Historique récent).

#### B. Envoi de Message (Send)
1.  L'utilisateur clique sur "Envoyer".
2.  **Check Anti-Flood :** Vérifie si dernier message < 2 sec.
3.  **Check Modération :** Regex sur le contenu texte.
    * *Si Ko :* Rejet local (Erreur "Contenu inapproprié").
    * *Si Ok :* Envoi au serveur.
4.  Le serveur diffuse (Broadcast) à tous les sockets de la `current_room`.
5.  Persistance temporaire (Redis) pour l'historique.

#### C. Nettoyage (TTL)
1.  Les messages sont stockés avec une durée de vie limitée.
2.  Trigger automatique ou expiration Redis : Suppression des messages > 24h (ou après fin du match + délai).

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-01** | **Contenu Autorisé** | - Texte : Max 280 caractères.<br>- GIF : Via API partenaires uniquement (Giphy/Tenor).<br>- **Exclusion :** Upload d'images ou vidéos personnelles interdit (MVP). |
| **RG-02** | **Sharding Global** | Le chat "Global" est virtuel. Il est composé de N instances physiques (Rooms). Un utilisateur est assigné à une instance à sa connexion et y reste tant qu'il ne rafraîchit pas. Paramètre `MAX_USERS_PER_ROOM` = 500. |
| **RG-03** | **Rétention des Données (TTL)** | - Chat Match : Suppression 24h après le coup de sifflet final.<br>- Chat Global : Historique glissant (ex: derniers 200 messages ou 24h).<br>- Chat Groupes Privés : Persistance permanente (PostgreSQL/Mongo). |
| **RG-04** | **Auto-Modération** | Filtrage strict (Block) sur liste de mots clés (Insultes, racisme). Pas d'étoiles (****), le message est refusé. |
| **RG-05** | **Signalement** | Si un message reçoit `REPORT_THRESHOLD` (ex: 5) signalements uniques en < 10min, il est masqué automatiquement pour tous ("Contenu masqué"). |

---

### 6. Données & Technique

**Architecture : WebSocket + Redis**

* **Protocole :** Socket.io (Node.js) ou Pusher (SaaS).
* **Stockage Hot (Chat Live) :** Redis Streams ou Redis Lists (`LPUSH` / `LTRIM`).
    * Structure : `chat:room:{room_id}:messages`.
    * TTL natif Redis pour l'expiration.
* **Stockage Cold (Groupes Privés) :** Base de données NoSQL (MongoDB) ou PostgreSQL (JSONB).

**Payload Message (JSON) :**
```json
{
  "id": "uuid",
  "sender": { "id": 123, "username": "Zidane", "avatar": "url" },
  "type": "TEXT" | "GIF",
  "content": "Allez les bleus !",
  "media_url": null,
  "timestamp": 1715694000
}
```

### 7. Critères d'Acceptation (Gherkin)
```gherkin
Scenario: Sharding automatique
  Given La room "Global #1" contient 500 utilisateurs (Capacité Max)
  When Je me connecte au Chat Global
  Then Je suis automatiquement redirigé vers la room "Global #2"
  And Je ne vois pas les messages de la room "Global #1"

Scenario: Expiration des messages (TTL)
  Given Le match est terminé depuis 25 heures
  When Je tente d'accéder à l'historique du chat de ce match
  Then La liste des messages est vide (Nettoyée par le TTL)

Scenario: Tentative de Spam
  Given J'ai envoyé un message il y a 0.5 secondes
  When J'essaie d'envoyer un nouveau message immédiatement
  Then Le système bloque l'envoi (Erreur "Veuillez ralentir")
```

### 8. Flux Technique (Sequence Diagram)

Ce diagramme illustre le flux critique de l'envoi d'un message avec vérification et diffusion via Redis (Pub/Sub) pour scaler.

```mermaid
sequenceDiagram
    autonumber
    actor User as Utilisateur
    participant Client as App Mobile
    participant LB as Load Balancer / Socket Server
    participant Redis as Redis (Cache & PubSub)
    participant Mod as Service Modération

    Note over User, Redis: Contexte : Utilisateur connecté dans "Global #1"

    User->>Client: Saisit "Salut" et envoie
    Client->>LB: EMIT send_message (Room="Global#1", Txt="Salut")
    
    rect rgb(30, 30, 30)
        Note right of LB: Validations
        LB->>Redis: Check Rate Limit (Spam)
        Redis-->>LB: OK
        LB->>Mod: Check Blacklist (Synchrone)
        Mod-->>LB: OK
    end
    
    LB->>Redis: LPUSH chat:global#1 (Stockage Historique)
    LB->>Redis: PUBLISH channel:global#1 (Diffusion)
    
    Note right of Redis: Pattern Pub/Sub
    Redis-->>LB: Event: New Message
    
    LB-->>Client: Broadcast (À tous les clients de la room)
    Client->>User: Affiche le message