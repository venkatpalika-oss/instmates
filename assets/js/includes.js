// assets/js/includes.js
// LOCKED – ROOT DOMAIN INCLUDE HANDLER

document.addEventListener("DOMContentLoaded", () => {

  async function loadInto(id, url) {
    const el = document.getElementById(id);
    if (!el) return;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(url + " not found");
      el.innerHTML = await res.text();
    } catch (e) {
      console.error("Include failed:", e.message);
    }
  }

  // ===============================
  // INST MATES – ROOT ABSOLUTE INCLUDES
  // ===============================
  loadInto("siteHeader", "/includes/header.html");
  loadInto("siteFooter", "/includes/footer.html");

  // ===============================
  // AUTH / HEADER LOGIC (MODULE)
  // ===============================
  import("/assets/js/header-auth.js");

});
