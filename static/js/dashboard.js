/* Day-Check dashboard behaviour.
 * The only browser storage used here is the user's display-theme preference.
 * Dashboard records always come from Flask's dashboard_data payload or a future API.
 */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const safeArray = value => Array.isArray(value) ? value : [];
  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function setDate() {
    const now = new Date();
    const date = $("#currentDate");
    const year = $("#currentYear");
    if (date) date.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(now);
    if (year) year.textContent = String(now.getFullYear());
  }

  function setGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const heading = $("#welcomeHeading");
    if (!heading) return;
    const username = heading.dataset.username || "";
    heading.textContent = username ? `${greeting}, ${username}!` : `${greeting}!`;
  }

  function initQuote() {
    // Rotate between neutral motivational messages without inventing user data.
    const quotes = [
      "Small steps, repeated daily, create meaningful change.",
      "Consistency turns small actions into lasting habits.",
      "Progress grows when you keep showing up.",
      "Focus on the next step, not the whole staircase."
    ];
    const target = $("#motivationalQuote");
    if (target) target.textContent = quotes[new Date().getDay() % quotes.length];
  }

  function updateStat(key, value, suffix = "") {
    const target = $(`[data-stat="${key}"]`);
    if (target && value !== null && value !== undefined && value !== "") {
      target.textContent = `${value}${suffix}`;
    }
  }

  function renderOverview(data) {
    const stats = data.stats || data;
    updateStat("total_routines", stats.total_routines);
    updateStat("completed_today", stats.completed_today);
    updateStat("pending_tasks", stats.pending_tasks);
    updateStat("current_streak", stats.current_streak, stats.current_streak === null || stats.current_streak === undefined ? "" : " days");
  }

  function renderDailyProgress(data) {
    const completed = Number(data.completed_today);
    const total = Number(data.total_scheduled);
    const valid = Number.isFinite(completed) && Number.isFinite(total) && total > 0;
    const percent = valid ? Math.max(0, Math.min(100, Math.round((completed / total) * 100))) : null;
    const ring = $("#dailyProgressRing");
    const percentText = $("#dailyProgressPercent");
    const count = $("#dailyProgressCount");
    const message = $("#dailyProgressMessage");
    const bar = $("#dailyProgressBar");
    const track = $(".progress-track");

    if (percent === null) {
      if (count) count.textContent = "No progress data yet";
      if (message) message.textContent = "Your progress will appear here once you start tracking routines.";
      if (ring) ring.setAttribute("aria-label", "Today's completion: no data yet");
      if (percentText) percentText.textContent = "—";
      if (bar) bar.style.width = "0%";
      if (track) track.setAttribute("aria-valuenow", "0");
      return;
    }
    if (percentText) percentText.textContent = `${percent}%`;
    if (count) count.textContent = `${completed} of ${total} completed`;
    if (message) message.textContent = percent === 100 ? "All scheduled routines completed. Great work!" : "Keep going — every completed routine moves you forward.";
    if (ring) {
      ring.style.setProperty("--progress", `${percent}%`);
      ring.setAttribute("aria-label", `Today's completion: ${percent}%`);
    }
    if (bar) bar.style.width = `${percent}%`;
    if (track) track.setAttribute("aria-valuenow", String(percent));
  }

  function renderRoutines(routines) {
    const container = $("#routineList");
    if (!container) return;
    if (!routines.length) {
      container.innerHTML = `<div class="empty-state"><span class="empty-state-icon"><i class="bi bi-calendar2-check"></i></span><strong>No routines scheduled for today.</strong><p>Your scheduled routines will show up here.</p></div>`;
      return;
    }
    container.innerHTML = routines.map(item => {
      const complete = item.status === "completed" || item.completed === true;
      const status = complete ? "Completed" : escapeText(item.status_label || "Pending");
      return `<div class="routine-row">
        <div class="routine-main">
          <span class="routine-indicator ${complete ? "is-complete" : ""}"></span>
          <div><strong>${escapeText(item.name)}</strong><small>${escapeText(item.time || item.scheduled_time || "Time not set")}</small></div>
        </div>
        <span class="status-pill ${complete ? "complete" : ""}">${status}</span>
      </div>`;
    }).join("");
  }

  function renderActivity(activities) {
    const container = $("#activityList");
    if (!container) return;
    if (!activities.length) {
      container.innerHTML = `<div class="empty-state compact-empty"><span class="empty-state-icon"><i class="bi bi-clock-history"></i></span><strong>No recent activity available.</strong><p>Updates to your routines will appear here.</p></div>`;
      return;
    }
    container.innerHTML = activities.map(item => {
      const complete = item.status === "completed";
      return `<div class="activity-row">
        <span class="activity-icon"><i class="bi ${complete ? "bi-check2" : "bi-pencil"}"></i></span>
        <div class="activity-main"><strong>${escapeText(item.name || item.routine_name)}</strong><small>${escapeText(item.timestamp || item.date || "")}</small></div>
        <span class="status-pill ${complete ? "complete" : ""}">${escapeText(item.status_label || item.status || "Updated")}</span>
      </div>`;
    }).join("");
  }

  let weeklyChart = null;
  function renderWeeklyChart(weekly) {
    const canvas = $("#weeklyProgressChart");
    const empty = $("#weeklyChartEmpty");
    if (!canvas || typeof Chart === "undefined") return;

    const labels = safeArray(weekly.labels);
    const values = safeArray(weekly.values);
    const hasData = labels.length > 0 && values.length === labels.length &&
      values.some(value => value !== null && value !== undefined && Number.isFinite(Number(value)));

    if (!hasData) {
      if (empty) empty.hidden = false;
      if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
      return;
    }
    if (empty) empty.hidden = true;
    if (weeklyChart) weeklyChart.destroy();

    const context = canvas.getContext("2d");
    const styles = getComputedStyle(document.body);
    const textColor = styles.getPropertyValue("--dash-muted").trim() || "#737b8c";
    const gridColor = styles.getPropertyValue("--dash-line").trim() || "#e9ecf4";
    weeklyChart = new Chart(context, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Completion",
          data: values.map(value => value === null ? null : Number(value)),
          borderColor: "#3157d5",
          backgroundColor: "rgba(49,87,213,.10)",
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#8175db",
          fill: true,
          tension: .35,
          spanGaps: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: context => `${context.parsed.y}% completed` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { family: "DM Sans", size: 10 } } },
          y: {
            beginAtZero: true, min: 0, max: 100,
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: textColor, stepSize: 25, callback: value => `${value}%`, font: { family: "DM Sans", size: 9 } }
          }
        }
      }
    });
  }

  function initTheme() {
    const button = $("#themeToggle");
    const icon = $("#themeIcon");
    if (!button) return;
    const saved = localStorage.getItem("day-check-theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const apply = dark => {
      document.body.classList.toggle("dark-mode", dark);
      if (icon) icon.className = dark ? "bi bi-sun" : "bi bi-moon-stars";
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      if (weeklyChart) {
        const data = readDashboardData();
        renderWeeklyChart(data.weekly_progress || {});
      }
    };
    apply(saved ? saved === "dark" : prefersDark);
    button.addEventListener("click", () => {
      const dark = !document.body.classList.contains("dark-mode");
      localStorage.setItem("day-check-theme", dark ? "dark" : "light");
      apply(dark);
    });
  }

  function initSidebar() {
    const sidebar = $("#dashboardSidebar");
    const toggle = $("#sidebarToggle");
    const scrim = $("#sidebarScrim");
    if (!sidebar || !toggle || !scrim) return;
    const close = () => {
      sidebar.classList.remove("is-open");
      scrim.classList.remove("is-visible");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = !sidebar.classList.contains("is-open");
      sidebar.classList.toggle("is-open", open);
      scrim.classList.toggle("is-visible", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    scrim.addEventListener("click", close);
    sidebar.querySelectorAll("a").forEach(link => link.addEventListener("click", close));
  }

  function readDashboardData() {
    const node = $("#dashboard-data");
    if (!node) return {};
    try { return JSON.parse(node.textContent || "{}"); }
    catch (error) { console.error("Unable to parse dashboard data.", error); return {}; }
  }

  function renderDashboard(data) {
    const stats = data.stats || data;
    renderOverview(data);
    renderDailyProgress({
      completed_today: stats.completed_today,
      total_scheduled: data.total_scheduled ?? stats.total_routines_today
    });
    renderWeeklyChart(data.weekly_progress || {});
    renderRoutines(safeArray(data.today_routines));
    renderActivity(safeArray(data.recent_activity));
  }

  document.addEventListener("DOMContentLoaded", () => {
    setDate();
    setGreeting();
    initQuote();
    initTheme();
    initSidebar();
    renderDashboard(readDashboardData());
  });

  // Expose a small integration point for future fetch/API updates:
  // window.DayCheckDashboard.update(payload)
  window.DayCheckDashboard = { update: renderDashboard };
})();
