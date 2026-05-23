/**
 * Normalize AI-generated markdown before render (strip citation HTML, tidy spacing).
 */
export function prepareMarkdown(raw: string): string {
  let text = raw.replace(/\r\n/g, '\n').trim()

  // Claude web-search citations — keep link text, drop tags
  text = text.replace(/<cite[^>]*>/gi, '')
  text = text.replace(/<\/cite>/gi, '')

  // Other stray HTML from model output
  text = text.replace(/<\/?(?:div|span|p|br)\s*[^>]*>/gi, '')

  // Promote TL;DR block to a markdown blockquote for visual card styling
  text = text.replace(
    /^(?:---\s*\n+)?(?:\*\*)?TL;?DR(?:\*\*)?:?\s*\n+([\s\S]*?)(?=\n---\s*\n|\n## )/im,
    (_, body) => {
      const quoted = body
        .trim()
        .split('\n')
        .map((line: string) => `> ${line}`)
        .join('\n')
      return `> **TL;DR**\n${quoted}\n\n`
    },
  )

  // Collapse excessive blank lines
  text = text.replace(/\n{4,}/g, '\n\n\n')

  return text.trim()
}

/** Drop leading H1 when the page header already shows the title */
export function stripDuplicateTitle(markdown: string, title: string): string {
  const lines = markdown.split('\n')
  const first = lines.findIndex((l) => l.trim().length > 0)
  if (first === -1) return markdown

  const line = lines[first].trim()
  const h1 = line.match(/^#\s+(.+)$/)
  if (!h1) return markdown

  const heading = h1[1].trim()
  if (heading.toLowerCase() !== title.trim().toLowerCase()) return markdown

  lines.splice(first, 1)
  while (lines[first]?.trim() === '') lines.splice(first, 1)
  return lines.join('\n').trim()
}
