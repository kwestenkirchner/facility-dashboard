const API_URL =
'https://script.google.com/macros/s/AKfycbwCJ3NZoYJn5MqZH-RVzX4YoXhyElSgOm4F5uM81JE3kKoB7AKP0RVce-lqcxdHqxH1Pg/exec';

function showSection(sectionId)
{
const sections =
document.querySelectorAll('.fm-section');

sections.forEach(section =>
{
    section.style.display = 'none';
});

const target =
    document.getElementById(sectionId);

if(target)
{
    target.style.display = 'block';
}

}

function updateClock()
{
const now = new Date();

const dateElement =
    document.getElementById('currentDate');

const timeElement =
    document.getElementById('currentTime');

if(dateElement)
{
    dateElement.innerText =
        now.toLocaleDateString();
}

if(timeElement)
{
    timeElement.innerText =
        now.toLocaleTimeString();
}

}

async function loadDashboard()
{
try
{
const response =
await fetch(
API_URL + '?action=dashboard'
);

    const data =
        await response.json();

    console.log(data);

    populateStaffingCard(data.staffing);
    populateEventCard(data.events);
    populateIssueCard(data.issues);
    populateAssignmentCard(data.assignments);
}
catch(error)
{
    console.error(
        'Dashboard Load Error:',
        error
    );
}

}

function populateStaffingCard(staffing)
{
const card =
document.getElementById('attendanceCard');

if(!card) return;

card.innerHTML = `
    <h3>Today's Staffing Impact</h3>

    <p>Absences:
    ${staffing.absences}</p>

    <p>PTO:
    ${staffing.pto}</p>

    <p>Coverage Needed:
    ${staffing.coverageNeeded}</p>
`;

}

function populateEventCard(events)
{
const card =
document.getElementById('eventCard');

if(!card) return;

const totalEvents =
    Array.isArray(events)
        ? events.length
        : 0;

const setupEvents =
    Array.isArray(events)
        ? events.filter(
            e => e.setupRequired
          ).length
        : 0;

card.innerHTML = `
    <h3>Events Today</h3>
    <p>${totalEvents} Scheduled</p>
    <p>${setupEvents} Require Setup</p>
`;

}

function populateIssueCard(issues)
{
const card =
document.getElementById('issuesCard');

if(!card) return;

card.innerHTML = `
    <h3>Open Issues</h3>
    <p>${issues.open}</p>
    <p>Critical: ${issues.critical}</p>
`;

}

function populateAssignmentCard(assignments)
{
const card =
document.getElementById('assignmentCard');

if(!card) return;

card.innerHTML = `
    <h3>Assignment Progress</h3>
    <p>Completed:
    ${assignments.completed}</p>

    <p>Remaining:
    ${assignments.remaining}</p>

    <p>Late:
    ${assignments.late}</p>
`;

}

document.addEventListener(
'DOMContentLoaded',
() =>
{
showSection('dashboard');

    updateClock();

    setInterval(
        updateClock,
        1000
    );

    loadDashboard();
}

);
