const { getRows } = require('../lib/sheets');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { range, date } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const targetDate = new Date(date + 'T00:00:00');
    let startDate, endDate;

    if (range === 'month') {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    } else {
      // Default to week
      const day = targetDate.getDay();
      startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - ((day + 6) % 7)); // Monday
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Sunday
    }

    const fmt = d => d.toISOString().split('T')[0];
    const start = fmt(startDate);
    const end = fmt(endDate);

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
      const count = row.slice(1).filter(v => v === 'TRUE').length;
      habitsByDate[d] = count;
    }

    // Build daily summaries
    const days = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const d = fmt(cursor);
      days.push({
        date: d,
        calories: foodByDate[d]?.calories || 0,
        protein: foodByDate[d]?.protein || 0,
        habits: habitsByDate[d] ?? null,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return res.json({ days, start, end });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
