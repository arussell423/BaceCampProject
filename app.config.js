require('dotenv').config();

module.exports = {
  expo: {
    name: 'bACE CAMP',
    slug: 'bace-camp-project',
    version: '1.0.0',
    orientation: 'portrait',
    sdkVersion: '54.0.0',
    platforms: ['ios', 'android', 'web'],
    updates: {
      url: 'https://u.expo.dev/d8d783ce-6cc0-4774-88db-00e82778910a',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: { policy: 'appVersion' },
    assetBundlePatterns: ['**/*'],
    ios: { supportsTablet: true },
    extra: {
      eas: { projectId: 'd8d783ce-6cc0-4774-88db-00e82778910a' },
      firebaseApiKey:            process.env.FIREBASE_API_KEY,
      firebaseAuthDomain:        process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId:         process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId:             process.env.FIREBASE_APP_ID,
      openaiApiKey:              process.env.OPENAI_API_KEY,
    },
  },
};
