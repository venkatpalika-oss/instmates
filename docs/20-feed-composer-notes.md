# Social + technical feed composer: implementation notes

**Branch:** `feature/social-technical-feed-composer` from main b843a8e (post-W1.2). Feed page only. No rules, Storage rules, indexes, schema, Functions or production-data change. The approved Community Feed mockup was used as direction from the owner's written brief (no mockup file exists in either repository or locally).

## What changed

| File | Change |
|---|---|
| `public/assets/js/composer-model.js` (new) | Pure, node-testable model: `POST_TYPES` (the four types `firestore.rules` accepts, each with label, hint, contextual prompt, badge), `UNSUPPORTED_POST_TYPES` (Case Study, Knowledge, General — blocked by the rules `type` allow-list), `MEDIA_ACTIONS`, `LIMITS` (1000 chars, 5 tags, 20 MB), `parseTags` (moved from feed.js, same behaviour), `countTags`, `addTag`, `tagSuggestions()` (canonical taxonomy only), `validateDraft`, submit-state machine, `postBodyHtml`. |
| `public/feed/index.html` | Dropdown-first form replaced by the composer: post-type chips (`role="radiogroup"`, arrow-key selection, ✓ + border/background selected state), labelled textarea with the social prompt, media action row (Photo / Video / PDF driving the single existing file input), attachment preview with Remove, tag input with count and taxonomy suggestion chips, live character counter, status line (`role="status"`), primary Post button with states. Feed-card CSS: `.feed-image` now `object-fit: contain`, natural aspect ratio, max-height 640 px, and outranks the sitewide `.card img { height:160px; object-fit:cover }`. Mobile: the legacy sitewide rule that hid `#postInput/#postTags/#postBtn` at ≤768 px is overridden on this page so the composer works on a phone; suggestions become one scrollable row. Script version bumped to `feed.js?v=2026-09-07`. |
| `public/assets/js/feed.js` | Composer wiring (chips → hidden `#postType`, prompt per type, counter, preview, tag suggestions, submit states, duplicate-submission guard, error surfacing). The post document written is unchanged: `content, uid, type, attachment, createdAt, editedAt, reactions, votedBy, tags`; same Storage path and 20 MB limit; `requireLogin()` still gates every write. Post body rendered through `postBodyHtml` so an empty body renders nothing. |
| `public/assets/js/taxonomy.js` | Additive `tag` field on the 13 supported terms: the quick-suggestion text (label or an approved alias). Tests assert each normalises back to its own term, so there is no second vocabulary. |
| `site-tests/feed-composer.test.mjs` (new) | 11 tests (see below). |

## Post types

Supported and rendered: Question ("Need help?"), Fault Report ("Report an issue"), Solution ("Share a fix"), Calibration ("Share calibration experience"). Contextual prompts as specified.

Not rendered — Case Study, Knowledge, General: `firestore.rules` `posts.create` requires `type in ['question','fault','solution','calibration']`. Offering them would make every such post fail at the rules. Adding them is a rules/schema decision (extend the allow-list, decide badge/rendering, update the emulator suite). Nothing in the UI pretends they exist.

## Media

Photo / Video / PDF are the existing capabilities (single file input, `attachment.type` classification identical to before, rules accept `image|video|pdf|file`). Link, Poll, Feeling and Location from the mockup are not shown: Poll/Feeling/Location are FUTURE and no safe data model exists for Link, so no disabled or fake controls are rendered. Preview: image thumbnail via an object URL (released on remove/post), video and PDF show name/type/size; Remove clears the input.

## Feed-card blank-space fix

Cause: the card always rendered `<div class="feed-content">` even for empty content, and the sitewide `.card img { height:160px; object-fit:cover }` cropped every attachment to a 160 px strip. Now: body only when text exists; images keep their aspect ratio and full content (verified with a 1122×1402 production image: 513×640 desktop, 317×396 at 375 px).

## Tests (site suite 45/45; W1.1 16/16 included)

Post types equal the rules allow-list; unsupported types documented and absent; chips accessible; prompts; draft validation for text-only, image-only, text+image, video, PDF, empty, 1000/1001 boundary, 20 MB boundary, 6 tags, unauthenticated, unknown type; attachment classification vs rules; media actions; no FUTURE controls; tags (free text, max 5, de-dup, suggestions normalise to their terms); submit states, duplicate guard, error and login handling; write path still exactly the nine validated keys and the same Storage path; feed-card body/attachment rules; mobile override; no fake social features, technical reactions and comments preserved.

## Known limits / follow-ups

- Case Study / Knowledge / General types need a rules decision.
- Module imports (`composer-model.js`, `taxonomy.js`) are cached by the browser for up to an hour after deploy (sitewide 3600 s asset policy); returning visitors may see the composer without suggestion chips until then.
- The composer is ≈700 px tall on desktop and ≈770 px at 375 px; existing posts start after roughly one screen. A collapsed "Create a post" state is a possible later refinement.
