// =========================================================
// InstMates – ROOT DOMAIN INCLUDE HANDLER (LOCKED STANDARD)
// File: /assets/js/includes.js
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

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

  // 🔒 ORIGINAL PROJECT STANDARD (DO NOT CHANGE ORDER)
  await loadInto("siteHeader", "/includes/header.html");
  await loadInto("siteFooter", "/includes/footer.html");

  // =====================================================
  // 🔐 GLOBAL AUTH LOGIC LOADER (NEW)
  // =====================================================

  // Prevent duplicate auth loading
    if (!document.body.dataset.authLoaded) {

    const coreAuth = document.createElement("script");
    coreAuth.type = "module";
    coreAuth.src = "/assets/js/auth.js";
    document.body.appendChild(coreAuth);

    document.body.dataset.authLoaded = "true";
  }

  // =====================================================
  // 📱 MOBILE BOTTOM NAV (GLOBAL INJECTION)
  // =====================================================

  if (!document.querySelector(".mobile-bottom-nav")) {

    const nav = document.createElement("nav");
    nav.className = "mobile-bottom-nav";

    nav.innerHTML = `
      <a href="/" data-page="home">
        <span>🏠</span>
        <small>Home</small>
      </a>

      <a href="/feed/" data-page="feed">
        <span>📰</span>
        <small>Feed</small>
      </a>

      <a href="/feed/" class="post-btn">
        <span>➕</span>
      </a>

      <a href="/profiles/" data-page="profiles">
        <span>👥</span>
        <small>Techs</small>
      </a>

      <a href="/profile/" data-page="profile">
        <span>👤</span>
        <small>Account</small>
      </a>
    `;

    document.body.appendChild(nav);

    const currentPage = document.body.dataset.page;

    nav.querySelectorAll("a[data-page]").forEach(link => {
      if (link.dataset.page === currentPage) {
        link.classList.add("active");
      }
    });
  }

});
