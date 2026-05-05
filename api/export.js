const { getRows } = require('../lib/sheets');

const HABIT_LABELS = [
  'Meditation', 'Pray', 'Mobility', 'Option C', 'Eat no sweets',
  'On the floor', '100g+ protein', 'Sleep score above 90', 'Move rings closed', 'Othership'
];

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { date, range } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });

    if (range === 'week') {
      return res.json({ text: await exportWeek(date) });
    }

    return res.json({ text: await exportDay(date) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

async function exportDay(date) {
  const d = new Date(date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const lines = [`## ${dateStr}`, '', '### Food Log'];

  // Food
  const foodRows = await getRows('FoodLog', 'A:E');
  const entries = foodRows.filter(r => r[0] === date);

  const byMeal = {};
  let totalCal = 0, totalProtein = 0;
  for (const row of entries) {
    const meal = row[1] || 'Other';
    if (!byMeal[meal]) byMeal[meal] = [];
    const cal = Number(row[3]) || 0;
    const prot = Number(row[4]) || 0;
    byMeal[meal].push({ item: row[2], calories: cal, protein: prot });
    totalCal += cal;
    totalProtein += prot;
  }

  const mealKeys = MEAL_ORDER.filter(m => byMeal[m]);
  // Add any meals not in the standard order
  for (const m of Object.keys(byMeal)) {
    if (!mealKeys.includes(m)) mealKeys.push(m);
  }

  for (const meal of mealKeys) {
    const items = byMeal[meal];
    const itemStr = items.map(i => `${i.item} (${i.calories} kcal, ${i.protein}g protein)`).join(', ');
    lines.push(`**${meal}:** ${itemStr}`);
  }

  if (entries.length === 0) {
    lines.push('No food logged.');
  }

  lines.push('', `**Totals: ${totalCal.toLocaleString()} kcal | ${totalProtein}g protein**`);

  // Habits
  const habitRows = await getRows('Habits', 'A:K');
  const habitRow = habitRows.find(r => r[0] === date);

  if (habitRow) {
    const doneCount = habitRow.slice(1).filter(v => v === 'TRUE').length;
    lines.push('', `### Habits (${doneCount}/10)`);
    HABIT_LABELS.forEach((label, i) => {
      const done = habitRow[i + 1] === 'TRUE';
      lines.push(`- [${done ? 'x' : ' '}] ${label}`);
    });
  } else {
    lines.push('', '### Habits', 'No habits logged.');
  }

  return lines.join('\n');
}

async function exportWeek(date) {
  const targetDate = new Date(date + 'T00:00:00');
  const day = targetDate.getDay();
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = d => d.toISOString().split('T')[0];
  const start = fmt(monday);
  const end = fmt(sunday);

  const startLabel = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Get food data
  const foodRows = await getRows('FoodLog', 'A:E');
  const foodByDate = {};
  for (const row of foodRows) {
    const d = row[0];
    if (d < start || d > end) continue;
    if (!foodByDate[d]) foodByDate[d] = { calories: 0, protein: 0 };
    foodByDate[d].calories += Number(row[3]) || 0;
    foodByDate[d].protein += Number(row[4]) || 0;
  }

  // Get habit data
  const habitRows = await getRows('Habits', 'A:K');
  const habitsByDate = {};
  for (const row of habitRows) {
    const d = row[0];
    if (d < start || d > end) continue;
    habitsByDate[d] = row.slice(1).filter(v => v === 'TRUE').length;
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const lines = [
    `## Week of ${startLabel} - ${endLabel}`,
    '',
    '| Day | Calories | Protein | Habits |',
    '|-----|----------|---------|--------|',
  ];

  let totalCal = 0, totalProtein = 0, totalHabits = 0, daysWithData = 0;
  const cursor = new Date(monday);

  for (let i = 0; i < 7; i++) {
    const d = fmt(cursor);
    const food = foodByDate[d];
    const habits = habitsByDate[d];
    const cal = food?.calories || 0;
    const prot = food?.protein || 0;
    const hab = habits ?? '-';

    lines.push(`| ${dayNames[i]} | ${cal.toLocaleString()} | ${prot}g | ${hab === '-' ? '-' : hab + '/10'} |`);

    if (food || habits !== undefined) {
      totalCal += cal;
      totalProtein += prot;
      totalHabits += (habits || 0);
      daysWithData++;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (daysWithData > 0) {
    const avgCal = Math.round(totalCal / daysWithData);
    const avgProt = Math.round(totalProtein / daysWithData);
    const avgHab = (totalHabits / daysWithData).toFixed(1);
    lines.push(`| **Avg** | **${avgCal.toLocaleString()}** | **${avgProt}g** | **${avgHab}/10** |`);
  }

  return lines.join('\n');
}
