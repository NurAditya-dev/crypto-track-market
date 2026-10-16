import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import './Home.css'
import { CoinContext } from '../../context/CoinContext'

const Home = () => {
  const { allCoin, currency } = useContext(CoinContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [displayCoin, setDisplayCoin] = useState([])
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false)
  const [selectedCoinId, setSelectedCoinId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const tableWrapRef = useRef(null)

  const COINS_PER_PAGE = 10
  const totalPages = Math.ceil(displayCoin.length / COINS_PER_PAGE) || 1

  const paginatedCoin = useMemo(() => {
    const startIndex = (currentPage - 1) * COINS_PER_PAGE
    return displayCoin.slice(startIndex, startIndex + COINS_PER_PAGE)
  }, [displayCoin, currentPage])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      if (tableWrapRef.current) {
        tableWrapRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }

  const matchesCoinSearch = (coin, value) => {
    const term = value.trim().toLowerCase()

    if (!term) return true

    const coinName = coin.name.toLowerCase()
    const coinSymbol = coin.symbol.toLowerCase()

    return coinName.includes(term) || coinSymbol.includes(term)
  }

  const filterBySearchTerm = (value) => {
    const term = value.trim().toLowerCase()

    if (!term) {
      return allCoin
    }

    return allCoin.filter((coin) => matchesCoinSearch(coin, term))
  }

  useEffect(() => {
    setCurrentPage(1)
    if (!searchTerm.trim()) {
      setSelectedCoinId(null)
      setDisplayCoin(allCoin)
      return
    }

    if (selectedCoinId) {
      const selected = allCoin.find((coin) => coin.id === selectedCoinId)

      if (selected && selected.name.toLowerCase() === searchTerm.trim().toLowerCase()) {
        setDisplayCoin([selected])
        return
      }
    }

    const filtered = filterBySearchTerm(searchTerm)
    setDisplayCoin(filtered)
  }, [allCoin, searchTerm, selectedCoinId])

  // Reset to initial home state when logo is clicked
  useEffect(() => {
    const handleResetHome = () => {
      setSelectedCoinId(null)
      setSearchTerm('')
      setIsSuggestionOpen(false)
      setDisplayCoin(allCoin)
      setCurrentPage(1)
      if (tableWrapRef.current) {
        tableWrapRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    window.addEventListener('reset-crypto-home', handleResetHome)
    return () => {
      window.removeEventListener('reset-crypto-home', handleResetHome)
    }
  }, [allCoin])

  const suggestions = useMemo(() => {
    if (!searchTerm.trim() || !isSuggestionOpen) return []

    return allCoin.filter((coin) => matchesCoinSearch(coin, searchTerm)).slice(0, 6)
  }, [allCoin, searchTerm, isSuggestionOpen])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setCurrentPage(1)

    if (!searchTerm.trim()) {
      setSelectedCoinId(null)
      setDisplayCoin(allCoin)
      return
    }

    const filtered = filterBySearchTerm(searchTerm)
    setSelectedCoinId(null)
    setDisplayCoin(filtered)
    setIsSuggestionOpen(false)
    if (tableWrapRef.current) {
      tableWrapRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSuggestionClick = (coinName) => {
    const targetCoin = allCoin.find((coin) => coin.name.toLowerCase() === coinName.toLowerCase())
    setCurrentPage(1)

    if (targetCoin) {
      setSelectedCoinId(targetCoin.id)
      setSearchTerm(targetCoin.name)
      setDisplayCoin([targetCoin])
    } else {
      setSelectedCoinId(null)
      setDisplayCoin([])
    }

    setIsSuggestionOpen(false)
    if (tableWrapRef.current) {
      tableWrapRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSearchChange = (value) => {
    const trimmedValue = value
    setSelectedCoinId(null)
    setSearchTerm(trimmedValue)
    setCurrentPage(1)
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
                    setDisplayCoin(allCoin)
                    setCurrentPage(1)
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

      <div className='crypto-table-wrap' ref={tableWrapRef}>
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
            {paginatedCoin.length > 0 ? (
              paginatedCoin.map((coin, index) => {
                const globalIndex = (currentPage - 1) * COINS_PER_PAGE + index + 1
                return (
                  <tr key={`${coin.id}-${coin.market_cap_rank || globalIndex}`}>
                    <td className='table-rank'>{coin.market_cap_rank || globalIndex}</td>
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
                )
              })
            ) : (
              <tr>
                <td colSpan='5' className='no-results'>No coin found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className='pagination'>
          <button
            type='button'
            className='pagination-btn'
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &larr; Prev
          </button>
          <div className='pagination-info'>
            <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          </div>
          <button
            type='button'
            className='pagination-btn next-btn'
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next Page &rarr;
          </button>
        </div>
      )}
    </div>
  )
}

export default Home