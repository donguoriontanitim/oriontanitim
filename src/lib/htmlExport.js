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
      body { color: #222222; font-family: Arial, sans-serif; line-height: 1.5; margin: 32px; }
      h1 { color: #ff6a2a; font-size: 28px; margin: 0 0 8px; }
      h2 { font-size: 20px; margin: 28px 0 10px; }
      .meta { color: #666666; margin-bottom: 24px; }
      .cards { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: 20px 0; }
      .card { border: 1px solid #ffe0cc; border-radius: 14px; padding: 14px; }
      .card strong { color: #ff6a2a; display: block; font-size: 24px; }
      table { border-collapse: collapse; margin-top: 10px; width: 100%; }
      th, td { border: 1px solid #ffe0cc; padding: 9px 10px; text-align: left; vertical-align: top; }
      th { background: #fff1e8; }
      tr:nth-child(even) td { background: #fffbf5; }
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
