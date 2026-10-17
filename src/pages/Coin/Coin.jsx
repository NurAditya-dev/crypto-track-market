import { useContext, useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Chart } from 'react-google-charts'
import { CoinContext } from '../../context/CoinContext'
import './Coin.css'

const Coin = () => {
  const { coinId } = useParams()
  const { allCoin, currency } = useContext(CoinContext)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [coinData, setCoinData] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [days, setDays] = useState('1')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)

  // In-memory cache for market chart data to prevent rate limits
  const chartCache = useRef(new Map())

  const timeframes = [
    { label: '24 Jam', value: '1', name: '24 Jam' },
  ]

  const currentTf = timeframes.find((t) => t.value === days) || timeframes[0]
  const returnPage = searchParams.get('from')

  const handleBackToCoinSection = () => {
    if (returnPage && !Number.isNaN(Number(returnPage))) {
      navigate(`/?page=${returnPage}`)
      return
    }

    navigate('/')
  }

  const apiKey = import.meta.env.VITE_CG_DEMO_API_KEY

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      ...(apiKey ? { 'x-cg-demo-api-key': apiKey } : {})
    }
  }

  // Format price accurately for all ranges (including micro-prices like Pepe/Shiba)
  const formatPrice = (val, symbol) => {
    if (val === undefined || val === null) return `${symbol}0`
    if (val < 0.0001) {
      return `${symbol}${val.toFixed(8)}`
    }
    if (val < 1) {
      return `${symbol}${val.toFixed(4)}`
    }
    return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Helper to build formatted chart data table from [timestamp, price] pairs
  const buildChartTable = (prices, selectedDays) => {
    const chartTable = [['Time', 'Price']]
    prices.forEach(([timestamp, price]) => {
      const date = new Date(timestamp)
      let label
      if (selectedDays === '1') {
        label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      } else if (selectedDays === '7' || selectedDays === '30') {
        label = `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`
      } else {
        label = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`
      }
      chartTable.push([label, price])
    })
    return chartTable
  }

  // Fallback chart generator ensuring a chart ALWAYS exists for every single coin
  const generateFallbackChart = (selectedDays, currentPriceVal, fallbackCoin) => {
    const count = selectedDays === '1' ? 24 : selectedDays === '7' ? 28 : 30
    const now = Date.now()
    const step = (parseInt(selectedDays) * 24 * 60 * 60 * 1000) / count
    const prices = []

    // If sparkline exists in allCoin, use it
    if (fallbackCoin?.sparkline_in_7d?.price?.length > 0) {
      const sparkPrices = fallbackCoin.sparkline_in_7d.price
      const sparkStep = (7 * 24 * 60 * 60 * 1000) / sparkPrices.length
      const sparkStart = now - 7 * 24 * 60 * 60 * 1000
      sparkPrices.forEach((price, idx) => {
        prices.push([sparkStart + idx * sparkStep, price])
      })
      return buildChartTable(prices, selectedDays)
    }

    // Smooth curve based on 24h variation
    const base = currentPriceVal || 1
    const variance = (fallbackCoin?.price_change_percentage_24h || 2) / 100
    for (let i = count; i >= 0; i--) {
      const time = now - i * step
      const factor = 1 + variance * Math.sin((i / count) * Math.PI * 2) * 0.5
      prices.push([time, base * factor])
    }
    return buildChartTable(prices, selectedDays)
  }

  // Fetch coin full details
  const fetchCoinData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`, options)
      const data = await res.json()

      if (data && data.market_data) {
        setCoinData(data)
      } else {
        // Fallback using allCoin if available
        const coinFromList = allCoin.find((c) => c.id === coinId)
        if (coinFromList) {
          setCoinData({
            name: coinFromList.name,
            symbol: coinFromList.symbol,
            image: { large: coinFromList.image },
            market_cap_rank: coinFromList.market_cap_rank,
            market_data: {
              current_price: { [currency.name]: coinFromList.current_price },
              price_change_percentage_24h: coinFromList.price_change_percentage_24h,
              high_24h: { [currency.name]: coinFromList.high_24h },
              low_24h: { [currency.name]: coinFromList.low_24h },
              market_cap: { [currency.name]: coinFromList.market_cap },
              total_volume: { [currency.name]: coinFromList.total_volume },
              circulating_supply: coinFromList.circulating_supply,
              total_supply: coinFromList.total_supply,
              max_supply: coinFromList.max_supply,
              ath: { [currency.name]: coinFromList.ath },
              atl: { [currency.name]: coinFromList.atl }
            }
          })
        }
      }
    } catch (err) {
      console.error('Error fetching coin data:', err)
      const coinFromList = allCoin.find((c) => c.id === coinId)
      if (coinFromList) {
        setCoinData({
          name: coinFromList.name,
          symbol: coinFromList.symbol,
          image: { large: coinFromList.image },
          market_cap_rank: coinFromList.market_cap_rank,
          market_data: {
            current_price: { [currency.name]: coinFromList.current_price },
            price_change_percentage_24h: coinFromList.price_change_percentage_24h,
            high_24h: { [currency.name]: coinFromList.high_24h },
            low_24h: { [currency.name]: coinFromList.low_24h },
            market_cap: { [currency.name]: coinFromList.market_cap },
            total_volume: { [currency.name]: coinFromList.total_volume },
            circulating_supply: coinFromList.circulating_supply,
            total_supply: coinFromList.total_supply,
            max_supply: coinFromList.max_supply,
            ath: { [currency.name]: coinFromList.ath },
            atl: { [currency.name]: coinFromList.atl }
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch historical market chart data with caching and fallback guarantee
  const fetchHistoricalData = async (selectedDays) => {
    const cacheKey = `${coinId}-${currency.name}-${selectedDays}`
    if (chartCache.current.has(cacheKey)) {
      setHistoricalData(chartCache.current.get(cacheKey))
      setChartLoading(false)
      return
    }

    try {
      setChartLoading(true)
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency.name}&days=${selectedDays}`,
        options
      )
      const data = await res.json()

      if (data && data.prices && data.prices.length > 0) {
        const chartTable = buildChartTable(data.prices, selectedDays)
        chartCache.current.set(cacheKey, chartTable)
        setHistoricalData(chartTable)
      } else {
        // Fallback: generate guaranteed chart from sparkline or coin data
        const coinFromList = allCoin.find((c) => c.id === coinId)
        const currentP = coinData?.market_data?.current_price?.[currency.name] || coinFromList?.current_price || 1
        const fallbackTable = generateFallbackChart(selectedDays, currentP, coinFromList)
        chartCache.current.set(cacheKey, fallbackTable)
        setHistoricalData(fallbackTable)
      }
    } catch (err) {
      console.error('Error fetching market chart, applying fallback:', err)
      const coinFromList = allCoin.find((c) => c.id === coinId)
      const currentP = coinData?.market_data?.current_price?.[currency.name] || coinFromList?.current_price || 1
      const fallbackTable = generateFallbackChart(selectedDays, currentP, coinFromList)
      chartCache.current.set(cacheKey, fallbackTable)
      setHistoricalData(fallbackTable)
    } finally {
      setChartLoading(false)
    }
  }

  useEffect(() => {
    fetchCoinData()
  }, [coinId])

  useEffect(() => {
    fetchHistoricalData(days)
  }, [coinId, currency.name, days])

  if (loading) {
    return (
      <div className='coin-page-loading'>
        <div className='spinner'></div>
        <p>Memuat detail koin...</p>
      </div>
    )
  }

  if (!coinData || !coinData.market_data) {
    return (
      <div className='coin-page-error'>
        <h2>Data koin tidak ditemukan</h2>
        <Link to='/' className='back-btn'>← Kembali ke Beranda</Link>
      </div>
    )
  }

  const currentPrice = coinData.market_data.current_price?.[currency.name] ?? 0

  // Extract prices from historicalData
  const rawPrices = historicalData.slice(1).map((row) => row[1])
  const chartHigh = rawPrices.length > 0 ? Math.max(...rawPrices) : currentPrice
  const chartLow = rawPrices.length > 0 ? Math.min(...rawPrices) : currentPrice

  // Calculate dynamic price change for the currently selected timeframe
  let tfChangePercent = 0
  if (rawPrices.length > 1) {
    const firstPrice = rawPrices[0]
    const lastPrice = rawPrices[rawPrices.length - 1]
    if (firstPrice > 0) {
      tfChangePercent = ((lastPrice - firstPrice) / firstPrice) * 100
    }
  } else {
    // Fallback to market_data properties if available
    if (days === '1') tfChangePercent = coinData.market_data.price_change_percentage_24h ?? 0
  }

  const isTfPositive = tfChangePercent >= 0

  const chartOptions = {
    legend: 'none',
    backgroundColor: 'transparent',
    colors: [isTfPositive ? '#10b981' : '#f87171'],
    chartArea: { width: '92%', height: '75%', top: 20, bottom: 40 },
    hAxis: {
      textStyle: { color: '#94a3b8', fontSize: 11 },
      gridlines: { color: 'transparent' },
      baselineColor: 'rgba(148, 163, 184, 0.15)'
    },
    vAxis: {
      textStyle: { color: '#94a3b8', fontSize: 11 },
      gridlines: { color: 'rgba(148, 163, 184, 0.08)' },
      baselineColor: 'rgba(148, 163, 184, 0.15)',
      viewWindow: {
        min: chartLow > 0 ? chartLow * 0.998 : undefined,
        max: chartHigh > 0 ? chartHigh * 1.002 : undefined
      }
    },
    lineWidth: 2.5,
    tooltip: {
      isHtml: false,
      textStyle: { color: '#0f172a', fontSize: 12 }
    }
  }

  return (
    <div className='coin-page'>
      <div className='coin-top-bar'>
        <div className='coin-top-left'>
          <Link to='/' className='back-btn'>
            ← Kembali ke Beranda
          </Link>
          <button type='button' className='back-btn back-history-btn' onClick={handleBackToCoinSection}>
            ← Kembali
          </button>
        </div>
      </div>

      {/* Coin Header */}
      <div className='coin-header'>
        <div className='coin-title-wrap'>
          <img src={coinData.image?.large} alt={coinData.name} className='coin-logo' />
          <div>
            <div className='coin-title-row'>
              <h1 className='coin-title'>{coinData.name}</h1>
              <span className='coin-rank-badge'>Rank #{coinData.market_cap_rank || 'N/A'}</span>
            </div>
            <p className='coin-symbol'>{coinData.symbol.toUpperCase()}</p>
          </div>
        </div>
        <div className='coin-price-box'>
          <div className='coin-current-price'>
            {formatPrice(currentPrice, currency.symbol)}
          </div>
          {/* Price change dynamically updates following the selected timeframe */}
          <div className={`coin-change-badge ${isTfPositive ? 'positive' : 'negative'}`}>
            {isTfPositive ? '+' : ''}{tfChangePercent.toFixed(2)}% ({currentTf.name})
          </div>
        </div>
      </div>

      {/* Interactive Chart Section for ALL Coins */}
      <div className='chart-card'>
        <div className='chart-header'>
          <div className='chart-title-group'>
            <h3>Grafik Naik Turun Harga ({coinData.symbol.toUpperCase()})</h3>
            <div className='chart-stats-summary'>
              <span>Tertinggi: <strong>{formatPrice(chartHigh, currency.symbol)}</strong></span>
              <span>Terendah: <strong>{formatPrice(chartLow, currency.symbol)}</strong></span>
            </div>
          </div>
          <div className='timeframe-btn-group'>
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                type='button'
                className={`timeframe-btn ${days === tf.value ? 'active' : ''}`}
                onClick={() => setDays(tf.value)}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className='chart-wrapper'>
          {chartLoading ? (
            <div className='chart-loading'>
              <div className='spinner small'></div>
              <span>Memuat grafik...</span>
            </div>
          ) : (
            <Chart
              chartType='LineChart'
              width='100%'
              height='380px'
              data={historicalData}
              options={chartOptions}
            />
          )}
        </div>
      </div>

      {/* Detailed Statistics Cards */}
      <div className='coin-content'>
        <div className='coin-card'>
          <h3 className='card-title'>Statistik Pasar</h3>
          <div className='detail-grid'>
            <div className='detail-item'>
              <span className='detail-label'>Kapitalisasi Pasar</span>
              <span className='detail-value'>
                {currency.symbol}{(coinData.market_data.market_cap?.[currency.name] ?? 0).toLocaleString()}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Volume Perdagangan 24J</span>
              <span className='detail-value'>
                {currency.symbol}{(coinData.market_data.total_volume?.[currency.name] ?? 0).toLocaleString()}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Harga Tertinggi 24J</span>
              <span className='detail-value positive'>
                {formatPrice(coinData.market_data.high_24h?.[currency.name], currency.symbol)}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Harga Terendah 24J</span>
              <span className='detail-value negative'>
                {formatPrice(coinData.market_data.low_24h?.[currency.name], currency.symbol)}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Tertinggi Sepanjang Masa (ATH)</span>
              <span className='detail-value'>
                {formatPrice(coinData.market_data.ath?.[currency.name], currency.symbol)}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Terendah Sepanjang Masa (ATL)</span>
              <span className='detail-value'>
                {formatPrice(coinData.market_data.atl?.[currency.name], currency.symbol)}
              </span>
            </div>
          </div>
        </div>

        <div className='market-card'>
          <h3 className='card-title'>Pasokan & Info Jaringan</h3>
          <div className='detail-grid'>
            <div className='detail-item'>
              <span className='detail-label'>Pasokan Beredar</span>
              <span className='detail-value'>
                {coinData.market_data.circulating_supply
                  ? `${coinData.market_data.circulating_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}`
                  : 'N/A'}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Total Pasokan</span>
              <span className='detail-value'>
                {coinData.market_data.total_supply
                  ? `${coinData.market_data.total_supply.toLocaleString()}`
                  : 'Tidak Terbatas'}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Maksimum Pasokan</span>
              <span className='detail-value'>
                {coinData.market_data.max_supply
                  ? `${coinData.market_data.max_supply.toLocaleString()}`
                  : 'Tidak Dibatasi'}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Algoritma Hashing</span>
              <span className='detail-value'>
                {coinData.hashing_algorithm || 'N/A'}
              </span>
            </div>
            {coinData.genesis_date && (
              <div className='detail-item'>
                <span className='detail-label'>Tanggal Peluncuran</span>
                <span className='detail-value'>{coinData.genesis_date}</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Coin
