const { getRows } = require('../lib/sheets');

const HABIT_LABELS = [
  'Meditation', 'Pray', 'Mobility', 'Option C', 'Eat no sweets',
  'On the floor', '100g+ protein', 'Sleep score above 90', 'Move rings closed', 'Othership'
];

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

  const lines = [`## ${dateStr}`];

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
    '| Day | Habits |',
    '|-----|--------|',
  ];

  let totalHabits = 0, daysWithData = 0;
  const cursor = new Date(monday);

  for (let i = 0; i < 7; i++) {
    const d = fmt(cursor);
    const habits = habitsByDate[d];
    const hab = habits !== undefined ? habits + '/10' : '-';

    lines.push(`| ${dayNames[i]} | ${hab} |`);

    if (habits !== undefined) {
      totalHabits += habits;
      daysWithData++;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (daysWithData > 0) {
    const avgHab = (totalHabits / daysWithData).toFixed(1);
    lines.push(`| **Avg** | **${avgHab}/10** |`);
  }

  return lines.join('\n');
}
