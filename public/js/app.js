// Global state
const state = {
  currentDate: new Date(),
  habits: {},
  foodEntries: [],
};

const HABIT_KEYS = [
  'meditation', 'pray', 'mobility', 'option_c', 'eat_no_sweets',
  'on_the_floor', 'protein_100g', 'sleep_score_90', 'move_rings', 'othership'
];

const HABIT_LABELS = {
  meditation: 'Meditation',
  pray: 'Pray',
  mobility: 'Mobility',
  option_c: 'Option C',
  eat_no_sweets: 'No sweets',
  on_the_floor: 'On the floor',
  protein_100g: '100g+ protein',
  sleep_score_90: 'Sleep 90+',
  move_rings: 'Move rings',
  othership: 'Othership',
};

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function displayDate(d) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (formatDate(d) === formatDate(today)) return 'Today';
  if (formatDate(d) === formatDate(yesterday)) return 'Yesterday';

  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

async function api(path, opts = {}) {
  const res = await fetch(`/api/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

// Date navigation
function updateDateDisplay() {
  document.getElementById('current-date').textContent = displayDate(state.currentDate);
}

function changeDate(delta) {
  state.currentDate.setDate(state.currentDate.getDate() + delta);
  updateDateDisplay();
  loadDayData();
}

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'review') {
    loadReview('week');
  }
}

// Load all data for current date
async function loadDayData() {
  const date = formatDate(state.currentDate);
  const [foodData, habitData] = await Promise.all([
    api(`food?date=${date}`),
    api(`habits?date=${date}`),
  ]);

  state.foodEntries = foodData.entries || [];
  state.habits = habitData.habits || {};

  renderFoodList();
  renderHabitGrid();
  renderHabitsList();
  updateSummary();
}

function updateSummary() {
  const totalCal = state.foodEntries.reduce((s, e) => s + e.calories, 0);
  const totalProt = state.foodEntries.reduce((s, e) => s + e.protein, 0);
  const habitsDone = Object.values(state.habits).filter(Boolean).length;

  document.getElementById('sum-cal').textContent = `${totalCal} kcal`;
  document.getElementById('sum-prot').textContent = `${totalProt}g protein`;
  document.getElementById('sum-habits').textContent = `${habitsDone}/10`;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateDateDisplay();

  document.getElementById('prev-day').addEventListener('click', () => changeDate(-1));
  document.getElementById('next-day').addEventListener('click', () => changeDate(1));

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  loadDayData();
});
