const $ = (sel, root = document) => root.querySelector(sel);

function safeUrl(path) {
  return encodeURI(path);
}

function readData() {
  const tag = $("#gameData");
  if (!tag) throw new Error("Missing game data.");
  return JSON.parse(tag.textContent || "{}");
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BEST_KEY = "kutchuHideSeek.best";

function getBest() {
  const n = Number(localStorage.getItem(BEST_KEY));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function setBest(n) {
  localStorage.setItem(BEST_KEY, String(n));
}

function openWin(attempts) {
  const modal = $("#winModal");
  const best = getBest();
  if (!best || attempts < best) setBest(attempts);

  const nowBest = getBest();
  $("#winText").textContent =
    `You found her in ${attempts} attempt${attempts === 1 ? "" : "s"}!` +
    (nowBest ? ` Best: ${nowBest}.` : "");

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("#playAgainBtn").focus();
}

function closeWin() {
  const modal = $("#winModal");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function init() {
  const data = readData();
  const kutchuSrc = data?.kutchu?.src;
  const others = Array.isArray(data?.others) ? data.others : [];

  if (!kutchuSrc || !others.length) {
    $("#status").textContent = "Add cat screenshots to the game data to play.";
    return;
  }

  const best = getBest();
  $("#best").textContent = best ? String(best) : "—";

  let attempts = 0;
  let deck = [];
  let kutchuIndex = -1;

  const render = () => {
    attempts = 0;
    $("#attempts").textContent = "0";
    $("#status").textContent = "Find Kutchu. Click a card!";

    deck = shuffle([kutchuSrc, ...others]);
    kutchuIndex = deck.indexOf(kutchuSrc);

    const grid = $("#grid");
    grid.innerHTML = deck
      .map((src, idx) => {
        const label = `Cat card ${idx + 1}`;
        return `
          <button class="cat-card" type="button" data-idx="${idx}" aria-label="${label}">
            <img src="${safeUrl("./" + src)}" alt="${label}" loading="lazy" decoding="async" />
            <span class="cat-cap">Card ${idx + 1}</span>
          </button>
        `;
      })
      .join("");
  };

  render();

  $("#shuffleBtn").addEventListener("click", render);
  $("#playAgainBtn").addEventListener("click", () => {
    closeWin();
    render();
  });

  $("#winModal").addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "true") closeWin();
  });
  window.addEventListener("keydown", (e) => {
    if ($("#winModal").getAttribute("aria-hidden") !== "false") return;
    if (e.key === "Escape") closeWin();
  });

  $("#grid").addEventListener("click", (e) => {
    const btn = e.target.closest?.(".cat-card");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    if (!Number.isFinite(idx)) return;

    attempts += 1;
    $("#attempts").textContent = String(attempts);

    if (idx === kutchuIndex) {
      $("#status").textContent = "KUTCHU FOUND!";
      openWin(attempts);
      const best2 = getBest();
      $("#best").textContent = best2 ? String(best2) : "—";
      return;
    }

    btn.dataset.wrong = "true";
    window.setTimeout(() => btn.removeAttribute("data-wrong"), 300);
    $("#status").textContent = "Nope. Kutchu is hiding somewhere else… try again!";
  });
}

init();

