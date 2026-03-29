# Farmchainx Multi-Language Support Implementation

## Overview
The Farmchainx portal now supports multiple Indian languages with real-time language switching. Farmers can select their preferred language in the Settings → Preferences section, and the entire portal interface will change to that language.

## Supported Languages
- 🇮🇳 English (India) - `en-IN`
- 🇮🇳 Hindi - `hi-IN` (हिंदी)
- 🇮🇳 Telugu - `te-IN` (తెలుగు)
- 🇮🇳 Tamil - `ta-IN` (தமிழ்)
- 🇮🇳 Malayalam - `ml-IN` (മലയാളം)
- 🇮🇳 Kannada - `kn-IN` (ಕನ್ನಡ)

## Architecture

### Frontend (React)
The implementation uses **i18next** and **react-i18next** for internationalization:

#### Key Files:
1. **`src/i18n.js`** - i18n configuration and initialization
2. **`src/locales/` directory** - Translation JSON files for each language
   - `en-IN.json`
   - `hi-IN.json`
   - `te-IN.json`
   - `ta-IN.json`
   - `ml-IN.json`
   - `kn-IN.json`

3. **`src/hooks/useTranslation.js`** - Custom hook for translation with language persistence
4. **`src/main.jsx`** - App wrapped with I18nextProvider
5. **`src/farmer/FarmerSettingsPage.jsx`** - Settings UI with language selector

#### How It Works:
- When the app loads, it checks localStorage for `fcx_language` and applies it
- When a farmer changes the language in Settings, it:
  1. Updates the local state
  2. Changes the app language via `changeLanguage()`
  3. Saves the preference to `localStorage`
  4. Sends the preference to the backend via the settings API
  5. Triggers a `fcx:language-changed` event for other components to listen

### Backend (Java/Spring Boot)
The language preference is stored in the `FarmerProfile` entity:

#### Key Files:
1. **`FarmerProfile.java`** - Entity with `language` field
2. **`FarmerSettingsController.java`** - Handles `/api/farmer/settings` endpoints
3. **`FarmerOnboardingService.java`** - Sets default language to `en-IN` when creating new farmer

## Translation Keys Structure
Translation keys are organized hierarchically:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    ...
  },
  "farmer": {
    "dashboard": "Farmer Dashboard",
    "language": "Language",
    ...
  },
  "settings": {
    "profileInformation": "Profile Information",
    ...
  }
}
```

## Usage Example

### In React Components:
```jsx
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t, changeLanguage } = useTranslation();

  return (
    <div>
      <h1>{t('farmer.dashboard')}</h1>
      <button onClick={() => changeLanguage('hi-IN')}>
        {t('farmer.language')}: हिंदी
      </button>
    </div>
  );
}
```

## Data Flow

### On App Load:
1. App initializes with language from localStorage (or default 'en-IN')
2. FarmerSettingsPage fetches farmer settings from backend
3. If language is different from current, it updates the UI
4. Language preference is always in sync between frontend and backend

### On Language Change:
1. User selects new language from dropdown in Settings
2. Frontend immediately changes language via `changeLanguage()`
3. Settings are saved to backend (including language field)
4. Backend stores the new language preference in database
5. On next login, the language preference is loaded and applied

## Adding New Translations

### To add a new language:
1. Create a new JSON file in `src/locales/` (e.g., `gu-IN.json` for Gujarati)
2. Copy the structure from an existing translation file
3. Add the translations
4. Update `src/i18n.js` to import and register the new language:
```javascript
import guIN from './locales/gu-IN.json';

const resources = {
  // ... existing languages
  'gu-IN': { translation: guIN },
};
```

### To add new translation keys:
1. Add the key-value pair to all language JSON files
2. Use the key in components via `t('path.to.key')`
3. The system will warn if a translation is missing

## Features Implemented

✅ **Immediate Language Switching** - No page reload needed
✅ **Persistent Preferences** - Language choice saved to database
✅ **Responsive Translation** - All UI elements update in real-time
✅ **Six Indian Languages** - Complete support for major Indian languages
✅ **Native Language Display** - Language names shown in their native script
✅ **Browser Storage** - Local fallback storage for offline scenarios
✅ **Multilingual Settings Page** - All labels and messages translated

## Environment & Dependencies

### Requirements:
- Node.js 16+
- React 19.2+
- i18next 23+
- react-i18next 13+

### Installation:
```bash
npm install i18next react-i18next
```

## Testing the Feature

1. **Login to Farmer Portal**
2. **Navigate to Settings → Preferences**
3. **Select a different language** from the "Language" dropdown
4. **Observe:**
   - UI labels change immediately
   - Success toast message appears in selected language
   - Refresh page - language preference persists
   - Other farmers see their own language choices

## Notes

- The language preference is stored per user in the database
- Changing language doesn't affect other users
- All 6 languages have complete translations for farmer portal
- The system gracefully falls back to English if a translation is missing
- Language selection is available only in farmer settings (not in other portals yet)

## Future Enhancements

- Add language support for Customer and Delivery Partner portals
- Add more Indian languages (Punjabi, Marathi, etc.)
- Add right-to-left (RTL) language support if needed
- Implement API endpoint to fetch available languages
- Add language switcher in header for quick access


