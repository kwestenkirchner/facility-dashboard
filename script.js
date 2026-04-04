const API_URL = "https://script.google.com/macros/s/AKfycbxBh1cTDGdZ0olQWDp1RsTqb0oB76Bp6k3DXtRysSWSYOrZuDJE5AE8_3W8_CyxTsk8jg/exec";

let hourlyChart, dailyChart;

async function fetchData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    document.getElementById("last-updated").textContent =
      "Last updated: " + new Date().toLocaleString();

    updateSummaryCards(data);
    renderOpenIssues(data.openIssues || []);
    renderRecentLog(data.recentLog || []);
    renderCharts(data);
  } catch (err) {
    console.error(err);
    document.getElementById("last-updated").textContent = "Error loading data";
  }
}

function updateSummaryCards(d) {
  document.getElementById("today-count").textContent = d.todayCount ?? 0;
  document.getElementById("today-clear").textContent = d.todayClear ?? 0;
  document.getElementById("today-issues").textContent = d.todayIssues ?? 0;
  document.getElementById("open-issues").textContent = d.openIssueCount ?? 0;
  document.getElementById("locations-covered").textContent = d.locationsCovered ?? 0;
  document.getElementById("week-count").textContent = d.weekCount ?? 0;
}

function renderOpenIssues(list) {
  const tbody = document.getElementById("open-issues-body");
  tbody.innerHTML = "";

  list.forEach(r => {
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
    btn.addEventListener("click", () => resolveIssue(btn.dataset.row));
  });
}

function renderRecentLog(list) {
  const tbody = document.getElementById("recent-log-body");
  tbody.innerHTML = "";

  list.forEach(r => {
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

function renderCharts(d) {
  const hourly = d.hourly || [];
  const daily = d.daily || [];

  const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hourlyClear = hourly.map(h => h.clear || 0);
  const hourlyIssue = hourly.map(h => h.issue || 0);

  const dailyLabels = daily.map(x => x.date);
  const dailyClear = daily.map(x => x.clear || 0);
  const dailyIssue = daily.map(x => x.issue || 0);

  if (hourlyChart) hourlyChart.destroy();
  if (dailyChart) dailyChart.destroy();

  hourlyChart = new Chart(document.getElementById("hourlyChart"), {
    type: "bar",
    data: {
      labels: hourlyLabels,
      datasets: [
        { label: "Clear", data: hourlyClear, backgroundColor: "rgba(22,163,74,0.7)" },
        { label: "Issues", data: hourlyIssue, backgroundColor: "rgba(239,68,68,0.7)" }
      ]
    }
  });

  dailyChart = new Chart(document.getElementById("dailyChart"), {
    type: "bar",
    data: {
      labels: dailyLabels,
      datasets: [
        { label: "Clear", data: dailyClear, backgroundColor: "rgba(22,163,74,0.7)" },
        { label: "Issues", data: dailyIssue, backgroundColor: "rgba(239,68,68,0.7)" }
      ]
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

async function resolveIssue(row) {
  if (!row) return;
  if (!confirm(`Mark issue on row ${row} as resolved?`)) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", sheetRow: Number(row) })
    });

    const result = await res.json();
    if (result.success) fetchData();
  } catch (err) {
    console.error(err);
    alert("Error resolving issue");
  }
}

document.getElementById("refresh-btn").addEventListener("click", fetchData);
setInterval(fetchData, 60000);
fetchData();
