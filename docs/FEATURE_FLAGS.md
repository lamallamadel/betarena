# Feature Flags System

## Vue d'ensemble

Le système de Feature Flags de BetArena permet de contrôler dynamiquement les fonctionnalités, les paramètres de synchronisation et la maintenance de l'application sans nécessiter de redéploiement. Le système est géré via Firestore et accessible depuis l'interface d'administration.

## Architecture

### Structure Firestore

```
artifacts/
  botola-v1/
    config/
      feature_flags/
        environments/
          dev/
            environment: "dev"
            flags: { ...FeatureFlagsConfig }
          staging/
            environment: "staging"
            flags: { ...FeatureFlagsConfig }
          prod/
            environment: "prod"
            flags: { ...FeatureFlagsConfig }
        logs/
          {logId}/
            environment: "dev" | "staging" | "prod"
            changed_by: string (userId)
            changed_by_name: string
            changes: object
            timestamp: timestamp
```

### Configuration des Flags

```typescript
interface FeatureFlagsConfig {
  // Mode Debug
  debug_mode: boolean;

  // Fonctionnalités Expérimentales
  experimental_features: {
    ultimate_fantazia: boolean;  // Module Ultimate Fantazia (gestion d'équipe)
    blitz_mode: boolean;          // Mode Blitz 5
    marketplace: boolean;         // Marché de cartes
    social_stories: boolean;      // Stories sociales
    voice_chat: boolean;          // Chat vocal
  };

  // Intervalles de Synchronisation (en secondes/minutes)
  sync_intervals: {
    match_polling_seconds: number;        // Polling des matchs (défaut: 60)
    leaderboard_refresh_seconds: number;  // Refresh leaderboard (défaut: 30)
    chat_refresh_seconds: number;         // Refresh chat (défaut: 5)
    api_quota_check_minutes: number;      // Vérification quota API (défaut: 15)
  };

  // Paramètres API
  api_settings: {
    enable_api_calls: boolean;      // Activer les appels API
    max_daily_calls: number;        // Limite quotidienne (défaut: 100)
    enable_caching: boolean;        // Activer le cache
    cache_ttl_minutes: number;      // TTL du cache (défaut: 60)
  };

  // Mode Maintenance
  maintenance: {
    enabled: boolean;              // Activer la maintenance
    message: string;               // Message affiché
    allowed_users: string[];       // UIDs autorisés pendant maintenance
  };

  // Métadonnées
  last_updated: number;
  updated_by: string;
}
```

## Environnements

Le système supporte 3 environnements :

- **dev** : Développement local (localhost, 127.0.0.1)
- **staging** : Environnement de staging (sous-domaine staging)
- **prod** : Production (domaine principal)

L'environnement est détecté automatiquement au démarrage de l'application.

## Utilisation

### 1. Dans les Composants React

```typescript
import { useFeatureFlag } from '../hooks/useFeatureFlag';

function MyComponent() {
  const { isEnabled, flags, getPollingInterval } = useFeatureFlag();

  // Vérifier si une feature est activée
  if (isEnabled('marketplace')) {
    // Afficher le marketplace
  }

  // Obtenir un intervalle de polling
  const pollingInterval = getPollingInterval('match'); // en ms

  // Accéder directement aux flags
  const debugMode = flags.debug_mode;
  const apiSettings = flags.api_settings;
}
```

### 2. Vérification du Mode Maintenance

```typescript
import { useFeatureFlag } from '../hooks/useFeatureFlag';

function App() {
  const { checkMaintenanceMode, flags } = useFeatureFlag();
  const { user } = useAuth();

  // Vérifier si l'application est en maintenance
  const inMaintenance = checkMaintenanceMode(user?.uid);

  if (inMaintenance) {
    return <MaintenanceMode message={flags.maintenance.message} />;
  }

  // Rendu normal
}
```

### 3. Depuis l'Admin Dashboard

1. Accéder à l'interface admin : `/?admin=true`
2. Naviguer vers l'onglet "Feature Flags"
3. Sélectionner l'environnement (Dev, Staging, Prod)
4. Modifier les flags via les toggles et inputs
5. Cliquer sur "Enregistrer" pour appliquer les changements

## Fonctionnalités de l'Interface Admin

### Sections de Configuration

1. **Mode Debug**
   - Active les logs détaillés
   - Outils de développement supplémentaires

2. **Fonctionnalités Expérimentales**
   - Toggles pour activer/désactiver les features en beta
   - Ultimate Fantazia, Blitz Mode, Marketplace, etc.

3. **Intervalles de Synchronisation**
   - Ajuster les fréquences de polling
   - Optimiser la charge serveur vs. latence UX

4. **Paramètres API**
   - Activer/désactiver les appels API
   - Configurer le cache et les limites
   - Réduction des coûts API

5. **Mode Maintenance**
   - Bloquer l'accès à l'application
   - Message personnalisé
   - Liste blanche d'utilisateurs autorisés

6. **Historique des Modifications**
   - Log de tous les changements
   - Horodatage et auteur
   - Détails des modifications

### Indicateurs Visuels

- **Badge "Modifications non enregistrées"** : Affiché si des changements locaux ne sont pas sauvegardés
- **Message de succès** : Confirmation après sauvegarde
- **Alertes d'erreur** : En cas d'échec de sauvegarde

## Sécurité

### Règles Firestore

```javascript
// Lecture : tous les utilisateurs authentifiés
match /artifacts/{appId}/config/feature_flags/environments/{environment} {
  allow read: if request.auth != null;
  allow write: if request.auth != null; // TODO: Ajouter vérification rôle admin
}

// Logs : lecture admin uniquement, création admin
match /artifacts/{appId}/config/feature_flags/logs/{logId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null; // TODO: Ajouter vérification rôle admin
  allow update, delete: if false;
}
```

**⚠️ TODO** : Implémenter la vérification des rôles admin dans les règles Firestore.

## Bonnes Pratiques

### 1. Gestion des Environnements

- **Dev** : Tester les nouvelles features
- **Staging** : Validation avant prod
- **Prod** : Configuration stable et optimisée

### 2. Intervalles de Synchronisation

- **Matchs en direct** : 30-60 secondes (balance entre fraîcheur et quota API)
- **Leaderboard** : 30 secondes (pas besoin d'updates temps réel)
- **Chat** : 3-5 secondes (expérience temps réel)
- **Quota API** : 15 minutes (monitoring suffisant)

### 3. Mode Maintenance

- Toujours inclure un message clair
- Ajouter les UIDs admin à la liste blanche
- Planifier la maintenance aux heures creuses

### 4. Features Expérimentales

- Activer progressivement par environnement
- Monitorer les performances après activation
- Rollback rapide en cas de problème

## Monitoring

### Logs des Changements

Tous les changements de feature flags sont automatiquement loggés avec :

- Environnement concerné
- Utilisateur qui a fait le changement
- Timestamp
- Détails des modifications (avant/après)

### Accès aux Logs

Via l'interface admin, section "Historique des Modifications" (toggle pour afficher).

## API de Référence

### Hooks

#### `useFeatureFlag()`

Hook principal pour accéder aux feature flags.

**Retourne :**
```typescript
{
  flags: FeatureFlagsConfig;
  loading: boolean;
  environment: Environment;
  isEnabled: (feature: string) => boolean;
  checkMaintenanceMode: (userId?: string) => boolean;
  getPollingInterval: (type: string) => number;
  isDebugMode: boolean;
  apiSettings: ApiSettings;
}
```

### Fonctions Utilitaires

#### `isFeatureEnabled(flags, feature)`

Vérifie si une fonctionnalité expérimentale est activée.

**Paramètres :**
- `flags: FeatureFlagsConfig`
- `feature: keyof FeatureFlagsConfig['experimental_features']`

**Retourne :** `boolean`

#### `isMaintenanceMode(flags, userId?)`

Vérifie si l'application est en mode maintenance pour un utilisateur donné.

**Paramètres :**
- `flags: FeatureFlagsConfig`
- `userId?: string`

**Retourne :** `boolean`

## Dépannage

### Les changements ne sont pas appliqués

1. Vérifier que vous avez cliqué sur "Enregistrer"
2. Vérifier le badge "Modifications non enregistrées"
3. Consulter les logs d'erreur dans la console
4. Vérifier les permissions Firestore

### Mode Maintenance ne fonctionne pas

1. Vérifier que `maintenance.enabled` est `true`
2. Vérifier que l'UID de l'utilisateur n'est pas dans `allowed_users`
3. S'assurer que l'admin dashboard utilise `?admin=true` pour bypass

### Feature Flag ne s'applique pas

1. Vérifier que le bon environnement est sélectionné
2. Recharger la page (les flags sont en temps réel via Firestore)
3. Vérifier que le code utilise correctement `useFeatureFlag()`

## Roadmap

### Prochaines Améliorations

- [ ] Ajouter la vérification des rôles admin dans Firestore Rules
- [ ] Implémenter un système de feature flags A/B testing
- [ ] Ajouter des métriques d'utilisation des features
- [ ] Interface de rollback rapide
- [ ] Notifications push lors de changements critiques
- [ ] Export/Import de configurations
- [ ] Templates de configuration par environnement

## Références

- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Spec Technique BetArena](./specs.draft-v1.md)
- [API Monitoring](./API_MONITORING.md)
