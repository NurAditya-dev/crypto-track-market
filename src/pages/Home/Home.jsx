import { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './Home.css'
import LockedFeatures from '../../account/LockedFeatures'
import { AccountContext } from '../../account/AccountContext'
import { CoinContext } from '../../context/CoinContext.js'
import useQuotes from '../../account/useQuotes'
import { PriceStatus, Sparkline } from './MarketDetails'

const columns = {
  current_price: 'Harga',
  price_change_percentage_24h: 'Perubahan 24 jam',
  market_cap: 'Kapitalisasi pasar',
}
const filters = { all: 'Semua koin', gainers: 'Naik terbesar', losers: 'Turun terbesar', watch: 'Pantauan Saya' }
const coinsPerPage = 10

function comparePrices(a, b, field, ascending) {
  if (!Number.isFinite(a[field])) return Number.isFinite(b[field]) ? 1 : 0
  if (!Number.isFinite(b[field])) return -1
  return ascending ? a[field] - b[field] : b[field] - a[field]
}

function matchesSearch(coin, query) {
  return coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query)
}

function formatPrice(price, currency) {
  return Number.isFinite(price)
    ? price.toLocaleString('id-ID', { style: 'currency', currency: currency.name, maximumFractionDigits: price < 1 ? 10 : 2 })
    : '—'
}


const Home = () => {
  const { user, entries, ready, busy, toggleWatch } = useContext(AccountContext)
  const { allCoin, currency, pricesLoading, pricesFailed, pricesUpdatedAt, reloadPrices } = useContext(CoinContext)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') ?? ''
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false)
  const tableWrapRef = useRef(null)
  const requestedFilter = searchParams.get('filter')
  const filter = Object.hasOwn(filters, requestedFilter) && (requestedFilter !== 'watch' || user) ? requestedFilter : 'all'
  const requestedSort = searchParams.get('sort')
  const sort = Object.hasOwn(columns, requestedSort) ? requestedSort : ''
  const changeField = 'price_change_percentage_24h'
  const sortField = sort || (filter === 'gainers' || filter === 'losers' ? changeField : '')
  const ascending = sort ? searchParams.get('order') === 'asc' : filter === 'losers'
  const watched = entries.filter(row => row.kind === 'watch')
  const watchedIds = new Set(watched.map(row => row.coin_id))
  const loadedIds = new Set(allCoin.map(coin => coin.id))
  const extraWatched = filter === 'watch' ? watched.filter(row => !loadedIds.has(row.coin_id)) : []
  const { quotes } = useQuotes(extraWatched, currency.name)
  const extras = extraWatched.map(row => ({
    id: row.coin_id,
    name: row.coin_name,
    symbol: '',
    current_price: quotes?.[row.coin_id]?.[currency.name],
    price_change_percentage_24h: quotes?.[row.coin_id]?.[currency.name + '_24h_change'],
  }))
  const query = searchTerm.trim().toLowerCase()
  const filtered = [...allCoin, ...extras].filter(coin => {
    if (filter === 'watch' && !watchedIds.has(coin.id)) return false
    if (filter === 'gainers' && !(coin[changeField] > 0)) return false
    if (filter === 'losers' && !(coin[changeField] < 0)) return false
    return matchesSearch(coin, query)
  })
  if (sortField) filtered.sort((a, b) => comparePrices(a, b, sortField, ascending))

  const totalPages = Math.max(1, Math.ceil(filtered.length / coinsPerPage))
  const requestedPage = searchParams.get('page')
  const currentPage = requestedPage === 'last' ? totalPages
    : Math.min(totalPages, Math.max(1, Number.parseInt(requestedPage, 10) || 1))
  const start = (currentPage - 1) * coinsPerPage
  const paginatedCoin = filtered.slice(start, start + coinsPerPage)
  const suggestions = isSuggestionOpen && query ? filtered.slice(0, 6) : []
  const pendingData = filter === 'watch' ? !ready : pricesLoading && !pricesUpdatedAt
  const emptyMessage = pendingData ? 'Memuat koin…' : pricesFailed && filter !== 'watch' && !pricesUpdatedAt
    ? 'Daftar koin belum tersedia.' : filter === 'watch' && !watched.length
      ? 'Belum ada koin di Pantauan Saya.' : 'Koin tidak ditemukan.'

  function updateParams(patch, replace = false) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSearchParams(next, { replace, preventScrollReset: true })
  }

  function handlePageChange(page) {
    updateParams({ page: page > 1 ? page : '' })
    tableWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function handleSort(field, direction) {
    updateParams({ sort: field, order: direction, page: '' })
  }

  function handleSearchChange(value) {
    setIsSuggestionOpen(Boolean(value.trim()))
    updateParams({ q: value, page: '' }, true)
  }

  function coinLink(id) {
    const params = new URLSearchParams({ from: currentPage })
    for (const key of ['q', 'filter', 'sort', 'order']) {
      if (searchParams.has(key)) params.set(key, searchParams.get(key))
    }
    return '/coin/' + encodeURIComponent(id) + '?' + params
  }

  useEffect(() => {
    const resetHome = () => {
      setIsSuggestionOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('reset-crypto-home', resetHome)
    return () => window.removeEventListener('reset-crypto-home', resetHome)
  }, [])

  return (
    <div className='home'>
      <div className='hero'>
        <h1>Pantau harga kripto</h1>
        <p>
          Cari koin dan lihat harga, perubahan 24 jam, serta kapitalisasi pasarnya.
        </p>
        <form className='search-form' onSubmit={event => {
          event.preventDefault()
          setIsSuggestionOpen(false)
          tableWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }}>
          <div className='search-wrapper'>
            <div className='search-input-box'>
              <input
                type='text'
                className='search-input'
                placeholder='Cari nama atau simbol koin'
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  type='button'
                  className='clear-search'
                  aria-label='Hapus pencarian'
                  onClick={() => handleSearchChange('')}
                >
                  ×
                </button>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className='suggestion-box'>
                {suggestions.map((coin) => (
                  <button
                    type='button'
                    key={coin.id}
                    className='suggestion-item'
                    onClick={() => navigate(coinLink(coin.id))}
                  >
                    {coin.image && <img src={coin.image} alt='' className='coin-image' />}
                    <span>
                      {coin.name}{coin.symbol && ' (' + coin.symbol.toUpperCase() + ')'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {isSuggestionOpen && query && !pendingData && !pricesFailed && !suggestions.length && (
              <div className='suggestion-box'>
                <div className='suggestion-item no-suggestion'>Koin tidak ditemukan</div>
              </div>
            )}
          </div>
          <button type='submit' className='search-button'>Cari</button>
        </form>
      </div>

      <div className='market-controls'>
        <PriceStatus updatedAt={pricesUpdatedAt} loading={pricesLoading} failed={pricesFailed} onReload={reloadPrices} />
        <div className='market-filters' role='group' aria-label='Filter koin'>
          {Object.entries(filters).filter(([id]) => id !== 'watch' || user).map(([id, label]) =>
            <button type='button' key={id} aria-pressed={filter === id}
              onClick={() => { setIsSuggestionOpen(false); updateParams({ filter: id === 'all' ? '' : id, sort: '', order: '', page: '' }) }}>
              {label}
            </button>)}
        </div>
        <label className='mobile-sort'>Urutkan
          <select value={sortField ? sortField + ':' + (ascending ? 'asc' : 'desc') : ''} onChange={event => {
            const [field, direction] = event.target.value.split(':')
            handleSort(field, direction)
          }}>
            {filter !== 'gainers' && filter !== 'losers' && <option value=''>Peringkat pasar</option>}
            {Object.entries(columns).flatMap(([field, label]) => [
              <option key={field + ':desc'} value={field + ':desc'}>{label} tertinggi</option>,
              <option key={field + ':asc'} value={field + ':asc'}>{label} terendah</option>,
            ])}
          </select>
        </label>
      </div>
      <div className='crypto-table-wrap' ref={tableWrapRef}>
        <table className='crypto-table'>
          <thead>
            <tr>
              <th className='col-rank'>#</th>
              <th className='col-coin'>Koin</th>
              {Object.entries(columns).map(([field, label], index) =>
                <th key={field} scope='col' className={['col-price', 'col-change', 'col-cap'][index]}
                  aria-sort={sortField === field ? ascending ? 'ascending' : 'descending' : undefined}>
                  <button type='button' className='sort-header'
                    onClick={() => handleSort(field, sortField === field && !ascending ? 'asc' : 'desc')}>
                    <span className={index === 1 ? 'header-desktop' : undefined}>{label}</span>
                    {index === 1 && <span className='header-mobile'>24 jam</span>}
                    <span aria-hidden='true' className='sort-arrow'>{sortField === field ? ascending ? '↑' : '↓' : '↕'}</span>
                  </button>
                </th>)}
              <th className='col-trend' scope='col'>7 hari</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCoin.length > 0 ? (
              paginatedCoin.map(coin => {
                const change = coin.price_change_percentage_24h
                const detailUrl = coinLink(coin.id)
                return (
                  <tr
                    key={coin.id}
                    onClick={() => navigate(detailUrl)}
                    className='crypto-table-row'
                  >
                    <td className='table-rank'>{coin.market_cap_rank ?? '—'}</td>
                    <td className='table-coin'>
                      <div className='coin-info'>
                        <button className="watch-star" type="button" aria-label={`Pantau ${coin.name}`}
                          aria-pressed={watchedIds.has(coin.id)}
                          disabled={user === undefined || (user && !ready) || busy}
                          onClick={e => { e.stopPropagation(); toggleWatch(coin) }}>
                          {watchedIds.has(coin.id) ? '★' : '☆'}
                        </button>
                        {coin.image && <img src={coin.image} alt='' className='coin-image' />}
                        <Link className='coin-name-wrap' to={detailUrl} onClick={event => event.stopPropagation()}>
                          <span className='coin-name'>{coin.name}</span>
                          {coin.symbol && <span className='coin-symbol'>{coin.symbol.toUpperCase()}</span>}
                        </Link>
                      </div>
                    </td>
                    <td className='table-price'>{formatPrice(coin.current_price, currency)}</td>
                    <td className={`table-change ${Number.isFinite(change) ? change >= 0 ? 'positive' : 'negative' : ''}`}>
                      {Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%` : '—'}
                    </td>
                    <td className='table-cap'>{formatPrice(coin.market_cap, currency)}</td>
                    <td className='table-trend'><Sparkline prices={coin.sparkline_in_7d?.price} /></td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan='6' className='no-results'>{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className='pagination'>
          <button
            type='button'
            className='pagination-btn nav-edge-btn'
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title='Kembali ke Halaman Awal'
          >
            « <span className='btn-text-desktop'>Halaman Awal</span><span className='btn-text-mobile'>Awal</span>
          </button>
          <button
            type='button'
            className='pagination-btn'
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title='Halaman Sebelumnya'
          >
            Sebelumnya
          </button>
          <div className='pagination-info'>
            <span className='info-desktop'>Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong></span>
            <span className='info-mobile'><strong>{currentPage}</strong> / <strong>{totalPages}</strong></span>
          </div>
          <button
            type='button'
            className='pagination-btn next-btn'
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title='Halaman Selanjutnya'
          >
            Selanjutnya
          </button>
          <button
            type='button'
            className='pagination-btn nav-edge-btn'
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            title='Langsung ke Halaman Akhir'
          >
            <span className='btn-text-desktop'>Halaman Akhir</span><span className='btn-text-mobile'>Akhir</span> »
          </button>
        </div>
      )}
      {user === null && <LockedFeatures />}
    </div>
  )
}

export default Home
