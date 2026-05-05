const { getRows, appendRow, deleteRow } = require('../lib/sheets');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: 'date is required' });

      const rows = await getRows('FoodLog', 'A:F');
      const entries = rows
        .map((row, i) => ({ rowIndex: i + 1, date: row[0], meal: row[1], item: row[2], calories: Number(row[3]) || 0, protein: Number(row[4]) || 0, timestamp: row[5] }))
        .filter(r => r.date === date);

      return res.json({ entries });
    }

    if (req.method === 'POST') {
      const { date, meal, item, calories, protein } = req.body;
      if (!date || !meal || !item) return res.status(400).json({ error: 'date, meal, item are required' });

      const timestamp = new Date().toISOString();
      await appendRow('FoodLog', [date, meal, item, calories || 0, protein || 0, timestamp]);
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { rowIndex } = req.body;
      if (!rowIndex) return res.status(400).json({ error: 'rowIndex is required' });

      await deleteRow('FoodLog', rowIndex);
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
