// W1.2 homepage contract tests for /public/index.html and /public/assets/js/home.js.
// Run: npm --prefix site-tests test   (from the repository root; no emulator, no network)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { TERMS, COVERAGE, HUB_MIN_RESOURCES, NAVIGATION, termBySlug } from "../public/assets/js/taxonomy.js";
import { RESOURCES, resourcesFor, entryResource, resourcesUnder } from "../public/assets/js/content-map.js";
import {
  HOME_LIMITS, POST_TYPE_LABELS, learnTopics, pathCount, caseCount, featuredCases, caseTopic,
  excerpt, relativeTime, discussionModel, personModel, plural, shouldLoadHeroVideo
} from "../public/assets/js/home.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const HOME_HTML = readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8");
const HOME_JS = readFileSync(path.join(PUBLIC_DIR, "assets", "js", "home.js"), "utf8");
/** Visible copy only: no <style>, <script>, comments or tags. */
const HOME_TEXT = HOME_HTML
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");
/** home.js without comments. */
const HOME_CODE = HOME_JS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

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
  const re = new RegExp(`<section id="${id}"[\\s\\S]*?</section>`);
  const m = HOME_HTML.match(re);
  assert.ok(m, `section #${id} missing from index.html`);
  return m[0];
}

const existingNav = (group) => group.destinations.filter((d) => d.status === "existing");

// ---------------------------------------------------------------- static structure
test("home: every internal link resolves to a real page (no dead links, no W1/FUTURE routes)", () => {
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
      assert.ok(!HOME_HTML.includes(`href="${base}`), `homepage links a ${d.status} route: ${d.href}`);
      assert.ok(!HOME_JS.includes(base), `home.js references a ${d.status} route: ${d.href}`);
    }
  }
});

test("home: SOLVE grid renders exactly the EXISTING troubleshooting destinations of the navigation contract", () => {
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
  assert.ok(solve.includes('href="/feed/"'), "SOLVE must offer asking in the feed");
  assert.match(solve, /login to post/i, "asking requires login and must say so");
});

test("home: LEARN renders every EXISTING learn destination and only real learning paths", () => {
  const learn = sectionHtml("learn");
  const paths = hrefs(learn.match(/<ul class="hm-grid hm-paths">[\s\S]*?<\/ul>/)[0]);
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
  assert.doesNotMatch(HOME_TEXT, /by technology|people matching|\bfollow\b|save for later|\bmessag(e|ing)\b|\bmatched\b|recommended|endorse|\bbadges?\b|trending|online now|\bverified\b/i);
});

test("home: copy carries the approved tagline, no inflated or fabricated claims, no hard-coded community numbers", () => {
  assert.ok(HOME_HTML.includes("Share Technology · Learn Techniques · Grow Together"), "tagline missing");
  assert.doesNotMatch(HOME_TEXT, /largest|leading platform|thousands|trusted worldwide|active community|private network|private social|fastest.growing|world.class|#1\b/i);
  assert.doesNotMatch(HOME_TEXT, /\b\d+\s*(posts|discussions|comments|members|engineers|technicians|professionals|profiles|users)\b/i, "community counts must come from data, not copy");
  assert.doesNotMatch(HOME_TEXT, /\b\d+\s*%/, "no percentage claims");
  assert.doesNotMatch(HOME_TEXT, /coming soon|placeholder|lorem/i);
});

test("home: one h1, landmarks, labelled sections and accessible heading order", () => {
  assert.equal((HOME_HTML.match(/<h1\b/g) || []).length, 1);
  assert.ok(/<main\b[^>]*id="main"/.test(HOME_HTML));
  assert.ok(/<nav aria-label="What you can do on InstMates">/.test(HOME_HTML));
  for (const id of ["solve", "learn", "connect"]) {
    assert.ok(new RegExp(`<section id="${id}"[^>]*aria-labelledby="${id}-title"`).test(HOME_HTML), `#${id} not labelled`);
    assert.ok(new RegExp(`<h2 id="${id}-title"`).test(HOME_HTML));
  }
  const levels = [...HOME_HTML.matchAll(/<h([1-3])\b/g)].map((m) => Number(m[1]));
  let prev = 0;
  for (const level of levels) {
    assert.ok(level <= prev + 1, `heading level jumps to h${level} after h${prev}`);
    prev = level;
  }
  assert.ok(/:focus-visible\{outline/.test(HOME_HTML), "visible focus style missing");
  assert.ok(/prefers-reduced-motion/.test(HOME_HTML));
  assert.ok(/max-width:768px/.test(HOME_HTML), "mobile layout rules missing");
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
  assert.ok(!JSON.stringify(data).match(/aggregateRating|ratingValue|reviewCount|interactionStatistic/), "no fabricated ratings or counts");
  assert.ok(HOME_HTML.includes('src="https://www.googletagmanager.com/gtag/js?id=G-L57QYT7H9F"'), "existing analytics tag kept");
  assert.equal((HOME_HTML.match(/gtag\('event'/g) || []).length, 0, "no new analytics events in W1.2");
  const sitemap = readFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes("<loc>https://www.instmates.com/</loc>"));
});

test("home: no second taxonomy, no legacy scripts, no denied collections", () => {
  assert.doesNotMatch(HOME_HTML, /data-slug=|data-term=/, "index.html must not carry taxonomy data");
  assert.doesNotMatch(HOME_JS, /\bterm\(|export const TERMS|coverage:\s*"/, "home.js must not define taxonomy terms");
  assert.ok(HOME_JS.includes('from "./taxonomy.js"') && HOME_JS.includes('from "./content-map.js"'));
  assert.doesNotMatch(HOME_HTML, /case-ticker\.js|caseTickerTrack/, "caseStudies collection is denied by rules; ticker must not return");
  assert.doesNotMatch(HOME_JS, /collection\(db, "(users|caseStudies|questions|answers)"\)/);
  assert.doesNotMatch(HOME_CODE, /\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML\(|document\.write\(/, "user data must be rendered with textContent");
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

// ---------------------------------------------------------------- hero video (W1.2 addendum)
/** Top-level MP4 box types plus the sample-description codecs found inside moov. */
function mp4Boxes(buf) {
  const boxes = [];
  const walk = (start, end) => {
    let o = start;
    while (o + 8 <= end) {
      let size = buf.readUInt32BE(o);
      const type = buf.toString("latin1", o + 4, o + 8);
      let hdr = 8;
      if (size === 1) { size = Number(buf.readBigUInt64BE(o + 8)); hdr = 16; }
      if (size === 0) size = end - o;
      boxes.push(type);
      if (["moov", "trak", "mdia", "minf", "stbl"].includes(type)) walk(o + hdr, o + size);
      if (type === "stsd") boxes.push("codec:" + buf.toString("latin1", o + hdr + 12, o + hdr + 16));
      o += size;
    }
  };
  walk(0, buf.length);
  return boxes;
}

test("hero video: markup is a silent, inline, looping, deferred decoration with a poster fallback", () => {
  const video = HOME_HTML.match(/<video class="hm-hero-video"[\s\S]*?<\/video>/);
  assert.ok(video, "hero video element missing");
  const tag = video[0];
  for (const attr of ["muted", "playsinline", "loop", 'preload="none"', 'aria-hidden="true"']) {
    assert.ok(tag.includes(attr) || HOME_HTML.includes(`<div class="hm-hero-media" ${attr}`), `hero video lacks ${attr}`);
  }
  assert.ok(!/\bcontrols\b/.test(tag), "decorative video must not show controls");
  assert.ok(!/<source/.test(tag) && !/\ssrc=/.test(tag), "no eager source: home.js attaches data-src after window load");
  const poster = tag.match(/poster="([^"]+)"/)[1];
  const src = tag.match(/data-src="([^"]+)"/)[1];
  assert.ok(resolveUrl(poster), `poster missing on disk: ${poster}`);
  assert.ok(resolveUrl(src), `video missing on disk: ${src}`);
  assert.ok(poster.startsWith("/") && src.startsWith("/"), "same-origin assets only, no third-party video host");
  assert.ok(HOME_HTML.indexOf("<h1") < HOME_HTML.indexOf('<video class="hm-hero-video"'), "hero text precedes the video in the HTML");
  const text = sectionHtml("solve");
  assert.ok(text.length > 500 && HOME_TEXT.includes("Share Technology · Learn Techniques · Grow Together"), "positioning and SOLVE content stay in HTML");
});

test("hero video: optimized asset is small, faststart, H.264 and carries no audio track; poster is small", () => {
  const video = readFileSync(path.join(PUBLIC_DIR, "assets", "videos", "instmates-hero.mp4"));
  const poster = readFileSync(path.join(PUBLIC_DIR, "assets", "images", "home", "hero-poster.jpg"));
  assert.ok(video.length <= 1_200_000, `hero video too large for the homepage: ${video.length} bytes`);
  assert.ok(poster.length <= 80_000, `poster too large: ${poster.length} bytes`);
  assert.equal(poster.readUInt16BE(0), 0xffd8, "poster must be a JPEG");
  const boxes = mp4Boxes(video);
  assert.ok(boxes.indexOf("moov") < boxes.indexOf("mdat"), "moov must precede mdat (faststart)");
  assert.ok(boxes.includes("codec:avc1"), "video must be H.264 for broad playback");
  assert.ok(!boxes.includes("codec:mp4a") && !boxes.includes("smhd"), "no audio track: sound can never autoplay");
  assert.ok(!HOME_HTML.includes("/assets/videos/avatar.mp4"), "the 17 MB original must not be referenced");
  assert.ok(!existsSync(path.join(PUBLIC_DIR, "assets", "videos", "avatar.mp4")), "the 17 MB original must not be deployed (history keeps it)");
});

test("hero video: loader respects reduced motion, narrow viewports and slow connections; service worker never intercepts media", () => {
  assert.equal(shouldLoadHeroVideo({}), true);
  assert.equal(shouldLoadHeroVideo({ reducedMotion: true }), false);
  assert.equal(shouldLoadHeroVideo({ narrow: true }), false);
  assert.equal(shouldLoadHeroVideo({ saveData: true }), false);
  assert.equal(shouldLoadHeroVideo({ effectiveType: "2g" }), false);
  assert.equal(shouldLoadHeroVideo({ effectiveType: "slow-2g" }), false);
  assert.equal(shouldLoadHeroVideo({ effectiveType: "4g" }), true);
  assert.ok(HOME_CODE.includes('window.addEventListener("load", start'), "source attaches after window load");
  assert.ok(HOME_CODE.includes("video.muted = true"), "muted is forced before play");
  assert.doesNotMatch(HOME_CODE, /\.muted\s*=\s*false|soundToggle|Enable Sound/, "no unmute path");
  assert.ok(/prefers-reduced-motion:reduce\)\{[\s\S]*?\.hm-hero-video/.test(HOME_HTML), "reduced-motion rule addresses the hero video");
  const sw = readFileSync(path.join(PUBLIC_DIR, "service-worker.js"), "utf8");
  assert.ok(/function isMedia\(url\)[\s\S]*?mp4/.test(sw) && sw.includes("if (isMedia(url)) return;"), "media must bypass the service worker");
  assert.ok(!/response\.ok\) cache\.put/.test(sw) && sw.includes("response.status === 200"), "only complete 200 responses are cached");
  assert.equal(sw.match(/const CACHE_NAME = "instmates-v4"/g).length, 1, "cache name unchanged");
});

test("home: person model exposes only the public directory fields", () => {
  const p = personModel("uid-1", { basicInfo: { fullName: "A", headline: "H", profilePhoto: "x" }, professional: { specialization: "S", analyzersWorked: ["Z"] }, email: "e@x" });
  assert.deepEqual(Object.keys(p).sort(), ["headline", "name", "specialization", "uid"]);
  assert.deepEqual(personModel("u", {}), { uid: "u", name: "Technician", headline: "", specialization: "" });
  assert.equal(personModel("u", { fullName: "Legacy", role: "R", primaryDomain: "D" }).headline, "R");
  assert.equal(plural(1, "page"), "1 page");
  assert.equal(plural(2, "documented case", "documented cases"), "2 documented cases");
});
