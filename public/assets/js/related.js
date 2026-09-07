/* =========================================================
   InstMates – Related knowledge (W1.3)
   File: /assets/js/related.js

   Mounted by the shared include loader (includes.js) on technical
   content pages. Resolves location.pathname against the canonical
   content map and appends a bounded, deterministic "Related
   knowledge" block (content-map relatedResources) plus an
   "Explore <technology>" link when the page's technology has a
   published hub. Unmapped pages render nothing. Zero network reads.
========================================================= */

import { termBySlug } from "./taxonomy.js";
import { resourceForPath, relatedResources } from "./content-map.js";

const KIND_LABEL = Object.freeze({
  overview: "Overview", explanation: "Explanation", components: "Components", fault: "Failure modes",
  troubleshooting: "Troubleshooting", calibration: "Calibration", sampling: "Sampling", case: "Case study",
  reference: "Reference", blog: "Article"
});

/** Pure: the block model for a pathname (null when nothing should render). */
export function relatedModel(pathname) {
  const res = resourceForPath(pathname);
  if (!res) return null;
  const items = relatedResources(res);
  const techSlug = res.technology[0] || null;
  const tech = techSlug ? termBySlug(techSlug) : null;
  const hub = tech && tech.hub ? { label: tech.label, href: tech.hub } : null;
  if (!items.length && !hub) return null;
  return { path: res.path, items, hub };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function mount(model) {
  const main = document.querySelector("main");
  if (!main || document.querySelector(".related-knowledge")) return;
  const section = el("section", "related-knowledge panel");
  section.setAttribute("aria-labelledby", "related-title");
  section.appendChild(el("h2", null, "Related knowledge"));
  section.querySelector("h2").id = "related-title";
  if (model.items.length) {
    const ul = el("ul", "related-list");
    for (const r of model.items) {
      const li = el("li");
      const a = el("a");
      a.href = r.path;
      a.appendChild(el("span", "related-kind", KIND_LABEL[r.kind] || r.kind));
      a.appendChild(el("span", "related-title", r.title));
      li.appendChild(a);
      ul.appendChild(li);
    }
    section.appendChild(ul);
  }
  if (model.hub) {
    const p = el("p", "related-hub");
    const a = el("a", "btn btn-soft");
    a.href = model.hub.href;
    a.textContent = `Explore ${model.hub.label}`;
    p.appendChild(a);
    section.appendChild(p);
  }
  const style = el("style", null,
    ".related-knowledge{margin-top:22px}.related-knowledge h2{margin:0 0 10px;font-size:1.2rem}" +
    ".related-list{list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}" +
    ".related-list a{display:flex;flex-direction:column;gap:2px;min-height:48px;padding:10px 12px;background:#fff;border:1px solid #d7dee8;border-left:3px solid #0b3c5d;border-radius:6px;color:#0f172a;text-decoration:none}" +
    ".related-list a:hover{border-color:#0b3c5d}.related-kind{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#475569}" +
    ".related-title{font-weight:600;line-height:1.3}.related-hub{margin:12px 0 0}.related-hub .btn{min-height:44px;display:inline-flex;align-items:center}" +
    ".related-knowledge a:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}@media(max-width:768px){.related-list{grid-template-columns:1fr}}");
  section.appendChild(style);
  main.appendChild(section);
}

if (typeof document !== "undefined" && document.querySelector) {
  const model = relatedModel(location.pathname);
  if (model) mount(model);
}
