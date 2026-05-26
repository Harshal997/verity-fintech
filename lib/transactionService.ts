import { supabase } from './supabase'
import { ParsedTransaction } from './smsParser'

// ─── CATEGORY AUTO-ASSIGN ────────────────────────────────
// Simple keyword mapping — good enough for Phase 1.
// Phase 4 replaces this with the LLM categoriser.
const MERCHANT_CATEGORY_MAP: Record<string, string> = {
  'swiggy':     'Food & dining',
  'zomato':     'Food & dining',
  'zepto':      'Food & dining',
  'blinkit':    'Food & dining',
  'uber':       'Transport',
  'ola':        'Transport',
  'rapido':     'Transport',
  'irctc':      'Transport',
  'netflix':    'Subscriptions',
  'spotify':    'Subscriptions',
  'hotstar':    'Subscriptions',
  'amazon':     'Shopping',
  'flipkart':   'Shopping',
  'myntra':     'Shopping',
  'apollo':     'Health',
  'practo':     'Health',
  'salary':     'Income',
  'payroll':    'Income',
}

async function getCategoryId(merchant: string | null): Promise<string | null> {
  if (!merchant) return null

  const lower = merchant.toLowerCase()
  let categoryName = 'Other'

  for (const [keyword, name] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (lower.includes(keyword)) {
      categoryName = name
      break
    }
  }

  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .eq('is_default', true)
    .single()

  return data?.id ?? null
}

// ─── BULK INSERT ──────────────────────────────────────────
export async function insertTransactions(
  userId: string,
  transactions: ParsedTransaction[]
): Promise<{ inserted: number; error: string | null }> {

  // build rows with category lookup
  const rows = await Promise.all(
    transactions.map(async (txn) => ({
      user_id:     userId,
      amount:      txn.amount,
      type:        txn.type,
      category_id: await getCategoryId(txn.merchant),
      merchant:    txn.merchant,
      source:      'sms' as const,
      raw_sms:     txn.raw_sms,
      txn_date:    txn.txn_date.toISOString(),
    }))
  )

  const { error } = await supabase
    .from('transactions')
    .insert(rows)

  if (error) return { inserted: 0, error: error.message }
  return { inserted: rows.length, error: null }
}

// ─── FETCH FOR HOME SCREEN (current month) ───────────────
export async function fetchMonthlyTransactions(userId: string) {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id, amount, type, merchant, txn_date, source,
      categories ( name, color, icon )
    `)
    .eq('user_id', userId)
    .gte('txn_date', start.toISOString())
    .order('txn_date', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── MONTHLY SUMMARY (for home screen hero numbers) ──────
export async function fetchMonthlySummary(userId: string) {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, categories(name)')
    .eq('user_id', userId)
    .gte('txn_date', start.toISOString())

  if (error) return null

  const totalSpent  = data
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = data
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)

  // group by category for breakdown bars
  const byCategory: Record<string, number> = {}
  for (const t of data) {
    if (t.type !== 'debit') continue
    const cat = (t.categories as any)?.name ?? 'Other'
    byCategory[cat] = (byCategory[cat] ?? 0) + t.amount
  }

  return { totalSpent, totalIncome, byCategory }
}