require('dotenv').config();

module.exports = {
  expo: {
    name: 'bACE CAMP',
    slug: 'bace-camp-project',
    version: '1.0.0',
    orientation: 'portrait',
    sdkVersion: '54.0.0',
    platforms: ['ios', 'android', 'web'],
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ['**/*'],
    ios: { supportsTablet: true },
    extra: {
      firebaseApiKey:           process.env.FIREBASE_API_KEY,
      firebaseAuthDomain:       process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId:        process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket:    process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId:            process.env.FIREBASE_APP_ID,
      openaiApiKey:             process.env.OPENAI_API_KEY,
    },
  },
};
