// sonara website: live numbers from GitHub, the style switcher, the EQ demo,
// the playlist-link typing demo, the maker's full name, and quiet reveals.
;(() => {
  const RELEASES = 'https://api.github.com/repos/FlinnZee/sonara-releases/releases'
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------------------------------------------------------------- numbers
  const countUp = (el, to) => {
    if (reduced) {
      el.textContent = to.toLocaleString('en-US')
      return
    }
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1400)
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))).toLocaleString('en-US')
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  fetch(`${RELEASES}?per_page=100`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((releases) => {
      const downloads = releases
        .flatMap((rel) => rel.assets)
        .filter((a) => /\.(exe|zip)$/i.test(a.name))
        .reduce((sum, a) => sum + a.download_count, 0)
      // Shown once it means something
      const counter = document.querySelector('[data-downloads]')
      if (counter && downloads >= 500) {
        counter.closest('div').hidden = false
        countUp(counter, downloads)
      }
      const latest = releases.find((rel) => !rel.draft && !rel.prerelease)
      if (!latest) return
      const version = latest.tag_name.replace(/^v/, '')
      const meta = document.querySelector('[data-version]')
      if (meta) meta.textContent = `Version ${version} for Windows 10 and 11. Free, with everything it needs inside the installer.`
      const zip = latest.assets.find((a) => /\.zip$/i.test(a.name))
      const portable = document.querySelector('[data-portable]')
      if (portable && zip) portable.href = zip.browser_download_url
    })
    .catch(() => undefined)

  // ---------------------------------------------------------------- styles
  const section = document.querySelector('.styles')
  const tabs = [...document.querySelectorAll('.style-picker [role="tab"]')]
  const current = document.querySelector('[data-style-img]')
  const next = document.querySelector('[data-style-next]')
  let index = 0
  let timer = 0
  const show = (i) => {
    const tab = tabs[i]
    if (!tab || i === index) return
    index = i
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)))
    section.style.setProperty('--style-accent', tab.dataset.color)
    next.src = tab.dataset.src
    next.alt = tab.dataset.alt
    next.decode().catch(() => undefined).then(() => {
      next.style.opacity = '1'
      setTimeout(() => {
        current.src = next.src
        current.alt = next.alt
        next.style.transition = 'none'
        next.style.opacity = '0'
        requestAnimationFrame(() => (next.style.transition = ''))
      }, 720)
    })
  }
  const auto = () => {
    clearInterval(timer)
    if (!reduced) timer = setInterval(() => show((index + 1) % tabs.length), 4200)
  }
  tabs.forEach((tab, i) =>
    tab.addEventListener('click', () => {
      show(i)
      auto()
    })
  )
  section?.addEventListener('pointerenter', () => clearInterval(timer))
  section?.addEventListener('pointerleave', auto)
  // Warm the other screenshots once the page is idle
  setTimeout(() => tabs.forEach((t) => (new Image().src = t.dataset.src)), 1500)
  auto()

  // ---------------------------------------------------------------- equalizer
  const bars = [...document.querySelectorAll('.eq span')]
  const setEq = (values) => values.forEach((db, i) => bars[i] && (bars[i].style.height = `${50 + db * 3.6}%`))
  document.querySelectorAll('.presets [role="radio"]').forEach((button, _, all) =>
    button.addEventListener('click', () => {
      all.forEach((b) => b.setAttribute('aria-checked', String(b === button)))
      setEq(button.dataset.eq.split(',').map(Number))
    })
  )
  setEq([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

  // ---------------------------------------------------------------- typing demo
  const typed = document.querySelector('[data-typed]')
  const links = [
    'open.spotify.com/playlist/37i9dQZF1DX…',
    'music.apple.com/us/playlist/todays-hits…',
    'soundcloud.com/lofi-girl/sets/sleep…'
  ]
  if (typed) {
    if (reduced) typed.textContent = links[0]
    else {
      let li = 0
      let ci = 0
      let deleting = false
      const step = () => {
        const text = links[li]
        ci += deleting ? -1 : 1
        typed.textContent = text.slice(0, ci)
        let wait = deleting ? 22 : 55
        if (!deleting && ci === text.length) {
          deleting = true
          wait = 1800
        } else if (deleting && ci === 0) {
          deleting = false
          li = (li + 1) % links.length
          wait = 400
        }
        setTimeout(step, wait)
      }
      step()
    }
  }

  // ---------------------------------------------------------------- the maker's name
  const who = document.querySelector('[data-who]')
  who?.addEventListener('click', () => {
    who.classList.toggle('full')
    who.setAttribute('aria-label', who.classList.contains('full') ? 'Theekshana Nirmal (NiMAA)' : 'NiMAA, press for the full name')
  })

  // ---------------------------------------------------------------- reveals
  const blocks = document.querySelectorAll('.section-head, .style-stage, .sound > *, .tile, .maker > *, .dl-card, .faq details')
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('in')
          io.unobserve(e.target)
        }),
      { rootMargin: '0px 0px -8% 0px' }
    )
    blocks.forEach((b, i) => {
      b.classList.add('reveal')
      b.style.transitionDelay = `${(i % 3) * 70}ms`
      io.observe(b)
    })
  }
})()
