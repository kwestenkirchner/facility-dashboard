// ====== CONFIG ======
const API_BASE =
  "https://script.google.com/macros/s/AKfycbz-MCJGuUWXbCLIySAZiGLAiWe106QopnXbbf0pqmm3YesmR9ZT1SkBgxefw3jnieiVmw/exec";

// ====== GENERIC HELPERS ======
async function apiRequest(action, payload = {}) {
  const body = { action, ...payload };
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Network error");
  return await res.json();
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = "";
  toast.classList.add("toast", `toast-${type}`, "toast-show");
  setTimeout(() => {
    toast.classList.remove("toast-show");
  }, 3000);
}

function startClock(id) {
  const el = document.getElementById(id);
  if (!el) return;
  function update() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    el.textContent = `${h}:${m}`;
  }
  update();
  setInterval(update, 30000);
}

// ====== SUPERVISOR DASHBOARD ======
let chartTime = null;
let chartLocation = null;

async function loadSupervisorData() {
  try {
    showToast("Loading dashboard...", "info");
    const data = await apiRequest("getSupervisorDashboard");

    // Stats
    document.getElementById("avgIssueTime").textContent =
      data.stats.avgIssueTime || "--:--";
    document.getElementById("totalInspections").textContent =
      data.stats.totalInspections ?? 0;
    document.getElementById("openIssues").textContent =
      data.stats.openIssues ?? 0;
    document.getElementById("resolvedCount").textContent =
      data.stats.resolvedCount ?? 0;

    // Locations
    renderLocationGrid(data.locations || []);

    // Issues
    renderIssueList(data.issues || []);

    // Inspector activity
    renderInspectorGrid(data.inspectors || []);

    // Recent inspections
    renderRecentTable(data.recentInspections || []);

    // Charts
    renderTimeChart(data.issuesByTime || []);
    renderLocationChart(data.issuesByLocation || []);

    showToast("Dashboard updated", "success");
  } catch (err) {
    console.error(err);
    showToast("Failed to load dashboard", "error");
  }
}

function renderLocationGrid(locations) {
  const grid = document.getElementById("locationGrid");
  if (!grid) return;
  grid.innerHTML = "";

  locations.forEach((loc) => {
    const card = document.createElement("div");
    card.className = "loc-card";

    let statusClass = "loc-ok";
    if (loc.status === "issues") statusClass = "loc-issues";
    else if (loc.status === "due") statusClass = "loc-due";

    card.innerHTML = `
      <div class="loc-header">
        <div class="loc-name">${loc.name}</div>
        <div class="loc-badge ${statusClass}">
          ${loc.statusLabel || "OK"}
        </div>
      </div>
      <div class="loc-body">
        <div class="loc-metric">
          <span class="loc-label">Open Issues</span>
          <span class="loc-value">${loc.openIssues ?? 0}</span>
        </div>
        <div class="loc-metric">
          <span class="loc-label">Last Inspection</span>
          <span class="loc-value">${loc.lastInspection || "—"}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderIssueList(issues) {
  const list = document.getElementById("issueList");
  if (!list) return;
  list.innerHTML = "";

  if (!issues.length) {
    const li = document.createElement("li");
    li.className = "ilist-empty";
    li.textContent = "No open issues — great job.";
    list.appendChild(li);
    return;
  }

  issues.forEach((issue) => {
    const li = document.createElement("li");
    li.className = "ilist-item";
    li.innerHTML = `
      <div class="ilist-main">
        <div class="ilist-title">${issue.location || "Unknown location"}</div>
        <div class="ilist-sub">${issue.description || "No description"}</div>
      </div>
      <div class="ilist-meta">
        <span class="ilist-time">${issue.time || ""}</span>
        <button class="mini-btn" data-issue-id="${issue.id}">Resolve</button>
      </div>
    `;
    list.appendChild(li);
  });

  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-issue-id]");
    if (!btn) return;
    const id = btn.getAttribute("data-issue-id");
    try {
      await apiRequest("resolveIssue", { id });
      showToast("Issue resolved", "success");
      loadSupervisorData();
    } catch (err) {
      console.error(err);
      showToast("Failed to resolve issue", "error");
    }
  });
}

function renderInspectorGrid(inspectors) {
  const grid = document.getElementById("inspectorGrid");
  if (!grid) return;
  grid.innerHTML = "";

  inspectors.forEach((ins) => {
    const card = document.createElement("div");
    card.className = "insp-card";
    card.innerHTML = `
      <div class="insp-name">${ins.name}</div>
      <div class="insp-row">
        <span class="insp-label">Inspections</span>
        <span class="insp-value">${ins.inspections ?? 0}</span>
      </div>
      <div class="insp-row">
        <span class="insp-label">Open Issues</span>
        <span class="insp-value">${ins.openIssues ?? 0}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderRecentTable(rows) {
  const tbody = document.getElementById("recentTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.datetime || ""}</td>
      <td>${r.inspector || ""}</td>
      <td>${r.location || ""}</td>
      <td>${r.issues || ""}</td>
      <td>${r.resolved || ""}</td>
      <td>${r.notes || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTimeChart(data) {
  const ctx = document.getElementById("chartTime");
  if (!ctx) return;

  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.count);

  if (chartTime) chartTime.destroy();
  chartTime = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Issues",
          data: values,
          backgroundColor: "rgba(56, 189, 248, 0.6)",
          borderColor: "rgba(56, 189, 248, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#e5e7eb" } },
        y: { ticks: { color: "#e5e7eb" } },
      },
    },
  });
}

function renderLocationChart(data) {
  const ctx = document.getElementById("chartLocation");
  if (!ctx) return;

  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.count);

  if (chartLocation) chartLocation.destroy();
  chartLocation = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Issues",
          data: values,
          backgroundColor: "rgba(52, 211, 153, 0.6)",
          borderColor: "rgba(52, 211, 153, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#e5e7eb" } },
        y: { ticks: { color: "#e5e7eb" } },
      },
    },
  });
}

// ====== INSPECTOR PANEL ======
let currentStatus = null;

async function loadInspectorData() {
  try {
    showToast("Loading inspector panel...", "info");
    const data = await apiRequest("getInspectorConfig");

    const inspectorSelect = document.getElementById("inspectorSelect");
    const locationSelect = document.getElementById("locationSelect");
    const nextInspection = document.getElementById("nextInspection");

    inspectorSelect.innerHTML =
      '<option value="">Select inspector...</option>';
    (data.inspectors || []).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      inspectorSelect.appendChild(opt);
    });

    locationSelect.innerHTML =
      '<option value="">Select location...</option>';
    (data.locations || []).forEach((loc) => {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      locationSelect.appendChild(opt);
    });

    nextInspection.textContent =
      data.nextInspection || "No upcoming inspection scheduled.";

    showToast("Inspector panel ready", "success");
  } catch (err) {
    console.error(err);
    showToast("Failed to load inspector panel", "error");
  }
}

function initStatusButtons() {
  const buttons = document.querySelectorAll(".status-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("status-selected"));
      btn.classList.add("status-selected");
      currentStatus = btn.getAttribute("data-status");
    });
  });
}

async function submitInspection() {
  const inspector = document.getElementById("inspectorSelect").value;
  const location = document.getElementById("locationSelect").value;
  const notes = document.getElementById("issueNotes").value.trim();

  if (!inspector) {
    showToast("Select an inspector", "error");
    return;
  }
  if (!location) {
    showToast("Select a location", "error");
    return;
  }
  if (!currentStatus) {
    showToast("Choose a status (All Clear / Issues Found / Inspection Due)", "error");
    return;
  }

  try{
    await apiRequest("submitInspection", {
      inspector,
      location,
      status: currentStatus,
      notes,
    });
    showToast("Inspection submitted", "success");
    document.getElementById("issueNotes").value = "";
    currentStatus = null;
    document
      .querySelectorAll(".status-btn")
      .forEach((b) => b.classList.remove("status-selected"));
  } catch (err) {
    console.error(err);
    showToast("Failed to submit inspection", "error");
  }
}

// ====== PAGE ROUTER ======
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "supervisor") {
    startClock("clock");
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", loadSupervisorData);
    }
    loadSupervisorData();
  }

  if (page === "inspector") {
    startClock("clockInspector");
    initStatusButtons();
    const submitBtn = document.getElementById("submitInspectionBtn");
    if (submitBtn) {
      submitBtn.addEventListener("click", submitInspection);
    }
    loadInspectorData();
  }
});
