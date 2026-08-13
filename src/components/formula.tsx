import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

/**
 * Question text with `$…$` and `$$…$$` rendered as maths.
 *
 * Content arrives with formulas written as LaTeX rather than as pictures, and
 * keeping them that way is what makes a question searchable, reflowable on a
 * phone and legible in dark mode.
 */

const SEGMENT = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g

type Segment = { tex: string; display: boolean } | { text: string }

const split = (source: string): Segment[] =>
  source.split(SEGMENT).flatMap((part): Segment[] => {
    if (!part) return []

    if (part.startsWith('$$') && part.endsWith('$$')) {
      return [{ tex: part.slice(2, -2), display: true }]
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return [{ tex: part.slice(1, -1), display: false }]
    }
    return [{ text: part }]
  })

/**
 * A bare `%` starts a comment in TeX, so `\text{%}` swallows the closing brace
 * and KaTeX gives up on the rest of the formula — which is how "60\ \text{%}"
 * came out as red source text in front of real users. No authored question here
 * uses a TeX comment, so an unescaped one always meant per cent.
 */
const escapePercent = (tex: string) => tex.replace(/(?<!\\)%/g, '\\%')

const render = (tex: string, display: boolean) => {
  try {
    return katex.renderToString(escapePercent(tex), {
      displayMode: display,
      throwOnError: false,
      strict: false
    })
  } catch {
    // A formula the renderer cannot read still has to appear: showing the raw
    // LaTeX lets somebody ask about it, where an empty gap tells them nothing.
    return null
  }
}

export const Formula = ({ children, className }: { children: string; className?: string }) => {
  const segments = useMemo(() => split(children), [children])

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        'text' in segment ? (
          <span key={index}>{segment.text}</span>
        ) : (
          <FormulaSegment key={index} tex={segment.tex} display={segment.display} />
        )
      )}
    </span>
  )
}

const FormulaSegment = ({ tex, display }: { tex: string; display: boolean }) => {
  const html = render(tex, display)

  if (html === null) return <code className='text-muted-foreground text-sm'>{tex}</code>

  return (
    <span
      className={display ? 'my-2 block overflow-x-auto' : undefined}
      // KaTeX output is generated here from the question's own markup, not from
      // anything a user typed.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
