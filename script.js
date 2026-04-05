// Use your deployed Web App URL here
const API_URL = "https://script.google.com/macros/s/AKfycbwP8zK1M5m6sA7cnmpMxCobobpDnOOvZPL25OXsi2BmWj4OxZM3I9y0zNMVTLyA9hlk/exec";

let hourlyChart, dailyChart;
let photoTooltip, photoTooltipImg;

function initTooltip() {
  photoTooltip = document.getElementById("photo-tooltip");
  photoTooltipImg = document.getElementById("photo-tooltip-img");
}

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

/***** SEVERITY LOGIC *****/

function getSeverity(issueText) {
  if (!issueText) return "low";
  const text = issueText.toString().toLowerCase();

  const highKeywords = ["leak", "hazard", "emergency", "unsafe", "exposed", "broken glass", "fire", "flood"];
  const mediumKeywords = ["repair", "damaged", "not working", "issue", "problem", "loose"];

  if (highKeywords.some(k => text.includes(k))) return "high";
  if (mediumKeywords.some(k => text.includes(k))) return "medium";
  return "low";
}

function buildStatusBadge(status, issueText) {
  const isIssue = status === "Issue";
  const severity = isIssue ? getSeverity(issueText) : "low";

  if (!isIssue) {
    return `<span class="status-badge status-clear">
      <span class="status-icon">✔</span>
      Clear
    </span>`;
  }

  if (severity === "high") {
    return `<span class="status-badge status-issue-high">
      <span class="status-icon">⚠</span>
      Issue (High)
    </span>`;
  } else if (severity === "medium") {
    return `<span class="status-badge status-issue-medium">
      <span class="status-icon">⚠</span>
      Issue (Med)
    </span>`;
  } else {
    return `<span class="status-badge status-issue-low">
      <span class="status-icon">⚠</span>
      Issue (Low)
    </span>`;
  }
}

/***** OPEN ISSUES TABLE *****/

function renderOpenIssues(list) {
  const tbody = document.getElementById("open-issues-body");
  tbody.innerHTML = "";

  list.forEach(r => {
    const tr = document.createElement("tr");
    const photosHtml = buildPhotosHtml(r.photos || []);
    const severity = getSeverity(r.issueText);
    let rowClass = "issue-row-medium";
    if (severity === "high") rowClass = "issue-row-high";
    if (severity === "low") rowClass = "issue-row-low";
    tr.className = rowClass;

    tr.innerHTML = `
      <td>${formatTime(r.timestamp)}</td>
      <td>${r.location || ""}</td>
      <td>${r.issueText || ""}</td>
      <td>${r.notes || ""}</td>
      <td>${r.inspector || ""}</td>
      <td>${photosHtml}</td>
      <td><button class="resolve-btn" data-row="${r.sheetRow}" data-inspector="${r.inspector || ""}">Resolve</button></td>
    `;
    tbody.appendChild(tr);
  });

  attachPhotoHoverHandlers();
  tbody.querySelectorAll(".resolve-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = btn.getAttribute("data-row");
      const inspector = btn.getAttribute("data-inspector");
      resolveIssue(row, inspector);
    });
  });
}

/***** RECENT ACTIVITY TABLE *****/

function renderRecentLog(list) {
  const tbody = document.getElementById("recent-log-body");
  tbody.innerHTML = "";

  list.forEach(r => {
    const tr = document.createElement("tr");
    const photosHtml = buildPhotosHtml(r.photos || []);
    const statusBadge = buildStatusBadge(r.status, r.issueText);

    tr.innerHTML = `
      <td>${formatTime(r.timestamp)}</td>
      <td>${r.location || ""}</td>
      <td>${statusBadge}</td>
      <td>${r.issueText || ""}</td>
      <td>${r.notes || ""}</td>
      <td>${r.inspector || ""}</td>
      <td>${photosHtml}</td>
    `;
    tbody.appendChild(tr);
  });

  attachPhotoHoverHandlers();
}

/***** CHARTS *****/

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
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#111827" } } },
      scales: {
        x: { ticks: { color: "#4b5563" }, grid: { color: "#e5e7eb" } },
        y: { ticks: { color: "#4b5563" }, grid: { color: "#e5e7eb" } }
      }
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
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#111827" } } },
      scales: {
        x: { ticks: { color: "#4b5563" }, grid: { color: "#e5e7eb" } },
        y: { ticks: { color: "#4b5563" }, grid: { color: "#e5e7eb" } }
      }
    }
  });
}

/***** UTILITIES *****/

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

/***** PHOTOS: DRIVE LINKS → THUMBNAILS *****/

function extractDriveId(url) {
  if (!url) return null;
  const idMatch = url.match(/id=([^&]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  const dMatch = url.match(/\/d\/([^/]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  return null;
}

function getDriveViewUrl(url) {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/uc?export=view&id=${id}`;
}

function getDriveThumbUrl(url) {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}`;
}

function buildPhotosHtml(photos) {
  if (!photos || photos.length === 0) return "";
  return photos
    .map((url, idx) => {
      const viewUrl = getDriveViewUrl(url);
      const thumbUrl = getDriveThumbUrl(url);
      const label = photos.length === 1 ? "Photo" : `Photo ${idx + 1}`;
      return `<a href="${viewUrl}" target="_blank" class="photo-link" data-photo-thumb="${thumbUrl}">${label}</a>`;
    })
    .join("");
}

function attachPhotoHoverHandlers() {
  const links = document.querySelectorAll(".photo-link");
  links.forEach(link => {
    link.addEventListener("mouseenter", onPhotoMouseEnter);
    link.addEventListener("mouseleave", onPhotoMouseLeave);
    link.addEventListener("mousemove", onPhotoMouseMove);
  });
}

function onPhotoMouseEnter(e) {
  const thumb = e.currentTarget.getAttribute("data-photo-thumb");
  if (!thumb) return;
  photoTooltipImg.src = thumb;
  photoTooltip.style.display = "block";
  positionTooltip(e);
}

function onPhotoMouseLeave() {
  photoTooltip.style.display = "none";
  photoTooltipImg.src = "";
}

function onPhotoMouseMove(e) {
  positionTooltip(e);
}

function positionTooltip(e) {
  const offset = 16;
  const x = e.clientX + offset;
  const y = e.clientY + offset;
  photoTooltip.style.left = x + "px";
  photoTooltip.style.top = y + "px";
}

/***** RESOLVE *****/

async function resolveIssue(sheetRow, inspector) {
  if (!sheetRow) return;
  const confirmed = confirm(`Mark issue on row ${sheetRow} as resolved?`);
  if (!confirmed) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resolve",
        sheetRow: Number(sheetRow),
        resolvedBy: inspector || "Dashboard"
      })
    });
    const result = await res.json();
    if (result && result.success) {
      fetchData();
    } else {
      alert("Resolve failed");
    }
  } catch (err) {
    console.error(err);
    alert("Error resolving issue");
  }
}

/***** INIT *****/

document.getElementById("refresh-btn").addEventListener("click", fetchData);
setInterval(fetchData, 60000);

initTooltip();
fetchData();
