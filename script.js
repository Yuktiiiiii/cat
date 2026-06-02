const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function safeUrl(path) {
  // Handles spaces and other characters in file names.
  return encodeURI(path);
}

function setPressed(el, pressed) {
  el.setAttribute("aria-pressed", pressed ? "true" : "false");
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

async function init() {
  const data = readEmbeddedData();
  if (!data) throw new Error("Missing embedded Kutchu data.");

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

  // Back to top
  $("#backToTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

init().catch((err) => {
  // Minimal fallback for local file opening edge-cases
  console.error(err);
});

