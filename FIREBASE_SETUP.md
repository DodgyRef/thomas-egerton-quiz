# Firebase Setup Guide

## 🔥 Firebase Configuration Steps

### Step 1: Create Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it: `thomas-egerton-quiz`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Realtime Database
1. In your Firebase project, click "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for now)
4. Select a location (choose closest to you)
5. Click "Done"

### Step 3: Get Configuration
1. Click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register app name: `thomas-egerton-quiz`
5. Click "Register app"
6. Copy the `firebaseConfig` object

### Step 4: Update Your Code
Replace the placeholder config in `index.html` (lines 15-23) with your real config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-actual-app-id"
};
```

### Step 5: Set Database Rules
1. Go to "Realtime Database" → "Rules"
2. Replace the rules with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. Click "Publish"

## 🚀 How It Works

### Controller Device (Your Phone)
- Login with password: `tequiz2025`
- Becomes the "controller"
- Can click spin buttons
- Controls the game for everyone

### Viewer Devices (Everyone Else)
- No login required
- See synchronized animations
- Hear audio announcements
- View results in real-time

### Sync Features
- ✅ **Spinning animations** sync across all devices
- ✅ **Results** appear simultaneously
- ✅ **Audio** plays on all devices
- ✅ **Mode switching** syncs (quiz ↔ raffle)
- ✅ **Status indicators** show connection state

## 📱 Usage
1. **Deploy to Netlify** with your Firebase config
2. **Share the URL** with everyone
3. **Login on your phone** to become controller
4. **Everyone else** just opens the URL
5. **Click spin** on your phone → everyone sees it!

## 🔧 Troubleshooting
- **Red "Disconnected"**: Check Firebase config
- **Can't claim controller**: Another device is already controller
- **No sync**: Check internet connection
- **Audio issues**: Ensure audio files are uploaded

## 💰 Cost
- **Free tier**: 100 concurrent connections
- **Perfect for pub use**: No charges expected
- **Upgrade only if**: You need 100+ simultaneous users
