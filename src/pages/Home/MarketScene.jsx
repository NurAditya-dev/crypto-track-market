import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import { coinModels } from './coinModels'
import { createCoin, createTerrain, drawCoinScene } from './coinRenderer'

const modelDuration = 8
const fadeDuration = .4
const frameInterval = 1000 / 24
const motionQuery = '(prefers-reduced-motion: reduce)'

export default function MarketScene() {
  const canvasRef = useRef(null)
  const terrainRef = useRef(null)
  const resources = useRef({ coins: new Map() })
  const spin = useRef({ angle: 0, speed: 0 })
  const clock = useRef({ age: 0, rotation: 0, transitioning: false })
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduce, setReduce] = useState(() => window.matchMedia(motionQuery).matches)
  const model = coinModels[index]

  const changeModel = useCallback(step => {
    clock.current.age = 0
    clock.current.transitioning = true
    setIndex(old => (old + step + coinModels.length) % coinModels.length)
  }, [])

  useEffect(() => {
    createTerrain(terrainRef.current)
    const motion = window.matchMedia(motionQuery)
    const update = () => setReduce(motion.matches)
    motion.addEventListener('change', update)
    return () => motion.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cache = resources.current
    if (!cache.coins.has(model)) cache.coins.set(model, createCoin(model))
    const coin = cache.coins.get(model)
    const timer = clock.current
    const hero = canvas.closest('.hero')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const target = { x: 0, y: 0 }
    const pointer = { x: 0, y: 0 }
    let width = 0, height = 0, visible = false, frame = 0, previous = 0
    const animated = !reduce && !paused
    const rotation = spin.current
    rotation.speed = 0
    let drag = null

    function startDrag(event) {
      if (drag || event.button !== 0) return
      drag = { id: event.pointerId, x: event.clientX, time: event.timeStamp }
      timer.age = fadeDuration
      rotation.speed = 0
      canvas.setPointerCapture(event.pointerId)
    }
    function rotate(event) {
      if (drag?.id !== event.pointerId) return
      const step = (event.clientX - drag.x) * Math.PI * 2 / Math.max(170,width * .68)
      rotation.angle += step
      rotation.speed = Math.max(-5, Math.min(5, step * 1000 / Math.max(12,event.timeStamp - drag.time)))
      drag.x = event.clientX
      drag.time = event.timeStamp
      if (!animated) paint()
    }
    function release(event) {
      if (drag?.id !== event.pointerId) return
      if (event.type !== 'pointerup' || event.timeStamp - drag.time > 120) rotation.speed = 0
      drag = null
    }
    function keyRotate(event) {
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return
      event.preventDefault()
      rotation.angle += event.key === 'ArrowLeft' ? -.32 : .32
      rotation.speed = 0
      timer.age = fadeDuration
      paint()
    }

    function paint() {
      if (!width || !height) return
      const fadeIn = timer.transitioning ? timer.age / fadeDuration : 1
      const fadeOut = (modelDuration - timer.age) / fadeDuration
      const opacity = animated ? Math.max(0, Math.min(1, fadeIn, fadeOut)) : 1
      drawCoinScene(ctx, width, height, coin, rotation.angle, timer.rotation, pointer, opacity)
    }
    function tick(now) {
      frame = 0
      if (!animated || !visible || document.hidden) return
      const elapsed = now - previous
      if (elapsed >= frameInterval) {
        previous = now
        if (!drag) {
          timer.age += elapsed / 1000
          const seconds = Math.min(elapsed,100) / 1000
          rotation.angle += rotation.speed * seconds
          rotation.speed *= Math.exp(-4 * seconds)
        }
        if (timer.age >= modelDuration) {
          changeModel(1)
          return
        }
        timer.rotation += Math.min(elapsed, 100) / 1000
        pointer.x += (target.x - pointer.x) * .13
        pointer.y += (target.y - pointer.y) * .13
        paint()
      }
      frame = requestAnimationFrame(tick)
    }
    function sync() {
      cancelAnimationFrame(frame)
      if (!visible || document.hidden) return
      previous = performance.now()
      paint()
      if (animated) frame = requestAnimationFrame(tick)
    }
    function resize() {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr,0,0,dpr,0,0)
      paint()
    }
    function move(event) {
      if (!animated || !finePointer.matches) return
      const bounds = hero.getBoundingClientRect()
      target.x = 2 * (event.clientX - bounds.left) / bounds.width - 1
      target.y = 2 * (event.clientY - bounds.top) / bounds.height - 1
    }
    function reset() { target.x = 0; target.y = 0 }
    const viewport = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    const dimensions = new ResizeObserver(resize)
    viewport.observe(canvas)
    dimensions.observe(canvas)
    canvas.addEventListener('pointerdown', startDrag)
    canvas.addEventListener('pointermove', rotate)
    canvas.addEventListener('pointerup', release)
    canvas.addEventListener('lostpointercapture', release)
    canvas.addEventListener('pointercancel', release)
    canvas.addEventListener('keydown', keyRotate)
    hero.addEventListener('pointermove', move, { passive: true })
    hero.addEventListener('pointerleave', reset)
    document.addEventListener('visibilitychange', sync)
    return () => {
      cancelAnimationFrame(frame)
      viewport.disconnect()
      canvas.removeEventListener('pointerdown', startDrag)
      canvas.removeEventListener('pointermove', rotate)
      canvas.removeEventListener('pointerup', release)
      canvas.removeEventListener('lostpointercapture', release)
      canvas.removeEventListener('pointercancel', release)
      canvas.removeEventListener('keydown', keyRotate)
      dimensions.disconnect()
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', reset)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [changeModel, model, paused, reduce])

  return <><canvas ref={terrainRef} className="hero-terrain" aria-hidden="true" />
  <figure className="model-gallery" aria-label="Galeri model koin">
    <canvas className="market-scene" ref={canvasRef} tabIndex={0} role="group"
      aria-label={'Model ' + model.name + '. Putar dengan menyeret atau menekan panah kiri dan kanan.'} />
    <figcaption className="model-caption">
      <span className="model-name"><b>{model.symbol}</b>{model.name !== model.symbol && model.name}</span>
      <small className="spin-hint">Geser untuk memutar</small>
      <div className="model-controls">
        <button className="glass-button" type="button" aria-label="Model sebelumnya" onClick={() => changeModel(-1)}>
          <Icon name="previous" size={15} />
        </button>
        {!reduce && <button className="glass-button" type="button" aria-label={paused ? 'Lanjutkan animasi' : 'Jeda animasi'}
          onClick={() => setPaused(value => !value)}>
          <Icon name={paused ? 'play' : 'pause'} size={14} />
        </button>}
        <button className="glass-button" type="button" aria-label="Model berikutnya" onClick={() => changeModel(1)}>
          <Icon name="next" size={15} />
        </button>
      </div>
    </figcaption>
  </figure></>
}
