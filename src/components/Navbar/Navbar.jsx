import { useContext } from 'react'
import './Navbar.css'
import GoogleLogin from './GoogleLogin'
import logo from '../../assets/logo.png'
import { CoinContext } from '../../context/CoinContext'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const { setCurrency } = useContext(CoinContext)

  const currencyHandler = (event) => {
    switch (event.target.value) {
      case 'usd':
        setCurrency({ name: 'usd', symbol: '$' })
        break
      case 'eur':
        setCurrency({ name: 'eur', symbol: '€' })
        break
      case 'idr':
        setCurrency({ name: 'idr', symbol: 'Rp.' })
        break
      default:
        setCurrency({ name: 'usd', symbol: '$' })
    }
  }

  const handleLogoClick = () => {
    window.dispatchEvent(new CustomEvent('reset-crypto-home'))
  }

  return (
    <div className='navbar'>
      <Link to='/' onClick={handleLogoClick} className='logo-link'>
        <img src={logo} alt='Logo' className='logo' />
      </Link>
      <div className='nav-right'>
        <select className='currency-select' onChange={currencyHandler}>
          <option value='usd'>USD</option>
          <option value='eur'>EUR</option>
          <option value='idr'>IDR</option>
        </select>
        <GoogleLogin />
      </div>
    </div>
  )
}

export default Navbar
