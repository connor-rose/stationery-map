export function formatStoreHoursHtml(hours: string): string {
  const row = (label: string, value: string) =>
    `<div style="display: flex; gap: 12px;">
      <span style="min-width: 100px;">${label}</span>
      <span>${value}</span>
    </div>`;

  return hours
    .split(/[,;]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      if (/closed/i.test(segment)) {
        const colonClosed = segment.match(/^([^:]+):\s*(closed.*)$/i);
        if (colonClosed) {
          return row(colonClosed[1].trim(), colonClosed[2].trim());
        }
        const spaceClosed = segment.match(/^(.+?)\s+(closed.*)$/i);
        if (spaceClosed) {
          return row(spaceClosed[1].trim(), spaceClosed[2].trim());
        }
      }

      const colonHours = segment.match(/^([^:]+):\s*(.+)$/);
      if (colonHours) {
        return row(colonHours[1].trim(), colonHours[2].trim());
      }

      const spaceHours = segment.match(/^(.+?)\s+(\d.*)$/);
      if (spaceHours) {
        return row(spaceHours[1].trim(), spaceHours[2].trim());
      }

      return `<div style="font-size: 14px; color: #000000;">${segment}</div>`;
    })
    .join('');
}
