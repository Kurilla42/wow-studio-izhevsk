import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ============ Header: hidden over hero, revealed after it ============ */
const header = document.querySelector('.site-header')
const hero = document.getElementById('top')
if (header && hero) {
  const onScroll = () => {
    const trigger = hero.offsetHeight - 70
    header.classList.toggle('is-visible', window.scrollY > trigger)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
}

/* ============ Hero intro ============ */
if (!prefersReduced) {
  gsap.set('.hero-anim', { y: 26, opacity: 0 })
  gsap.to('.hero-anim', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.15 })
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
  ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('is-in') })
})
if (prefersReduced) document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'))

/* ============ Expanding video: portrait -> padded widescreen ============ */
const expandWrap = document.getElementById('expand')
if (expandWrap && !prefersReduced) {
  const media = expandWrap.querySelector('.expand-media')
  const fade = expandWrap.querySelector('.expand-fade')
  const line1 = expandWrap.querySelector('.expand-line-1')
  const line2 = expandWrap.querySelector('.expand-line-2')

  const sizes = () => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    // start: portrait ("mobile") — narrow and tall
    let startW = Math.min(vw * 0.5, 235)
    let startH = (startW * 16) / 9
    if (startH > vh * 0.62) { startH = vh * 0.62; startW = (startH * 9) / 16 }
    // end: padded widescreen — leaves margins around the block (not full bleed)
    const endW = Math.min(vw * 0.86, 1180)
    const endH = (endW * 9) / 16
    return { startW, startH, endW, endH }
  }

  const tl = gsap.timeline({
    scrollTrigger: { trigger: expandWrap, start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
  })
  tl.fromTo(media,
      { width: () => sizes().startW, height: () => sizes().startH },
      { width: () => sizes().endW, height: () => sizes().endH, borderRadius: 16, ease: 'none', duration: 1 }, 0)
    .to(fade, { opacity: 1, ease: 'none', duration: 1 }, 0)                                 // backdrop -> block background colour
    .to(line1, { x: () => -window.innerWidth * 0.62, ease: 'none', duration: 1 }, 0)        // two lines slide apart
    .to(line2, { x: () => window.innerWidth * 0.62, ease: 'none', duration: 1 }, 0)
    .to([line1, line2], { opacity: 0, ease: 'none', duration: 0.85 }, 0)                    // and fade out, fully gone near the end
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
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean)
sections.forEach((sec, i) => {
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
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
if (canHover) {
  const MAX = 7 // max tilt angle in degrees
  document.querySelectorAll('.tilt').forEach((el) => {
    let rect = null
    el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect() })
    el.addEventListener('mousemove', (e) => {
      if (!rect) rect = el.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1   // -1 .. 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1   // -1 .. 1
      // tilt toward the cursor — the point under it is pressed "into" the screen
      el.style.transform = `perspective(800px) rotateX(${(-ny * MAX).toFixed(2)}deg) rotateY(${(nx * MAX).toFixed(2)}deg) scale(1.02)`
    })
    el.addEventListener('mouseleave', () => {
      rect = null
      el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)'
    })
  })
}

/* refresh after fonts load to keep scroll math correct */
if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh())
