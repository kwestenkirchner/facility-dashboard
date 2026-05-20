// ====== CONFIG ======
const API_BASE = "https://script.google.com/macros/s/AKfycbxwvtChnAW1jP0wfgTNXsnXgkgEjwK51jq-xnwWaD33l81egoRxPIsEiAzIoGOMdhpJIw/exec";

// ====== GENERIC HELPERS ======
async function apiRequest(action, method = "GET", body = null) {
  const url = `${API_BASE}?action=${action}`;
  const options = { method };

  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("API Request Failed:", error);
    throw error;
  }
}

// ====== SUPERVISOR DASHBOARD ======
async function loadSupervisorData() {
  try {
    const data = await apiRequest("getAllInspections");

    updateStats(data);
    populateTable(data);
  } catch (error) {
    console.error("Failed to load supervisor data:", error);
  }
}

function updateStats(data) {
  const total = data.length;
  const unresolved = data.filter(item => !item.resolved || item.resolved === "").length;
  const resolved = total - unresolved;

  document.getElementById("total-inspections").textContent = total;
  document.getElementById("resolved-count").textContent = resolved;
  document.getElementById("unresolved-count").textContent = unresolved;
}

function populateTable(data) {
  const tbody = document.getElementById("inspection-table-body");
  tbody.innerHTML = "";

  data.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.timestamp || ""}</td>
      <td>${item.inspector || ""}</td>
      <td>${item.location || "Unknown Location"}</td>
      <td>${item.issues || ""}</td>
      <td>${item.notes || ""}</td>
      <td>${item.resolved ? "Yes" : "No"}</td>
      <td>
        ${!item.resolved ? `<button onclick="resolveIssue(${item.id})">Resolve</button>` : ""}
      </td>
    `;

    tbody.appendChild(row);
  });
}

async function resolveIssue(id) {
  try {
    await apiRequest("resolveIssue", "POST", { id });
    loadSupervisorData();
  } catch (error) {
    console.error("Failed to resolve issue:", error);
  }
}

// ====== INSPECTOR DASHBOARD ======
async function loadInspectorLocations() {
  try {
    const locations = await apiRequest("getLocations");
    const select = document.getElementById("location-select");

    select.innerHTML = "";
    locations.forEach(loc => {
      const option = document.createElement("option");
      option.value = loc;
      option.textContent = loc;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to load locations:", error);
  }
}

async function submitInspection() {
  const inspector = document.getElementById("inspector-name").value;
  const location = document.getElementById("location-select").value;
  const issues = document.getElementById("issues").value;
  const notes = document.getElementById("notes").value;

  const body = {
    inspector,
    location,
    issues,
    notes,
    photos: false
  };

  try {
    await apiRequest("submitInspection", "POST", body);
    alert("Inspection submitted!");
  } catch (error) {
    console.error("Failed to submit inspection:", error);
  }
}

// ====== PAGE LOAD HANDLERS ======
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("supervisor")) {
    loadSupervisorData();
  }

  if (document.body.classList.contains("inspector")) {
    loadInspectorLocations();
  }
});
