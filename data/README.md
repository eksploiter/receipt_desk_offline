# Receipt development corpus

Collected 2026-10-22 for this application's layout analysis and regression checks.

- `cord-v2/`: 26 original Indonesian receipt images and publisher-provided OCR/semantic annotations. Dataset authors: Park et al., NAVER CLOVA AI. Source: https://github.com/clovaai/cord and https://huggingface.co/datasets/naver-clova-ix/cord-v2. License: CC BY 4.0; full license and attribution accompany the subset. Original images and annotations are unchanged. `manifest.json` contains stable row indices and image hashes. These examples cover physical rows, quantity columns, submenus, discounts, tax, totals, and wrapped labels. Indonesian receipt text is not a Korean language training set.
- `korean-synthetic/`: 37 original text fixtures in 13 categories; 13 original rendered images. License CC0. Covers cafe options, meal unit prices, wrapped food-hall rows, barcode prefixes, quantity-last columns, quantity-before-unit-price, quantity units, unfamiliar menu names, missing headers, missing quantities, voided rows, discounts/points, and item-free mobile card statements. Numeric comma, period, and ungrouped variants are included. Public documentation was consulted for schema diversity, not copied as receipt images: https://api.ncloud-docs.com/docs/ai-application-service-ocr-ocrdocumentocr-receipt and https://docs.tosspayments.com/guides/v2/learn/payment-results.

The corpus is retained in the source repository and is not included in the deployed page or standalone HTML. User receipts and screenshots are not part of this corpus. No OCR model weights were retrained in this update. The change improves image processing and deterministic parsing, evaluated with these fixtures and private task-local regression examples.

Run `node tests/core.test.cjs` and `node tests/corpus.test.cjs`.
