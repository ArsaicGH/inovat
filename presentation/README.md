# INOVAT presentation (Marp)

The team's slide deck, separate from the museum game.

- `slides.md`: the 16 slides (13 main + 3 backups), Vietnamese text, speaker notes in HTML comments.
- `theme/inovat.css`: the Marp theme (ivory, gold, burgundy; Playfair Display and Be Vietnam Pro, bundled in `theme/fonts`).
- `assets/`: screenshots and the trailer (`video/trailer.mp4`), historical pictures, QR code.
- `notes/`: `speaker-notes.md`, `qa-bank.md`, `sources.md`.
- `scripts/build.mjs`: builds `site/index.html` and `site/inovat-presentation.pdf`.

Live: https://arsaicgh.github.io/inovat/ (PDF: https://arsaicgh.github.io/inovat/inovat-presentation.pdf)

## Build

```bash
cd presentation
npm ci
npm run build        # needs Chrome or Edge for the PDF (set CHROME_PATH if not found)
SKIP_PDF=1 npm run build   # HTML only, faster
```

Open `site/index.html` (keys: arrows, F full screen, P presenter notes, O overview). The trailer plays by itself on slide 5.
GitHub Actions (`.github/workflows/presentation.yml`) rebuilds and publishes on every change in `presentation/`.
