/* =========================================================
   Hadaf — interactions
   - Bootstrap: offcanvas (mobile menu) + accordion (FAQ) → data-bs-* in HTML, no JS needed
   - Swiper: testimonials
   - Custom: marquee, filters, hero video sound, newsletter, reveal
   كل جزء بيشتغل بس لو العنصر بتاعه موجود في الصفحة، فالملف ده ينفع لكل الصفحات.
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: خلفية بعد الـ scroll ---------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Videos: Intro (مرة في اليوم) + Hero ----------
     - المصدر بيتحدد حسب الشاشة: data-src-mobile لحد 768px، غير كده data-src
     - الصوت: بيحاول يشتغل بصوت. المتصفح لو منع → يكمل ميوت، وأول كليك/لمسة/زرار يشغّل الصوت
     - اختيار الزائر للصوت (زرار الصوت) بيتحفظ في localStorage ويتطبق على الفيديوهين */
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const loadSrc = (video) => {
    video.querySelectorAll("source[data-src]").forEach((s) => {
      s.src = (isMobile() && s.dataset.srcMobile) || s.dataset.src;
      s.removeAttribute("data-src");
    });
    video.preload = "auto";
    video.load();
  };
  const soundIcon = (btn, muted) => {
    if (!btn) return;
    btn.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${muted ? "volume-mute-fill" : "volume-up-fill"}"/></svg>`;
    btn.setAttribute("aria-label", muted ? "تشغيل الصوت" : "كتم الصوت");
  };

  // تشغيل بصوت لو مسموح، وإلا ميوت + أول تفاعل يشغّل الصوت
  const unlockEvents = ["pointerdown", "keydown", "touchstart"];
  let pendingUnmute = null;
  const play = (video, btn) => {
    const wantSound = !video.hasAttribute("data-muted") && store.get("hadafSound") !== "off";   // data-muted = فيديو صامت زي الـ GIF
    const fallback = () => {
      video.muted = true;
      video.play().catch(() => {});
      if (!wantSound) return;
      pendingUnmute = (e) => {
        if (e && e.target.closest && e.target.closest(".js-sound")) return; // زرار الصوت ليه الهاندلر بتاعه
        unlockEvents.forEach((ev) => document.removeEventListener(ev, pendingUnmute, true));
        if (!video.paused) { video.muted = false; video.play().catch(() => {}); }
        pendingUnmute = null;
      };
      unlockEvents.forEach((ev) => document.addEventListener(ev, pendingUnmute, true));
    };
    if (!wantSound) return fallback();
    video.muted = false;
    video.play().catch(fallback);
  };
  const bindSound = (video, btn) => {
    if (!btn) return;
    btn.classList.add("js-sound");
    video.addEventListener("volumechange", () => soundIcon(btn, video.muted));
    video.addEventListener("playing", () => soundIcon(btn, video.muted));
    soundIcon(btn, true);
    btn.addEventListener("click", () => {
      if (pendingUnmute) { unlockEvents.forEach((ev) => document.removeEventListener(ev, pendingUnmute, true)); pendingUnmute = null; }
      video.muted = !video.muted;
      store.set("hadafSound", video.muted ? "off" : "on");
      if (!video.muted) video.play().catch(() => {});
    });
  };

  const heroVideo = $("#heroVideo");
  let heroStarted = false;
  const startHero = () => {
    if (!heroVideo || heroStarted) return;
    heroStarted = true;
    loadSrc(heroVideo);
    if (!reduceMotion) play(heroVideo);
  };
  if (heroVideo) bindSound(heroVideo, $("#soundToggle"));

  const intro = $("#intro");
  const introVideo = $("#introVideo");
  const introActive = intro && introVideo && document.documentElement.classList.contains("show-intro");

  if (introActive) {
    const skip = $("#introSkip");
    bindSound(introVideo, $("#introSound"));
    // الفيديو بيبدأ بعد الـ load (لحد كده صورة أول frame ظاهرة) عشان ما يأخرش تحميل الصفحة نفسها
    const startIntro = () => {
      loadSrc(introVideo);
      // الـ error listener بعد ما الـ src يتحط (قبل كده الـ <source> من غير src بيطلّع error)
      introVideo.addEventListener("error", closeIntro, true);
      play(introVideo);
    };
    setTimeout(() => skip?.classList.add("is-visible"), 5000);   // زرار التخطي بيظهر بعد 5 ثواني (زي الموقع الحالي)

    let closed = false;
    const closeIntro = () => {
      if (closed) return;
      closed = true;
      intro.classList.add("is-leaving");
      setTimeout(() => {
        introVideo.pause();
        introVideo.removeAttribute("src");
        introVideo.querySelectorAll("source").forEach((s) => s.removeAttribute("src"));
        introVideo.load();                       // تفضية الذاكرة
        document.documentElement.classList.remove("show-intro");
        intro.remove();
        startHero();
      }, 800);
    };
    introVideo.addEventListener("ended", closeIntro);
    skip?.addEventListener("click", closeIntro);
    if (document.readyState === "complete") startIntro();
    else window.addEventListener("load", startIntro, { once: true });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeIntro(); });
    setTimeout(closeIntro, 45000);               // أمان: لو الفيديو علّق، الانترو يقفل لوحده
    $("#introSound")?.focus({ preventScroll: true });
  } else {
    intro?.remove();
    if (document.readyState === "complete") startHero();
    else window.addEventListener("load", startHero, { once: true });
  }

  /* ---------- Marquee ----------
     <div class="marquee" data-marquee data-speed="45" data-dir="1|-1" data-draggable="false">
     - العناصر مكتوبة في الـ HTML (loop عادي)، والـ JS بيكررها بس عشان الحركة تكمل
     - الهوفر بيبطّأ تدريجيًا لحد ما يقف، والسحب شغال بالماوس واللمس */
  $$("[data-marquee]").forEach((row) => {
    const speed = reduceMotion ? 0 : Number(row.dataset.speed || 40);
    const dir = Number(row.dataset.dir || 1);
    const draggable = row.dataset.draggable !== "false";

    // كرر المحتوى لحد ما يغطي ضعف عرض الشاشة
    const originals = [...row.children];
    const fill = () => {
      let guard = 0;
      while (row.scrollWidth < window.innerWidth * 2 + 200 && guard++ < 20) {
        originals.forEach((el) => {
          const c = el.cloneNode(true);
          c.setAttribute("aria-hidden", "true");
          [c, ...c.querySelectorAll("a, button")].forEach((f) => f.matches("a, button") && f.setAttribute("tabindex", "-1"));
          row.appendChild(c);
        });
      }
      // نسخة كاملة تانية عشان الـ loop يبقى seamless
      [...row.children].slice(0).forEach((el) => {
        const c = el.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        [c, ...c.querySelectorAll("a, button")].forEach((f) => f.matches("a, button") && f.setAttribute("tabindex", "-1"));
        row.appendChild(c);
      });
    };
    fill();

    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    let half = 0, offset = 0, cur = speed, target = speed, last = performance.now();
    let dragging = false, startX = 0, startOffset = 0, moved = 0;
    const measure = () => { half = (row.scrollWidth + gap) / 2; };
    measure();
    const wrap = (v) => (half ? ((v % half) + half) % half : 0);

    // الحركة شغالة بس والصف ظاهر على الشاشة (توفير CPU/بطارية)
    let visible = false, rafId = 0;
    // موبايل: صف الخدمات بيبقى عمودي (CSS) → مفيش حركة
    const stacked = () => getComputedStyle(row).flexDirection === "column";
    const tick = (now) => {
      if (!visible || stacked()) { rafId = 0; return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      cur += (target - cur) * Math.min(dt * 6, 1);   // easing للسرعة
      if (Math.abs(target - cur) < 0.5) cur = target;
      if (!dragging) offset = wrap(offset + cur * dir * dt);
      row.style.transform = `translate3d(${offset}px,0,0)`;
      rafId = requestAnimationFrame(tick);
    };
    const start = () => { if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(tick); } };
    window.addEventListener("resize", () => { measure(); if (visible) start(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: "100px 0px" }).observe(row);
    } else { visible = true; start(); }

    // الهوفر/الفوكس بيوقف الحركة (مطلوب للـ accessibility لأي حركة أطول من 5 ثواني)
    row.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") target = 0; });
    row.addEventListener("pointerleave", () => { if (!dragging) target = speed; });
    row.addEventListener("focusin", () => { target = 0; });
    row.addEventListener("focusout", () => { target = speed; });
    if (!draggable) return;
    row.addEventListener("pointerdown", (e) => {
      dragging = true; moved = 0; startX = e.clientX; startOffset = offset;
    });
    row.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6 && !row.classList.contains("dragging")) {
        row.classList.add("dragging");
        row.setPointerCapture(e.pointerId); // بعد ما السحب يبدأ بس، عشان الكليك على الكارت يفضل شغال
      }
      if (moved > 6) offset = wrap(startOffset + dx);
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      row.classList.remove("dragging");
      if (e.pointerType !== "mouse") target = speed;
    };
    row.addEventListener("pointerup", end);
    row.addEventListener("pointercancel", end);
    row.addEventListener("click", (e) => { if (moved > 6) e.preventDefault(); }, true);
    row.addEventListener("dragstart", (e) => e.preventDefault());
  });

  /* ---------- Filters ----------
     <div class="filters" data-filter-group="#grid"> <button data-filter="cat">
     العناصر: أبناء الـ grid اللي عليهم data-cat */
  $$("[data-filter-group]").forEach((group) => {
    const grid = $(group.dataset.filterGroup);
    if (!grid) return;
    const buttons = $$("[data-filter]", group);
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.filter;
        buttons.forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-pressed", b === btn);
        });
        // وقت الفلترة الكارت المميز بيرجع عادي عشان الـ grid يفضل منتظم
        grid.classList.toggle("is-filtered", f !== "all");
        $$(":scope > [data-cat]", grid).forEach((item) => {
          item.classList.toggle("d-none", f !== "all" && item.dataset.cat !== f);
        });
      });
    });
  });

  /* ---------- Testimonials (Swiper) ---------- */
  if (window.Swiper && $(".t-swiper")) {
    new Swiper(".t-swiper", {
      loop: true,
      centeredSlides: true,
      slidesPerView: 1,
      speed: 700,
      grabCursor: true,
      slideToClickedSlide: true,
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { prevSlideMessage: "الرأي السابق", nextSlideMessage: "الرأي التالي", paginationBulletMessage: "اذهب للرأي {{index}}" },
      autoplay: reduceMotion ? false : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: ".t-dots", clickable: true },
      effect: "creative",
      creativeEffect: {
        limitProgress: 1,
        prev: { translate: ["-112%", "4%", 0], rotate: [0, 0, -20], opacity: 1 },
        next: { translate: ["112%", "4%", 0], rotate: [0, 0, 20], opacity: 1 },
      },
      breakpoints: {
        0: { creativeEffect: { limitProgress: 1, prev: { translate: ["-105%", 0, 0], opacity: 1 }, next: { translate: ["105%", 0, 0], opacity: 1 } } },
        992: {},
      },
    });
  }

  /* ---------- Newsletter ---------- */
  const nl = $("#newsletter");
  nl?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("input[type=email]", nl);
    const msg = $(".msg", nl);
    if (!input.checkValidity()) {
      msg.textContent = "اكتب بريد إلكتروني صحيح، مثال: name@example.com";
      input.focus();
      return;
    }
    // TODO(backend): ابعت الإيميل للـ API هنا
    msg.textContent = "تم الاشتراك، شكرًا لك.";
    nl.reset();
  });

  /* ---------- Contact form (Bootstrap validation) ---------- */
  const cf = $("#contactForm");
  cf?.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = $(".form-msg", cf);
    if (!cf.checkValidity()) {
      cf.classList.add("was-validated");
      $(":invalid", cf)?.focus();
      msg.textContent = "";
      return;
    }
    // TODO(backend): ابعت البيانات للـ API هنا
    cf.classList.remove("was-validated");
    msg.textContent = "تم إرسال رسالتك، هنتواصل معاك قريب.";
    cf.reset();
  });

  /* ---------- Blog: جدول المحتويات من عناوين h2 ---------- */
  $$("[data-toc]").forEach((toc) => {
    const body = $(toc.dataset.toc);
    const list = $("ol", toc);
    if (!body || !list) return;
    const heads = $$("h2", body);
    heads.forEach((h, i) => {
      h.id ||= `section-${i + 1}`;
      const li = document.createElement("li");
      li.innerHTML = `<a href="#${h.id}"></a>`;
      li.firstChild.textContent = h.textContent;
      list.appendChild(li);
    });
    const links = $$("a", list);
    if (!("IntersectionObserver" in window)) return;
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.hash === `#${e.target.id}`));
    }), { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach((h) => spy.observe(h));
  });

  /* ---------- Share / copy link ---------- */
  const shareMsg = $("[data-share-msg]");
  $("[data-share]")?.addEventListener("click", async () => {
    if (navigator.share) { try { await navigator.share({ title: document.title, url: location.href }); } catch (e) {} }
    else $("[data-copy-link]")?.click();
  });
  $("[data-copy-link]")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); if (shareMsg) shareMsg.textContent = "تم نسخ الرابط"; } catch (e) {}
  });

  /* ---------- Fancybox: معرض الصور + صور آراء العملاء (صفحة تفاصيل المشروع) ----------
     أي لينك عليه data-fancybox="اسم" بيفتح في المعرض، واللينكات اللي ليها نفس الاسم بتتقلب مع بعض */
  if (window.Fancybox && $("[data-fancybox]")) {
    Fancybox.bind("[data-fancybox]", {
      Hash: false,
      Images: { zoom: true },
      Thumbs: { type: "classic" },
      Toolbar: { display: { left: ["infobar"], middle: [], right: ["zoomIn", "slideshow", "fullscreen", "thumbs", "close"] } },
      l10n: {
        CLOSE: "إغلاق", NEXT: "التالي", PREV: "السابق", MODAL: "يمكنك إغلاق النافذة بمفتاح Esc",
        ERROR: "حدث خطأ، حاول مرة أخرى", IMAGE_ERROR: "تعذر تحميل الصورة", ELEMENT_NOT_FOUND: "العنصر غير موجود",
        TOGGLE_ZOOM: "تكبير", TOGGLE_THUMBS: "الصور المصغرة", TOGGLE_SLIDESHOW: "عرض تلقائي",
        TOGGLE_FULLSCREEN: "ملء الشاشة", ZOOMIN: "تكبير", ZOOMOUT: "تصغير", DOWNLOAD: "تحميل", ITERATEZOOM: "تكبير",
      },
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  }
});
