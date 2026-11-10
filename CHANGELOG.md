# Changelog

## [0.7.0](https://github.com/officialunofficial/og/compare/v0.6.1...v0.7.0) (2026-11-10)


### Features

* add emoji option, benchmark, and agent guide ([#15](https://github.com/officialunofficial/og/issues/15)) ([f60e9e2](https://github.com/officialunofficial/og/commit/f60e9e2faa1bb095b0188a5d6a2386dc50924572))

## [0.6.1](https://github.com/officialunofficial/og/compare/v0.6.0...v0.6.1) (2026-11-10)


### Bug Fixes

* retry a failed wasm init and correct the bench note ([#12](https://github.com/officialunofficial/og/issues/12)) ([9458ae8](https://github.com/officialunofficial/og/commit/9458ae8e5103799b9833f09d228637dba44a5097))

## [0.6.0](https://github.com/officialunofficial/og/compare/v0.5.1...v0.6.0) (2026-11-10)


### ⚠ BREAKING CHANGES

* the peer dependency is now @takumi-rs/wasm instead of workers-og, and scale sets the device pixel ratio so layout and font sizes stay in CSS pixels.

### Features

* replace workers-og with Takumi wasm renderer ([#10](https://github.com/officialunofficial/og/issues/10)) ([6d9d035](https://github.com/officialunofficial/og/commit/6d9d03525d330693623142c632ca478b40191152))

## [0.5.1](https://github.com/officialunofficial/og/compare/v0.5.0...v0.5.1) (2026-11-08)


### Bug Fixes

* preserve the documented profile namespace URI ([#8](https://github.com/officialunofficial/og/issues/8)) ([f59c8cb](https://github.com/officialunofficial/og/commit/f59c8cbb880f2421732ca1c351f2bd34878deeb8))

## [0.5.0](https://github.com/officialunofficial/og/compare/v0.4.0...v0.5.0) (2026-11-08)


### Features

* support the complete Open Graph metadata vocabulary ([#6](https://github.com/officialunofficial/og/issues/6)) ([e11dfef](https://github.com/officialunofficial/og/commit/e11dfef03a33df00f47bd64f195ca0f47b057a91))

## [0.4.0](https://github.com/officialunofficial/og/compare/v0.3.1...v0.4.0) (2026-11-08)


### Features

* add Open Graph video metadata helpers ([#4](https://github.com/officialunofficial/og/issues/4)) ([eba6301](https://github.com/officialunofficial/og/commit/eba6301958f23f49592a2ff57546b2deb27ae116))

## [0.3.1](https://github.com/officialunofficial/og/compare/v0.3.0...v0.3.1) (2026-07-09)


### Bug Fixes

* **ci:** pin npm to the 11.x line for publish ([ede5fe6](https://github.com/officialunofficial/og/commit/ede5fe62d858fd55039c71f5da0ce57de2898311))

## [0.3.0](https://github.com/officialunofficial/og/compare/v0.2.0...v0.3.0) (2026-07-09)


### ⚠ BREAKING CHANGES

* renderOgImage, loadGoogleFonts, OG_WIDTH, and OG_HEIGHT moved from the package root to the "/render" subpath.

### Bug Fixes

* split render plumbing into a separate entry point ([625a2c6](https://github.com/officialunofficial/og/commit/625a2c68c500ab23d0276331e63231f6b630f2b6))

## [0.2.0](https://github.com/officialunofficial/og/compare/v0.1.0...v0.2.0) (2026-07-09)


### Features

* Open Graph card primitives for edge runtimes ([3115701](https://github.com/officialunofficial/og/commit/3115701af10fec859806e47931cc2ede687e84fd))


### Bug Fixes

* pin release-please baseline and use a scoped PAT ([e12b610](https://github.com/officialunofficial/og/commit/e12b610aaa18945f112bcf976fdaaed21a896962))
