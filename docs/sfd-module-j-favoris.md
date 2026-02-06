# SFD : Module J - Favoris & Personnalisation

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Fidéliser l'utilisateur en lui permettant de construire son propre tableau de bord et l'inciter à créer un compte (Acquisition).
* **Pour qui ?** Utilisateur Connecté uniquement.

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-J1** | **Épinglage Visuel (Étoile)**<br>En tant qu'utilisateur, je veux épingler des Compétitions, Équipes ou Matchs pour qu'ils apparaissent en haut de ma liste. | Tri immédiat dans la Home. Pas de déclenchement auto de notifs. |
| **US-J2** | **Gestion des Alertes (Cloche)**<br>En tant qu'utilisateur, je veux activer les notifications spécifiquement pour une équipe ou un match (Buts, Score Final). | Dissociation complète du favori visuel. Granularité des alertes. |
| **US-J3** | **Mur d'Inscription (Guest Wall)**<br>En tant qu'invité, si je tente d'ajouter un favori, je veux être redirigé vers la création de compte. | Redirection vers Login/Signup. |

---

### 3. Maquettes / UI (Description Textuelle)

**Éléments d'Interaction**
* **L'Étoile (Favorite) :**
    * *Position :* À côté du nom de la Ligue (Header Section) ou de l'Équipe.
    * *État :* Vide (Non favori) / Pleine (Favori).
    * *Action :* Trie/Épingle l'élément.
* **La Cloche (Alerts) :**
    * *Position :* Dans la fiche détail du Match ou de l'Équipe.
    * *État :* Barrée (Off) / Active (On).
    * *Action :* Active les Pushs.

**Comportement Liste Home (Tri)**
1.  **Section 1 :** Matchs "Épinglés" (Match spécifique favori).
2.  **Section 2 :** Matchs des "Équipes Favorites".
3.  **Section 3 :** Ligues Favorites (Triées par priorité).
4.  **Section 4 :** Reste du monde.

---

### 4. Flux Fonctionnels

#### A. Ajout Favori (Équipe/Ligue) - Cas Connecté
1.  L'utilisateur clique sur l'**Étoile** d'une équipe (ex: "PSG").
2.  L'étoile s'anime.
3.  Appel API `POST /favorites`.
4.  Toast : "PSG ajouté à vos favoris".
5.  **Raffinement UX :** Le Toast propose un bouton d'action secondaire : *"Activer aussi les notifications ?"*.
    * Si l'utilisateur clique "Oui", la Cloche s'active aussi.
    * Sinon, seul le tri visuel est appliqué.

#### B. Tentative Favori - Cas Invité (Guest Wall)
1.  L'utilisateur non connecté clique sur une Étoile.
2.  L'animation est bloquée.
3.  Ouverture d'une Modale (Bottom Sheet) :
    * *Titre :* "Personnalisez votre expérience"
    * *Message :* "Créez un compte pour épingler vos équipes et ne rien rater."
    * *Boutons :* "Se connecter" / "S'inscrire".

#### C. Configuration Notifications (Cloche)
1.  L'utilisateur clique sur la **Cloche** d'un match.
2.  Menu contextuel (Optionnel ou par défaut "Tout") :
    * [x] Buts
    * [x] Cartons Rouges
    * [x] Score Final
    * [x] Début du match
3.  Enregistrement des préférences pour ce `topic`.

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-J01** | **Dissociation Tri/Notif** | - **Favori (Étoile) :** Impacte uniquement l'algorithme de tri de la Home et du Calendrier.<br>- **Alerte (Cloche) :** Impacte l'inscription aux topics FCM/APNS (Firebase Cloud Messaging).<br>L'un peut exister sans l'autre. |
| **RG-J02** | **Scope des Ligues** | Mettre une **Ligue** en favori (ex: Ligue 1) sert uniquement à la remonter visuellement dans la liste. Cela n'abonne JAMAIS aux notifications de tous les matchs de la ligue (Anti-Spam). Pour avoir des notifs, l'utilisateur doit suivre une Équipe ou un Match spécifique. |
| **RG-J03** | **Scope des Équipes** | Mettre une **Équipe** en mode "Cloche" (Notif) abonne automatiquement l'utilisateur aux notifications de tous les futurs matchs de cette équipe. |
| **RG-J04** | **Restriction Invité** | Les favoris sont stockés en base de données (Server-side) et liés au `user_id`. Il n'y a pas de stockage local sur le device pour les invités. L'action est bloquante. |

---

### 6. Données & Technique

**Table `user_favorites`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `user_id` | UUID | FK. |
| `entity_type` | ENUM | `COMPETITION`, `TEAM`, `MATCH`. |
| `entity_id` | UUID | ID de l'objet visé. |
| `created_at` | TIMESTAMP | Pour le tri (Dernier ajouté). |

**Table `user_notification_settings`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `user_id` | UUID | FK. |
| `entity_type` | ENUM | `TEAM`, `MATCH`. |
| `entity_id` | UUID | ID. |
| `alert_types` | JSON | `["GOAL", "RED_CARD", "FULL_TIME"]`. |

---

### 7. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Invité bloqué
  Given Je ne suis pas connecté
  When Je clique sur l'étoile du "Real Madrid"
  Then Aucune requête API n'est envoyée
  And Une modale d'inscription s'ouvre

Scenario: Ajout Favori sans Notification
  Given Je suis connecté
  When Je clique sur l'étoile de la "Ligue 1"
  Then La Ligue 1 remonte en haut de ma Home Page
  And Je ne reçois PAS de notification quand un but est marqué en Ligue 1

Scenario: Abonnement Match spécifique
  Given Je ne suis pas fan de "Brest" ni de "Nice"
  But J'ai activé la cloche sur le match "Brest - Nice"
  When Il y a un but dans ce match
  Then Je reçois une notification Push
```
---

### 8. Diagramme de Séquence (Guest Wall)
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Interface
    participant Auth as Auth Service

    User->>UI: Clic sur "Étoile" (Favori)
    UI->>UI: Check Session Token
    
    alt Token Invalide (Guest)
        UI->>User: Affiche Modal "Login Required"
        User->>UI: Clic "S'inscrire"
        UI->>Auth: Redirection Flow Inscription
    else Token Valide (Logged)
        UI->>UI: Animation Étoile Pleine
        UI->>Auth: POST /favorites (Async)
        UI-->>User: Toast "Ajouté !"
    end