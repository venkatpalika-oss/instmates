// Homepage contract tests for /public/index.html, /public/assets/js/home.js and the shared includes.
// Run: npm --prefix site-tests test   (from the repository root; no emulator, no network)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { TERMS, COVERAGE, HUB_MIN_RESOURCES, NAVIGATION, termBySlug } from "../public/assets/js/taxonomy.js";
import { RESOURCES, resourcesFor, entryResource, resourcesUnder } from "../public/assets/js/content-map.js";
import {
  HOME_LIMITS, POST_TYPE_LABELS, learnTopics, pathCount, caseCount, featuredCases, caseTopic,
  excerpt, relativeTime, discussionModel, personModel, plural
} from "../public/assets/js/home.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const HOME_HTML = readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8");
const HOME_JS = readFileSync(path.join(PUBLIC_DIR, "assets", "js", "home.js"), "utf8");
const HEADER_HTML = readFileSync(path.join(PUBLIC_DIR, "includes", "header.html"), "utf8");
const FOOTER_HTML = readFileSync(path.join(PUBLIC_DIR, "includes", "footer.html"), "utf8");
const STYLE_CSS = readFileSync(path.join(PUBLIC_DIR, "assets", "css", "style.css"), "utf8");
const YOUTUBE_CHANNEL = "https://www.youtube.com/@InstMates";
const LINKEDIN_COMPANY = "https://www.linkedin.com/company/144806016/";
/** Verified 2026-09-15 via YouTube oEmbed (author_url === YOUTUBE_CHANNEL). Titles verbatim. */
const VERIFIED_VIDEOS = {
  sMoZogBnM78: "Welcome to InstMates | The Community for Instrumentation & Analyzer Professionals",
  KgpdwauRuzI: "How Zirconia Oxygen Sensors Work | O₂ Analyzer Working Principle Explained",
  eFiWW86Z0VA: "Process Analyzer Safety Procedures | LOTO, Isolation & Safe Maintenance"
};
/** Visible copy only: no <style>, <script>, comments or tags. */
const visibleText = (html) => html
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");
const HOME_TEXT = visibleText(HOME_HTML);
/** home.js without comments. */
const HOME_CODE = HOME_JS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const HOME_STYLE = HOME_HTML.match(/<style>([\s\S]*?)<\/style>/)[1];

function resolveUrl(url) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean) return "anchor";
  const rel = clean.replace(/^\//, "");
  const candidates = clean.endsWith("/")
    ? [path.join(PUBLIC_DIR, rel, "index.html"), path.join(PUBLIC_DIR, rel.replace(/\/$/, "") + ".html")]
    : [path.join(PUBLIC_DIR, rel + ".html"), path.join(PUBLIC_DIR, rel, "index.html"), path.join(PUBLIC_DIR, rel)];
  return candidates.find((f) => existsSync(f)) || null;
}

/** All href values inside an HTML fragment, in document order. */
function hrefs(html) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

/** The inner HTML of the first element carrying data-home="<name>". */
function slotHtml(name) {
  const re = new RegExp(`<ul[^>]*data-home="${name}"[^>]*>([\\s\\S]*?)</ul>`);
  const m = HOME_HTML.match(re);
  assert.ok(m, `slot ${name} missing from index.html`);
  return m[1];
}

function sectionHtml(id) {
  const re = new RegExp(`<(?:section|aside) id="${id}"[\\s\\S]*?</(?:section|aside)>`);
  const m = HOME_HTML.match(re);
  assert.ok(m, `section #${id} missing from index.html`);
  return m[0];
}

/** Every <img ...> tag with its attributes parsed. */
function images(html) {
  return [...html.matchAll(/<img\b([^>]*)>/g)].map((m) => {
    const attrs = {};
    for (const a of m[1].matchAll(/([a-z-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    return attrs;
  });
}

const existingNav = (group) => group.destinations.filter((d) => d.status === "existing");
const localFile = (url) => path.join(PUBLIC_DIR, url.replace(/^\//, ""));

// ---------------------------------------------------------------- static structure
test("home: every internal link resolves to a real page (no dead links, no unpublished W1/FUTURE routes)", () => {
  const internal = hrefs(HOME_HTML).filter((h) => h.startsWith("/") || h.startsWith("#"));
  assert.ok(internal.length > 25, "homepage should carry its primary links statically");
  for (const h of internal) {
    if (h.startsWith("#")) {
      assert.ok(HOME_HTML.includes(`id="${h.slice(1)}"`), `anchor ${h} has no target`);
      continue;
    }
    assert.ok(resolveUrl(h), `dead link on homepage: ${h}`);
  }
  for (const g of [NAVIGATION.solve, NAVIGATION.learn, NAVIGATION.connect]) {
    for (const d of g.destinations.filter((x) => x.status !== "existing" && x.href)) {
      const base = d.href.replace(/<.*$/, "");
      // A W1/FUTURE prefix may only appear when the concrete page is published (e.g. the GC hub).
      for (const h of internal.filter((x) => x.startsWith(base))) {
        assert.ok(resolveUrl(h), `homepage links an unpublished ${d.status} route: ${h}`);
      }
      assert.ok(!HOME_JS.includes(base), `home.js references a ${d.status} route: ${d.href}`);
    }
  }
  const ids = [...HOME_HTML.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.filter((v, i) => ids.indexOf(v) !== i)}`);
});

test("home: SOLVE grid renders exactly the EXISTING troubleshooting destinations; no feed invitation while P1.2 is open", () => {
  const grid = hrefs(slotHtml("solve"));
  const contract = existingNav(NAVIGATION.solve)
    .filter((d) => !d.auth)
    .map((d) => d.href)
    .filter((href) => {
      const res = RESOURCES.find((r) => r.path === href);
      return !res || res.kind !== "index"; // index pages (Case studies) are CTAs, not grid entries
    });
  assert.deepEqual([...grid].sort(), [...contract].sort());
  assert.equal(new Set(grid).size, grid.length, "duplicate SOLVE entries");
  const solve = sectionHtml("solve");
  assert.ok(solve.includes('href="/case-studies/"'), "SOLVE must lead to case studies");
  assert.ok(!solve.includes('href="/feed/"'), "SOLVE must not invite posting in the feed (P1.2 open)");
  // The feed is reachable for READING from CONNECT and for members from the signed-in block only.
  assert.equal((HOME_HTML.match(/href="\/feed\/"/g) || []).length, 2, "exactly two feed links: CONNECT read + signed-in continue");
  assert.doesNotMatch(HOME_TEXT, /ask a technical question|ask about your fault|login to post/i, "no repeated ask-in-the-feed invitations");
});

test("home: LEARN renders every EXISTING learn destination and only real learning paths", () => {
  const learn = sectionHtml("learn");
  const paths = hrefs(learn.match(/<ul class="hm-grid hm-paths[^"]*">[\s\S]*?<\/ul>/)[0]);
  for (const d of existingNav(NAVIGATION.learn)) {
    assert.ok(HOME_HTML.includes(`href="${d.href}"`), `LEARN destination missing: ${d.href}`);
  }
  for (const p of paths) {
    const res = RESOURCES.find((r) => r.path === p);
    assert.ok(res && res.kind === "index", `learning path must be a mapped index page: ${p}`);
    assert.ok(resourcesUnder(p).length >= HUB_MIN_RESOURCES, `learning path ${p} has too few pages`);
  }
  for (const span of learn.matchAll(/data-path="([^"]+)"/g)) {
    assert.ok(paths.includes(span[1]), `path-count slot for unknown path ${span[1]}`);
  }
});

test("home: CONNECT renders the EXISTING public destinations and never implies future capabilities", () => {
  const connect = sectionHtml("connect");
  for (const href of ["/feed/", "/profiles/"]) assert.ok(connect.includes(`href="${href}"`), `CONNECT lacks ${href}`);
  // FUTURE destinations of the contract (people by technology, messaging, follow/save) must not be promised.
  assert.equal(NAVIGATION.connect.destinations.filter((x) => x.status === "future").length, 3, "contract still lists three FUTURE capabilities");
  const withoutLinkedIn = visibleText(HOME_HTML.replace(/<div class="hm-social"[\s\S]*?<\/div>\s*<\/section>/, "</section>"));
  assert.doesNotMatch(withoutLinkedIn, /by technology|people matching|\bfollow\b|save for later|\bmessag(e|ing)\b|\bmatched\b|recommended|endorse|\bbadges?\b|trending|online now|\bverified\b/i);
});

test("home: copy carries the approved tagline, no inflated or fabricated claims, no hard-coded community numbers", () => {
  assert.ok(HOME_HTML.includes("Share Technology · Learn Techniques · Grow Together"), "tagline missing");
  assert.doesNotMatch(HOME_TEXT, /largest|leading platform|thousands|trusted worldwide|active community|private network|private social|fastest.growing|world.class|#1\b/i);
  assert.doesNotMatch(HOME_TEXT, /\b\d+\s*(posts|discussions|comments|members|engineers|technicians|professionals|profiles|users|videos|subscribers|views)\b/i, "community counts must come from data, not copy");
  assert.doesNotMatch(HOME_TEXT, /\b\d+\s*%/, "no percentage claims");
  assert.doesNotMatch(HOME_TEXT, /coming soon|placeholder|lorem|AI[- ]powered|smart search|search a fault|everything technical is open/i);
  assert.doesNotMatch(HOME_HTML, /<input\b|<form\b|type="search"/, "no search box: the site has no search implementation");
  assert.ok(HOME_TEXT.includes("Explore practical instrumentation guides and field case studies."), "CTO hero note verbatim");
  assert.doesNotMatch(HOME_TEXT, /only needed to post|account is for taking part/i, "no open-to-read / account-to-post claim");
  // CONTRIBUTE for anonymous visitors: registration stays available, but nothing promises that a new
  // account can post, comment or share in the feed (P1.2 open).
  const anonContribute = visibleText(sectionHtml("contribute").match(/<div class="auth-out-section">[\s\S]*?<\/div>\s*<!-- Signed-in/)[0]);
  assert.doesNotMatch(anonContribute, /post a|comment|share a solution|share experience|in the feed|discussion/i, "no feed-contribution promise near Join free");
  assert.match(anonContribute, /Join free/);
});

test("home: one h1, landmarks, labelled sections and accessible heading order", () => {
  assert.equal((HOME_HTML.match(/<h1\b/g) || []).length, 1);
  assert.ok(/<main\b[^>]*id="main"/.test(HOME_HTML));
  assert.ok(/<nav class="hm-pathway" aria-label="How InstMates works">/.test(HOME_HTML));
  for (const id of ["solve", "learn", "connect", "watch", "contribute"]) {
    assert.ok(new RegExp(`<section id="${id}"[^>]*aria-labelledby="${id}-title"`).test(HOME_HTML), `#${id} not labelled`);
    assert.ok(new RegExp(`<h2 id="${id}-title"`).test(HOME_HTML));
  }
  assert.ok(/<aside id="field"[^>]*aria-labelledby="field-title"/.test(HOME_HTML), "From the field aside not labelled");
  const levels = [...HOME_HTML.matchAll(/<h([1-3])\b/g)].map((m) => Number(m[1]));
  let prev = 0;
  for (const level of levels) {
    assert.ok(level <= prev + 1, `heading level jumps to h${level} after h${prev}`);
    prev = level;
  }
  assert.ok(/:focus-visible\{outline/.test(HOME_HTML), "visible focus style missing");
  assert.ok(/prefers-reduced-motion/.test(HOME_HTML));
  assert.ok(/max-width:768px/.test(HOME_HTML), "mobile layout rules missing");
  for (const m of HOME_HTML.matchAll(/<svg[^>]*>/g)) {
    const own = /aria-hidden="true"|role="img"/.test(m[0]);
    const wrapped = /aria-hidden="true">\s*$/.test(HOME_HTML.slice(Math.max(0, m.index - 80), m.index));
    assert.ok(own || wrapped, `decorative icon must be hidden from AT: ${m[0].slice(0, 60)}`);
  }
  for (const a of HOME_HTML.matchAll(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g)) {
    assert.match(a[0], /rel="noopener noreferrer"/, "external link without noopener");
    assert.match(a[0], /opens in a new tab/, "external link without an accessible new-tab indication");
  }
});

test("home: SEO metadata kept (canonical, description, social, structured data, robots-safe)", () => {
  assert.ok(HOME_HTML.includes('<link rel="canonical" href="https://www.instmates.com/" />'));
  assert.ok(/<meta name="description"\s+content="[^"]{60,}"/.test(HOME_HTML));
  for (const key of ['property="og:title"', 'property="og:description"', 'property="og:url"', 'property="og:image"', 'name="twitter:card"']) {
    assert.ok(HOME_HTML.includes(key), `${key} missing`);
  }
  assert.doesNotMatch(HOME_HTML, /name="robots"/, "homepage must stay indexable");
  const ld = HOME_HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ld, "structured data missing");
  const data = JSON.parse(ld[1]);
  const types = data["@graph"].map((n) => n["@type"]);
  assert.deepEqual(types.sort(), ["Organization", "WebSite"]);
  assert.ok(!JSON.stringify(data).match(/aggregateRating|ratingValue|reviewCount|interactionStatistic|SearchAction/), "no fabricated ratings, counts or search action");
  assert.ok(HOME_HTML.includes('src="https://www.googletagmanager.com/gtag/js?id=G-L57QYT7H9F"'), "existing analytics tag kept");
  assert.equal((HOME_HTML.match(/gtag\('event'/g) || []).length, 0, "no new analytics events");
  const sitemap = readFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes("<loc>https://www.instmates.com/</loc>"));
});

test("home: no second taxonomy, no legacy scripts, no denied collections, no third-party scripts or embeds", () => {
  assert.doesNotMatch(HOME_HTML, /data-slug=|data-term=/, "index.html must not carry taxonomy data");
  assert.doesNotMatch(HOME_JS, /\bterm\(|export const TERMS|coverage:\s*"/, "home.js must not define taxonomy terms");
  assert.ok(HOME_JS.includes('from "./taxonomy.js"') && HOME_JS.includes('from "./content-map.js"'));
  assert.doesNotMatch(HOME_HTML, /case-ticker\.js|caseTickerTrack/, "caseStudies collection is denied by rules; ticker must not return");
  assert.doesNotMatch(HOME_JS, /collection\(db, "(users|caseStudies|questions|answers)"\)/);
  assert.doesNotMatch(HOME_CODE, /\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML\(|document\.write\(/, "user data must be rendered with textContent");
  const scriptSrcs = [...HOME_HTML.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(scriptSrcs.filter((s) => /^https?:/.test(s)), ["https://www.googletagmanager.com/gtag/js?id=G-L57QYT7H9F"], "no new third-party scripts");
  assert.equal((HOME_HTML.match(/<video\b|<iframe\b|<object\b|<embed\b/g) || []).length, 0, "no video, iframe, object or embed element");
  const external = [...HOME_HTML.matchAll(/(?:href|src|srcset)="(https?:\/\/[^"\s]+)/g)].map((m) => m[1])
    .filter((u) => !/^https:\/\/(www\.instmates\.com|fonts\.googleapis\.com|www\.googletagmanager\.com|schema\.org)/.test(u));
  assert.deepEqual([...new Set(external)].sort(), [
    LINKEDIN_COMPANY,
    YOUTUBE_CHANNEL,
    ...Object.keys(VERIFIED_VIDEOS).map((id) => `https://www.youtube.com/watch?v=${id}`)
  ].sort(), "only the official channel, the three verified videos and the LinkedIn page are external");
});

test("home: community reads are the existing safe public reads only (no writes, no new index, public filter present)", () => {
  assert.ok(HOME_JS.includes('fs.where("profileStatus.isPublic", "==", true)'), "profiles query must carry the public filter");
  assert.doesNotMatch(HOME_JS, /orderBy\("profile|fs\.orderBy\([^)]*\)\s*,\s*fs\.where|where\([^)]*\)[\s\S]{0,80}orderBy\(/, "no composite profile queries");
  assert.doesNotMatch(HOME_JS, /addDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction|onSnapshot/, "read-only, one-shot reads");
  assert.ok(HOME_JS.includes("fs.limit(HOME_LIMITS.discussions)") && HOME_JS.includes("fs.limit(HOME_LIMITS.people)"));
  assert.ok(HOME_LIMITS.discussions <= 5 && HOME_LIMITS.people <= 8, "rails stay small");
  assert.ok(HOME_JS.includes("No discussions yet") && HOME_JS.includes("No public profiles yet"), "honest zero states");
  assert.ok(HOME_JS.includes("could not be loaded right now"), "honest failure state");
});

// ---------------------------------------------------------------- data model
test("taxonomy: entry points are declared only for SUPPORTED measurement/technology terms and resolve to a mapped page about that term", () => {
  for (const t of TERMS) {
    const shouldHave = t.facet !== "activity" && t.coverage === COVERAGE.SUPPORTED;
    assert.equal(!!t.entry, shouldHave, `${t.slug}: entry ${t.entry} vs coverage ${t.coverage}`);
    if (!t.entry) continue;
    assert.ok(resolveUrl(t.entry), `${t.slug}: entry ${t.entry} does not exist on disk`);
    const res = entryResource(t.slug);
    assert.ok(res, `${t.slug}: entry is not a mapped resource`);
    assert.ok(res.measurement.includes(t.slug) || res.technology.includes(t.slug), `${t.slug}: entry page is not about the term`);
  }
});

test("home: LEARN topics expose every supported term and never a partial or uncovered one", () => {
  const topics = learnTopics();
  const supported = TERMS.filter((t) => t.facet !== "activity" && t.coverage === COVERAGE.SUPPORTED).map((t) => t.slug).sort();
  assert.deepEqual(topics.map((t) => t.slug).sort(), supported);
  for (const topic of topics) {
    const term = termBySlug(topic.slug);
    assert.equal(term.coverage, COVERAGE.SUPPORTED);
    assert.ok(topic.pages >= HUB_MIN_RESOURCES);
    assert.equal(topic.pages, resourcesFor(topic.slug).length, "page count must be the real mapped count");
    assert.ok(resolveUrl(topic.href), `topic href missing: ${topic.href}`);
    assert.ok(topic.label.length > 1);
  }
  const exposed = new Set(topics.map((t) => t.slug));
  for (const t of TERMS.filter((t) => t.coverage !== COVERAGE.SUPPORTED)) {
    assert.ok(!exposed.has(t.slug), `${t.slug} (${t.coverage}) must not be exposed as covered`);
  }
});

test("home: learning-path counts and case counts are derived from the content map", () => {
  for (const prefix of ["/knowledge/field/", "/knowledge/analyzers/", "/knowledge/gc/", "/knowledge/laboratory/"]) {
    assert.equal(pathCount(prefix), RESOURCES.filter((r) => r.kind !== "index" && r.path.startsWith(prefix)).length);
    assert.ok(pathCount(prefix) >= HUB_MIN_RESOURCES, `${prefix} too thin to promote`);
  }
  assert.equal(caseCount(), RESOURCES.filter((r) => r.kind === "case").length);
  assert.ok(caseCount() > 0);
});

test("home: featured cases are deterministic, real, distinct by topic and resolve on disk", () => {
  const a = featuredCases();
  const b = featuredCases();
  assert.deepEqual(a.map((r) => r.path), b.map((r) => r.path), "selection must be deterministic");
  assert.equal(a.length, HOME_LIMITS.cases);
  const keys = new Set();
  for (const res of a) {
    assert.equal(res.kind, "case");
    assert.ok(resolveUrl(res.path), `featured case missing on disk: ${res.path}`);
    const key = res.technology[0] || res.measurement[0];
    assert.ok(key && !keys.has(key), "featured cases must cover different topics");
    keys.add(key);
    assert.ok(caseTopic(res).length > 0);
  }
  assert.equal(featuredCases(1).length, 1);
});

test("home: discussion model is honest — stored counters only, safe excerpt, no author lookup, unknown types fall back", () => {
  const now = new Date("2026-09-07T00:00:00Z");
  const docs = [
    { id: "a", data: { type: "fault", content: "  Loop   reads 3.2 mA <script>alert(1)</script> " + "x".repeat(300), reactions: { agree: 1, faced: "2", helpful: 2 }, createdAt: { toDate: () => new Date("2026-09-06T23:00:00Z") } } },
    { id: "b", data: { type: "not-a-type", content: null, reactions: null, createdAt: null } },
    { id: "c", data: {} }
  ];
  const items = discussionModel(docs);
  assert.equal(items.length, 3);
  assert.equal(items[0].label, POST_TYPE_LABELS.fault);
  assert.equal(items[0].reactions, 3, "non-numeric counters are ignored, nothing is invented");
  assert.ok(items[0].text.length <= HOME_LIMITS.excerpt && items[0].text.endsWith("…"));
  assert.ok(items[0].text.startsWith("Loop reads 3.2 mA <script>"), "excerpt is plain text; rendering must escape via textContent");
  assert.equal(items[1].label, "Question");
  assert.equal(items[1].text, "");
  assert.equal(items[1].reactions, 0);
  assert.equal(items[2].createdAt, null);
  assert.equal(relativeTime(items[0].createdAt, now), "1 h ago");
  assert.equal(relativeTime(null), "");
  assert.equal(excerpt("short"), "short");
  assert.equal(discussionModel([]).length, 0, "zero posts → zero items → sparse state");
  assert.ok(!Object.keys(items[0]).includes("author") && !Object.keys(items[0]).includes("uid"), "no author data on the homepage rail");
});

test("home: person model exposes only the public directory fields", () => {
  const p = personModel("uid-1", { basicInfo: { fullName: "A", headline: "H", profilePhoto: "x" }, professional: { specialization: "S", analyzersWorked: ["Z"] }, email: "e@x" });
  assert.deepEqual(Object.keys(p).sort(), ["headline", "name", "specialization", "uid"]);
  assert.deepEqual(personModel("u", {}), { uid: "u", name: "Technician", headline: "", specialization: "" });
  assert.equal(personModel("u", { fullName: "Legacy", role: "R", primaryDomain: "D" }).headline, "R");
  assert.equal(plural(1, "page"), "1 page");
  assert.equal(plural(2, "documented case", "documented cases"), "2 documented cases");
});

// ---------------------------------------------------------------- light technical canvas hero (2026-09-15 concept + illustrations)
const HERO_RAW = HOME_HTML.match(/<section class="hm-hero[^"]*"[\s\S]*?<\/section>/)[0];
const HERO_MARKUP = HERO_RAW.replace(/<!--[\s\S]*?-->/g, "");

test("hero: light technical canvas — homepage-scoped block, approved copy, no pattern, no video, retired media unused", () => {
  assert.ok(HERO_MARKUP, "hero block missing");
  assert.ok(!/class="hero[ "]/.test(HOME_HTML), "homepage must not use the sitewide patterned .hero component");
  assert.ok(HERO_MARKUP.includes('<h1 id="hm-title">Solve field problems. Build practical knowledge.</h1>'), "H1 must stay verbatim");
  assert.ok(HERO_MARKUP.includes("Share Technology · Learn Techniques · Grow Together."), "tagline must stay verbatim");
  assert.match(HERO_MARKUP, /<p class="hm-support">[^<]{40,220}<\/p>/, "one short supporting sentence");
  assert.doesNotMatch(HOME_HTML, /instmates-hero\.mp4|hero-poster\.jpg|avatar\.mp4/, "no runtime reference to the retired hero media");
  assert.equal(
    (HOME_HTML.match(/hero-instrumentation\.jpg/g) || []).length,
    (HOME_HTML.match(/<meta[^>]*hero-instrumentation\.jpg/g) || []).length,
    "the social preview image stays a meta-only reference, never rendered"
  );
  assert.doesNotMatch(HOME_JS, /instmates-hero|hero-poster|HeroVideo|<video/, "home.js carries no hero-video logic");
  assert.doesNotMatch(HOME_TEXT, /HeyGen/i);
  const heroRule = HOME_HTML.match(/\.hm-hero\{[^}]*\}/);
  assert.ok(heroRule, "hero CSS rule present");
  assert.doesNotMatch(heroRule[0], /url\(|gradient/, "no pattern or gradient behind the copy");
});

test("hero: primary action is knowledge exploration, secondary is case studies, real topic chips replace the search box", () => {
  assert.ok(HERO_MARKUP.includes('<a href="/knowledge/" class="hm-btn hm-btn-primary">'), "primary CTA → /knowledge/");
  assert.ok(/Explore technical knowledge\s*<\/a>/.test(HERO_MARKUP), "primary CTA copy");
  assert.ok(HERO_MARKUP.includes('<a href="/case-studies/" class="hm-btn hm-btn-outline">Read real case studies</a>'), "secondary CTA → /case-studies/");
  assert.equal((HERO_MARKUP.match(/class="hm-btn /g) || []).length, 2, "exactly two hero CTAs");
  assert.ok(!HERO_MARKUP.includes('href="/feed/"'), "hero does not point at the feed while P1.2 is open");
  assert.match(HOME_HTML.match(/\.hm-btn\{[^}]*\}/)[0], /min-height:46px/, "CTAs are ≥44px targets");
  const start = HERO_MARKUP.match(/<nav class="hm-start"[\s\S]*?<\/nav>/);
  assert.ok(start, "Start with a topic links missing");
  const topicHrefs = new Set(learnTopics().map((t) => t.href));
  const links = hrefs(start[0]);
  assert.ok(links.length >= 5 && links.length <= 8, "a short list of entry points");
  for (const h of links) assert.ok(topicHrefs.has(h), `start link is not a supported topic entry: ${h}`);
});

test("hero: illustration contract — owner-supplied WebP, responsive, dimensioned, not lazy, same-origin, decorative, blended without a frame", () => {
  const fig = HERO_MARKUP.match(/<figure class="hm-hero-figure">([\s\S]*?)<\/figure>/);
  assert.ok(fig, "hero figure missing");
  const img = images(fig[1])[0];
  assert.ok(img, "hero img missing");
  assert.equal(img.width, "1536");
  assert.equal(img.height, "1024");
  assert.equal(img.fetchpriority, "high");
  assert.equal(img.alt, "", "decorative illustration: empty alt");
  assert.ok(!("loading" in img), "hero image is never lazy-loaded");
  assert.ok(img.sizes && img.sizes.includes("100vw"), "sizes attribute present");
  const sources = [img.src, ...img.srcset.split(",").map((s) => s.trim().split(/\s+/)[0])];
  assert.equal(new Set(sources).size, 4, "four responsive variants");
  for (const src of sources) {
    assert.ok(src.startsWith("/assets/images/illustrations/hero-transmitter-analyzer-"), `same-origin illustration: ${src}`);
    assert.ok(src.endsWith(".webp"));
    assert.ok(existsSync(localFile(src)), `missing on disk: ${src}`);
    assert.ok(statSync(localFile(src)).size <= 95_000, `hero variant too heavy: ${src}`);
  }
  const imgRule = HOME_STYLE.match(/\.hm-hero-figure img\{[^}]*\}/)[0];
  assert.match(imgRule, /object-fit:contain/, "complete silhouettes");
  assert.match(imgRule, /aspect-ratio:3\/2/, "reserved aspect ratio (no layout shift)");
  assert.doesNotMatch(imgRule, /border(?!-radius)|box-shadow|background/, "no frame or panel behind the illustration");
  assert.doesNotMatch(HOME_STYLE.match(/\.hm-hero-figure\{[^}]*\}/)[0], /border|box-shadow|background/, "figure has no frame either");
  assert.match(HOME_STYLE, /@media \(max-width:1024px\)\{[^}]*\.hm-hero\{grid-template-columns:1fr/, "stacks on narrow screens");
  assert.match(HOME_STYLE, /\.hm-hero-figure\{order:2/, "image follows the headline and actions on mobile");
  assert.ok(existsSync(path.join(ROOT, "docs", "assets", "homepage-illustrations.md")), "provenance note present outside public/");
});

test("learn: the sampling-system illustration links the verified sampling-systems entry, is labelled as an illustration and lazy-loaded", () => {
  const learn = sectionHtml("learn");
  const feature = learn.match(/<a class="hm-card hm-feature"[\s\S]*?<\/a>/);
  assert.ok(feature, "feature card missing");
  const entry = termBySlug("sampling-systems").entry;
  assert.ok(feature[0].includes(`href="${entry}"`), `feature must link the sampling-systems entry ${entry}`);
  assert.ok(resolveUrl(entry));
  const img = images(feature[0])[0];
  assert.equal(img.loading, "lazy");
  assert.equal(img.width, "1536");
  assert.equal(img.height, "1024");
  assert.ok(img.alt.length > 30 && /illustration/i.test(img.alt), "descriptive alt that says it is an illustration");
  for (const src of [img.src, ...img.srcset.split(",").map((s) => s.trim().split(/\s+/)[0])]) {
    assert.ok(src.startsWith("/assets/images/illustrations/sample-conditioning-panel-") && existsSync(localFile(src)), `missing: ${src}`);
    assert.ok(statSync(localFile(src)).size <= 60_000, `panel variant too heavy: ${src}`);
  }
  assert.match(feature[0], /<figcaption>Illustration<\/figcaption>/);
  assert.doesNotMatch(visibleText(feature[0]), /GC8000|case study|installation|actual|real plant/i, "never presented as a documented case or a real site");
});

test("pathway: SOLVE → LEARN → CONNECT → CONTRIBUTE in order, each anchored to a real section", () => {
  const nav = HOME_HTML.match(/<nav class="hm-pathway"[\s\S]*?<\/nav>/)[0];
  const steps = [...nav.matchAll(/<a href="#([a-z]+)">[\s\S]*?<strong>([^<]+)<\/strong>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(steps, [["solve", "Solve"], ["learn", "Learn"], ["connect", "Connect"], ["contribute", "Contribute"]]);
  for (const [id] of steps) assert.ok(HOME_HTML.includes(`<section id="${id}"`), `anchor target #${id} missing`);
  assert.doesNotMatch(HOME_HTML, /hm-promise|hm-model/, "old promise strip and hero model line removed");
});

test("from the field: the featured case is the first deterministic pick of the content map, linked to a real page", () => {
  const field = sectionHtml("field");
  const first = featuredCases()[0];
  assert.ok(field.includes(`href="${first.path}"`), "featured case link must be featuredCases()[0]");
  assert.ok(field.includes(`>${first.title}</a>`), "featured case title must match the content map verbatim");
  assert.ok(field.includes(`Case study · ${caseTopic(first)}`), "topic label from the taxonomy");
  assert.ok(field.includes('href="/case-studies/"'));
  assert.ok(field.includes('data-home="case-count"'), "count comes from data, not copy");
  assert.ok(resolveUrl(first.path));
  assert.equal(images(field).length, 0, "no image exists for this case; none is invented");
});

test("watch & learn: three verified InstMates videos with their own local thumbnails, plain new-tab links, plus the channel link", () => {
  const watch = sectionHtml("watch");
  const cards = [...watch.matchAll(/<a class="hm-card hm-video" href="https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, 3, "exactly three video cards");
  assert.deepEqual(cards.map((c) => c[1]).sort(), Object.keys(VERIFIED_VIDEOS).sort(), "only the verified video ids");
  for (const [tag, id, body] of cards) {
    assert.match(tag, /target="_blank"/);
    assert.match(tag, /rel="noopener noreferrer"/);
    const title = visibleText(body.match(/<span class="hm-video-title">([\s\S]*?)<\/span>/)[1]).trim();
    assert.equal(title, VERIFIED_VIDEOS[id], `published title for ${id}`);
    const img = images(body)[0];
    assert.equal(img.loading, "lazy");
    assert.equal(img.width, "1280");
    assert.equal(img.height, "720");
    for (const src of [img.src, ...img.srcset.split(",").map((s) => s.trim().split(/\s+/)[0])]) {
      assert.ok(src.startsWith(`/assets/images/videos/yt-${id}-`), `thumbnail must belong to ${id}: ${src}`);
      assert.ok(existsSync(localFile(src)), `thumbnail missing on disk: ${src}`);
      assert.ok(statSync(localFile(src)).size <= 110_000, `thumbnail too heavy: ${src}`);
    }
    assert.match(body, /class="hm-play" aria-hidden="true"/, "play icon overlay");
    assert.match(body, /opens in a new tab/, "accessible new-tab indication");
  }
  assert.match(watch, new RegExp(`<a class="hm-more" href="${YOUTUBE_CHANNEL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" target="_blank" rel="noopener noreferrer">View all videos on YouTube`));
  assert.doesNotMatch(HOME_HTML, /youtube\.com\/embed|youtube-nocookie|ytimg\.com|youtu\.be|\/iframe_api|player\.js/, "no embeds, hotlinked thumbnails or player scripts");
  assert.doesNotMatch(visibleText(watch), /\b\d+(\.\d+)?[KkMm]?\s*(views|subscribers)\b|\b\d{1,2}:\d{2}\b/, "no invented durations, views or subscriber counts");
});

test("linkedin: official company page card near CONNECT with the approved copy, plain link, no embed", () => {
  const connect = sectionHtml("connect");
  const card = connect.match(/<div class="hm-social" id="linkedin">[\s\S]*?<\/div>\s*<\/section>|<div class="hm-social" id="linkedin">[\s\S]*?<\/a>\s*<\/div>/)[0];
  assert.ok(card.includes("<h3>Connect with InstMates on LinkedIn</h3>"));
  assert.ok(card.includes("Follow our technical posts, industry updates and community discussions."));
  assert.match(card, /<a class="hm-btn hm-btn-primary" href="https:\/\/www\.linkedin\.com\/company\/144806016\/" target="_blank" rel="noopener noreferrer">Follow InstMates on LinkedIn/);
  assert.doesNotMatch(HOME_HTML, /linkedin\.com\/company\/144806016\/admin|linkedin\.com\/in\//, "public company URL only, never the admin URL or a personal profile");
  assert.doesNotMatch(HOME_HTML, /platform\.linkedin\.com|linkedin\.com\/embed|li_sdk|IN\.init/, "no LinkedIn SDK, embed or tracking widget");
  assert.match(card, /opens in a new tab/);
});

test("motion: one-time, small, JS-gated entrances and restrained hover, all disabled under reduced motion, nothing hidden without JS", () => {
  assert.match(HOME_STYLE, /@keyframes hm-fade-up\{from\{opacity:0;transform:translateY\(8px\)\}/, "hero fade-in ≤8px");
  assert.match(HOME_STYLE, /\.hm-js \.hm-hero-figure\{animation:hm-fade-up \.45s ease both\}/, "hero fade 450ms, one-time");
  assert.match(HOME_STYLE, /\.hm-js \.hm-reveal\{opacity:0;transform:translateY\(8px\);transition:opacity \.35s ease,transform \.35s ease\}/, "section entrance 350ms ≤8px");
  assert.ok(!/(^|[^-])\.hm-reveal\{opacity:0/.test(HOME_STYLE.replace(/\.hm-js \.hm-reveal/g, "")), "sections are only hidden when the .hm-js gate is on (JS present)");
  assert.match(HOME_STYLE, /@media \(hover:hover\) and \(pointer:fine\)\{\s*\.hm-card:hover\{transform:translateY\(-2px\)/, "2px lift only for hover-capable pointers");
  assert.match(HOME_STYLE, /\.hm-card\{[^}]*transition:[^}]*\.18s/, "card transitions ~180ms");
  const reduced = HOME_STYLE.match(/@media \(prefers-reduced-motion:reduce\)\{([\s\S]*?)\n\}/)[1];
  assert.match(reduced, /animation:none!important/);
  assert.match(reduced, /\.hm-js \.hm-reveal\{opacity:1;transform:none\}/, "entrances removed under reduced motion");
  assert.match(reduced, /\.hm-card:hover\{transform:none/, "hover lift removed under reduced motion");
  assert.doesNotMatch(HOME_STYLE, /infinite|alternate|parallax|pulse|blink/i, "no continuous or pulsing animation");
  const motion = HOME_HTML.match(/<script>\s*\(function \(\) \{[\s\S]*?IntersectionObserver[\s\S]*?<\/script>/);
  assert.ok(motion, "inline motion script present");
  assert.match(motion[0], /prefers-reduced-motion: reduce/);
  assert.match(motion[0], /classList\.add\("hm-js"\)/);
  assert.match(motion[0], /io\.unobserve\(e\.target\)/, "each container animates once");
  // Fail-open contract: the gate goes on only after observation is wired; a silent observer or a
  // thrown error can never leave content hidden.
  assert.ok(motion[0].indexOf("io.observe(") < motion[0].indexOf('classList.add("hm-js")'), "gate added after observers are wired");
  assert.match(motion[0], /setTimeout\(function \(\) \{ if \(!fired\) \{ revealAll\(\); io\.disconnect\(\); \} \}, 1500\)/, "silent observer → reveal all");
  assert.match(motion[0], /catch \(err\) \{\s*root\.classList\.remove\("hm-js"\);\s*revealAll\(\);/, "error → gate removed, all revealed");
  assert.match(motion[0], /addEventListener\("change"/, "reduced-motion change while open reveals all");
  assert.doesNotMatch(HOME_HTML, /gsap|anime\.js|aos\.js|framer|lottie|scrollreveal/i, "no animation library");
});

test("hero: GC discovery entry still reaches the published hub", () => {
  const gc = learnTopics().find((t) => t.slug === "gas-chromatography");
  assert.equal(gc.href, "/technology/gas-chromatography/");
  assert.ok(resolveUrl(gc.href));
});

// ---------------------------------------------------------------- shared includes (header / footer)
test("header: primary navigation is SOLVE → LEARN → CONNECT → CONTRIBUTE on real routes, with the rest under More and the account menu intact", () => {
  const nav = HEADER_HTML.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0];
  const beforeMenus = nav.slice(0, nav.indexOf('<div class="nav-dropdown">'));
  const primary = [...beforeMenus.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[2], m[1]]);
  assert.deepEqual(primary, [["Solve", "/#solve"], ["Learn", "/knowledge/"], ["Connect", "/profiles/"], ["Contribute", "/#contribute"]]);
  assert.ok(HOME_HTML.includes('<section id="contribute"'), "Contribute target exists on the homepage");
  assert.ok(!nav.slice(0, nav.indexOf('<div class="nav-dropdown">')).includes('href="/feed/"'), "no primary nav item promises feed posting (P1.2 open)");
  for (const h of hrefs(nav).filter((x) => x.startsWith("/"))) {
    assert.ok(resolveUrl(h), `header links a missing page: ${h}`);
  }
  assert.ok(HOME_HTML.includes('<section id="solve"'), "Solve target exists on the homepage");
  for (const id of ["userMenuBtn", "myProfileLink", "editProfileLink", "logoutBtn"]) {
    assert.ok(nav.includes(`id="${id}"`), `header-auth.js hook #${id} missing`);
  }
  assert.ok(nav.includes('class="nav-dropdown user-menu"'), "account menu container kept");
  assert.ok(nav.includes('<span class="auth-out">') && nav.includes('<span class="auth-in">'), "auth toggles kept");
  assert.ok(nav.includes('href="/login.html" class="nav-cta"') && nav.includes('href="/register.html" class="nav-cta nav-cta-primary"'));
  assert.ok(nav.includes('aria-haspopup="true"'), "menu toggles announce a popup");
  assert.match(STYLE_CSS, /\.nav-dropdown:focus-within \.dropdown-menu\s*\{\s*display:\s*block/, "dropdowns open on keyboard focus");
  // Small screens hide .main-nav (style.css); a native <details> menu carries the same routes there.
  const mobile = HEADER_HTML.match(/<details class="mobile-menu">[\s\S]*?<\/details>/);
  assert.ok(mobile, "mobile <details> menu missing");
  assert.match(mobile[0], /<summary>Menu<\/summary>/);
  const mobileLinks = hrefs(mobile[0]);
  for (const h of ["/#solve", "/knowledge/", "/profiles/", "/#contribute", "/login.html", "/register.html"]) {
    assert.ok(mobileLinks.includes(h), `mobile menu lacks ${h}`);
  }
  assert.ok(!mobileLinks.includes("/feed/"), "mobile menu does not promise feed posting either");
  for (const h of mobileLinks.filter((x) => x.startsWith("/"))) assert.ok(resolveUrl(h), `mobile menu links a missing page: ${h}`);
  assert.doesNotMatch(mobile[0], /<script/, "menu must work without script (includes are innerHTML-injected)");
  const headerIds = [...HEADER_HTML.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(headerIds).size, headerIds.length, "duplicate ids in the header include");
});

test("footer: tagline, real site links, official YouTube and LinkedIn links with new-tab indication, legal links", () => {
  assert.ok(FOOTER_HTML.includes("Share Technology · Learn Techniques · Grow Together."));
  const links = FOOTER_HTML.match(/<nav class="footer-links"[\s\S]*?<\/nav>/)[0];
  for (const h of hrefs(links).filter((x) => x.startsWith("/"))) assert.ok(resolveUrl(h), `footer links a missing page: ${h}`);
  for (const url of [YOUTUBE_CHANNEL, LINKEDIN_COMPANY]) {
    const a = links.match(new RegExp(`<a href="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>[\\s\\S]*?</a>`));
    assert.ok(a, `footer lacks ${url}`);
    assert.match(a[0], /target="_blank" rel="noopener noreferrer"/);
    assert.match(a[0], /opens in a new tab/);
  }
  for (const h of ["/legal.html", "/privacy.html"]) assert.ok(FOOTER_HTML.includes(`href="${h}"`), `legal link ${h} missing`);
  assert.doesNotMatch(visibleText(FOOTER_HTML), /coming soon|placeholder/i);
  assert.match(STYLE_CSS, /\.sr-only\{/, "sr-only utility present for the new-tab text");
});

// ---------------------------------------------------------------- P1.1 — secondary (ghost) CTAs must be readable on the light technical canvas.
/** Declarations of the first rule whose selector line is exactly `selector`. */
const cssRule = (selector) => {
  const start = STYLE_CSS.split("\n").findIndex((line) => line.trim() === `${selector}{` || line.trim() === `${selector} {`);
  assert.ok(start >= 0, `rule ${selector} missing from style.css`);
  const body = STYLE_CSS.split("\n").slice(start + 1).join("\n");
  return body.slice(0, body.indexOf("}")).replace(/\/\*[\s\S]*?\*\//g, "");
};

test("ghost CTAs: the sitewide .btn-ghost rule is brand ink, not the inverted white treatment", () => {
  const ghost = cssRule(".btn-ghost");
  assert.match(ghost, /color:\s*var\(--brand-primary/, "text uses the brand primary colour");
  assert.match(ghost, /border:\s*1px solid var\(--brand-primary/, "border uses the brand primary colour");
  assert.doesNotMatch(ghost, /color:\s*#fff|rgba\(255,\s*255,\s*255/, "no white text or white border outside .hero");
  const hover = cssRule(".btn-ghost:hover");
  assert.doesNotMatch(hover, /rgba\(255,\s*255,\s*255/, "hover stays on the light canvas too");
});

test("ghost CTAs: the inverted treatment survives only inside the dark .hero surface", () => {
  const dark = cssRule(".hero .btn-ghost");
  assert.match(dark, /color:\s*#fff/, ".hero keeps white ghost text");
  assert.doesNotMatch(HOME_HTML, /class="hero[\s"]/, "the homepage no longer uses the dark .hero surface");
});

test("ghost CTAs: the homepage ghost CTAs keep the shared .btn-ghost class on the light canvas", () => {
  assert.ok(sectionHtml("solve").includes('<a href="/knowledge/" class="btn btn-ghost">Open the Knowledge Hub</a>'));
  assert.ok(sectionHtml("contribute").includes('<a href="/login.html" class="btn btn-ghost">Login</a>'));
  assert.ok(sectionHtml("connect").includes('<a href="/feed/" class="btn btn-ghost">Open the feed</a>'));
});
