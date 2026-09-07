# Light technical canvas hero: implementation notes

**Branch:** `feature/light-technical-hero` from main de8773d. Homepage hero only; no inner page, header, bottom nav, sitewide `.hero`, GC architecture, taxonomy or Firebase change.

## Visual contract (approved: LIGHT TECHNICAL CANVAS)

Homepage-scoped `.hm-hero` block on the page's light canvas: navy typography (`--brand-primary`), instrumentation blue (`--brand-accent`) only for the monospace eyebrow, orange only on the primary CTA, one hairline rule above the compact model line and a 2 px navy rule closing the hero, generous whitespace, no background pattern, no gradient, no cards, no animation. The sitewide patterned `.hero` component is untouched and no longer used on the homepage.

## Copy (owner-approved)

- H1 verbatim: *Field troubleshooting, technical knowledge and real experience for instrument and analyzer professionals.*
- Tagline verbatim: *Share Technology · Learn Techniques · Grow Together*
- Support copy replaced with the approved two-sentence version (36 words, was 44 plus a hidden sentence).
- Eyebrow: *For instrument & analyzer professionals* (audience line from plan §A, no claim).

## CTAs and model

Primary "Find your fault" → `#solve` (orange, dark text); secondary "Browse knowledge" → `/knowledge/` (navy outline). Both 46 px min-height. The former three-card promise strip is replaced by a compact `nav.hm-model` inside the hero: Solve / Learn / Connect with their questions, horizontal on desktop, stacked rows on mobile, anchoring to the existing sections (which remain the only full treatment).

## Image candidate review (hard gate) — OWNER-SUPPLIED HERO PHOTOGRAPH REQUIRED

| Candidate | Finding | A: relevant instrumentation/field work | B: rights evidence |
|---|---|---|---|
| `gas-analyzer.jpg` | Actually an AVIF file (misnamed), 600×400, a cartoon illustration of a business meeting; used only on `inbox.html` | No | None (added in the bulk import commit 6a706de, no metadata, no record) |
| `who-for.jpg` | 900×568 progressive JPEG, generic stock-style photo of a worker in a hard hat at a machine panel; not identifiable as instrumentation/analyzer work | Weak | None (same import, no XMP/EXIF, no licence record in the repo) |

Neither satisfies both conditions, so no photograph was placed. The hero ships single-column with the figure slot documented in the HTML; adding an approved photograph activates the `.hm-hero.has-figure` two-column grid. Image contract when supplied: same-origin, ~1200×900 framing without upscaling, `srcset` 600/900/1200 with `sizes`, explicit `width`/`height`, descriptive `alt`, `fetchpriority="high"`, largest derivative ≤ 90 KB, caption only if factually accurate. No AI-generated, stock or HeyGen imagery.

## Video retirement (approved)

The `<video>` element, poster, deferred loader and `shouldLoadHeroVideo` gating are removed from the homepage and `home.js`. `public/assets/videos/instmates-hero.mp4` and `public/assets/images/home/hero-poster.jpg` are now zero-reference in the runtime tree (only historical notes mention them) but are **not deleted**; physical deletion is deferred until preview verification, for simple rollback. The service worker's media bypass stays valid and unchanged.

## Responsive behaviour

Desktop: single column today (two columns when a figure exists), hero ≈ 400 px tall, SOLVE grid starts above the fold. Mobile 375: eyebrow → H1 (1.45 rem) → tagline → support → two side-by-side CTAs → three stacked model rows (≥ 44 px); a supplied figure would render below the CTAs at 16:9, max 170 px. No horizontal overflow.

## Performance contract

No video, no MP4, no poster request; no new JS (home.js smaller); no framework. Hero is text-only until a photograph is supplied, so no hero LCP image and zero hero CLS. When supplied, explicit dimensions plus `aspect-ratio` keep CLS at zero and the image becomes the LCP candidate (preload/fetchpriority).

## Deferred

Owner photograph decision; physical deletion of the retired video/poster after preview verification; sitewide `.hero` pattern on inner pages (later visual work); NAVIGATION contract wording.
