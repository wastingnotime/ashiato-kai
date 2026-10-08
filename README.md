# Ashiato Kai — web

Public web frontend for researching Japanese immigration records in Brazil. This repository owns the browser experience. The [read-only Ashiato Kai API](https://github.com/maxhanzo/ashiato-kai-api) owns the records and search semantics; the [mobile application](https://github.com/maxhanzo/AshiatoKaiApp) is a separate product surface.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite proxies `/web-api/*` to the deployed API during local development. No API credentials are needed. Run `npm run build` to type-check and build the static site.

## Web architecture

- SolidJS, TypeScript, and Vite for the responsive frontend.
- A small Cloudflare Worker routes only approved GET requests at `/web-api/*` to the existing API. The browser uses this same-origin route because the upstream API does not currently enable browser CORS.
- Cloudflare Workers static assets serve the built frontend. `npm run deploy` builds and deploys it after Cloudflare authentication and deployment configuration are in place.
- Search terms live in the URL. A selected record is also represented in the URL, so search and detail views can be shared.

The frontend offers immigrant search, record and travel-group details, ranked names, surnames and prefectures, and a map for prefecture detail pages. Its visual direction comes from the existing iPhone and iPad apps.

The interface has maintained Brazilian Portuguese and US English catalogs in `src/i18n.ts`. The initial choice follows a saved preference or the browser's preferred languages, with Portuguese as the fallback. Visitors can switch languages in the header; their choice is saved locally. Recorded names and Japanese script are displayed as supplied by the API and are not translated.

The API currently returns all search matches without pagination. The interface requires a name or surname to keep searches focused. A record match and a shared travel group are research leads, not proof of identity, ancestry or family relationship.

## Japanese stroke order

Record details and name/surname statistics include an always-visible, centered stroke-order viewer. Playback starts automatically, advances through every character in the recorded order (including repetitions), and loops after a short pause. Character buttons jump to and restart any position. Reduced-motion preferences disable the drawing transition. Unavailable characters are skipped after displaying their fallback. Controls are available in both interface languages.

The viewer uses the same AnimCJK geometry bundled by the iOS app, with 7,184 characters served as local, per-character JSON assets. It requires no API changes or third-party requests. Missing characters and failed loads display a localized fallback with retry. See [data provenance and licenses](public/strokes/README.md) and the [import script](scripts/import-strokes.py).
