# SFD : Module K - Recherche Globale

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Accès direct aux contenus. Évite la navigation fastidieuse dans les arborescences de ligues pour trouver une équipe spécifique.
* **Pour qui ?** Utilisateur pressé / Expert.

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-K1** | **Recherche Tolérante (Fuzzy)**<br>En tant qu'utilisateur, je veux trouver "Barcelone" même si je tape "Barca" ou "Barcelon" (faute de frappe). | Algorithme de correspondance floue (Trigram/Phonétique). |
| **US-K2** | **Recherche par Alias**<br>En tant qu'expert, je veux taper "OM" ou "PSG" et trouver les clubs officiels instantanément. | Gestion des champs `short_code` ou `aliases`. |
| **US-K3** | **Historique Récent**<br>En tant qu'utilisateur, je veux retrouver mes dernières recherches dès que je touche la barre, sans retaper. | Stockage local des 5 derniers termes. |
| **US-K4** | **Scope Restreint**<br>En tant qu'utilisateur, je veux voir uniquement les Équipes et Compétitions (pas de joueurs) pour des résultats clairs. | Filtrage backend strict. |

---

### 3. Maquettes / UI (Description Textuelle)

**Barre de Recherche (Header)**
* Champ texte large avec placeholder : *"Rechercher une équipe, une ligue..."*.
* Icône "Loupe" à gauche.
* Icône "Croix" à droite (apparaît quand du texte est saisi pour effacer).

**État A : Zéro Query (Au focus, champ vide)**
* **Titre :** "Recherches Récentes".
* **Liste :** Historique des 5 derniers termes cliqués.
* **Action :** Bouton "Effacer l'historique".

**État B : Résultats (Saisie > 2 car.)**
* **Section 1 : Équipes** (Prioritaire)
    * Liste : [Logo] **Nom de l'équipe** (Pays).
* **Section 2 : Compétitions**
    * Liste : [Drapeau/Logo] **Nom de la Ligue**.
* **Feedback visuel :** Si aucun résultat, afficher un "Empty State" sympa (ex: "Aucun résultat pour 'Xyz'. Essayez un autre terme.").

---

### 4. Flux Fonctionnels

#### A. Saisie & Debounce
1.  L'utilisateur tape "Bar".
2.  **Frontend :** Attend 300ms (Debounce) pour éviter de spammer l'API à chaque lettre.
3.  L'utilisateur ajoute "c". (Total "Barc").
4.  Fin de saisie temporaire (> 300ms).
5.  Appel API : `GET /search?q=barc`.

#### B. Traitement Backend (Fuzzy Logic)
1.  Le serveur reçoit "barc".
2.  Il exécute une requête optimisée sur `Teams` et `Competitions`.
3.  **Logique de Matching :**
    * Match exact (`ILIKE 'barc%'`).
    * Match partiel (`Trigram similarity`).
    * Match Alias (si `alias = 'barc'`).
4.  Retourne les résultats triés par pertinence (Score de similarité).

#### C. Clic & Historique
1.  L'utilisateur clique sur le résultat "FC Barcelona".
2.  **Frontend :**
    * Redirige vers la fiche équipe.
    * Ajoute "FC Barcelona" (ou le terme "Barc") dans le `AsyncStorage` (Historique local).
    * Si l'historique > 5 items, supprime le plus ancien.

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-K01** | **Seuil de déclenchement** | La recherche API se lance à partir de **2 caractères** (pour autoriser "OM", "MU"). En dessous, on reste sur l'historique. |
| **RG-K02** | **Tolérance (Fuzzy)** | Le système doit gérer les fautes mineures. <br>Ex: "Manchestair" doit remonter "Manchester". <br>Implémentation technique : Extension PostgreSQL `pg_trgm` ou moteur de recherche dédié. |
| **RG-K03** | **Alias & Abréviations** | Les équipes majeures doivent avoir des alias en base.<br>- OM -> Olympique de Marseille<br>- OL -> Olympique Lyonnais<br>- Man U -> Manchester United<br>- KSA -> Arabie Saoudite (Équipe nationale). |
| **RG-K04** | **Scope Données** | **Inclus :** Teams, Competitions.<br>**Exclus (MVP) :** Joueurs, Matchs spécifiques, Stades, Arbitres. |

---

### 6. Données & Technique

**API Endpoint : `GET /api/v1/search`**
* Params: `q` (string).
* Response:
```json
{
  "teams": [
    { "id": "t1", "name": "FC Barcelona", "logo": "...", "country": "ES" },
    { "id": "t2", "name": "Barnsley", "logo": "...", "country": "GB" }
  ],
  "competitions": [
    { "id": "c1", "name": "Barclays Premier League", "logo": "..." } // (Ancien nom géré par alias)
  ]
}
```
---

### 7. Critères d'Acceptation (Gherkin)
```gherkin
Scenario: Recherche avec Alias
  Given Je veux trouver l'Olympique de Marseille
  When Je tape "OM" dans la barre
  Then L'équipe "Olympique de Marseille" apparaît en premier résultat

Scenario: Recherche avec faute de frappe (Tolérance)
  Given Je tape "Real Madid" (Il manque le r)
  When La recherche se lance
  Then L'équipe "Real Madrid" est proposée grâce à l'algo Fuzzy

Scenario: Utilisation de l'historique
  Given J'ai déjà visité la page du "PSG" via la recherche
  When Je reviens sur la recherche et je clique sur la loupe (Champ vide)
  Then Je vois "PSG" dans la liste "Recherches récentes"
  When Je clique dessus
  Then Je suis redirigé directement vers la fiche du PSG
```
---

8. Diagramme de Séquence (Flux Recherche)
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App
    participant API
    participant DB

    User->>App: Focus Champ Recherche
    App->>User: Affiche Historique Local

    User->>App: Tape "Barc"
    App->>App: Debounce (300ms)
    
    App->>API: GET /search?q=Barc
    
    API->>DB: SQL Query (Teams + Comps)
    Note right of DB: WHERE name ILIKE '%Barc%' <br/> OR similarity(name, 'Barc') > 0.3
    
    DB-->>API: Résultats Bruts
    API-->>App: JSON {teams: [...], leagues: [...]}
    
    App->>User: Affiche Liste Résultats
    
    User->>App: Clic sur "FC Barcelona"
    App->>App: Save to Local History
    App->>User: Redirect to Team Details