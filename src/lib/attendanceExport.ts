/** CSV with BOM opens cleanly in Microsoft Excel. */
export function downloadExcelCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (cell: string | number) => {
    const s = String(cell);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\r\n');
  const blob = new Blob(['\ufeff', lines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openAttendancePdfReport(title: string, bodyHtml: string) {
  const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 20px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
  th { background: #2563eb; color: #fff; }
  tr:nth-child(even) { background: #f8fafc; }
  .meta { color: #64748b; font-size: 11px; margin-bottom: 12px; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">Generated ${new Date().toLocaleString()}</div>
${bodyHtml}
</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
