const TAU = Math.PI * 2
const RADIUS = 92
const EDGE_SEGMENTS = 120

// Five stops describe the same metal in shadow, midtone, and grazing light.
const finishes = {
  gold: ['#3c2d1d', '#806234', '#bc9955', '#e6c780', '#fff0c9'],
  champagne: ['#40362b', '#887559', '#bfaa7d', '#e5d3aa', '#fff3d6'],
  bronze: ['#322721', '#745943', '#ae8865', '#d9b895', '#f7e4c8'],
  platinum: ['#343739', '#757b7c', '#a4a9a8', '#d5d6d0', '#faf9ed'],
}

function gradient(ctx, from, to, stops) {
  const result = ctx.createLinearGradient(...from, ...to)
  for (const [position, color] of stops) result.addColorStop(position, color)
  return result
}

function outline(ctx, points, scale = 1) {
  ctx.beginPath()
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i]
    if (i === 0) ctx.moveTo(x * scale, y * scale)
    else ctx.lineTo(x * scale, y * scale)
  }
  ctx.closePath()
}

function rimPoints(sides) {
  const points = []
  for (let i = 0; i < EDGE_SEGMENTS; i++) {
    const angle = i / EDGE_SEGMENTS * TAU
    let radius = RADIUS
    if (sides) {
      const localAngle = (angle + Math.PI / sides) % (TAU / sides) - Math.PI / sides
      radius *= Math.cos(Math.PI / sides) / Math.cos(localAngle)
    }
    points.push([radius * Math.cos(angle), radius * Math.sin(angle)])
  }
  return points
}

function engraveText(ctx, text, radius, bottom) {
  const sign = bottom ? -1 : 1
  const spacing = .129
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '600 7px monospace'
  ctx.fillStyle = '#ffedcbd4'
  for (let i = 0; i < text.length; i++) {
    const angle = (i - (text.length - 1) / 2) * spacing
    ctx.save()
    ctx.translate(Math.sin(angle) * radius, -sign * Math.cos(angle) * radius)
    ctx.rotate(sign * angle)
    ctx.fillText(text[i], 0, 0)
    ctx.restore()
  }
}

export function createCoin(model) {
  const face = document.createElement('canvas')
  face.width = face.height = 400
  const ctx = face.getContext('2d')
  const metal = finishes[model.metal]
  const points = rimPoints(model.sides)
  ctx.setTransform(2,0,0,2,200,200)
  outline(ctx, points)
  ctx.clip()

  // The bevel, engine-turned field and raised emblem are rasterized once per model.
  const bevel = gradient(ctx, [-74,-82], [65,84], [[0,metal[4]],[.25,metal[1]],[.48,metal[3]],[.68,metal[0]],[.87,metal[2]],[1,metal[4]]])
  ctx.fillStyle = bevel
  ctx.fillRect(-100,-100,200,200)
  outline(ctx, points, .952)
  ctx.fillStyle = gradient(ctx, [-58,-73], [62,86], [[0,metal[3]],[.28,metal[2]],[.48,metal[1]],[.82,metal[0]],[1,metal[2]]])
  ctx.fill()
  for (const [scale,color] of [[.984,metal[4]],[.965,metal[0]],[.933,metal[4]],[.912,metal[0]],[.718,metal[3]],[.70,metal[0]]]) {
    outline(ctx, points, scale)
    ctx.strokeStyle = color
    ctx.lineWidth = .62
    ctx.stroke()
  }
  for (let i = 0; i < points.length; i++) {
    const [x,y] = points[i]
    const length = i % 5 === 0 ? .87 : .899
    ctx.beginPath()
    ctx.moveTo(x * length, y * length)
    ctx.lineTo(x * .913, y * .913)
    ctx.lineWidth = .55
    ctx.strokeStyle = '#fff5d8a3'
    ctx.stroke()
  }

  ctx.save()
  outline(ctx, points, .695)
  ctx.clip()
  for (let row = -16; row < 18; row++) {
    ctx.beginPath()
    for (let x = -70; x <= 70; x += 2) {
      const y = row * 4.8 + 6 * Math.sin(x * .071 + row * .35) + 4 * Math.cos(x * .16 - row * .23)
      if (x === -70) ctx.moveTo(x,y)
      else ctx.lineTo(x,y)
    }
    ctx.strokeStyle = '#fff2d553'
    ctx.lineWidth = .42
    ctx.stroke()
  }
  ctx.restore()

  const legendRadius = model.sides ? 68 : 74
  engraveText(ctx, model.name.toUpperCase(), legendRadius, false)
  engraveText(ctx, model.symbol, legendRadius, true)
  ctx.save()
  ctx.scale(4.85,4.85)
  ctx.translate(-16,-16)
  const relief = gradient(ctx,[8,5],[22,27],[[0,metal[4]],[.27,metal[3]],[.51,metal[4]],[.79,metal[2]],[1,metal[3]]])
  for (const d of model.paths) {
    const path = new Path2D(d)
    ctx.save()
    ctx.translate(.36,.92)
    ctx.shadowColor = '#120f0bb3'
    ctx.shadowBlur = 6
    ctx.fillStyle = metal[0]
    ctx.fill(path,'evenodd')
    ctx.restore()
    ctx.fillStyle = relief
    ctx.fill(path,'evenodd')
    ctx.lineWidth = .15
    ctx.strokeStyle = metal[4]
    ctx.stroke(path)
  }
  ctx.restore()
  return { face, points, metal }
}

export function createTerrain(field) {
  field.width = 880
  field.height = 390
  const ctx = field.getContext('2d')
  if (!ctx) return
  ctx.scale(1.25,1.25)
  ctx.translate(352,150)
  for (let row = 0; row < 32; row++) {
    ctx.beginPath()
    for (let x = -360; x <= 360; x += 5) {
      const left = Math.exp(-((x + 185 + row * 2) ** 2) / 12500)
      const right = Math.exp(-((x - 184 - row) ** 2) / 10500)
      const y = 40 + row * 3.3 - left * (85 - row * .8) - right * (83 - row) + 6 * Math.sin(x * .018 + row * .12)
      if (x === -360) ctx.moveTo(x,y)
      else ctx.lineTo(x,y)
    }
    ctx.strokeStyle = row % 5 === 0 ? '#c3ac7948' : '#a6a59c29'
    ctx.lineWidth = row % 5 === 0 ? .85 : .55
    ctx.stroke()
  }
  for (let i = 0; i < 47; i++) {
    ctx.fillStyle = i % 5 === 0 ? '#d9c18787' : '#d7d4c540'
    ctx.fillRect((i * 137 % 680)-340,(i * 71 % 260)-125,i % 5 ? .8 : 1.3,1)
  }
}

export function drawCoinScene(ctx, width, height, coin, angle, time, pointer, opacity) {
  ctx.clearRect(0,0,width,height)
  ctx.save()
  ctx.translate(width * .5, height * .51)
  const scale = Math.min(width / 370, height / 222)
  ctx.scale(scale,scale)
  ctx.save()
  ctx.translate(0,83)
  ctx.scale(1,.16)
  const shadow = ctx.createRadialGradient(0,0,2,0,0,111)
  shadow.addColorStop(0,'#000b')
  shadow.addColorStop(1,'#0000')
  ctx.fillStyle = shadow
  ctx.fillRect(-111,-111,222,222)
  ctx.restore()

  ctx.globalAlpha = opacity
  ctx.translate(pointer.x * 5, -4 + pointer.y * 3 + Math.sin(time * .58) * 2.2)
  const yaw = angle - .47 + .15 * Math.sin(time * .34) + pointer.x * .13
  const pitch = .17 + .055 * Math.sin(time * .21) + pointer.y * .065
  const roll = -.13
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
  const cr = Math.cos(roll), sr = Math.sin(roll)
  // Project the cylinder's local x/y axes, then offset its back face along z.
  const ax = cr*cy - sr*sp*sy, ay = sr*cy + cr*sp*sy
  const bx = -sr*cp, by = cr*cp
  const dx = -17*(cr*sy + sr*sp*cy), dy = -17*(sr*sy - cr*sp*cy)
  const { points, metal, face } = coin
  for (let i = 0; i < points.length; i++) {
    const [x,y] = points[i], [nx,ny] = points[(i + 1) % points.length]
    const x1 = ax*x+bx*y, y1 = ay*x+by*y, x2 = ax*nx+bx*ny, y2 = ay*nx+by*ny
    if ((y2 - y1) * dx - (x2 - x1) * dy <= 0) continue
    ctx.beginPath()
    ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x2+dx,y2+dy); ctx.lineTo(x1+dx,y1+dy); ctx.closePath()
    ctx.fillStyle = i % 3 === 0 ? metal[0] : i % 3 === 1 ? metal[2] : metal[1]
    ctx.fill()
    ctx.strokeStyle = ctx.fillStyle
    ctx.lineWidth = .6
    ctx.stroke()
  }
  if (cy < 0) ctx.transform(-ax,-ay,bx,by,dx,dy)
  else ctx.transform(ax,ay,bx,by,0,0)
  ctx.drawImage(face,-100,-100,200,200)
  outline(ctx,points,.992)
  ctx.clip()
  const light = -36 + Math.sin(time * .34) * 24 + pointer.x * 15
  ctx.fillStyle = gradient(ctx,[light-50,-30],[light+55,32],[[0,'#fff0'],[.47,'#fff6dd16'],[.55,'#fff6dd1d'],[1,'#fff0']])
  ctx.fillRect(-100,-100,200,200)
  ctx.restore()
}
