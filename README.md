# GDS BEDS Social Media Automation

Deterministic internal preview renderer for GDS BEDS social content.

## Safety boundary

This repository does not publish to social platforms, send email, purchase assets, or activate production workflows. GitHub Actions produces internal preview artifacts only. Production activation remains approval-gated.

## Commands

```bash
npm test
npm run validate -- --manifest examples/static.json
npm run render -- --manifest examples/static.json --output dist
```

## GitHub Actions inputs

- `render_id`
- `manifest_base64`
- `dry_run` — keep `true` until production activation is explicitly approved

Successful runs upload a 14-day artifact named `gdsbeds-render-<render_id>`.
