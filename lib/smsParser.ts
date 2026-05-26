export type ParsedTransaction = {
  amount: number
  type: 'debit' | 'credit'
  merchant: string | null
  bank: string
  mode: 'upi' | 'neft' | 'imps' | 'card' | 'atm' | 'unknown'
  raw_sms: string
  txn_date: Date
}

// ─── BANK SENDER IDs ──────────────────────────────────────
// SMS sender IDs are the most reliable way to identify the bank.
// These are the registered short codes each bank uses.
const BANK_SENDERS: Record<string, string> = {
  'HDFCBK': 'HDFC',
  'HDFCBN': 'HDFC',
  'ICICIB': 'ICICI',
  'ICICIT': 'ICICI',
  'SBISMS': 'SBI',
  'SBIINB': 'SBI',
  'AXISBK': 'Axis',
  'AXISBN': 'Axis',
  'KOTAKB': 'Kotak',
  'KOTAK' : 'Kotak',
  'PAYTMB': 'Paytm',
  'PYTMBN': 'Paytm',
  'IDFCFB': 'IDFC First',
  'YESBNK': 'Yes Bank',
  'INDBNK': 'Indian Bank',
  'SCBANK': 'Standard Chartered', // your bank
}

// ─── AMOUNT PATTERNS ──────────────────────────────────────
// Matches: Rs.1,234.56 | INR 1234 | Rs 500.00 | ₹1,234
const AMOUNT_PATTERNS = [
  /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i,
]

// ─── DEBIT KEYWORDS ───────────────────────────────────────
const DEBIT_KEYWORDS = [
  'debited', 'debit', 'paid', 'payment', 'spent',
  'withdrawn', 'purchase', 'pos ', 'sent', 'transferred to',
  'charged', 'deducted',
]

// ─── CREDIT KEYWORDS ──────────────────────────────────────
const CREDIT_KEYWORDS = [
  'credited', 'credit', 'received', 'added', 'deposited',
  'refund', 'cashback', 'salary', 'transferred to your',
]

// ─── MERCHANT PATTERNS ────────────────────────────────────
// Order matters — more specific patterns first
const MERCHANT_PATTERNS = [
  // UPI: "to MERCHANT" or "at MERCHANT"
  /(?:to|at)\s+([A-Za-z0-9\s&'.-]{2,40})(?:\s+(?:on|via|upi|ref|for))/i,
  // VPA: merchant@bank style
  /(?:vpa|upi)\s*[:\-]?\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9]+)/i,
  // "at merchant" at end of sentence
  /\bat\s+([A-Za-z0-9\s&'.-]{2,30})(?:[.,\s]|$)/i,
  // "Info:" pattern (HDFC uses this)
  /info[:\s]+([A-Za-z0-9\s&'.-]{2,40})(?:[.,\s]|$)/i,
]

// ─── MODE DETECTION ───────────────────────────────────────
function detectMode(sms: string): ParsedTransaction['mode'] {
  const s = sms.toLowerCase()
  if (s.includes('upi'))                   return 'upi'
  if (s.includes('neft'))                  return 'neft'
  if (s.includes('imps'))                  return 'imps'
  if (s.includes('atm') || s.includes('cash withdrawal')) return 'atm'
  if (s.includes('pos') || s.includes('card'))            return 'card'
  return 'unknown'
}

// ─── AMOUNT EXTRACTION ────────────────────────────────────
function extractAmount(sms: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = sms.match(pattern)
    if (match) {
      // remove commas, parse float
      const cleaned = match[1].replace(/,/g, '')
      const amount = parseFloat(cleaned)
      if (!isNaN(amount) && amount > 0) return amount
    }
  }
  return null
}

// ─── TYPE DETECTION ───────────────────────────────────────
function detectType(sms: string): 'debit' | 'credit' | null {
  const s = sms.toLowerCase()
  // check credit first — "credited" contains "debit" so order matters
  for (const kw of CREDIT_KEYWORDS) {
    if (s.includes(kw)) return 'credit'
  }
  for (const kw of DEBIT_KEYWORDS) {
    if (s.includes(kw)) return 'debit'
  }
  return null
}

// ─── MERCHANT EXTRACTION ──────────────────────────────────
function extractMerchant(sms: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = sms.match(pattern)
    if (match) {
      return match[1].trim().replace(/\s+/g, ' ')
    }
  }
  return null
}

// ─── BANK DETECTION FROM SENDER ───────────────────────────
function detectBank(sender: string): string {
  const upper = sender.toUpperCase().replace(/^[^A-Z]*/,'')
  for (const [key, bank] of Object.entries(BANK_SENDERS)) {
    if (upper.includes(key)) return bank
  }
  return 'Unknown'
}

// ─── SPAM / NON-TRANSACTION FILTER ────────────────────────
// Many bank SMS are OTPs, alerts, or promotions — skip them
const NON_TRANSACTION_SIGNALS = [
  'otp', 'password', 'pin', 'login', 'verify', 'verification',
  'offer', 'discount', 'congratulations', 'dear customer',
  'last date', 'due date', 'emi due', 'minimum due',
  'pre-approved', 'loan offer', 'apply now',
]

function isTransactionSMS(sms: string): boolean {
  const s = sms.toLowerCase()

  // must have an amount-like pattern
  const hasAmount = AMOUNT_PATTERNS.some(p => p.test(sms))
  if (!hasAmount) return false

  // must have a debit or credit signal
  const hasType = detectType(sms) !== null
  if (!hasType) return false

  // must not look like spam/OTP
  const isSpam = NON_TRANSACTION_SIGNALS.some(sig => s.includes(sig))
  if (isSpam) return false

  return true
}

// ─── MAIN PARSE FUNCTION ──────────────────────────────────
export function parseSMS(
  body: string,
  sender: string,
  timestamp: number
): ParsedTransaction | null {
  if (!isTransactionSMS(body)) return null

  const amount = extractAmount(body)
  const type   = detectType(body)

  // both amount and type must be resolved — otherwise skip
  if (!amount || !type) return null

  return {
    amount,
    type,
    merchant:  extractMerchant(body),
    bank:      detectBank(sender),
    mode:      detectMode(body),
    raw_sms:   body,
    txn_date:  new Date(timestamp),
  }
}