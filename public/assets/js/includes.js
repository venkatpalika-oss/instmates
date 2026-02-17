// =========================================================
// InstMates – ROOT DOMAIN INCLUDE HANDLER (LOCKED VERSION)
// File: /assets/js/includes.js
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ================= SAFE LOADER FUNCTION =================
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

      const html = await response.text();
      el.innerHTML = html;

    } catch (error) {
      console.error("Include failed:", error.message);
    }
  }

  // =========================================================
  // STANDARDIZED ROOT-ABSOLUTE INCLUDES
  // =========================================================

  // HEADER
  loadInto("site-header", "/includes/header.html");

  // FOOTER
  loadInto("site-footer", "/includes/footer.html");

  // OPTIONAL BREADCRUMBS
  // Loads only if page contains:
  // <div id="site-breadcrumbs"></div>
  loadInto("site-breadcrumbs", "/includes/breadcrumbs.html");

});
