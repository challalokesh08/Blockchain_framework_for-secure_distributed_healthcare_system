HealthLedger Mobile (Expo)

Run locally (requires Node.js and Expo CLI / or use `npx expo`):

Install deps:

```bash
cd mobile
npm install
```

Start Metro and open on device/emulator:

```bash
npx expo start
```

Notes:
- The mobile app points to the local development server at `http://10.0.2.2:4000` (Android emulator). Adjust `mobile/src/api.js` for different hosts or when deployed.
- This is a minimal scaffold; add secure storage for tokens and better error handling before production.
