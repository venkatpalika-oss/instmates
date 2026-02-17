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

  // 🔒 ORIGINAL PROJECT STANDARD (DO NOT CHANGE AGAIN)
  loadInto("siteHeader", "/includes/header.html");
  loadInto("siteFooter", "/includes/footer.html");

  // Optional breadcrumb container
  loadInto("siteBreadcrumbs", "/includes/breadcrumbs.html");

});
