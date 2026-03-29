# Quick Reference: Multi-Language Implementation Guide

## For Developers - Adding Translations to Components

### Step 1: Import the Translation Hook
```jsx
import { useTranslation } from '../hooks/useTranslation';
```

### Step 2: Use in Component
```jsx
function MyComponent() {
  const { t, changeLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('farmer.dashboard')}</h1>
      <p>{t('common.save')}</p>
    </div>
  );
}
```

### Step 3: Add Translation Keys to All Language Files
Add to each file in `src/locales/`:
```json
{
  "mySection": {
    "myKey": "English text here"
  }
}
```

## Common Translation Keys

### Common
- `common.save` → Save
- `common.cancel` → Cancel
- `common.delete` → Delete
- `common.edit` → Edit
- `common.logout` → Logout
- `common.settings` → Settings

### Farmer Section
- `farmer.language` → Language
- `farmer.timezone` → Time zone
- `farmer.notifications` → Notifications
- `farmer.saveChanges` → Save Changes
- `farmer.saving` → Saving...
- `farmer.dashboard` → Farmer Dashboard
- `farmer.profile` → Profile

### Settings Section
- `settings.preferences` → Preferences
- `settings.profileInformation` → Profile Information
- `settings.farmInformation` → Farm Information
- `settings.security` → Security

## Language Codes

| Language | Code | Native Name |
|----------|------|------------|
| English (India) | `en-IN` | English |
| Hindi | `hi-IN` | हिंदी |
| Telugu | `te-IN` | తెలుగు |
| Tamil | `ta-IN` | தமிழ் |
| Malayalam | `ml-IN` | മലയാളം |
| Kannada | `kn-IN` | ಕನ್ನಡ |

## How to Add a New Language

### 1. Create Translation File
Create `src/locales/xx-XX.json` with all translation keys

### 2. Register in i18n.js
```javascript
import xxXX from './locales/xx-XX.json';

const resources = {
  // ... existing languages
  'xx-XX': { translation: xxXX },
};
```

### 3. Add to Language Dropdown
In `FarmerSettingsPage.jsx`, PreferencesSection:
```jsx
<option value="xx-XX">Language Name</option>
```

## Persistence Details

### localStorage Keys
- `fcx_language` - Currently selected language code

### Database Fields
- Table: `farmer_profiles`
- Column: `language`
- Type: VARCHAR
- Default: `en-IN`

## Testing Translations

### Check if all keys exist:
```bash
# All locales should have same number of keys
grep -o '"[^"]*":' src/locales/*.json | sort | uniq -c
```

### Verify language switching:
1. Settings → Preferences
2. Change language dropdown
3. Check all UI updates
4. Refresh page - should persist
5. Logout/Login - should persist

## API Endpoints

### Get Settings (includes language)
```
GET /api/farmer/settings
Response: { language: "hi-IN", ... }
```

### Update Settings (saves language)
```
PUT /api/farmer/settings
Body: { language: "ta-IN", ... }
```

## Environment Variables

No environment variables needed. Language feature uses:
- localStorage for client-side persistence
- Database for server-side persistence

## Troubleshooting

### Language not changing
- Check browser console for errors
- Verify i18n.js is properly initialized
- Check localStorage has `fcx_language`

### Missing translations
- Check all 6 locale files have the key
- Verify key path matches in component
- Check JSON syntax in locale files

### Backend not saving language
- Verify FarmerProfile entity has language field
- Check SettingsUpdateRequest includes language
- Verify FarmerSettingsController updates language

### Language reverts after logout
- Check database has language value
- Verify FarmerSettingsPage fetches and applies language
- Check fetchSettings() updates language via changeLanguage()

## Performance Notes

- i18next caches translations after first load
- No performance impact of supporting multiple languages
- Total size added: ~30KB (6 language files)
- Gzip compressed: ~10KB

## Security Considerations

- Language codes are validated (enum values: en-IN, hi-IN, etc.)
- User can only change their own language
- Backend validates language before saving
- XSS protection: React escapes translation strings by default

## Browser Compatibility

- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback to English if language is corrupted
- localStorage available in all target browsers
- No polyfills needed for i18next

## Additional Resources

- Locale Files: `src/locales/`
- i18n Config: `src/i18n.js`
- Hook: `src/hooks/useTranslation.js`
- Documentation: `LANGUAGE_FEATURE.md`
- Summary: `IMPLEMENTATION_SUMMARY.md`


