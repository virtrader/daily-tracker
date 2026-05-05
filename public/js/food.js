// Food logging UI

function renderFoodList() {
  const container = document.getElementById('food-list');
  const meals = {};

  for (const entry of state.foodEntries) {
    const meal = entry.meal || 'Other';
    if (!meals[meal]) meals[meal] = [];
    meals[meal].push(entry);
  }

  const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const sortedMeals = mealOrder.filter(m => meals[m]);
  for (const m of Object.keys(meals)) {
    if (!sortedMeals.includes(m)) sortedMeals.push(m);
  }

  let html = '';
  let totalCal = 0, totalProt = 0;

  for (const meal of sortedMeals) {
    const items = meals[meal];
    html += `<div class="meal-group"><h4>${meal}</h4>`;

    for (const item of items) {
      totalCal += item.calories;
      totalProt += item.protein;
      html += `
        <div class="food-item">
          <div>
            <div class="name">${escapeHtml(item.item)}</div>
            <div class="macros">${item.calories} kcal &middot; ${item.protein}g protein</div>
          </div>
          <button class="delete-btn" onclick="deleteFood(${item.rowIndex})">&times;</button>
        </div>`;
    }
    html += '</div>';
  }

  if (state.foodEntries.length > 0) {
    html += `<div class="food-total">${totalCal} kcal &middot; ${totalProt}g protein</div>`;
  } else {
    html += '<div class="card"><p style="color:var(--text-light);text-align:center">No food logged yet</p></div>';
  }

  container.innerHTML = html;
}

async function addFood(meal, item, calories, protein) {
  const date = formatDate(state.currentDate);
  await api('food', {
    method: 'POST',
    body: { date, meal, item, calories: Number(calories), protein: Number(protein) },
  });
  await loadDayData();
  showToast('Food added');
}

async function deleteFood(rowIndex) {
  await api('food', {
    method: 'DELETE',
    body: { rowIndex },
  });
  await loadDayData();
  showToast('Deleted');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Form handlers
document.addEventListener('DOMContentLoaded', () => {
  // Quick add form (Today tab)
  document.getElementById('quick-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const meal = document.getElementById('qa-meal').value;
    const item = document.getElementById('qa-item').value;
    const cal = document.getElementById('qa-cal').value;
    const prot = document.getElementById('qa-prot').value;
    await addFood(meal, item, cal, prot);
    e.target.reset();
  });

  // Full food form (Food tab)
  document.getElementById('food-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const meal = document.getElementById('f-meal').value;
    const item = document.getElementById('f-item').value;
    const cal = document.getElementById('f-cal').value;
    const prot = document.getElementById('f-prot').value;
    await addFood(meal, item, cal, prot);
    e.target.reset();
  });
});
