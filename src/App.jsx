import Navbar from './components/Navbar/Navbar'
import { lazy, Suspense, useContext, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { AccountContext } from './account/AccountContext'
import Home from './pages/Home/Home'
import PersonalMarket, { MarketNav } from './account/PersonalMarket'

const Coin = lazy(() => import('./pages/Coin/Coin'))

const App = () => {
  const { user } = useContext(AccountContext)
  const navigate = useNavigate()
  useEffect(() => {
    if (!user || window.location.pathname !== '/') return
    const saved = sessionStorage.getItem('market.loginDestination')
    if (!saved) return
    sessionStorage.removeItem('market.loginDestination')
    try {
      const { path, time } = JSON.parse(saved)
      if (/^\/saya\/(watch|alert|holding)(\?|$)/.test(path) && Date.now() - time < 600000) {
        navigate(path, { replace: true })
      }
    } catch { /* Ignore an incomplete return destination. */ }
  }, [navigate, user])
  return (
    <div className='app'>
     <Navbar><MarketNav /></Navbar>
     <Routes>
       <Route path='/' element={<Home />} />
       <Route path='/coin/:coinId' element={<Suspense fallback={<p className="personal" role="status">Memuat detail koin…</p>}><Coin /></Suspense>} />
       {['watch', 'alert', 'holding'].map(kind =>
         <Route key={kind} path={'/saya/' + kind} element={<PersonalMarket key={kind} kind={kind} />} />)}
     </Routes>
    </div> 
  )
}

export default App
