import GoogleLogin from '../components/Navbar/GoogleLogin'

const previews = {
  watch: { title: 'Pantauan Saya', lines: ['Bitcoin · BTC', 'Ethereum · ETH'] },
  alert: { title: 'Peringatan Harga', lines: ['Target harga', 'Menunggu target'] },
  holding: { title: 'Portofolio', lines: ['Total modal', 'Nilai sekarang'] },
}

export default function LockedFeatures({ kind }) {
  const cards = kind ? [previews[kind]] : Object.values(previews)
  return <section className="locked-features" aria-label="Fitur khusus pengguna">
    <div className="locked-preview" aria-hidden="true" inert>
      {cards.map(card => <div className="preview-card" key={card.title}>
        <strong>{card.title}</strong>
        {card.lines.map(line => <div className="preview-line" key={line}>
          <span>{line}</span><span>—</span>
        </div>)}
      </div>)}
    </div>
    <div className="feature-gate">
      <strong>{kind ? 'Masuk untuk membuka ' + previews[kind].title : 'Masuk untuk membuka fitur pribadi'}</strong>
      <GoogleLogin label="Masuk dengan Google" />
    </div>
  </section>
}
