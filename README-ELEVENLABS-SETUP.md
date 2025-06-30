# ElevenLabs Setup Instructions

## Step 1: Get ElevenLabs API Key
1. Go to [ElevenLabs](https://elevenlabs.io/) and create an account
2. Navigate to your profile settings and copy your API key

## Step 2: Configure Firebase Functions
1. Install Firebase CLI if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init functions
   ```

4. Set the ElevenLabs API key in Firebase Functions config:
   ```bash
   firebase functions:config:set elevenlabs.api_key="YOUR_ELEVENLABS_API_KEY_HERE"
   ```

## Step 3: Deploy Firebase Functions
1. Navigate to the functions directory and install dependencies:
   ```bash
   cd functions
   npm install
   cd ..
   ```

2. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

3. After deployment, Firebase will show you the function URL. It will look like:
   ```
   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net
   ```

## Step 4: Update Environment Variables
1. Copy the Firebase Functions base URL from the deployment output
2. Update your `.env` file with the correct URL:
   ```
   VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net
   ```

## Step 5: Restart Development Server
```bash
npm run dev
```

## Testing
Once configured, the speech generation should work properly in your application.