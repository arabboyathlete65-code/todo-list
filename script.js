document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const categorySelect = document.getElementById('categorySelect');
    const prioritySelect = document.getElementById('prioritySelect');
    const dueDateInput = document.getElementById('dueDate');
    const reminderTimeInput = document.getElementById('reminderTime');
    const repeatSelect = document.getElementById('repeatSelect');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const exportBtn = document.getElementById('exportBtn');
    const taskList = document.getElementById('taskList');
    const themeToggle = document.getElementById('themeToggle');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const toggleCompletedBtn = document.getElementById('toggleCompleted');
    const overallStats = document.getElementById('overallStats');
    const progressFill = document.getElementById('progressFill');
    const showWeeklyBtn = document.getElementById('showWeekly');
    const showMonthlyBtn = document.getElementById('showMonthly');
    const statsTable = document.getElementById('statsTable');
    const calendarTabs = document.querySelectorAll('.calendar-tab');
    const calendarTableContainer = document.getElementById('calendarTableContainer');
    const calendarStats = document.getElementById('calendarStats');
    const reminderSound = document.getElementById('reminderSound');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let hideCompleted = false;
    let pieChart = null;
    let barChart = null;
    let currentCalendarType = 'daily';

    // Notification ruxsat
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // Tema
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        renderTasks();
    });

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        overallStats.textContent = `Umumiy: ${percent}% bajarilgan (${completed}/${total})`;
        progressFill.style.width = `${percent}%`;
    }

    function updatePieChart() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;

        if (pieChart) pieChart.destroy();

        const ctx = document.getElementById('pieChart').getContext('2d');
        pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Bajarilgan', 'Bajarmagan'],
                datasets: [{
                    data: [completed, pending],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderColor: document.body.classList.contains('dark') ? '#333' : '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: 'var(--text)' } }
                }
            }
        });
    }

    function groupTasksByPeriod(period) {
        const grouped = {};
        tasks.forEach(task => {
            const date = new Date(task.createdAt);
            let key;
            if (period === 'weekly') {
                key = `${date.getFullYear()}-W${Math.floor((date.getDate() - 1) / 7) + 1}`;
            } else {
                key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            }
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(task);
        });
        return grouped;
    }

    function showStatsTable(period) {
        statsTable.innerHTML = '';
        statsTable.classList.remove('hidden');

        const headerRow = document.createElement('tr');
        headerRow.innerHTML = period === 'weekly' 
            ? '<th>Hafta</th><th>Bajarilgan</th><th>Bajarmagan</th><th>Foiz</th>'
            : '<th>Oy</th><th>Bajarilgan</th><th>Bajarmagan</th><th>Foiz</th>';
        statsTable.appendChild(headerRow);

        const grouped = groupTasksByPeriod(period);
        for (const [key, group] of Object.entries(grouped)) {
            const row = document.createElement('tr');
            const completed = group.filter(t => t.completed).length;
            const total = group.length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            row.innerHTML = `<td>${key}</td><td>${completed}</td><td>${total - completed}</td><td>${percent}%</td>`;
            statsTable.appendChild(row);
        }

        updateBarChart(period);
    }

    function updateBarChart(period) {
        document.getElementById('barChart').classList.remove('hidden');

        if (barChart) barChart.destroy();

        const grouped = groupTasksByPeriod(period);
        const labels = Object.keys(grouped).sort();
        const completedData = labels.map(key => grouped[key].filter(t => t.completed).length);
        const pendingData = labels.map(key => grouped[key].length - completedData[labels.indexOf(key)]);

        const ctx = document.getElementById('barChart').getContext('2d');
        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bajarilgan',
                        data: completedData,
                        backgroundColor: '#28a745',
                        borderColor: '#218838',
                        borderWidth: 1
                    },
                    {
                        label: 'Bajarmagan',
                        data: pendingData,
                        backgroundColor: '#dc3545',
                        borderColor: '#c82333',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, ticks: { color: 'var(--text)' } },
                    x: { ticks: { color: 'var(--text)' } }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: 'var(--text)' } }
                }
            }
        });
    }

    function getTodayStr() {
        return new Date().toISOString().split('T')[0];
    }

    function getCurrentDateTime() {
        return new Date().toISOString(); // 2026-02-12T04:29:00.000Z formatida
    }

    function formatDateTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('uz-UZ', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function updateHabitHistory(task, dateStr, isCompleted) {
        task.completed = isCompleted;
        if (isCompleted) {
            task.completedAt = getCurrentDateTime(); // bajarilgan vaqtni saqlash
        } else {
            task.completedAt = null; // agar bekor qilinsa, vaqt o‘chiriladi
        }
        task.history[dateStr] = isCompleted;
        saveTasks();
    }

    function getTypeStats(type) {
        const habits = tasks.filter(t => t.repeat === type);
        let completedDays = 0;
        let totalDays = 0;
        habits.forEach(task => {
            for (const dStr in task.history) {
                if (new Date(dStr) <= new Date(getTodayStr())) {
                    totalDays++;
                    if (task.history[dStr]) completedDays++;
                }
            }
        });
        const percent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        return ` ${type} statistika: ${percent}% bajarilgan (${completedDays}/${totalDays})`;
    }

    function renderCalendar(type = 'daily') {
        calendarTableContainer.innerHTML = '';
        calendarStats.innerHTML = getTypeStats(type);
        calendarStats.classList.remove('hidden');

        const table = document.createElement('table');
        table.id = 'calendarTable';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>No</th><th class="habit-name">Vazifalar</th>';

        let dateList = [];
        const today = new Date();
        const todayStr = getTodayStr();

        if (type === 'daily') {
            for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() + i);
                const dStr = d.toISOString().split('T')[0];
                dateList.push(dStr);

                const th = document.createElement('th');
                th.textContent = d.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' });
                if (dStr === todayStr) {
                    th.style.backgroundColor = '#ffd700';
                    th.style.fontWeight = 'bold';
                }
                headerRow.appendChild(th);
            }
        } else if (type === 'weekly') {
            // Joriy hafta + keyingi 3 hafta (real hisoblash)
            const currentDayOfWeek = today.getDay();
            const daysToNextMonday = currentDayOfWeek === 0 ? 1 : 8 - currentDayOfWeek;
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + daysToNextMonday);

            for (let w = 0; w < 4; w++) {
                const weekStart = new Date(nextMonday);
                weekStart.setDate(nextMonday.getDate() + w * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                const label = `${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleString('uz-UZ', {month: 'short'})}`;
                dateList.push(weekStart.toISOString().split('T')[0]);

                const th = document.createElement('th');
                th.textContent = `Hafta ${w + 1} (${label})`;
                if (weekStart <= today && today <= weekEnd) {
                    th.style.backgroundColor = '#ffd700';
                }
                headerRow.appendChild(th);
            }
        } else if (type === 'monthly') {
            let current = new Date(today);
            let monthsToShow = 1;
            const daysLeftInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate() - current.getDate();
            if (daysLeftInMonth < 7) monthsToShow = 2;

            for (let m = 0; m < monthsToShow; m++) {
                const year = current.getFullYear();
                const month = current.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                for (let day = (m === 0 ? current.getDate() : 1); day <= daysInMonth; day++) {
                    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    dateList.push(dStr);

                    const th = document.createElement('th');
                    th.textContent = day;
                    if (dStr === todayStr) th.style.backgroundColor = '#ffd700';
                    headerRow.appendChild(th);
                }
                current.setMonth(current.getMonth() + 1);
            }
        }

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        const habits = tasks.filter(t => t.repeat === type);

        habits.forEach((task, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}</td><td class="habit-name">${task.text}</td>`;

            dateList.forEach(dStr => {
                const td = document.createElement('td');
                const status = task.history?.[dStr];
                const isFuture = new Date(dStr) > new Date(todayStr);
                const isToday = dStr === todayStr;

                if (isFuture) {
                    td.textContent = '—';
                    td.classList.add('future');
                } else {
                    td.textContent = status === true ? '✅' : '❌';
                    td.classList.add(status === true ? 'completed' : 'missed', 'cursor-pointer');

                    td.addEventListener('click', () => {
                        if (!task.history) task.history = {};
                        const newStatus = !status;
                        task.history[dStr] = newStatus;
                        if (isToday) {
                            task.completed = newStatus;
                            if (newStatus) task.completedAt = getCurrentDateTime();
                            else task.completedAt = null;
                        }
                        saveTasks();
                        renderTasks();
                        renderCalendar(type);
                    });
                }

                if (isToday) {
                    td.style.border = '2px solid #ffd700';
                    td.style.fontWeight = 'bold';
                }

                row.appendChild(td);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        calendarTableContainer.appendChild(table);

        if (habits.length === 0) {
            calendarTableContainer.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Bu turdagi takrorlanuvchi vazifa yo‘q</p>';
        }
    }

    function updateRepeatingTasks() {
        const todayStr = getTodayStr();
        tasks.forEach(task => {
            if (task.repeat !== 'none' && task.history[todayStr] === undefined) {
                task.history[todayStr] = false;
            }
        });
        saveTasks();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        updateStats();
        updatePieChart();
        updateRepeatingTasks();

        let filteredTasks = tasks.filter(task => {
            if (hideCompleted && task.completed) return false;
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        const searchText = searchInput.value.trim().toLowerCase();
        if (searchText) {
            filteredTasks = filteredTasks.filter(task => task.text.toLowerCase().includes(searchText));
        }

        const sortBy = sortSelect.value;
        filteredTasks.sort((a, b) => {
            if (sortBy === 'priority') {
                const priorities = { high: 3, medium: 2, low: 1 };
                return priorities[b.priority] - priorities[a.priority];
            }
            return b.createdAt - a.createdAt;
        });

        filteredTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.classList.add('task-item', task.priority + '-priority');
            if (task.completed) li.classList.add('completed');
            if (task.dueDate && new Date(task.dueDate) < new Date() && !task.completed) li.classList.add('overdue');

            const dueDateStr = task.dueDate ? `Muddat: ${new Date(task.dueDate).toLocaleDateString('uz-UZ')}` : '';
            const repeatStr = task.repeat !== 'none' ? `Takror: ${task.repeat}` : '';
            const reminderStr = task.reminderTime ? `Eslatma: ${new Date(task.reminderTime).toLocaleTimeString('uz-UZ')}` : '';
            const categoryStr = task.category ? `Kategoriya: ${task.category}` : '';
            const completedTimeStr = task.completed && task.completedAt 
                ? `Bajarilgan vaqti: ${formatDateTime(task.completedAt)}` 
                : '';

            li.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${task.text}</span>
                    <div class="task-info">${categoryStr} ${dueDateStr} ${repeatStr} ${reminderStr}</div>
                    ${completedTimeStr ? `<div class="completed-time">${completedTimeStr}</div>` : ''}
                </div>
                <div class="actions">
                    <button class="edit-btn" title="Tahrirlash"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="O'chirish"><i class="fas fa-trash"></i></button>
                </div>
            `;

            li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                task.completed = isChecked;
                if (isChecked) {
                    task.completedAt = getCurrentDateTime();
                } else {
                    task.completedAt = null;
                }
                updateHabitHistory(task, getTodayStr(), isChecked);
                saveTasks();
                renderTasks();
            });

            li.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm("Bu vazifani o'chirmoqchimisiz?")) {
                    tasks.splice(index, 1);
                    saveTasks();
                    renderTasks();
                }
            });

            li.querySelector('.edit-btn').addEventListener('click', () => {
                const textSpan = li.querySelector('.task-text');
                const currentText = textSpan.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                textSpan.replaceWith(input);
                input.focus();
                const saveEdit = () => {
                    const newText = input.value.trim();
                    if (newText) {
                        task.text = newText;
                        saveTasks();
                    }
                    renderTasks();
                };
                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') renderTasks();
                });
            });

            taskList.appendChild(li);

            if (task.reminderTime && !task.completed) {
                const reminderTimeout = new Date(task.reminderTime) - Date.now();
                if (reminderTimeout > 0) {
                    setTimeout(() => {
                        if (Notification.permission === "granted") {
                            new Notification("Vazifa Eslatmasi", { body: task.text });
                        }
                        reminderSound.play();
                    }, reminderTimeout);
                }
            }
        });
    }

    addTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (!text) return;

        const dueDate = dueDateInput.value ? new Date(dueDateInput.value).getTime() : null;
        const reminderTime = reminderTimeInput.value ? new Date(`${dueDateInput.value || getTodayStr()}T${reminderTimeInput.value}`).getTime() : null;
        const repeat = repeatSelect.value;

        tasks.push({
            text,
            category: categorySelect.value,
            priority: prioritySelect.value,
            completed: false,
            createdAt: Date.now(),
            dueDate,
            reminderTime,
            repeat,
            history: {},
            completedAt: null  // yangi maydon — bajarilgan vaqt
        });

        saveTasks();
        taskInput.value = '';
        categorySelect.value = '';
        prioritySelect.value = 'low';
        dueDateInput.value = '';
        reminderTimeInput.value = '';
        repeatSelect.value = 'none';
        renderTasks();
    });

    taskInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') addTaskBtn.click();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    toggleCompletedBtn.addEventListener('click', () => {
        hideCompleted = !hideCompleted;
        toggleCompletedBtn.innerHTML = hideCompleted ? '<i class="fas fa-eye"></i> Ko\'rsatish' : '<i class="fas fa-eye-slash"></i> Yashirish';
        renderTasks();
    });

    showWeeklyBtn.addEventListener('click', () => showStatsTable('weekly'));
    showMonthlyBtn.addEventListener('click', () => showStatsTable('monthly'));

    calendarTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            calendarTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCalendarType = btn.dataset.type;
            renderCalendar(currentCalendarType);
        });
    });

    searchInput.addEventListener('input', renderTasks);
    sortSelect.addEventListener('change', renderTasks);

    exportBtn.addEventListener('click', () => {
        let csv = 'Text,Category,Priority,Completed,CreatedAt,DueDate,Repeat,CompletedAt\n';
        tasks.forEach(task => {
            csv += `"${task.text}","${task.category}","${task.priority}",${task.completed},"${new Date(task.createdAt).toLocaleString()}", "${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}","${task.repeat}","${task.completedAt || ''}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.csv';
        a.click();
    });

    renderTasks();
    renderCalendar('daily');
});