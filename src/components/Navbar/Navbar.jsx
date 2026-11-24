import { useContext } from 'react'
import './Navbar.css'
import GoogleLogin from './GoogleLogin'
import { CoinContext } from '../../context/CoinContext.js'
import { Link } from 'react-router-dom'

const Navbar = ({ children }) => {
  const { currency, selectCurrency } = useContext(CoinContext)

  const handleLogoClick = () => {
    window.dispatchEvent(new CustomEvent('reset-crypto-home'))
  }

  return (
    <header className='navbar'>
     <div className='nav-inner'>
      <Link to='/' onClick={handleLogoClick} className='logo-link'>
        <img src='/favicon.svg' alt='' />Cryptoplace
      </Link>
      {children}
      <div className='nav-right'>
        <select className='currency-select' aria-label='Mata uang' value={currency.name} onChange={event => selectCurrency(event.target.value)}>
          <option value='usd'>USD</option>
          <option value='eur'>EUR</option>
          <option value='idr'>IDR</option>
        </select>
        <GoogleLogin />
      </div>
     </div>
    </header>
  )
}

export default Navbar
