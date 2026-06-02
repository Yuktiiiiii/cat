const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function safeUrl(path) {
  // Handles spaces and other characters in file names.
  return encodeURI(path);
}

function setPressed(el, pressed) {
  el.setAttribute("aria-pressed", pressed ? "true" : "false");
}

const STORE_KEY = "kutchuQuest.v1";
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { treats: 0, done: {}, badges: {} };
    const parsed = JSON.parse(raw);
    return {
      treats: Number(parsed.treats ?? 0) || 0,
      done: typeof parsed.done === "object" && parsed.done ? parsed.done : {},
      badges: typeof parsed.badges === "object" && parsed.badges ? parsed.badges : {}
    };
  } catch {
    return { treats: 0, done: {}, badges: {} };
  }
}
function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function toast(msg) {
  const root = $("#toast");
  if (!root) return;
  root.innerHTML = `<div role="status">${msg}</div>`;
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => (root.innerHTML = ""), 1800);
}

function burstConfetti() {
  const root = $("#confetti");
  if (!root) return;
  root.innerHTML = "";
  const colors = [
    "rgba(255,214,214,.95)",
    "rgba(204,243,230,.95)",
    "rgba(231,215,255,.95)",
    "rgba(207,231,255,.95)",
    "rgba(255,242,194,.95)"
  ];
  const n = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 30;
  for (let i = 0; i < n; i++) {
    const el = document.createElement("i");
    el.style.left = `${Math.random() * 100}%`;
    el.style.background = colors[i % colors.length];
    el.style.animationDuration = `${700 + Math.random() * 700}ms`;
    el.style.transform = `translateY(0px) rotate(${Math.random() * 160}deg)`;
    root.appendChild(el);
  }
  window.setTimeout(() => (root.innerHTML = ""), 1600);
}

function openLightbox(state, idx) {
  const lb = $("#lightbox");
  const img = $("#lightboxImg");
  const cap = $("#lightboxCaption");

  const item = state.filtered[idx];
  state.activeIndex = idx;

  img.src = safeUrl("./" + item.src);
  img.alt = item.caption || "Kutchu photo";
  cap.textContent = item.caption || "";

  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("#nextBtn").focus();
}

function closeLightbox() {
  const lb = $("#lightbox");
  lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function showNext(state, dir) {
  if (!state.filtered.length) return;
  const next = (state.activeIndex + dir + state.filtered.length) % state.filtered.length;
  openLightbox(state, next);
}

function readEmbeddedData() {
  const tag = $("#kutchuData");
  if (!tag) return null;
  const txt = tag.textContent || "";
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function openModal(id) {
  const el = $(id);
  if (!el) return;
  el.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(el) {
  if (!el) return;
  el.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function computeProgress(store) {
  const keys = [
    "visited_story",
    "visited_facts",
    "visited_favorites",
    "visited_gallery",
    "played_hide_seek"
  ];
  const done = keys.filter((k) => store.done[k]).length;
  return Math.round((done / keys.length) * 100);
}

function renderHud(store) {
  const treats = $("#treatCount");
  if (treats) treats.textContent = String(store.treats);

  const p = computeProgress(store);
  const txt = $("#progressText");
  if (txt) txt.textContent = `${p}%`;
  const bar = $("#hudBarFill");
  if (bar) bar.style.width = `${p}%`;
  const pb = $(".hud-bar");
  if (pb) pb.setAttribute("aria-valuenow", String(p));
}

function renderQuest(store) {
  const list = $("#questList");
  if (!list) return;
  const items = [
    ["visited_story", "Visit Story"],
    ["visited_facts", "Visit Facts"],
    ["visited_favorites", "Visit Favorites"],
    ["visited_gallery", "Visit Gallery"],
    ["played_hide_seek", "Win Hide & Seek"]
  ];
  list.innerHTML = items
    .map(([key, label]) => {
      const done = Boolean(store.done[key]);
      return `<li class="quest-item" data-done="${done ? "true" : "false"}"><span>${done ? "✅" : "⬜"} ${label}</span><small>${done ? "Done" : "Not yet"}</small></li>`;
    })
    .join("");

  $$(".map-node").forEach((a) => {
    const key = a.dataset.quest;
    if (!key) return;
    a.dataset.done = store.done[key] ? "true" : "false";
  });

  const shelf = $("#badgeShelf");
  if (shelf) {
    const badges = [];
    if (store.badges.finder) badges.push({ ico: "🏅", label: "Kutchu Finder" });
    if (store.badges.treats10) badges.push({ ico: "🍪", label: "Snack Bringer" });
    shelf.innerHTML = badges.length
      ? badges.map((b) => `<span class="badge"><span aria-hidden="true">${b.ico}</span>${b.label}</span>`).join("")
      : `<span class="badge"><span aria-hidden="true">🧷</span>No badges yet</span>`;
  }
}

function markDone(store, key, msg) {
  if (store.done[key]) return false;
  store.done[key] = true;
  saveStore(store);
  renderHud(store);
  renderQuest(store);
  if (msg) toast(msg);
  return true;
}

function pickGameCards(allItems, count) {
  const arr = allItems.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}

function playHideAndSeek(store, allItems) {
  // Make a tiny "guess the hiding spot" game using existing gallery photos.
  const options = pickGameCards(allItems, 9);
  if (options.length < 3) {
    toast("Need more photos to play!");
    return;
  }
  const hidingIdx = Math.floor(Math.random() * options.length);
  const hiding = options[hidingIdx];

  const msg =
    "Find Kutchu! Click the correct number:\n" +
    options.map((x, i) => `${i + 1}) ${x.caption || x.src}`).join("\n") +
    "\n\nTip: choose the most 'hide & seek' vibe.";

  const ans = window.prompt(msg);
  if (ans == null) return;
  const n = Number(ans.trim());
  if (!Number.isFinite(n) || n < 1 || n > options.length) {
    toast("Pick a valid number next time.");
    return;
  }
  const picked = options[n - 1];
  if (picked === hiding) {
    toast("You found Kutchu! +3 treats");
    store.treats += 3;
    store.done.played_hide_seek = true;
    store.badges.finder = true;
    saveStore(store);
    renderHud(store);
    renderQuest(store);
    burstConfetti();
  } else {
    toast("Nope — Kutchu escaped. +1 treat for trying!");
    store.treats += 1;
    saveStore(store);
    renderHud(store);
    if (store.treats >= 10 && !store.badges.treats10) {
      store.badges.treats10 = true;
      saveStore(store);
      renderQuest(store);
      burstConfetti();
      toast("Badge unlocked: Snack Bringer!");
    }
  }
}

async function init() {
  const data = readEmbeddedData();
  if (!data) throw new Error("Missing embedded Kutchu data.");

  const store = loadStore();
  renderHud(store);
  renderQuest(store);

  // Hero
  const heroImg = $("#heroImage");
  const heroCap = $("#heroCaption");
  if (data.hero?.src) heroImg.src = safeUrl("./" + data.hero.src);
  if (data.hero?.caption) heroCap.textContent = data.hero.caption;

  // Facts
  const factsList = $("#factsList");
  const facts = [
    ["Name", data.name],
    ["Location", data.location],
    ["Species", data.species],
    ["Coat", data.coat],
    ["Eye color", data.eyeColor]
  ].filter(([, v]) => Boolean(v));

  factsList.innerHTML = facts
    .map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`)
    .join("");

  $("#mottoText").textContent = data.motto || "Hide first. Investigate later. Trust Beeg. Repeat.";

  // Traits
  const traits = Array.isArray(data.personality) ? data.personality : [];
  const traitEmoji = {
    Curious: "🔎",
    Playful: "🧶",
    Cautious: "👀",
    Affectionate: "💛",
    Intelligent: "🧠"
  };
  $("#traitsChips").innerHTML = traits
    .map((t) => `<span class="chip"><i aria-hidden="true">${traitEmoji[t] ?? "✨"}</i>${t}</span>`)
    .join("");

  // Loves / Dislikes / Day
  const loves = Array.isArray(data.loves) ? data.loves : [];
  const dislikes = Array.isArray(data.dislikes) ? data.dislikes : [];
  const day = Array.isArray(data.dayInLife) ? data.dayInLife : [];

  $("#lovesList").innerHTML = loves.map((x) => `<li>${x}</li>`).join("");
  $("#nopeList").innerHTML = dislikes.map((x) => `<li>${x}</li>`).join("");
  $("#dayList").innerHTML = day.map((x) => `<li>${x}</li>`).join("");

  // Gallery
  const allItems = Array.isArray(data.gallery) ? data.gallery : [];
  const state = {
    all: allItems,
    filter: "all",
    filtered: allItems,
    activeIndex: 0
  };

  const grid = $("#galleryGrid");
  const render = () => {
    state.filtered = state.filter === "all"
      ? state.all
      : state.all.filter((x) => (x.tags || []).includes(state.filter));

    grid.innerHTML = state.filtered
      .map((item, idx) => {
        const src = safeUrl("./" + item.src);
        const caption = item.caption || "Kutchu";
        return `
          <button class="tile" type="button" data-idx="${idx}" aria-label="Open photo: ${caption}">
            <img src="${src}" alt="${caption}" loading="lazy" decoding="async" />
            <span class="tile-cap">${caption}</span>
          </button>
        `;
      })
      .join("");
  };

  render();

  // Quest modal
  $("#questBtn")?.addEventListener("click", () => {
    openModal("#questModal");
    renderQuest(store);
    toast("Quest opened. Pick a room on the map!");
  });
  $("#questModal")?.addEventListener("click", (e) => {
    const close = e.target?.dataset?.close === "true";
    if (close) closeModal($("#questModal"));
  });
  window.addEventListener("keydown", (e) => {
    const open = $("#questModal")?.getAttribute("aria-hidden") === "false";
    if (!open) return;
    if (e.key === "Escape") closeModal($("#questModal"));
  });

  // Treat button
  $("#treatBtn")?.addEventListener("click", () => {
    store.treats += 1;
    saveStore(store);
    renderHud(store);
    toast("Treat delivered! +1");
    if (store.treats >= 10 && !store.badges.treats10) {
      store.badges.treats10 = true;
      saveStore(store);
      renderQuest(store);
      burstConfetti();
      toast("Badge unlocked: Snack Bringer!");
    }
  });

  // Filter chips
  $$(".chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter || "all";
      state.filter = filter;
      $$(".chip-btn").forEach((b) => setPressed(b, b === btn));
      render();
    });
  });

  // Lightbox events
  grid.addEventListener("click", (e) => {
    const tile = e.target.closest?.(".tile");
    if (!tile) return;
    const idx = Number(tile.dataset.idx);
    if (!Number.isFinite(idx)) return;
    openLightbox(state, idx);
  });

  $("#nextBtn").addEventListener("click", () => showNext(state, +1));
  $("#prevBtn").addEventListener("click", () => showNext(state, -1));
  $("#lightbox").addEventListener("click", (e) => {
    const close = e.target?.dataset?.close === "true";
    if (close) closeLightbox();
  });
  window.addEventListener("keydown", (e) => {
    const lbOpen = $("#lightbox").getAttribute("aria-hidden") === "false";
    if (!lbOpen) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext(state, +1);
    if (e.key === "ArrowLeft") showNext(state, -1);
  });

  // Mark visited sections (game progress)
  const observeTargets = ["#story", "#facts", "#favorites", "#gallery"]
    .map((id) => $(id))
    .filter(Boolean);
  const idToKey = {
    story: "visited_story",
    facts: "visited_facts",
    favorites: "visited_favorites",
    gallery: "visited_gallery"
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (!ent.isIntersecting) continue;
        const id = ent.target.id;
        const key = idToKey[id];
        if (key) markDone(store, key, `Room cleared: ${id}`);
      }
    },
    { threshold: 0.35 }
  );
  observeTargets.forEach((t) => io.observe(t));

  // Mini game buttons
  const startGame = () => playHideAndSeek(store, allItems);
  $("#startGameBtn")?.addEventListener("click", startGame);
  $("#playBtn")?.addEventListener("click", startGame);

  // Back to top
  $("#backToTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

init().catch((err) => {
  // Minimal fallback for local file opening edge-cases
  console.error(err);
});

