'use client'

import { ReactNode } from 'react'

const darkClasses = {
  heading: 'text-[#E8E4DD]',
  bold: 'text-[#FAF7F2]',
  medium: 'text-[#E8E4DD]',
  normal: 'text-[#C9BFA8]/95',
  blockquote: 'border-[#C9A962]/30 text-[#E8E4DD]/95',
}

const lightClasses = {
  heading: 'text-[#1A1210]',
  bold: 'text-[#1A0F0A]',
  medium: 'text-[#1A1210]',
  normal: 'text-[#1A1210]/90',
  blockquote: 'border-[#1A0F0A]/15 text-[#1A1210]/90',
}

function formatParagraph(text: string, dark = false): ReactNode {
  const c = dark ? darkClasses : lightClasses
  const trimmed = text.trim()
  if (!trimmed) return null

  if (trimmed.length < 60 && !trimmed.includes('. ') && (trimmed.endsWith('.') || !trimmed.includes('.'))) {
    return (
      <h3 className={`text-xl font-bold font-lora mt-6 mb-2 first:mt-0 ${c.heading}`}>
        {trimmed}
      </h3>
    )
  }

  if (/^\d+\.\s/.test(trimmed)) {
    const numMatch = trimmed.match(/^(\d+\.)\s+(.+)$/s)
    if (numMatch) {
      const content = numMatch[2]
      const firstSentenceEnd = content.search(/[.!?]\s+/)
      const lead = firstSentenceEnd >= 0 ? content.slice(0, firstSentenceEnd + 1).trim() : content
      const rest = firstSentenceEnd >= 0 ? content.slice(firstSentenceEnd + 1).trim() : ''
      return (
        <p className={`mb-3 leading-[1.8] ${c.normal}`}>
          <span className={`font-bold ${c.bold}`}>{numMatch[1]} </span>
          <span className={`font-medium ${c.medium}`}>{lead}</span>
          {rest && <span> {rest}</span>}
        </p>
      )
    }
  }

  if (trimmed.startsWith('- ')) {
    const rest = trimmed.slice(2)
    const dotIdx = rest.search(/[.;]/)
    const firstPart = dotIdx >= 0 ? rest.slice(0, dotIdx).trim() : rest
    const remainder = dotIdx >= 0 ? rest.slice(dotIdx + 1).trim() : ''
    const hasRemainder = remainder.length > 0
    return (
      <p className={`mb-3 pl-4 border-l-2 leading-[1.8] ${c.blockquote}`}>
        <span className={`font-semibold ${c.medium}`}>{firstPart}</span>
        {hasRemainder && <span>. {remainder}</span>}
      </p>
    )
  }

  const sentences = trimmed.split(/(?<=[.!?])\s+/)
  if (sentences.length >= 1) {
    return (
      <p className={`mb-3 leading-[1.8] ${c.normal}`}>
        {sentences[0] && (
          <span className={`font-medium ${c.medium}`}>{sentences[0]}</span>
        )}
        {sentences.slice(1).map((s, i) => (
          <span key={i}> {s}</span>
        ))}
      </p>
    )
  }

  return <p className={`mb-3 leading-[1.8] ${c.normal}`}>{trimmed}</p>
}

function normalize(text: string): string {
  return text.replace(/\s{2,}/g, ' ').trim()
}

export default function FormattedProjectText({ text, dark }: { text: string; dark?: boolean }) {
  const raw = normalize(text)
  const paragraphs = raw ? raw.split(/\n\n+/).map((p) => normalize(p)).filter(Boolean) : []

  return (
    <div className="space-y-0">
      {paragraphs.map((p, i) => (
        <div key={i}>{formatParagraph(p, dark)}</div>
      ))}
    </div>
  )
}
