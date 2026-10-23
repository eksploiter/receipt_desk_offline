# 영수증 데스크

Browser-local receipt organizer. `dist/index.html` is a standalone, offline-capable HTML with bundled Korean/English Tesseract OCR and PDF.js. No backend, API key, installation, or outbound receipt requests. Open in a modern browser; browser/organization policies still apply.

## Build and checks

Run `python build.py` after modifying `template.html`, `dist/core.js`, `dist/layout.js`, or `dist/app.js`. Bundled dependencies live in `vendor/`. Run `node tests/core.test.cjs`, `node tests/corpus.test.cjs`, and `node tests/layout.test.cjs`.

Version 1.1 re-reads the product table independently, compares line reconstructions/segmentation passes, parses quantity columns without a fixed product whitelist, separates options and totals, supports dark card-statement screenshots, and leaves missing quantities unknown. Users must still compare dates, totals, and people with the original before downloading renamed copies. OCR and the assumption that each product represents one person remain fallible.

`data/README.md` documents the public and synthetic regression corpus, source attribution, and license. The public corpus is a development dataset, not bundled in the app. No OCR model weights are retrained. Private task-local receipt examples and screenshots must never be committed or published.
