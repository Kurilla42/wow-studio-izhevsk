import './style.css'
import 'lenis/dist/lenis.css'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches

/* ============ Lenis: smooth, inertial scroll ============ */
/* Eases native scroll (momentum / "доезд" after you stop). Native scroll is
   preserved, so window.scrollY, position:sticky and ScrollTrigger keep working. */
let lenis = null
if (!prefersReduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.5 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

/* Anchor links scroll smoothly through Lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  const href = a.getAttribute('href')
  if (!href || href.length < 2) return
  a.addEventListener('click', (e) => {
    const target = document.querySelector(href)
    if (target && lenis) { e.preventDefault(); lenis.scrollTo(target, { offset: -8 }) }
  })
})

/* ============ Scroll progress bar ============ */
const bar = document.getElementById('scroll-progress')
if (bar) {
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } })
}

/* ============ Header: hidden over hero, revealed after it ============ */
const header = document.querySelector('.site-header')
const hero = document.getElementById('top')
if (header && hero) {
  const onScroll = () => {
    header.classList.toggle('is-visible', window.scrollY > hero.offsetHeight - 70)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
}

/* ============ Hero intro ============ */
if (!prefersReduced) {
  // everything except the headline: simple fade-up
  gsap.set('.hero-anim:not(.hero-title)', { y: 26, opacity: 0 })
  gsap.to('.hero-anim:not(.hero-title)', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.35 })
  // headline: two lines rise + fade — only on desktop (mobile shows it static)
  if (!window.matchMedia('(max-width: 768px)').matches) {
    gsap.set('.hero-title .hero-outline', { yPercent: 100, opacity: 0 })
    gsap.to('.hero-title .hero-outline', { yPercent: 0, opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.12, delay: 0.2 })
  }
  // Failsafe: never leave hero content hidden (e.g. throttled rAF in a background tab)
  setTimeout(() => {
    document.querySelectorAll('.hero-anim:not(.hero-title)').forEach((e) => {
      if (getComputedStyle(e).opacity === '0') gsap.set(e, { opacity: 1, y: 0 })
    })
    document.querySelectorAll('.hero-title .hero-outline').forEach((e) => {
      if (getComputedStyle(e).opacity === '0') gsap.set(e, { opacity: 1, yPercent: 0 })
    })
  }, 1800)
} else {
  gsap.set('.hero-anim', { opacity: 1 })
}

/* ============ Reveal on scroll (paragraphs, eyebrows, etc.) ============ */
document.querySelectorAll('.reveal').forEach((el) => {
  ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('is-in') })
})
if (prefersReduced) document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'))

/* ============ SplitText: section headings rise word-by-word ============ */
function splitHeadings() {
  if (prefersReduced) return
  document.querySelectorAll('h2.reveal').forEach((h) => {
    h.classList.add('is-in') // let the reveal CSS show the parent; SplitText drives motion
    const split = new SplitText(h, { type: 'lines,words', linesClass: 'split-line' })
    gsap.set(split.words, { yPercent: 115 })
    ScrollTrigger.create({
      trigger: h, start: 'top 85%', once: true,
      onEnter: () => gsap.to(split.words, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.05 }),
    })
  })
}

/* ============ Magnetic primary buttons (desktop) ============ */
if (canHover) {
  document.querySelectorAll('a.btn-pink').forEach((btn) => {
    btn.classList.add('magnetic-on')
    const s = 0.4
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect()
      gsap.to(btn, { x: (e.clientX - (r.left + r.width / 2)) * s, y: (e.clientY - (r.top + r.height / 2)) * s, duration: 0.4, ease: 'power3.out' })
    })
    btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }))
  })
}

/* ============ Hero background parallax ============ */
const heroBg = document.querySelector('.hero-bg')
if (heroBg && !prefersReduced) {
  gsap.set(heroBg, { scale: 1.18 }) // oversize so edges never show while it moves
  gsap.fromTo(heroBg, { yPercent: -6 }, {
    yPercent: 10, ease: 'none',
    scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true },
  })
}

/* ============ Gallery clip-reveal ============ */
const figs = document.querySelectorAll('.gal-item')
if (figs.length) {
  if (prefersReduced) gsap.set(figs, { clipPath: 'inset(0 0 0% 0)' })
  else ScrollTrigger.batch(figs, {
    start: 'top 85%',
    onEnter: (b) => gsap.to(b, { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'power3.out', stagger: 0.14 }),
  })
}

/* ============ Running ticker (velocity-reactive) ============ */
const tickerTrack = document.getElementById('ticker-track')
if (tickerTrack && !prefersReduced) {
  const loop = gsap.to(tickerTrack, { xPercent: -50, duration: 24, ease: 'none', repeat: -1 })
  let settle
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = self.getVelocity()
      if (!v) return
      const dir = v < 0 ? -1 : 1
      gsap.to(loop, { timeScale: gsap.utils.clamp(0.3, 6, Math.abs(v) / 250 + 1) * dir, duration: 0.25, overwrite: true })
      clearTimeout(settle)
      settle = setTimeout(() => gsap.to(loop, { timeScale: 1, duration: 0.8, overwrite: true }), 130)
    },
  })
}

/* ============ Zoom parallax: video centre + 7 photos scale around it ============ */
const zoom = document.getElementById('zoom')
const zoomDesktop = window.matchMedia('(min-width: 769px)').matches
if (zoom && zoomDesktop) {
  const items = [...zoom.querySelectorAll('.zoom-item')]
  if (prefersReduced) {
    items.forEach((item) => {
      if (item.classList.contains('zoom-video')) gsap.set(item, { scale: parseFloat(item.dataset.scale) || 4 })
      else gsap.set(item, { autoAlpha: 0 })
    })
  } else {
    items.forEach((item) => {
      gsap.fromTo(item, { scale: 1 }, {
        scale: parseFloat(item.dataset.scale) || 4, ease: 'none',
        scrollTrigger: { trigger: zoom, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
      })
    })
  }
}

/* ============ Reviews slider (single big testimonial) ============ */
const stage = document.getElementById('reviews-stage')
if (stage) {
  const slides = [...stage.querySelectorAll('.rev-slide')]
  const counter = document.getElementById('rev-counter')
  let idx = 0
  const total = slides.length
  const pad = (n) => String(n).padStart(2, '0')
  const show = (i) => {
    idx = (i + total) % total
    slides.forEach((s, k) => s.classList.toggle('is-active', k === idx))
    if (counter) counter.textContent = `${pad(idx + 1)} / ${pad(total)}`
  }
  document.querySelectorAll('[data-rev]').forEach((btn) => {
    btn.addEventListener('click', () => show(idx + (btn.dataset.rev === 'next' ? 1 : -1)))
  })
  // gentle autoplay, paused on hover
  let timer = setInterval(() => show(idx + 1), 7000)
  stage.addEventListener('pointerenter', () => clearInterval(timer))
  stage.addEventListener('pointerleave', () => { timer = setInterval(() => show(idx + 1), 7000) })
}

/* ============ Active nav link ============ */
const navLinks = [...document.querySelectorAll('.site-header nav a[href^="#"]')]
const navSections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean)
navSections.forEach((sec, i) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top center', end: 'bottom center',
    onToggle: (self) => {
      if (self.isActive) {
        navLinks.forEach((l) => l.classList.remove('text-pink'))
        navLinks[i]?.classList.add('text-pink')
      }
    },
  })
})

/* ============ 3D tilt on image cards (mouse / desktop only) ============ */
if (canHover) {
  const MAX = 7
  document.querySelectorAll('.tilt').forEach((el) => {
    let rect = null
    el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect() })
    el.addEventListener('mousemove', (e) => {
      if (!rect) rect = el.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
      el.style.transform = `perspective(800px) rotateX(${(-ny * MAX).toFixed(2)}deg) rotateY(${(nx * MAX).toFixed(2)}deg) scale(1.02)`
      el.style.boxShadow = `${(-nx * 16).toFixed(0)}px ${(26 - ny * 10).toFixed(0)}px 52px -14px rgba(40, 25, 10, 0.45)`
    })
    el.addEventListener('mouseleave', () => {
      rect = null
      el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)'
      el.style.boxShadow = ''
    })
  })
}

/* ============ Build splits + refresh after fonts load ============ */
if (document.fonts?.ready) {
  document.fonts.ready.then(() => { splitHeadings(); ScrollTrigger.refresh() })
} else {
  splitHeadings()
}
