import { memo, useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { formatPrice } from './formatPrice'

export function PriceStatus({ updatedAt, loading, failed, onReload }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])
  const minutes = Math.max(0, Math.floor((now - updatedAt) / 60000))
  const freshness = minutes ? `Diperbarui ${minutes} menit lalu` : 'Baru diperbarui'
  const status = loading ? 'Memuat harga…' : failed
    ? updatedAt ? 'Pembaruan gagal. Menampilkan harga terakhir.' : 'Harga belum tersedia.'
    : freshness
  const action = failed ? 'Coba lagi' : 'Muat ulang harga'
  return <div className={'price-status' + (failed || loading ? ' pending' : '')}>
    <p role="status"><i aria-hidden="true" />{status}
      {updatedAt && <time dateTime={new Date(updatedAt).toISOString()}>
        {new Date(updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
      </time>}
    </p>
    <button type="button" disabled={loading} onClick={onReload} aria-label={action} title={action}>
      <Icon name="reload" size={14} />{failed && 'Coba lagi'}
    </button>
  </div>
}

export const Sparkline = memo(function Sparkline({ prices, area = false }) {
  const id = useId()
  if (!Array.isArray(prices) || prices.length < 2 || prices.length > 2000 || !prices.every(Number.isFinite)) {
    return <span className="chart-empty" aria-label="Grafik tidak tersedia">—</span>
  }
  const low = Math.min(...prices), high = Math.max(...prices)
  const points = prices.map((price,i) => {
    const x = 1 + 138 * i / (prices.length - 1)
    const y = high === low ? 23 : 43 - 40 * (price-low)/(high-low)
    return x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
  const change = prices.at(-1) - prices[0]
  const label = change === 0 ? 'Harga berakhir setara dalam 7 hari' : change > 0 ? 'Harga naik dalam 7 hari' : 'Harga turun dalam 7 hari'
  return <svg className={'sparkline ' + (change === 0 ? 'neutral' : change > 0 ? 'positive' : 'negative')}
    viewBox="0 0 140 48" preserveAspectRatio="none" role="img" aria-label={label}>
    {area && <>
      <defs><linearGradient id={id} x2="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="currentColor" stopOpacity=".24" /><stop offset="1" stopColor="currentColor" stopOpacity="0" />
      </linearGradient></defs>
      <polygon points={'1,48 ' + points + ' 139,48'} fill={'url(#'+id+')'} />
    </>}
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.65"
      vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
})

export function ChangeBadge({ value }) {
  if (!Number.isFinite(value)) return <span className="neutral">—</span>
  const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
  return <span className={'change-badge ' + direction}>
    {value > 0 ? '+' : ''}{value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%
  </span>
}

const popular = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
]

export function CoinIcon({ coin }) {
  const [loadedUrl, setLoadedUrl] = useState(null)
  const loaded = coin.image && loadedUrl === coin.image
  return <span className="coin-image coin-avatar" aria-hidden="true">
    {!loaded && <span className={'coin-initial ' + coin.id}>
      {coin.id === 'bitcoin' ? '₿' : coin.id === 'ethereum' ? '♦' : coin.id === 'solana' ? '≋' : coin.name[0]}
    </span>}
    {coin.image && <img src={coin.image} alt="" decoding="async" data-loaded={Boolean(loaded)}
      className={coin.id === 'ethereum' ? 'ethereum-icon' : undefined}
      onLoad={() => setLoadedUrl(coin.image)} onError={() => setLoadedUrl(null)} />}
  </span>
}

export function Highlights({ coins, currency, coinLink }) {
  return <section className="highlights" aria-labelledby="highlight-title">
    <div className="section-heading"><h2 id="highlight-title">Sorotan koin</h2><span>Perubahan 24 jam · Grafik 7 hari</span></div>
    <div className="highlight-grid">{popular.map(identity => {
      const coin = coins.find(item => item.id === identity.id) ?? identity
      return <Link key={coin.id} className="highlight-card" to={coinLink(coin.id)}>
        <div className="highlight-top"><CoinIcon coin={coin} /><h3>{coin.name} <small>{coin.symbol.toUpperCase()}</small></h3>
          <Icon name="external" size={16} /></div>
        <div className="highlight-bottom"><div className="highlight-quote">
          <strong>{formatPrice(coin.current_price, currency)}</strong><ChangeBadge value={coin.price_change_percentage_24h} />
        </div><div className="highlight-graph"><Sparkline prices={coin.sparkline_in_7d?.price} area /></div></div>
      </Link>
    })}</div>
  </section>
}
