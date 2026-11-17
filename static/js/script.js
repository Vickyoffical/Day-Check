/* Day-Check landing page interactions */
document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation: expand/collapse the horizontal links.
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.innerHTML = isOpen
        ? '<i class="bi bi-x-lg"></i><span>Close</span>'
        : '<i class="bi bi-list"></i><span>Menu</span>';
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = '<i class="bi bi-list"></i><span>Menu</span>';
      });
    });
  }

  // Highlight the navigation item for the section currently in view.
  const sections = document.querySelectorAll("main section[id]");
  const links = document.querySelectorAll(".nav-link");

  if ("IntersectionObserver" in window && sections.length && links.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  // Illustrative Chart.js chart. This is demo content, not account data.
  const chartCanvas = document.getElementById("weeklyChart");
  if (chartCanvas && window.Chart) {
    new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Productivity",
          data: [55, 72, 64, 91, 78, 68, 82],
          backgroundColor: ["#c5cff8", "#aab9f3", "#c5cff8", "#3157D5", "#aab9f3", "#c5cff8", "#8175DB"],
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.58,
          categoryPercentage: 0.72
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (context) => `${context.parsed.y}% productivity` }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: "#969eae", font: { size: 9 } } },
          y: { min: 0, max: 100, ticks: { stepSize: 25, color: "#a2a9b7", font: { size: 8 }, callback: (value) => `${value}%` }, grid: { color: "#f0f2f7", drawTicks: false }, border: { display: false } }
        }
      }
    });
  }

  // Smooth-scroll fallback for browsers where CSS scroll-behavior is unavailable.
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  });
});
