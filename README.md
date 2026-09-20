# SmartList

SmartList is a local-first grocery comparison app for ALDI and the Winn-Dixie at Sun Lake Plaza (store 2273). Lists stay in the browser via `localStorage`.

## Local development

```bash
pnpm install
pnpm dev
```

## Live retailer data

Set `ALDI_MERCHANT_REFERENCE` to the local ALDI pickup merchant reference. Without it, the UI runs in a clearly labeled demonstration mode. Winn-Dixie does not publish a supported searchable catalog API; SmartList links each estimate to the live ad for verification.

Retail websites can change at any time. The API intentionally fails soft and identifies whether each source is live or sample data.
