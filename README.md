# Kutchu — pastel cat website

This is a simple static website about **Kutchu** (with a friendly pastel theme + photo gallery).

## How to run

### Option A (recommended): use a tiny local server

If you have Python installed:

```bash
python -m http.server 5173
```

Then open `http://localhost:5173` in your browser.

### Option B: open the file directly

You can double-click `index.html`, but some browsers block `fetch()` for local files. If the page looks empty, use **Option A**.

## Update content

- Edit `data/kutchu.json` to change facts, motto, favorites, and gallery captions.
- Add more images to `photos/` and add them to the `gallery` array in `data/kutchu.json`.

