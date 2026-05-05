const { getRows, appendRow, updateRow } = require('../lib/sheets');

const HABIT_KEYS = [
  'meditation', 'pray', 'mobility', 'option_c', 'eat_no_sweets',
  'on_the_floor', 'protein_100g', 'sleep_score_90', 'move_rings', 'othership'
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: 'date is required' });

      const rows = await getRows('Habits', 'A:K');
      const rowIndex = rows.findIndex(r => r[0] === date);

      if (rowIndex === -1) {
        // Return empty habits
        const habits = {};
        HABIT_KEYS.forEach(k => habits[k] = false);
        return res.json({ habits, exists: false });
      }

      const row = rows[rowIndex];
      const habits = {};
      HABIT_KEYS.forEach((k, i) => {
        habits[k] = row[i + 1] === 'TRUE';
      });
      return res.json({ habits, exists: true, rowIndex: rowIndex + 1 });
    }

    if (req.method === 'PUT') {
      const { date, habits } = req.body;
      if (!date || !habits) return res.status(400).json({ error: 'date and habits are required' });

      const values = [date, ...HABIT_KEYS.map(k => habits[k] ? 'TRUE' : 'FALSE')];

      // Find existing row
      const rows = await getRows('Habits', 'A:K');
      const rowIndex = rows.findIndex(r => r[0] === date);

      if (rowIndex === -1) {
        await appendRow('Habits', values);
      } else {
        await updateRow('Habits', rowIndex + 1, values);
      }

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
