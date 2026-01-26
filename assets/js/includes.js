// =========================================================
// InstMates – ROOT DOMAIN INCLUDE HANDLER (FINAL + BREADCRUMBS)
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

  // ================= HEADER & FOOTER (UNCHANGED) =================
  loadInto("siteHeader", "/includes/header.html");
  loadInto("siteFooter", "/includes/footer.html");

  // ================= BREADCRUMBS (OPTIONAL, SAFE) =================
  // Will load only if <div id="siteBreadcrumbs"></div> exists
  loadInto("siteBreadcrumbs", "/includes/breadcrumbs.html");

});
