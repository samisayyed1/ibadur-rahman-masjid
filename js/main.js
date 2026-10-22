/* Project Ibadur Rahman — page behaviour */
(() => {
  // ---------------------------------------------------------------
  // CONFIG — edit these values only
  // donateUrl:   your checkout link (LaunchGood, Stripe, Iqraa, etc.).
  //              While empty, every Donate button scrolls to the giving section.
  // amountParam: query parameter used to pre-fill the amount (set "" to disable).
  // raised:      amount raised so far in USD (null hides the progress bar).
  // ramadan:     first night of Ramadan (first Taraweeh), Syria time UTC+3.
  // ---------------------------------------------------------------
  const CONFIG = {
    donateUrl: "",
    amountParam: "amount",
    goal: 104000,
    raised: null,
    ramadan: "2027-02-07T18:00:00+03:00",
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

  // ---------- progress ----------
  if (typeof CONFIG.raised === "number") {
    const box = $("[data-progress]");
    const pct = Math.min(100, (CONFIG.raised / CONFIG.goal) * 100);
    box.hidden = false;
    $("[data-raised]", box).textContent = fmt(CONFIG.raised) + " raised";
    $("[data-pct]", box).textContent = pct.toFixed(0) + "%";
    requestAnimationFrame(() => setTimeout(() => ($(".progress__fill", box).style.width = pct + "%"), 400));
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
