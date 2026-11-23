import { useEffect, useRef, useState } from 'react'

export function PriceStatus({ updatedAt, loading, failed, onReload }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])
  const minutes = Math.max(0, Math.floor((now - updatedAt) / 60000))
  const freshness = minutes ? `Diperbarui ${minutes} menit lalu` : 'Baru diperbarui'

  return <div className="price-status">
    <p role="status">
      {loading ? 'Memuat harga…' : failed
        ? updatedAt ? 'Pembaruan gagal. Menampilkan harga terakhir.' : 'Harga pasar belum tersedia.'
        : freshness}
      {updatedAt && <small>CoinGecko · <time dateTime={new Date(updatedAt).toISOString()}>
        {new Date(updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
      </time></small>}
    </p>
    <button type="button" disabled={loading} onClick={onReload}>{failed ? 'Coba lagi' : 'Muat ulang harga'}</button>
  </div>
}

export function Sparkline({ prices }) {
  const canvas = useRef(null)
  const available = Array.isArray(prices) && prices.length > 1
    && prices.length <= 2000 && prices.every(Number.isFinite)
  const rising = available && prices.at(-1) >= prices[0]

  useEffect(() => {
    if (!available) return
    const context = canvas.current.getContext('2d')
    if (!context) return
    const low = Math.min(...prices)
    const range = Math.max(...prices) - low
    context.clearRect(0, 0, 176, 48)
    context.strokeStyle = rising ? '#34d399' : '#fb7185'
    context.lineWidth = 3
    context.lineJoin = 'round'
    context.lineCap = 'round'
    context.beginPath()
    prices.forEach((price, index) => {
      const x = 3 + index * 170 / (prices.length - 1)
      const y = range ? 45 - ((price - low) / range) * 42 : 24
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
    context.stroke()
  }, [available, prices, rising])

  if (!available) return <span aria-label="Grafik tidak tersedia">—</span>
  return <canvas className="sparkline" ref={canvas} width={176} height={48} role="img"
    aria-label={prices.at(-1) === prices[0] ? 'Harga berakhir setara dalam 7 hari' : rising ? 'Harga naik dalam 7 hari' : 'Harga turun dalam 7 hari'} />
}
