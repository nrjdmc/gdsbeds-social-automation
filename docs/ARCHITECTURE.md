# Architecture

## Pipeline

1. Content intake and claims review
2. License-aware asset preparation
3. Human approval routing
4. Static/carousel manifest build
5. Reel storyboard manifest build
6. GitHub render dispatch
7. GitHub Actions validation, tests and internal artifact generation

## Safety

The renderer creates internal preview artifacts only. It does not publish, email, purchase assets, or activate production workflows. Missing licensed media remains visibly marked and is not publication-ready.

## Dispatch contract

The dispatcher sends `render_id`, base64-encoded `manifest_json`, and `dry_run=true`. A successful run uploads `gdsbeds-render-<render_id>` containing SVG previews and `result.json`.
