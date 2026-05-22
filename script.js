/* =========================================================
   script.js
   ST. FRANCIS DE SALES FACILITY INSPECTION SYSTEM
========================================================= */

const API_URL =
"https://script.google.com/macros/s/AKfycbwCJ3NZoYJn5MqZH-RVzX4YoXhyElSgOm4F5uM81JE3kKoB7AKP0RVce-lqcxdHqxH1Pg/exec";

const INSPECTION_WINDOWS = [
  9,10,11,12,13,14,15
];

const AUTO_REFRESH_MS = 15000;

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

const DEFAULT_INSPECTORS = [
  "Ken Westenkirchner",
  "Matt Prater",
  "Corey Driver",
  "Murell Gregory",
  "Khyle Weirich",
  "Paris Martin",
  "Michael Hagmeyer",
  "Other"
];

let inspections = [];
let refreshTimer = null;


/* =========================================================
   UTILITIES
========================================================= */

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function isToday(date) {
  const d = new Date(date);
  const n = new Date();

  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}

function currentWindowHour() {

  const now = new Date();

  return now.getHours();
}

function getCurrentWindowKey() {

  const now = new Date();

  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
}

function showToast(msg) {

  const toast =
    document.getElementById("toast");

  if (!toast) return;

  toast.innerText = msg;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


/* =========================================================
   CLOCK
========================================================= */

function startClock() {

  const el =
    document.getElementById("liveClock");

  if (!el) return;

  setInterval(() => {

    el.innerText =
      new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      });

  }, 1000);
}


/* =========================================================
   SUPERVISOR
========================================================= */

async function initializeSupervisorPage() {

  startClock();

  await loadSupervisorDashboard();

  refreshTimer = setInterval(
    loadSupervisorDashboard,
    AUTO_REFRESH_MS
  );
}


async function loadSupervisorDashboard() {

  const res =
    await fetch(
      `${API_URL}?action=getAllInspections`
    );

  inspections =
    await res.json();

  renderStats();
  renderLocationCards();
  renderIssueAverageCards();
  renderIssueLog();
  renderCountdown();
}


function renderStats() {

  const total =
    inspections.length;

  const resolved =
    inspections.filter(
      x => x.resolved
    ).length;

  const unresolved =
    inspections.filter(
      x => !x.resolved &&
           x.issues
    ).length;

  setText("totalInspections", total);
  setText("resolvedIssues", resolved);
  setText("openIssues", unresolved);
}


function renderLocationCards() {

  const wrap =
    document.getElementById(
      "locationCards"
    );

  if (!wrap) return;

  wrap.innerHTML = "";

  LOCATIONS.forEach(location => {

    const relevant =
      inspections.filter(
        x => x.location === location
      );

    const unresolved =
      relevant.find(
        x => !x.resolved && x.issues
      );

    const latest =
      relevant.sort(
        (a,b)=>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      )[0];

    let cls = "gray";

    let status =
      "No Inspection Recorded";

    let meta = "";

    if (unresolved) {

      cls = "red";

      status =
        "Issue Reported";

      meta =
        unresolved.issues;
    }

    else if (latest) {

      const ts =
        new Date(latest.timestamp);

      const mins =
        (Date.now() - ts.getTime()) /
        60000;

      if (mins > 60) {

        cls = "yellow";

        status = "OVERDUE";

        meta =
          `Last Inspection:
          ${formatTime(ts)}
          · ${latest.inspector}`;
      }

      else {

        cls = "green";

        status = "All Clear";

        meta =
          `Last Inspection:
          ${formatTime(ts)}
          · ${latest.inspector}`;
      }
    }

    wrap.innerHTML += `
      <div class="area-card ${cls}">
        <div class="area-name">
          ${location}
        </div>

        <div class="area-status">
          ${status}
        </div>

        <div class="area-meta">
          ${meta}
        </div>
      </div>
    `;
  });
}


/* =========================================================
   ISSUE AVERAGE CARDS
========================================================= */

function renderIssueAverageCards() {

  const wrap =
    document.getElementById(
      "issueAverageCards"
    );

  if (!wrap) return;

  wrap.innerHTML = "";

  LOCATIONS.forEach(location => {

    const issues =
      inspections.filter(x =>
        x.location === location &&
        x.issues
      );

    if (!issues.length) return;

    const avg =
      issues.reduce((sum,x)=>{

        return (
          sum +
          new Date(x.timestamp).getHours()
        );

      },0) / issues.length;

    let hour =
      Math.round(avg);

    let label =
      hour > 12
      ? `${hour-12}:00 PM`
      : `${hour}:00 AM`;

    wrap.innerHTML += `
      <div class="avg-card">
        <div class="avg-location">
          ${location}
        </div>

        <div class="avg-count">
          ${issues.length}
          Issues
        </div>

        <div class="avg-time">
          Avg Reported:
          ${label}
        </div>
      </div>
    `;
  });
}


/* =========================================================
   ISSUE LOG
========================================================= */

function renderIssueLog() {

  const body =
    document.getElementById(
      "issueLogBody"
    );

  if (!body) return;

  body.innerHTML = "";

  const issues =
    inspections.filter(x =>
      x.issues &&
      !x.resolved
    );

  if (!issues.length) {

    body.innerHTML =
      `<tr>
        <td colspan="8">
          No open issues
        </td>
      </tr>`;

    return;
  }

  issues.forEach(row => {

    body.innerHTML += `
      <tr>

        <td>
          ${formatDate(row.timestamp)}
        </td>

        <td>
          ${formatTime(row.timestamp)}
        </td>

        <td>
          ${row.location}
        </td>

        <td>
          ${row.inspector}
        </td>

        <td>
          ${row.issues}
        </td>

        <td>
          ${row.notes || ""}
        </td>

        <td>

          ${
            row.asana
            ? `
              <span class="asana-complete">
                ✔ Asana
              </span>
            `
            : `
              <button
                class="asana-btn"
                onclick="markAsana(${row.id})"
              >
                Added to Asana
              </button>
            `
          }

        </td>

        <td>

          <button
            class="resolve-btn"
            onclick="resolveIssue(${row.id})"
          >
            Resolve
          </button>

        </td>

      </tr>
    `;
  });
}


/* =========================================================
   RESOLVE
========================================================= */

async function resolveIssue(id) {

  await fetch(API_URL, {

    method: "POST",

    body: JSON.stringify({

      action: "resolveIssue",

      id

    })
  });

  showToast("Issue resolved");

  await loadSupervisorDashboard();
}


/* =========================================================
   ASANA
========================================================= */

async function markAsana(id) {

  await fetch(API_URL, {

    method: "POST",

    body: JSON.stringify({

      action: "markAsana",

      id

    })
  });

  showToast("Marked for Asana");

  await loadSupervisorDashboard();
}


/* =========================================================
   COUNTDOWN
========================================================= */

function renderCountdown() {

  const el =
    document.getElementById(
      "countdownBox"
    );

  if (!el) return;

  const now =
    new Date();

  const next =
    INSPECTION_WINDOWS.find(
      h => h > now.getHours()
    );

  if (!next) {

    el.innerHTML =
      "Inspection windows complete for today";

    return;
  }

  const nextDate =
    new Date();

  nextDate.setHours(next);
  nextDate.setMinutes(0);
  nextDate.setSeconds(0);

  const diff =
    nextDate - now;

  const mins =
    Math.floor(diff / 60000);

  el.innerHTML =
    `Next Inspection Window:
    ${formatTime(nextDate)}
    (${mins} min)`;
}


/* =========================================================
   INSPECTOR PAGE
========================================================= */

function initializeInspectorPage() {

  startClock();

  populateInspectors();

  restoreInspector();

  renderInspectionBoard();

  setInterval(() => {
    renderInspectionBoard();
  }, 30000);
}


function populateInspectors() {

  const sel =
    document.getElementById(
      "inspectorSelect"
    );

  if (!sel) return;

  const stored =
    JSON.parse(
      localStorage.getItem(
        "extraInspectors"
      ) || "[]"
    );

  const names =
    [...DEFAULT_INSPECTORS, ...stored];

  sel.innerHTML =
    `<option value="">
      Select Inspector
    </option>`;

  names.forEach(name => {

    sel.innerHTML += `
      <option value="${name}">
        ${name}
      </option>
    `;
  });
}


function handleInspectorSelect() {

  const sel =
    document.getElementById(
      "inspectorSelect"
    );

  if (sel.value === "Other") {

    const name =
      prompt(
        "Enter Inspector Name"
      );

    if (!name) return;

    const existing =
      JSON.parse(
        localStorage.getItem(
          "extraInspectors"
        ) || "[]"
      );

    existing.push(name);

    localStorage.setItem(
      "extraInspectors",
      JSON.stringify(existing)
    );

    localStorage.setItem(
      "activeInspector",
      name
    );

    location.reload();

    return;
  }

  localStorage.setItem(
    "activeInspector",
    sel.value
  );
}


function restoreInspector() {

  const name =
    localStorage.getItem(
      "activeInspector"
    );

  const sel =
    document.getElementById(
      "inspectorSelect"
    );

  if (!sel || !name) return;

  sel.value = name;
}


function renderInspectionBoard() {

  const wrap =
    document.getElementById(
      "inspectionBoard"
    );

  if (!wrap) return;

  wrap.innerHTML = "";

  const inspector =
    localStorage.getItem(
      "activeInspector"
    );

  LOCATIONS.forEach(location => {

    const key =
      `${getCurrentWindowKey()}-${location}`;

    const state =
      localStorage.getItem(key);

    let actions = "";

    if (state === "clear") {

      actions =
        `<div class="check-green">
          ✔ All Clear
        </div>`;
    }

    else if (state === "issue") {

      actions =
        `<div class="check-red">
          ✔ Issue Reported
        </div>`;
    }

    else {

      actions = `
        <button
          class="clear-btn"
          onclick="markClear('${location}')"
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
    }

    wrap.innerHTML += `
      <div class="inspection-row">

        <div class="inspection-location">
          ${location}
        </div>

        <div class="inspection-actions">
          ${actions}
        </div>

      </div>
    `;
  });
}


function markClear(location) {

  const key =
    `${getCurrentWindowKey()}-${location}`;

  localStorage.setItem(
    key,
    "clear"
  );

  renderInspectionBoard();
}


function reportIssue(location) {

  const inspector =
    localStorage.getItem(
      "activeInspector"
    );

  const key =
    `${getCurrentWindowKey()}-${location}`;

  localStorage.setItem(
    key,
    "issue"
  );

  const url =
    `${API_URL}?action=openIssueForm` +
    `&inspector=${encodeURIComponent(inspector)}` +
    `&location=${encodeURIComponent(location)}`;

  window.location.href = url;
}


function setText(id,val) {

  const el =
    document.getElementById(id);

  if (el) {
    el.innerText = val;
  }
}
