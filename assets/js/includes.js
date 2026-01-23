document.addEventListener("DOMContentLoaded", function () {

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
  // INST MATES (ROOT DOMAIN)
  // ===============================
 loadInto("siteHeader", "/includes/header.html");
loadInto("siteFooter", "/includes/footer.html");
import("/assets/js/header-auth.js");

});
