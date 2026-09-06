# W1 — Product Experience & Homepage Architecture Plan

**Status:** W1 PRODUCT CONTRACT — revision 3, frozen by owner/CTO decision (2026-09-07). Changes to APPROVED items require a new owner decision recorded here.
**Status classes used in this document:**
- **APPROVED** — owner/CTO decision; binding for W1 slices.
- **PROPOSED** — suggested copy, labels or values; not binding until approved.
- **DEFERRED** — consciously excluded from W1; may return in a later wave.
- **FUTURE** — capability that does not exist and must never be shown as available.
- **REVIEW HEURISTIC** — a prompt to re-examine a decision; never a hard threshold or an automatic trigger.

| Section | Class |
|---|---|
| A positioning, B model, C homepage hierarchy (structure), D hub architecture and threshold, E three facets, F static vocabulary representation, G client-side filtering for W1, H visibility UX, I sparse behaviour, J visual direction, K mobile model, L ladder steps 1–3, O slices | APPROVED |
| Copy lines in A and C, navigation labels, hub URL scheme, E vocabulary terms, metric definitions in P | PROPOSED |
| M content backlog, N retirement actions, W0.5 security track, site search, personalization | DEFERRED |
| Save, follow, message, notifications, verification, people↔technology mapping storage | FUTURE |
| Scale figures in G | REVIEW HEURISTIC |
**Repository:** website (`venkatpalika-oss/instmates`, Firebase project `instmates`). The Android app is out of scope.
**Baseline:** `main` = `67788f99f1c79a34c0d085bee73e4b58c69475da` (W0 closed at tag `w0` = `b35f327`; post-W0 cleanup merged via PR #36). W0 invariants are preserved by everything below: strict Firestore/Storage rules unchanged, zero Cloud Functions, technical content public, login only for interaction, no fabricated activity.
**Governing question:** *What should an instrumentation or analyzer professional understand, value and want to do within 5–10 seconds of arriving at InstMates?*

Answer the plan is built around: **"I can find how this measurement fails and how it was fixed, understand the technology behind it, and reach the people who work with it — and I can ask about my own fault."**

---

## A. Approved positioning

**Problem-first field troubleshooting, backed by structured technical knowledge and the professionals who work with it.**

- Target: instrument technicians, analyzer technicians, instrument/analyzer engineers, maintenance engineers, calibration and laboratory/analyzer professionals.
- Not: a generic social network, an engineering blog, a LinkedIn or forum clone, an AI content portal, a landing-page template.
- Production tagline is **unchanged** in W1. Any copy below is **PROPOSED** and needs separate approval:
  - PROPOSED identity line: *"Field failures, fixes, and the people who solved them — for instrument and analyzer professionals."*
  - PROPOSED audience line: *"Built for instrument, analyzer, maintenance and calibration professionals."*

---

## B. The SOLVE / LEARN / CONNECT model

Three promises organise the whole site, not only the homepage. Every page, navigation item and homepage block belongs to exactly one promise; supporting blocks exist only to feed one of the three.

| Promise | User question | What exists today to fulfil it | W1 adds |
|---|---|---|---|
| **SOLVE** | "What problem are you working on?" | 12 troubleshooting/failure pages (4–20 mA, pressure, DP flow, GC failure modes, FTIR interference, flash-point), 10 case studies, feed post types `fault` / `solution` / `calibration` | a single fault entry surface, technology hubs with "Common faults / Troubleshooting" sections, "ask about this fault" prefilled composer |
| **LEARN** | "Understand the measurement or technology." | 63 knowledge pages across field instrumentation, GC, FTIR and laboratory/QA; 3 blog posts | technology hubs ("How it works / Components / Calibration / Sampling"), a Technologies index that shows real coverage, breadcrumbs from articles to hubs |
| **CONNECT** | "Find real cases, discussions and professionals with relevant experience." | public feed with comments and reactions, public directory (20 profiles), public profile pages | cases, discussions and people surfaced *by technology* on hubs; profile technologies from a controlled vocabulary; honest sparse states |

Navigation contract derived from the model (labels PROPOSED, see §Q): header **Solve · Learn · Connect** with the technology index reachable from all three; mobile bottom nav **Solve · Learn · Connect · Account**; the floating post button stays and opens the composer prefilled from context.

---

## C. Revised homepage hierarchy

Three primary blocks in fixed order, each visibly a promise; supporting blocks are smaller, live under their promise, and never compete with it. The page must read correctly with 3 posts, 1 comment and 20 public profiles.

```
IDENTITY STRIP        one line + audience line (static; PROPOSED copy)          [answers "what is this?"]

1. SOLVE   ──────────────────────────────────────────────────────────────────
   "What problem are you working on?"
   Primary: fault entry grid — 6–8 large targets, each an existing
            troubleshooting page (loop faults, pressure zero shift, DP flow,
            GC failure modes, FTIR interference, flash-point)        [static, curated]
   Support: "Real cases" — 3 featured case studies, link to all 10    [static, curated]
   CTA:     "Ask about your fault" → composer, type=fault (login)     [exists]

2. LEARN   ──────────────────────────────────────────────────────────────────
   "Understand the measurement or technology."
   Primary: Technologies grid with real coverage — covered technologies
            open hubs; uncovered ones are greyed "not covered yet"     [static, taxonomy]
   Support: learning paths (Field instrumentation · Analyzers ·
            Laboratory & QA) with true page counts                    [static]

3. CONNECT ──────────────────────────────────────────────────────────────────
   "Find real cases, discussions and professionals with relevant experience."
   Primary: People — 6 public profiles with technology chips, true
            count ("20 public professionals"), link to directory      [Firestore, public read]
   Support: Latest discussions — up to 3 posts, true total, honest
            sparse state (see §I)                                     [Firestore, public read]
   CTA:     auth-out: value ladder (§L) + Join free
            auth-in: "Continue" — complete profile / your posts       [static + own profile]
```

Removed from the homepage: the current "Technical Discussions" explainer panel, the duplicated Join/Login buttons, any preview or placeholder card. Section weights: SOLVE ≈ 40 % of the first two screens on mobile, LEARN ≈ 35 %, CONNECT ≈ 25 %; the social feed is never the first thing a visitor sees (§K).

---

## D. Technology hub architecture

The hub is the strategic W1 foundation and the only new page type. One hub per covered technology, e.g. `/technology/gas-chromatography/`.

**Section vocabulary (a hub shows only the sections it can fill; empty sections are not rendered):**

| Section | Promise | Source | Rendered when |
|---|---|---|---|
| Overview | LEARN | curated summary in the hub page | always |
| How it works | LEARN | existing explanation pages | ≥1 page |
| Components | LEARN | existing pages | ≥1 page |
| Common faults | SOLVE | existing failure-mode pages | ≥1 page |
| Troubleshooting | SOLVE | existing troubleshooting pages | ≥1 page |
| Calibration | SOLVE/LEARN | existing pages | ≥1 page |
| Sampling systems | LEARN | existing pages | ≥1 page |
| Case studies | CONNECT | existing case studies tagged to the technology | ≥1 case |
| Relevant discussions | CONNECT | feed posts carrying the technology slug in `tags` | always: list or sparse prompt (§I) |
| Professionals with experience | CONNECT | **FUTURE contract** — requires a people↔technology mapping whose data semantics are not yet designed (see §F); not derived from `analyzersWorked` | only once the mapping contract exists; until then the section is omitted (not a sparse prompt) |
| Contribution path | CONNECT | "Ask about a fault" / "Share a solution" → composer prefilled with type and slug | always |

**Publication threshold.** A hub becomes publicly discoverable (linked, in the sitemap, indexable) only when it links **at least three meaningful real resources** from the content sections (overview text does not count; discussions and people do not count because they are volatile). Analysis: three is the smallest number that gives a visitor a choice and stops a hub from being a redirect page; it matches the current content clusters (every candidate below has either ≥3 or 0–1, so the threshold separates cleanly). Documented exceptions:
1. **Cross-cutting hubs** (Sampling systems, Calibration) count resources from any technology, since their value is the cross-reference itself.
2. **A hub with exactly one deep case-study series** (e.g. Yokogawa GC8000 errors) counts the series as one resource, not four.
3. **No exception for taxonomy completeness**: an uncovered technology is listed in the index as "not covered yet" with an ask-the-community prompt and no page of its own.

**Candidate hubs for W1.4 (meeting the threshold today):** Gas chromatography · FTIR · Sampling systems (cross-cutting) · Signals & loops (4–20 mA, HART, wiring) · Pressure · DP flow · Laboratory & QA. Seven hubs; no others in W1.

---

## E. Taxonomy support matrix (three facets approved; vocabulary NOT frozen)

Classification: **EXISTING** = ≥3 real resources today · **PARTIAL** = 1–2 · **NONE** = 0. Counts are pages on `main`. Existing indexed URLs are not renamed in W1.

**Facet 1 — Measurement**

| Term | Support | Evidence |
|---|---|---|
| Pressure | EXISTING | 10 pages + 2 case studies |
| Flow (DP flow) | EXISTING | 5 pages + 1 case study (Altosonic) |
| Signals & loops (4–20 mA, HART, wiring/grounding) | EXISTING | 11 + 1 + 1 pages, 3 blog posts |
| Analytical (umbrella for facet 2) | EXISTING | via GC/FTIR |
| Laboratory & QA | EXISTING | 14 pages |
| Level | NONE | — |
| Temperature | NONE | — |
| Control valves | NONE | — |
| Process control | NONE | — |

**Facet 2 — Analytical technology**

| Term | Support | Evidence |
|---|---|---|
| Gas chromatography | EXISTING | 13 pages, 5 case studies, 1 video placeholder |
| FTIR | EXISTING | 4 pages |
| Sampling systems (cross-cutting) | EXISTING | GC sampling, FTIR sampling, impulse-line pages |
| Flash-point analyzer (laboratory) | EXISTING | 4 pages |
| Oxygen (zirconia / paramagnetic / electrochemical) | NONE | — (highest-priority gap, §M) |
| NDIR / IR | NONE | — |
| UV | NONE | — |
| Moisture | PARTIAL | FTIR moisture cross-interference page only |
| H2S · SO2 · NOx | NONE | — |
| CEMS (system) | NONE | (AI knowledge text file exists but is not a page) |
| pH · Conductivity · Silica · Sodium · TOC · SWAS | NONE | — |

**Facet 3 — Professional activity**

| Term | Support | Evidence |
|---|---|---|
| Troubleshooting | EXISTING | 12 pages + cases |
| Calibration | EXISTING | 4–20 mA calibration, pressure calibration, calibration master guide, loop check vs bench |
| Preventive maintenance | PARTIAL | GC full cycle, failure modes |
| Sampling-system design | EXISTING | see facet 2 |
| Commissioning | NONE | — |
| Reliability | PARTIAL | control charts/SPC, uncertainty |
| Standards & compliance | EXISTING | ISO 17025 (2), ASTM D56/D93, uncertainty |

Activities are filters and cross-links in W1, not pages.

---

## F. Static controlled-vocabulary recommendation

**Recommendation: one ES module, `public/assets/js/taxonomy.js`, exporting a frozen object; no JSON fetch, no Firestore collection.**

Why this over the alternatives, given the existing architecture:
- The site already runs vanilla ES modules (`feed.js`, `profiles.js`, `edit-profile.js` import each other); a module can be imported by the composer, the profile editor and the hub script with no extra request and no async race. A JSON file would need `fetch` in every consumer and a loading state.
- The service worker treats same-origin JS as network-first with cache fallback, so updates propagate on the next navigation, exactly like the rest of the site.
- Reviewable in a PR like any source file; hashed by Git; no runtime write path, so nothing new for the rules to protect.

Shape (illustrative; designed to be stored later as a Firestore document with the same fields):

```js
export const TAXONOMY = Object.freeze({
  version: 1,
  measurement:  [{ slug: "pressure", label: "Pressure", status: "existing" }, …],
  technology:   [{ slug: "gas-chromatography", label: "Gas chromatography", group: "gas", status: "existing",
                   hub: "/technology/gas-chromatography/", aliases: ["gc", "gas chromatograph"] }, …],
  activity:     [{ slug: "troubleshooting", label: "Troubleshooting", status: "existing" }, …]
});
```

Member data and the vocabulary (APPROVED constraints; verified against `firestore.rules`):
- **Profiles — the mapping problem is open, not solved.** `validProfessional` allows only `specialization`, `analyzersWorked`, `plantType`, `certifications`; `analyzersWorked` is a free-text string list (≤50). There is a real semantic distinction between **analyzer/equipment experience** (what a member has worked on: e.g. "AMETEK 888", "Siemens Maxum II", "ABB AO2020") and **technology taxonomy** (what the site classifies: `zirconia-oxygen`, `gas-chromatography`, `paramagnetic-oxygen`, `ndir`). Overloading `analyzersWorked` with taxonomy slugs to avoid a schema/rules change is **rejected**. A people↔technology mapping needs its own design: either an equipment→technology reference (so "AMETEK 888" resolves to zirconia oxygen without changing member data) or a dedicated, member-chosen technology field that requires a rules change and its own authorization. Until that design exists the mapping is **FUTURE**: no profile documents are modified, no field is added, no backfill, no rules change, and hub "people" sections are omitted.
- **Posts:** `tags` is a free-text string list (≤5), comma-separated by the composer, no normalisation, no `#`. The three production posts carry `[]`, `null`, `null` (one legacy post also lacks `type`). Taxonomy consumption of tags is therefore an empty set today; a deterministic, read-only normaliser (lower-case, trim, alias lookup, unknown → unmapped) is acceptable, but no post is rewritten and no tags are backfilled. Writing a slug from the composer is a W1.5 decision, not W1.1.

Migration path: the module's object is the document shape for a future server-managed `taxonomy/v1` document; consumers import a single accessor so the source can be swapped later.

---

## G. Firestore query and index analysis (no index change authorized or required in W1)

Queries that exist today (all satisfied by single-field indexes):
- `profiles`: `where("profileStatus.isPublic", "==", true)` — fetches all public profiles (20).
- `posts`: `orderBy("createdAt", "desc")`, `limit(20)`.
- `posts/{id}/comments`: `orderBy("createdAt", "asc")`.

Future queries that **would** require composite indexes if run server-side:
1. People by technology: `where("profileStatus.isPublic", "==", true)` + `where("professional.analyzersWorked", "array-contains", slug)` → composite (isPublic ASC + analyzersWorked CONTAINS).
2. Discussions by technology: `where("tags", "array-contains", slug)` + `orderBy("createdAt", "desc")` → composite (tags CONTAINS + createdAt DESC).

Options evaluated:

| Option | Fit at current scale | Rules impact | Cost |
|---|---|---|---|
| Existing queries + client-side filtering by slug | 20 public profiles and 3 posts: trivial; the directory already downloads every public profile | none (the `isPublic` filter stays in the query, as rules require) | none |
| Static taxonomy mapping only (hub lists resources, no live rails) | works, but drops the CONNECT promise | none | none |
| Composite indexes | correct long-term | none | infrastructure change, separate authorization |

**Recommendation (APPROVED): existing queries with client-side filtering in W1.** Hubs reuse the feed's latest-posts query (and, once the people mapping exists, the directory's public-profile query) and filter by slug in the browser.

**Scale review (REVIEW HEURISTIC, not a threshold).** Figures such as "a few hundred public profiles" or "a few hundred posts" are only prompts to look again; they never trigger a change by themselves. The move from client-side filtering to server-side queries with composite indexes is proposed only on **measured evidence**, collected read-only in W1.8 and at each later closure: transferred payload per page (bytes), Firestore document reads per page view, query latency, client filtering time on a mid-range mobile device, mobile performance (Core Web Vitals on the affected pages), user-visible response time of the rails, and operating cost (reads per month). When any of these is observed to degrade the field-use targets in §K or the cost expectations, the two composite indexes above are proposed as a separate infrastructure change with the measurements attached. Note for later cleanup: `firestore.indexes.json` still declares legacy indexes on `publicProfile` / `profileCompleted` fields that no current query uses; untouched in W1.

---

## H. Profile visibility UX concept (W1 MUST HAVE; no rules change)

Problem: saving the edit form always writes `profileStatus.isPublic: true`, so a member whose profile was backfilled as private becomes discoverable on first save without being told.

Concept:
1. **Visibility control on the edit page**: a clearly labelled two-state control, *Private* / *Public*, showing the current state read from the document, defaulting to the stored value (not to Public). Saving writes the member's explicit choice; the completion score no longer implies publication.
2. **Plain-language explanation next to the control** (PROPOSED copy): *"Public: your name, headline, location, specialization and technologies appear in the InstMates directory and on technology pages, and can be seen by anyone on the internet without logging in. Private: only you can see your profile."*
3. **Confirmation on the first switch to Public**: an inline confirmation (not a modal) restating what becomes visible, with "Make public" / "Keep private".
4. **Status badge** on the member's own profile view ("Private — only you can see this" / "Public") with a link to change it.
5. **No silent flips anywhere**: the composer, hub contribution paths and onboarding prompts may *invite* the member to go public but never write `isPublic` themselves.
6. Data written stays within the allow-listed `profileStatus` keys (`isPublic`, `completionPercent`, `lastUpdated`); privileged keys untouched; rules unchanged.

---

## I. Sparse-community behaviour (credible with 3 posts, 1 comment, 20 public profiles)

Rules: real numbers or none; a section with zero items shows a one-line prompt plus its CTA and stays visible; never hide the CONNECT promise, never inflate it.

| Surface | With today's data | With zero items | Never |
|---|---|---|---|
| Latest discussions (home) | 3 posts with type badge, technology tag, reaction and comment counts as stored; footer "3 discussions so far" | *"No discussions yet — ask the first question."* + composer CTA | trending, "hot", view counts, online indicators |
| Cases (home, hub) | curated case studies are editorial content and always present; count is the real number | a hub with no case simply omits the section | "most popular", fabricated outcomes |
| Professionals (home, hub) | 6 real public profiles with chips; "20 public professionals" | hub: *"No one has listed FTIR yet — add it to your profile"* (login CTA) | member counts other than the true public count, avatars of non-members |
| Technology hubs | sections rendered only when filled; discussions/people rails show list or prompt | uncovered technologies have no page; index shows "not covered yet — ask the community" | placeholder articles, "coming soon" pages in the sitemap |
| Homepage overall | SOLVE and LEARN carry the page; CONNECT is honest and small | — | testimonials, logos, "trusted by", popularity claims |

---

## J. Visual system direction: TECHNICAL DRAWING with SIGNAL & MEASUREMENT typography (approved)

**Intent:** the site should feel like a well-kept instrument dossier or loop folder: precise, annotated, calm — not CAD software, not a dashboard.

- **Palette:** navy and cyan from the approved logo, white working surfaces, a warm grey for drawn rules and dimension lines, one fault colour (amber) for warnings/faults, one confirmation colour (green) for verified/fixed. No gradients, no glass, no purple.
- **Structure:** a visible drawing grid of thin rules; sections framed like titled drawing sheets with a small title-block style header (section title, count, "sheet" number is *not* used — no CAD cosplay). Cards only where items are genuinely discrete (cases, people); lists elsewhere.
- **Typography (signal & measurement discipline):** Inter (already loaded) for text with a tight, three-level heading scale; a monospaced face for values, units, tag numbers, error codes and timestamps; numerals aligned in tables. Body ≥16 px on mobile, generous line height, high contrast.
- **Diagram and illustration language:** functional only — transmitter and loop symbols, a sample-path line, a chromatogram baseline, a calibration scale with marks — drawn as thin inline SVG in the navy line weight; each appears where it explains the section (SOLVE header shows a loop with a fault marker; LEARN shows a measurement scale; CONNECT shows nodes joined by a signal line). A fixed set of ~8 symbols, no stock illustration.
- **Annotations:** callouts styled as technical annotations (leader line + label) for "what to check" summaries on troubleshooting pages.
- **Motion:** none except focus/hover and a single line-draw on the section symbol on first paint; disabled under reduced-motion.
- **Guard-rails against CAD look:** no dark drafting backgrounds, no title blocks with revision tables, no grid heavier than 1 px at 8 % opacity, no isometric equipment renders.
- **Logo/header:** unchanged (approved symbol on white card, text wordmark, navy header).

---

## K. Mobile field-use model

Persona: a technician beside equipment, one hand, gloves possible, patchy connectivity, bright or dim light.

- **First screen is SOLVE.** Identity strip is one line; the fault entry grid is the first interactive block; LEARN's technology grid follows; CONNECT is below. No feed on the first screen.
- **Bottom nav (PROPOSED):** **Solve · Learn · Connect · Account**, plus the existing floating post button which opens the composer with type `fault` when launched from a hub or troubleshooting page.
- **Depth:** any troubleshooting page within 2 taps of Home; a technology hub within 2; asking a question within 3 including login.
- **Touch targets ≥ 44 px**, single column, no hover-only affordances, no modals for reading, sticky "Checks" summary on troubleshooting pages, headings that state the symptom.
- **Speed and connectivity:** HTML-first pages with no hero imagery; taxonomy module small and cached; Firestore rails render after static content and degrade to their sparse prompt on failure; service-worker strategy unchanged (network-first, offline shell, previously visited pages available offline).
- **Readability:** minimum 16 px body, contrast ≥ 4.5:1, no light-grey-on-white, units and values in monospace for scanning.

---

## L. Registration value ladder (participation and identity, not restriction)

| Step | What it gives | Exists? |
|---|---|---|
| 1. Read without an account | every technical page, case, discussion and public profile | exists (W0 principle) |
| 2. Ask with context | post a `fault` or `question` with technology tag and attachment; get comments from people running the same technology | exists |
| 3. Comment and contribute experience | comments, `solution` posts, reactions `helpful` / `faced` / `agree` | exists |
| 4. Build a technical profile | headline, specialization, analyzers/equipment worked, certifications, photo | exists; a member-chosen technology field is FUTURE (mapping design pending, §F) |
| 5. Become discoverable by experience | listed in the directory — **only if the member chooses Public** (§H); listing on technology hubs is FUTURE until the people↔technology mapping is designed | directory exists; hub listing FUTURE |
| 6. Build a history of contributions | your questions, solutions and cases collected on your profile | W1 (client-side list of own posts) |
| FUTURE (labelled FUTURE wherever shown) | save, follow technologies, notifications, messaging, verification | not in W1 |

Homepage CONNECT block (auth-out) shows steps 2–6 in one compact ladder with the true public-professional count; nothing on the site is newly gated.

---

## M. Content-gap backlog (outside W1 implementation; owner content track)

Prioritised by how much a hub would advance SOLVE for the target audience.

| Priority | Technology | Why strategically useful | Current coverage | Minimum before hub publication (≥3 resources) |
|---|---|---|---|---|
| 1 | Oxygen analyzers (zirconia, paramagnetic, electrochemical) | the most common process analyzer; search intent "zirconia oxygen analyzer reading low/troubleshooting" is exactly the SOLVE journey | none | overview + one failure-mode/troubleshooting page + one calibration or sampling page (or one case study) |
| 2 | NDIR / IR gas analyzers | high-volume "NDIR vs IR" and CO/CO2 troubleshooting intents; pairs with CEMS | none | overview + troubleshooting + calibration |
| 3 | CEMS (system level) | regulatory relevance; AI knowledge text already exists as raw material | none (text file only) | system overview + sampling/conditioning page + one fault page |
| 4 | Sampling-system design (general) | cross-cutting; "sample conditioning problems" intent | partial (GC/FTIR sampling pages) | one general conditioning/design page to bind the existing two |
| 5 | Moisture analyzers | adjacent to FTIR interference page | partial (1) | overview + troubleshooting |
| 6 | pH / conductivity | liquid-analysis entry point for water/steam plants | none | overview + calibration + troubleshooting |
| 7 | Level, Temperature | completes the measurement facet | none | overview + troubleshooting + calibration each |

---

## N. Page retirement matrix (planning only; no removal authorized)

Inbound links counted in tracked HTML/JS on `main`; "indexed" = present in sitemap and not `noindex`.

| Page | Current purpose | Inbound links | Indexed? | User value | Decision | Target if redirected |
|---|---|---|---|---|---|---|
| `/technicians/` | second copy of the public directory | `explore.html` | yes (sitemap) | duplicate of `/profiles/` | REDIRECT (301) | `/profiles/` |
| `/explore.html` | link hub restating navigation | header include | yes | low; superseded by LEARN grid | REDIRECT (301) after W1.2 | `/` (LEARN section) or `/technology/` index |
| `/dashboard.html` | auth-only link hub | none | noindex | none beyond header | REDIRECT (301) | `/` (auth-in state) |
| `/ask.html` | static question form, no backend | none | not in sitemap, indexable | misleading | REDIRECT (301) | `/feed/` (composer, type question) |
| `/question.html` | hard-coded demo question with answer form | none | not in sitemap, indexable | misleading | REDIRECT (301) | `/feed/` |
| `/knowledge.html` | legacy copy of the Knowledge index | `explore.html` | not in sitemap, indexable | duplicate | REDIRECT (301) | `/knowledge/` |
| `/community/` | same feed as `/feed/` under "Community Q&A" | header include, `explore.html` | yes (sitemap) | duplicate | KEEP as REDIRECT (301) to preserve the indexed URL | `/feed/` |
| `/submit-case.html` | form writing to a collection the rules deny; CTA hidden in W0 | `case-studies/index.html` (hidden CTA) | not in sitemap, indexable | none until a workflow exists | RETIRE later (FUTURE workflow); W1: add `noindex`, keep file | — |
| `/videos/`, `/videos/gc/` | "Coming Soon" badges, no media | header include | yes (3 sitemap entries) | none today | KEEP but remove from header and sitemap in W1.1; decide content later | — |
| `chat`, `inbox`, `message` | disabled messaging | none | noindex | none | KEEP hidden (FUTURE) | — |
| `/pricing` | not purchasable | none | noindex | none | KEEP hidden | — |
| `/ai/` | informational only | none | noindex | low | KEEP hidden | — |
| `/admin/*` | static mock-ups | none | noindex, robots-disallowed | none | KEEP hidden; retire in a later cleanup | — |

Redirects are hosting configuration (`firebase.json`), not deletions; files can stay in place until a later cleanup so history and rollback remain simple.

---

## O. Revised W1 implementation slices

All slices: one PR each through the required workflow (preview channel → owner merge → automatic Hosting deploy → read-only verification); no bypass; no rules, index, Functions, Storage or Flutter changes; W0 invariants re-verified at every slice.

| Slice | Goal | Files / systems | Acceptance criteria | HARD OUT OF SCOPE |
|---|---|---|---|---|
| **W1.1 Taxonomy + navigation contract** | Ship `taxonomy.js` (status per term from §E), the Solve/Learn/Connect header, footer and bottom nav; remove Videos from header/sitemap; add `noindex` to `submit-case`; hosting redirects per §N | `public/assets/js/taxonomy.js` (new), `includes/header.html`, `includes/footer.html`, `assets/js/includes.js`, `mobile-header.js`, `firebase.json` redirects, `sitemap.xml` | every §N redirect returns 301 to its target on preview; sitemap has no retired or video URLs; nav verified desktop and 375 px; zero console errors; W0 canonicals untouched | any content change, any Firestore write path, renaming article URLs, visual redesign |
| **W1.2 Homepage information architecture** | Rebuild `index.html` to §C with existing styles; add the two Firestore rails (people, discussions) with §I sparse states | `public/index.html`, `public/data/homepage.json` (curated SOLVE entries and featured cases), `assets/js/home.js` (new) | blocks in the §C order at desktop and mobile; rails show true counts; every empty state renders its prompt; anonymous and signed-in variants verified; zero fabricated numbers; `profiles` query still carries the `isPublic` filter | new page types, hub pages, styling beyond what existing classes provide |
| **W1.3 Technical-drawing visual foundation** | Design tokens, type scale, monospace data style, drawn-rule grid, ~8 functional SVG symbols, annotation component; applied to homepage, header, footer | `assets/css/style.css` (tokens + new components only), `assets/diagrams/*.svg` (new, inline-able) | visual sign-off on preview desktop/mobile; no layout regression on 5 sampled content pages; Lighthouse mobile performance ≥ 90 on `/`; reduced-motion honoured; contrast ≥ 4.5:1 | restyling article bodies, new fonts beyond one monospace, imagery, animation beyond the single line-draw |
| **W1.4 First real technology hubs** | Publish the seven §D hubs and the `/technology/` index with coverage states | `public/technology/**` (new), `assets/js/hub.js` (new), `taxonomy.js` resource lists, `sitemap.xml`, breadcrumbs include | each hub links ≥3 real resources; empty sections absent; uncovered technologies have no page and show the index prompt; canonicals + BreadcrumbList/CollectionPage data present; sitemap lists only published hubs | hubs for NONE/PARTIAL terms, new articles, edits to existing article URLs |
| **W1.5 Knowledge ↔ cases ↔ discussions linking** (people linking is FUTURE) | Discussions rail on hubs via the existing latest-posts query + client-side slug filtering; technology selection in the composer written as a tag (decision at W1.5); contribution paths; member "contributions" list on own profile | `feed.js`, `profile/index.html` (own-posts list), `hub.js` | emulator suite 74/74 unchanged; new client-ops tests prove post writes stay within the validated keys; hubs list real posts or the sparse prompt; no profile document is read for technology matching; no backfill of existing posts | people↔technology mapping, any profile field or `analyzersWorked` change, composite indexes, new Firestore fields/keys, rules edits, server-side tag queries, notifications |
| **W1.6 Profile visibility UX** | Implement §H: explicit Private/Public control, explanation, first-switch confirmation, status badge; stop the implicit publish-on-save | `profile/edit/index.html`, `profile/edit/edit-profile.js`, `profile/index.html` | saving without changing the control never changes `isPublic`; the first switch to Public shows the confirmation; badge reflects the stored state; anonymous fetch of a private profile still denied (rules unchanged); emulator client-ops test added | rules changes, directory behaviour changes, privileged keys |
| **W1.7 Mobile field-use refinement** | §K priorities: first-screen SOLVE, touch targets, sticky checks summary on troubleshooting pages, depth targets | `style.css` (mobile blocks), `mobile-header.js`, troubleshooting page template touch (12 pages, scripted) | 375 px verification on home, hub, troubleshooting, feed, profile; ≤2 taps to any troubleshooting page and hub, ≤3 to ask; targets ≥44 px; no horizontal overflow | redesign of content pages beyond the summary block |
| **W1.8 Accessibility + performance + SEO verification** | Prove quality bars and W0 invariants, collect metric baselines (§P), close W1 | none (read-only) + external manifest | landmarks/focus/contrast pass; Lighthouse mobile ≥ 90 performance on home and one hub; sitemap/robots/noindex set verified; anonymous rules probes unchanged; zero functions; production byte-match; closure report | any code change (findings go to a follow-up slice) |

Sequence: W1.1 → W1.2 → W1.3 → W1.4 → W1.5 → W1.6 → W1.7 → W1.8. Evidence-based adjustment: W1.6 is independent of W1.4/W1.5 and may be pulled forward to run right after W1.1 if the owner wants the trust fix live earlier; nothing else depends on it.

---

## P. W1 success metrics (measure, do not invent)

**Measurement prerequisite (owner decision):** GA4 currently fires only on the homepage (W0 removed the non-executing header block; sitewide analytics was deferred to W0.5). Without sitewide page views, none of the funnel metrics below can be measured. Options: enable the existing GA4 tag sitewide via the head of every page (a mechanical, scripted edit) or defer all funnel metrics. Recommendation: enable sitewide GA4 in W1.1 with page views only and no PII, then define events in W1.2/W1.4. No numeric targets are set until baselines exist.

| Metric | What to capture | Baseline needed first | Why it matters |
|---|---|---|---|
| Homepage → SOLVE | clicks on fault-entry grid items and "ask about your fault" | homepage page views, current click-through to `/feed/` and `/knowledge/` | validates the first promise |
| Homepage → LEARN | clicks on technology grid and learning paths | as above | validates the second promise |
| Technology hub engagement | hub page views; clicks per section; rails clicks (cases, discussions, people) | none exist (new pages) | shows whether hubs work as the spine |
| Article → related movement | clicks from article breadcrumbs/related rails to hubs, cases, discussions | article page views today (search landing pages) | measures the knowledge→community connection |
| Article → professional discovery | clicks from article/hub people rails to profiles | none | validates CONNECT |
| Anonymous → registration | registration completions per session that started on a technical page vs the homepage | current registrations per week (Auth console, counts only) | tests the value ladder |
| Return visits | returning-user share (GA4), members posting again within 30 days (Firestore counts, read-only) | current values | tests "reason to return" |
| Mobile performance / Core Web Vitals | LCP, INP, CLS on `/`, one hub, one troubleshooting page (Lighthouse on preview, field data from GA4/CrUX when available) | Lighthouse on current production pages before W1.2 | field-use requirement |
| Profile visibility clarity | share of edit-page saves that change visibility; support questions about "why am I public" (owner inbox) | current public/private split (20/41) | trust issue from §H |

Baselines to collect before W1.2 merges: homepage and article page views (once sitewide GA exists), Lighthouse scores on `/`, `/knowledge/gc/gc-failure-modes/`, `/profiles/`, current weekly registrations, current post/comment counts.

---

## Q. Remaining owner decisions

1. **Navigation labels** — header *Solve · Learn · Connect* and bottom nav *Solve · Learn · Connect · Account* (PROPOSED).
2. **Identity and audience copy** for the homepage strip (PROPOSED in §A); tagline stays.
3. **Hub URL scheme** `/technology/<slug>/` and the seven W1.4 hubs; confirmation of the ≥3-resource threshold and its two exceptions.
4. **People↔technology mapping design** (FUTURE): equipment→technology reference versus a dedicated member-chosen field with its own rules change; `analyzersWorked` is not overloaded either way.
5. **Client-side filtering** for hub rails in W1 with evidence-based scale review (REVIEW HEURISTIC in §G); no index changes.
6. **Profile visibility copy and behaviour** (§H), including whether W1.6 runs immediately after W1.1.
7. **Page retirement decisions** in §N, in particular `/explore.html`, `/community/`, `/videos/` and `/submit-case.html`.
8. **Sitewide GA4 page views** in W1.1 as the metrics prerequisite (privacy note: no PII, no user-id).
9. **Visual guard-rails** in §J and sign-off gate for W1.3 on the preview channel.
10. **Content backlog ownership** for §M (oxygen first) and its relationship to hub publication.
11. **W0.5 security track timing** (email verification P1, App Check P2) relative to the W1 slices.
