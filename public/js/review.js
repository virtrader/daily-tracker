// Review tab — weekly/monthly charts

async function loadReview(range) {
  const date = formatDate(state.currentDate);
  const data = await api(`summary?date=${date}&range=${range}`);

  renderChart('chart-calories', data.days, 'calories', 'kcal');
  renderChart('chart-protein', data.days, 'protein', 'g');
  renderChart('chart-habits', data.days, 'habits', '/10');
}

function renderChart(containerId, days, field, unit) {
  const container = document.getElementById(containerId);
  const values = days.map(d => d[field] || 0);
  const max = Math.max(...values, 1);

  let html = '';
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const val = d[field] || 0;
    const heightPct = (val / max) * 85;
    const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });

    html += `
      <div class="chart-bar">
        <div class="bar-value">${val > 0 ? val : ''}</div>
        <div class="bar" style="height: ${heightPct}%"></div>
        <div class="bar-label">${dayLabel}</div>
      </div>`;
  }

  container.innerHTML = html;
}

// Toggle buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadReview(btn.dataset.range);
    });
  });
});
