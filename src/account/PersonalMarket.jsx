import { useContext, useState } from 'react'
import { Link, NavLink, useSearchParams } from 'react-router-dom'
import LockedFeatures from './LockedFeatures'
import { AccountContext } from './AccountContext'
import { CoinContext } from '../context/CoinContext'
import { client } from './client'
import useQuotes from './useQuotes'
import './personal.css'

const pages = { watch: 'Pantauan Saya', alert: 'Peringatan Harga', holding: 'Portofolio' }
const money = (value, currency = 'idr') => Number.isFinite(value)
  ? value.toLocaleString('id-ID', { style: 'currency', currency, maximumFractionDigits: value && Math.abs(value) < 1 ? 8 : 2 })
  : '—'

export function MarketNav() {
  const { entries } = useContext(AccountContext)
  const triggered = entries.filter(row => row.kind === 'alert' && row.triggered_at).length
  return <nav className="market-nav" aria-label="Navigasi pasar">
    <NavLink to="/" end>Pasar</NavLink>
    {Object.entries(pages).map(([key, label]) =>
      <NavLink to={'/saya/' + key} key={key}>{label}
        {key === 'alert' && triggered > 0 && <span aria-label={triggered + ' target tercapai'}>{triggered}</span>}
      </NavLink>)}
  </nav>
}

function EntryForm({ kind, coins, initialCoin }) {
  const { change, busy } = useContext(AccountContext)
  const [coinId, setCoinId] = useState(initialCoin)
  const [error, setError] = useState('')
  const holding = kind === 'holding'
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    const coin = coins.find(c => c.id === coinId)
    const price = Number(fields.get('price'))
    const quantity = Number(fields.get('quantity'))
    if (!coin || !(price > 0 && price < 1e30) || (holding && !(quantity > 0 && quantity < 1e30))) {
      setError('Pilih koin dan masukkan angka positif yang valid.')
      return
    }
    setError('')
    const entry = { kind, coin_id: coin.id, coin_name: coin.name, price }
    if (holding) entry.quantity = quantity
    else entry.direction = fields.get('direction')
    const ok = await change(() => client.from('market_entries').insert(entry))
    if (ok) { form.reset(); setCoinId(initialCoin) }
  }
  return <form className="personal-form" onSubmit={submit}>
    <label>Koin<select required value={coinId} onChange={e => setCoinId(e.target.value)}>
      <option value="">Pilih koin</option>
      {coins.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select></label>
    {holding ? <label>Jumlah koin<input name="quantity" type="number" min="0" step="any" required /></label>
      : <label>Beri tahu saat harga<select name="direction"><option value="below">Turun hingga</option><option value="above">Naik hingga</option></select></label>}
    <label>{holding ? 'Harga beli per koin (Rp)' : 'Target harga (Rp)'}
      <input name="price" type="number" step="any" min="0" required /></label>
    <button disabled={busy}>{holding ? 'Catat pembelian' : 'Buat peringatan'}</button>
    {error && <p role="alert">{error}</p>}
  </form>
}

export default function PersonalMarket({ kind }) {
  const { user, ready, entries, busy, remove } = useContext(AccountContext)
  const { allCoin, currency } = useContext(CoinContext)
  const [params] = useSearchParams()
  const rows = entries.filter(row => row.kind === kind)
  const { quotes, failed } = useQuotes(kind === 'alert' ? [] : rows, currency.name)
  if (user === undefined) return <p className="personal">Memuat akun…</p>
  if (!user) return <main className="personal"><h1>{pages[kind]}</h1><LockedFeatures kind={kind} /></main>
  const choices = new Map(entries.map(row => [row.coin_id, { id: row.coin_id, name: row.coin_name }]))
  for (const coin of allCoin) choices.set(coin.id, coin)
  const coins = Array.from(choices.values()).sort((a,b) => a.name.localeCompare(b.name))
  const invested = rows.reduce((sum, row) => sum + row.quantity * row.price, 0)
  const valued = rows.every(row => Number.isFinite(quotes?.[row.coin_id]?.idr))
  const value = valued ? rows.reduce((sum, row) => sum + row.quantity * quotes[row.coin_id].idr, 0) : NaN
  return <main className="personal">
    <h1>{pages[kind]}</h1>
    {kind === 'alert' && <p>Pilih target dalam rupiah. Harga diperiksa setiap 5 menit. Saat target tercapai, satu notifikasi tersimpan di sini.</p>}
    {kind === 'holding' && <p>Catat jumlah koin dan harga beli untuk melihat nilai portofolio dalam rupiah.</p>}
    {!ready ? <p>Memuat data akun…</p> : <>
      {kind !== 'watch' && <EntryForm key={kind + params.toString()} kind={kind} coins={coins} initialCoin={params.get('coin') || ''} />}
      {kind === 'holding' && rows.length > 0 && <div className="portfolio-summary">
        {[['Total modal', invested], ['Nilai sekarang', value], ['Untung / rugi', value - invested]].map(([title, amount]) =>
          <div key={title}><small>{title}</small><strong>{money(amount)}</strong></div>)}
      </div>}
      {failed && kind !== 'alert' && <p role="status">Harga terkini belum tersedia. Pembaruan berikutnya dalam satu menit.</p>}
      {!rows.length && <div className="personal-empty">{kind === 'watch'
        ? <>Daftar pantauan masih kosong. Pilih bintang di samping koin pada <Link to="/">halaman pasar</Link>.</>
        : kind === 'alert' ? 'Belum ada peringatan harga.' : 'Belum ada pembelian yang dicatat.'}</div>}
      <ul className="entry-list">{rows.map(row => {
        const quote = quotes?.[row.coin_id]
        const percent = quote?.[currency.name + '_24h_change']
        return <li key={row.id}>
          <div className="entry-main"><Link to={'/coin/' + row.coin_id}>{row.coin_name}</Link>
            {kind === 'watch' && <p>{money(quote?.[currency.name], currency.name)} · 24 jam {Number.isFinite(percent) ? percent.toFixed(2) + '%' : '—'}</p>}
            {kind === 'alert' && <>
              <p>{row.direction === 'above' ? 'Naik hingga ' : 'Turun hingga '}{money(row.price)}</p>
              {row.triggered_at ? <strong className="hit">Target tercapai · {money(row.triggered_price)} · {new Date(row.triggered_at).toLocaleString('id-ID')}</strong> : <small>Menunggu target</small>}
            </>}
            {kind === 'holding' && <p>{row.quantity.toLocaleString('id-ID', { maximumSignificantDigits: 15 })} koin × {money(row.price)} · Nilai sekarang {money(row.quantity * quote?.idr)}</p>}
          </div>
          {kind === 'watch' && <Link className="entry-action" to={'/saya/alert?coin=' + encodeURIComponent(row.coin_id)}>Atur peringatan</Link>}
          <button className="remove-entry" disabled={busy} aria-label={'Hapus ' + row.coin_name} onClick={() => remove(row.id)}>Hapus</button>
        </li>
      })}</ul>
    </>}
  </main>
}
