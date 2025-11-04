## LiftLog Mobile (gym_bro)

A lightweight workout tracker built with Expo + React Native, featuring offline-first storage (SQLite), optional Supabase auth/sync, progress charts, import/export to XLSX, and a clean tab-based UI.

### Features

- **Workout logging**: Exercises, sets, reps, weight, RPE, and notes
- **Library**: Manage exercises with primary muscle groups and equipment
- **Progress**: Charts via `victory-native`
- **Offline-first**: Local database using `expo-sqlite`
- **Cloud sync (optional)**: Supabase auth and API
- **Import/Export**: XLSX import/export utilities
- **Theming/Units**: Light/dark (system) and kg/lb conversion

### Tech Stack

- **Runtime/UI**: Expo 51, React Native 0.74, React 18, Expo Router
- **State/Forms**: React Query, React Hook Form, Zod
- **Storage**: `expo-sqlite`
- **Auth/Backend**: Supabase JS + `@supabase/auth-helpers-react-native`
- **Charts**: `victory-native`
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or pnpm/yarn)
- Expo CLI (installed via `npx` is fine)
- One of: Expo Go app on device, Android Studio emulator, or Xcode/iOS Simulator

On Windows, you can install the basics with:

```powershell
# Install Node LTS
winget install -e --id OpenJS.NodeJS.LTS

# Verify
node -v
npm -v

# Install Android Studio (for emulator, SDKs, adb)
winget install -e --id Google.AndroidStudio

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + `
            [System.Environment]::GetEnvironmentVariable("Path","User")


# After installing Android Studio:
# - Open Android Studio > More Actions > SDK Manager
# - Install: Android SDK Platform, Build-Tools, Android SDK Command-line Tools, and an emulator image
# - Tools > Device Manager > Create a virtual device (AVD)

# Expo CLI is used via npx (no global install needed)
npx expo --version
```

### Installation

```bash
npm install
```

### Environment Variables (for Supabase)

If you plan to use Supabase auth/sync, create a `.env` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Expo automatically exposes variables prefixed with `EXPO_PUBLIC_`. The app reads these in `src/supabase.ts`.

### Run the App

- Start the Metro bundler:

```bash
npm run start
```

- Launch a target:

```bash
npm run android   # Android device/emulator
npm run ios       # iOS simulator (macOS + Xcode)
npm run web       # Web (experimental)
```

On Windows, ensure Android SDK/emulator is configured if targeting Android locally.

## Project Structure

```text
app/                  # Expo Router screens and layouts
  (auth)/             # Auth flows (e.g., login)
  (tabs)/             # Tab navigator: home, library, progress, settings
  workout/[id].tsx    # Workout detail
src/
  context/AuthProvider.tsx
  providers/AppProvider.tsx
  db.ts               # SQLite schema, migrations, seed
  supabase.ts         # Supabase client setup
  services/
    import.ts         # XLSX import
    export.ts         # XLSX export
  utils/
    units.ts          # kg/lb conversion
    units.test.ts     # Vitest tests for units
    uuid.ts
app.json              # Expo app config
babel.config.js
package.json
tsconfig.json
vitest.config.ts
```

## Development

### Scripts

```bash
npm run start    # Start Expo bundler
npm run android  # Build & run Android
npm run ios      # Build & run iOS
npm run web      # Run in web
npm test         # Run Vitest
```

### Testing

```bash
npm test
```

Vitest is configured via `vitest.config.ts`. Example tests live in `src/utils/units.test.ts`.

### Linting/Formatting

If you use an editor formatter (e.g., Prettier/ESLint), align with the project’s TypeScript configuration. No strict linters are included by default.

## Data & Sync

- **Local DB**: `src/db.ts` creates and migrates `liftlog.db` in `expo-sqlite` on first run.
- **Seed Data**: A small exercise set is inserted on first run for convenience.
- **Settings**: Stored in `app_settings` (unit, theme, cloud sync enabled).
- **Supabase**: Provide `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to enable auth/session. Secure storage uses Expo Secure Store.

## Import/Export

- Import and export utilities are in `src/services/{import,export}.ts` for working with `.xlsx` data. These run on-device via Expo File System and Sharing.

## Troubleshooting

- If bundler can’t find env vars, confirm they start with `EXPO_PUBLIC_` and restart `npm run start`.
- Android build issues on Windows often stem from Java/SDK/NDK setup—open Android Studio once to install required components.
- Clear Metro/Expo cache if weird behavior persists:

```bash
expo start -c
```

## Contributing

1. Create a feature branch
2. Make your changes with clear, readable TypeScript
3. Add/adjust tests where reasonable
4. Open a PR

## License

MIT
