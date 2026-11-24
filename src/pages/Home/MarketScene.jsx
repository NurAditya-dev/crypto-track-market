import { useEffect, useRef } from 'react'

const tau = Math.PI * 2
const stars = Array.from({ length: 58 }, (_, i) => ({
  x: ((i * 137 + 67) % 519) - 260,
  y: ((i * 79 + 13) % 287) - 165,
  size: i % 7 === 0 ? 1.3 : .65,
}))

// A single canvas projects the glass plates and crystal into the hero. No WebGL context is needed.
function drawScene(ctx, width, height, time, pointer) {
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.translate(width * .52 + pointer.x * 6, height * .53 + pointer.y * 3)
  const scale = Math.min(width / 475, height / 310)
  ctx.scale(scale, scale)
  const angle = .65 + .08 * Math.sin(time * .19) + pointer.x * .12
  const cos = Math.cos(angle), sin = Math.sin(angle)
  const pi = Math.PI
  const tilt = .38 + pointer.y * .025
  function project(x, y, z) {
    const depth = x * sin + z * cos
    const zoom = 620 / (620 - depth)
    return [(x * cos - z * sin) * zoom, (depth * tilt - y) * zoom, depth]
  }
  function polygon(points, fill, stroke, weight = .7) {
    ctx.beginPath()
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.closePath()
    if (fill) { ctx.fillStyle = fill; ctx.fill() }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = weight; ctx.stroke() }
  }
  function gradient(x1, y1, x2, y2, colors) {
    const paint = ctx.createLinearGradient(x1, y1, x2, y2)
    colors.forEach(([at, color]) => paint.addColorStop(at, color))
    return paint
  }
  function orbit(rx, ry, rotation, color, phase, dot) {
    ctx.save()
    ctx.rotate(rotation)
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, tau)
    ctx.strokeStyle = color
    ctx.lineWidth = .7
    ctx.stroke()
    const x = rx * Math.cos(phase), y = ry * Math.sin(phase)
    ctx.beginPath()
    ctx.arc(x, y, dot, 0, tau)
    ctx.fillStyle = '#cdbaff'
    ctx.fill()
    ctx.restore()
  }

  for (const star of stars) {
    ctx.fillStyle = star.size > 1 ? '#b59deaa8' : '#9d91cd60'
    ctx.fillRect(star.x, star.y, star.size, star.size)
  }
  const halo = ctx.createRadialGradient(-4, -38, 4, -4, -28, 125)
  halo.addColorStop(0, '#af85ff36')
  halo.addColorStop(.52, '#9873e31a')
  halo.addColorStop(1, '#7858a900')
  ctx.fillStyle = halo
  ctx.fillRect(-140, -160, 280, 270)
  orbit(213, 52, -.22, '#a389df48', time * .15 + 3, 2)
  orbit(171, 90, .26, '#a389df28', -time * .09, 1.5)
  const corners = [[-1,-1],[1,-1],[1,1],[-1,1]]
  const lift = 2 * Math.sin(time * .55)
  for (let layer = 0; layer < 3; layer++) {
    const radius = 76 - layer * 5
    const y = -63 + layer * 18 + lift
    const top = corners.map(([x,z]) => project(x * radius, y, z * radius))
    const bottom = corners.map(([x,z]) => project(x * radius, y - 6, z * radius))
    const edges = top.map((point,i) => {
      const j = (i + 1) % 4
      return { depth: point[2] + top[j][2], face: [point,top[j],bottom[j],bottom[i]] }
    }).sort((a,b) => a.depth - b.depth)
    for (const edge of edges) polygon(edge.face, gradient(-100,0,102,45,[[0,'#3f2d67'],[.48,'#af87fb'],[.52,'#62448e'],[1,'#29203f']]), '#b09adb89')
    polygon(top, gradient(-96,6,84,89,[[0,'#514465'],[.40,'#2d253f'],[.7,'#54446b'],[1,'#261d41']]), '#ccafffc4', 1)
    const rim = corners.map(([x,z]) => project(x * (radius-5), y+.2, z * (radius-5)))
    polygon(rim, null, '#c7a8ff57')
    if (layer === 2) {
      for (const size of [18,30,45]) polygon(corners.map(([x,z]) => project(x*size,y+.6,z*size)), null,'#c7a8ff52')
      const center = project(0,y+1,0)
      ctx.save()
      ctx.translate(center[0],center[1])
      ctx.scale(1,.42)
      const reflected = ctx.createRadialGradient(0,0,0,0,0,52)
      reflected.addColorStop(0,'#dec4ffaa')
      reflected.addColorStop(.4,'#b389fa56')
      reflected.addColorStop(1,'#af80ff00')
      ctx.fillStyle = reflected
      ctx.fillRect(-52,-52,104,104)
      ctx.restore()
    }
  }

  // Sort the crystal facets back-to-front so parallax keeps the highlights attached.
  const float = 7 + 4 * Math.sin(time * .74)
  const ring = Array.from({length: 5}, (_,i) => {
    const a = tau * i / 5 + .23
    return [43 * Math.cos(a), 43 * Math.sin(a)]
  })
  for (const upper of [false,true]) {
    const ringY = (upper ? 37 : 28) + float
    const tip = project(0, (upper ? 112 : -18) + float, 0)
    const faces = ring.map(([x,z], i) => {
      const j = (i+1) % ring.length
      const a = project(x,ringY,z), b = project(ring[j][0],ringY,ring[j][1])
      return { points: [tip,a,b], depth: a[2]+b[2], i }
    }).sort((a,b) => a.depth-b.depth)
    const tones = upper ? ['#67458f','#9672ca','#674a99','#dabffd','#ac89dd'] : ['#35204f','#664983','#593b7d','#a482c5','#79589c']
    for (const {points,i} of faces) {
      const mid = points[1]
      const fill = gradient(tip[0]-3,tip[1],mid[0]+1,mid[1],[
        [0,upper?'#faf1ff':'#442966'],[.30,tones[i]],
        [.63,upper ? tones[(i + 1) % tones.length] : tones[i]],[1,upper ? '#aea1d9' : '#e0c4fc'],
      ])
      polygon(points, fill, '#e5d2ffae', .85)
      if (upper) {
        const [peak,a,b] = points
        const inset = [a[0]*.9+b[0]*.1, a[1]*.9+b[1]*.1]
        polygon([peak,a,inset], '#fff4ff24')
      }
    }
  }
  ctx.beginPath()
  ctx.ellipse(0, 0, 213, 52, -.22, .10*pi, .83*pi)
  ctx.strokeStyle = '#b9a2f06a'
  ctx.lineWidth = .8
  ctx.stroke()
  ctx.restore()
}

export default function MarketScene() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const hero = canvas.parentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const target = { x: 0, y: 0 }, pointer = { x: 0, y: 0 }
    let width = 0, height = 0, visible = false, frame = 0, previous = 0, time = 0
    function paint() { if (width && height) drawScene(ctx, width, height, time, pointer) }
    function tick(now) {
      frame = 0
      if (!visible || document.hidden || reduce.matches) return
      const delta = now - previous
      if (delta >= 1000 / 30) {
        time += Math.min(delta, 64) / 1000
        previous = now
        pointer.x += (target.x - pointer.x) * .09
        pointer.y += (target.y - pointer.y) * .09
        paint()
      }
      frame = requestAnimationFrame(tick)
    }
    function sync() {
      cancelAnimationFrame(frame)
      previous = performance.now()
      if (visible && !document.hidden && !reduce.matches) frame = requestAnimationFrame(tick)
      else if (visible && !document.hidden) paint()
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
      if (!fine.matches || reduce.matches) return
      const bounds = hero.getBoundingClientRect()
      target.x = (event.clientX-bounds.left)/bounds.width*2-1
      target.y = (event.clientY-bounds.top)/bounds.height*2-1
    }
    function reset() { target.x = 0; target.y = 0 }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    const dimensions = new ResizeObserver(resize)
    dimensions.observe(canvas)
    observer.observe(canvas)
    hero.addEventListener('pointermove', move, { passive: true })
    hero.addEventListener('pointerleave', reset)
    document.addEventListener('visibilitychange', sync)
    reduce.addEventListener('change', sync)
    return () => {
      cancelAnimationFrame(frame)
      dimensions.disconnect()
      observer.disconnect()
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', reset)
      document.removeEventListener('visibilitychange', sync)
      reduce.removeEventListener('change', sync)
    }
  }, [])
  return <canvas className="market-scene" ref={ref} aria-hidden="true" />
}
