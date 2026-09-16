# Mobile deployment handoff

This repository contains only the Expo/React Native student application. It consumes the standalone API and opens the standalone web Store for purchases.

## Required production configuration

Set these values in the build environment before creating a release build:

```text
EXPO_PUBLIC_API_BASE_URL=https://api.example.com/api
EXPO_PUBLIC_STORE_BASE_URL=https://www.example.com
EXPO_PUBLIC_ALLOW_SCREEN_CAPTURE=false
EXPO_PUBLIC_EAS_PROJECT_ID=<Expo project UUID>
```

`EXPO_PUBLIC_*` values are embedded in the client and must never contain secrets. The API URL must include `/api`. Both public URLs must use HTTPS.

Remote push notifications require a project-owned development/production build, a configured Expo/EAS project ID, and the appropriate Android FCM/iOS APNs credentials. Expo Go is intentionally not used for production notification verification.

## Release gate

From a clean checkout of the approved release commit:

```powershell
npm ci
npx tsc --noEmit
npx expo export --platform web
```

Before the first store build, link the repository to the correct Expo organization/project and commit the resulting EAS project configuration. Do not invent or reuse another application's project ID, signing key, package name, or notification credentials.

## Device smoke checks

Use a release build against the production API and verify:

- account creation, email OTP, login, refresh, logout, and single-device enforcement;
- Store deep links and paid-resource redirects;
- Notes, protected PDF/image viewing, progress, Practice, Tracker, Library, and receipts;
- push-token registration and receipt of a test notification;
- generated Monthly Report view-only access;
- forced logout after account/device revocation.

Do not publish the mobile build until the API health check, web Store, background worker, email provider, storage provider, and push configuration are live.

## Rollback

Roll back by promoting the previous signed application build through the store's supported release mechanism. A mobile rollback must not reverse database migrations or alter entitlements/orders.
