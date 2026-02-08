# API Quota Monitoring Dashboard

## Vue d'ensemble

Le dashboard de monitoring API-Football permet aux administrateurs de surveiller en temps réel l'utilisation, les performances et les coûts associés aux appels API externes.

## Fonctionnalités

### Suivi de Quota

- **Quota journalier**: Affichage du quota utilisé vs disponible (100 req/jour gratuit)
- **Barre de progression visuelle**: Indicateur coloré (vert/orange/rouge) selon le niveau d'utilisation
- **Alertes automatiques**: Notification quand le quota atteint 70%, 90%, ou 100%

### Métriques Clés

1. **Quota Utilisé**: Nombre de requêtes consommées aujourd'hui
2. **Quota Restant**: Requêtes disponibles pour le reste de la journée  
3. **Moyenne Quotidienne**: Moyenne des requêtes sur les 30 derniers jours
4. **Coût Projeté**: Estimation mensuelle basée sur la moyenne actuelle

### Graphiques Interactifs (Recharts)

1. **Historique des Requêtes (30j)**: Area chart montrant total/succès/échecs
2. **Succès vs Échecs**: Bar chart comparant requêtes réussies et échouées
3. **Temps de Réponse Moyen**: Line chart du temps de réponse API (ms)
4. **Distribution Quota**: Pie chart de la répartition quota utilisé/restant
5. **Taux de Succès (7j)**: Bar chart du pourcentage de succès quotidien

### Projections de Coûts

- Calcul automatique du dépassement du quota gratuit
- Estimation du coût mensuel basé sur la tarification API-Football (~$50/10K requêtes)
- Conseils d'optimisation affichés en cas de dépassement prévu

## Architecture Technique

### Backend (Cloud Functions)

**Fichier**: `functions/src/sportsapi.ts`

#### Tracking automatique des appels API

```typescript
async function logApiCall(
    endpoint: string,
    success: boolean,
    responseTimeMs: number,
    statusCode?: number,
    errorMessage?: string,
    quotaHeaders?: { remaining?: number; limit?: number }
)
```

Chaque appel à l'API-Football est automatiquement tracké avec:
- Timestamp
- Endpoint appelé
- Succès/échec
- Code HTTP
- Headers de quota (x-ratelimit-requests-remaining, x-ratelimit-requests-limit)
- Temps de réponse en millisecondes

#### Collections Firestore

```
artifacts/{APP_ID}/admin/api_monitoring/
├── calls/{callId}           # Logs individuels de chaque appel
└── daily_stats/{YYYY-MM-DD}  # Agrégats quotidiens
```

#### Fonction Admin

```typescript
export const getApiQuotaStats = onCall(async (request) => {
    // Returns:
    // - 30 days of daily stats
    // - 100 most recent individual calls
    // - Aggregated summary (total, success rate, avg response time)
    // - Current quota status
})
```

### Frontend (React)

#### Hook: `useApiQuota()`

**Fichier**: `src/hooks/useAdmin.ts`

```typescript
export const useApiQuota = (): ApiQuotaData => {
    // Real-time subscription (onSnapshot) to daily_stats
    // Returns:
    // - dailyStats: Array of last 30 days
    // - currentQuota: { remaining, limit, used, usagePercent }
    // - loading: boolean
}
```

#### Component: `AdminDashboard.tsx`

**Fichier**: `src/components/admin/AdminDashboard.tsx`

Dashboard complet avec:
- 4 KPI cards (quota utilisé, restant, moyenne, coût)
- Barre de progression avec code couleur
- 5 graphiques recharts interactifs
- Alerte de dépassement de quota gratuit
- Design responsive (Tailwind CSS grid)

## Données Trackées

### Par Appel API

```typescript
interface ApiQuotaLog {
    timestamp: FirebaseTimestamp;
    endpoint: string;                  // ex: "/fixtures", "/odds"
    success: boolean;
    status_code?: number;              // Code HTTP
    error_message?: string;            // Si échec
    requests_remaining?: number;        // Quota restant (header API)
    requests_limit?: number;           // Quota total (header API)
    response_time_ms: number;          // Temps de réponse
    date_key: string;                  // YYYY-MM-DD (pour agrégation)
}
```

### Agrégats Quotidiens

```typescript
interface ApiDailyStats {
    date: string;                      // YYYY-MM-DD
    total_calls: number;               // Nombre total de requêtes
    successful_calls: number;          // Requêtes réussies
    failed_calls: number;              // Requêtes échouées
    total_response_time: number;       // Somme (pour calcul moyenne)
    last_remaining?: number;           // Dernier quota restant observé
    last_limit?: number;               // Dernière limite observée
    last_updated?: FirebaseTimestamp;
}
```

## Règles de Sécurité Firestore

```javascript
match /artifacts/{appId}/admin/api_monitoring/{document=**} {
  allow read: if request.auth != null;  // Admins authentifiés
  allow write: if false;                // Seules les Cloud Functions peuvent écrire
}
```

## Index Firestore Requis

```json
{
  "indexes": [
    {
      "collectionGroup": "daily_stats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "calls",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "calls",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date_key", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Optimisations Recommandées

### 1. Cache Local
Éviter les appels répétés pour les mêmes données (fixtures, standings).

### 2. Polling Réduit
Augmenter l'intervalle de rafraîchissement:
- Match en cours: 60s → 120s
- Fixtures pre-match: 5min → 15min

### 3. Batch Requests
Grouper les requêtes fixtures par league au lieu de multiples appels individuels.

### 4. Conditional Requests
Utiliser les headers HTTP ETag/If-Modified-Since pour éviter les téléchargements inutiles.

### 5. Priorisation
En cas de quota bas (>80%), limiter les requêtes non-critiques:
- Odds (pas critique pour résolution)
- Lineups (optionnel pour affichage)
- Standings (peut être caché 1h)

## Alertes & Notifications

| Seuil | Couleur | Action |
|-------|---------|--------|
| **<70%** | 🟢 Vert | Normal - pas d'action |
| **70-90%** | 🟡 Jaune | Warning - alerte dashboard |
| **>90%** | 🔴 Rouge | Critique - recommandations affichées |
| **100%** | ⛔ Rouge | Blocage temporaire des appels non-critiques |

### Message de dépassement gratuit

Quand la moyenne quotidienne dépasse 100 req/jour, une alerte jaune affiche:

```
⚠️ Alerte Dépassement Quota Gratuit

Avec une moyenne de 125 requêtes/jour, vous dépasserez le quota gratuit (100/jour). 
Coût estimé: $18/mois

💡 Conseil: Optimisez les appels API en utilisant le cache local et réduisez 
la fréquence de polling.
```

## Calcul des Coûts

### Tarification API-Football (2025)

| Plan | Requêtes/jour | Prix/mois |
|------|---------------|-----------|
| **Free** | 100 | $0 |
| **Basic** | 750 | $10 |
| **Professional** | 3000 | $50 |
| **Enterprise** | 10000+ | Sur mesure |

### Formule de Projection

```typescript
const avgDailyCalls = totalCallsLast30Days / 30;
const projectedMonthlyCalls = avgDailyCalls * 30;
const freeLimit = 100 * 30; // 3000 req/mois

if (projectedMonthlyCalls > freeLimit) {
    const overageRequests = projectedMonthlyCalls - freeLimit;
    const estimatedCost = Math.round((overageRequests / 10000) * 50);
    // Afficher l'alerte avec le coût
}
```

## Utilisation

### Accès au Dashboard

1. Se connecter en tant qu'admin
2. Naviguer vers: `/?admin=true`
3. Le dashboard affiche automatiquement la section "API-Football Monitoring"

### Interprétation des Graphiques

#### Historique des Requêtes
- **Ligne verte**: Total des requêtes quotidiennes
- **Ligne bleue**: Requêtes réussies
- **Tendance**: Détecte les pics d'utilisation (jours de match)

#### Succès vs Échecs
- **Vert**: Requêtes réussies (taux cible: >95%)
- **Rouge**: Échecs (surveiller les pics)

#### Temps de Réponse
- **Cible**: <500ms pour une bonne UX
- **Surveillance**: Détecter les ralentissements API

#### Distribution Quota
- Visualisation instantanée de la consommation journalière

## Maintenance

### Nettoyage des Logs

Les logs individuels (`calls` collection) peuvent être nettoyés après 90 jours:

```typescript
// Cloud Function de nettoyage (à planifier mensuellement)
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 90);

const oldCalls = await db.collection('artifacts')
    .doc(APP_ID)
    .collection('admin').doc('api_monitoring')
    .collection('calls')
    .where('timestamp', '<', cutoffDate)
    .get();

// Batch delete
```

Les agrégats quotidiens (`daily_stats`) doivent être conservés indéfiniment pour l'analyse historique.

## Dépendances

- **recharts**: ^3.7.0 (graphiques React)
- **lucide-react**: ^0.563.0 (icônes)
- **firebase**: ^12.9.0 (Firestore real-time)
- **tailwindcss**: ^4.1.18 (styling)

## Fichiers Modifiés

1. **Frontend**:
   - `src/components/admin/AdminDashboard.tsx` (dashboard principal)
   - `src/hooks/useAdmin.ts` (hook `useApiQuota()`)
   - `package.json` (ajout recharts)

2. **Backend**:
   - `functions/src/sportsapi.ts` (tracking + fonction `getApiQuotaStats`)
   - `functions/src/index.ts` (export fonction)

3. **Configuration**:
   - `firestore.rules` (règles de sécurité)
   - `firestore.indexes.json` (index quotas)

## Roadmap Future

### Phase 2 (Q2 2025)
- Alertes email/push quand quota >90%
- Export CSV des stats pour analyse externe
- Dashboard API-Football officiel embed (si dispo)
- Comparaison mois-à-mois des coûts

### Phase 3 (Q3 2025)
- Machine Learning: prédiction de consommation
- Auto-scaling: réduire automatiquement le polling si quota bas
- Multi-provider: fallback vers API alternative si quota épuisé

## Support

Pour toute question sur cette fonctionnalité:
- Consulter: `AGENTS.md` (section API-Football)
- Logs: `functions/logs` (Firebase Console)
- Monitoring: Dashboard Admin (`/?admin=true`)
