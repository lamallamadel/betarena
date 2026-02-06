# SFD : Dashboard Administrateur (Back-Office)

**Version :** 1.0
**État :** Validé pour Dév
**Auteur :** L'Architecte

---

### 1. Contexte & Objectif
* **Pourquoi ?** Centraliser le pilotage de l'application, la modération (UGC), la gestion des incidents (matchs incorrects) et l'animation marketing.
* **Pour qui ?** Super Admin (Accès complet) et Modérateurs (Accès restreint).

---

### 2. User Stories (Agile)

| ID | Description | Critères de succès majeurs |
| :--- | :--- | :--- |
| **US-01** | **Gestion des Rôles (RBAC)**<br>En tant qu'Admin, je veux déléguer la modération du chat à des "Modérateurs" qui ne doivent pas avoir accès aux fonctions financières ni aux données personnelles claires. | Masquage PII pour les non-admins. |
| **US-02** | **Gestion de Crise (Score Override)**<br>En tant qu'Admin, je veux corriger manuellement le score d'un match erroné et choisir la stratégie de régularisation (Rembourser vs Payer en double). | Pop-up de choix de stratégie lors de l'override. |
| **US-03** | **Service Client (Ajustement)**<br>En tant qu'Admin, je veux créditer des Coins à un joueur pour compenser un bug, avec une traçabilité totale. | Plafond de montant et logs obligatoires. |
| **US-04** | **Marketing Ciblé (Push)**<br>En tant qu'Admin, je veux envoyer des notifications uniquement aux fans d'une équipe spécifique. | Segmentation sur `favorite_team_id`. |
| **US-05** | **Sécurité d'Accès**<br>En tant que Système, je veux pouvoir forcer ou non la double authentification (2FA) selon la politique de sécurité en vigueur. | Paramétrable dans les configs globales. |

---

### 3. Maquettes / UI (Description Textuelle)

**Sidebar Navigation**
* Dashboard (KPIs: DAU, Revenus, Alertes).
* Matchs (Live & Correction).
* Utilisateurs (CRM).
* Marketing (Push Notifications).
* Sécurité (Logs & Admins).

**Vue "Gestion Match" (Action Critique)**
* Liste des matchs avec indicateur de source (API / MANUAL).
* Bouton **"Forcer le Résultat"** (Ouvre une Modale de Crise) :
    * Input : Score Domicile / Extérieur.
    * Toggle : "Verrouiller contre updates API" (Auto: ON).
    * Sélecteur Stratégie Recalcul :
        1.  *Rollback & Re-process* (Reprendre l'argent aux faux gagnants).
        2.  *House Loss* (Laisser les gains erronés et payer les nouveaux gagnants).

**Vue "Fiche Utilisateur" (Vue Modérateur vs Admin)**
* **Admin :** Voit tout (Email: `jean@gmail.com`, IP: `192.168.1.1`). Actions: Créditer, Ban Total.
* **Modérateur :** Voit masqué (Email: `j***@gmail.com`, IP: `***`). Actions: Ban Chat uniquement, Historique Chat.

---

### 4. Flux Fonctionnels

#### A. Cas Nominal : Override de Score (Gestion de Crise)
1.  L'Admin détecte une erreur (Score 1-0 au lieu de 1-1).
2.  Il active le mode "Override" sur le match.
3.  Il saisit "1-1" et choisit la stratégie (ex: **Rollback**).
4.  **Exécution Système :**
    * Flag `is_manually_locked = TRUE`.
    * **Phase 1 (Rollback) :** Identification des paris payés à tort sur "1-0". Débit des gains versés (Solde peut devenir négatif). Passage status `WON` -> `LOST`.
    * **Phase 2 (Re-process) :** Identification des paris sur "1-1". Crédit des gains. Passage status `PENDING/LOST` -> `WON`.
    * **Notification :** Envoi d'un push aux utilisateurs impactés ("Correction du résultat du match X").
5.  Log de l'action dans `Admin_Logs`.

#### B. Cas Nominal : Envoi Push Segmenté
1.  L'Admin rédige : "Le PSG a marqué !".
2.  Ciblage : "Fans du PSG" (Query sur `users.favorite_team_id`).
3.  Le système estime l'audience (ex: 12 400 devices).
4.  L'Admin valide.
5.  Le Job Queue traite l'envoi par lots (Batch processing).

#### C. Cas Nominal : Geste Commercial
1.  L'Admin accède au profil de "Jean".
2.  Clic "Ajustement Solde".
3.  Saisie : Montant (+100), Type (Crédit), Motif ("Bug display").
4.  Le système vérifie `Montant < PLAFOND_AUTORISE`.
5.  Crédit immédiat + Log.

---

### 5. Règles de Gestion (Business Rules)

| ID | Règle | Détail Technique |
| :--- | :--- | :--- |
| **RG-01** | **Hiérarchie & Masquage (PII)** | - **Admin :** Full Access.<br>- **Modérateur :** Read-Only sur Matchs/Users. PII (Email, Tel, IP, Nom) masquées par des astérisques. Pas d'accès aux fonctions financières. |
| **RG-02** | **Priorité Manuelle** | Une donnée modifiée manuellement a priorité absolue sur l'API. Le système ne doit plus écraser cette donnée lors des syncs API suivants. |
| **RG-03** | **Stratégies de Correction** | Deux modes configurables par l'admin au moment de l'action :<br>1. **Rollback (Strict) :** On annule les mouvements financiers précédents. Risque de solde négatif pour l'user.<br>2. **House Loss (User Friendly) :** On ne reprend pas l'argent distribué par erreur. On paie juste les "vrais" gagnants en plus. Coût pour la plateforme. |
| **RG-04** | **Sécurité 2FA** | Paramètre global `ENFORCE_ADMIN_2FA` (Bool). Si TRUE, aucun accès au BO sans validation OTP (Google Authenticator) à chaque session. Si FALSE, login/password suffit (Déconseillé). |
| **RG-05** | **Plafond Geste Commercial** | Un admin ne peut créditer plus de X Coins (ex: 5000) en une seule opération sans déclencher une alerte de sécurité critique envoyée aux autres Super Admins. |
| **RG-06** | **Audit Trail** | **Immuabilité :** Impossible de supprimer une ligne de log. Tout ajustement de solde ou changement de résultat est tracé (IP, AdminID, Diff Values). |

---

### 6. Données & Technique

**Table `admin_users`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `role` | ENUM | `SUPER_ADMIN`, `MODERATOR`. |
| `two_factor_secret` | VARCHAR | Clé secrète TOTP (Nullable). |
| `two_factor_enabled`| BOOLEAN | Statut 2FA individuel. |

**Table `admin_logs`**
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `admin_id` | UUID | Auteur. |
| `action` | VARCHAR | `MATCH_OVERRIDE`, `USER_CREDIT`, `USER_BAN`. |
| `target_id` | UUID | ID de l'objet touché. |
| `diff` | JSONB | `{"old": "1-0", "new": "1-1", "strategy": "ROLLBACK"}`. |
| `ip_address` | INET | IP de l'admin. |

---

### 7. Critères d'Acceptation (Gherkin)

```gherkin
Scenario: Modérateur consulte une fiche utilisateur
  Given Je suis connecté en tant que "Modérateur"
  When Je consulte le profil de "Jean"
  Then Son email s'affiche comme "j***@***.com"
  And Le bouton "Créditer Wallet" est invisible ou inactif

Scenario: Correction Match avec Rollback
  Given Le match a été validé à "1-0" et les gains payés
  When Je force le score à "1-1" avec la stratégie "ROLLBACK"
  Then Le solde des utilisateurs ayant parié "1-0" est débité (Annulation gain)
  And Le solde des utilisateurs ayant parié "1-1" est crédité (Nouveau gain)
  And Une notification d'excuse est envoyée

Scenario: Tentative crédit frauduleux
  Given Je suis Admin
  When Je tente de créditer 1 000 000 Coins à un ami
  Then Le système bloque l'action (Plafond dépassé)
  And Une alerte de sécurité est envoyée par email aux fondateurs
```

---

8. Diagramme de Séquence (Gestion de Crise - Override)
```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant BO as Back-Office
    participant Core as Backend Core
    participant DB as Database
    participant Wallet as Wallet Service

    Note over Admin, Wallet: Scénario : Correction Score 1-0 vers 1-1 (Rollback)

    Admin->>BO: Force Score "1-1" + Stratégie "ROLLBACK"
    BO->>Core: POST /admin/match/{id}/override
    
    Core->>DB: UPDATE matches SET score="1-1", locked=TRUE
    Core->>Core: Log Action (Audit Trail)

    par Annulation (Rollback)
        Core->>DB: Get Winners "1-0" (Faux Positifs)
        loop Pour chaque Faux Gagnant
            Core->>Wallet: Débiter(Montant Gain Précédent)
            Wallet-->>Core: OK (Solde peut être négatif)
            Core->>DB: Set Prono Status = LOST
        end
    and Validation (Correction)
        Core->>DB: Get Winners "1-1" (Vrais Gagnants)
        loop Pour chaque Vrai Gagnant
            Core->>Wallet: Créditer(Montant Gain)
            Core->>DB: Set Prono Status = WON
        end
    end

    Core-->>BO: Succès "Correction appliquée"
    BO-->>Admin: Toast Confirmation