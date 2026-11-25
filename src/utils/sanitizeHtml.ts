import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'em',
  'strong',
  'blockquote',
  'ul',
  'ol',
  'li',
  'br',
  'span',
  'i',
  'b',
  'hr',
  'div',
  'sup',
  'sub',
]

export function sanitizeBookHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  })
}
