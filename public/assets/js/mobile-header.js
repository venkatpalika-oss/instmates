// =====================================================
// InstMates – Mobile Header Title Controller
// File: /assets/js/mobile-header.js
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  const page = document.body.dataset.page;
  const titleEl = document.querySelector(".mobile-page-title");

  if (!titleEl) return;

  const map = {
    home: "Home",
    feed: "Feed",
    profiles: "Technicians",
    profile: "Account",
    explore: "Explore",
    knowledge: "Knowledge",
    community: "Community",
    login: "",
    register: ""
  };

  titleEl.textContent = map[page] || "";

});
