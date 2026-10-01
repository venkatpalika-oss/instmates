# Simulations Catalog V2 — available-first library

Base: 968063968367b02369dc50f65ad56c74248a5eb8.
Local branch feature/simulations-catalog-v2 was created before edits.

## Boundary

Catalog only; no routes, sitemap, homepage, lab calculations/controllers,
authentication, shared navigation markup, hosting or CI changes. The pressure
browser harness needs one catalog assertion update because count copy, card
hierarchy and category presentation changed; its engineering checks are retained.

## Registry and rendering

catalog.js remains the single registry. Stable category/topic IDs are separate
from labels. Entries have id, permanent lab number, title, status, href, summary,
categoryIds, topicIds, equipmentTypes and objectives. LAB 02 belongs to Measurement
and Field Skills. Memberships are deduplicated without mutating the registry.
Unique IDs, numeric lab identifiers and available routes are validated; bad
statuses and unknown taxonomy are rejected. Available routes must match a local
lab-path shape; tests separately verify the actual published files exist.

Only available entries render cards and contribute to the count. Coming-soon and
planned entries cannot contain launch routes. No future entry is currently
registered. Future work requires explicit editorial approval before registration;
taxonomy membership does not imply a release commitment. Search, filters, duration,
difficulty, analytics and fabricated activity are intentionally absent.

renderCatalog accepts an explicit registry for fixture testing and uses safe DOM
textContent. Every lab renders once irrespective of category membership. Cards
have one launch link with an accessible name identifying the lab. Synthetic routes
exist only in memory during tests and are never published or requested.

## Presentation and accessibility

Compact introduction, data-derived count, available cards, secondary subject areas
and Knowledge Hub link. Two-column desktop / single-column mobile cards; wrapping
metadata, >=44px launch links, visible focus, semantic articles/headings and textual
availability. Shared mobile bottom navigation uses static flow on this catalog
only. A catalog-scoped footer contrast correction addresses whole-page axe
findings; shared footer files are unchanged. Skip-link hiding remains effective
with enlarged text. No new images, fonts, dependencies, network calls or framework.

## Validation

128/128 site tests (120 baseline plus eight catalog cases).
28/28 existing simulations, 21/21 homepage and 18/18 pressure browser groups.
Catalog browser checks exercise 1440/768/430/390/360/320, actual focus geometry,
44px actions, menu keyboard operation, 200% text at 640 CSS px, reduced motion,
whole-page axe at 1440/320, images and routes. Real renderer fixtures use 2/5/10/25
labs, duplicate category memberships and an unpublished entry. Whole-page axe:
zero violations after scoped correction. No runtime/console/resource errors.

Evidence generated outside the repository at /tmp/instmates-catalog-evidence.
Desktop, tablet, all four mobile widths, keyboard, reflow, subjects and synthetic
25-lab captures were visually reviewed. At narrow widths LAB 02 requires scrolling;
there is no claim that both complete cards fit within one phone viewport.

Limitations: Chromium emulation only; no physical-device, Safari/Firefox or manual
screen-reader certification. Enlarged text and constrained CSS viewport exercise
reflow, not native browser zoom automation. Legacy shared bottom-nav icon glyphs
remain environment-dependent; text labels and navigation behavior are retained.
No staging, commit, push, PR, deployment or remote mutation is part of this slice.
