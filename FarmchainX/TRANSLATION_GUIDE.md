# FarmchainX Translation System Guide

## Overview
The farmer portal now supports comprehensive multi-language translation for all Indian languages: **English, Hindi, Telugu, Tamil, Malayalam, and Kannada**.

## Translation Architecture

### Static vs Dynamic Content

#### 1. **Static UI Text** (Goes in translation files)
These are fixed interface labels, buttons, and messages that never change:
- Button labels: "Save", "Delete", "Submit"
- Page titles: "Dashboard", "My Products", "Orders"
- Messages: "No orders yet", "Loading..."
- Form labels: "Product Name", "Email", "Phone"

**These are stored in:** `/src/locales/[language-CODE].json`

#### 2. **Dynamic User-Generated Content** (Does NOT need translation)
These are values entered by users and will be displayed as-is:
- **Product names**: "Tomatoes", "Rice", "Wheat" (entered by farmers)
- **Customer names**: "John Doe", "Rajesh Kumar" (from database)
- **Descriptions**: Any text farmers enter about their products
- **Order details**: Transaction IDs, batch codes, etc.

**Why?** Because users enter these in their own language/preference, so we just display them as-is without translation.

## Example: Adding a Product

When a farmer adds a product named "Organic Tomatoes":

```
UI Text (translated):
┌─────────────────────────────┐
│ "Product Name"  ← Translates to "उत्पाद का नाम" in Hindi
│ [Organic Tomatoes]          ← User data, NOT translated
│
│ "Description"   ← Translates to "विवरण" in Hindi  
│ [Fresh garden tomatoes] ← User data, NOT translated
│
│ "Price per Unit" ← Translates to "प्रति यूनिट मूल्य" in Hindi
│ ₹150            ← Currency formatted with locale
│
│ [Save Button]   ← Translates to "सहेजें" in Hindi
└─────────────────────────────┘
```

## Language Files Structure

### File Location
```
src/locales/
  ├── en-IN.json  (English - India)
  ├── hi-IN.json  (Hindi)
  ├── te-IN.json  (Telugu)
  ├── ta-IN.json  (Tamil)
  ├── ml-IN.json  (Malayalam)
  └── kn-IN.json  (Kannada)
```

### JSON Structure
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "farmer": {
    "dashboard": "Farmer Dashboard",
    "products": "Products",
    "orders": "Orders"
  },
  "products": {
    "productName": "Product Name",
    "description": "Description",
    "pricePerUnit": "Price per Unit"
  }
}
```

## Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English (India) | en-IN | ✅ Complete |
| Hindi | hi-IN | ✅ Complete |
| Telugu | te-IN | ✅ Complete |
| Tamil | ta-IN | 🔄 Pending |
| Malayalam | ml-IN | 🔄 Pending |
| Kannada | kn-IN | 🔄 Pending |

## How to Use Translations in Components

### Basic Usage
```jsx
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t, i18n, changeLanguage } = useTranslation();

  return (
    <div>
      <h1>{t('farmer.dashboard')}</h1>
      <button onClick={() => changeLanguage('hi-IN')}>
        {t('farmer.language')}
      </button>
    </div>
  );
}
```

### Key Translation Keys by Section

#### Dashboard
- `farmer.dashboard` - Dashboard title
- `farmer.welcomeBack` - Welcome message
- `farmer.totalActiveBatches` - Active batches count label
- `farmer.productsListed` - Products listed label
- `farmer.totalEarnings` - Total earnings label
- `orders.recentOrders` - Recent orders section title

#### Products
- `products.productName` - Product name label
- `products.description` - Description label
- `products.pricePerUnit` - Price label
- `products.stockQuantity` - Stock quantity label
- `products.addNewProduct` - Add product button
- `products.noProductsYet` - Empty state message

#### Orders
- `orders.orderId` - Order ID column header
- `orders.customer` - Customer column header
- `orders.product` - Product column header
- `orders.quantity` - Quantity column header
- `orders.status` - Status column header
- `orders.pending` - Pending status
- `orders.shipped` - Shipped status
- `orders.completed` - Completed status

#### Payments
- `payments.paymentsWallet` - Payments & Wallet title
- `payments.withdrawToBank` - Withdraw button
- `payments.amount` - Amount label
- `payments.withdrawableBalance` - Balance label
- `payments.transactions` - Transactions title

#### Blockchain
- `blockchain.blockchainRecords` - Blockchain title
- `blockchain.batchId` - Batch ID label
- `blockchain.crop` - Crop label
- `blockchain.hash` - Hash label
- `blockchain.verified` - Verified label

#### AI Insights
- `aiInsights.aiYieldPrediction` - Yield prediction title
- `aiInsights.diseasePrediction` - Disease prediction title
- `aiInsights.lowRisk` - Low risk indicator
- `aiInsights.highRisk` - High risk indicator
- `aiInsights.weatherImpact` - Weather impact title

## Currency Formatting

The rupee (₹) symbol is automatically formatted based on locale:

```javascript
import { formatInr } from '../utils/currency';

// Automatically shows ₹ symbol in en-IN locale
const displayValue = formatInr(1500); // ₹1,500.00
```

## How Language Persists

Language selection is saved to localStorage:
```javascript
// Automatically saved when changing language
changeLanguage('hi-IN'); // Saves to localStorage under 'fcx_language'
```

On app reload, the saved language preference is restored.

## Adding New Translations

1. **Add key to en-IN.json first** (English as reference):
```json
{
  "newSection": {
    "myKey": "English text here"
  }
}
```

2. **Add same key to all other language files**:
```json
{
  "newSection": {
    "myKey": "हिंदी पाठ यहाँ"
  }
}
```

3. **Use in component**:
```jsx
<h1>{t('newSection.myKey')}</h1>
```

## Static Content to Translate
The following sections are now fully translatable:
- ✅ Dashboard page
- ✅ Products/Batches pages
- ✅ Orders page
- ✅ Payments page
- ✅ Blockchain records page
- ✅ AI Insights page
- ✅ Help/Support page
- ✅ Settings page
- ✅ Navigation menus
- ✅ Notifications

## Common Translation Keys Reference

| Key Path | English | Usage |
|----------|---------|-------|
| `common.save` | Save | Save buttons |
| `common.cancel` | Cancel | Cancel buttons |
| `common.delete` | Delete | Delete buttons |
| `farmer.dashboard` | Farmer Dashboard | Page titles |
| `farmer.products` | Products | Menu items |
| `farmer.orders` | Orders | Menu items |
| `farmer.payments` | Payments | Menu items |
| `farmer.thisMonth` | This Month | Date filter |
| `farmer.thisYear` | This Year | Date filter |

## Notes

- User-generated data (product names, customer names, descriptions) are **NOT** automatically translated
- Currency formatting uses the locale setting (₹ for India, commas as thousands separator)
- Language changes are **real-time** across all components using `useTranslation` hook
- All translations use `en-IN` locale for consistent date/time/currency formatting across all languages
- Missing translation keys will fall back to English text (helpful for debugging)

## Quality Assurance

When testing translations:
1. ✅ Test each language from the language selector
2. ✅ Verify UI labels are translated
3. ✅ Verify user data is NOT translated
4. ✅ Check currency format shows ₹ symbol
5. ✅ Reload page and verify language persists
6. ✅ Test with long text to check layout doesn't break

---

**Last Updated:** March 26, 2026
**Translation Status:** 2/6 languages fully complete (English, Hindi, Telugu)

