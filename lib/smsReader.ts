import { NativeModules, PermissionsAndroid, Platform } from 'react-native'
import { startReadSMS } from '@maniac-tech/react-native-expo-read-sms'
import { parseSMS, ParsedTransaction } from './smsParser'

// ─────────────────────────────────────────────────────────
// SECTION 1 — NATIVE MODULE REFERENCE
// ─────────────────────────────────────────────────────────
//
// NativeModules is React Native's bridge to anything written
// in native code (Kotlin/Java on Android, Swift/ObjC on iOS).
//
// When your app boots, Android scans all registered packages
// (including your SmsReaderPackage) and makes their modules
// available here by the exact Name() string you defined in
// SmsReaderModule.kt — which was "SmsReader".
//
// So NativeModules.SmsReader gives you direct access to the
// AsyncFunction("readSMS") you wrote in Kotlin.
// It's null-safe typed as any because NativeModules has no
// static types — we add our own type below.

const { SmsReader } = NativeModules as {
  SmsReader: {
    readSMS: (minDate: number, maxCount: number) => Promise<RawSMS[]>
  }
}

// Shape of what the Kotlin module returns for each message.
// Matches exactly the mapOf() keys in SmsReaderModule.kt.
type RawSMS = {
  address: string   // sender ID e.g. "HDFCBK" or "+919876543210"
  body:    string   // full SMS text
  date:    number   // unix timestamp in milliseconds
}


// ─────────────────────────────────────────────────────────
// SECTION 2 — PERMISSION REQUEST
// ─────────────────────────────────────────────────────────
//
// Android requires explicit runtime permission before your
// app can touch the SMS ContentProvider. You must request
// READ_SMS before calling readSMS(), and RECEIVE_SMS before
// starting the live listener.
//
// This runs the system dialog ("Allow Verity to read your
// messages?"). The user sees this exactly once — Android
// remembers their choice. If they deny, you get false back
// and should show a graceful fallback (manual entry).
//
// Platform.OS check is important — on iOS this entire flow
// is irrelevant since SMS access is not permitted at all.
// Returning false on iOS means the caller falls back to
// manual entry automatically, no crash.

export async function requestSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  try {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ])

    const readGranted    = result['android.permission.READ_SMS']
      === PermissionsAndroid.RESULTS.GRANTED
    const receiveGranted = result['android.permission.RECEIVE_SMS']
      === PermissionsAndroid.RESULTS.GRANTED

    // both needed — READ for historical, RECEIVE for live listener
    return readGranted && receiveGranted

  } catch {
    return false
  }
}


// ─────────────────────────────────────────────────────────
// SECTION 3 — KNOWN BANK SENDER IDs
// ─────────────────────────────────────────────────────────
//
// Bank SMS in India always come from registered short codes
// like "HDFCBK" or "AXISBK" — never from a phone number.
// This set is used to pre-filter the inbox before running
// any regex, so you're not parsing 4,000 OTPs and spam
// messages from Zomato promotions.
//
// This is the single most important performance optimisation
// in the whole pipeline. A typical inbox has ~3,000 messages.
// After this filter, you're down to maybe 150–300 that are
// actually from banks. Regex only runs on those.
//
// Add more sender IDs here as users report missing banks.
// Standard Chartered is included because that's your bank.

const BANK_SENDER_IDS = new Set([
  'HDFCBK', 'HDFCBN', 'HDFCBANKL',
  'ICICIB', 'ICICIT', 'ICICIBK',
  'SBISMS', 'SBIINB', 'SBIPSG',
  'AXISBK', 'AXISBN', 'AXISBKL',
  'KOTAKB', 'KOTAK',
  'PAYTMB', 'PYTMBN',
  'IDFCFB', 'IDFCBK',
  'YESBNK', 'YESBNG',
  'INDBNK',
  'SCBANK', 'SCBKML',   // Standard Chartered
  'BOIIND',             // Bank of India
  'PNBSMS',             // Punjab National Bank
  'CANBNK',             // Canara Bank
  'CENTBK',             // Central Bank
  'UNIONB',             // Union Bank
])

function isBankSender(address: string): boolean {
  // addresses come in as "AD-HDFCBK" or "VM-AXISBK" with
  // a 2-char prefix + hyphen prepended by the telecom carrier.
  // Strip that prefix before matching.
  const cleaned = address.toUpperCase().replace(/^[A-Z]{2}-/, '')
  return BANK_SENDER_IDS.has(cleaned)
}


// ─────────────────────────────────────────────────────────
// SECTION 4 — DEDUPLICATION
// ─────────────────────────────────────────────────────────
//
// Two scenarios cause duplicate transactions:
//
// 1. User uninstalls and reinstalls — historical import runs
//    again and tries to insert the same 90 days twice.
//
// 2. An SMS arrives while historical import is in progress
//    and the live listener also captures it.
//
// The dedupe logic is: same amount + same merchant + txn
// timestamps within 60 seconds = same transaction.
// This is intentionally loose — ₹500 to Swiggy twice in
// one minute is vanishingly unlikely to be two real orders.
//
// `existing` is whatever you already have in Supabase for
// this user — fetched once before the import starts and
// passed in, rather than doing a DB round-trip per message.

export function deduplicateTransactions(
  incoming: ParsedTransaction[],
  existing: { amount: number; merchant: string | null; txn_date: string }[]
): ParsedTransaction[] {
  return incoming.filter(txn => {
    const isDuplicate = existing.some(ex => {
      const sameAmount   = ex.amount === txn.amount
      const sameMerchant = ex.merchant === txn.merchant
      const timeDiff     = Math.abs(
        new Date(ex.txn_date).getTime() - txn.txn_date.getTime()
      )
      return sameAmount && sameMerchant && timeDiff < 60_000
    })
    return !isDuplicate
  })
}


// ─────────────────────────────────────────────────────────
// SECTION 5 — BULK HISTORICAL IMPORT
// ─────────────────────────────────────────────────────────
//
// Called once during onboarding. Reads up to `maxCount`
// messages from the last `daysBack` days, filters to bank
// senders, runs each through smsParser, and returns the
// parsed results as one array.
//
// Why callbacks (onProgress, onDone) instead of just
// returning a Promise<ParsedTransaction[]>?
//
// Because on a phone with 2+ years of bank SMS, parsing 400
// messages takes 1–2 seconds. A single Promise that resolves
// at the end gives the user a frozen screen. The onProgress
// callback lets you update UI ("Found 23 transactions...")
// as parsing happens, which feels much better.
//
// The Kotlin readSMS() call itself is async — it queries
// Android's ContentResolver (the system database that stores
// SMS) and resolves when all rows are fetched. This is why
// readSMS is an AsyncFunction in Kotlin — ContentResolver
// queries can block and should never run on the main thread.

export async function readHistoricalSMS(
  options: {
    daysBack?:  number   // default 90
    maxCount?:  number   // default 500
    onProgress?: (found: number) => void
  } = {}
): Promise<ParsedTransaction[]> {

  const { daysBack = 90, maxCount = 500, onProgress } = options

  // calculate the earliest timestamp we care about
  const minDate = Date.now() - daysBack * 24 * 60 * 60 * 1000

  // this is the actual Kotlin bridge call
  // resolves with RawSMS[] from the Android ContentResolver
  const rawMessages = await SmsReader.readSMS(minDate, maxCount)

  const parsed: ParsedTransaction[] = []

  for (const msg of rawMessages) {
    // step 1 — drop anything not from a bank sender
    // this is fast (Set lookup) and eliminates ~90% of messages
    if (!isBankSender(msg.address)) continue

    // step 2 — run the regex parser on the remaining messages
    // parseSMS returns null if the message isn't a transaction
    // (OTP, promotional, due date reminder, etc.)
    const result = parseSMS(msg.body, msg.address, msg.date)
    if (!result) continue

    parsed.push(result)

    // notify caller so they can update progress UI
    onProgress?.(parsed.length)
  }

  return parsed
}


// ─────────────────────────────────────────────────────────
// SECTION 6 — LIVE LISTENER
// ─────────────────────────────────────────────────────────
//
// startReadSMS from @maniac-tech fires the success callback
// every time a new SMS arrives while the app is open.
// The callback receives a raw string in the format:
// "[+919876543210, Your a/c XX1234 debited Rs.500...]"
//
// Yes, it's a string that looks like an array — that's the
// library's API. So we parse it manually below.
//
// This runs for the lifetime of the app session. When the
// user backgrounds the app it pauses; it resumes on
// foreground. It does NOT work when the app is fully killed
// — for that you'd need a background service (future scope,
// not needed for MVP).
//
// Returns a cleanup function — call it from your useEffect
// return to stop listening when the component unmounts.
// If you don't clean up, you'll get memory leaks and
// duplicate inserts on hot reloads during development.

export function startLiveSMSListener(
  onTransaction: (txn: ParsedTransaction) => void
): () => void {

  const successCallback = (smsData: string) => {
    // smsData looks like: "[AD-HDFCBK, Rs.500 debited from...]"
    // split on the first comma only — body may contain commas
    const firstComma = smsData.indexOf(',')
    if (firstComma === -1) return

    const address = smsData.slice(1, firstComma).trim()
    // strip trailing "]" from the body
    const body    = smsData.slice(firstComma + 1, -1).trim()

    if (!isBankSender(address)) return

    const result = parseSMS(body, address, Date.now())
    if (result) onTransaction(result)
  }

  const errorCallback = (error: string) => {
    // non-fatal — log and continue. Common causes:
    // permission revoked mid-session, or device doesn't
    // support RECEIVE_SMS (very rare on modern Android)
    console.warn('Verity SMS listener error:', error)
  }

  startReadSMS(successCallback, errorCallback)

  // cleanup — @maniac-tech doesn't expose a stop() function
  // so we return a no-op here. In practice the listener dies
  // when the JS runtime is torn down (app killed).
  // For dev: just be aware hot reload will re-register it.
  return () => {}
}