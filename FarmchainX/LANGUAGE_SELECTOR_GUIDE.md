# Language Selector Implementation Guide

## How Language Selection Works

The farmer portal includes a language selector component that allows switching between all supported Indian languages.

## Supported Languages

| Language | Code | Display Name | Flag |
|----------|------|--------------|------|
| English (India) | en-IN | English | 🇮🇳 |
| Hindi | hi-IN | हिन्दी | 🇮🇳 |
| Telugu | te-IN | తెలుగు | 🇮🇳 |
| Tamil | ta-IN | தமிழ் | 🇮🇳 |
| Malayalam | ml-IN | മലയാളം | 🇮🇳 |
| Kannada | kn-IN | ಕನ್ನಡ | 🇮🇳 |

## Where to Find Language Selector

### In FarmerLayout.jsx (Header)
The language selector is typically located in:
- Top-right corner of the dashboard
- Settings menu
- Profile dropdown menu

### Implementation Location
```
FarmchainX/src/farmer/FarmerLayout.jsx
FarmchainX/src/components/LanguageSelector.jsx (if separate component)
FarmchainX/src/hooks/useTranslation.js (language switching hook)
```

## How to Add Language Selector to Components

### Method 1: Using useTranslation Hook
```jsx
import { useTranslation } from '../hooks/useTranslation';

function LanguageMenu() {
  const { i18n, changeLanguage } = useTranslation();

  const languages = [
    { code: 'en-IN', label: 'English' },
    { code: 'hi-IN', label: 'हिन्दी' },
    { code: 'te-IN', label: 'తెలుగు' },
    { code: 'ta-IN', label: 'தமிழ்' },
    { code: 'ml-IN', label: 'മലയാളം' },
    { code: 'kn-IN', label: 'ಕನ್ನಡ' },
  ];

  return (
    <div className="language-selector">
      <label>{i18n.t('farmer.language')}</label>
      <select onChange={(e) => changeLanguage(e.target.value)} 
              value={i18n.language}>
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Method 2: Button Group
```jsx
function LanguageButtons() {
  const { changeLanguage, i18n } = useTranslation();
  
  return (
    <div className="flex gap-2">
      <button 
        onClick={() => changeLanguage('en-IN')}
        className={i18n.language === 'en-IN' ? 'active' : ''}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('hi-IN')}
        className={i18n.language === 'hi-IN' ? 'active' : ''}
      >
        हिन्दी
      </button>
      <button 
        onClick={() => changeLanguage('te-IN')}
        className={i18n.language === 'te-IN' ? 'active' : ''}
      >
        తెలుగు
      </button>
    </div>
  );
}
```

## How Language Change Works

### Step-by-Step Process
```
1. User clicks language selector → e.g., "हिन्दी" (Hindi)
   ↓
2. changeLanguage('hi-IN') is called
   ↓
3. i18next changes internal language to hi-IN
   ↓
4. All components using t('key') re-render with Hindi translations
   ↓
5. Language preference saved to localStorage
   ↓
6. On next app visit, Hindi is loaded automatically
```

### Code Flow
```javascript
// hooks/useTranslation.js

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);              // Change i18n language
    localStorage.setItem('fcx_language', lng); // Save preference
    window.dispatchEvent(new Event('fcx:language-changed')); // Notify
  };

  return { t, i18n, changeLanguage };
};
```

## Real-Time Language Switching

### All Components Update Immediately
When you change language, ALL components using `t()` function automatically update:

```jsx
function Dashboard() {
  const { t } = useTranslation();
  
  // When language changes, this automatically re-renders
  return (
    <h1>{t('farmer.dashboard')}</h1>  // Updates immediately
  );
}
```

### Example Behavior
```
Current Language: English
h1 displays: "Farmer Dashboard"

User clicks: "हिन्दी" button
↓
Current Language: Hindi
h1 displays: "किसान डैशबोर्ड"  ← Changed instantly!
```

## Language Persistence

### Saved to Browser Storage
```javascript
// When user changes language
localStorage.setItem('fcx_language', 'hi-IN');

// On app reload
const savedLanguage = localStorage.getItem('fcx_language') || 'en-IN';
// Loads Hindi if previously saved, otherwise English
```

### Behavior
- ✅ Language selection saved automatically
- ✅ Persists across browser sessions
- ✅ Survives page refreshes
- ✅ Survives closing and reopening browser
- ✅ Specific to each browser/device

## Setting Default Language

### Change Default in i18n.js
```javascript
// src/i18n.js

// Get saved language from localStorage or default to English
const savedLanguage = localStorage.getItem('fcx_language') || 'en-IN';

i18next.init({
  resources,
  lng: savedLanguage,           // Set default
  fallbackLng: 'en-IN',         // Fallback if key not found
  interpolation: {
    escapeValue: false,
  },
});
```

## Testing Language Switching

### Manual Testing Checklist
- [ ] Open app in English
- [ ] Switch to Hindi → All text should change immediately
- [ ] Switch to Telugu → All text should change immediately
- [ ] Refresh page → Language should stay as selected
- [ ] Close and reopen browser → Language should persist
- [ ] Add a product → Product name stays as-is (not translated)
- [ ] View product in different languages → UI translates, product name doesn't
- [ ] Check currency symbol → Should show ₹ in all languages

### Browser DevTools Testing
```javascript
// In browser console, test language change programmatically
// Simulate switching to Hindi
localStorage.setItem('fcx_language', 'hi-IN');
window.location.reload();

// Language should now be Hindi after reload
```

## Troubleshooting

### Language Not Changing?
```javascript
// Check if t() function is being used correctly
const { t } = useTranslation();  // ✅ Correct
const t = i18next.t;              // ❌ Might not update on change

// Verify component is re-rendering
// Add a console.log in render
function MyComponent() {
  const { t } = useTranslation();
  console.log('Current language:', t('farmer.language'));
  return <h1>{t('farmer.dashboard')}</h1>;
}
```

### Language Not Persisting?
```javascript
// Check localStorage
localStorage.getItem('fcx_language');  // Should show 'hi-IN' if set

// Clear storage and try again
localStorage.removeItem('fcx_language');
// App will load with default (English)
```

### Missing Translations?
```javascript
// If a key is missing, i18next falls back to key itself
// e.g., t('missing.key') → "missing.key" is displayed

// Check the locale JSON files for the key
// en-IN.json should have:
{
  "farmer": {
    "dashboard": "Farmer Dashboard"
  }
}

// All other language files should have same key
// hi-IN.json should have:
{
  "farmer": {
    "dashboard": "किसान डैशबोर्ड"
  }
}
```

## Language Selector Location in UI

### Recommended Placements

#### 1. Header/Navbar
```
[Logo] [Menu] [Notifications] [Profile▼] [Language▼]
                                         └─ en-IN
                                         └─ हिन्दी
                                         └─ తెలుగు
```

#### 2. Settings Page
```
Settings
├─ Profile Information
├─ Farm Information  
├─ Language Settings  ← Place here
│  └─ Select Language: [हिन्दी ▼]
├─ Notifications
└─ Security
```

#### 3. Profile Dropdown
```
Profile ▼
├─ View Profile
├─ Settings
├─ Language: हिन्दी ✓
│  └─ Change Language...
├─ Notifications
└─ Logout
```

## API Calls and Language

### Language NOT Sent to Backend
```javascript
// User data stored in database (backend) without language
// Backend doesn't need to know the UI language

// Frontend calls API
api.get('/api/farmer/products')
  // No language parameter needed
  // Returns product names as-is

// Frontend translates only the UI
// Product names displayed as-is
```

### Backend Response
```json
{
  "products": [
    {
      "id": 1,
      "name": "Organic Tomatoes",  // ← No translation here
      "price": 150
    }
  ]
}
```

## Keyboard Shortcuts for Language (Optional)

You can add keyboard shortcuts for faster switching:

```javascript
// Add to app initialization
useEffect(() => {
  const handleKeyPress = (e) => {
    // Alt + E = English
    if (e.altKey && e.key === 'E') {
      changeLanguage('en-IN');
    }
    // Alt + H = Hindi
    if (e.altKey && e.key === 'H') {
      changeLanguage('hi-IN');
    }
    // Alt + T = Telugu
    if (e.altKey && e.key === 'T') {
      changeLanguage('te-IN');
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [changeLanguage]);
```

## Summary

| Feature | Status |
|---------|--------|
| Language Selector | ✅ Available |
| Real-time Switching | ✅ Works |
| Language Persistence | ✅ Works |
| All UI Translated | ✅ Done |
| Dynamic Content | ✅ Not Translated (Correct) |
| Currency Formatting | ✅ Rupee Symbol |

---

**Document Version:** 1.0
**Last Updated:** March 26, 2026

