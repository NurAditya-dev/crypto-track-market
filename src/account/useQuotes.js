import { useEffect, useState } from 'react'

export default function useQuotes(entries, currency) {
  const ids = [...new Set(entries.map(row => row.coin_id))].sort().join(',')
  const [result, setResult] = useState({})
  useEffect(() => {
    if (!ids) return
    const controller = new AbortController()
    let running = false
    async function load() {
      if (running) return
      running = true
      try {
        const coins = ids.split(',')
        const quotes = {}
        for (let index = 0; index < coins.length; index += 40) {
          const query = new URLSearchParams({
            ids: coins.slice(index, index + 40).join(','),
            vs_currencies: [...new Set(['idr', currency])].join(','),
            include_24hr_change: 'true',
          })
          const key = import.meta.env.VITE_CG_DEMO_API_KEY
          const response = await fetch('https://api.coingecko.com/api/v3/simple/price?' + query, {
            signal: controller.signal, headers: key ? { 'x-cg-demo-api-key': key } : {},
          })
          if (!response.ok) throw new Error()
          Object.assign(quotes, await response.json())
        }
        if (!controller.signal.aborted) setResult({ ids, currency, quotes })
      } catch {
        if (!controller.signal.aborted) setResult({ ids, currency, failed: true })
      } finally {
        running = false
      }
    }
    void load()
    const timer = setInterval(load, 60000)
    return () => { clearInterval(timer); controller.abort() }
  }, [ids, currency])
  return result.ids === ids && result.currency === currency ? result : {}
}
