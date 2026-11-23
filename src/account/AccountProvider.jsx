import { useCallback, useEffect, useRef, useState } from 'react'
import { AccountContext } from './AccountContext'
import { client, login } from './client'

const pendingKey = 'market.pendingWatch'
const loginPromptTimeout = 5000

function WatchLoginPrompt({ coin, onLogin, onDismiss }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (hovered || focused) return
    const timer = setTimeout(onDismiss, loginPromptTimeout)
    return () => clearTimeout(timer)
  }, [coin, hovered, focused, onDismiss])

  return <div className="account-notice" role="dialog" aria-label="Simpan koin"
    onPointerEnter={event => setHovered(event.pointerType === 'mouse')}
    onPointerLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)}
    onBlur={event => setFocused(event.currentTarget.contains(event.relatedTarget))}>
    <p>Masuk untuk menyimpan {coin.name} ke Pantauan Saya.</p>
    <button onClick={onLogin}>Masuk dengan Google</button>
    <button onClick={onDismiss}>Batal</button>
  </div>
}

export default function AccountProvider({ children }) {
  const [user, setUser] = useState(client ? undefined : null)
  useEffect(() => {
    if (!client) return
    const { data } = client.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return <AccountData key={user?.id ?? 'guest'} user={user}>{children}</AccountData>
}

function AccountData({ user, children }) {
  const [entries, setEntries] = useState([])
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [notification, setNotification] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const pendingAlerts = useRef(new Set())
  const [loginCoin, setLoginCoin] = useState(null)
  const dismissLoginPrompt = useCallback(() => setLoginCoin(null), [])
  const lock = useRef(false)
  const revision = useRef(0)
  const userId = user?.id

  const refresh = useCallback(async () => {
    if (!userId) return
    const version = ++revision.current
    try {
      const raw = sessionStorage.getItem(pendingKey)
      if (raw) {
        const coin = JSON.parse(raw)
        if (Date.now() - coin.time < 600000) {
          const { error } = await client.from('market_entries').insert({
            kind: 'watch', coin_id: coin.id, coin_name: coin.name,
          })
          if (error && error.code !== '23505') throw error
        }
        sessionStorage.removeItem(pendingKey)
      }
      const data = []
      const pageSize = 500
      for (let offset = 0; ; offset += pageSize) {
        const page = await client.from('market_entries').select('*')
          .eq('user_id', userId).order('created_at', { ascending: false }).order('id')
          .range(offset, offset + pageSize - 1)
        if (page.error) throw page.error
        data.push(...page.data)
        if (page.data.length < pageSize) break
      }
      if (version === revision.current) {
        const hits = data.filter(row => row.triggered_at && pendingAlerts.current.has(row.id))
        if (hits.length) setNotification(hits.map(row => row.coin_name).join(', ') + ' mencapai target harga.')
        pendingAlerts.current = new Set(data.filter(row => row.kind === 'alert' && !row.triggered_at).map(row => row.id))
        setEntries(data)
        setReady(true)
      }
    } catch {
      if (version === revision.current) setMessage('Data akun gagal dimuat. Periksa koneksi dan coba lagi.')
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const start = setTimeout(refresh, 0)
    const timer = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(start)
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh, userId])

  const change = useCallback(async (operation) => {
    if (lock.current || !userId) return false
    lock.current = true
    setBusy(true)
    setMessage('')
    try {
      const { error } = await operation()
      if (error) throw error
      await refresh()
      return true
    } catch {
      setMessage('Perubahan gagal disimpan. Coba lagi.')
      return false
    } finally {
      lock.current = false
      setBusy(false)
    }
  }, [refresh, userId])

  const confirm = useCallback(text => setConfirmation({ text }), [])
  useEffect(() => {
    if (!confirmation) return
    const timer = setTimeout(() => setConfirmation(null), 4500)
    return () => clearTimeout(timer)
  }, [confirmation])

  async function addWatch(coin) {
    const saved = await change(async () => {
      const result = await client.from('market_entries').insert({
        kind: 'watch', coin_id: coin.id, coin_name: coin.name,
      })
      return result.error?.code === '23505' ? {} : result
    })
    if (saved) confirm(coin.name + ' ditambahkan ke pantauan.')
  }

  async function remove(id) {
    const saved = await change(() => client.from('market_entries').delete().eq('id', id).eq('user_id', userId))
    if (saved) confirm('Catatan dihapus.')
    return saved
  }
  function toggleWatch(coin) {
    if (!user) { setLoginCoin({ id: coin.id, name: coin.name }); return }
    const saved = entries.find(row => row.kind === 'watch' && row.coin_id === coin.id)
    return saved ? remove(saved.id) : addWatch(coin)
  }

  async function continueLogin() {
    sessionStorage.setItem(pendingKey, JSON.stringify({ id: loginCoin.id, name: loginCoin.name, time: Date.now() }))
    try { await login() } catch {
      sessionStorage.removeItem(pendingKey)
      setMessage('Gagal memulai login Google.')
    }
    setLoginCoin(null)
  }

  return <AccountContext.Provider value={{ user, entries, ready, busy, refresh, change, remove, toggleWatch, confirm }}>
    {children}
    {notification && !message && !loginCoin && <div className="account-notice" role="status">
      {notification} <button onClick={() => setNotification('')}>Tutup</button>
    </div>}
    {loginCoin && <WatchLoginPrompt coin={loginCoin} onLogin={continueLogin} onDismiss={dismissLoginPrompt} />}
    {confirmation && !notification && !message && !loginCoin &&
      <div className="account-notice" role="status">{confirmation.text}</div>}
    {message && <div className="account-notice" role="alert">{message}
      <button onClick={() => { setMessage(''); void refresh() }}>Tutup</button>
    </div>}
  </AccountContext.Provider>
}
