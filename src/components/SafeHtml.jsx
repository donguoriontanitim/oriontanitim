import DOMPurify from 'dompurify'

function SafeHtml({ html = '', className = '' }) {
  return (
    <div
      className={`safe-html ${className}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  )
}

export default SafeHtml
