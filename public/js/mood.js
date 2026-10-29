document.addEventListener('DOMContentLoaded', async () => {

    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }


    const moodForm = document.getElementById('moodForm');
    const moodOptions = document.querySelectorAll('.mood-option');
    const moodInput = document.getElementById('moodInput');
    const energySlider = document.getElementById('energySlider');
    const energyValue = document.getElementById('energyValue');
    const historyList = document.getElementById('moodHistoryList');
    const avgMoodDisplay = document.getElementById('avgMood');
    const avgEnergyDisplay = document.getElementById('avgEnergy');


    const user = getUser();
    if (user) {
        document.getElementById('userAvatar').textContent = user.full_name.charAt(0).toUpperCase();
    }


    loadHistory();
    loadAnalytics();


    moodOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            moodOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            moodInput.value = opt.dataset.value;
        });
    });

    energySlider.addEventListener('input', (e) => {
        energyValue.textContent = e.target.value;
    });

    moodForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!moodInput.value) {
            Toast.warning('Please select a mood emoji');
            return;
        }

        const formData = new FormData(moodForm);
        const data = Object.fromEntries(formData.entries());


        data.date = getTodayDate();

        const now = new Date();
        data.time = now.toTimeString().split(' ')[0].substring(0, 5);

        try {
            await API.logMood(data);
            moodForm.reset();
            moodOptions.forEach(o => o.classList.remove('active'));
            energyValue.textContent = '5';
            await loadHistory();
            await loadAnalytics();
            Toast.success('Mood logged successfully! 🎉');
        } catch (error) {
            Toast.error('Failed to log mood: ' + error.message);
        }
    });


    async function loadHistory() {
        try {
            // Fix: getMoodLogs requires start_date and end_date params
            const end = new Date();
            const endDate = end.toISOString().split('T')[0];
            const start = new Date();
            start.setDate(start.getDate() - 7);
            const startDate = start.toISOString().split('T')[0];
            const logs = await API.getMoodLogs(startDate, endDate);

            if (logs.length === 0) {
                historyList.innerHTML = `
                    <div style="text-align:center;padding:2rem;color:var(--color-text-muted)">
                        <div style="font-size:3rem;margin-bottom:0.75rem">😊</div>
                        <p>No mood logs yet. How are you feeling today?</p>
                    </div>`;
                return;
            }

            historyList.innerHTML = logs.map(log => `
                <div class="history-item">
                    <div class="history-emoji">${getEmojiForScore(log.mood_score)}</div>
                    <div class="history-details">
                        <div style="font-weight: 600;">Energy: ${log.energy_level}/10</div>
                        <div style="font-size: 0.85rem; color: var(--color-text-muted);">${log.notes || ''}</div>
                    </div>
                    <div class="history-date text-right">
                        <div>${new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                        <div>${log.time}</div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    async function loadAnalytics() {
        try {
            const analytics = await API.getMoodAnalytics(7);

            if (analytics) {
                avgMoodDisplay.textContent = analytics.avg_mood ? analytics.avg_mood.toFixed(1) : (analytics.averageMood ? analytics.averageMood.toFixed(1) : '-');
                avgEnergyDisplay.textContent = analytics.avg_energy ? analytics.avg_energy.toFixed(1) : (analytics.averageEnergy ? analytics.averageEnergy.toFixed(1) : '-');
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    function getEmojiForScore(score) {
        if (score >= 9) return '🚀';
        if (score >= 7) return '🤩';
        if (score >= 6) return '🙂';
        if (score >= 4) return '😐';
        if (score >= 2) return '😞';
        return '😫';
    }
});
