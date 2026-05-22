const API_URL =
"https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

const FORM_URL =
"https://docs.google.com/forms/d/e/1FAIpQLSdv0823sBL02gmS9hErEdXtpKLNaWyahyLUxqt5apCOQCEcdQ/viewform";

const AREAS = [
  "3rd Floor Restroom",
  "2nd Floor Restroom",
  "Cafeteria Mens Restroom",
  "Auxiliary Locker Room 1 - North Wrestling Baseball Locker Room",
  "Auxiliary Locker Room 2 - South Gym Locker Room"
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

function updateClock() {
  const now = new Date();

  const el = document.getElementById("clock");

  if(el){
    el.textContent = now.toLocaleTimeString();
  }
}

setInterval(updateClock,1000);

function initializeInspectorPage(){

  populateInspectorDropdown();

  const stored = localStorage.getItem("activeInspector");

  if(stored){
    loadInspectionScreen(stored);
  }

  renderInspectionBoard();

  updateInspectionWindow();

  setInterval(updateInspectionWindow,1000);

}

function populateInspectorDropdown(){

  const select =
    document.getElementById("inspector-select");

  if(!select) return;

  INSPECTORS.forEach(name => {

    const option =
      document.createElement("option");

    option.value = name;
    option.textContent = name;

    select.appendChild(option);

  });

  select.addEventListener("change", () => {

    const otherWrap =
      document.getElementById("other-name-wrap");

    if(select.value === "Other"){
      otherWrap.style.display = "block";
    }else{
      otherWrap.style.display = "none";
    }

  });

}

function startInspection(){

  let inspector =
    document.getElementById("inspector-select").value;

  if(inspector === "Other"){
    inspector =
      document.getElementById("other-name").value.trim();
  }

  if(!inspector){
    alert("Please select or enter a name.");
    return;
  }

  localStorage.setItem(
    "activeInspector",
    inspector
  );

  loadInspectionScreen(inspector);

}

function loadInspectionScreen(name){

  document.getElementById("login-screen")
    .style.display = "none";

  document.getElementById("inspection-screen")
    .style.display = "block";

  document.getElementById("active-inspector")
    .textContent = name;

}

function getHourKey(){

  const now = new Date();

  return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}-${now.getHours()}`;

}

function getInspectionData(){

  return JSON.parse(
    localStorage.getItem("inspectionData") || "{}"
  );

}

function saveInspectionData(data){

  localStorage.setItem(
    "inspectionData",
    JSON.stringify(data)
  );

}

function renderInspectionBoard(){

  const board =
    document.getElementById("inspection-board");

  if(!board) return;

  const data = getInspectionData();

  const hourKey = getHourKey();

  if(!data[hourKey]){
    data[hourKey] = {};
  }

  board.innerHTML = AREAS.map(area => {

    const status =
      data[hourKey][area];

    let buttons = `
      <button
        class="clear-btn"
        onclick="markAreaClear('${area}')">
        All Clear
      </button>

      <button
        class="issue-btn"
        onclick="reportIssue('${area}')">
        Issues Found
      </button>
    `;

    if(status === "clear"){
      buttons = `
        <div class="complete-green">
          ✔ All Clear
        </div>
      `;
    }

    if(status === "issue"){
      buttons = `
        <div class="complete-red">
          ✔ Issues Reported
        </div>
      `;
    }

    return `
      <div class="inspection-row">

        <div class="inspection-area">
          ${area}
        </div>

        <div class="inspection-actions">
          ${buttons}
        </div>

      </div>
    `;

  }).join("");

}

function markAreaClear(area){

  const data = getInspectionData();

  const hourKey = getHourKey();

  if(!data[hourKey]){
    data[hourKey] = {};
  }

  data[hourKey][area] = "clear";

  saveInspectionData(data);

  renderInspectionBoard();

}

function reportIssue(area){

  const inspector =
    localStorage.getItem("activeInspector") || "";

  const data = getInspectionData();

  const hourKey = getHourKey();

  if(!data[hourKey]){
    data[hourKey] = {};
  }

  data[hourKey][area] = "issue";

  saveInspectionData(data);

  renderInspectionBoard();

  const url =
    `${FORM_URL}?usp=pp_url` +
    `&entry.1456245431=${encodeURIComponent(inspector)}` +
    `&entry.1739126018=${encodeURIComponent(area)}`;

  window.open(url,"_blank");

}

function updateInspectionWindow(){

  const now = new Date();

  const nextHour = new Date();

  nextHour.setHours(now.getHours()+1);
  nextHour.setMinutes(0);
  nextHour.setSeconds(0);

  const diff =
    nextHour - now;

  const mins =
    Math.floor(diff / 60000);

  const secs =
    Math.floor((diff % 60000)/1000);

  const countdown =
    document.getElementById("countdown");

  if(countdown){
    countdown.textContent =
      `${mins}m ${secs}s`;
  }

  const windowEl =
    document.getElementById("inspection-window");

  if(windowEl){

    const start =
      `${now.getHours()}:00`;

    const end =
      `${now.getHours()+1}:00`;

    windowEl.textContent =
      `${start} - ${end}`;

  }

}

async function initializeSupervisorPage(){

  updateClock();

  await loadSupervisorDashboard();

  setInterval(loadSupervisorDashboard,60000);

}

async function loadSupervisorDashboard(){

  const response =
    await fetch(
      `${API_URL}?action=getAllInspections`
    );

  const data =
    await response.json();

  renderStats(data);

  renderTable(data);

  renderAreaCards(data);

  renderIssueChart(data);

}

function renderStats(data){

  const total =
    data.length;

  const resolved =
    data.filter(x => x.resolved).length;

  const unresolved =
    total - resolved;

  document.getElementById("total-count")
    .textContent = total;

  document.getElementById("resolved-count")
    .textContent = resolved;

  document.getElementById("unresolved-count")
    .textContent = unresolved;

}

function renderTable(data){

  const tbody =
    document.getElementById("inspection-table");

  if(!tbody) return;

  tbody.innerHTML =
    data.reverse().map(item => {

      return `
        <tr>

          <td>${new Date(item.timestamp).toLocaleString()}</td>

          <td>${item.inspector}</td>

          <td>${item.location}</td>

          <td>${item.issues}</td>

          <td>${item.notes}</td>

          <td>
            ${item.resolved ? "Yes" : "No"}
          </td>

          <td>

            ${
              !item.resolved
              ? `
                <button
                  class="resolve-btn"
                  onclick="resolveIssue(${item.id})">
                  Resolve
                </button>
              `
              : "—"
            }

          </td>

        </tr>
      `;

    }).join("");

}

function renderAreaCards(data){

  const grid =
    document.getElementById("area-status-grid");

  if(!grid) return;

  const latest = {};

  AREAS.forEach(area => {

    const areaReports =
      data.filter(x => x.location === area);

    if(areaReports.length){

      latest[area] =
        areaReports.sort((a,b)=>
          new Date(b.timestamp) -
          new Date(a.timestamp)
        )[0];

    }

  });

  grid.innerHTML =
    AREAS.map(area => {

      const item = latest[area];

      if(!item){

        return `
          <div class="area-card overdue">

            <div class="area-title">
              ${area}
            </div>

            <div class="area-meta">
              No inspections recorded.
            </div>

          </div>
        `;

      }

      const ts =
        new Date(item.timestamp);

      const diffHours =
        (Date.now() - ts.getTime()) /
        3600000;

      let cls = "";

      if(!item.resolved){
        cls = "issue";
      }else if(diffHours >= 1){
        cls = "overdue";
      }

      return `
        <div class="area-card ${cls}">

          <div class="area-title">
            ${area}
          </div>

          <div class="area-meta">

            Last Inspection:
            ${ts.toLocaleString()}

            <br><br>

            Inspector:
            ${item.inspector}

          </div>

        </div>
      `;

    }).join("");

}

let issueChart;

function renderIssueChart(data){

  const counts = {};

  AREAS.forEach(area => {
    counts[area] = [];
  });

  data.forEach(item => {

    const hr =
      new Date(item.timestamp).getHours();

    if(item.location){
      counts[item.location].push(hr);
    }

  });

  const labels = [];
  const averages = [];

  Object.keys(counts).forEach(area => {

    const vals = counts[area];

    if(vals.length){

      const avg =
        vals.reduce((a,b)=>a+b,0) /
        vals.length;

      labels.push(area);

      averages.push(avg);

    }

  });

  const ctx =
    document.getElementById("issue-time-chart");

  if(!ctx) return;

  if(issueChart){
    issueChart.destroy();
  }

  issueChart =
    new Chart(ctx,{
      type:"bar",
      data:{
        labels,
        datasets:[{
          label:"Average Hour",
          data:averages
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false
      }
    });

}

async function resolveIssue(id){

  await fetch(
    `${API_URL}?action=resolveIssue`,
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({id})
    }
  );

  loadSupervisorDashboard();

}
