document.addEventListener('DOMContentLoaded', async () => {

    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }


    const q1List = document.getElementById('q1-list');
    const q2List = document.getElementById('q2-list');
    const q3List = document.getElementById('q3-list');
    const q4List = document.getElementById('q4-list');
    const addTaskForm = document.getElementById('addTaskForm');
    const topPriorityList = document.getElementById('topPriorityList');


    const user = getUser();
    if (user) {
        document.getElementById('userAvatar').textContent = user.full_name.charAt(0).toUpperCase();
    }


    await loadTasks();


    addTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addTaskForm);
        const taskData = Object.fromEntries(formData.entries());

        try {
            await API.createTask(taskData);
            addTaskForm.reset();
            await loadTasks();
            Toast.success('Task added successfully! ✅');
        } catch (error) {
            Toast.error('Failed to add task: ' + error.message);
        }
    });

    window.loadTasks = async function () {
        try {

            [q1List, q2List, q3List, q4List].forEach(el => {
                const header = el.firstElementChild;
                el.innerHTML = '';
                el.appendChild(header);
            });

            const tasks = await API.getTasks('pending');

            if (tasks.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.style.cssText = 'grid-column:1/-1;text-align:center;padding:2rem;color:var(--color-text-muted)';
                emptyMsg.innerHTML = '<div style="font-size:2.5rem;margin-bottom:0.5rem">✅</div><p>No pending tasks! Add one above.</p>';
                q1List.parentElement.appendChild(emptyMsg);
                return;
            }

            tasks.forEach(task => {
                const el = createTaskElement(task);
                const quadrant = task.eisenhower_quadrant || 'Q4';

                if (quadrant === 'Q1') q1List.appendChild(el);
                else if (quadrant === 'Q2') q2List.appendChild(el);
                else if (quadrant === 'Q3') q3List.appendChild(el);
                else q4List.appendChild(el);
            });


            renderTopPriorities(tasks.slice(0, 5));

        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    function createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'matrix-task';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <strong>${task.title}</strong>
                <button class="btn-sm btn-outline" style="border: none; padding: 2px; background:none; cursor:pointer;" onclick="completeTask(${task.id})">✅</button>
            </div>
            <div style="font-size: 0.7rem; color: var(--color-text-secondary);">
                Score: ${task.priority_score} ${task.deadline ? `• Due: ${new Date(task.deadline).toLocaleDateString()}` : ''}
            </div>
        `;
        return div;
    }

    function renderTopPriorities(tasks) {
        topPriorityList.innerHTML = tasks.map(task => `
            <li class="task-item" style="border-left-color: ${getPriorityColor(task.eisenhower_quadrant)}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${task.title}</strong>
                    <span class="badge" style="font-size: 0.6rem; background: ${getPriorityColor(task.eisenhower_quadrant)}; color: #fff; padding: 2px 8px; border-radius: 9999px;">${task.eisenhower_quadrant}</span>
                </div>
            </li>
        `).join('');
    }

    function getPriorityColor(quadrant) {
        const colors = {
            'Q1': 'var(--color-error)',
            'Q2': 'var(--color-primary)',
            'Q3': 'var(--color-warning)',
            'Q4': 'var(--color-text-muted)'
        };
        return colors[quadrant] || 'var(--color-primary)';
    }

    window.completeTask = async (id) => {
        if (window.confirm('Mark task as completed?')) {
            try {
                await API.updateTask(id, { status: 'completed' });
                await loadTasks();
                Toast.success('Task completed! 🎉');
            } catch (error) {
                Toast.error('Failed to update task');
            }
        }
    };
});
