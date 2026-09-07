/* =========================================================
   InstMates – Homepage data wiring (W1.2)
   File: /assets/js/home.js

   Progressive enhancement for /index.html. The static HTML already
   carries the SOLVE / LEARN / CONNECT structure and every primary
   link; this module only fills the data-driven slots:

   - LEARN "Covered today" topics and learning-path page counts from
     the canonical taxonomy.js / content-map.js (no second taxonomy).
   - SOLVE "Real field cases" chosen deterministically from content-map.js.
   - CONNECT rails from Firestore using the SAME safe public reads the
     feed and directory already use (posts: public read; profiles:
     profileStatus.isPublic == true filter). Read-only, no auth needed,
     no new index, honest zero/error states.

   Pure model functions are exported for node:test; DOM code runs only
   in a browser. User data is rendered with textContent, never innerHTML.
========================================================= */

import { TERMS, COVERAGE, HUB_MIN_RESOURCES, termBySlug } from "./taxonomy.js";
import { RESOURCES, resourcesFor, resourcesUnder } from "./content-map.js";
import { idParam } from "./safe-html.js";

export const HOME_LIMITS = Object.freeze({ cases: 3, discussions: 3, people: 6, excerpt: 160 });

/** Post types accepted by firestore.rules; anything else renders as a question. */
export const POST_TYPE_LABELS = Object.freeze({
  question: "Question",
  fault: "Fault",
  solution: "Solution",
  calibration: "Calibration"
});

const FIRESTORE_SDK = "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ---------------- Pure model (taxonomy / content map) ---------------- */

/** Supported measurement/technology terms with a declared entry page. Never partial/none. */
export function learnTopics() {
  return TERMS
    .filter((t) => t.facet !== "activity" && t.coverage === COVERAGE.SUPPORTED && t.entry)
    // W1.3: a published hub takes precedence over the knowledge entry page.
    .map((t) => ({ slug: t.slug, label: t.label, href: t.hub || t.entry, pages: resourcesFor(t.slug).length }))
    .filter((topic) => topic.pages >= HUB_MIN_RESOURCES);
}

/** Real number of mapped content pages under a learning path. */
export function pathCount(prefix) {
  return resourcesUnder(prefix).length;
}

export function caseCount() {
  return RESOURCES.filter((res) => res.kind === "case").length;
}

/**
 * Deterministic featured cases: case-study section first (then knowledge
 * cases), one per technology/measurement so three different fields show.
 */
export function featuredCases(limit = HOME_LIMITS.cases) {
  const cases = RESOURCES.filter((res) => res.kind === "case");
  const ordered = [
    ...cases.filter((res) => res.path.startsWith("/case-studies/")),
    ...cases.filter((res) => !res.path.startsWith("/case-studies/"))
  ];
  const out = [];
  const seen = new Set();
  for (const res of ordered) {
    const key = res.technology[0] || res.measurement[0] || res.path;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(res);
    if (out.length >= limit) break;
  }
  return out;
}

/** Label of the term a case is about (technology first, then measurement). */
export function caseTopic(res) {
  const slug = res.technology[0] || res.measurement[0] || null;
  const t = slug ? termBySlug(slug) : null;
  return t ? t.label : "";
}

/* ---------------- Pure model (community data) ---------------- */

export function excerpt(text, max = HOME_LIMITS.excerpt) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

export function relativeTime(date, now = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.floor((now - date) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  return date.toLocaleDateString();
}

function str(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/** posts → plain display items. Reactions are the stored counters, nothing derived. */
export function discussionModel(docs) {
  return docs.map((d) => {
    const data = d.data || {};
    const type = Object.prototype.hasOwnProperty.call(POST_TYPE_LABELS, data.type) ? data.type : "question";
    const reactions = data.reactions || {};
    const total = ["agree", "faced", "helpful"]
      .reduce((n, k) => n + (Number.isFinite(reactions[k]) ? reactions[k] : 0), 0);
    const createdAt = data.createdAt && typeof data.createdAt.toDate === "function" ? data.createdAt.toDate() : null;
    return { id: d.id, type, label: POST_TYPE_LABELS[type], text: excerpt(data.content), createdAt, reactions: total };
  });
}

/** profiles (public only) → the same public fields the directory shows. */
export function personModel(id, data = {}) {
  const basic = data.basicInfo || {};
  const professional = data.professional || {};
  return {
    uid: id,
    name: str(basic.fullName, 100) || str(data.fullName, 100) || "Technician",
    headline: str(basic.headline, 150) || str(data.role, 150) || "",
    specialization: str(professional.specialization, 150) || str(data.primaryDomain, 150) || ""
  };
}

export function plural(n, singular, pluralWord = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralWord}`;
}

/* ---------------- DOM rendering (browser only) ---------------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(href, className) {
  const a = el("a", className);
  a.href = href;
  return a;
}

function slot(name) {
  return document.querySelector(`[data-home="${name}"]`);
}

function replaceChildren(node, children) {
  node.textContent = "";
  for (const child of children) node.appendChild(child);
}

function renderStatic() {
  const topics = slot("learn-topics");
  if (topics) {
    replaceChildren(topics, learnTopics().map((t) => {
      const li = el("li");
      const a = link(t.href);
      a.appendChild(el("span", null, t.label));
      a.appendChild(el("small", null, plural(t.pages, "page")));
      li.appendChild(a);
      return li;
    }));
  }

  for (const span of document.querySelectorAll('[data-home="path-count"]')) {
    const n = pathCount(span.dataset.path || "");
    if (n > 0) span.textContent = `${span.textContent.trim()} · ${plural(n, "page")}`;
  }

  const cases = slot("cases");
  if (cases) {
    replaceChildren(cases, featuredCases().map((res) => {
      const li = el("li");
      const a = link(res.path);
      a.appendChild(el("strong", null, res.title));
      const topic = caseTopic(res);
      if (topic) a.appendChild(el("span", null, `Case study · ${topic}`));
      li.appendChild(a);
      return li;
    }));
  }

  const count = slot("case-count");
  if (count) {
    const n = caseCount();
    count.textContent = "";
    count.appendChild(document.createTextNode(`${plural(n, "documented case", "documented cases")} so far. `));
    const a = link("/case-studies/");
    a.textContent = "See all case studies";
    count.appendChild(a);
  }
}

function emptyItem(text) {
  return el("li", "hm-empty", text);
}

function renderDiscussions(items) {
  const list = slot("discussions");
  if (!list) return;
  list.setAttribute("aria-busy", "false");
  if (items.length === 0) {
    replaceChildren(list, [emptyItem("No discussions yet. Ask the first question in the feed.")]);
    return;
  }
  replaceChildren(list, items.map((item) => {
    const li = el("li");
    li.appendChild(el("span", "hm-badge", item.label));
    li.appendChild(document.createTextNode(item.text || "(no text)"));
    const meta = [];
    const when = relativeTime(item.createdAt);
    if (when) meta.push(when);
    if (item.reactions > 0) meta.push(plural(item.reactions, "reaction"));
    if (meta.length) li.appendChild(el("span", "hm-meta", meta.join(" · ")));
    return li;
  }));
}

function renderPeople(people) {
  const list = slot("people");
  if (!list) return;
  list.setAttribute("aria-busy", "false");
  if (people.length === 0) {
    replaceChildren(list, [emptyItem("No public profiles yet. Join and build yours.")]);
    return;
  }
  replaceChildren(list, people.map((p) => {
    const li = el("li");
    const a = link(`/profile/?uid=${idParam(p.uid)}`);
    a.appendChild(el("span", "hm-initial", (p.name.trim().charAt(0) || "T").toUpperCase()));
    a.appendChild(el("strong", null, p.name));
    if (p.headline) a.appendChild(el("span", null, p.headline));
    if (p.specialization) a.appendChild(el("span", null, p.specialization));
    li.appendChild(a);
    return li;
  }));
}

function renderCount(name, text) {
  const node = slot(name);
  if (node) node.textContent = text;
}

function renderFailure(name, message) {
  const list = slot(name);
  if (!list) return;
  list.setAttribute("aria-busy", "false");
  replaceChildren(list, [emptyItem(message)]);
}

async function loadDiscussions(db, fs) {
  try {
    const snap = await fs.getDocs(fs.query(
      fs.collection(db, "posts"),
      fs.orderBy("createdAt", "desc"),
      fs.limit(HOME_LIMITS.discussions)
    ));
    renderDiscussions(discussionModel(snap.docs.map((d) => ({ id: d.id, data: d.data() }))));
  } catch (err) {
    console.warn("Home: discussions unavailable", err && err.code);
    renderFailure("discussions", "Discussions could not be loaded right now. Open the feed to read them.");
    return;
  }
  try {
    const agg = await fs.getCountFromServer(fs.collection(db, "posts"));
    renderCount("discussion-count", `${plural(agg.data().count, "discussion")} so far.`);
  } catch (err) {
    console.warn("Home: discussion count unavailable", err && err.code);
  }
}

async function loadPeople(db, fs) {
  // Same filter as /profiles/: rules only allow listing public profiles.
  const publicOnly = fs.where("profileStatus.isPublic", "==", true);
  try {
    const snap = await fs.getDocs(fs.query(
      fs.collection(db, "profiles"),
      publicOnly,
      fs.limit(HOME_LIMITS.people)
    ));
    renderPeople(snap.docs.map((d) => personModel(d.id, d.data())));
  } catch (err) {
    console.warn("Home: profiles unavailable", err && err.code);
    renderFailure("people", "The directory could not be loaded right now. Open it directly.");
    return;
  }
  try {
    const agg = await fs.getCountFromServer(fs.query(fs.collection(db, "profiles"), publicOnly));
    renderCount("people-count", `${plural(agg.data().count, "public professional")} in the directory.`);
  } catch (err) {
    console.warn("Home: profile count unavailable", err && err.code);
  }
}

async function loadCommunity() {
  if (!slot("discussions") && !slot("people")) return;
  let db;
  let fs;
  try {
    [{ db }, fs] = await Promise.all([import("./firebase.js"), import(FIRESTORE_SDK)]);
  } catch (err) {
    console.warn("Home: Firestore unavailable", err && err.message);
    renderFailure("discussions", "Discussions could not be loaded right now. Open the feed to read them.");
    renderFailure("people", "The directory could not be loaded right now. Open it directly.");
    return;
  }
  await Promise.all([loadDiscussions(db, fs), loadPeople(db, fs)]);
}

if (typeof document !== "undefined" && document.body && document.body.dataset.page === "home") {
  renderStatic();
  loadCommunity();
}
