import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function initAnimations() {
  if (document.querySelector('.industry')) initIndustryAnimations();
  if (document.querySelector('.sale')) initSaleAnimations();
  if (document.querySelector('.calculator')) initCalculator();
  if (!document.querySelector('.intro')) return;

  // Instant reveal — set immediately if load already fired (Next.js mounts after load)
  const revealContainer = () => gsap.set('.container_animation', { opacity: 1 });
  if (document.readyState === 'complete') {
    revealContainer();
  } else {
    window.addEventListener('load', revealContainer, { once: true });
  }

  initSceneAnimations();
  initSlider();
  initScrollReveal();

  const introBtn = document.querySelector<HTMLElement>('.intro__btn');
  if (introBtn) {
    introBtn.addEventListener('mousedown', () => {
      gsap.to(window, { duration: 1, scrollTo: '#sale' });
    });
  }
}

// ─── Scene animations (exact Shopify index.js) ────────────────────────────

function initSceneAnimations() {
  // Initial states
  gsap.set('#eyeC', { opacity: 0 });
  gsap.set('#bearMove', { rotation: 5, transformOrigin: 'center' });
  gsap.set('#handB', { rotation: 15, y: 0, scaleX: 1.1, transformOrigin: 'center' });

  // Bear on right tree rocks side-to-side
  gsap.to('#bearMove', { rotation: -5, duration: 2, transformOrigin: 'center', repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // Bear tail wag
  gsap.to('#tailB', { rotation: -15, duration: .5, transformOrigin: 'center', repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // Honey jar squishes (scaleY, not rotation)
  gsap.to('#honey', { scaleY: 1.2, duration: 1.5, transformOrigin: 'center', repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // Bear on left tree rocks
  gsap.to('#bear2', { rotation: -10, transformOrigin: 'center', duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // Car bounce + lizard idle (all synced)
  gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut', duration: 1 } })
    .to('#car', { y: -2.5, repeat: -1, yoyo: true })
    .to('#tailY', { rotation: 5, transformOrigin: 'center', repeat: -1, yoyo: true }, '<')
    .to('#headY', { rotation: -10, transformOrigin: 'center', repeat: -1, yoyo: true }, '<')
    .to('#selectionY', { scaleY: .8, y: -2, transformOrigin: 'center', repeat: -1, yoyo: true }, '<')
    .to('#eyeBrY', { y: -2, repeat: -1, yoyo: true }, '<');

  // Bear eats honey sequence
  gsap.timeline({ repeat: -1, repeatDelay: 6, defaults: { ease: 'sine.inOut', duration: .75 } })
    .to('#handB', { delay: 3, rotation: -40, y: 10.5, scaleX: .65, transformOrigin: 'center' })
    .to('#headB, #mouthRB1', { rotation: 25, transformOrigin: 'center' }, '<')
    .to('#eyeC', { opacity: 1, duration: .001 }, '>-.1')
    .to('#eyeO', { opacity: 0, duration: .001 }, '<')
    .to('#moythS', { scaleY: 1.2, transformOrigin: 'center', duration: .5, repeat: 7, yoyo: true })
    .to('#handB', { rotation: 15, y: 0, scaleX: 1.1, transformOrigin: 'center' })
    .to('#headB, #mouthRB1', { rotation: 0, transformOrigin: 'center' }, '<')
    .to('#eyeC', { opacity: 0, duration: .001 }, '>-.4')
    .to('#eyeO', { opacity: 1, duration: .001 }, '<');

  // Scene entrance: right scene slides in from right, left from left
  gsap.timeline({ defaults: { ease: 'back.out(1.2)' } })
    .from('#rightMove > *', { x: 500, opacity: 0, duration: 1, stagger: .1 })
    .from('#leftMove > *', { x: -500, opacity: 0, duration: 1, stagger: .1 }, '<')
    .from('.intro .logo, #clouds1, #clouds2', { opacity: 0, duration: .5, ease: 'sine.inOut' }, '<');

  // Clouds drift slowly across
  gsap.to('#clouds1 > *', { x: -1122, y: 36, scale: 1.2, ease: 'none', transformOrigin: 'center', duration: 50, delay: -180, stagger: { each: 35, repeat: -1 } });
  gsap.to('#clouds2 > *', { x: 894, y: 3, scale: 1.2, ease: 'none', transformOrigin: 'center', duration: 50, delay: -180, stagger: { each: 35, repeat: -1 } });

  // Tree gentle sway (idle)
  gsap.to('#treeL3', { rotation: 2, scaleY: 1.02, transformOrigin: 'center', duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('#treeL2', { rotation: -1, scaleY: .99, transformOrigin: 'center', duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('#treeL1', { rotation: -1, delay: -1.5, scaleY: 1.02, transformOrigin: 'center', duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('#tree1R', { rotation: 1, scaleY: 1.02, transformOrigin: 'center', duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('#tree2R', { rotation: -2, scaleY: .98, transformOrigin: 'center', duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('#tree3R', { rotation: 1, delay: -2.5, scaleY: 1.02, transformOrigin: 'center', duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true });
}

// ─── Text slider ───────────────────────────────────────────────────────────

function initSlider() {
  const slides = Array.from(document.querySelectorAll<HTMLElement>('.intro__slider .slide'));
  if (slides.length < 2) return;

  let current = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Hide all but first slide
  slides.forEach((slide, i) => {
    if (i !== 0) gsap.set(slide, { x: '100%', opacity: 0, position: 'absolute' });
  });

  function goToSlide(next: number) {
    gsap.killTweensOf(slides);
    const tl = gsap.timeline({ defaults: { ease: 'sine.inOut', duration: .5 } });
    tl.to(slides[current], { x: '-100%', opacity: 1 })
      .to(slides[current], { opacity: 0, duration: .5 }, '>-.5')
      .set(slides[current], { x: '100%', opacity: 0 })
      .fromTo(slides[next], { x: '100%', opacity: 0 }, { x: '0%', opacity: 1 });
    current = next;
  }

  let idx = 0;

  function stop() {
    if (intervalId !== null) { clearInterval(intervalId); intervalId = null; }
  }

  function start() {
    stop();
    intervalId = setInterval(() => {
      idx = (idx + 1) % slides.length;
      goToSlide(idx);
    }, 7000);
  }

  start();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); } else { start(); }
  });

  window.addEventListener('beforeunload', stop, { once: true });
}

// ─── Industry section (exact Shopify index.js) ────────────────────────────

function initIndustryAnimations() {
  // Reveal SVG instantly on load (matches Shopify window.onload gsap.set)
  const revealSvg = () => gsap.set('.industry__wrapper-img svg, .industry__wrapper-imgM svg', { opacity: 1 });
  if (document.readyState === 'complete') revealSvg();
  else window.addEventListener('load', revealSvg, { once: true });

  // Initial hidden states for SVG elements
  gsap.set('#lineS21, #lineS22, #lineS23', { strokeDasharray: 1272, strokeDashoffset: 1272 });
  gsap.set('#lineArrowS2', { strokeDasharray: 123, strokeDashoffset: 123 });
  gsap.set('#headB3S2', { rotation: -5, transformOrigin: 'center' });
  gsap.set('#steam1, #steam2, #treeMS2', { scaleY: 0, transformOrigin: '50% 100%' });
  gsap.set('#shadowS2, #logoS2, #leafYB1, #arrowS2, #obS2M, #b2MoveLine', { opacity: 0 });
  gsap.set('#animB1S2', { y: 85 });
  gsap.set('#textSaveTAndM > *', { y: -10, opacity: 0 });
  gsap.set('#obS2L', { x: -35, opacity: 0 });
  gsap.set('#obS2R', { x: 35, opacity: 0 });
  gsap.set('#treeLeft', { x: -250, opacity: 0 });
  gsap.set('#treeRight', { x: 250, opacity: 0 });

  // Mobile SVG initial states
  gsap.set('#lineArrowS2M', { strokeDasharray: 123, strokeDashoffset: 123 });
  gsap.set('#headB3S2M', { rotation: -5, transformOrigin: 'center' });
  gsap.set('#steam1M, #steam2M, #treeMS2M', { scaleY: 0, transformOrigin: '50% 100%' });
  gsap.set('#shadowS2M, #logoS2M, #arrowS2M, #obS2MM', { opacity: 0 });
  gsap.set('#textSaveTAndMM > *', { y: -10, opacity: 0 });
  gsap.set('#obS2LM', { x: -35, opacity: 0 });
  gsap.set('#obS2RM', { x: 35, opacity: 0 });
  gsap.set('#treeRightM', { x: 250, opacity: 0 });

  // Idle animations on SVG elements
  gsap.to('#leaf1S2, #leaf4S2, #leaf6S2, #leaf7S2, #headB1S2, #headB2S2', { rotation: 10, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#leaf2S2, #leaf3S2, #leaf5S2, #leaf8S2, #handB2S2', { rotation: -10, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#leaf9S2', { scaleY: 1.1, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#headB3S2, #handB3LS2', { rotation: 5, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#b2MoveLine', { rotation: 15, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: .5 });
  gsap.to('#handB3RS2', { rotation: -5, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#body1B3, #body2B3', { scale: 1.05, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut', duration: .5 } })
    .to('#steam1', { scaleY: 1, transformOrigin: '50% 100%' })
    .to('#steam1', { scaleY: 0, transformOrigin: '50% 0%' })
    .to('#steam2', { scaleY: 1, transformOrigin: '50% 100%' }, '>-.4')
    .to('#steam2', { scaleY: 0, transformOrigin: '50% 0%' });

  // Mobile idle
  gsap.to('#leaf5S2M, #leaf8S2M', { rotation: -10, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#leaf6S2M, #leaf7S2M', { rotation: 10, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#leaf9S2M', { scaleY: 1.1, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#headB3S2M, #handB3LS2M', { rotation: 5, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#handB3RS2M', { rotation: -5, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.to('#body1B3M, #body2B3M', { scale: 1.05, transformOrigin: 'center', ease: 'sine.inOut', repeat: -1, yoyo: true, duration: 1 });
  gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut', duration: .5 } })
    .to('#steam1M', { scaleY: 1, transformOrigin: '50% 100%' })
    .to('#steam1M', { scaleY: 0, transformOrigin: '50% 0%' })
    .to('#steam2M', { scaleY: 1, transformOrigin: '50% 100%' }, '>-.4')
    .to('#steam2M', { scaleY: 0, transformOrigin: '50% 0%' });

  const isMobile = (window.innerWidth > 0 ? window.innerWidth : screen.width) <= 768;

  if (isMobile) {
    // Mobile: scrub the compact animation
    const mobileAnim = gsap.timeline({ defaults: { ease: 'sine.inOut' } })
      .to('#treeRightM', { x: 0, opacity: 1, duration: .5 })
      .to('#treeMS2M', { scaleY: 1, duration: .5 }, '<')
      .to('#shadowS2M', { opacity: 1, duration: .5 }, '<')
      .to('#logoS2M', { opacity: 1, duration: .5 })
      .to('#obS2LM, #obS2RM', { x: 0, opacity: 1, duration: .5 }, 'qq')
      .to('#obS2MM', { opacity: 1, duration: .5 }, '<')
      .to('#textSaveTAndMM > *', { y: 0, opacity: 1, duration: .25, stagger: .1 }, 'qq')
      .to('#lineArrowS2M', { strokeDashoffset: 0, duration: .5 }, '>')
      .to('#arrowS2M', { opacity: 1, duration: .1 }, '>');

    ScrollTrigger.create({ animation: mobileAnim, trigger: '.industry', start: 'center+=500px center', end: 'bottom+=250px bottom', pin: false, scrub: 2 });

    gsap.utils.toArray<Element>('.anim-center-2').forEach(el => {
      gsap.from(el, { y: 50, ease: 'none', opacity: 0, duration: .75, scrollTrigger: { trigger: el, start: 'top 80%' } });
    });
  } else {
    // Desktop: full scrubbed animation with bear traveling along cable
    const desktopAnim = gsap.timeline({ defaults: { ease: 'sine.inOut' } })
      .to('#treeLeft', { x: 0, opacity: 1, duration: 1 })
      .to('#treeRight', { x: 0, opacity: 1, duration: 1 }, '>-.5')
      .to('#treeMS2', { scaleY: 1, duration: 1 }, '>-.5')
      .to('#shadowS2', { opacity: 1, duration: 1 }, '<')
      .to('#animB1S2', { y: 0, duration: .5 }, '>-.25')
      .to('#leafYB1, #logoS2', { opacity: 1, duration: .5 })
      .to('#lineS21, #lineS23', { strokeDashoffset: 0, duration: 2, ease: 'none' })
      .to('#lineS22', { strokeDashoffset: 0, duration: 2, ease: 'none' }, '>')
      .to('#animB1S2', { y: 85, duration: .5 }, '<')
      .to('#leafYB1', { opacity: 0, duration: .5 }, '<')
      .to('#b2MoveLine', { opacity: 1, duration: .1 })
      .to('#b2Rot', { x: 308, y: 188, duration: .5, ease: 'none' }, 'qq')
      .to('#b2Rot', { x: 689, y: 296, duration: .5, ease: 'none' })
      .to('#b2Rot', { x: 1271, y: 307, duration: 1, ease: 'none' })
      .to('#b2Rot', { opacity: 0, duration: .1, ease: 'none' }, '>-.05')
      .to('#textSaveTAndM > *', { y: 0, opacity: 1, duration: .25, stagger: .1 }, 'qq')
      .to('#lineArrowS2', { strokeDashoffset: 0, duration: .5 }, '>')
      .to('#arrowS2', { opacity: 1, duration: .1 }, '>')
      .to('#obS2L, #obS2R', { x: 0, opacity: 1, duration: .5 }, '>+.5')
      .to('#obS2M', { opacity: 1, duration: .5 }, '<');

    ScrollTrigger.create({ animation: desktopAnim, trigger: '.industry', start: '5% center', end: 'bottom+=420px bottom', scrub: .8 });

    // Title/text slide in
    const titleAnim = gsap.timeline({ defaults: { ease: 'sine.inOut' } })
      .from('.industry__title, .industry__subtitle, .industry__text', { y: 50, opacity: 0, duration: 1 });
    ScrollTrigger.create({ animation: titleAnim, trigger: '.industry', start: 'top-=850px top', end: 'top-=50px top' });

    // List slide in
    const listAnim = gsap.timeline({ defaults: { ease: 'sine.inOut' } })
      .from('.industry__list', { y: 50, opacity: 0, duration: .75 });
    ScrollTrigger.create({ animation: listAnim, trigger: '.industry', start: '15% center', end: 'bottom bottom' });
  }
}

// ─── Scroll-triggered reveals (exact Shopify) ─────────────────────────────

function initScrollReveal() {
  gsap.utils.toArray<Element>('.anim-left').forEach(el => {
    gsap.from(el, { x: -50, ease: 'none', opacity: 0, duration: .75, scrollTrigger: { trigger: el, start: 'top 80%' } });
  });

  gsap.utils.toArray<Element>('.anim-right').forEach(el => {
    gsap.from(el, { x: 50, ease: 'none', opacity: 0, duration: .75, scrollTrigger: { trigger: el, start: 'top 80%' } });
  });

  gsap.utils.toArray<Element>('.anim-center').forEach(el => {
    gsap.from(el, { y: 50, ease: 'none', opacity: 0, duration: .75, scrollTrigger: { trigger: el, start: 'top 80%' } });
  });
}

// ─── Sale section (exact Shopify index.js) ────────────────────────────────

function initSaleAnimations() {
  if (!document.querySelector('.sale__left-anim')) return;

  // Initial states
  gsap.set('#panda-head', { opacity: 0 });
  gsap.set('#panda-hand', { transformOrigin: '100% 60%', rotation: -80, y: -10, x: 5 });
  gsap.set('#panda-hand-2', { opacity: 0, transformOrigin: '100% 60%', rotation: -72, y: -10, x: 5 });

  // Bamboo rise + panda sequence (scrubbed)
  gsap.timeline({
    defaults: { ease: 'none', duration: .5 },
    scrollTrigger: { trigger: '.sale__left-anim', start: '-20% center', end: '110% center', scrub: 2 },
  })
    .from('#bamboo', { yPercent: 100, duration: 1.75 })
    .to('#panda-hand', { transformOrigin: '100% 60%', rotation: -72, y: -10, x: 5, duration: 1 })
    .to('#bag', { transformOrigin: '50% 0%', rotation: 5, duration: 1 }, '<')
    .to('#part-bag', { transformOrigin: '50% 0%', x: -5, duration: 1 }, '<')
    .to('#panda-hand', { transformOrigin: '100% 60%', rotation: -80, y: -10, x: 5, duration: 1 })
    .to('#bag', { transformOrigin: '50% 0%', rotation: -5, duration: 1 }, '<')
    .to('#part-bag', { transformOrigin: '50% 0%', x: 5, duration: 1 }, '<')
    .to('#panda-hand', { transformOrigin: '100% 60%', rotation: -72, y: -10, x: 5, duration: 1 })
    .to('#bag', { transformOrigin: '50% 0%', rotation: 5, duration: 1 }, '<')
    .to('#part-bag', { transformOrigin: '50% 0%', x: -5, duration: 1 }, '<')
    .to('#panda-head', { opacity: 1 })
    .to('#panda-head-2', { opacity: 0, rotation: 20, transformOrigin: '50% 50%' }, '<')
    .to('#panda-hand-2', { transformOrigin: '100% 60%', rotation: 0, y: 0, x: 0, duration: 1 }, '<')
    .to('#panda-hand-2', { opacity: 1, duration: .05 }, '<')
    .to('#panda-hand', { opacity: 0, duration: .05 }, '<')
    .from('#mail', { opacity: 0 }, '<')
    .to('#panda-tail', { transformOrigin: '0% 50%', rotation: -15 })
    .to('#panda-tail', { transformOrigin: '0% 50%', rotation: 15 })
    .to('#panda-tail', { transformOrigin: '0% 50%', rotation: -15 })
    .to('#panda-tail', { transformOrigin: '0% 50%', rotation: 15 })
    .to('#panda-tail', { transformOrigin: '0% 50%', rotation: 0 })
    .to('#mail', { opacity: 0 })
    .to('#bamboo', { yPercent: 100, duration: 1.75 })
    .to('#panda-head', { opacity: 0 }, '<')
    .to('#panda-head-2', { opacity: 1, rotation: 0, transformOrigin: '50% 50%' }, '<');

  // Red panda eating (looping, scroll-activated)
  gsap.timeline({
    defaults: { ease: 'none', duration: 1.25 },
    scrollTrigger: { trigger: '.sale__right-anim', start: '-50% center', end: '150% center' },
    repeat: -1,
    yoyo: true,
  })
    .to('#red-panda_mouth-part', { transformOrigin: '50% 50%', scale: 1.1 })
    .to('#red-panda_leaf', { transformOrigin: '50% 0%', rotation: 12, scale: .92, y: 2, x: 2 }, '<')
    .to('#red-panda_mouth-line-1', { transformOrigin: '50% 50%', scale: 1.1, y: 2 }, '<')
    .to('#red-panda_mouth-line-2', { transformOrigin: '50% 50%', scale: 1.05, x: -2, y: 0 }, '<')
    .to('#red-panda_mouth-line-3', { transformOrigin: '50% 50%', scale: 1.1 }, '<')
    .to('#red-panda_mouth-line-4', { transformOrigin: '50% 50%', scale: 1.15 }, '<')
    .to('#red-panda_leaf', { transformOrigin: '50% 0%', scale: .84, y: -1, x: -2, rotation: 0 })
    .to('#red-panda_mouth-line-1', { transformOrigin: '50% 50%', scale: 1, y: 0 }, '<')
    .to('#red-panda_mouth-line-2', { transformOrigin: '50% 50%', scale: 1, x: 0, y: 0 }, '<')
    .to('#red-panda_mouth-line-3', { transformOrigin: '50% 50%', scale: 1 }, '<')
    .to('#red-panda_mouth-line-4', { transformOrigin: '50% 50%', scale: 1 }, '<');

  // Red panda hair blowing (looping)
  gsap.timeline({
    defaults: { ease: 'none', duration: .5 },
    scrollTrigger: { trigger: '.sale__right-anim', start: '-50% center', end: '150% center' },
    repeat: -1,
    yoyo: true,
  })
    .to('#red-panda_right-hair', { transformOrigin: '50% 100%', rotation: -25, x: -7, y: 2, duration: 2.5 });
}

// ─── Calculator (exact Shopify index.js) ──────────────────────────────────

function initCalculator() {
  const calcSection = document.querySelector('.calculator');
  if (!calcSection) return;

  const inputs = document.querySelectorAll<HTMLInputElement>('.calculator__input');
  const dataInputs = document.querySelectorAll<HTMLInputElement>('input[data-input]');
  const priceText = document.querySelector<HTMLElement>('.calculator__price-text');
  const powertrain = document.querySelector<SVGElement>('#car_powertrain');
  const tires = document.querySelector<SVGElement>('#car_tires');
  const wheel = document.querySelector<SVGElement>('#wheel');
  const paint = document.querySelector<SVGElement>('#car_paint-protect');
  const windshield = document.querySelector<SVGElement>('#car_windshield-protect');
  const allParts = document.querySelectorAll<SVGElement>('#car_powertrain, #car_tires, #car_windshield-protect, #car_paint-protect');

  function hideAllParts() {
    allParts.forEach(el => gsap.to(el, { opacity: 0 }));
    if (wheel) gsap.to(wheel, { opacity: 0 });
  }
  function showPowertrain() {
    if (powertrain && powertrain.style.opacity === '1') { gsap.to(powertrain, { opacity: 0 }); return; }
    hideAllParts(); if (powertrain) gsap.to(powertrain, { opacity: 1 });
  }
  function showTires() {
    if (tires && tires.style.opacity === '1') { gsap.to(tires, { opacity: 0 }); if (wheel) gsap.to(wheel, { opacity: 0 }); return; }
    hideAllParts(); if (tires) gsap.to(tires, { opacity: 1 }); if (wheel) gsap.to(wheel, { opacity: 1 });
  }
  function showPaint() {
    if (paint && paint.style.opacity === '1') { gsap.to(paint, { opacity: 0 }); return; }
    hideAllParts(); if (paint) gsap.to(paint, { opacity: 1 });
  }
  function showWindshield() {
    if (windshield && windshield.style.opacity === '1') { gsap.to(windshield, { opacity: 0 }); return; }
    hideAllParts(); if (windshield) gsap.to(windshield, { opacity: 1 });
  }

  // Allow only numbers/decimals
  dataInputs.forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    });
  });

  // Update total on any input change; bind field click handlers
  inputs.forEach((input, idx) => {
    input.addEventListener('input', () => {
      if (!input.value || !priceText) return;
      let total = 0;
      inputs.forEach(i => { total += +i.value; });
      priceText.textContent = total > 0 ? String(total) : '0';
    });

    if (document.documentElement.clientWidth > 700) {
      input.addEventListener('click', () => {
        const anchors = ['#fake-1', '#fake-2', '#fake-3', '#fake-4'];
        gsap.to(window, { duration: 1, scrollTo: anchors[idx] ?? anchors[0] });
      });
    } else {
      input.addEventListener('click', () => {
        if (idx === 0) showPowertrain();
        else if (idx === 1) showTires();
        else if (idx === 2) showWindshield();
        else if (idx === 3) showPaint();
      });
      input.addEventListener('change', hideAllParts);
    }
  });

  // Initial SVG states (desktop + mobile)
  gsap.set('#tire-line-3, #tire-line-2-3, #tire-line-6, #tire-line-2-6', { opacity: 0 });
  if (wheel) gsap.set(wheel, { opacity: 0 });

  if (document.documentElement.clientWidth > 700) {
    // Hide fields 2–4 so desktop scroll can reveal them one by one
    gsap.set('.calculator__box-input-2, .calculator__box-input-3, .calculator__box-input-4', { height: 0, opacity: 0, overflow: 'hidden' });
    // Car slides in from right
    gsap.from('.calculator__img', { x: 50, ease: 'none', opacity: 0, duration: .75, scrollTrigger: { trigger: '.calculator__img', start: 'top 80%' } });

    const trigger = '.calculator';
    const start = 'top top';
    const end = 'bottom bottom';

    // Main field-reveal + car-part timeline (scrubbed)
    const T = gsap.timeline({ defaults: { ease: 'none', duration: .5 }, scrollTrigger: { trigger, start, end, scrub: 1 } });
    T.to(powertrain, { opacity: 1 });
    T.to(powertrain, { opacity: 0 });
    // Tires + field 2 appear together
    T.to(tires, { opacity: 1 });
    T.to(wheel, { opacity: 1 }, '<');
    T.to('.calculator__box-input-2', { height: 'auto', opacity: 1, pointerEvents: 'all' }, '<');
    T.to(tires, { opacity: 0, delay: 0.5 });
    T.to(wheel, { opacity: 0 }, '<');
    // Windshield + field 3 appear together
    T.to(windshield, { opacity: 1 });
    T.to('.calculator__box-input-3', { height: 'auto', opacity: 1, pointerEvents: 'all' }, '<');
    T.to(windshield, { opacity: 0, delay: 0.5 });
    // Paint + field 4 appear together
    T.to(paint, { opacity: 1 });
    T.to('.calculator__box-input-4', { height: 'auto', opacity: 1, pointerEvents: 'all' }, '<');
    T.to(paint, { duration: 2 });
    T.fromTo('#car_tire-track-1', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '-=11');
    T.fromTo('#car_tire-track-2', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '<');
    T.to('#car_tire-track-1', { opacity: 0, duration: .25 }, '-=9.25');
    T.to('#car_tire-track-2', { opacity: 0, duration: .25 }, '<');
    T.fromTo('#car_tire-track-1', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '-=9');
    T.fromTo('#car_tire-track-2', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '<');
    T.to('#car_tire-track-1', { opacity: 1, duration: .25 }, '<');
    T.to('#car_tire-track-2', { opacity: 1, duration: .25 }, '<');
    T.to('#car_tire-track-1', { opacity: 0, duration: .25 }, '-=7.25');
    T.to('#car_tire-track-2', { opacity: 0, duration: .25 }, '<');
    T.fromTo('#car_tire-track-1', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '-=7');
    T.fromTo('#car_tire-track-2', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '<');
    T.to('#car_tire-track-1', { opacity: 1, duration: .25 }, '<');
    T.to('#car_tire-track-2', { opacity: 1, duration: .25 }, '<');
    T.to('#car_tire-track-1', { opacity: 0, duration: .25 }, '-=5.25');
    T.to('#car_tire-track-2', { opacity: 0, duration: .25 }, '<');
    T.fromTo('#car_tire-track-1', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '-=5');
    T.fromTo('#car_tire-track-2', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '<');
    T.to('#car_tire-track-1', { opacity: 1, duration: .25 }, '<');
    T.to('#car_tire-track-2', { opacity: 1, duration: .25 }, '<');
    T.to('#car_tire-track-1', { opacity: 0, duration: .25 }, '-=3.25');
    T.to('#car_tire-track-2', { opacity: 0, duration: .25 }, '<');
    T.fromTo('#car_tire-track-1', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '-=3');
    T.fromTo('#car_tire-track-2', { x: -40, y: 40 }, { x: 40, y: -40, duration: 2 }, '<');
    T.to('#car_tire-track-1', { opacity: 1, duration: .25 }, '<');
    T.to('#car_tire-track-2', { opacity: 1, duration: .25 }, '<');

    // Tire bounce timeline
    gsap.timeline({ defaults: { ease: 'none', duration: .5 }, scrollTrigger: { trigger, start, end, scrub: 1 } })
      .to('#car_tire-2, #car_tire-4', { y: -10, duration: .5 })
      .to('#car_tire-2, #car_tire-4', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-5', { y: -10, duration: .5 }, '<+0.55')
      .to('#car_tire-5', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-1, #car_tire-3', { y: -10, duration: .5 })
      .to('#car_tire-1, #car_tire-3', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-2, #car_tire-4', { y: -10, duration: .5 }, '+=2')
      .to('#car_tire-2, #car_tire-4', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-5', { y: -10, duration: .5 }, '<+0.55')
      .to('#car_tire-5', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-1, #car_tire-3', { y: -10, duration: .5 })
      .to('#car_tire-1, #car_tire-3', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-2, #car_tire-4', { y: -10, duration: .5 }, '+=2')
      .to('#car_tire-2, #car_tire-4', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-5', { y: -10, duration: .5 }, '<+0.55')
      .to('#car_tire-5', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-1, #car_tire-3', { y: -10, duration: .5 })
      .to('#car_tire-1, #car_tire-3', { y: 0, duration: .5 }, '<+0.75')
      .to('#car_tire-1, #car_tire-2, #car_tire-3, #car_tire-4, #car_tire-5', { y: 0, duration: .5 });

    // Tire lines 1+2 animation
    gsap.timeline({ defaults: { ease: 'none', duration: .5 }, scrollTrigger: { trigger, start, end, scrub: 1 } })
      .from('#tire-line-1, #tire-line-2-1, #tire-line-2, #tire-line-2-2', { opacity: 0, duration: .15 })
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -80, x: 15 }, { y: 15, x: 2, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -75, x: 40 }, { y: -20, x: 2, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -140, x: 55 }, { y: -80, x: 12, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -20, x: 2 }, { y: 75, x: -5, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -80, x: 12 }, { y: 15, x: 0, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -80, x: 45 }, { y: -10, x: 0, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -140, x: 55 }, { y: -80, x: 12, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -10, x: 0 }, { y: 75, x: -5, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -80, x: 12 }, { y: 15, x: 0, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -80, x: 45 }, { y: -10, x: 0, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -140, x: 55 }, { y: -80, x: 12, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -10, x: 0 }, { y: 75, x: -5, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -80, x: 12 }, { y: 15, x: 0, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -80, x: 45 }, { y: -10, x: 0, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -140, x: 55 }, { y: -80, x: 12, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -10, x: 0 }, { y: 75, x: -5, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -80, x: 12 }, { y: 15, x: 0, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -80, x: 45 }, { y: -10, x: 0, duration: .5 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -140, x: 55 }, { y: -80, x: 12, duration: .5 })
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -10, x: 0 }, { y: 75, x: -5, duration: .5 }, '<');

    // Tire lines 4+5 animation
    gsap.timeline({ defaults: { ease: 'none', duration: .5 }, scrollTrigger: { trigger, start, end, scrub: 1 } })
      .from('#tire-line-4, #tire-line-2-4, #tire-line-5, #tire-line-2-5', { opacity: 0, duration: .15 })
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -50, x: 5 }, { y: 15, x: 2, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -55, x: 25 }, { y: -10, x: 2, duration: .5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -115, x: 45 }, { y: -70, x: 9, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -10, x: 2 }, { y: 62, x: -3, duration: .5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -70, x: 9 }, { y: 15, x: 2, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -70, x: 35 }, { y: -10, x: -2, duration: .5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -115, x: 45 }, { y: -70, x: 9, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -10, x: -2 }, { y: 62, x: -3, duration: .5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -70, x: 9 }, { y: 15, x: 2, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -70, x: 35 }, { y: -10, x: -2, duration: .5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -115, x: 45 }, { y: -70, x: 9, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -10, x: -2 }, { y: 62, x: -3, duration: .5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -70, x: 9 }, { y: 15, x: 2, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -70, x: 35 }, { y: -10, x: -2, duration: .5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -115, x: 45 }, { y: -70, x: 9, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -10, x: -2 }, { y: 62, x: -3, duration: .5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -70, x: 9 }, { y: 15, x: 2, duration: .5 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -70, x: 35 }, { y: -10, x: -2, duration: .5 }, '<');

  } else {
    // Mobile: car slides in from below
    gsap.from('.calculator__img', { y: 50, ease: 'none', opacity: 0, duration: .75, scrollTrigger: { trigger: '.calculator__img', start: 'top 80%' } });

    // Field 1 starts full-width; fields 2-4 hidden until user scrolls to them
    gsap.set('.calculator__box-input-2, .calculator__box-input-3, .calculator__box-input-4', { height: 0, opacity: 0, overflow: 'hidden' });
    gsap.set('.calculator__box-input-1', { gridColumn: '1 / -1' });

    ScrollTrigger.create({
      trigger: '.calculator__box-input-1',
      start: 'bottom center',
      onEnter: () => {
        gsap.set('.calculator__box-input-1', { clearProps: 'gridColumn' });
        gsap.to('.calculator__box-input-2, .calculator__box-input-3, .calculator__box-input-4', {
          height: 'auto', opacity: 1, duration: 0.5, ease: 'sine.inOut',
        });
      },
      onLeaveBack: () => {
        gsap.set('.calculator__box-input-2, .calculator__box-input-3, .calculator__box-input-4', { height: 0, opacity: 0 });
        gsap.set('.calculator__box-input-1', { gridColumn: '1 / -1' });
      },
    });

    // Tire tracks loop (mobile)
    gsap.timeline({ defaults: { ease: 'none', duration: .5 }, repeat: -1 })
      .fromTo('#car_tire-track-1', { x: -40, y: 40 }, { x: 40, y: -40, duration: 1.5 })
      .fromTo('#car_tire-track-2', { x: -40, y: 40 }, { x: 40, y: -40, duration: 1.5 }, '<')
      .to('#car_tire-track-1', { opacity: 0, duration: .25 }, '-=0.25')
      .to('#car_tire-track-2', { opacity: 0, duration: .25 }, '<')
      .fromTo('#car_tire-track-1', { x: -40, y: 40 }, { x: 40, y: -40, duration: 1.5 })
      .fromTo('#car_tire-track-2', { x: -40, y: 40 }, { x: 40, y: -40, duration: 1.5 }, '<')
      .to('#car_tire-track-1', { opacity: 1, duration: .25 }, '<')
      .to('#car_tire-track-2', { opacity: 1, duration: .25 }, '<')
      .to('#car_tire-track-1', { opacity: 0, duration: .25 }, '-=0.25')
      .to('#car_tire-track-2', { opacity: 0, duration: .25 }, '<');

    // Tire lines loop (mobile)
    gsap.timeline({ defaults: { ease: 'none', duration: 1 }, repeat: -1 })
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -115, x: 45 }, { y: -70, x: 9 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -10, x: 2 }, { y: 62, x: -3 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -140, x: 55 }, { y: -80, x: 12 }, '<')
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -20, x: 2 }, { y: 75, x: -5 }, '<')
      .fromTo('#tire-line-4, #tire-line-2-4', { y: -70, x: 9 }, { y: 15, x: 2 })
      .fromTo('#tire-line-5, #tire-line-2-5', { y: -70, x: 35 }, { y: -10, x: -2 }, '<')
      .fromTo('#tire-line-1, #tire-line-2-1', { y: -80, x: 12 }, { y: 15, x: 0 }, '<')
      .fromTo('#tire-line-2, #tire-line-2-2', { y: -80, x: 45 }, { y: -20, x: 2 }, '<');
  }

  // Hint tooltip via CSS class toggle (hint icon click)
  const hintIcon = document.querySelector<HTMLElement>('.calculator__hint');
  const hintTextEl = document.querySelector<HTMLElement>('.calculator__hint-text');
  if (hintIcon && hintTextEl) {
    hintIcon.addEventListener('mouseover', () => hintTextEl.classList.add('calculator__hint-text--active'));
    hintIcon.addEventListener('mouseout', () => hintTextEl.classList.remove('calculator__hint-text--active'));
  }
}
