# W1.2 — Homepage information architecture: audit and implementation notes

**Slice:** W1.2 of the W1 product contract ([17-w1-product-experience-plan.md](17-w1-product-experience-plan.md) §C, §I, §K, §L), consuming the W1.1 foundation ([18-w1-1-taxonomy-navigation-notes.md](18-w1-1-taxonomy-navigation-notes.md)). Homepage only: no header, footer, bottom-nav, service-worker, rules, index, schema or data change. W1.3 (visual system) is not started.

## 1. Audit of the previous homepage (main 792bea7)

| Section (old `index.html`) | Decision | Why |
|---|---|---|
| Hero h1 "The Social Technical Platform for Instrument & Analyzer Engineers" + "private network" copy | REWORK | Positioning must be problem-first (plan §A); "private" contradicted the public-knowledge principle; no SOLVE/LEARN/CONNECT. |
| Hero tagline "Real breakdowns · Real plant fixes · Built for…" | REWORK | Replaced by the owner-named tagline *Share Technology · Learn Techniques · Grow Together* (not present anywhere in either repository before W1.2). |
| Hero CTAs Join Free / Login | MOVE | Registration belongs in the JOIN block (plan §C); the hero now leads to SOLVE and the Knowledge Hub. |
| "Technical Discussions" explainer panel + login CTA box | REMOVE FROM HOMEPAGE | Explained the feed instead of showing it; duplicated Join/Login; plan §C removes it. Replaced by the real latest-discussions rail. |
| Auth-in "Welcome Back" hero (separate page variant) | REWORK | Signed-in members saw a second full-page variant; now only the JOIN block changes (Continue: feed / your profile / edit profile) so the product structure is the same for everyone. |
| Right-hand column (reserved after the W0.9 video removal) | REMOVE | Nothing to show; no imagery in W1.2. |
| `#siteHeader` / `#siteFooter` includes, `includes.js`, `header-auth.js`, service-worker registration, GA4 block | KEEP | Unchanged. |

Dependencies found: homepage-specific CSS was a 20-line inline block (login highlight, CTA box, hero split); homepage-specific JavaScript was none beyond the shared includes/auth loaders; shared includes are header, footer and the bottom nav injected by `includes.js`; Firebase reads on the homepage were none (auth state only); analytics is the GA4 `page_view` in `<head>` (no events); structured data none; SEO metadata title/description/OG/Twitter/canonical present; the service worker precaches `/` and serves HTML and JS network-first, so no cache-name bump is needed for the new page or modules. `case-ticker.js` (queries the rules-denied `caseStudies` collection) is not referenced by any page and stays unused.

## 2. Final hierarchy (single `<main>`, one `h1`)

```
A  IDENTITY        hero: h1 positioning, tagline, one support line, "Find your fault" (#solve) + "Browse knowledge"
B  PROMISES        nav strip: Solve / Learn / Connect with their user questions (anchors)
   SOLVE           "What problem are you working on?" – 7 existing troubleshooting guides (static, = NAVIGATION.solve existing)
                   CTAs: case studies · ask in the feed (login to post)
                   support: "Real field cases" – 3 cases chosen deterministically from content-map.js + true case count
   LEARN           "What do you want to understand?" – 4 learning paths (static, = NAVIGATION.learn existing) with true page counts
                   "Covered today" – every SUPPORTED measurement/technology term from taxonomy.js with its page count
   CONNECT         "Who has experience with this?" – latest discussions (3, Firestore) + public professionals (6, Firestore), true counts
G  JOIN            auth-out: ladder Ask · Comment · Share experience · Build your profile; Join free / Login
                   auth-in: Continue – feed / your profile / edit profile
```

Cases sit under SOLVE (plan §C places "Real cases" as SOLVE support; every case is mapped to `troubleshooting`), which is the one deviation from the conceptual A–G order in the authorization.

## 3. Taxonomy / content-map integration

- `taxonomy.js` gains one declared field, `entry`: the existing page a SUPPORTED measurement/technology term opens from LEARN (no hubs exist). It is `null` for partial/none terms and activities; tests assert `entry` ⇔ supported, that it exists on disk, and that it is a mapped resource *about* that term.
- `content-map.js` gains two pure helpers: `entryResource(slug)` and `resourcesUnder(prefix)`.
- `home.js` imports both modules and never defines terms; the homepage HTML carries no taxonomy data. Rendered from the modules at runtime: the nine "Covered today" topics with page counts (11/5/15/22/13/17/4/4/4), the learning-path counts (25/7/9/13), the three featured cases and the case count (10). PARTIAL and NONE terms are never rendered.
- Static HTML carries the primary links so the page is complete without JavaScript and crawlable; tests hold the static lists equal to the `existing` destinations of the W1.1 navigation contract.

## 4. Community data (CONNECT) and sparse behaviour

- Discussions: `posts` ordered by `createdAt` desc, limit 3, plus `getCountFromServer(posts)`; shows type badge, 160-char excerpt (textContent, never HTML), relative time and the stored reaction total. No author lookup, so no per-post profile reads.
- Professionals: `profiles` with `where("profileStatus.isPublic","==",true)`, limit 6, plus a count aggregation with the same filter — the identical public filter the directory uses; no orderBy, no new index. Cards show the directory's public fields (name, headline, specialization) without photos.
- Reads per homepage view: 3 + 6 documents + 2 aggregations.
- Zero state: "No discussions yet. Ask the first question in the feed." / "No public profiles yet. Join and build yours." Failure state: "… could not be loaded right now" with the CTA kept. Nothing is shown as trending, online, popular or recommended; every number on the page is read from data.

## 5. Copy rules applied

No "largest / leading / thousands / trusted worldwide / active community / private network". Registration copy advertises only actions that exist (post a fault/question/solution/calibration problem, comment, react helpful/faced/agree, profile fields). Profile visibility is not described because the current registration flow still defaults `isPublic` to true (W1.6 owns that fix).

## 6. Performance (hosting emulator, anonymous, first view)

| Measure | Before (main) | After (W1.2) |
|---|---|---|
| `index.html` | 5,383 B raw / 2.1 KB gz | 19,073 B raw / 5.6 KB gz (6.4 KB of it is the scoped inline CSS) |
| Same-origin requests (incl. document) | 9 | 13 (+ `home.js`, `taxonomy.js`, `content-map.js`, `safe-html.js`) |
| Same-origin compressed bytes | ≈ 32 KB | ≈ 49 KB (+ ≈ 14 KB modules, + 3.4 KB HTML) |
| `style.css` | 44,575 B (unchanged) | 44,575 B (unchanged) |
| Cross-origin requests | 7 (GA, fonts CSS, 4 Firebase SDK modules, GA collect) | ≈ 17 (+ Firestore listen/aggregate calls, + 1 web font) |
| Firestore reads per view | 0 | 9 documents + 2 aggregations |

## 7. Accessibility

One `h1`; heading order h1→h2→h3 with no skips; `<main id="main">`; the promise strip is a labelled `<nav>`; every section is `aria-labelledby`; visible `:focus-visible` outline; `prefers-reduced-motion` disables the homepage transitions; all links are real anchors with meaningful text; touch targets ≥ 44 px at 375 px (verified); the sitewide `.btn-primary` (white on light orange, ≈ 2:1) is overridden on this page only to brand blue on white (≈ 10:1); other measured text pairs are ≥ 7:1.

## 8. Mobile (375 px)

Single column; hero, promise strip and the SOLVE heading fit the first screen (SOLVE h2 at ≈ 695 px, first fault link at ≈ 830 px on an 812 px viewport); no horizontal overflow; no carousel, chips or hover-only behaviour; the bottom nav is unchanged (still Home / Feed / + / Techs / Account — the PROPOSED Solve · Learn · Connect · Account nav is a separate slice).

## 9. Analytics (no change)

Events worth measuring later, if the owner authorises a sitewide analytics decision: promise-strip clicks (solve/learn/connect), SOLVE guide clicks by page, "ask in the feed" clicks, LEARN topic clicks by slug and page count, learning-path clicks, featured-case clicks, discussion/profile rail clicks, Join/Login clicks from the ladder, and the auth-in Continue actions.

## 10. Hero video (owner addendum)

**Recovered evidence.** The only homepage video in history is `public/assets/videos/avatar.mp4`, added in commit 7e4448d ("avatar added", 2026-02-19) and still tracked on `main` (it was never deleted from the tree, so it is still deployed to Hosting). 17,151,945 bytes; MP4, H.264 High 1280×720 25 fps ≈ 4.45 Mbps plus AAC-LC stereo 48 kHz ≈ 189 kbps; 29.56 s. It is a HeyGen AI-avatar presenter with burnt-in captions ("Welcome to InstMates… I created InstMates to ensure that real troubleshooting knowledge is documented, shared, and accessible to every instrument and analyzer professional… built with an engineering mindset — focused on accuracy, structure, and insight") and a HeyGen watermark in the lower-right corner. The old homepage placed it in the hero's right column as `<video autoplay muted loop playsinline>` with a `<source>` in the HTML (so the 17 MB download started on every visit) and a "🔊 Enable Sound" button that unmuted it. Commit 22b5603 (W0.9, "remove fabricated and unavailable product claims") removed the markup for homepage performance and left a comment reserving the column for W1.

**Restored implementation.** New optimized asset `public/assets/videos/instmates-hero.mp4`: 798,540 bytes, H.264 Main 960×540 CRF 33 ≈ 214 kbps, **no audio track**, `+faststart`. Poster `public/assets/images/home/hero-poster.jpg`: 53,120 bytes, 960×540 JPEG from a clean frame at 29.2 s (no caption). The `<video>` is decorative (`aria-hidden`, `tabindex="-1"`, `muted playsinline loop autoplay preload="none"`, no controls) and carries **no source in the HTML**; `home.js` attaches `data-src` after `window` load only when `shouldLoadHeroVideo()` allows it: not under `prefers-reduced-motion`, not at ≤768 px, not with Save-Data or a 2G-class connection. Without JavaScript, when autoplay is blocked, on failure, on mobile and under reduced motion the poster is the whole experience; the hero text, tagline, actions and the promise strip are unchanged HTML. The 17 MB original is not referenced.

**Service worker.** Same cache name (`instmates-v4`). Media (`mp4/webm/m4v/mp3/ogg/wav`) is no longer intercepted, and only complete `200` responses are cached — Range (`206`) responses previously reached `cache.put`, which rejects them.

**Measurements (hosting emulator).** Same-origin compressed bytes on the first view: ≈ 49 KB before the video; ≈ 104 KB after (poster 53 KB + 0.5 KB HTML) on every viewport; plus 799 KB of video on desktop after the load event (≈ 903 KB total). Mobile and reduced-motion never fetch the video. DOMContentLoaded and load are unaffected because the source is attached after load.

## 11. Deferred / out of scope

`/includes/header/` sitemap anomaly (deferred, untouched); `/solve/` and `/technology/` routes (W1.4 / decision); people↔technology mapping (FUTURE); header, footer and bottom-nav changes; retirement redirects (`explore.html` is no longer linked from the homepage but the URL is intact); visual system (W1.3).
