# Auth Mobile (React Native)

This app uses the same auth API as the web app. API base URL is set via `API_URL` (e.g. in a .env or react-native-config).

## Native projects (iOS / Android)

This scaffold includes only the JavaScript/TypeScript source. To generate the `ios/` and `android/` native projects, run from the **repository root**:

```
npx @react-native-community/cli init AuthMobile --directory apps --skip-install
```

If that creates `apps/AuthMobile`, move the contents of `apps/mobile/src` and `apps/mobile/App.tsx` into `apps/AuthMobile`, then use `apps/AuthMobile` as the React Native app folder. Alternatively, rename `AuthMobile` to `mobile` and merge any differing files.

Then from `apps/mobile` (or the generated folder):

- `npm install`
- iOS: `cd ios && pod install && cd ..` then `npm run ios`
- Android: `npm run android`
