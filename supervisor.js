function showSection(sectionId)
{
const sections = document.querySelectorAll('.section');

```
sections.forEach(section =>
{
    section.style.display = 'none';
});

document.getElementById(sectionId).style.display = 'block';
```

}

showSection('dashboard');

function updateClock()
{
const now = new Date();

```
document.getElementById('currentDate').innerText =
    now.toLocaleDateString();

document.getElementById('currentTime').innerText =
    now.toLocaleTimeString();
```

}

setInterval(updateClock,1000);

updateClock();
