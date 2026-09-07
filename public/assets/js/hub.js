/* =========================================================
   InstMates – Technology hub discussions rail (W1.3)
   File: /assets/js/hub.js

   Fills the hub's Community section from the SAME bounded public
   read the feed already uses (posts ordered by createdAt, limit 20)
   and keeps only posts whose canonical tags normalise to the hub's
   term (normalizeTag). No body-text matching, no keyword guessing.

   LOW-VOLUME BRIDGE — scale trigger (documented in docs/21): when
   post volume makes the latest-20 window miss older tagged
   discussions, or the read cost per hub view is no longer
   negligible, replace this with an indexed server-side taxonomy
   relationship (composite index / tag query) as its own slice.

   Pure functions are exported for node:test; DOM code runs only
   in a browser. Rendering uses textContent, never innerHTML.
========================================================= */

import { normalizeTag, termBySlug } from "./taxonomy.js";
import { idParam } from "./safe-html.js";

export const HUB_POST_WINDOW = 20; // bounded latest-post read (same as the feed)
export const HUB_POST_LIMIT = 5;   // shown on the hub

const FIRESTORE_SDK = "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
const TYPE_LABELS = Object.freeze({ question: "Question", fault: "Fault", solution: "Solution", calibration: "Calibration" });

/** True only when at least one stored tag normalises to the hub term. */
export function postMatchesTerm(post, slug) {
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  return tags.some((t) => typeof t === "string" && normalizeTag(t) === slug);
}

/** posts → bounded display items for one term (deterministic order = query order). */
export function hubDiscussions(docs, slug, limit = HUB_POST_LIMIT) {
  return docs
    .filter((d) => postMatchesTerm(d.data, slug))
    .slice(0, limit)
    .map((d) => {
      const data = d.data || {};
      const type = Object.prototype.hasOwnProperty.call(TYPE_LABELS, data.type) ? data.type : "question";
      const text = String(data.content || "").replace(/\s+/g, " ").trim();
      return { id: d.id, type, label: TYPE_LABELS[type], text: text.length > 140 ? text.slice(0, 139).trimEnd() + "…" : text, uid: typeof data.uid === "string" ? data.uid : "" };
    });
}

/* ---------------- DOM (browser only) ---------------- */

function render(items) {
  const list = document.querySelector("[data-hub-discussions]");
  const empty = document.querySelector("[data-hub-empty]");
  const count = document.querySelector("[data-hub-discussions-count]");
  if (!list || !empty) return;
  if (!items.length) return; // honest empty state stays
  list.textContent = "";
  for (const item of items) {
    const li = document.createElement("li");
    const badge = document.createElement("span");
    badge.className = "hub-kind";
    badge.textContent = item.label;
    li.appendChild(badge);
    li.appendChild(document.createTextNode(item.text || "(no text)"));
    if (item.uid) {
      const a = document.createElement("a");
      a.href = `/profile/?uid=${idParam(item.uid)}`;
      a.textContent = " · author";
      li.appendChild(a);
    }
    list.appendChild(li);
  }
  list.hidden = false;
  empty.hidden = true;
  if (count) count.textContent = `${items.length} tagged ${items.length === 1 ? "discussion" : "discussions"} (latest ${HUB_POST_WINDOW})`;
}

async function load() {
  const main = document.querySelector("main[data-hub]");
  const slug = main && main.dataset.hub;
  if (!slug || !termBySlug(slug)) return;
  try {
    const [{ db }, fs] = await Promise.all([import("./firebase.js"), import(FIRESTORE_SDK)]);
    const snap = await fs.getDocs(fs.query(fs.collection(db, "posts"), fs.orderBy("createdAt", "desc"), fs.limit(HUB_POST_WINDOW)));
    render(hubDiscussions(snap.docs.map((d) => ({ id: d.id, data: d.data() })), slug));
  } catch (err) {
    console.warn("Hub: discussions unavailable", err && err.code); // empty state remains
  }
}

if (typeof document !== "undefined" && document.querySelector) load();
