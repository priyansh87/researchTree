'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Download, Zap, Brain, Send, Paperclip, ToggleRight, Loader2 } from 'lucide-react'
import MarkdownRenderer from '@/components/markdown-renderer'
import ChartRenderer from '@/components/chart-renderer'

interface MainPanelProps {
  researchId: string
}

const researchData: Record<string, any> = {
  'gaming-laptop': {
    title: 'Gaming Laptop Research',
    lastUpdated: '2 hours ago',
    memory: 'High-end gaming (RTX 4060+)',
    responses: [
      {
        id: 1,
        type: 'assistant',
        content: `# Gaming Laptop Comparison

Based on current market research, here are the top gaming laptops:

## Best Overall
**ASUS TUF A16 Advantage Edition**
- GPU: RTX 4060 (8GB)
- CPU: Ryzen 9 7945HX3D
- RAM: 32GB DDR5
- Display: 16" 240Hz
- Price: $1,499

## Best Value
**Lenovo Legion 5 Pro**
- GPU: RTX 4060
- CPU: Ryzen 7 7745HX
- RAM: 16GB DDR5
- Display: 16" 165Hz
- Price: $999

## Performance Leader
**MSI Raider GE78 HX**
- GPU: RTX 4090
- CPU: Intel i9-13900HX
- RAM: 32GB DDR5
- Display: 17.3" 240Hz
- Price: $2,499`,
        summary: 'Top gaming laptops for 2024 with performance and value comparisons',
        sources: 3,
        citations: 5,
        confidence: '92%',
        expanded: true,
      },
      {
        id: 2,
        type: 'user',
        content: 'What about battery life and thermal performance?',
      },
      {
        id: 3,
        type: 'assistant',
        content: `## Battery & Thermal Analysis

### Battery Performance
- ASUS TUF: 6-7 hours (efficiency mode)
- Lenovo Legion: 7-8 hours (best in class)
- MSI Raider: 3-4 hours (power-hungry GPU)

### Thermal Management
All three feature:
- Vapor chamber cooling
- Multiple heat pipes
- Efficient fan control
- Average temps: 75-85°C under load`,
        summary: 'Battery and thermal performance comparison',
        sources: 2,
        citations: 3,
        confidence: '88%',
        expanded: false,
      },
      {
        id: 4,
        type: 'assistant',
        content: `## Price to Performance Analysis

Here's a detailed comparison of the three laptops across key metrics:

\`\`\`json
{
  "chart": {
    "type": "bar",
    "title": "Gaming Laptop Price-to-Performance Ratio",
    "xAxis": "laptop",
    "dataKey": "value",
    "categories": ["Performance", "Value", "Thermal"],
    "data": [
      {
        "laptop": "ASUS TUF",
        "Performance": 8.5,
        "Value": 7.2,
        "Thermal": 8.8
      },
      {
        "laptop": "Lenovo Legion",
        "Performance": 8.2,
        "Value": 9.1,
        "Thermal": 8.5
      },
      {
        "laptop": "MSI Raider",
        "Performance": 9.5,
        "Value": 6.8,
        "Thermal": 7.2
      }
    ]
  }
}
\`\`\`

### Key Findings
- **MSI Raider** dominates in raw performance but has higher costs
- **Lenovo Legion** offers the best value proposition
- All three have solid thermal performance
`,
        summary: 'Detailed price-to-performance analysis with visual comparison',
        sources: 4,
        citations: 6,
        confidence: '94%',
        expanded: true,
        charts: [
          {
            type: 'bar',
            title: 'Gaming Laptop Price-to-Performance Ratio',
            xAxis: 'laptop',
            categories: ['Performance', 'Value', 'Thermal'],
            data: [
              { laptop: 'ASUS TUF', Performance: 8.5, Value: 7.2, Thermal: 8.8 },
              { laptop: 'Lenovo Legion', Performance: 8.2, Value: 9.1, Thermal: 8.5 },
              { laptop: 'MSI Raider', Performance: 9.5, Value: 6.8, Thermal: 7.2 },
            ],
          },
        ],
      },
    ],
  },
}


export default function MainPanel({ researchId }: MainPanelProps) {
  const [input, setInput] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [responses, setResponses] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({
    title: 'Loading Research...',
    memory: 'Loading memory...',
    lastUpdated: 'Just now',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!researchId) return

    async function loadResearchData() {
      setLoading(true)
      try {
        const metaRes = await fetch(`/api/research/${researchId}`)
        const metaData = await metaRes.json()

        const respRes = await fetch(`/api/research/${researchId}/responses`)
        const respData = await respRes.json()

        if (metaRes.ok && respRes.ok) {
          setMeta({
            ...metaData.research,
            lastUpdated: 'Just now',
          })
          setResponses(respData.responses || [])
        }
      } catch (err) {
        console.error('Error fetching research details:', err)
      } finally {
        setLoading(false)
      }
    }

    loadResearchData()
  }, [researchId])

  const handleSend = async () => {
    if (!input.trim() || !researchId) return
    const userPrompt = input.trim()
    setInput('')
    setIsResearching(true)

    try {
      // 1. Save user question turn
      const userRes = await fetch(`/api/research/${researchId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          content: userPrompt,
        }),
      })
      const userData = await userRes.json()
      if (userRes.ok && userData.response) {
        setResponses((prev) => [...prev, userData.response])
      }

      // Simulate research thinking time
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // 2. Generate and save mock agent answer turn
      const mockReply = `### Synthetic Synthesis on: ${userPrompt}\n\nHere are the mock synthesized details matching your query. We have retrieved standard facts from public nodes:\n\n*   **Performance Delta**: Solid performance benchmarked across nodes.\n*   **Efficiency**: Standard thermal and memory metrics verified.\n*   **Constraint Check**: Validated parameters.\n\n*Later, we will design the custom AI agent to crawl the web, parse PDFs, and build this response.*`

      const agentRes = await fetch(`/api/research/${researchId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assistant',
          content: mockReply,
          summary: `Analysis summary on "${userPrompt.slice(0, 30)}..."`,
          sourcesCount: 3,
          citationsCount: 4,
          confidence: '95%',
          expanded: true,
          charts: [],
        }),
      })
      const agentData = await agentRes.json()
      if (agentRes.ok && agentData.response) {
        setResponses((prev) => [...prev, agentData.response])
      }
    } catch (err) {
      console.error('Error during send transaction:', err)
    } finally {
      setIsResearching(false)
    }
  }

  const toggleExpand = async (id: string, currentlyExpanded: boolean) => {
    // Optimistic local toggle
    setResponses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, expanded: !currentlyExpanded } : r))
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 border-r border-zinc-800/50">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 text-sm mt-3">Syncing research history...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 border-r border-zinc-800/50">
      {/* Header */}
      <div className="px-8 py-6 border-b border-zinc-800/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{meta.title}</h1>
            <p className="text-sm text-zinc-400">Last updated {meta.lastUpdated}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 rounded-lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Memory & Status Bar */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20">
            <Brain className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300">Memory: {meta.memory || 'No aggregated memory yet.'}</span>
          </div>
        </div>
      </div>

      {/* Responses */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {responses.map((response: any) => (
          <div key={response.id} className="space-y-3">
            {response.type === 'assistant' ? (
              <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700/50">
                {/* Response Content */}
                <div className="mb-4">
                  {response.expanded ? (
                    <div className="space-y-4">
                      {response.summary && (
                        <h2 className="text-lg font-semibold text-white">{response.summary}</h2>
                      )}
                      <MarkdownRenderer content={response.content} />
                      {/* Render Charts if present */}
                      {response.charts &&
                        response.charts.map((chart: any, idx: number) => (
                          <div key={idx} className="mt-4 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
                            <ChartRenderer config={chart} />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-base font-semibold text-zinc-200">{response.summary || 'Summary'}</h2>
                      <p className="text-sm text-zinc-400">Expand research details below.</p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-zinc-400 font-medium">{response.sourcesCount} sources</span>
                    <span className="text-zinc-400 font-medium">{response.citationsCount} citations</span>
                    <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                      {response.confidence} confident
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => toggleExpand(response.id, response.expanded)}
                    className="text-xs text-zinc-400 hover:bg-zinc-700"
                  >
                    {response.expanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="ml-auto max-w-xl">
                <div className="bg-emerald-500 text-white rounded-2xl p-4">
                  <p className="text-sm">{response.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isResearching && (
          <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Research in progress...
            </div>
            <div className="space-y-2">
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3 animate-pulse"></div>
              </div>
              <div className="flex gap-2 text-xs text-zinc-400">
                <span>Planning...</span>
                <span>•</span>
                <span>Searching web...</span>
                <span>•</span>
                <span>Reading sources...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Composer */}
      <div className="px-8 py-6 border-t border-zinc-800/50">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="What would you like to research?"
            className="w-full p-4 pr-24 border border-zinc-700 rounded-2xl resize-none text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-zinc-800"
            rows={3}
          />

          {/* Composer Actions */}
          <div className="absolute right-4 bottom-4 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-zinc-300 hover:bg-transparent"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-zinc-300 hover:bg-transparent"
              title="Deep Research"
            >
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-zinc-300 hover:bg-transparent"
              title="Use Memory"
            >
              <Brain className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

