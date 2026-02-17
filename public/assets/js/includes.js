// =========================================================
// InstMates – ROOT DOMAIN INCLUDE HANDLER (LOCKED VERSION)
// File: /assets/js/includes.js
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  async function loadInto(id, url) {
    const el = document.getElementById(id);
    if (!el) return;

    try {
      const response = await fetch(url, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`${url} → ${response.status}`);
      }

      el.innerHTML = await response.text();

    } catch (error) {
      console.error("Include failed:", error.message);
    }
  }

  // 🔒 USE ORIGINAL PROJECT STANDARD IDS
  loadInto("siteHeader", "/includes/header.html");
  loadInto("siteFooter", "/includes/footer.html");

  // Optional breadcrumbs if used
  loadInto("siteBreadcrumbs", "/includes/breadcrumbs.html");

});
