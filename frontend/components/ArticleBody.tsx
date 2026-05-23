'use client'

import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import { prepareMarkdown, stripDuplicateTitle } from '@/lib/markdown'

interface Props {
  markdown: string
  title?: string
}

function isStoryHeading(text: string): boolean {
  return /^Story\s+\d+:/i.test(text)
}

function isSignalHeading(text: string): boolean {
  return /this week'?s signal/i.test(text)
}

const components: Components = {
  h1: ({ children }) => <h1 className="article-h1">{children}</h1>,
  h2: ({ children }) => {
    const text = String(children)
    const story = isStoryHeading(text)
    const signal = isSignalHeading(text)
    return (
      <h2
        className={
          story
            ? 'article-story-heading'
            : signal
              ? 'article-signal-heading'
              : 'article-h2'
        }
      >
        {children}
      </h2>
    )
  },
  h3: ({ children }) => <h3 className="article-h3">{children}</h3>,
  p: ({ children }) => <p className="article-p">{children}</p>,
  strong: ({ children }) => {
    const label = String(children).replace(/:$/, '')
    const isSectionLabel =
      /^(What happened|Why it matters|What retail investors should watch|TL;?DR)/i.test(
        label,
      )
    if (isSectionLabel) {
      return <span className="article-label">{children}</span>
    }
    return <strong className="article-strong">{children}</strong>
  },
  ul: ({ children }) => <ul className="article-ul">{children}</ul>,
  ol: ({ children }) => <ol className="article-ol">{children}</ol>,
  li: ({ children }) => <li className="article-li">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="article-tldr-card">{children}</blockquote>
  ),
  hr: () => <hr className="article-hr" />,
  a: ({ href, children }) => (
    <a
      href={href}
      className="article-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const inline = !className
    if (inline) {
      return <code className="article-code-inline">{children}</code>
    }
    return <code className={className}>{children}</code>
  },
  pre: ({ children }) => <pre className="article-pre">{children}</pre>,
}

export function ArticleBody({ markdown, title }: Props) {
  let body = prepareMarkdown(markdown)
  if (title) body = stripDuplicateTitle(body, title)

  return (
    <div className="article-body">
      <ReactMarkdown components={components}>{body}</ReactMarkdown>
    </div>
  )
}
