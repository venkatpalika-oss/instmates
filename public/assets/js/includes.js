// =========================================================
// InstMates – ROOT DOMAIN INCLUDE HANDLER (LOCKED STANDARD)
// File: /assets/js/includes.js
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  async function loadInto(id, url) {
    const el = document.getElementById(id);
    if (!el) return;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`${url} → ${res.status}`);
      el.innerHTML = await res.text();
    } catch (e) {
      console.error("Include failed:", e.message);
    }
  }

  // 🔒 ORIGINAL PROJECT STANDARD
  loadInto("siteHeader", "/includes/header.html");
  loadInto("siteFooter", "/includes/footer.html");

});
// ================= MOBILE NAV INJECTION =================
if (!document.querySelector(".mobile-bottom-nav")) {

  const nav = document.createElement("nav");
  nav.className = "mobile-bottom-nav";

  nav.innerHTML = `
    <a href="/"><span>🏠</span><small>Home</small></a>
    <a href="/feed/"><span>📰</span><small>Feed</small></a>
    <a href="/post.html"><span>➕</span><small>Post</small></a>
    <a href="/profiles/"><span>👥</span><small>Techs</small></a>
    <a href="/profile.html"><span>👤</span><small>Account</small></a>
  `;

  document.body.appendChild(nav);
}
