/*************************************************
 * FACILITY INSPECTION DASHBOARD — SCRIPT.JS
 *************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbwCJ3NZoYJn5MqZH-RVzX4YoXhyElSgOm4F5uM81JE3kKoB7AKP0RVce-lqcxdHqxH1Pg/exec";

const FORM_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSdv0823sBL02gmS9hErEdXtpKLNaWyahyLUxqt5apCOQCEcdQ/viewform";

const LOCATIONS = [
  "3rd Floor Restroom",
  "2nd Floor Restroom",
  "Cafeteria Mens Restroom",
  "Auxiliary Locker Room 1 - North Wrestling Baseball Locker Room",
  "Auxiliary Locker Room 2 - South Gym Locker Room"
];

const INSPECTION_WINDOWS = [
  9, 10, 11, 12, 13, 14, 15
];

const AUTO_REFRESH_MS = 15000;

let dashboardData = [];

/*************************************************
 * PAGE DETECTION
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {

  if (document.body.classList.contains("inspector-page")) {
    initializeInspectorPage();
  }

  if (document.body.classList.contains("supervisor-page")) {
    initializeSupervisorPage();
  }

});

/*************************************************
 * CLOCK
 *************************************************/
setInterval(() => {

  const clock = document.getElementById("live-clock");

  if (!clock) return;

  clock.textContent =
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });

}, 1000);

/*************************************************
 * INSPECTOR PAGE
 *************************************************/
function initializeInspectorPage() {

  const savedInspector =
    localStorage.getItem("facilityInspector");

  if (savedInspector) {
    showInspectionGrid(savedInspector);
  }

  buildInspectorDropdown();

}

/*************************************************
 * INSPECTOR DROPDOWN
 *************************************************/
function buildInspectorDropdown() {

  const select =
    document.getElementById("inspector-select");

  if (!select) return;

  const defaultOption =
    `<option value="">Select Your Name</option>`;

  const options =
    [
      "Ken Westenkirchner",
      "Matt Prater",
      "Corey Driver",
      "Murell Gregory",
      "Khyle Weirich",
      "Paris Martin",
      "Michael Hagmeyer",
      "Other"
    ]
      .map(name =>
        `<option value="${name}">${name}</option>`
      )
      .join("");

  select.innerHTML =
    defaultOption + options;

  select.addEventListener("change", () => {

    const value = select.value;

    if (!value) return;

    if (value === "Other") {

      const custom =
        prompt("Enter your full name:");

      if (!custom) return;

      localStorage.setItem(
        "facilityInspector",
        custom
      );

      showInspectionGrid(custom);

      return;
    }

    localStorage.setItem(
      "facilityInspector",
      value
    );

    showInspectionGrid(value);

  });

}

/*************************************************
 * SHOW INSPECTION GRID
 *************************************************/
function showInspectionGrid(name) {

  const loginWrap =
    document.getElementById("login-wrapper");

  const gridWrap =
    document.getElementById("inspection-wrapper");

  if (loginWrap) loginWrap.style.display = "none";

  if (gridWrap) gridWrap.style.display = "block";

  const inspectorLabel =
    document.getElementById("active-inspector");

  if (inspectorLabel) {
    inspectorLabel.textContent = name;
  }

  renderInspectionCards();

  updateInspectionCountdown();

  setInterval(updateInspectionCountdown, 1000);

}

/*************************************************
 * RENDER INSPECTION CARDS
 *************************************************/
function renderInspectionCards() {

  const container =
    document.getElementById("inspection-grid");

  if (!container) return;

  const completed =
    JSON.parse(
      localStorage.getItem("inspectionStatus") || "{}"
    );

  container.innerHTML =
    LOCATIONS.map(location => {

      const state = completed[location];

      let actionHTML = `
        <button class="clear-btn"
          onclick="markClear('${location}')">
          All Clear
        </button>

        <button class="issue-btn"
          onclick="reportIssue('${location}')">
          Issues Found
        </button>
      `;

      if (state === "clear") {
        actionHTML = `
          <div class="status-complete green">
            ✓ All Clear
          </div>
        `;
      }

      if (state === "issue") {
        actionHTML = `
          <div class="status-complete red">
            ✓ Issue Reported
          </div>
        `;
      }

      return `
        <div class="inspection-card">

          <div class="inspection-location">
            ${location}
          </div>

          <div class="inspection-actions">
            ${actionHTML}
          </div>

        </div>
      `;

    }).join("");

}

/*************************************************
 * MARK CLEAR
 *************************************************/
function markClear(location) {

  const completed =
    JSON.parse(
      localStorage.getItem("inspectionStatus") || "{}"
    );

  completed[location] = "clear";

  localStorage.setItem(
    "inspectionStatus",
    JSON.stringify(completed)
  );

  renderInspectionCards();

}

/*************************************************
 * REPORT ISSUE
 *************************************************/
function reportIssue(location) {

  const inspector =
    localStorage.getItem("facilityInspector") || "";

  const formURL =
    `${FORM_BASE}
?usp=pp_url
&entry.1456245431=${encodeURIComponent(inspector)}
&entry.1739126018=${encodeURIComponent(location)}
&entry.1237607443=
`;

  const completed =
    JSON.parse(
      localStorage.getItem("inspectionStatus") || "{}"
    );

  completed[location] = "issue";

  localStorage.setItem(
    "inspectionStatus",
    JSON.stringify(completed)
  );

  window.location.href = formURL;

}

/*************************************************
 * COUNTDOWN
 *************************************************/
function updateInspectionCountdown() {

  const el =
    document.getElementById("inspection-countdown");

  if (!el) return;

  const now = new Date();

  const currentHour = now.getHours();

  const nextWindow =
    INSPECTION_WINDOWS.find(
      h => h > currentHour
    );

  if (!nextWindow) {
    el.textContent =
      "Final inspection window completed.";
    return;
  }

  const target =
    new Date();

  target.setHours(nextWindow);
  target.setMinutes(0);
  target.setSeconds(0);

  const diff =
    target.getTime() - now.getTime();

  const mins =
    Math.floor(diff / 60000);

  const hrs =
    Math.floor(mins / 60);

  const rem =
    mins % 60;

  el.textContent =
    `Next inspection window: ${hrs}h ${rem}m`;

}

/*************************************************
 * RESETS
 *************************************************/
setInterval(() => {

  const now = new Date();

  const mins = now.getMinutes();

  if (mins === 0) {
    localStorage.removeItem("inspectionStatus");
  }

}, 60000);

setInterval(() => {

  const now = new Date();

  if (
    now.getHours() === 0 &&
    now.getMinutes() === 0
  ) {
    localStorage.removeItem("inspectionStatus");
  }

}, 60000);

/*************************************************
 * SUPERVISOR PAGE
 *************************************************/
function initializeSupervisorPage() {

  loadSupervisorDashboard();

  setInterval(
    loadSupervisorDashboard,
    AUTO_REFRESH_MS
  );

}

/*************************************************
 * LOAD DASHBOARD
 *************************************************/
async function loadSupervisorDashboard() {

  const res =
    await fetch(
      `${API_URL}?action=getAllInspections`
    );

  dashboardData = await res.json();

  renderSupervisorStats();

  renderAreaCards();

  renderIssueLog();

  renderAverageIssueCards();

}

/*************************************************
 * REFRESH BUTTON
 *************************************************/
function refreshDashboard() {
  loadSupervisorDashboard();
}

/*************************************************
 * SUPERVISOR STATS
 *************************************************/
function renderSupervisorStats() {

  const total =
    dashboardData.length;

  const unresolved =
    dashboardData.filter(
      r => r.hasIssue && !r.resolved
    ).length;

  const resolved =
    dashboardData.filter(
      r => r.resolved
    ).length;

  setText("stat-total", total);
  setText("stat-open", unresolved);
  setText("stat-resolved", resolved);

}

/*************************************************
 * AREA STATUS CARDS
 *************************************************/
function renderAreaCards() {

  const wrap =
    document.getElementById("area-grid");

  if (!wrap) return;

  wrap.innerHTML =
    LOCATIONS.map(location => {

      const rows =
        dashboardData.filter(
          r => r.location === location
        );

      const latest =
        rows.sort(
          (a, b) =>
            new Date(b.timestamp) -
            new Date(a.timestamp)
        )[0];

      if (!latest) {

        return `
          <div class="area-card gray">
            <div class="area-name">
              ${location}
            </div>

            <div class="area-status">
              No Inspections Recorded
            </div>
          </div>
        `;
      }

      const unresolved =
        rows.find(
          r => r.hasIssue && !r.resolved
        );

      let statusClass = "green";
      let statusText = "All Clear";

      if (unresolved) {
        statusClass = "red";
        statusText = "Open Issue";
      }

      const overdue =
        isInspectionOverdue(latest.timestamp);

      if (!unresolved && overdue) {
        statusClass = "yellow";
        statusText = "Overdue";
      }

      return `
        <div class="area-card ${statusClass}">

          <div class="area-name">
            ${location}
          </div>

          <div class="area-status">
            ${statusText}
          </div>

          <div class="area-meta">
            Last Inspection:
            ${formatDate(latest.timestamp)}
            <br>
            ${latest.inspector}
          </div>

        </div>
      `;

    }).join("");

}

/*************************************************
 * OVERDUE CHECK
 *************************************************/
function isInspectionOverdue(timestamp) {

  const ts = new Date(timestamp);

  const diff =
    (Date.now() - ts.getTime()) / 60000;

  return diff > 75;

}

/*************************************************
 * ISSUE LOG
 *************************************************/
function renderIssueLog() {

  const tbody =
    document.getElementById("issue-log");

  if (!tbody) return;

  const unresolved =
    dashboardData.filter(
      r => r.hasIssue && !r.resolved
    );

  if (!unresolved.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty">
          No Open Issues
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    unresolved.map(r => {

      return `
        <tr>

          <td>${formatDate(r.timestamp)}</td>

          <td>${r.inspector}</td>

          <td>${r.location}</td>

          <td>${r.issues}</td>

          <td>${r.notes || "-"}</td>

          <td>
            ${
              r.addedToAsana
                ? `<span class="asana-complete">
                    ✓ Asana
                  </span>`
                : `
                  <button class="asana-btn"
                    onclick="markAsana(${r.id})">
                    Added to Asana
                  </button>
                `
            }
          </td>

          <td>
            <button class="resolve-btn"
              onclick="resolveIssue(${r.id})">
              Resolve
            </button>
          </td>

        </tr>
      `;

    }).join("");

}

/*************************************************
 * RESOLVE ISSUE
 *************************************************/
async function resolveIssue(id) {

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "resolveIssue",
      id
    })
  });

  loadSupervisorDashboard();

}

/*************************************************
 * MARK ASANA
 *************************************************/
async function markAsana(id) {

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "markAsana",
      id
    })
  });

  loadSupervisorDashboard();

}

/*************************************************
 * AVERAGE ISSUE TIME
 *************************************************/
function renderAverageIssueCards() {

  const wrap =
    document.getElementById("average-issue-grid");

  if (!wrap) return;

  const html =
    LOCATIONS.map(location => {

      const issues =
        dashboardData.filter(
          r =>
            r.location === location &&
            r.hasIssue
        );

      if (!issues.length) {

        return `
          <div class="avg-card">
            <div class="avg-title">
              ${location}
            </div>

            <div class="avg-value">
              —
            </div>

            <div class="avg-sub">
              No issues reported
            </div>
          </div>
        `;
      }

      const avg =
        issues.reduce((sum, r) => {

          return (
            sum +
            new Date(r.timestamp).getHours()
          );

        }, 0) / issues.length;

      const avgHour =
        Math.round(avg);

      const display =
        formatHour(avgHour);

      return `
        <div class="avg-card">

          <div class="avg-title">
            ${location}
          </div>

          <div class="avg-value">
            ${display}
          </div>

          <div class="avg-sub">
            ${issues.length} total issues
          </div>

        </div>
      `;

    }).join("");

  wrap.innerHTML = html;

}

/*************************************************
 * HELPERS
 *************************************************/
function setText(id, value) {

  const el =
    document.getElementById(id);

  if (!el) return;

  el.textContent = value;

}

function formatDate(date) {

  return new Date(date)
    .toLocaleString();

}

function formatHour(hour) {

  const suffix =
    hour >= 12 ? "PM" : "AM";

  const normalized =
    hour > 12
      ? hour - 12
      : hour;

  return `${normalized}:00 ${suffix}`;

}
