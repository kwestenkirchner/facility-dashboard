const API_URL = "https://script.google.com/macros/s/AKfycbxBh1cTDGdZ0olQWDp1RsTqb0oB76Bp6k3DXtRysSWSYOrZuDJE5AE8_3W8_CyxTsk8jg/exec";

let hourlyChart, dailyChart, locationChart;

async function fetchData() {
  const res = await fetch(API_URL);
  const data = await res.json();

  if (data.error) {
    console.error("API error:", data.error);
    document.getElementById("last-updated").textContent = "Error: " + data.error;
    return;
  }

  document.getElementById("last-updated").textContent =
    "Last updated: " + new Date().toLocaleString();

  updateSummaryCards(data);
  renderLocationStatus(data.locationStatus);
  renderInspectorCounts(data.inspectorCounts);
  renderOpenIssues(data.openIssues);
  renderRecentLog(data.recentLog);
  renderCharts(data);
}

function updateSummaryCards(data) {
  document.getElementById("today-count").textContent = data.todayCount ?? 0;
  document.getElementById("today-clear").textContent = data.todayClear ?? 0;
  document.getElementById("today-issues").textContent = data.todayIssues ?? 0;
  document.getElementById("open-issues").textContent = data.openIssueCount ?? 0;
  document.getElementById("locations-covered").textContent = data.locationsCovered ?? 0;
  document.getElementById("week-count").textContent = data.weekCount ?? 0;
}

function renderLocationStatus(locationStatus) {
  const tbody = document.getElementById("location-status-body");
  tbody.innerHTML = "";

  const entries = Object.entries(locationStatus || {});
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  entries.forEach(([loc, r]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${loc || ""}</td>
      <td>${r.inspector || ""}</td>
      <td>${r.status || ""}</td>
      <td>${r.issueText || ""}</td>
      <td>${formatTime(r.timestamp)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderInspectorCounts(counts) {
  const tbody = document.getElementById("inspector-counts-body");
  tbody.innerHTML = "";

  const entries = Object.entries(counts || {});
  entries.sort((a, b) => b[1] - a[1]);

  entries.forEach(([name, count]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name || ""}</td>
      <td>${count}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderOpenIssues(openIssues) {
  const tbody = document.getElementById("open-issues-body");
  tbody.innerHTML = "";

  (openIssues || []).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatTime(r.timestamp)}</td>
      <td>${r.location || ""}</td>
      <td>${r.area || ""}</td>
      <td>${r.issueText || ""}</td>
      <td>${r.inspector || ""}</td>
      <td><button class="resolve-btn" data-row="${r.sheetRow}">Resolve</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".resolve-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = btn.getAttribute("data-row");
      resolveIssue(row);
    });
  });
}

function renderRecentLog(recentLog) {
  const tbody = document.getElementById("recent-log-body");
  tbody.innerHTML = "";

  (recentLog || []).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatTime(r.timestamp)}</td>
      <td>${r.location || ""}</td>
      <td>${r.area || ""}</td>
      <td>${r.status || ""}</td>
      <td>${r.issueText || ""}</td>
      <td>${r.inspector || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCharts(data) {
  const hourly = data.hourly || [];
  const daily = data.daily || [];
  const byLocation = data.byLocation || {};

  const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hourlyClear = hourly.map(h => h.clear || 0);
  const hourlyIssue = hourly.map(h => h.issue || 0);

  const dailyLabels = daily.map(d => d.date);
  const dailyClear = daily.map(d => d.clear || 0);
  const dailyIssue = daily.map(d => d.issue || 0);

  const locEntries = Object.entries(byLocation);
  locEntries.sort((a, b) => b[1] - a[1]);
  const locLabels = locEntries.map(([loc]) => loc || "(blank)");
  const locCounts = locEntries.map(([, count]) => count);

  const hourlyCtx = document.getElementById("hourlyChart").getContext("2d");
  const dailyCtx = document.getElementById("dailyChart").getContext("2d");
  const locCtx = document.getElementById("locationChart").getContext("2d");

  if (hourlyChart) hourlyChart.destroy();
  if (dailyChart) dailyChart.destroy();
  if (locationChart) locationChart.destroy();

  hourlyChart = new Chart(hourlyCtx, {
    type: "bar",
    data: {
      labels: hourlyLabels,
      datasets: [
        {
          label: "Clear",
          data: hourlyClear,
          backgroundColor: "rgba(34,197,94,0.7)"
        },
        {
          label: "Issues",
          data: hourlyIssue,
          backgroundColor: "rgba(239,68,68,0.7)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#e5e7eb" } } },
      scales: {
        x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
        y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } }
      }
    }
  });

  dailyChart = new Chart(dailyCtx, {
    type: "bar",
    data: {
      labels: dailyLabels,
      datasets: [
        {
          label: "Clear",
          data: dailyClear,
          backgroundColor: "rgba(34,197,94,0.7)"
        },
        {
          label: "Issues",
          data: dailyIssue,
          backgroundColor: "rgba(239,68,68,0.7)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#e5e7eb" } } },
      scales: {
        x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
        y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } }
      }
    }
  });

  locationChart = new Chart(locCtx, {
    type: "bar",
    data: {
      labels: locLabels,
      datasets: [
        {
          label: "Issues",
          data: locCounts,
          backgroundColor: "rgba(239,68,68,0.7)"
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { labels: { color: "#e5e7eb" } } },
      scales: {
        x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
        y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } }
      }
    }
  });
}

function formatTime(ts) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

// Resolve button → calls doPost on Apps Script
async function resolveIssue(sheetRow) {
  if (!sheetRow) return;
  const confirmed = confirm(`Mark issue on row ${sheetRow} as resolved?`);
  if (!confirmed) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", sheetRow: Number(sheetRow) })
    });
    const result = await res.json();
    if (result && result.success) {
      alert("Issue marked resolved.");
      fetchData();
    } else {
      alert("Resolve failed: " + JSON.stringify(result));
    }
  } catch (err) {
    console.error(err);
    alert("Error resolving issue.");
  }
}

document.getElementById("refresh-btn").addEventListener("click", fetchData);

// Auto-refresh every 60 seconds
setInterval(fetchData, 60000);

// Initial load
fetchData();
