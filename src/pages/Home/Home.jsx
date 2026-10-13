import React, { useContext, useEffect, useMemo, useState } from 'react'
import './Home.css'
import { CoinContext } from '../../context/CoinContext'

const Home = () => {
  const { allCoin, currency } = useContext(CoinContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [displayCoin, setDisplayCoin] = useState([])
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false)
  const [selectedCoinId, setSelectedCoinId] = useState(null)

  const matchesCoinPrefix = (coin, value) => {
    const term = value.trim().toLowerCase()

    if (!term) return true

    const coinName = coin.name.toLowerCase()
    const coinSymbol = coin.symbol.toLowerCase()

    return coinName.startsWith(term) || coinSymbol.startsWith(term)
  }

  const filterByFirstLetter = (value) => {
    const term = value.trim().toLowerCase()

    if (!term) {
      return allCoin.slice(0, 10)
    }

    return allCoin.filter((coin) => matchesCoinPrefix(coin, term))
  }

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSelectedCoinId(null)
      setDisplayCoin(allCoin.slice(0, 10))
      return
    }

    if (selectedCoinId) {
      const selected = allCoin.find((coin) => coin.id === selectedCoinId)

      if (selected && selected.name.toLowerCase() === searchTerm.trim().toLowerCase()) {
        setDisplayCoin([selected])
        return
      }
    }

    const filtered = filterByFirstLetter(searchTerm)
    setDisplayCoin(filtered.slice(0, 10))
  }, [allCoin, searchTerm, selectedCoinId])

  const suggestions = useMemo(() => {
    if (!searchTerm.trim() || !isSuggestionOpen) return []

    return allCoin.filter((coin) => matchesCoinPrefix(coin, searchTerm)).slice(0, 6)
  }, [allCoin, searchTerm, isSuggestionOpen])

  const handleSearchSubmit = (e) => {
    e.preventDefault()

    if (!searchTerm.trim()) {
      setSelectedCoinId(null)
      setDisplayCoin(allCoin.slice(0, 10))
      return
    }

    const exactMatch = allCoin.find((coin) => {
      return coin.name.toLowerCase() === searchTerm.trim().toLowerCase() ||
        coin.symbol.toLowerCase() === searchTerm.trim().toLowerCase()
    })

    if (exactMatch) {
      setSelectedCoinId(exactMatch.id)
      setDisplayCoin([exactMatch])
      return
    }

    const filtered = filterByFirstLetter(searchTerm)
    setSelectedCoinId(null)
    setDisplayCoin(filtered.slice(0, 10))
  }

  const handleSuggestionClick = (coinName) => {
    const targetCoin = allCoin.find((coin) => coin.name.toLowerCase() === coinName.toLowerCase())

    if (targetCoin) {
      setSelectedCoinId(targetCoin.id)
      setSearchTerm(targetCoin.name)
      setDisplayCoin([targetCoin])
    } else {
      setSelectedCoinId(null)
      setDisplayCoin([])
    }

    setIsSuggestionOpen(false)
  }

  const handleSearchChange = (value) => {
    const trimmedValue = value
    setSelectedCoinId(null)
    setSearchTerm(trimmedValue)
    setIsSuggestionOpen(trimmedValue.trim().length > 0)
  }

  const shouldShowSuggestions = isSuggestionOpen && searchTerm.trim() && suggestions.length > 0
  const shouldShowNoSuggestionState = isSuggestionOpen && searchTerm.trim() && suggestions.length === 0

  return (
    <div className='home'>
      <div className='hero'>
        <h1>Largest <br /> Crypto Marketplace</h1>
        <p>
          Welcome to the world's largest cryptocurrency marketplace.
          Sign up to explore more about cryptos.
        </p>
        <form className='search-form' onSubmit={handleSearchSubmit}>
          <div className='search-wrapper'>
            <div className='search-input-box'>
              <input
                type='text'
                className='search-input'
                placeholder='Search crypto..'
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  type='button'
                  className='clear-search'
                  onClick={() => {
                    setSelectedCoinId(null)
                    setSearchTerm('')
                    setIsSuggestionOpen(false)
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {shouldShowSuggestions && (
              <div className='suggestion-box'>
                {suggestions.map((coin) => (
                  <button
                    type='button'
                    key={coin.id}
                    className='suggestion-item'
                    onClick={() => handleSuggestionClick(coin.name)}
                  >
                    <img src={coin.image} alt={coin.name} className='coin-image' />
                    <span>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {shouldShowNoSuggestionState && (
              <div className='suggestion-box'>
                <div className='suggestion-item no-suggestion'>No coin found</div>
              </div>
            )}
          </div>
          <button type='submit' className='search-button'>Search</button>
        </form>
      </div>

      <div className='crypto-table-wrap'>
        <table className='crypto-table'>
          <thead>
            <tr>
              <th>#</th>
              <th>Coins</th>
              <th>Price</th>
              <th>24H Change</th>
              <th>Market cap</th>
            </tr>
          </thead>
          <tbody>
            {displayCoin.length > 0 ? (
              displayCoin.map((coin, index) => (
                <tr key={`${coin.id}-${index}`}>
                  <td className='table-rank'>{coin.market_cap_rank || index + 1}</td>
                  <td className='table-coin'>
                    <div className='coin-info'>
                      <img src={coin.image} alt={coin.name} className='coin-image' />
                      <span>
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </span>
                    </div>
                  </td>
                  <td>{currency.symbol}{coin.current_price.toLocaleString()}</td>
                  <td className={coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>
                    {coin.price_change_percentage_24h?.toFixed(2) ?? '0.00'}%
                  </td>
                  <td>{currency.symbol}{coin.market_cap.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='5' className='no-results'>No coin found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Home