import Navbar from './components/Navbar/Navbar'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home'
import Coin from './pages/Coin/Coin'
import PersonalMarket, { MarketNav } from './account/PersonalMarket'

const App = () => {
  return (
    <div className='app'>
     <Navbar/>
     <MarketNav />
     <Routes>
       <Route path='/' element={<Home />} />
       <Route path='/coin/:coinId' element={<Coin />} />
       {['watch', 'alert', 'holding'].map(kind =>
         <Route key={kind} path={'/saya/' + kind} element={<PersonalMarket key={kind} kind={kind} />} />)}
     </Routes>
    </div> 
  )
}

export default App
