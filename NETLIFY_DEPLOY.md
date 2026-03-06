# Deploying to Netlify (with Firebase config)

`config.js` is not in the repo (it contains secrets). On Netlify, the app is built from env vars so the deployed site gets a `config.js` at build time.

## 1. Environment variables in Netlify

In **Netlify** → your site → **Site configuration** → **Environment variables**, add:

| Variable | Value | Required |
|----------|--------|----------|
| `FIREBASE_API_KEY` | Your Firebase web API key | Yes |
| `FIREBASE_AUTH_DOMAIN` | e.g. `thomas-egerton-quiz.firebaseapp.com` | Yes |
| `FIREBASE_DATABASE_URL` | e.g. `https://thomas-egerton-quiz-default-rtdb.europe-west1.firebasedatabase.app` | Yes |
| `FIREBASE_PROJECT_ID` | e.g. `thomas-egerton-quiz` | Yes |
| `FIREBASE_STORAGE_BUCKET` | e.g. `thomas-egerton-quiz.firebasestorage.app` | Yes |
| `FIREBASE_MESSAGING_SENDER_ID` | From Firebase config | Yes |
| `FIREBASE_APP_ID` | From Firebase config | Yes |
| `FIREBASE_MEASUREMENT_ID` | From Firebase config (optional) | No |
| `ADMIN_PASSWORD` | Your quiz admin password | Yes |

Use the same values as in your local `config.js` (from Firebase Console → Project settings → Your apps).

## 2. Build settings in Netlify

- **Build command:** `node scripts/build-config.js`  
  (or `npm run build` if you prefer)
- **Publish directory:** `.`  
  (or leave as default if it’s the repo root)
- **Base directory:** leave empty unless the app lives in a subfolder

The build step generates `config.js` from the env vars; the rest of the site is static and needs no build.

## 3. Deploy

Trigger a new deploy (or push to the connected branch). After the deploy, the site should show **Connected** and work with Firebase.

## 4. API key restrictions

In **Google Cloud Console** → **APIs & Services** → **Credentials** → your API key, under **Application restrictions** → **HTTP referrers**, add:

- `https://thomas-egerton-quiz.netlify.app/*`
- `https://*.netlify.app/*`  
  (if you use branch deploys or other Netlify URLs)

Save. The app will then be allowed to use the key on Netlify.
