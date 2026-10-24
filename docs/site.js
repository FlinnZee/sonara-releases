// sonara site: the page re-tints to each style the hero shows, a sonar sweep runs behind
// the headline, and the latest release's version is read from GitHub.
;(() => {
  const STYLES = [
    ['999', 'style-999.jpg', '#8b5cf6'],
    ['Pin-up Cinema', 'style-pinup.jpg', '#e0607a'],
    ['Ritual', 'style-ritual.jpg', '#e0893a'],
    ['Moonlit', 'style-moonlit.jpg', '#8fb0ff'],
    ['Neon Cult', 'style-neon-cult.jpg', '#ff3ea5'],
    ['Goodbye & Good Riddance', 'style-gbgr.jpg', '#4a90ff'],
    ['Sundown', 'style-sundown.jpg', '#ff6ad5'],
    ['Frost', 'style-frost.jpg', '#9fd8ff']
  ]
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const root = document.documentElement

  // ---------------------------------------------------------------- hero slideshow
  const cur = document.querySelector('[data-slide]')
  const next = document.querySelector('[data-slide-next]')
  const label = document.querySelector('[data-style-name]')
  const thumbs = [...document.querySelectorAll('[data-pick]')]
  let index = 0
  let timer = 0
  for (const [, file] of STYLES) new Image().src = `assets/${file}`

  function show(i) {
    index = (i + STYLES.length) % STYLES.length
    const [name, file, color] = STYLES[index]
    next.src = `assets/${file}`
    next.alt = `sonara playing in the ${name} style`
    next.style.opacity = '1'
    setTimeout(() => {
      cur.src = next.src
      cur.alt = next.alt
      next.style.opacity = '0'
    }, reduce ? 0 : 900)
    label.textContent = name
    root.style.setProperty('--accent', color)
    thumbs.forEach((t, j) => t.setAttribute('aria-current', String(j === index)))
  }
  function schedule() {
    clearInterval(timer)
    if (!reduce) timer = setInterval(() => show(index + 1), 3600)
  }
  thumbs.forEach((t) =>
    t.addEventListener('click', () => {
      show(Number(t.dataset.pick))
      schedule()
      document.querySelector('.hero').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
    })
  )
  show(0)
  schedule()

  // ---------------------------------------------------------------- sonar sweep
  const canvas = document.querySelector('.sonar')
  const g = canvas.getContext('2d')
  let w = 0
  let h = 0
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  new ResizeObserver(resize).observe(canvas)
  resize()
  let angle = -Math.PI / 4
  let last = performance.now()
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    angle += dt * 0.5
    const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#8b5cf6'
    const cx = w * 0.28
    const cy = h * 0.5
    const R = Math.max(w, h) * 0.75
    g.clearRect(0, 0, w, h)
    g.lineWidth = 1
    for (let r = 120; r < R; r += 120) {
      g.strokeStyle = `rgba(34, 225, 255, ${0.07 * (1 - r / R)})`
      g.beginPath()
      g.arc(cx, cy, r, 0, Math.PI * 2)
      g.stroke()
    }
    const sweep = g.createConicGradient(angle - 1.1, cx, cy)
    sweep.addColorStop(0, 'transparent')
    sweep.addColorStop(0.17, `color-mix(in oklch, ${accent} 22%, transparent)`)
    sweep.addColorStop(0.175, 'transparent')
    sweep.addColorStop(1, 'transparent')
    g.fillStyle = sweep
    g.fillRect(0, 0, w, h)
    const fade = g.createRadialGradient(cx, cy, 0, cx, cy, R)
    fade.addColorStop(0, 'rgba(7, 7, 12, 0)')
    fade.addColorStop(1, 'rgba(7, 7, 12, 1)')
    g.fillStyle = fade
    g.fillRect(0, 0, w, h)
    if (!reduce && !document.hidden) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !reduce) {
      last = performance.now()
      requestAnimationFrame(frame)
    }
  })

  // ---------------------------------------------------------------- latest version
  fetch('https://api.github.com/repos/FlinnZee/sonara-releases/releases/latest')
    .then((r) => (r.ok ? r.json() : null))
    .then((rel) => {
      const asset = rel?.assets?.find((a) => a.name.endsWith('-setup.exe'))
      const meta = document.querySelector('[data-release]')
      if (!asset || !meta) return
      const mb = Math.round(asset.size / 1048576)
      meta.textContent = `Free for Windows 10 and 11. Version ${rel.tag_name.replace(/^v/, '')}, ${mb} MB, everything included.`
    })
    .catch(() => {})
})()
