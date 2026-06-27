// =====================================================
// LOADER & MUSIC TRIGGER
// =====================================================
(function () {
  const loader = document.getElementById("loader");
  const video  = document.getElementById("loaderVideo");
  if (!loader) return;

  let isClicked    = false;
  let videoDuration = 4500;

  if (video) {
    video.addEventListener("loadedmetadata", () => {
      if (video.duration && !isNaN(video.duration))
        videoDuration = video.duration * 1000;
    });
  }

  function setLoaded() { loader.classList.add("loaded"); }
  if (document.readyState === "complete") setLoaded();
  else window.addEventListener("load", setLoaded);

  loader.addEventListener("click", () => {
    if (!loader.classList.contains("loaded") || isClicked) return;
    isClicked = true;
    loader.classList.add("clicked");

    const musicBtn = document.getElementById("musicBtn");
    if (musicBtn) musicBtn.click();

    if (video) {
      video.play().catch(() => completeLoader());
      let done = false;
      function completeLoader() {
        if (done) return;
        done = true;
        loader.classList.add("done");
      }
      video.addEventListener("ended", completeLoader);
      setTimeout(completeLoader, videoDuration + 800);
    } else {
      loader.classList.add("done");
    }
  });
})();

// =====================================================
// HERO PARALLAX  (mobile-safe — no CSS fixed)
// =====================================================
(function () {
  const heroBg = document.getElementById("heroBg");
  const hero   = document.getElementById("hero");
  if (!heroBg || !hero) return;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.pageYOffset || document.documentElement.scrollTop;
      if (y < hero.offsetHeight * 1.2)
        heroBg.style.transform = `translateY(${y * 0.35}px)`;
      ticking = false;
    });
  }, { passive: true });
})();

// =====================================================
// PARTICLES
// =====================================================
(function () {
  const c = document.getElementById("particles");
  if (!c) return;
  const count = window.innerWidth < 640 ? 14 : 24;
  for (let i = 0; i < count; i++) {
    const s    = document.createElement("span");
    const size = Math.random() * 3.5 + 1.5;
    s.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `top:${Math.random() * 100}%`,
      `left:${Math.random() * 100}%`,
      `animation-delay:${Math.random() * 12}s`,
      `animation-duration:${16 + Math.random() * 14}s`,
      `opacity:${(Math.random() * 0.4 + 0.15).toFixed(2)}`
    ].join(";");
    c.appendChild(s);
  }
})();

// =====================================================
// COUNTDOWN  (Arabic digits + bump on tick)
// =====================================================
(function () {
  const target = new Date("2026-12-16T18:00:00").getTime();
  const dEl = document.querySelector("[data-d]");
  const hEl = document.querySelector("[data-h]");
  const mEl = document.querySelector("[data-m]");
  const sEl = document.querySelector("[data-s]");
  if (!dEl) return;

  const AR = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  function toAr(n) {
    return String(n).padStart(2, "0").split("").map(d => AR[+d]).join("");
  }
  function bump(el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
    setTimeout(() => el.classList.remove("bump"), 300);
  }

  let prevS = -1;
  function tick() {
    const diff = Math.max(0, target - Date.now());
    dEl.textContent = toAr(Math.floor(diff / 86400000));
    hEl.textContent = toAr(Math.floor(diff / 3600000) % 24);
    mEl.textContent = toAr(Math.floor(diff / 60000)   % 60);
    const s = Math.floor(diff / 1000) % 60;
    if (s !== prevS) {
      sEl.textContent = toAr(s);
      bump(sEl);
      if (s === 59) bump(mEl);
      if (s === 59 && Math.floor(diff / 60000) % 60 === 59) bump(hEl);
      prevS = s;
    }
  }
  tick();
  setInterval(tick, 1000);
})();

// =====================================================
// MUSIC TOGGLE
// =====================================================
(function () {
  const btn   = document.getElementById("musicBtn");
  const audio = document.getElementById("bgAudio");
  const ip    = document.getElementById("iconPlay");
  const ipa   = document.getElementById("iconPause");
  if (!btn || !audio) return;

  let playing = false;
  audio.volume = 0.35;

  btn.addEventListener("click", () => {
    if (playing) {
      audio.pause();
      btn.classList.remove("playing");
      ip.style.display  = "block";
      ipa.style.display = "none";
      playing = false;
    } else {
      audio.play().catch(() => {});
      btn.classList.add("playing");
      ip.style.display  = "none";
      ipa.style.display = "block";
      playing = true;
    }
  });
})();

// =====================================================
// REVEAL ON SCROLL  (multiple variants)
// =====================================================
(function () {
  const els = document.querySelectorAll(
    ".reveal, .reveal-scale, .reveal-left, .reveal-right"
  );
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("in"), 80);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  els.forEach(el => io.observe(el));
})();

// =====================================================
// GALLERY SLIDER  (touch + drag + auto-play + dots)
// =====================================================
(function () {
  const wrap     = document.getElementById("gallerySlider");
  const track    = document.getElementById("galleryTrack");
  const dotsWrap = document.getElementById("sliderDots");
  const prevBtn  = document.getElementById("sliderPrev");
  const nextBtn  = document.getElementById("sliderNext");
  if (!wrap || !track) return;

  const slides = Array.from(track.querySelectorAll(".gallery-slide"));
  const n      = slides.length;
  let current  = 0;
  let autoTimer;

  // Build dots
  const dots = slides.map((_, i) => {
    const d = document.createElement("button");
    d.className = "slider-dot";
    d.setAttribute("aria-label", `صورة ${i + 1}`);
    d.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(d);
    return d;
  });

  // Total width of one slide slot (offsetWidth ignores CSS margins)
  function slotWidth() {
    const s  = slides[0];
    const cs = window.getComputedStyle(s);
    return s.offsetWidth
      + parseFloat(cs.marginLeft  || 0)
      + parseFloat(cs.marginRight || 0);
  }

  function goTo(index) {
    current = ((index % n) + n) % n;

    slides.forEach((s, i) => s.classList.toggle("active", i === current));
    dots.forEach((d, i)   => d.classList.toggle("active", i === current));

    // Center the active slide in the viewport
    const sw    = slotWidth();
    const ww    = wrap.offsetWidth;
    const cw    = slides[current].offsetWidth;
    const offset = (ww / 2) - (cw / 2) - (current * sw);
    track.style.transform = `translateX(${offset}px)`;
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  if (prevBtn) prevBtn.addEventListener("click", () => { prev(); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { next(); resetAuto(); });

  // ── Touch swipe ──────────────────────────────────────
  let tx0 = 0, ty0 = 0, swiping = false;

  wrap.addEventListener("touchstart", e => {
    tx0 = e.touches[0].clientX;
    ty0 = e.touches[0].clientY;
    swiping = true;
    clearInterval(autoTimer);
  }, { passive: true });

  wrap.addEventListener("touchend", e => {
    if (!swiping) return;
    swiping = false;
    const dx = tx0 - e.changedTouches[0].clientX;
    const dy = Math.abs(ty0 - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy)
      dx > 0 ? next() : prev();
    resetAuto();
  });

  // ── Mouse drag (desktop) ─────────────────────────────
  let mx0 = 0, dragging = false, moved = false;

  wrap.addEventListener("mousedown", e => {
    mx0 = e.clientX; dragging = true; moved = false;
    clearInterval(autoTimer);
  });
  window.addEventListener("mousemove", e => {
    if (dragging && Math.abs(e.clientX - mx0) > 6) moved = true;
  });
  window.addEventListener("mouseup", e => {
    if (!dragging) return;
    dragging = false;
    if (moved) {
      const dx = mx0 - e.clientX;
      if (Math.abs(dx) > 40) dx > 0 ? next() : prev();
    }
    moved = false;
    resetAuto();
  });

  // ── Keyboard ─────────────────────────────────────────
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft")  next(); // RTL: ← = forward
    if (e.key === "ArrowRight") prev(); // RTL: → = backward
  });

  // ── Auto-play ─────────────────────────────────────────
  function startAuto() { autoTimer = setInterval(next, 4500); }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }

  // ── Init ─────────────────────────────────────────────
  requestAnimationFrame(() => requestAnimationFrame(() => goTo(0)));
  startAuto();

  // Re-center on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => goTo(current), 200);
  }, { passive: true });
})();

// =====================================================
// CUSTOM CURSOR  (desktop only)
// =====================================================
(function () {
  if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  document.body.classList.add("cursor-on");

  const dot  = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;

  let mx = 0, my = 0, dx = 0, dy = 0, rx = 0, ry = 0;

  window.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });

  (function frame() {
    dx += (mx - dx) * 0.22;
    dy += (my - dy) * 0.22;
    rx += (mx - rx) * 0.10;
    ry += (my - ry) * 0.10;
    dot.style.transform  = `translate(${dx - 3.5}px, ${dy - 3.5}px)`;
    ring.style.transform = `translate(${rx - 18}px,  ${ry - 18}px)`;
    requestAnimationFrame(frame);
  })();
})();

// =====================================================
// RSVP FORM
// =====================================================
(function () {
  const form    = document.getElementById("rsvpForm");
  const success = document.getElementById("rsvpSuccess");
  const submit  = document.getElementById("rsvpSubmit");
  const nameEl  = document.getElementById("rsvpName");
  const msgEl   = document.getElementById("rsvpMsg");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = nameEl.value.trim();
    const msg  = msgEl.value.trim();

    // Simple client-side validation
    if (!name) {
      nameEl.focus();
      shake(nameEl.parentElement);
      return;
    }
    if (!msg) {
      msgEl.focus();
      shake(msgEl.parentElement);
      return;
    }

    // Disable button during "send"
    submit.disabled = true;
    submit.querySelector(".rsvp-submit-text").textContent = "جارٍ الإرسال…";

    // Simulate async send (replace with real fetch() when backend is ready)
    setTimeout(() => {
      // Swap form → success
      form.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      form.style.opacity    = "0";
      form.style.transform  = "translateY(12px)";

      setTimeout(() => {
        form.hidden = true;

        // Personalise success message with name
        const titleEl = success.querySelector(".rsvp-success-title");
        if (titleEl) titleEl.textContent = `وصلتنا رسالتك، ${name} 🌹`;

        success.hidden = false;
        success.removeAttribute("hidden");
      }, 380);
    }, 900);
  });

  // Shake helper for invalid fields
  function shake(el) {
    el.classList.remove("shake");
    void el.offsetWidth; // reflow
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 500);
  }
})();
