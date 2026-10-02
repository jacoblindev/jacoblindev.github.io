# jacoblindev.github.io

Source for my technical blog, published at https://jacoblindev.github.io/.

Built with [VitePress](https://vitepress.dev/) and a custom vanilla-CSS theme,
"Digital Tectonics" — blueprint grid, 45° chamfered corners, and a CAD-style
title block footer.

```sh
npm ci
npm run docs:dev     # local preview
npm run docs:build   # production build → docs/.vitepress/dist
```

Every push to `main` deploys via GitHub Actions (`.github/workflows/deploy.yml`).
