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

  const habitRows = await getRows('Habits', 'A:K');
  const habitRow = habitRows.find(r => r[0] === date);

  if (!habitRow) {
    return `On ${dateStr}, I didn't log any habits.`;
  }

  const done = [];
  const missed = [];
  HABIT_LABELS.forEach((label, i) => {
    if (habitRow[i + 1] === 'TRUE') {
      done.push(label.toLowerCase());
    } else {
      missed.push(label.toLowerCase());
    }
  });

  const lines = [`On ${dateStr}, I completed ${done.length} out of 10 habits.`];

  if (done.length > 0) {
    lines.push(`I did: ${done.join(', ')}.`);
  }
  if (missed.length > 0) {
    lines.push(`I missed: ${missed.join(', ')}.`);
  }

  return lines.join(' ');
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
  const weekData = {};
  for (const row of habitRows) {
    const d = row[0];
    if (d < start || d > end) continue;
    const doneLabels = [];
    const missedLabels = [];
    HABIT_LABELS.forEach((label, i) => {
      if (row[i + 1] === 'TRUE') {
        doneLabels.push(label.toLowerCase());
      } else {
        missedLabels.push(label.toLowerCase());
      }
    });
    weekData[d] = { done: doneLabels, missed: missedLabels };
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const lines = [`Here is my habit tracking for the week of ${startLabel} to ${endLabel}.`];

  let totalDone = 0, daysWithData = 0;
  const cursor = new Date(monday);

  for (let i = 0; i < 7; i++) {
    const d = fmt(cursor);
    const data = weekData[d];

    if (data) {
      const count = data.done.length;
      totalDone += count;
      daysWithData++;
      let dayLine = `${dayNames[i]}: ${count}/10.`;
      if (data.missed.length > 0 && data.missed.length <= 5) {
        dayLine += ` Missed: ${data.missed.join(', ')}.`;
      } else if (data.done.length > 0 && data.done.length <= 5) {
        dayLine += ` Did: ${data.done.join(', ')}.`;
      }
      lines.push(dayLine);
    } else {
      lines.push(`${dayNames[i]}: no data.`);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (daysWithData > 0) {
    const avg = (totalDone / daysWithData).toFixed(1);
    lines.push(`Weekly average: ${avg} out of 10 habits per day across ${daysWithData} tracked day${daysWithData > 1 ? 's' : ''}.`);
  }

  return lines.join('\n');
}
