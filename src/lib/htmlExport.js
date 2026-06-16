export const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const createHtmlDocument = ({ body, title }) => `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color: #222222;
        background: #fffbf5;
        font-family: Inter, Arial, sans-serif;
        line-height: 1.55;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #fffbf5 0%, #ffffff 46%, #fff8f0 100%);
        color: #222222;
      }
      body > * { max-width: 1180px; margin-left: auto; margin-right: auto; }
      h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
      h1 { color: #222222; font-size: clamp(30px, 4vw, 48px); line-height: 1.04; margin: 8px 0 0; }
      h2 { color: #222222; font-size: 22px; margin: 0 0 14px; }
      p { margin: 0; }
      ul { margin: 0; padding-left: 20px; }
      li + li { margin-top: 8px; }
      .report-cover {
        margin: 24px auto;
        border: 1px solid #ffe0cc;
        border-radius: 22px;
        background: #ffffff;
        box-shadow: 0 24px 70px rgba(255, 106, 42, 0.12);
        padding: 28px;
      }
      .eyebrow {
        color: #ff6a2a;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .meta, .data-note {
        color: rgba(34, 34, 34, 0.62);
        font-size: 13px;
        font-weight: 700;
      }
      .meta-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 20px;
      }
      .meta-grid span, .data-note {
        border: 1px solid #ffe0cc;
        border-radius: 14px;
        background: #fffbf5;
        padding: 10px 12px;
      }
      .data-note { display: block; margin-top: 12px; }
      .section-block {
        margin: 18px auto;
        border: 1px solid #ffe0cc;
        border-radius: 18px;
        background: #ffffff;
        padding: 22px;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .summary-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }
      .summary-grid p {
        border-radius: 14px;
        background: #fffbf5;
        padding: 12px;
        font-size: 14px;
        font-weight: 700;
      }
      .cards {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      }
      .card {
        border: 1px solid #ffe0cc;
        border-radius: 16px;
        background: linear-gradient(180deg, #ffffff 0%, #fffbf5 100%);
        padding: 14px;
        min-height: 92px;
      }
      .card strong {
        color: #ff6a2a;
        display: block;
        font-size: 22px;
        line-height: 1.15;
        overflow-wrap: anywhere;
      }
      .card span { color: rgba(34, 34, 34, 0.62); display: block; font-size: 12px; font-weight: 900; margin-top: 6px; }
      table {
        border-collapse: separate;
        border-spacing: 0;
        font-size: 13px;
        width: 100%;
      }
      th, td {
        border-bottom: 1px solid #ffe0cc;
        padding: 10px 11px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #fff1e8;
        color: #222222;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      tr:nth-child(even) td { background: #fffbf5; }
      .bar {
        display: block;
        width: 100%;
        min-width: 110px;
        height: 9px;
        overflow: hidden;
        border-radius: 999px;
        background: #ffffff;
        border: 1px solid #ffe0cc;
      }
      .bar span { display: block; height: 100%; border-radius: inherit; background: #ff6a2a; }
      .pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: #fff1e8;
        color: #c2410c;
        font-size: 11px;
        font-weight: 900;
        padding: 4px 9px;
        white-space: nowrap;
      }
      .notice {
        display: grid;
        gap: 4px;
        border-radius: 16px;
        margin: 10px 0;
        padding: 13px 14px;
      }
      .notice strong { font-size: 14px; }
      .notice span { font-size: 13px; font-weight: 700; }
      .notice-warning { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; }
      .notice-danger { background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; }
      .notice-info { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
      .empty-slots {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 14px;
      }
      .empty-slots span {
        border: 1px dashed #ffb088;
        border-radius: 14px;
        background: #fffbf5;
        padding: 12px;
        font-weight: 800;
      }
      .report-controls {
        align-items: center;
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        margin-bottom: 12px;
      }
      .report-controls input, .report-controls select {
        border: 1px solid #ffe0cc;
        border-radius: 12px;
        min-height: 40px;
        padding: 8px 10px;
        width: 100%;
      }
      .report-controls label {
        align-items: center;
        display: flex;
        gap: 8px;
        font-size: 13px;
        font-weight: 800;
      }
      .report-controls label input { width: auto; }
      .report-pagination { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
      .report-pagination button {
        border: 1px solid #ffe0cc;
        border-radius: 10px;
        background: #ffffff;
        color: #ff6a2a;
        cursor: pointer;
        font-weight: 900;
        min-height: 34px;
        min-width: 34px;
      }
      .report-pagination button.active { background: #ff6a2a; color: #ffffff; }
      .log-table { font-size: 12px; }
      .log-table th, .log-table td { overflow-wrap: anywhere; }
      .avoid-break { break-inside: avoid; page-break-inside: avoid; }
      @media (max-width: 720px) {
        body { padding: 0 12px; }
        .report-cover, .section-block { border-radius: 16px; padding: 16px; }
        table { display: block; overflow-x: auto; white-space: nowrap; }
      }
      @page { margin: 12mm; size: A4; }
      @media print {
        body { background: #ffffff; color-adjust: exact; print-color-adjust: exact; }
        body > * { max-width: none; }
        .no-print, .report-controls, .report-pagination { display: none !important; }
        .report-cover, .section-block {
          border-color: #f2c9b3;
          border-radius: 12px;
          box-shadow: none;
          margin: 0 0 10mm;
          padding: 12px;
        }
        .cards { grid-template-columns: repeat(3, 1fr); }
        table { font-size: 10px; page-break-inside: auto; }
        tr { break-inside: avoid; page-break-inside: avoid; }
        th, td { padding: 6px; }
        h1 { font-size: 30px; }
        h2 { font-size: 18px; }
      }
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>`

export const downloadHtmlFile = ({ body, filename, title }) => {
  const documentHtml = createHtmlDocument({ body, title })
  const blob = new Blob([documentHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
