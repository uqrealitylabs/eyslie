# Contributing

Keep changes small and runnable.

## Workflow

1. Open or link an issue for non-trivial work.
2. Keep pull requests focused on one behaviour or package maintenance task.
3. Update tests when state, math, accessibility, or exported API changes.
4. Do not commit generated output, local env files, screenshots, videos, or private assets.

## Before Opening A Pull Request

Run:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

## API Changes

Prefer additive changes only when they are clearly useful outside one website. Keep route, content, and brand-specific wrappers in consuming apps.
