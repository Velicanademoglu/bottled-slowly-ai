# PROJECT STAR - Mobile Store Publishing Guide

This guide explains how to build and publish the iOS and Android apps generated from the Capacitor wrapper.

## Prerequisites

- Node.js 20+ and npm
- Android Studio (for Android builds)
- Xcode 15+ and CocoaPods (for iOS builds, macOS only)
- Apple Developer Program membership ($99/year)
- Google Play Developer account ($25 one-time)

## Project Structure

```
frontend/
  android/          # Android Studio project
  ios/              # Xcode project
  resources/        # Source icon and splash images
  capacitor.config.ts
```

## Environment Variables

Create `frontend/.env.production`:

```
VITE_API_URL=https://api.projectstar.app
VITE_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

## Build Web Assets

```bash
cd frontend
npm install
npm run build
npx cap sync
```

## Android Build and Release

1. Open `frontend/android` in Android Studio.
2. Generate a signing keystore (only once):
   ```bash
   keytool -genkey -v -keystore projectstar.keystore -alias projectstar -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Place the keystore in `frontend/android/app/` and create `keystore.properties`:
   ```properties
   storeFile=projectstar.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=projectstar
   keyPassword=YOUR_KEY_PASSWORD
   ```
4. In Android Studio: Build > Generate Signed Bundle / APK > Android App Bundle (.aab).
5. Upload the `.aab` file to Google Play Console.

## iOS Build and Release

1. Open `frontend/ios/App/App.xcworkspace` in Xcode (macOS required).
2. Select the App target and set:
   - Bundle Identifier: `app.projectstar.mobile`
   - Team: Your Apple Developer Team
   - Signing & Capabilities: Automatic signing
3. Add In-App Purchase capability.
4. Add Push Notifications capability.
5. Archive the app: Product > Archive.
6. Upload to App Store Connect via Organizer.

## Store Listing Checklist

### Google Play

- App name: PROJECT STAR
- Short description: Send messages into the universe and discover people around the world.
- Full description: Use the product spec summary.
- Screenshots: Space, Create, Discoveries, Chat, Profile, Store.
- Feature graphic: 1024x500.
- App icon: 512x512.
- Privacy policy URL: `https://projectstar.app/privacy`
- Terms of service URL: `https://projectstar.app/terms`
- Content rating: Social networking / Dating / Communication.
- Target audience: Adults 18+.
- Data safety form: fill location, personal info, messages, photos.

### App Store

- App name: PROJECT STAR
- Subtitle: Messages across the universe.
- Description: Use the product spec summary.
- Keywords: message, penpal, friends, chat, discovery, space, social.
- Screenshots: iPhone 6.7" and 6.5".
- App Store privacy details: data linked to you, data used for tracking.
- App Store privacy nutrition labels: Contact Info, User Content, Identifiers.
- Sign in with Apple is required if other third-party sign-in is offered.

## In-App Purchases

Create the following products in both stores before release:

### Consumables

| Product ID | Title | Price Tier |
|------------|-------|------------|
| stardust_100 | 100 Stardust | $0.99 |
| stardust_500 | 500 Stardust | $4.99 |
| stardust_1200 | 1200 Stardust | $9.99 |
| stardust_3000 | 3000 Stardust | $19.99 |
| boost_message_1 | Message Boost | $1.99 |
| boost_profile_1 | Profile Visibility Boost | $1.99 |
| extra_cast_1 | Extra Cast | $0.99 |

### Subscriptions

| Product ID | Title | Price Tier |
|------------|-------|------------|
| premium_weekly | PROJECT STAR Premium Weekly | $2.99 |
| premium_monthly | PROJECT STAR Premium Monthly | $4.99 |
| premium_yearly | PROJECT STAR Premium Yearly | $39.99 |

## Backend Production Setup

- Use PostgreSQL instead of SQLite.
- Deploy backend to a VPS or cloud provider (AWS, Google Cloud, Azure, Heroku, Railway, etc.).
- Set `DATABASE_URL` to PostgreSQL connection string.
- Set `JWT_SECRET` to a strong random value.
- Set `FRONTEND_URL` to the production web domain.
- Configure SMTP for email verification and password reset.
- Configure Apple and Google receipt validation servers before enabling real IAP.

## Security Notes

- Never commit `keystore.properties` or `.keystore` files.
- Keep `JWT_SECRET`, `SMTP_PASSWORD`, and cloud credentials in environment variables.
- Validate all in-app purchase receipts on the backend before granting currency.

## Post-Launch

- Monitor crash reports (Firebase Crashlytics, Xcode Organizer).
- Track revenue and conversion in App Store Connect and Google Play Console.
- Add attribution and analytics (Firebase, Amplitude, Mixpanel).
