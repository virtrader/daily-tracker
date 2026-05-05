// Habits UI

function renderHabitGrid() {
  const grid = document.getElementById('habit-grid');
  let html = '';

  for (const key of HABIT_KEYS) {
    const done = state.habits[key] || false;
    html += `
      <div class="habit-toggle ${done ? 'done' : ''}" onclick="toggleHabit('${key}')">
        <div class="check">${done ? '&#10003;' : ''}</div>
        <span>${HABIT_LABELS[key]}</span>
      </div>`;
  }

  grid.innerHTML = html;
}

function renderHabitsList() {
  const list = document.getElementById('habits-list');
  const doneCount = Object.values(state.habits).filter(Boolean).length;

  document.getElementById('habits-progress').textContent = `${doneCount}/10`;

  let html = '';
  for (const key of HABIT_KEYS) {
    const done = state.habits[key] || false;
    html += `
      <div class="habit-row ${done ? 'done' : ''}" onclick="toggleHabit('${key}')">
        <span class="label">${HABIT_LABELS[key]}</span>
        <div class="switch"></div>
      </div>`;
  }

  list.innerHTML = html;
}

async function toggleHabit(key) {
  state.habits[key] = !state.habits[key];

  renderHabitGrid();
  renderHabitsList();
  updateSummary();

  const date = formatDate(state.currentDate);
  await api('habits', {
    method: 'PUT',
    body: { date, habits: state.habits },
  });
}
