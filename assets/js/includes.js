// =========================================================
// InstMates – ROOT DOMAIN INCLUDE HANDLER (FINAL)
// File: /assets/js/includes.js
// Purpose:
//  - Load header.html and footer.html reliably
//  - Then load header-auth.js AFTER header exists
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

  // ======================================================
  // ABSOLUTE ROOT INCLUDES (CRITICAL)
  // ======================================================
  loadInto("siteHeader", "/includes/header.html");
  loadInto("siteFooter", "/includes/footer.html");

  // ======================================================
  // HEADER AUTH LOGIC (LOAD AFTER HEADER EXISTS)
  // ======================================================
  import("/assets/js/header-auth.js");

});
