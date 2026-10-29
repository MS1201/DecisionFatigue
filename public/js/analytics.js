document.addEventListener('DOMContentLoaded', async () => {

    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }


    const user = getUser();
    if (user) {
        document.getElementById('userAvatar').textContent = user.full_name.charAt(0).toUpperCase();
    }


    await loadAnalytics();

    async function loadAnalytics() {
        try {
            const data = await API.getAnalytics(7);
            if (!data) return;


            const stats = data.decisionStats || {};
            document.getElementById('decisionsSaved').textContent = stats.total_decisions_automated || 0;


            const hours = ((stats.total_decisions_automated || 0) * 5 / 60).toFixed(1);
            document.getElementById('hoursSaved').textContent = hours;

            document.getElementById('streakDays').textContent = data.habitStats?.streak_days || 0;
            document.getElementById('avgProductivity').textContent = (data.productivityScore || 0) + '%';


            document.getElementById('scheduleAdherence').textContent = (data.habitStats?.schedule_adherence || 0) + '%';
            document.getElementById('mealAdherence').textContent = (data.habitStats?.meal_adherence || 0) + '%';
            document.getElementById('taskCompletion').textContent = (stats.completion_rate || 0) + '%';


            renderChart(data.dailyStats || []);

        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    function renderChart(dailyStats) {
        const container = document.getElementById('decisionChart');
        container.innerHTML = '';

        if (dailyStats.length === 0) {
            container.innerHTML = '<p style="margin: auto; color: var(--color-text-muted);">No enough data yet</p>';
            return;
        }


        const maxVal = Math.max(...dailyStats.map(d => d.decisions_count), 5);

        dailyStats.forEach(day => {
            const bar = document.createElement('div');
            bar.className = 'bar';


            const percentage = (day.decisions_count / maxVal) * 100;
            bar.style.height = `${percentage}%`;
            bar.setAttribute('data-value', day.decisions_count);

            const label = document.createElement('div');
            label.className = 'bar-label';

            const date = new Date(day.date);
            label.textContent = date.toLocaleDateString(undefined, { weekday: 'short' });
            bar.appendChild(label);

            container.appendChild(bar);
        });
    }
});
