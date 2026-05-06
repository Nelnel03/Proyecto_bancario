import { useState, useEffect, useCallback } from 'react'
import { getMyAccounts } from '../services/accountsService'

export default function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMyAccounts()
      setAccounts(res.data ?? [])
    } catch (err) {
      setError('No se pudieron cargar las cuentas')
      console.error('[useAccounts]', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { accounts, loading, error, refetch: fetch }
}
