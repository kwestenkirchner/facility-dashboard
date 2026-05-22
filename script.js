const API_URL =
  "https://script.google.com/macros/s/AKfycbwCJ3NZoYJn5MqZH-RVzX4YoXhyElSgOm4F5uM81JE3kKoB7AKP0RVce-lqcxdHqxH1Pg/exec";

const FORM_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSdv0823sBL02gmS9hErEdXtpKLNaWyahyLUxqt5apCOQCEcdQ/viewform";

const LOCATIONS = [
  "3rd Floor Restroom",
  "2nd Floor Restroom",
  "Cafeteria Mens Restroom",
  "Auxiliary Locker Room 1 - North Wrestling Baseball Locker Room",
  "Auxiliary Locker Room 2 - South Aux Gym Locker Room"
];

const INSPECTORS = [
  "Ken Westenkirchner",
  "Matt Prater",
  "Corey Driver",
  "Murell Gregory",
  "Khyle Weirich",
  "Paris Martin",
  "Michael Hagmeyer",
  "Other"
];

let ALL_DATA = [];

function startClock() {

  function updateClock() {

    const el = document.getElementById("clock");

    if (!el) return;

    el.textContent =
      new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
      });

  }

  updateClock();

  setInterval(updateClock, 1000);

}

/************************************************
 * INSPECTOR PAGE
 ************************************************/

function initializeInspectorPage() {

  startClock();

  populateInspectorDropdown();

  setupInspectorSelection();

  updateNextWindow();

  setInterval(updateNextWindow, 1000);

}

function populateInspectorDropdown() {

  const select =
    document.getElementById("inspector-select");

  if (!select) return;

  INSPECTORS.forEach(name => {

    const opt = document.createElement("option");

    opt.value = name;
    opt.textContent = name;

    select.appendChild(opt);

  });

}

function setupInspectorSelection() {

  const select =
    document.getElementById("inspector-select");

  select.addEventListener("change", () => {

    let inspector = select.value;

    if (!inspector) return;

    if (inspector === "Other") {

      inspector = prompt(
        "Enter Inspector Name"
      );

      if (!inspector) return;

    }

    localStorage.setItem(
      "facilityInspector",
      inspector
    );

    launchInspectorView(inspector);

  });

  const existing =
    localStorage.getItem("facilityInspector");

  if (existing) {

    launchInspectorView(existing);

  }

}

function launchInspectorView(inspector) {

  document.getElementById(
    "login-wrapper"
  ).style.display = "none";

  document.getElementById(
    "inspection-wrapper"
  ).style.display = "block";

  document.getElementById(
    "active-inspector"
  ).textContent = inspector;

  renderInspectionCards(inspector);

}

function renderInspectionCards(inspector) {

  const grid =
    document.getElementById("inspection-grid");

  if (!grid) return;

  const completed =
    JSON.parse(
      localStorage.getItem("inspectionStatuses") || "{}"
    );

  grid.innerHTML = "";

  LOCATIONS.forEach(location => {

    const card =
      document.createElement("div");

    card.className = "inspection-card";

    const status = completed[location];

    let actions = "";

    if (!status) {

      actions = `
        <button
          class="clear-btn"
          onclick="markAllClear('${location}')"
        >
          All Clear
        </button>

        <button
          class="issue-btn"
          onclick="reportIssue('${location}')"
        >
          Issues Found
        </button>
      `;

    } else if (status === "clear") {

      actions = `
        <div class="status-complete green">
          ✅ All Clear
        </div>
      `;

    } else {

      actions = `
        <div class="status-complete red">
          🚨 Issues Reported
        </div>
      `;

    }

    card.innerHTML = `
      <div class="inspection-location">
        ${location}
      </div>

      <div class="inspection-actions">
        ${actions}
      </div>
    `;

    grid.appendChild(card);

  });

}

function markAllClear(location) {

  const inspector =
    localStorage.getItem("facilityInspector");

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "submitInspection",
      inspector,
      location,
      issues: "No Issues Found",
      notes: ""
    })
  });

  const statuses =
    JSON.parse(
      localStorage.getItem("inspectionStatuses") || "{}"
    );

  statuses[location] = "clear";

  localStorage.setItem(
    "inspectionStatuses",
    JSON.stringify(statuses)
  );

  renderInspectionCards(inspector);

}

function reportIssue(location) {

  const inspector =
    localStorage.getItem("facilityInspector");

  const url =
    FORM_BASE +
    `?entry.1456245431=${encodeURIComponent(inspector)}` +
    `&entry.1739126018=${encodeURIComponent(location)}`;

  const statuses =
    JSON.parse(
      localStorage.getItem("inspectionStatuses") || "{}"
    );

  statuses[location] = "issue";

  localStorage.setItem(
    "inspectionStatuses",
    JSON.stringify(statuses)
  );

  window.open(url, "_blank");

  renderInspectionCards(inspector);

}

/************************************************
 * SUPERVISOR PAGE
 ************************************************/

async function initializeSupervisorPage() {

  startClock();

  updateNextWindow();

  setInterval(updateNextWindow, 1000);

  await loadSupervisorDashboard();

  setInterval(loadSupervisorDashboard, 15000);

}

async function loadSupervisorDashboard() {

  const res =
    await fetch(
      API_URL + "?action=getAllInspections"
    );

  const data = await res.json();

  data.sort((a, b) => {
    return (
      new Date(b.timestamp) -
      new Date(a.timestamp)
    );
  });

  ALL_DATA = data;

  renderStats(data);

  renderAreaGrid(data);

  renderAverageIssueCards(data);

  renderOpenIssues(data);

}

function renderStats(data) {

  const today =
    new Date().toDateString();

  const todayRows =
    data.filter(r =>
      new Date(r.timestamp).toDateString() === today
    );

  const open =
    data.filter(r =>
      r.issues &&
      r.issues !== "No Issues Found" &&
      !r.resolvedAt
    );

  document.getElementById(
    "stat-total"
  ).textContent = todayRows.length;

  document.getElementById(
    "stat-clear"
  ).textContent =
    todayRows.filter(r =>
      r.issues === "No Issues Found"
    ).length;

  document.getElementById(
    "stat-open"
  ).textContent = open.length;

}

function renderAreaGrid(data) {

  const grid =
    document.getElementById("area-grid");

  grid.innerHTML = "";

  LOCATIONS.forEach(location => {

    const rows =
      data.filter(r =>
        r.location === location
      );

    const latest = rows[0];

    const unresolved =
      rows.find(r =>
        r.issues &&
        r.issues !== "No Issues Found" &&
        !r.resolvedAt
      );

    let cls = "gray";
    let status = "No Inspections Recorded";

    if (unresolved) {

      cls = "red";
      status = "Issue Reported";

    } else if (latest) {

      cls = "green";
      status = "All Clear";

    }

    const card =
      document.createElement("div");

    card.className =
      `area-card ${cls}`;

    card.innerHTML = `
      <div class="area-name">
        ${location}
      </div>

      <div class="area-status">
        ${status}
      </div>

      <div class="area-meta">
        ${
          latest
            ? `
            Last Inspection:
            ${new Date(
              latest.timestamp
            ).toLocaleString()}
            <br>
            Inspector:
            ${latest.inspector}
          `
            : "No inspection yet"
        }
      </div>
    `;

    grid.appendChild(card);

  });

}

function renderAverageIssueCards(data) {

  const grid =
    document.getElementById("average-grid");

  grid.innerHTML = "";

  LOCATIONS.forEach(location => {

    const rows =
      data.filter(r =>
        r.location === location &&
        r.issues &&
        r.issues !== "No Issues Found"
      );

    let avgText = "No Issues";

    if (rows.length > 0) {

      const avg =
        rows.reduce((sum, r) => {

          const d = new Date(r.timestamp);

          return (
            sum +
            d.getHours() +
            d.getMinutes() / 60
          );

        }, 0) / rows.length;

      const h = Math.floor(avg);

      const m = Math.round((avg - h) * 60);

      const dt = new Date();

      dt.setHours(h);
      dt.setMinutes(m);

      avgText =
        dt.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit"
        });

    }

    const card =
      document.createElement("div");

    card.className = "avg-card";

    card.innerHTML = `
      <div class="avg-title">
        ${location}
      </div>

      <div class="avg-value">
        ${avgText}
      </div>

      <div class="avg-sub">
        Total Issues:
        ${rows.length}
      </div>
    `;

    grid.appendChild(card);

  });

}

function renderOpenIssues(data) {

  const tbody =
    document.getElementById("issues-body");

  const rows =
    data
      .filter(r =>
        r.issues &&
        r.issues !== "No Issues Found" &&
        !r.resolvedAt
      )
      .slice(0, 50);

  if (!rows.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          No Open Issues
        </td>
      </tr>
    `;

    return;

  }

  tbody.innerHTML = rows.map(r => `

    <tr>

      <td>
        ${new Date(
          r.timestamp
        ).toLocaleString()}
      </td>

      <td>${r.inspector}</td>

      <td>${r.location}</td>

      <td>${r.issues}</td>

      <td>${r.notes || ""}</td>

      <td>
        ${
          r.asana
            ? `
              <div class="asana-complete">
                ✅ Asana
              </div>
            `
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

  `).join("");

}

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

function updateNextWindow() {

  const el =
    document.getElementById("next-window");

  if (!el) return;

  const now = new Date();

  const next = new Date();

  next.setMinutes(0);
  next.setSeconds(0);

  next.setHours(now.getHours() + 1);

  const diff =
    next - now;

  const mins =
    Math.floor(diff / 60000);

  const secs =
    Math.floor((diff % 60000) / 1000);

  el.textContent =
    `${next.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })} (${mins}m ${secs}s)`;

}
