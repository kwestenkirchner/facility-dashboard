/* =========================================================
   FACILITY DASHBOARD SCRIPT.JS
   TEMPORARY SCHEDULING LOGIC VERSION
   Mon–Fri · 9am–3pm
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbwCJ3NZoYJn5MqZH-RVzX4YoXhyElSgOm4F5uM81JE3kKoB7AKP0RVce-lqcxdHqxH1Pg/exec";

const REFRESH_INTERVAL = 15000;

const LOCATIONS = [
  "3rd Floor Restroom",
  "2nd Floor Restroom",
  "Cafeteria Mens Restroom",
  "Cafeteria Womens Restroom",
  "West Lobby Mens Restroom",
  "West Lobby Womens Restroom",
  "Auxiliary Locker Room 1 - North",
  "Auxiliary Locker Room 2 - South",
  "7th and 8th Grade Locker Room",
  "Swim Locker Room"
];

const INSPECTORS = [
  "Ken Westenkirchner",
  "Matt Prater",
  "Corey Driver",
  "Murell Gregory",
  "Khyle Weirich",
  "Paris Martin",
  "Michael Hagmeyer"
];

/* =========================================================
   TEMPORARY SCHEDULE LOGIC
========================================================= */

const INSPECTION_START_HOUR = 9;
const INSPECTION_END_HOUR = 15;

function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isInspectionWindow(date = new Date()) {
  if (isWeekend(date)) return false;

  const hour = date.getHours();

  return (
    hour >= INSPECTION_START_HOUR &&
    hour <= INSPECTION_END_HOUR
  );
}

function getNextInspectionTime() {
  const now = new Date();

  let next = new Date(now);

  // BEFORE SCHOOL START
  if (
    !isWeekend(now) &&
    now.getHours() < INSPECTION_START_HOUR
  ) {
    next.setHours(INSPECTION_START_HOUR, 0, 0, 0);
    return next;
  }

  // DURING SCHOOL HOURS
  if (
    !isWeekend(now) &&
    now.getHours() >= INSPECTION_START_HOUR &&
    now.getHours() < INSPECTION_END_HOUR
  ) {
    next.setHours(now.getHours() + 1, 0, 0, 0);
    return next;
  }

  // AFTER HOURS / WEEKEND
  next.setDate(next.getDate() + 1);
  next.setHours(INSPECTION_START_HOUR, 0, 0, 0);

  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  return `${hours}h ${minutes}m ${seconds}s`;
}

function updateInspectionCountdown() {
  const el = document.getElementById("inspection-countdown");

  if (!el) return;

  const now = new Date();
  const next = getNextInspectionTime();

  const diff = next.getTime() - now.getTime();

  if (isInspectionWindow(now)) {
    el.innerHTML = `
      <div class="countdown-label">
        Next Inspection Window
      </div>
      <div class="countdown-time">
        ${formatCountdown(diff)}
      </div>
    `;
  } else {
    el.innerHTML = `
      <div class="countdown-label">
        Inspections Currently Closed
      </div>

      <div class="countdown-time">
        Next Window:
      </div>

      <div class="countdown-sub">
        ${next.toLocaleString()}
      </div>

      <div class="countdown-sub">
        ${formatCountdown(diff)} remaining
      </div>
    `;
  }
}

setInterval(updateInspectionCountdown, 1000);

/* =========================================================
   CLOCK
========================================================= */

function startClock() {
  const clock = document.getElementById("clock");

  if (!clock) return;

  setInterval(() => {
    clock.textContent = new Date().toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
      }
    );
  }, 1000);
}

/* =========================================================
   OVERDUE LOGIC
========================================================= */

function isAreaOverdue(lastInspectionTimestamp) {
  const now = new Date();

  // NEVER OVERDUE OUTSIDE INSPECTION WINDOW
  if (!isInspectionWindow(now)) {
    return false;
  }

  if (!lastInspectionTimestamp) {
    return true;
  }

  const lastInspection = new Date(lastInspectionTimestamp);

  const sameDay =
    now.toDateString() === lastInspection.toDateString();

  const currentHour = now.getHours();
  const lastHour = lastInspection.getHours();

  return !(sameDay && currentHour === lastHour);
}

/* =========================================================
   FETCH DATA
========================================================= */

async function fetchInspectionData() {
  try {
    const res = await fetch(
      `${API_URL}?action=getAllInspections`
    );

    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

/* =========================================================
   REFRESH BUTTON
========================================================= */

function refreshDashboard() {
  loadSupervisorDashboard();
}

/* =========================================================
   SUPERVISOR PAGE
========================================================= */

async function initializeSupervisorPage() {
  startClock();
  updateInspectionCountdown();

  await loadSupervisorDashboard();

  setInterval(loadSupervisorDashboard, REFRESH_INTERVAL);
}

async function loadSupervisorDashboard() {
  const data = await fetchInspectionData();

  renderStats(data);
  renderLocationCards(data);
  renderOpenIssues(data);
  renderAverageIssueCards(data);
}

/* =========================================================
   STATS
========================================================= */

function renderStats(data) {
  const total = data.length;

  const resolved = data.filter(
    (r) => r.resolved
  ).length;

  const unresolved = data.filter(
    (r) =>
      r.issues &&
      r.issues !== "No Issues Found" &&
      !r.resolved
  ).length;

  setText("total-inspections", total);
  setText("resolved-count", resolved);
  setText("open-count", unresolved);
}

/* =========================================================
   LOCATION STATUS CARDS
========================================================= */

function renderLocationCards(data) {
  const container =
    document.getElementById("location-grid");

  if (!container) return;

  container.innerHTML = "";

  LOCATIONS.forEach((location) => {
    const rows = data.filter(
      (r) => r.location === location
    );

    rows.sort(
      (a, b) =>
        new Date(b.timestamp) -
        new Date(a.timestamp)
    );

    const latest = rows[0];

    const card = document.createElement("div");

    card.className = "location-card";

    // NO INSPECTIONS
    if (!latest) {
      card.classList.add("status-gray");

      card.innerHTML = `
        <div class="location-name">
          ${location}
        </div>

        <div class="location-status">
          No Inspection Recorded
        </div>
      `;

      container.appendChild(card);
      return;
    }

    const unresolved =
      latest.issues &&
      latest.issues !== "No Issues Found" &&
      !latest.resolved;

    const overdue = isAreaOverdue(
      latest.timestamp
    );

    // ISSUE OPEN
    if (unresolved) {
      card.classList.add("status-red");
    }

    // OVERDUE
    else if (overdue) {
      card.classList.add("status-yellow");
    }

    // CLEAR
    else {
      card.classList.add("status-green");
    }

    card.innerHTML = `
      <div class="location-name">
        ${location}
      </div>

      <div class="location-status">
        ${
          unresolved
            ? "Issue Reported"
            : overdue
            ? "Inspection Overdue"
            : "All Clear"
        }
      </div>

      <div class="location-meta">
        Last Inspection:
        ${new Date(
          latest.timestamp
        ).toLocaleString()}
      </div>

      <div class="location-meta">
        Inspector:
        ${latest.inspector || "-"}
      </div>
    `;

    container.appendChild(card);
  });
}

/* =========================================================
   OPEN ISSUES
========================================================= */

function renderOpenIssues(data) {
  const tbody =
    document.getElementById("open-issues-body");

  if (!tbody) return;

  const issues = data.filter(
    (r) =>
      r.issues &&
      r.issues !== "No Issues Found" &&
      !r.resolved
  );

  issues.sort(
    (a, b) =>
      new Date(b.timestamp) -
      new Date(a.timestamp)
  );

  if (!issues.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No Open Issues
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = issues
    .map(
      (r) => `
      <tr>
        <td>
          ${new Date(
            r.timestamp
          ).toLocaleString()}
        </td>

        <td>${r.inspector}</td>

        <td>${r.location}</td>

        <td>${r.issues}</td>

        <td>${r.notes || "-"}</td>

        <td>
          ${
            r.asana
              ? "✅ Asana"
              : `
              <button
                class="asana-btn"
                onclick="markAsana(${r.id})"
              >
                Added to Asana
              </button>
            `
          }
        </td>

        <td>
          <button
            class="resolve-btn"
            onclick="resolveIssue(${r.id})"
          >
            Resolve
          </button>
        </td>
      </tr>
    `
    )
    .join("");
}

/* =========================================================
   AVERAGE ISSUE TIME
========================================================= */

function renderAverageIssueCards(data) {
  const container =
    document.getElementById(
      "average-issue-cards"
    );

  if (!container) return;

  const issues = data.filter(
    (r) =>
      r.issues &&
      r.issues !== "No Issues Found"
  );

  container.innerHTML = "";

  LOCATIONS.forEach((location) => {
    const rows = issues.filter(
      (r) => r.location === location
    );

    if (!rows.length) return;

    let totalMinutes = 0;

    rows.forEach((r) => {
      const d = new Date(r.timestamp);

      totalMinutes +=
        d.getHours() * 60 + d.getMinutes();
    });

    const avg =
      totalMinutes / rows.length;

    const h = Math.floor(avg / 60);
    const m = Math.floor(avg % 60);

    const card = document.createElement("div");

    card.className = "avg-card";

    card.innerHTML = `
      <div class="avg-location">
        ${location}
      </div>

      <div class="avg-time">
        ${formatHourMinute(h, m)}
      </div>

      <div class="avg-sub">
        ${rows.length} total issues reported
      </div>
    `;

    container.appendChild(card);
  });
}

/* =========================================================
   RESOLVE ISSUE
========================================================= */

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

/* =========================================================
   ASANA BUTTON
========================================================= */

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

/* =========================================================
   INSPECTOR PAGE
========================================================= */

function initializeInspectorPage() {
  startClock();
  updateInspectionCountdown();

  const savedInspector =
    localStorage.getItem("inspectorName");

  if (savedInspector) {
    document.getElementById(
      "inspector-name"
    ).value = savedInspector;
  }
}

/* =========================================================
   UTILITIES
========================================================= */

function setText(id, value) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = value;
  }
}

function formatHourMinute(h, m) {
  const suffix = h >= 12 ? "PM" : "AM";

  let hour = h % 12;

  if (hour === 0) hour = 12;

  return `${hour}:${String(m).padStart(
    2,
    "0"
  )} ${suffix}`;
}
