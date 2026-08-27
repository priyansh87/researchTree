'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ChartRenderer from './chart-renderer'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Preprocess text content to format citations and extract chart data
  const processedContent = useMemo(() => {
    let processedText = content

    // Convert citation numbers (e.g. " 4 " or " 5.") into markdown links so they render as badges
    // We only target 1 or 2 digit numbers to avoid matching model numbers like 4060
    processedText = processedText.replace(/\s(\d{1,2})([\s\.\,])/g, ' [$1](#cite-$1)$2')

    const chartMatches = content.match(/```json\n({[\s\S]*?"chart"[\s\S]*?})\n```/g)

    if (chartMatches) {
      chartMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/```json\n/, '').replace(/\n```/, '')
          const parsed = JSON.parse(jsonStr)
          if (parsed.chart) {
            // Replace the chart JSON block with a placeholder
            processedText = processedText.replace(match, `[CHART_RENDER:${JSON.stringify(parsed.chart)}]`)
          }
        } catch (e) {
          console.log('[v0] Failed to parse chart JSON:', e)
        }
      })
    }
    return processedText
  }, [content])

  // Split content to render charts separately
  const contentParts = useMemo(() => {
    const parts: Array<{ type: 'text' | 'chart'; content: any }> = []
    const chartRegex = /\[CHART_RENDER:(.*?)\]/g
    let lastIndex = 0
    let match

    while ((match = chartRegex.exec(processedContent)) !== null) {
      // Add text before chart
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: processedContent.substring(lastIndex, match.index),
        })
      }
      // Add chart
      try {
        const chartConfig = JSON.parse(match[1])
        parts.push({
          type: 'chart',
          content: chartConfig,
        })
      } catch (e) {
        console.log('[v0] Failed to parse chart config:', e)
      }
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < processedContent.length) {
      parts.push({
        type: 'text',
        content: processedContent.substring(lastIndex),
      })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: processedContent }]
  }, [processedContent])

  return (
    <div className="space-y-4">
      {contentParts.map((part, idx) => {
        if (part.type === 'chart') {
          return (
            <div key={idx} className="my-6 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
              <ChartRenderer config={part.content} />
            </div>
          )
        }

        return (
          <div key={idx} className="prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Headings
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold text-white mt-6 mb-4" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-bold text-white mt-5 mb-3" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-base font-semibold text-white mt-3 mb-2" {...props} />
                ),
                // Paragraphs
                p: ({ node, ...props }) => (
                  <p className="text-zinc-300 leading-relaxed mb-3 text-[14px]" {...props} />
                ),
                // Lists
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-3" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside space-y-2 text-zinc-300 mb-3" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-zinc-300 text-[14px]" {...props} />
                ),
                // Code
                code: ({ node, inline, ...props }) => {
                  if (inline) {
                    return (
                      <code
                        className="bg-zinc-800 text-emerald-400 px-2 py-1 rounded font-mono text-[13px]"
                        {...props}
                      />
                    )
                  }
                  return (
                    <code
                      className="block bg-zinc-850 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-3 border border-zinc-800"
                      {...props}
                    />
                  )
                },
                pre: ({ node, ...props }) => (
                  <pre className="bg-zinc-850 text-zinc-100 p-4 rounded-lg overflow-x-auto mb-3 border border-zinc-800" {...props} />
                ),
                // Links
                a: ({ node, href, children, ...props }) => {
                  if (href?.startsWith('#cite-')) {
                    const citeNum = href.replace('#cite-', '')
                    return (
                      <span 
                        className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700 transition-all select-none mx-0.5 align-top mt-0.5 cursor-pointer shadow-sm"
                        title={`Citation ${citeNum}`}
                      >
                        {citeNum}
                      </span>
                    )
                  }
                  return (
                    <a
                      className="text-emerald-400 hover:text-emerald-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={href}
                      {...props}
                    />
                  )
                },
                // Blockquotes
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-emerald-500 pl-4 py-2 text-zinc-350 italic mb-3 bg-zinc-900/10"
                    {...props}
                  />
                ),
                // Tables
                table: ({ node, ...props }) => (
                  <table className="w-full border-collapse mb-3 text-sm" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-left text-white font-semibold" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-zinc-700 px-4 py-2 text-zinc-305" {...props} />
                ),
                // Strong and emphasis
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-white" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-zinc-350" {...props} />
                ),
              }}
            >
              {part.content}
            </ReactMarkdown>
          </div>
        )
      })}
    </div>
  )
}

