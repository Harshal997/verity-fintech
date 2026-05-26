import { useState } from 'react'
import { requestSMSPermission, readHistoricalSMS, deduplicateTransactions } from '@/lib/smsReader'
import { insertTransactions } from '@/lib/transactionService'
import { useAuthStore } from '@/store/authStore'

export function useSMSImport() {
  const { user } = useAuthStore()
  const [status, setStatus] = useState
    'idle' | 'requesting' | 'reading' | 'inserting' | 'done' | 'denied' | 'error'
  >('idle')
  const [count, setCount] = useState(0)

  const runImport = async () => {
    if (!user) return

    // step 1 — ask permission
    setStatus('requesting')
    const granted = await requestSMSPermission()
    if (!granted) { setStatus('denied'); return }

    // step 2 — read SMS
    setStatus('reading')
    readHistoricalSMS(
      async (batch) => {
        // step 3 — insert batch
        setStatus('inserting')
        const result = await insertTransactions(user.id, batch)
        if (result.error) { setStatus('error'); return }
        setCount(prev => prev + result.inserted)
      },
      (total) => {
        setStatus('done')
        setCount(total)
      },
      () => setStatus('error')
    )
  }

  return { runImport, status, count }
}