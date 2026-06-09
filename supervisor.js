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
                'https://script.google.com/macros/s/AKfycbwCJ3NZoYJn5MqZH-RVzX4YoXhyElSgOm4F5uM81JE3kKoB7AKP0RVce-lqcxdHqxH1Pg/exec'
            );

        const data =
            await response.json();

        populateDashboard(data);
    }
    catch(error)
    {
        console.error(error);
    }
}

function populateDashboard(data)
{
    if(!data) return;

    const attendance =
        data.attendance || {};

    const issues =
        data.issues || {};

    const assignments =
        data.assignments || {};

    const events =
        data.events || [];

    document.getElementById(
        'attendanceCard'
    ).innerHTML = `
        <h3>Attendance</h3>
        <p>Present: ${attendance.present || 0}</p>
        <p>Absent: ${attendance.absent || 0}</p>
        <p>PTO: ${attendance.pto || 0}</p>
    `;

    document.getElementById(
        'issuesCard'
    ).innerHTML = `
        <h3>Open Issues</h3>
        <p>Open: ${issues.open || 0}</p>
        <p>Critical: ${issues.critical || 0}</p>
    `;

    document.getElementById(
        'assignmentCard'
    ).innerHTML = `
        <h3>Assignment Progress</h3>
        <p>Completed: ${assignments.completed || 0}</p>
        <p>Remaining: ${assignments.remaining || 0}</p>
        <p>Late: ${assignments.late || 0}</p>
    `;

    document.getElementById(
        'eventCard'
    ).innerHTML =
    `
        <h3>Events Today</h3>
        ${events.length}
        Event(s)
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
