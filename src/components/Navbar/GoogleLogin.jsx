import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const client = url && URL.canParse(url) && key
  ? createClient(url, key, { auth: { flowType: 'pkce' } })
  : null

export default function GoogleLogin() {
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(Boolean(client))
  const [message, setMessage] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    return params.has('error') || new URLSearchParams(window.location.search).has('error')
      ? 'Login Google belum berhasil. Silakan coba lagi.'
      : ''
  })

  useEffect(() => {
    if (!client) return
    const { data } = client.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'INITIAL_SESSION') setBusy(false)
    })
    const restoreButton = (event) => {
      if (event.persisted) setBusy(false)
    }
    window.addEventListener('pageshow', restoreButton)
    return () => {
      data.subscription.unsubscribe()
      window.removeEventListener('pageshow', restoreButton)
    }
  }, [])

  async function handleClick() {
    if (!client) {
      setMessage('Login Google belum tersedia di website ini.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      if (user) {
        const { error } = await client.auth.signOut({ scope: 'local' })
        if (error) throw error
        setBusy(false)
      } else {
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + '/' },
        })
        if (error) throw error
      }
    } catch {
      setMessage(user ? 'Gagal keluar. Coba lagi.' : 'Gagal masuk dengan Google. Coba lagi.')
      setBusy(false)
    }
  }

  const name = user?.user_metadata?.full_name || user?.email
  return (
    <div className="google-login">
      {name && <span className="account-name" title={name}>{name}</span>}
      <button type="button" className="signup-btn" disabled={busy} onClick={handleClick}>
        {busy ? 'Memproses…' : user ? 'Keluar' : 'Masuk dengan Google'}
      </button>
      {message && <p className="login-message" role="status">{message}</p>}
    </div>
  )
}
