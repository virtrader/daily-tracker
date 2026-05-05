const { google } = require('googleapis');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

let sheetsClient = null;

function getSheets() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function getRows(tab, range) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!${range}`,
  });
  return res.data.values || [];
}

async function appendRow(tab, values) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function updateRow(tab, rowIndex, values) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function deleteRow(tab, rowIndex) {
  const sheets = getSheets();
  // Get the sheet ID for the tab
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = meta.data.sheets.find(s => s.properties.title === tab);
  if (!sheet) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-based
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

module.exports = { getRows, appendRow, updateRow, deleteRow, SHEET_ID };
