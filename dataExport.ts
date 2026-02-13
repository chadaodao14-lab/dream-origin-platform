/**
 * Data Export Utilities
 * Provides functions to export data to Excel and PDF formats
 */

interface ExportOptions {
  filename: string;
  sheetName?: string;
}

/**
 * Export data to CSV format (compatible with Excel)
 */
export function exportToCSV(
  data: any[],
  columns: { key: string; label: string }[],
  options: ExportOptions
): void {
  if (!data || data.length === 0) {
    alert("没有数据可导出");
    return;
  }

  // Create CSV header
  const headers = columns.map((col) => col.label).join(",");

  // Create CSV rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      })
      .join(",")
  );

  // Combine header and rows
  const csv = [headers, ...rows].join("\n");

  // Create blob and download
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${options.filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to Excel format (using simple HTML table approach)
 */
export function exportToExcel(
  data: any[],
  columns: { key: string; label: string }[],
  options: ExportOptions
): void {
  if (!data || data.length === 0) {
    alert("没有数据可导出");
    return;
  }

  // Create HTML table
  let html = `<table border="1">
    <tr>
      ${columns.map((col) => `<th>${col.label}</th>`).join("")}
    </tr>`;

  data.forEach((row) => {
    html += `<tr>
      ${columns.map((col) => `<td>${row[col.key] ?? ""}</td>`).join("")}
    </tr>`;
  });

  html += "</table>";

  // Create blob and download
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${options.filename}.xls`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any[], options: ExportOptions): void {
  if (!data || data.length === 0) {
    alert("没有数据可导出");
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${options.filename}.json`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate export report with summary
 */
export function generateReport(
  title: string,
  summary: { label: string; value: string }[],
  data: any[],
  columns: { key: string; label: string }[]
): string {
  let html = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .summary { margin: 20px 0; padding: 10px; background: #f5f5f5; }
          .summary-item { margin: 5px 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background: #3b82f6; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="summary">
          ${summary.map((item) => `<div class="summary-item"><strong>${item.label}:</strong> ${item.value}</div>`).join("")}
        </div>
        <table>
          <tr>
            ${columns.map((col) => `<th>${col.label}</th>`).join("")}
          </tr>
          ${data.map((row) => `<tr>${columns.map((col) => `<td>${row[col.key] ?? ""}</td>`).join("")}</tr>`).join("")}
        </table>
      </body>
    </html>
  `;

  return html;
}

/**
 * Download report as HTML file
 */
export function downloadReport(
  html: string,
  filename: string
): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.html`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
