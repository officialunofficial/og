# Agent guidelines

## Project

`@officialunofficial/og` renders Open Graph cards on Fetch-API edge runtimes.
Each product brings its own design. This package supplies the layout DSL, the render
plumbing, the metadata helpers, and a response cache.

- The main entry point is pure JavaScript. It never imports the renderer.
- The `/render` entry point is the only file that imports `@takumi-rs/wasm`.
- `@takumi-rs/helpers` is an optional peer dependency. Load it with a dynamic import.
- Cards must stay cheap to render. Measure before you claim a speed gain.

## Commands

```sh
bun install
bun run verify   # lint, format, typecheck, test, build, package checks
bun fmt src examples   # format
bun check              # type check
bun run bench          # render benchmark on workerd
```

`bun fmt` and `bun check` come with Bun. `bun lint` does not ship in Bun 1.4.4.
Use oxlint until it does. Then change the `lint` script to `bun lint --deny-warnings`.

## Conventions

- Write every source file in TypeScript. Use ES modules with `.js` extensions on relative imports.
- Keep `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` on. Treat them as design limits.
- Use plain functions and data. Use classes only for errors.
- Use `type` for shapes. Use unions instead of enums.
- Do not add a dependency for something the platform already provides.
- Comment invariants and non-obvious reasons. Do not comment what the code says.
- Write docs and commit messages in short sentences. Use active voice and present tense.

## Testing

- Tests run in Node through Vitest. They load the real wasm renderer.
- Stub `fetch` when a test needs the network. Never call a real CDN from a test.
- Test behavior, not implementation. Put each assertion beside the operation it checks.

## Releases

release-please opens a release pull request from Conventional Commits. Merge it to
tag a release. Publish to npm with the manual "Publish to npm" workflow.
Use `feat!:` or a `BREAKING CHANGE:` footer for a breaking change.
