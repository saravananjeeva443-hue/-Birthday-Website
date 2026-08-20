(() => {
  // DESIGN: Moonlit Butterfly Letter — preserve the violet journey, let every submitted wish become a star, and reveal only this visit's wishes on replay.
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scenes = {
    bouquet: $('#scene-bouquet'),
    guide: $('#scene-guide'),
    photo: $('#scene-photo'),
    wish: $('#scene-wish'),
    final: $('#scene-final')
  };

  const bouquetButterflies = [...document.querySelectorAll('.bouquet-butterfly')];
  const bouquetTrigger = $('#bouquet-trigger');
  const guideButterfly = $('#guide-butterfly');
  const guideTitle = $('#guide-title');
  const guidePrompt = $('#guide-prompt');
  const photoButterfly = $('#photo-butterfly');
  const photoPrompt = $('#photo-prompt');
  const photoReveal = $('#photo-reveal');
  const sendWish = $('#send-wish');
  const wishInput = $('#wish-input');
  const wishStatus = $('#wish-status');
  const wishButterfly = $('#wish-butterfly');
  const wishPrompt = $('#wish-prompt');
  const replay = $('#replay');
  const sessionWishes = $('#session-wishes');
  const sessionWishList = $('#session-wish-list');
  const floatingLayer = $('#floating-layer');
  const toast = $('#toast');
  const confettiCanvas = $('#confetti-canvas');
  const fireworksCanvas = $('#fireworks-canvas');
  const birthdayBgm = $('#birthday-bgm');

  let typingRun = 0;
  let photoRevealed = false;
  let wishSent = false;
  const visitWishes = [];
  let confettiPieces = [];
  let fireworks = [];
  let sparks = [];
  let effectTimers = [];
  let confettiFrame = null;
  let fireworksFrame = null;

  function showScene(scene) {
    Object.values(scenes).forEach((item) => {
      const active = item === scene;
      item.hidden = !active;
      item.classList.toggle('is-active', active);
    });
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  async function typeText(element, text, speed = 38) {
    const run = ++typingRun;
    element.textContent = '';
    if (reducedMotion) {
      element.textContent = text;
      return;
    }
    for (const character of text) {
      if (run !== typingRun) return;
      element.textContent += character;
      await sleep(speed);
    }
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function prepareButterfly(button) {
    button.disabled = false;
    button.classList.remove('is-locked');
    button.classList.add('is-ready');
  }

  async function flyTo(button, nextScene, afterEnter) {
    if (button.disabled || !button.classList.contains('is-ready')) return;
    button.disabled = true;
    button.classList.remove('is-ready');
    button.classList.add('is-flying');
    await sleep(reducedMotion ? 0 : 1050);
    showScene(nextScene);
    button.classList.remove('is-flying');
    await afterEnter();
  }

  async function openFromBouquet() {
    bouquetButterflies.forEach((butterfly) => butterfly.classList.add('is-emerging'));
    await sleep(reducedMotion ? 0 : 2200);
    showScene(scenes.guide);
    await typeText(guideTitle, 'Follow me, Nila 💜', 60);
    guidePrompt.textContent = 'Touch the purple butterfly — it will guide you.';
    prepareButterfly(guideButterfly);
    startSoftEffects();
  }

  async function enterPhotoScene() {
    photoRevealed = false;
    photoReveal.hidden = true;
    photoReveal.classList.remove('is-visible');
    photoPrompt.textContent = 'Touch the butterfly to reveal the magic ✨';
    photoButterfly.setAttribute('aria-label', 'Touch the butterfly to reveal the birthday photo');
    prepareButterfly(photoButterfly);
  }

  async function enterWishScene() {
    wishSent = false;
    wishInput.value = '';
    wishStatus.textContent = '';
    wishButterfly.disabled = true;
    wishButterfly.classList.remove('is-ready', 'is-flying');
    wishButterfly.classList.add('is-locked');
    wishPrompt.textContent = 'Send your wish first; then follow the butterfly.';
  }

  async function enterFinalScene() {
    hideWishReplay();
    burstConfetti(150);
    launchFirework();
    startMusic();
  }

  async function handleGuideTouch() {
    await flyTo(guideButterfly, scenes.photo, enterPhotoScene);
  }

  async function handlePhotoTouch() {
    if (!photoButterfly.classList.contains('is-ready')) return;
    if (!photoRevealed) {
      photoRevealed = true;
      photoReveal.hidden = false;
      photoReveal.classList.add('is-visible');
      photoPrompt.textContent = 'The magic is here 💜 Touch the butterfly again to continue.';
      photoButterfly.setAttribute('aria-label', 'Touch the butterfly to continue to the wish page');
      showToast('Your special picture appeared.');
      return;
    }
    await flyTo(photoButterfly, scenes.wish, enterWishScene);
  }

  function handleWishSend() {
    const wish = wishInput.value.trim();
    if (!wish) {
      wishStatus.textContent = 'Write a little wish first; the stars are listening ✦';
      wishInput.focus();
      return;
    }
    wishSent = true;
    visitWishes.push(wish);
    wishStatus.textContent = visitWishes.length === 1
      ? 'Your wish became a star and is flying into the night sky ✦'
      : `Another wish became a star ✦ ${visitWishes.length} wishes are glowing in this visit.`;
    wishInput.value = '';
    createWishStar(wish);
    prepareButterfly(wishButterfly);
    wishPrompt.textContent = 'Your star is on its way. Touch the butterfly for the final page.';
    showToast('Your wish became a star.');
  }

  function renderVisitWishes() {
    sessionWishList.innerHTML = '';
    visitWishes.forEach((wish, index) => {
      const item = document.createElement('p');
      item.className = 'session-wish-item';
      const star = document.createElement('span');
      star.setAttribute('aria-hidden', 'true');
      star.textContent = '✦';
      const quote = document.createElement('span');
      quote.textContent = wish;
      item.append(star, quote);
      item.style.setProperty('--wish-index', index);
      sessionWishList.appendChild(item);
    });
  }

  function showWishReplay() {
    sessionWishes.hidden = false;
    renderVisitWishes();
    replay.dataset.mode = 'restart';
    replay.textContent = 'Start the surprise again ↺';
    window.setTimeout(() => sessionWishes.classList.add('is-visible'), 20);
    sessionWishes.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    showToast(`${visitWishes.length} wish${visitWishes.length === 1 ? '' : 'es'} from this visit are here.`);
  }

  function hideWishReplay() {
    sessionWishes.classList.remove('is-visible');
    sessionWishes.hidden = true;
    replay.dataset.mode = '';
    replay.textContent = 'Experience it again ↺';
  }

  function createWishStar(wish) {
    const star = document.createElement('span');
    star.className = 'wish-star';
    star.textContent = '✦';
    star.title = wish;
    star.setAttribute('aria-label', wish);
    star.style.left = `${35 + Math.random() * 30}%`;
    star.style.bottom = '15vh';
    document.body.appendChild(star);
    window.setTimeout(() => star.remove(), 5400);
  }

  function resetExperience() {
    stopEffects();
    stopMusic();
    bouquetButterflies.forEach((butterfly) => butterfly.classList.remove('is-emerging'));
    photoRevealed = false;
    wishSent = false;
    guideTitle.textContent = '';
    guidePrompt.textContent = 'Touch the purple butterfly — it will guide you.';
    photoReveal.hidden = true;
    photoReveal.classList.remove('is-visible');
    photoButterfly.disabled = true;
    photoButterfly.classList.remove('is-ready', 'is-flying');
    wishButterfly.disabled = true;
    wishButterfly.classList.remove('is-ready', 'is-flying');
    wishButterfly.classList.add('is-locked');
    wishInput.value = '';
    wishStatus.textContent = '';
    wishPrompt.textContent = 'Send your wish first; then follow the butterfly.';
    hideWishReplay();
    showScene(scenes.bouquet);
  }

  // ---------- Confetti, fireworks, and subtle flying butterflies ----------
  function resizeCanvas(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }

  function burstConfetti(amount = 90) {
    if (reducedMotion) return;
    const colors = ['#ffffff', '#a9e7ff', '#d5b5ff', '#f4a7d9', '#ffe4a9'];
    for (let i = 0; i < amount; i += 1) {
      confettiPieces.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 80,
        vx: (Math.random() - .5) * 3,
        vy: 1.5 + Math.random() * 3,
        size: 4 + Math.random() * 6,
        rotate: Math.random() * 360,
        spin: (Math.random() - .5) * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      });
    }
    if (!confettiFrame) confettiFrame = requestAnimationFrame(animateConfetti);
  }

  function animateConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiPieces.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += .018;
      piece.rotate += piece.spin;
      piece.life -= .003;
      ctx.save();
      ctx.translate(piece.x * ratio, piece.y * ratio);
      ctx.rotate(piece.rotate * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, piece.life);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.size * ratio / 2, -piece.size * ratio / 3, piece.size * ratio, piece.size * ratio * .6);
      ctx.restore();
    });
    confettiPieces = confettiPieces.filter((piece) => piece.y < window.innerHeight + 40 && piece.life > 0);
    confettiFrame = confettiPieces.length ? requestAnimationFrame(animateConfetti) : null;
  }

  function launchFirework() {
    if (reducedMotion) return;
    fireworks.push({ x: window.innerWidth * (.2 + Math.random() * .6), y: window.innerHeight + 10, targetY: 90 + Math.random() * window.innerHeight * .42, speed: 6 + Math.random() * 3, color: ['#caa7ff', '#8adfff', '#ffd0f0'][Math.floor(Math.random() * 3)] });
    if (!fireworksFrame) fireworksFrame = requestAnimationFrame(animateFireworks);
  }

  function explode(firework) {
    for (let i = 0; i < 45; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      sparks.push({ x: firework.x, y: firework.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color: firework.color });
    }
  }

  function animateFireworks() {
    const ctx = fireworksCanvas.getContext('2d');
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    fireworks.forEach((firework, index) => {
      firework.y -= firework.speed;
      ctx.beginPath();
      ctx.arc(firework.x * ratio, firework.y * ratio, 2.2 * ratio, 0, Math.PI * 2);
      ctx.fillStyle = firework.color;
      ctx.fill();
      if (firework.y <= firework.targetY) { explode(firework); fireworks.splice(index, 1); }
    });
    sparks.forEach((spark) => {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += .04;
      spark.life -= .018;
      ctx.globalAlpha = Math.max(0, spark.life);
      ctx.beginPath();
      ctx.arc(spark.x * ratio, spark.y * ratio, 1.6 * ratio, 0, Math.PI * 2);
      ctx.fillStyle = spark.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    sparks = sparks.filter((spark) => spark.life > 0);
    fireworksFrame = fireworks.length || sparks.length ? requestAnimationFrame(animateFireworks) : null;
  }

  function createFloatingButterfly() {
    if (reducedMotion) return;
    const butterfly = document.createElement('span');
    butterfly.className = 'floating-butterfly';
    butterfly.innerHTML = '<img src="assets/guide-butterfly-purple.png" alt="" />';
    butterfly.style.top = `${18 + Math.random() * 58}%`;
    butterfly.style.setProperty('--duration', `${14 + Math.random() * 8}s`);
    floatingLayer.appendChild(butterfly);
    window.setTimeout(() => butterfly.remove(), 24000);
  }

  function startSoftEffects() {
    stopEffects();
    effectTimers = [
      window.setInterval(createFloatingButterfly, 4800),
      window.setInterval(() => burstConfetti(35), 8000),
      window.setInterval(launchFirework, 4200)
    ];
    createFloatingButterfly();
    burstConfetti(70);
    launchFirework();
  }

  function stopEffects() {
    effectTimers.forEach((timer) => window.clearInterval(timer));
    effectTimers = [];
    floatingLayer.innerHTML = '';
    confettiPieces = [];
    fireworks = [];
    sparks = [];
    if (confettiFrame) cancelAnimationFrame(confettiFrame);
    if (fireworksFrame) cancelAnimationFrame(fireworksFrame);
    confettiFrame = null;
    fireworksFrame = null;
    confettiCanvas.getContext('2d').clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    fireworksCanvas.getContext('2d').clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  }

  // The original instrumental soundtrack starts only after the bouquet is opened,
  // respecting browser autoplay policies and restarting from the beginning on replay.
  function startMusic() {
    if (!birthdayBgm || !birthdayBgm.paused) return;
    birthdayBgm.volume = .2;
    birthdayBgm.play().catch(() => {
      showToast('Tap the bouquet again if you would like the music to play.');
    });
  }

  function stopMusic() {
    if (!birthdayBgm) return;
    birthdayBgm.pause();
    birthdayBgm.currentTime = 0;
  }

  bouquetTrigger.addEventListener('click', () => { startMusic(); openFromBouquet(); });
  guideButterfly.addEventListener('click', handleGuideTouch);
  photoButterfly.addEventListener('click', handlePhotoTouch);
  sendWish.addEventListener('click', handleWishSend);
  wishButterfly.addEventListener('click', () => flyTo(wishButterfly, scenes.final, enterFinalScene));
  replay.addEventListener('click', () => {
    if (!visitWishes.length) {
      resetExperience();
      return;
    }
    if (replay.dataset.mode === 'restart') {
      resetExperience();
      return;
    }
    showWishReplay();
  });
  wishInput.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') handleWishSend();
  });
  window.addEventListener('resize', () => { resizeCanvas(confettiCanvas); resizeCanvas(fireworksCanvas); });

  resizeCanvas(confettiCanvas);
  resizeCanvas(fireworksCanvas);
  guideButterfly.disabled = true;
  photoButterfly.disabled = true;
})();
