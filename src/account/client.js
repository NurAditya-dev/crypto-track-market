import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const client = url && URL.canParse(url) && key
  ? createClient(url, key, { auth: { flowType: 'pkce' } })
  : null

export async function login() {
  if (!client) throw new Error('Login belum tersedia.')
  const { pathname, search } = window.location
  if (/^\/saya\/(watch|alert|holding)$/.test(pathname)) {
    sessionStorage.setItem('market.loginDestination', JSON.stringify({ path: pathname + search, time: Date.now() }))
  } else {
    sessionStorage.removeItem('market.loginDestination')
  }
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: window.location.origin + '/' },
  })
  if (error) throw error
}
