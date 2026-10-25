/* Project Ibadur Rahman — page behaviour */
(() => {
  // ---------------------------------------------------------------
  // CONFIG — edit these values only
  // donateUrl:   your checkout link (LaunchGood, Stripe, Iqraa, etc.).
  //              While empty, every Donate button scrolls to the giving section.
  // amountParam: query parameter used to pre-fill the amount (set "" to disable).
  // goal:        fundraising goal in USD (used for the progress bars and % maths).
  // progressUrl: JSON file or API returning {"raised": 12345, "donors": 67}.
  //              Edit data/progress.json to update every progress bar on the page.
  // raised:      fallback amount if progressUrl can't be reached.
  // ramadan:     first night of Ramadan (first Taraweeh), Syria time UTC+3.
  // heroVideo:   the film in the hero card. src = an .mp4 path OR a YouTube / Vimeo link.
  // ---------------------------------------------------------------
  const CONFIG = {
    donateUrl: "",
    amountParam: "amount",
    goal: 124000,
    progressUrl: "data/progress.json",
    raised: 0,
    ramadan: "2027-02-07T18:00:00+03:00",
    heroVideo: {
      src: "assets/video/film.mp4",
      poster: "assets/img/mihrab-sm.webp",
      label: "Watch the film",
      length: "0:39",
    },
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) document.documentElement.classList.add("reduce");
  const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");

  // ---------- header ----------
  const header = $(".site-header");
  const onScrollHeader = () => header.classList.toggle("is-solid", window.scrollY > 40);
  onScrollHeader();

  // ---------- donation progress ----------
  // Portable: every [data-progress-bar] reads from one source, in this order:
  //   1. window.IBADUR_PROGRESS = {raised, donors}  (e.g. printed by a CMS / WordPress)
  //   2. CONFIG.progressUrl  (JSON, refreshed every 60 s)
  //   3. CONFIG.raised
  const bars = $$("[data-progress-bar]");
  const paintProgress = ({ raised = 0, donors = 0, goal = CONFIG.goal } = {}) => {
    raised = Math.max(0, Number(raised) || 0);
    goal = Number(goal) || CONFIG.goal;
    const pct = (raised / goal) * 100;
    const shown = raised > 0 ? Math.max(pct, 1.5) : 0;
    const pctText = pct >= 10 || pct === 0 ? Math.floor(pct) + "%" : pct.toFixed(1) + "%";
    bars.forEach((bar) => {
      const fill = $("[data-fill]", bar);
      if (fill) fill.style.width = Math.min(100, shown) + "%";
      const pb = $("[role=progressbar]", bar);
      if (pb) pb.setAttribute("aria-valuenow", Math.min(100, Math.floor(pct)));
      $$("[data-raised-text]", bar).forEach((e) => (e.textContent = fmt(raised)));
      $$("[data-pct-text]", bar).forEach((e) => (e.textContent = pctText));
      const dn = $("[data-donors-text]", bar);
      if (dn) {
        dn.hidden = !(donors > 0);
        dn.textContent = Number(donors).toLocaleString("en-US") + (donors == 1 ? " donor" : " donors");
      }
    });
  };
  const loadProgress = async () => {
    if (window.IBADUR_PROGRESS) return paintProgress(window.IBADUR_PROGRESS);
    if (CONFIG.progressUrl) {
      try {
        const u = CONFIG.progressUrl + (CONFIG.progressUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok) return paintProgress(await r.json());
      } catch (e) {}
    }
    paintProgress({ raised: CONFIG.raised });
  };
  if (bars.length) {
    paintProgress({ raised: CONFIG.raised });
    setTimeout(loadProgress, 300);
    setInterval(loadProgress, 60000);
  }

  // ---------- hero film (pop-up player) ----------
  const hf = $("[data-hero-film]");
  const vm = $("[data-vmodal]");
  const vmFrame = $("[data-vmodal-frame]");
  const embedFor = (src) => {
    const yt = src.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/);
    if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
    const vi = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1&title=0&byline=0&portrait=0`;
    return null;
  };
  let vmLast = null;
  const closeVideo = () => {
    vm.classList.remove("open");
    vmFrame.innerHTML = "";
    vmFrame.style.aspectRatio = "";
    document.body.style.overflow = "";
    vmLast?.focus();
  };
  const openVideo = () => {
    const v = CONFIG.heroVideo;
    vmLast = document.activeElement;
    const embed = embedFor(v.src);
    if (embed) {
      vmFrame.innerHTML = `<iframe src="${embed}" title="${v.label}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
    } else {
      const vid = document.createElement("video");
      Object.assign(vid, { src: v.src, controls: true, autoplay: true, playsInline: true });
      vid.addEventListener("loadedmetadata", () => {
        if (vid.videoWidth) vmFrame.style.aspectRatio = `${vid.videoWidth} / ${vid.videoHeight}`;
      });
      vmFrame.appendChild(vid);
      vid.play().catch(() => {});
    }
    vm.classList.add("open");
    document.body.style.overflow = "hidden";
    $("[data-vmodal-close]").focus();
  };
  if (hf && vm) {
    const v = CONFIG.heroVideo;
    $("[data-hero-film-poster]", hf).src = v.poster;
    $("[data-hero-film-label]", hf).textContent = v.label;
    const len = $("[data-hero-film-len]", hf);
    len.textContent = v.length || "";
    hf.setAttribute("aria-label", "Play: " + v.label);
    hf.addEventListener("click", openVideo);
    $("[data-vmodal-close]").addEventListener("click", closeVideo);
    vm.addEventListener("click", (e) => { if (e.target === vm) closeVideo(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && vm.classList.contains("open")) closeVideo(); });
  }

  // ---------- countdown ----------
  const target = new Date(CONFIG.ramadan).getTime();
  const cd = $("[data-countdown]");
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5);
    const h = Math.floor((diff % 864e5) / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    const s = Math.floor((diff % 6e4) / 1e3);
    if (cd) {
      $("[data-d]", cd).textContent = d;
      $("[data-h]", cd).textContent = pad(h);
      $("[data-m]", cd).textContent = pad(m);
      $("[data-s]", cd).textContent = pad(s);
    }
    $$("[data-days-left]").forEach((el) => (el.textContent = d));
    const mb = $("[data-mbar-days]");
    if (mb) mb.textContent = d + " days to Ramadan";
  };
  tick();
  setInterval(tick, 1000);

  // ---------- donate routing ----------
  const checkoutUrl = (amt) => {
    if (!CONFIG.donateUrl) return null;
    if (!amt || !CONFIG.amountParam) return CONFIG.donateUrl;
    const u = new URL(CONFIG.donateUrl);
    u.searchParams.set(CONFIG.amountParam, amt);
    return u.toString();
  };
  if (CONFIG.donateUrl) {
    $$("[data-donate]").forEach((a) => {
      a.href = CONFIG.donateUrl;
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  // ---------- giving widget ----------
  const tiers = $$(".tier[data-amt]");
  const custom = $("#customAmt");
  const sumAmt = $("[data-sum-amt]");
  const sumName = $("[data-sum-name]");
  const sumPct = $("[data-sum-pct]");
  const note = $("[data-note]");
  let amount = 1000;

  const render = (name) => {
    sumAmt.textContent = amount > 0 ? fmt(amount) : "$0";
    sumName.textContent = name || "";
    const pct = (amount / CONFIG.goal) * 100;
    sumPct.textContent = (pct >= 10 ? pct.toFixed(0) : pct >= 1 ? pct.toFixed(1) : pct.toFixed(2)) + "%";
  };
  tiers.forEach((t) =>
    t.addEventListener("click", () => {
      tiers.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
      amount = Number(t.dataset.amt);
      custom.value = "";
      render(t.dataset.name);
      if (window.matchMedia("(max-width: 980px)").matches) {
        $(".checkout").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
    })
  );
  custom.addEventListener("input", () => {
    const v = Math.max(0, Math.floor(Number(custom.value) || 0));
    if (v > 0) {
      tiers.forEach((x) => x.setAttribute("aria-pressed", "false"));
      amount = v;
      const match = [...tiers].reverse().find((t) => v >= Number(t.dataset.amt));
      render(match ? match.dataset.name : "");
    }
  });
  $("[data-checkout]").addEventListener("click", (e) => {
    const url = checkoutUrl(amount);
    if (url) {
      e.preventDefault();
      window.open(url, "_blank", "noopener");
    } else {
      e.preventDefault();
      note.classList.add("show");
    }
  });
  render("The First Saf");

  // ---------- reveal ----------
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  $$(".rv, [data-road]").forEach((el) => io.observe(el));

  // ---------- count up ----------
  const countIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        countIO.unobserve(el);
        const to = parseFloat(el.dataset.count);
        const dec = Number(el.dataset.dec || 0);
        const show = (v) => (el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US"));
        if (reduce) return show(to);
        const dur = 1800;
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          show(to * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { threshold: 0.5 }
  );
  $$("[data-count]").forEach((el) => countIO.observe(el));

  // ---------- donut ----------
  const donut = $("[data-donut]");
  if (donut) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        $$(".seg", donut).forEach((s) => (s.style.strokeDashoffset = "0"));
        obs.disconnect();
      }
    }, { threshold: 0.4 }).observe(donut);
  }

  // ---------- word scrub ----------
  const scrub = $("[data-scrub]");
  let words = [];
  if (scrub) {
    const build = (node, gold) => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach((c) => {
        if (c.nodeType === 3) {
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
            const s = document.createElement("span");
            s.className = "w" + (gold ? " gold" : "");
            s.textContent = part;
            frag.appendChild(s);
          });
        } else {
          frag.appendChild(build(c, gold || c.hasAttribute?.("data-gold")));
        }
      });
      return frag;
    };
    const frag = build(scrub, false);
    scrub.textContent = "";
    scrub.appendChild(frag);
    words = $$(".w", scrub);
  }
  const updateScrub = () => {
    if (!words.length) return;
    if (reduce) return words.forEach((w) => w.classList.add("on"));
    const r = scrub.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.4)));
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < n));
  };

  // ---------- parallax band ----------
  const par = $("[data-parallax]");
  const updatePar = () => {
    if (!par || reduce) return;
    const r = par.parentElement.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = (vh - r.top) / (vh + r.height);
    par.style.transform = `translate3d(0, ${(-p * 16).toFixed(2)}%, 0)`;
  };

  // ---------- mobile bar ----------
  const mbar = $("[data-mbar]");
  const hero = $(".hero");
  const give = $("#give");
  const updateBar = () => {
    if (!mbar) return;
    const past = hero.getBoundingClientRect().bottom < 0;
    const gr = give.getBoundingClientRect();
    const inGive = gr.top < window.innerHeight && gr.bottom > 0;
    mbar.classList.toggle("show", past && !inGive);
    document.body.classList.toggle("mbar-on", past && !inGive);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      updateScrub();
      updatePar();
      updateBar();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---------- film ----------
  const film = $("#filmVideo");
  const filmWrap = $(".film");
  $(".film__play").addEventListener("click", () => {
    filmWrap.classList.add("playing");
    film.controls = true;
    film.play().catch(() => {});
  });
  film.addEventListener("ended", () => filmWrap.classList.remove("playing"));

  // ---------- stars ----------
  const stars = $("[data-stars]");
  if (stars) {
    for (let i = 0; i < 70; i++) {
      const s = document.createElement("i");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 70 + "%";
      s.style.opacity = (0.2 + Math.random() * 0.7).toFixed(2);
      s.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
      if (Math.random() > 0.85) s.style.width = s.style.height = "3px";
      stars.appendChild(s);
    }
  }

  // ---------- lightbox ----------
  const lb = $("[data-lightbox]");
  const lbImg = $("[data-lb-img]");
  const shots = $$("[data-gallery] button");
  let idx = 0;
  let lastFocus = null;
  const show = (i) => {
    idx = (i + shots.length) % shots.length;
    const b = shots[idx];
    lbImg.src = b.dataset.full;
    lbImg.alt = $("img", b).alt;
    $("[data-lb-count]").textContent = `${idx + 1} / ${shots.length}`;
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    $("[data-lb-close]").focus();
  };
  const close = () => {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    lastFocus?.focus();
  };
  shots.forEach((b, i) => b.addEventListener("click", () => open(i)));
  $("[data-lb-close]").addEventListener("click", close);
  $("[data-lb-prev]").addEventListener("click", () => show(idx - 1));
  $("[data-lb-next]").addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
  let tx = 0;
  lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });

  // ---------- misc ----------
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
