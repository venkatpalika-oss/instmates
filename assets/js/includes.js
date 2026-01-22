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

  loadInto("siteHeader", "/instmates/includes/header.html");
loadInto("siteFooter", "/instmates/includes/footer.html");


});

