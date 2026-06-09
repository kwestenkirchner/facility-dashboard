javascript
function showSection(sectionId)
{
    const sections = document.querySelectorAll('.fm-section');

    sections.forEach(section =>
    {
        section.style.display = 'none';
    });

    const target = document.getElementById(sectionId);

    if (target)
    {
        target.style.display = 'block';
    }
}

function updateClock()
{
    const now = new Date();

    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');

    if (dateElement)
    {
        dateElement.innerText = now.toLocaleDateString();
    }

    if (timeElement)
    {
        timeElement.innerText = now.toLocaleTimeString();
    }
}

document.addEventListener('DOMContentLoaded', () =>
{
    showSection('dashboard');

    updateClock();

    setInterval(updateClock, 1000);
});
