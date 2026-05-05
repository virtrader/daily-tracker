// Export for Claude

async function exportForClaude(range) {
  const date = formatDate(state.currentDate);
  const url = range === 'week'
    ? `export?date=${date}&range=week`
    : `export?date=${date}`;

  const data = await api(url);

  if (data.text) {
    try {
      await navigator.clipboard.writeText(data.text);
      showToast('Copied to clipboard — paste in Claude');
    } catch {
      // Fallback: show in a prompt
      prompt('Copy this text:', data.text);
    }
  } else {
    showToast('No data to export');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('export-day').addEventListener('click', () => exportForClaude('day'));
  document.getElementById('export-week').addEventListener('click', () => exportForClaude('week'));
});
