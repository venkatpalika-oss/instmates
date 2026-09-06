/* =========================================================
   InstMates – Safe rendering helpers (W0.1)
   File: /assets/js/safe-html.js

   Single source of truth for putting user-controlled data into
   the DOM. Every page that renders Firestore data (profiles,
   posts, comments, messages, AI output) must import from here
   instead of declaring its own escape function.

   Rules of use
   - Plain user text            -> el.textContent = value, or text(value)
   - Text inside a template     -> ${esc(value)}
   - Any attribute value        -> ${esc(value)}   (quotes are escaped too)
   - URLs that become src/href  -> safeUrl(value) / safeStorageUrl(value)
   - Never concatenate raw Firestore fields into innerHTML.
========================================================= */

const ESC = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;"
};

/** Escape a value for safe insertion into HTML text OR attribute context. */
export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (ch) => ESC[ch]);
}

/** Escape and convert newlines to <br>. For multi-line user text only. */
export function escMultiline(value) {
  return esc(value).replace(/\r?\n/g, "<br>");
}

/** Create a text node from user data (never parsed as HTML). */
export function text(value) {
  return document.createTextNode(
    value === null || value === undefined ? "" : String(value)
  );
}

/**
 * Create an element. `attrs` values are set with setAttribute (never
 * parsed as HTML). `children` may be strings (rendered as text), Nodes,
 * or arrays of either.
 */
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (name === "class") node.className = String(value);
    else if (name === "dataset" && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) node.dataset[k] = String(v);
    } else if (name.startsWith("on")) {
      // Event handlers are never accepted through attrs; attach with addEventListener.
      continue;
    } else node.setAttribute(name, String(value));
  }
  const append = (child) => {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) child.forEach(append);
    else if (child instanceof Node) node.appendChild(child);
    else node.appendChild(document.createTextNode(String(child)));
  };
  children.forEach(append);
  return node;
}

/** Remove all children of a container without parsing HTML. */
export function clear(container) {
  while (container.firstChild) container.removeChild(container.firstChild);
}

/** Replace a container's content with the given nodes/strings. */
export function render(container, ...children) {
  clear(container);
  const frag = document.createDocumentFragment();
  const append = (child) => {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) child.forEach(append);
    else if (child instanceof Node) frag.appendChild(child);
    else frag.appendChild(document.createTextNode(String(child)));
  };
  children.forEach(append);
  container.appendChild(frag);
}

/** Hosts that may serve user-uploaded media for this site. */
export const STORAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "instmates.firebasestorage.app",
  "storage.googleapis.com"
];

/**
 * Return `value` only if it is an absolute https URL (or a same-origin
 * path); otherwise return `fallback`. Blocks javascript:, data:, and
 * protocol-relative tricks.
 */
export function safeUrl(value, fallback = "") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const v = value.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return fallback;
    return u.href;
  } catch {
    return fallback;
  }
}

/**
 * Like safeUrl, but additionally requires the host to be one of the
 * Firebase Storage hosts. Use for profile photos and post attachments.
 */
export function safeStorageUrl(value, fallback = "") {
  const v = safeUrl(value, "");
  if (!v) return fallback;
  if (v.startsWith("/")) return v;
  try {
    const host = new URL(v).hostname;
    return STORAGE_HOSTS.includes(host) ? v : fallback;
  } catch {
    return fallback;
  }
}

/** Encode a Firestore document id / uid for use inside a URL. */
export function idParam(value) {
  return encodeURIComponent(String(value ?? ""));
}
