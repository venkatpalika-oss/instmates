// W1.3 GC discovery contract tests: hub page == canonical model, related knowledge, contribute prefill, author links, sitemap.
// Run: npm --prefix site-tests test   (no emulator, no network)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { TERMS, termBySlug, isDiscoverable, normalizeTag } from "../public/assets/js/taxonomy.js";
import { RESOURCES, HUB_SECTIONS, hubModel, hubEligibleTerms, resourceForPath, relatedResources, RELATED_LIMIT } from "../public/assets/js/content-map.js";
import { renderHub, publishedTerms, hubFile } from "../scripts/build-hub.mjs";
import { relatedModel } from "../public/assets/js/related.js";
import { hubDiscussions, postMatchesTerm, HUB_POST_WINDOW, HUB_POST_LIMIT } from "../public/assets/js/hub.js";
import { prefillType, POST_TYPES } from "../public/assets/js/composer-model.js";
import { learnTopics } from "../public/assets/js/home.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const GC = "gas-chromatography";
const HUB_HTML = readFileSync(hubFile(GC), "utf8").replace(/\r\n/g, "\n");
const FEED_JS = readFileSync(path.join(PUBLIC_DIR, "assets", "js", "feed.js"), "utf8");
const INCLUDES_JS = readFileSync(path.join(PUBLIC_DIR, "assets", "js", "includes.js"), "utf8");
const SITEMAP = readFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), "utf8");

function resolveUrl(url) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean) return "anchor";
  const rel = clean.replace(/^\//, "");
  const candidates = clean.endsWith("/")
    ? [path.join(PUBLIC_DIR, rel, "index.html"), path.join(PUBLIC_DIR, rel.replace(/\/$/, "") + ".html")]
    : [path.join(PUBLIC_DIR, rel + ".html"), path.join(PUBLIC_DIR, rel, "index.html"), path.join(PUBLIC_DIR, rel)];
  return candidates.find((f) => existsSync(f)) || null;
}
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

// ---------------------------------------------------------------- hub == model
test("hub: GC is eligible, published and the committed HTML equals the generator output", () => {
  const hub = hubModel(GC);
  assert.ok(hub.eligible && hub.published, "GC must be eligible and published");
  assert.equal(hub.hub, "/technology/gas-chromatography/");
  assert.equal(HUB_HTML, renderHub(GC), "run  node scripts/build-hub.mjs  and commit; hub HTML drifted from the model");
});

test("hub: every rendered resource exists, counts match the model, no empty section is rendered", () => {
  const hub = hubModel(GC);
  assert.equal(hub.resourceCount, hub.sections.reduce((n, s) => n + s.resources.length, 0));
  assert.ok(hub.resourceCount >= 3);
  for (const s of hub.sections) {
    assert.ok(s.resources.length > 0, `empty section ${s.id}`);
    assert.ok(HUB_HTML.includes(`<section class="hub-section" id="${s.id}"`), `section ${s.id} missing from HTML`);
    for (const r of s.resources) {
      assert.ok(resolveUrl(r.path), `hub resource missing on disk: ${r.path}`);
      assert.ok(HUB_HTML.includes(`href="${r.path}"`), `hub HTML lacks ${r.path}`);
    }
  }
  const renderedSections = [...HUB_HTML.matchAll(/<section class="hub-section" id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(renderedSections, hub.sections.map((s) => s.id), "sections render in model order and only when filled");
  const absent = HUB_SECTIONS.map((s) => s.id).filter((id) => !hub.sections.some((s) => s.id === id));
  for (const id of absent) assert.ok(!HUB_HTML.includes(`id="${id}"`), `absent section ${id} must not appear`);
  const linkedResources = hrefs(HUB_HTML).filter((h) => RESOURCES.some((r) => r.path === h && r.kind !== "index"));
  assert.equal(new Set(linkedResources).size, hub.resourceCount, "resource links == model count");
  assert.ok(HUB_HTML.includes(`<li>${hub.resourceCount} real resources</li>`));
  for (const h of hrefs(HUB_HTML).filter((x) => x.startsWith("/"))) assert.ok(resolveUrl(h), `dead link on hub: ${h}`);
});

test("hub: GC is the only published hub; no other hub route is generated or discoverable", () => {
  assert.deepEqual(publishedTerms().map((t) => t.slug), [GC]);
  assert.deepEqual(TERMS.filter(isDiscoverable).map((t) => t.slug), [GC]);
  for (const t of hubEligibleTerms()) if (t.slug !== GC) assert.equal(hubModel(t.slug).published, false, `${t.slug} must stay unpublished`);
  const techDir = path.join(PUBLIC_DIR, "technology");
  assert.deepEqual(readdirSync(techDir), [GC], "only the GC hub directory may exist");
  assert.ok(!existsSync(path.join(techDir, "index.html")), "no /technology/ index page");
  assert.ok(!existsSync(path.join(PUBLIC_DIR, "solve")), "no /solve/");
});

test("hub: SEO metadata, structured data, honest community state and rule-authorized contribute links", () => {
  assert.ok(HUB_HTML.includes('<link rel="canonical" href="https://www.instmates.com/technology/gas-chromatography/" />'));
  assert.ok(/<title>Gas chromatography – Technical Hub \| InstMates<\/title>/.test(HUB_HTML));
  assert.ok(/<meta name="description" content="[^"]{60,}"/.test(HUB_HTML));
  assert.ok(HUB_HTML.includes('property="og:title"') && HUB_HTML.includes('property="og:url"'));
  const ld = JSON.parse(HUB_HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const types = ld["@graph"].map((n) => n["@type"]).sort();
  assert.deepEqual(types, ["BreadcrumbList", "CollectionPage"]);
  const collection = ld["@graph"].find((n) => n["@type"] === "CollectionPage");
  assert.equal(collection.hasPart.length, hubModel(GC).resourceCount);
  assert.ok(!/aggregateRating|interactionStatistic|trending|popular/i.test(HUB_HTML));
  assert.ok(HUB_HTML.includes("No GC discussions yet."), "honest empty community state");
  assert.ok(HUB_HTML.includes('<ol class="hub-posts" data-hub-discussions hidden>'), "discussions list hidden until real tagged posts exist");
  assert.doesNotMatch(HUB_HTML, /GC professionals|specialists/i, "no people-by-technology claim");
  for (const h of hrefs(HUB_HTML).filter((x) => x.startsWith("/feed/?type="))) {
    const id = h.split("type=")[1];
    assert.ok(POST_TYPES.some((t) => t.id === id), `contribute CTA uses unauthorized type ${id}`);
  }
  assert.ok(HUB_HTML.includes('href="/profiles/"'), "generic professionals link");
  assert.equal((HUB_HTML.match(/<h1\b/g) || []).length, 1);
});

// ---------------------------------------------------------------- related knowledge
test("related: derived from canonical mapping, bounded, deterministic, never self, never dead", () => {
  const content = RESOURCES.filter((r) => r.kind !== "index");
  for (const res of content) {
    const a = relatedResources(res);
    const b = relatedResources(res);
    assert.deepEqual(a.map((r) => r.path), b.map((r) => r.path), `non-deterministic for ${res.path}`);
    assert.ok(a.length <= RELATED_LIMIT);
    const primary = res.technology[0] || res.measurement[0];
    for (const r of a) {
      assert.notEqual(r.path, res.path, `self-link on ${res.path}`);
      assert.ok(resolveUrl(r.path), `dead related link ${r.path}`);
      assert.ok(r.kind !== "index");
      assert.ok(r.technology.includes(primary) || r.measurement.includes(primary), `${r.path} unrelated to ${primary}`);
    }
    assert.equal(new Set(a.map((r) => r.title)).size, a.length, `duplicate titles for ${res.path}`);
  }
  assert.deepEqual(relatedResources(RESOURCES.find((r) => r.kind === "index")), [], "index pages get no related block");
  const gcFault = resourceForPath("/knowledge/gc/gc-failure-modes.html");
  const sections = new Set(relatedResources(gcFault).slice(0, 4).map((r) => HUB_SECTIONS.find((s) => s.kinds.includes(r.kind)).id));
  assert.ok(sections.size >= 3, "first picks span different sections");
});

test("related: pathname resolution and the mount decision", () => {
  assert.equal(resourceForPath("/knowledge/gc/gc-failure-modes.html").path, "/knowledge/gc/gc-failure-modes/");
  assert.equal(resourceForPath("/knowledge/gc/gc-failure-modes/index.html").path, "/knowledge/gc/gc-failure-modes/");
  assert.equal(resourceForPath("/knowledge/gc/gc-failure-modes/?x=1#y").path, "/knowledge/gc/gc-failure-modes/");
  assert.equal(resourceForPath("/nope/"), null);
  const gc = relatedModel("/knowledge/gc/gc-failure-modes/");
  assert.ok(gc.items.length > 0 && gc.hub && gc.hub.href === "/technology/gas-chromatography/", "GC article gets Explore link");
  const pressure = relatedModel("/knowledge/field/pressure/pressure-basics/");
  assert.ok(pressure.items.length > 0 && pressure.hub === null, "non-GC article gets related items but no hub link");
  const cs = relatedModel("/case-studies/gc-baseline-drift/");
  assert.ok(cs.items.length > 0 && cs.hub, "case study gets related + hub");
  assert.equal(relatedModel("/knowledge/"), null, "index pages mount nothing");
  assert.equal(relatedModel("/feed/"), null);
  assert.ok(/related\.js\?v=/.test(INCLUDES_JS) && /\^\\\/\(knowledge\|case-studies\|blog\)\\\//.test(INCLUDES_JS), "single shared mounting point in includes.js");
  const relatedSrc = readFileSync(path.join(PUBLIC_DIR, "assets", "js", "related.js"), "utf8");
  assert.doesNotMatch(relatedSrc, /firebase|fetch\(|innerHTML/, "zero reads, textContent only");
});

// ---------------------------------------------------------------- discussions, contribute, authors
test("discussions: only canonical-tag matches, bounded window and limit, no text classification", () => {
  const docs = [
    { id: "a", data: { type: "fault", content: "GC8000 error 603 oven heater", tags: [] } },
    { id: "b", data: { type: "question", content: "baseline drift", tags: ["gc"] } },
    { id: "c", data: { type: "solution", content: "x", tags: ["#Gas Chromatography"] } },
    { id: "d", data: { type: "calibration", content: "y", tags: ["pressure"] } },
    { id: "e", data: { type: "question", content: "z", tags: ["GC8000"] } }
  ];
  const items = hubDiscussions(docs, GC);
  assert.deepEqual(items.map((i) => i.id), ["b", "c"], "body text and equipment names never qualify");
  assert.equal(postMatchesTerm({ tags: null }, GC), false);
  assert.equal(hubDiscussions([], GC).length, 0, "empty → empty state");
  assert.equal(HUB_POST_WINDOW, 20);
  assert.ok(HUB_POST_LIMIT <= 5);
  const src = readFileSync(path.join(PUBLIC_DIR, "assets", "js", "hub.js"), "utf8");
  assert.ok(src.includes("fs.limit(HUB_POST_WINDOW)") && src.includes('fs.orderBy("createdAt", "desc")'), "reuses the feed's bounded query shape");
  assert.doesNotMatch(src, /fs\.where\(|\.innerHTML\s*=|addDoc|setDoc|updateDoc/, "read-only, no new query shape");
  assert.match(src, /scale trigger/i, "scale trigger documented in code");
  assert.equal(normalizeTag("GC"), GC);
});

test("contribute: ?type= accepts only rule-authorized types and falls back safely", () => {
  for (const t of POST_TYPES) assert.equal(prefillType(t.id), t.id);
  assert.equal(prefillType("FAULT"), "fault");
  assert.equal(prefillType("case-study"), "question");
  assert.equal(prefillType("general"), "question");
  assert.equal(prefillType("knowledge"), "question");
  assert.equal(prefillType(""), "question");
  assert.equal(prefillType(null), "question");
  assert.equal(prefillType("<script>"), "question");
  assert.equal(prefillType("nope", "solution"), "solution");
  assert.ok(FEED_JS.includes('prefillType(new URLSearchParams(location.search).get("type")'), "feed.js reads ?type= through prefillType");
});

test("authors: feed card author name links to the public profile route with the idParam contract", () => {
  assert.ok(FEED_JS.includes('<a class="feed-username" href="/profile/?uid=${idParam(post.uid)}">${esc(userName)}</a>'));
  assert.ok(FEED_JS.includes("idParam } from \"./safe-html.js\""));
  assert.doesNotMatch(FEED_JS, /email|phone/i, "no private fields rendered");
});

// ---------------------------------------------------------------- homepage entry and sitemap
test("homepage: the GC LEARN topic now opens the hub; other topics keep their entry pages", () => {
  const topics = learnTopics();
  const gc = topics.find((t) => t.slug === GC);
  assert.equal(gc.href, "/technology/gas-chromatography/");
  for (const t of topics.filter((x) => x.slug !== GC)) assert.equal(t.href, termBySlug(t.slug).entry);
  for (const t of topics) assert.ok(resolveUrl(t.href), `topic href missing ${t.href}`);
});

test("sitemap: the GC hub exactly once and no unpublished hub URLs", () => {
  const locs = [...SITEMAP.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.filter((l) => l === "https://www.instmates.com/technology/gas-chromatography/").length, 1);
  const tech = locs.filter((l) => l.includes("/technology/"));
  assert.deepEqual(tech, ["https://www.instmates.com/technology/gas-chromatography/"]);
  assert.ok(!locs.includes("https://www.instmates.com/technology/"), "no technology index URL");
});
