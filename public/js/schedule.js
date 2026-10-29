document.addEventListener('DOMContentLoaded', async () => {

    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }


    let currentDate = getTodayDate();


    const scheduleContainer = document.getElementById('scheduleContainer');
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    const generateBtn = document.getElementById('generateBtn');
    const settingsForm = document.getElementById('scheduleSettingsForm');


    const user = getUser();
    if (user) {
        document.getElementById('userAvatar').textContent = user.full_name.charAt(0).toUpperCase();
    }


    updateDateDisplay();
    await loadSchedule(currentDate);
    await loadPreferences();


    prevDayBtn.addEventListener('click', () => changeDay(-1));
    nextDayBtn.addEventListener('click', () => changeDay(1));

    generateBtn.addEventListener('click', async () => {
        if (confirm('This will overwrite any existing schedule for this day. Continue?')) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div> Generating...';
            try {
                await API.generateSchedule(currentDate);
                await loadSchedule(currentDate);
            } catch (error) {
                alert('Failed to generate schedule: ' + error.message);
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '✨ Generate New Schedule';
            }
        }
    });

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = settingsForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            await API.updatePreferences({
                work_start_time: document.getElementById('workStart').value,
                work_end_time: document.getElementById('workEnd').value,
                energy_peak_time: document.getElementById('energyPeak').value
            });
            alert('Preferences updated! Regenerate your schedule to see changes.');
        } catch (error) {
            alert('Failed to update preferences: ' + error.message);
        } finally {
            submitBtn.disabled = false;
        }
    });


    function updateDateDisplay() {
        currentDateDisplay.textContent = formatDate(currentDate);
    }

    function changeDay(offset) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + offset);
        currentDate = date.toISOString().split('T')[0];
        updateDateDisplay();
        loadSchedule(currentDate);
    }

    async function loadSchedule(date) {
        scheduleContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-3xl);">
                <div class="spinner" style="margin: 0 auto;"></div>
                <p class="mt-1">Loading schedule...</p>
            </div>
        `;

        try {
            const schedule = await API.getSchedule(date);

            if (!schedule || !schedule.schedule_data) {
                renderEmptyState();
                return;
            }

            renderSchedule(schedule.schedule_data);
        } catch (error) {
            console.error('Error loading schedule:', error);
            scheduleContainer.innerHTML = `
                <div class="alert alert-error">Failed to load schedule. Please try again.</div>
            `;
        }
    }

    function renderEmptyState() {
        scheduleContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-3xl); color: var(--color-text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">📅</div>
                <h3>No Schedule for Today</h3>
                <p class="mb-2">Let AI organize your day for maximum productivity.</p>
                <button class="btn btn-primary" onclick="document.getElementById('generateBtn').click()">
                    Generate Schedule
                </button>
            </div>
        `;
    }

    function renderSchedule(items) {
        if (items.length === 0) {
            renderEmptyState();
            return;
        }

        scheduleContainer.innerHTML = items.map(item => `
            <div class="time-slot">
                <div class="time-col">
                    ${formatTime(item.time)}
                </div>
                <div class="activity-col">
                    <div class="activity-title">
                        ${item.activity}
                        <span class="energy-tag energy-${getEnergyClass(item.energy_level)}">
                            ${item.energy_level.charAt(0).toUpperCase() + item.energy_level.slice(1)} Energy
                        </span>
                    </div>
                    <div class="activity-details">
                        ${item.duration} mins • ${item.type}
                    </div>
                </div>
            </div>
        `).join('');
    }

    function formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    }

    function getEnergyClass(level) {

        const map = {
            'high': 'high',
            'medium': 'medium',
            'low': 'low',
            'rest': 'rest'
        };
        return map[level] || 'medium';
    }

    async function loadPreferences() {
        try {
            const { preferences } = await API.getProfile();
            if (preferences) {
                document.getElementById('workStart').value = preferences.work_start_time || '09:00';
                document.getElementById('workEnd').value = preferences.work_end_time || '17:00';
                document.getElementById('energyPeak').value = preferences.energy_peak_time || 'morning';
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }
});
