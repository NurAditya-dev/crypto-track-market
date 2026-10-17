import { createContext, useState, useEffect } from 'react'

export const CoinContext = createContext()

const CoinContextProvider = (props) => {
  const [allCoin, setAllCoin] = useState([])
  const [currency, setCurrency] = useState({
    name: 'usd',
    symbol: '$'
  })

  const apiKey = import.meta.env.VITE_CG_DEMO_API_KEY

  const fetchAllCoin = async () => {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        ...(apiKey ? { 'x-cg-demo-api-key': apiKey } : {})
      }
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency.name}&sparkline=true&price_change_percentage=1h,24h,7d,30d,1y`,
        options
      )
      const data = await response.json()
      setAllCoin(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchAllCoin()
  }, [currency.name])

  const contextValue = {
    allCoin,
    currency,
    setCurrency
  }

  return (
    <CoinContext.Provider value={contextValue}>
      {props.children}
    </CoinContext.Provider>
  )
}

export default CoinContextProvider