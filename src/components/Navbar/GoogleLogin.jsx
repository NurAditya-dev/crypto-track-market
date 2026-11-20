import { useContext, useEffect, useState } from 'react'
import { client, login } from '../../account/client'
import { AccountContext } from '../../account/AccountContext'

export default function GoogleLogin() {
  const { user } = useContext(AccountContext)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    return params.has('error') || new URLSearchParams(window.location.search).has('error')
      ? 'Login Google belum berhasil. Silakan coba lagi.'
      : ''
  })

  useEffect(() => {
    const restoreButton = (event) => {
      if (event.persisted) setBusy(false)
    }
    window.addEventListener('pageshow', restoreButton)
    return () => {
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
        await login()
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
      <button type="button" className="signup-btn" disabled={busy || user === undefined} onClick={handleClick}>
        {busy || user === undefined ? 'Memproses…' : user ? 'Keluar' : 'Masuk dengan Google'}
      </button>
      {message && <p className="login-message" role="status">{message}</p>}
    </div>
  )
}
