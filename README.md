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

You can double-click `index.html`. This project embeds the site data directly inside the HTML, so it should still render.

## Update content

- The site data is embedded in `index.html` in a `<script type="application/json" id="kutchuData">...</script>` block.
- Add more images to `photos/` and add them to the `gallery` array inside that embedded JSON.

