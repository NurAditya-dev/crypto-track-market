import { useState, useEffect } from 'react'
import { CoinContext } from './CoinContext.js'

const currencies = {
  usd: { name: 'usd', symbol: '$' },
  eur: { name: 'eur', symbol: '€' },
  idr: { name: 'idr', symbol: 'Rp.' },
}
const currencyPreference = 'market.currency'
const apiKey = import.meta.env.VITE_CG_DEMO_API_KEY

const CoinContextProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem(currencyPreference)
      if (Object.hasOwn(currencies, saved)) return currencies[saved]
    } catch {
      // Storage can be blocked by the browser.
    }
    return currencies.usd
  })
  const [market, setMarket] = useState(null)
  const [request, setRequest] = useState(0)
  const snapshot = market?.currency === currency.name ? market : null

  function selectCurrency(name) {
    if (!Object.hasOwn(currencies, name)) return
    setCurrency(currencies[name])
    try {
      localStorage.setItem(currencyPreference, name)
    } catch {
      // Currency can still be changed for this visit.
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    let running = false
    async function fetchAllCoin() {
      if (running) return
      running = true
      try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12000)])
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency.name}&sparkline=true&price_change_percentage=1h,24h,7d,30d,1y`,
          { signal, headers: { accept: 'application/json', ...(apiKey ? { 'x-cg-demo-api-key': apiKey } : {}) } }
        )
        if (!response.ok) throw new Error('Market data unavailable')
        const data = await response.json()
        if (!Array.isArray(data)) throw new Error('Invalid market data')
        if (!controller.signal.aborted) {
          setMarket({ currency: currency.name, request, coins: data, updatedAt: Date.now(), failed: false })
        }
      } catch {
        if (!controller.signal.aborted) {
          setMarket(previous => ({
            ...(previous?.currency === currency.name ? previous : { coins: [], updatedAt: null }),
            currency: currency.name, request, failed: true,
          }))
        }
      } finally {
        running = false
      }
    }

    void fetchAllCoin()
    const interval = setInterval(fetchAllCoin, 60000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [currency.name, request])

  const contextValue = {
    allCoin: snapshot?.coins ?? [],
    currency,
    selectCurrency,
    pricesLoading: snapshot?.request !== request,
    pricesFailed: snapshot?.failed ?? false,
    pricesUpdatedAt: snapshot?.updatedAt ?? null,
    reloadPrices: () => setRequest(previous => previous + 1),
  }

  return (
    <CoinContext.Provider value={contextValue}>
      {children}
    </CoinContext.Provider>
  )
}

export default CoinContextProvider
