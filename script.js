/* -------------------------------------------------------
   KAI'S BIRTHDAY UNIVERSE
   Interactive details, animated stars, and little surprises
-------------------------------------------------------- */
(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sticky glass navigation
  const nav = $(".nav");
  const updateNav = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });

  // Scroll reveal: each section gently enters the scene.
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  // A full-window, responsive starfield rendered on canvas.
  const canvas = $("#starfield");
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let stars = [];
  let animationFrame = 0;
  const pointer = { x: -1000, y: -1000 };
  const STAR_COUNT = Math.min(170, Math.floor((window.innerWidth * window.innerHeight) / 8500));

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.35 + 0.25,
      alpha: Math.random() * 0.55 + 0.18,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.012 + 0.003,
      drift: (Math.random() - 0.5) * 0.13,
      tint: Math.random() > 0.83 ? "pink" : (Math.random() > 0.72 ? "blue" : "white")
    }));
  }

  function drawStars() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach((star) => {
      star.phase += star.speed;
      star.x += star.drift;
      if (star.x < -3) star.x = width + 3;
      if (star.x > width + 3) star.x = -3;
      const twinkle = 0.55 + Math.sin(star.phase) * 0.45;
      const dx = pointer.x - star.x;
      const dy = pointer.y - star.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const glow = distance < 150 ? (1 - distance / 150) * 0.65 : 0;
      const alpha = Math.min(1, star.alpha * twinkle + glow);
      const color = star.tint === "pink" ? `rgba(240,166,216,${alpha})`
        : star.tint === "blue" ? `rgba(156,231,237,${alpha})`
        : `rgba(239,235,255,${alpha})`;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(star.x, star.y, star.radius + glow * 1.2, 0, Math.PI * 2);
      ctx.fill();
      if (glow > 0.3) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(200,180,255,${glow * 0.35})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(star.x - 5, star.y);
        ctx.lineTo(star.x + 5, star.y);
        ctx.moveTo(star.x, star.y - 5);
        ctx.lineTo(star.x, star.y + 5);
        ctx.stroke();
      }
    });
    if (!reduceMotion) animationFrame = requestAnimationFrame(drawStars);
  }

  resizeCanvas();
  drawStars();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    const glow = $(".cursor-glow");
    if (glow) {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    }
  }, { passive: true });

  // Gentle number count-up when the statistic cards appear.
  function countUp(element, target) {
    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = String(Math.round(target * eased)).padStart(3, "0");
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const statObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const value = Number(entry.target.dataset.count);
        if (value) countUp(entry.target, value);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.65 });
  $$("[data-count]").forEach((element) => statObserver.observe(element));

  // Tiny wish interaction: it gets more celebratory with every click.
  const wishButton = $("#wishButton");
  const wishResponse = $("#wishResponse");
  const wishCount = $("#wishCount");
  let wishes = 0;
  const wishMessages = [
    "YOUR WISH IS BETWEEN YOU AND THE STARS.",
    "MAY THE RIGHT DOORS OPEN FOR YOU.",
    "ONE STEP AT A TIME. KEEP BELIEVING.",
    "MAY THIS YEAR SURPRISE YOU BEAUTIFULLY.",
    "GOOD THINGS CAN FIND THEIR WAY TO YOU.",
    "KEEP THE FAITH. KEEP MOVING FORWARD."
  ];
  wishButton.addEventListener("click", () => {
    wishes += 1;
    wishCount.textContent = String(wishes);
    wishResponse.textContent = wishMessages[(wishes - 1) % wishMessages.length];
    wishButton.animate(
      [{ transform: "scale(1)" }, { transform: "scale(.88) rotate(-8deg)" }, { transform: "scale(1.13) rotate(8deg)" }, { transform: "scale(1)" }],
      { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
    burstConfetti(wishButton.getBoundingClientRect().left + 50, wishButton.getBoundingClientRect().top + 50, 24);
  });

  // Lightweight confetti made from DOM particles, no library needed.
  function burstConfetti(originX, originY, amount = 80) {
    const colors = ["#c8b6ff", "#f0a6d8", "#9ce7ed", "#ffffff", "#a88cff"];
    for (let i = 0; i < amount; i += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.3;
      const distance = 45 + Math.random() * 180;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - Math.random() * 70;
      const size = 3 + Math.random() * 5;
      particle.style.cssText = `
        position:fixed; z-index:110; left:${originX}px; top:${originY}px;
        width:${size}px; height:${size * (Math.random() > .5 ? 1 : 1.8)}px;
        border-radius:${Math.random() > .5 ? "50%" : "1px"};
        background:${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events:none; box-shadow:0 0 8px #c8b6ff55;
      `;
      document.body.appendChild(particle);
      const animation = particle.animate([
        { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(.2) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }
      ], { duration: 850 + Math.random() * 850, easing: "cubic-bezier(.1,.7,.3,1)" });
      animation.onfinish = () => particle.remove();
    }
  }

  // Surprise modal
  const modal = $("#surpriseModal");
  const celebrateButton = $("#celebrateButton");
  const closeModal = $("#closeModal");
  const modalCelebrate = $("#modalCelebrate");
  function openModal() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    closeModal.focus();
    burstConfetti(window.innerWidth / 2, window.innerHeight / 2, 110);
  }
  function hideModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    celebrateButton.focus();
  }
  celebrateButton.addEventListener("click", openModal);
  closeModal.addEventListener("click", hideModal);
  $$("[data-close-modal]").forEach((el) => el.addEventListener("click", hideModal));
  modalCelebrate.addEventListener("click", () => {
    hideModal();
    showToast("HAPPY BIRTHDAY, KAI! ✦");
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.42, 150);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) hideModal();
  });

  // Sound button intentionally stays silent unless a user enables it.
  // Web Audio creates a soft, optional ambient tone; no autoplay.
  let audioContext = null;
  let soundEnabled = false;
  const soundToggle = $("#soundToggle");
  function stopAmbient() {
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
    soundEnabled = false;
    soundToggle.innerHTML = '♫ <span>Sound off</span>';
  }
  function startAmbient() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      showToast("Ambient sound isn't supported in this browser.");
      return;
    }
    audioContext = new AudioContext();
    const master = audioContext.createGain();
    master.gain.value = 0.018;
    master.connect(audioContext.destination);
    [174.61, 261.63, 349.23].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index === 1 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.35 : 0.17;
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start();
    });
    soundEnabled = true;
    soundToggle.innerHTML = '♫ <span>Sound on</span>';
  }
  soundToggle.addEventListener("click", () => {
    if (soundEnabled) stopAmbient();
    else startAmbient();
  });

  // Small toast feedback, with a single shared timeout.
  let toastTimer = null;
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // Footer brand is a gentle return-to-top affordance.
  $$(".brand, .back-top").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.scrollY > 100) showToast("Back to the stars ✦");
    });
  });

  // If the tab is hidden, pause canvas work to save battery.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && animationFrame) cancelAnimationFrame(animationFrame);
    else if (!document.hidden && !reduceMotion) drawStars();
  });
})();
