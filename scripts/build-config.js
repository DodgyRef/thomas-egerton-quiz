/**
 * Build config.js from environment variables (e.g. on Netlify).
 * Set these in your host's dashboard (Netlify → Site settings → Environment variables):
 *   FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_DATABASE_URL, FIREBASE_PROJECT_ID,
 *   FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID,
 *   ADMIN_PASSWORD
 *
 * Build command on Netlify: node scripts/build-config.js
 * (Or add to your build: "npm run build" with "build": "node scripts/build-config.js" in package.json)
 */
const fs = require('fs');
const path = require('path');

const apiKey = process.env.FIREBASE_API_KEY;
if (!apiKey) {
  console.log('FIREBASE_API_KEY not set – skipping config.js (use local config.js for dev)');
  process.exit(0);
}

const config = {
  apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
};

const adminPassword = process.env.ADMIN_PASSWORD || '';

const out = `/**
 * Generated from environment variables (do not commit real values).
 */
window.firebaseConfig = ${JSON.stringify(config, null, 2)};
window.ADMIN_PASSWORD = ${JSON.stringify(adminPassword)};
`;

const outPath = path.join(__dirname, '..', 'config.js');
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote config.js from environment variables.');
