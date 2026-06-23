import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ============ Theme toggle (day / night) ============ */
const root = document.documentElement
const themeIcon = document.querySelector('[data-theme-icon]')
const saved = localStorage.getItem('wow-theme')
if (saved) root.setAttribute('data-theme', saved)
const syncIcon = () => {
  const dark = root.getAttribute('data-theme') === 'dark'
  if (themeIcon) themeIcon.textContent = dark ? '☾' : '☀︎'
}
syncIcon()
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const dark = root.getAttribute('data-theme') === 'dark'
  const next = dark ? 'light' : 'dark'
  root.setAttribute('data-theme', next)
  localStorage.setItem('wow-theme', next)
  syncIcon()
  ScrollTrigger.refresh()
})

/* ============ Hero intro ============ */
if (!prefersReduced) {
  gsap.set('.hero-anim', { y: 26, opacity: 0 })
  gsap.to('.hero-anim', {
    y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.15,
  })
  // Failsafe: never leave the hero hidden (e.g. throttled rAF in a background tab)
  setTimeout(() => {
    document.querySelectorAll('.hero-anim').forEach((e) => {
      if (getComputedStyle(e).opacity === '0') gsap.set(e, { opacity: 1, y: 0 })
    })
  }, 1800)
} else {
  gsap.set('.hero-anim', { opacity: 1 })
}

/* ============ Reveal on scroll ============ */
document.querySelectorAll('.reveal').forEach((el) => {
  ScrollTrigger.create({
    trigger: el,
    start: 'top 86%',
    once: true,
    onEnter: () => el.classList.add('is-in'),
  })
})
if (prefersReduced) document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'))

/* ============ Pinned story (how the party goes) ============ */
const storyWrap = document.getElementById('story')
if (storyWrap) {
  const steps = [...document.querySelectorAll('#story-data > div')].map((d) => d.dataset)
  const imgs = [...document.querySelectorAll('.story-img')]
  const dots = [...document.querySelectorAll('.story-dot')]
  const numEl = storyWrap.querySelector('.story-num')
  const titleEl = storyWrap.querySelector('.story-title')
  const textEl = storyWrap.querySelector('.story-text')
  const metaEl = storyWrap.querySelector('.story-meta')
  let current = -1

  const setStep = (i) => {
    if (i === current || !steps[i]) return
    current = i
    const s = steps[i]
    // text swap with a tiny fade
    gsap.fromTo([numEl, titleEl, textEl, metaEl],
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.04, overwrite: true })
    numEl.textContent = s.num
    titleEl.textContent = s.title
    textEl.textContent = s.text
    metaEl.textContent = s.meta
    imgs.forEach((im, k) => im.classList.toggle('is-active', k === i))
    dots.forEach((dt, k) => dt.classList.toggle('is-active', k <= i))
  }
  setStep(0)

  ScrollTrigger.create({
    trigger: storyWrap,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length))
      setStep(i)
    },
  })
}

/* ============ Expanding video ============ */
const expandWrap = document.getElementById('expand')
if (expandWrap && !prefersReduced) {
  const media = expandWrap.querySelector('.expand-media')
  const heading = expandWrap.querySelector('.expand-heading')

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: expandWrap,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
  })
  tl.to(media, { width: '100vw', borderRadius: 0, ease: 'none' }, 0)
    .to(heading, { opacity: 0, y: -30, ease: 'none' }, 0)
}

/* ============ Active nav link ============ */
const navLinks = [...document.querySelectorAll('header nav a[href^="#"]')]
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean)
sections.forEach((sec, i) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top center',
    end: 'bottom center',
    onToggle: (self) => {
      if (self.isActive) {
        navLinks.forEach((l) => l.classList.remove('text-pink'))
        navLinks[i]?.classList.add('text-pink')
      }
    },
  })
})

/* refresh after fonts load to keep pin math correct */
if (document.fonts?.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh())
}
