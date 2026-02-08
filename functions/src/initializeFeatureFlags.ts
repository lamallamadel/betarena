import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

setGlobalOptions({ region: 'europe-west1' });

initializeApp();
const db = getFirestore();
const APP_ID = 'botola-v1';

interface FeatureFlagsConfig {
  debug_mode: boolean;
  experimental_features: {
    ultimate_fantazia: boolean;
    blitz_mode: boolean;
    marketplace: boolean;
    social_stories: boolean;
    voice_chat: boolean;
  };
  sync_intervals: {
    match_polling_seconds: number;
    leaderboard_refresh_seconds: number;
    chat_refresh_seconds: number;
    api_quota_check_minutes: number;
  };
  api_settings: {
    enable_api_calls: boolean;
    max_daily_calls: number;
    enable_caching: boolean;
    cache_ttl_minutes: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    allowed_users: string[];
  };
  last_updated: number;
  updated_by: string;
}

const DEFAULT_FLAGS: FeatureFlagsConfig = {
  debug_mode: false,
  experimental_features: {
    ultimate_fantazia: false,
    blitz_mode: false,
    marketplace: false,
    social_stories: true,
    voice_chat: false,
  },
  sync_intervals: {
    match_polling_seconds: 60,
    leaderboard_refresh_seconds: 30,
    chat_refresh_seconds: 5,
    api_quota_check_minutes: 15,
  },
  api_settings: {
    enable_api_calls: true,
    max_daily_calls: 100,
    enable_caching: true,
    cache_ttl_minutes: 60,
  },
  maintenance: {
    enabled: false,
    message: '',
    allowed_users: [],
  },
  last_updated: Date.now(),
  updated_by: 'system',
};

const DEV_FLAGS: FeatureFlagsConfig = {
  ...DEFAULT_FLAGS,
  debug_mode: true,
  experimental_features: {
    ultimate_fantazia: true,
    blitz_mode: true,
    marketplace: true,
    social_stories: true,
    voice_chat: false,
  },
  api_settings: {
    enable_api_calls: true,
    max_daily_calls: 100,
    enable_caching: true,
    cache_ttl_minutes: 30,
  },
};

const STAGING_FLAGS: FeatureFlagsConfig = {
  ...DEFAULT_FLAGS,
  debug_mode: false,
  experimental_features: {
    ultimate_fantazia: true,
    blitz_mode: false,
    marketplace: true,
    social_stories: true,
    voice_chat: false,
  },
  sync_intervals: {
    match_polling_seconds: 45,
    leaderboard_refresh_seconds: 30,
    chat_refresh_seconds: 5,
    api_quota_check_minutes: 15,
  },
};

const PROD_FLAGS: FeatureFlagsConfig = {
  ...DEFAULT_FLAGS,
  debug_mode: false,
  experimental_features: {
    ultimate_fantazia: false,
    blitz_mode: false,
    marketplace: false,
    social_stories: true,
    voice_chat: false,
  },
  sync_intervals: {
    match_polling_seconds: 60,
    leaderboard_refresh_seconds: 30,
    chat_refresh_seconds: 5,
    api_quota_check_minutes: 15,
  },
  api_settings: {
    enable_api_calls: true,
    max_daily_calls: 100,
    enable_caching: true,
    cache_ttl_minutes: 60,
  },
};

export const initializeFeatureFlags = onRequest(async (req, res) => {
  try {
    const environments = [
      { name: 'dev', flags: DEV_FLAGS },
      { name: 'staging', flags: STAGING_FLAGS },
      { name: 'prod', flags: PROD_FLAGS },
    ];

    const results = [];

    for (const env of environments) {
      const docRef = db
        .collection('artifacts')
        .doc(APP_ID)
        .collection('config')
        .doc('feature_flags')
        .collection('environments')
        .doc(env.name);

      const existingDoc = await docRef.get();

      if (!existingDoc.exists) {
        await docRef.set({
          environment: env.name,
          flags: env.flags,
        });
        results.push(`${env.name}: initialized`);
      } else {
        results.push(`${env.name}: already exists`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Feature flags initialization complete',
      results,
    });
  } catch (error) {
    console.error('[initializeFeatureFlags] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
