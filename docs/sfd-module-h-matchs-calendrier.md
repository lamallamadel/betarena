# SFD : Module H - Liste des Matchs & Calendrier (Home)

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** C'est le point d'entrée principal. Il doit permettre de visualiser rapidement les matchs pertinents, de naviguer dans le temps et de masquer les résultats pour éviter le spoil.
* **Pour qui ?** Tous les utilisateurs.

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-H1** | **Hiérarchisation**<br>En tant qu'utilisateur, je veux voir mes équipes et ligues favorites en haut de liste pour ne pas scroller inutilement. | Tri : Favoris > Ligues Majeures > Reste. |
| **US-H2** | **Navigation Temporelle (Timezone)**<br>En tant qu'utilisateur, je veux voir les horaires des matchs convertis dans mon heure locale. | Affichage "21:00" (Paris) pour un match à "20:00" (Londres). |
| **US-H3** | **Mode "No Spoiler"**<br>En tant qu'utilisateur, je veux masquer les scores des matchs terminés ou en cours pour garder le suspense si je regarde en différé. | Masquage scores + Masquage indicateurs couleur (Vert/Rouge). |
| **US-H4** | **Performance (Polling)**<br>En tant qu'utilisateur, je veux que les scores s'actualisent régulièrement sans vider ma batterie. | Rafraîchissement automatique toutes les 60s (pas de socket temps réel sur la Home). |

---

### 3. Maquettes / UI (Description Textuelle)

**Header Global (Top Bar)**
* **Gauche :** Solde de Coins (ex: 🪙 1250).
* **Droite :** Icône "Œil" (Toggle Mode No Spoiler).

**Barre de Navigation Temporelle (Sticky)**
* **Layout :** Carrousel horizontal de dates.
* **Items :** `Jeu 02` | `Ven 03` | **`AUJ`** (Surligné) | `Dim 05` | `Lun 06`.
* **Action :** Clic sur une date -> Charge les matchs. Clic sur icône "Calendrier" -> DatePicker.

**Liste des Matchs (Main Content)**
* **Structure :** Liste groupée par Compétition.
* **Header de Section :** [Logo Ligue] **Premier League** (Angleterre) [Étoile Favori].
* **Carte Match (Cellule) :**
    * *Gauche :* Heure (ex: 21:00) ou Minute (ex: 34').
    * *Centre :* [Logo A] Équipe A vs Équipe B [Logo B].
    * *Droite :* Score (ex: 2 - 1).
    * *Action :* Clic -> Ouvre "Match Detail".
* **État "No Spoiler" Actif :**
    * Le score "2 - 1" est remplacé par "**? - ?**".
    * Le statut "FINI" est affiché, mais sans code couleur (ni vert ni rouge).

---

### 4. Flux Fonctionnels

#### A. Chargement Initial & Timezone
1.  L'app détecte la Timezone du téléphone (ex: `Europe/Paris`).
2.  Appel API : `GET /matches?date=2023-10-27&timezone=Europe/Paris`.
3.  **Backend :**
    * Récupère tous les matchs dont le `kickoff_utc` tombe dans la journée du 27/10 selon le fuseau horaire demandé.
    * *Note :* Un match joué à 23h UTC le 26/10 sera affiché le 27/10 à 01h00 pour un utilisateur à Paris (+2).
4.  **Frontend :** Affiche la liste groupée.

#### B. Logique de Tri (Sorting)
L'algorithme de tri côté client (ou pré-trié backend) suit cet ordre strict :
1.  **Section "Mes Favoris" :** Tous les matchs impliquant une *Équipe Favorite* ou une *Ligue Favorite* de l'utilisateur.
2.  **Section "Ligues Premium" :** Compétitions avec `priority_level = 1` (ex: LDC, Premier League, World Cup) définies par l'Admin.
3.  **Section "Autres" :** Le reste, trié par heure de coup d'envoi.

#### C. Polling (Mise à jour)
1.  L'écran Home ne connecte **PAS** de WebSocket (économie ressources).
2.  Timer local : Toutes les **60 secondes**.
3.  Appel silencieux à l'API (`background-fetch`).
4.  Mise à jour du DOM uniquement si les données ont changé (React Virtual DOM ou équivalent).

#### D. Toggle "No Spoiler"
1.  L'utilisateur clique sur l'œil barré.
2.  L'état `isSpoilerFree` passe à `true` (Persistance locale `AsyncStorage`).
3.  L'UI se rafraîchit instantanément :
    * Scores -> "?? - ??".
    * Badges "V" (Victoire) / "D" (Défaite) -> Masqués.

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-H01** | **Découpage Journée (Timezone)** | La journée commence à 00:00:00 et finit à 23:59:59 **Heure Locale Utilisateur**. Cela signifie que deux utilisateurs (NY vs Paris) ne voient pas exactement les mêmes matchs sur la fiche "Aujourd'hui". |
| **RG-H02** | **Indicateur Live** | Un match en cours affiche son score en **Rouge** (ou couleur accent) avec une mention "LIVE" clignotante. Si "No Spoiler" est actif, le score est masqué mais la mention "LIVE" reste visible. |
| **RG-H03** | **Masquage Ligues Vides** | Si une compétition n'a aucun match sur la date sélectionnée, le header de la compétition ne doit pas s'afficher (Pas de section vide). |
| **RG-H04** | **Persistence Filtres** | L'état du mode "No Spoiler" est sauvegardé en local sur le device. L'utilisateur n'a pas à le réactiver à chaque lancement. |

---

### 6. Données & Technique

**API Endpoint : `GET /api/v1/matches/feed`**

**Request Params :**
* `date` (ISO Date): `2023-11-12`
* `timezone`: `Europe/Paris`
* `favorites_only`: `false` (Optionnel pour filtres)

**Response JSON (Structure Groupée) :**
```json
{
  "date": "2023-11-12",
  "groups": [
    {
      "league_id": "lg_123",
      "league_name": "Premier League",
      "country_code": "GB",
      "is_favorite": true,
      "matches": [
        {
          "match_id": "mt_555",
          "home_team": { "id": "t1", "name": "Chelsea", "logo": "url" },
          "away_team": { "id": "t2", "name": "Arsenal", "logo": "url" },
          "kickoff_local": "2023-11-12T21:00:00+01:00",
          "status": "LIVE",
          "score": { "home": 1, "away": 1 },
          "minute": 35
        }
      ]
    }
  ]
}
```
---

### 7. Critères d'Acceptation (Gherkin)
```gherkin
Scenario: Activation du mode No Spoiler
  Given Je suis sur la Home et le match "PSG - OM" affiche "2 - 0"
  When Je clique sur l'icône "Œil" (No Spoiler)
  Then Le score devient "? - ?"
  And Le score n'est plus visible même si je navigue vers "Hier"

Scenario: Affichage Timezone
  Given Un match se joue à 23h00 UTC le 10 Octobre
  And Je suis à Paris (UTC+2)
  When Je regarde le calendrier du 10 Octobre
  Then Le match n'apparaît pas
  When Je regarde le calendrier du 11 Octobre
  Then Le match apparaît à 01h00 du matin

Scenario: Rafraîchissement Polling
  Given Je reste sur la Home sans bouger
  And Le score change dans la réalité
  When Le timer de 60s expire
  Then Le score à l'écran se met à jour automatiquement sans recharger la page
```
---

8. Diagramme de Séquence (Chargement Home)
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App
    participant API
    participant DB

    User->>App: Ouvre l'App
    App->>App: Get Local Timezone (ex: Europe/Paris)
    
    App->>API: GET /matches/feed?date=TODAY&tz=Europe/Paris
    
    API->>DB: Query Matches (Where UTC between Local_Start & Local_End)
    DB-->>API: Raw Match List
    
    API->>API: Group by League + Sort by Priority/Favorites
    API-->>App: JSON Grouped Data
    
    App->>App: Check "No Spoiler" Setting
    
    alt Spoiler Mode ON
        App->>User: Render Matches (Scores Masked "??-??")
    else Spoiler Mode OFF
        App->>User: Render Matches (Scores Visible)
    end
    
    loop Every 60s
        App->>API: Background Refresh
        API-->>App: Updated Data
        App->>User: Update DOM (Diffing)
    end