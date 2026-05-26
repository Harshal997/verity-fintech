# Verity

> Personal finance tracking with automatic SMS parsing — built for the Indian market.

Verity is a React Native app that reads your bank and transaction SMSes to automatically log expenses, categorize them, and give you a clear picture of your spending — without manual entry.

---

## Features

- **Automatic SMS parsing** — reads bank SMSes in the background via a native Kotlin module, extracts transaction data (amount, merchant, account), and logs it without any user input
- **Manual transactions** — add income, expenses, or transfers manually when needed
- **Smart categorization** — transactions are bucketed into categories (Food, Travel, Shopping, etc.) with the ability to recategorize
- **Budget tracking** — set monthly budgets per category, get alerted as you approach limits
- **Subscription tracking** — detect and track recurring charges
- **Insights** — spending trends, category breakdowns, month-over-month comparisons
- **Secure auth** — email-based authentication; sensitive data protected via device secure storage

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo (React Native) |
| Navigation | Expo Router |
| Backend | Supabase (Postgres + Auth + RLS) |
| State | Zustand |
| SMS parsing | Custom native Kotlin module + `@maniac-tech/react-native-expo-read-sms` |
| Storage | MMKV (local cache) |
| Styling | Custom design system — "Midnight Precision" |

---

## Design system — Midnight Precision

Verity uses a custom design language built for a financial app:

- **Canvas** — near-black background (`#0D0D0F`)
- **Accent colors** — teal for positive/income, amber for warnings, red for overspend
- **Typography** — DM Mono for numbers and data, Sora for UI text
- **Principle** — data-forward; numbers are the hero, chrome is minimal

---

## Architecture

```
verity/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login, signup
│   ├── (tabs)/             # Home, transactions, budgets, insights
│   └── modals/             # Add transaction, category picker
├── modules/
│   └── sms-reader/         # Native Kotlin module (BroadcastReceiver)
├── store/                  # Zustand slices
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── smsParser.ts         # SMS regex parsing logic
│   └── categorizer.ts       # Auto-categorization rules
└── components/             # Shared UI components
```

---

## Database schema (Supabase / Postgres)

All tables use Row Level Security (RLS) — users can only access their own data.

| Table | Purpose |
|---|---|
| `profiles` | User profile and preferences |
| `transactions` | All income/expense records |
| `categories` | Default + custom categories per user |
| `budgets` | Monthly budget limits per category |
| `subscriptions` | Detected recurring transactions |
| `insights` | Precomputed aggregates for dashboard |

---

## SMS parsing — how it works

The native Kotlin module registers a `BroadcastReceiver` for `SMS_RECEIVED`. When a new SMS arrives:

1. The module passes the SMS body to JS via an event emitter
2. `smsParser.ts` runs regex patterns against known Indian bank formats (HDFC, ICICI, SBI, Axis, Kotak, etc.)
3. Extracted fields — amount, merchant, transaction type (debit/credit), last 4 digits — are mapped to a transaction object
4. The transaction is saved to Supabase and reflected in the UI immediately

Permissions required: `READ_SMS`, `RECEIVE_SMS` (Android only).

---

## Getting started

### Prerequisites

- Node.js 18+
- Expo CLI
- Android device or emulator (SMS features are Android-only)
- Supabase project

### Setup

```bash
git clone https://github.com/yourusername/verity.git
cd verity
npm install
```

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Run the app:

```bash
npx expo run:android   # SMS parsing requires a native build
```

> `expo start` (Expo Go) will not support the SMS native module. Use a development build.

---

## Permissions

| Permission | Why |
|---|---|
| `READ_SMS` | Read existing SMSes on first sync |
| `RECEIVE_SMS` | Listen for new transaction SMSes in background |

Verity never uploads your SMS content. Parsing happens entirely on-device; only the extracted transaction data (amount, category, timestamp) is sent to Supabase.

---

## Roadmap

- [ ] iOS support (manual entry only — SMS APIs not available on iOS)
- [ ] Google OAuth
- [ ] UPI app parsing (read UPI notifications as fallback)
- [ ] Export to CSV / PDF
- [ ] Widget (home screen spending summary)
- [ ] Biometric lock

---

## License

MIT
