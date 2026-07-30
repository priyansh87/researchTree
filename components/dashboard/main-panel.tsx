'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Download, Zap, Brain, Send, Paperclip, ToggleRight, Loader2, Trash2, X, Plus, Settings } from 'lucide-react'
import MarkdownRenderer from '@/components/markdown-renderer'
import ChartRenderer from '@/components/chart-renderer'
import ChatTabModal from './chat-tab-modal'

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
  
  const [chatTabs, setChatTabs] = useState<any[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('main')
  const [isTabModalOpen, setIsTabModalOpen] = useState(false)
  const [tabToEdit, setTabToEdit] = useState<any | null>(null)
  
  const [highlightedResponseId, setHighlightedResponseId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [responses, isResearching])
  
  const [meta, setMeta] = useState<any>({
    title: 'Loading Research...',
    memory: 'Loading memory...',
    lastUpdated: 'Just now',
  })
  const [loading, setLoading] = useState(true)

  // 1. Fetch metadata and tabs on researchId change
  useEffect(() => {
    if (!researchId) return

    async function loadResearchMetaAndTabs() {
      try {
        const metaRes = await fetch(`/api/research/${researchId}`)
        const metaData = await metaRes.json()
        if (metaRes.ok) {
          setMeta({
            ...metaData.research,
            lastUpdated: 'Just now',
          })
        }

        const tabsRes = await fetch(`/api/research/${researchId}/tabs`)
        const tabsData = await tabsRes.json()
        if (tabsRes.ok) {
          setChatTabs(tabsData.tabs || [])
        }
      } catch (err) {
        console.error('Error fetching research details/tabs:', err)
      }
    }

    loadResearchMetaAndTabs()
    setActiveTabId('main')
  }, [researchId])

  // 2. Fetch responses on activeTabId change
  useEffect(() => {
    if (!researchId) return

    async function loadResponses() {
      setLoading(true)
      try {
        const respRes = await fetch(`/api/research/${researchId}/responses?chatTabId=${activeTabId}`)
        const respData = await respRes.json()
        if (respRes.ok) {
          setResponses(respData.responses || [])
        }
      } catch (err) {
        console.error('Error fetching responses:', err)
      } finally {
        setLoading(false)
      }
    }

    loadResponses()
  }, [researchId, activeTabId])

  // Listen to topic selection from the knowledge graph to scroll and glow highlight matching card
  useEffect(() => {
    const handleTopicSelected = (e: Event) => {
      const { title, keywords } = (e as CustomEvent).detail;
      if (!title) return;

      const matchedResponse = responses.find((resp) => {
        if (resp.type !== 'assistant') return false;

        // Check if response summary matches or contains title (case-insensitive)
        if (resp.summary && resp.summary.toLowerCase().includes(title.toLowerCase())) {
          return true;
        }

        // Check if response content mentions title or any keyword
        const contentLower = resp.content.toLowerCase();
        if (contentLower.includes(title.toLowerCase())) {
          return true;
        }

        if (Array.isArray(keywords)) {
          return keywords.some((kw: string) => contentLower.includes(kw.toLowerCase()));
        }

        return false;
      });

      if (matchedResponse) {
        // Expand response if it is collapsed
        if (!matchedResponse.expanded) {
          toggleExpand(matchedResponse.id, false);
        }

        // Highlight
        setHighlightedResponseId(matchedResponse.id);
        
        // Scroll to card
        setTimeout(() => {
          const element = document.getElementById(`response-card-${matchedResponse.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Clear highlight after 3 seconds
        setTimeout(() => {
          setHighlightedResponseId(null);
        }, 3000);
      }
    };

    window.addEventListener('topic-selected', handleTopicSelected);
    return () => {
      window.removeEventListener('topic-selected', handleTopicSelected);
    };
  }, [responses])

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
          chatTabId: activeTabId,
        }),
      })
      const userData = await userRes.json()
      if (userRes.ok && userData.response) {
        setResponses((prev) => [...prev, userData.response])
      }
    } catch (err) {
      console.error('Error during send transaction:', err)
    } finally {
      setIsResearching(false)
    }
  }

  const handleClarificationSubmit = async (choices: Record<string, string>) => {
    setIsResearching(true)
    try {
      const agentRes = await fetch(`/api/research/${researchId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          content: 'Choices submitted for research parameters.',
          choices: choices,
          chatTabId: activeTabId,
        }),
      })
      const agentData = await agentRes.json()
      if (agentRes.ok && agentData.response) {
        setResponses((prev) => [...prev, agentData.response])
      }
    } catch (err) {
      console.error('Failed to submit choices:', err)
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

  const handleClearChat = async () => {
    if (!researchId) return
    if (!confirm('Are you sure you want to clear the conversation history? This cannot be undone.')) return
    try {
      const url = `/api/research/${researchId}/responses${activeTabId !== 'main' ? `?chatTabId=${activeTabId}` : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
      })
      if (res.ok) {
        setResponses([])
        window.dispatchEvent(new CustomEvent('research-cleared', { detail: { researchId } }))
      }
    } catch (err) {
      console.error('Failed to clear chat:', err)
    }
  }

  const handleSaveTab = async (tabData: { name: string; memoryMode: string; selectedNodeIds: string[] }) => {
    try {
      if (tabToEdit) {
        const res = await fetch(`/api/research/${researchId}/tabs/${tabToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tabData),
        });
        const data = await res.json();
        if (res.ok && data.tab) {
          setChatTabs((prev) => prev.map((t) => (t.id === tabToEdit.id ? data.tab : t)));
        }
      } else {
        const res = await fetch(`/api/research/${researchId}/tabs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tabData),
        });
        const data = await res.json();
        if (res.ok && data.tab) {
          setChatTabs((prev) => [...prev, data.tab]);
          setActiveTabId(data.tab.id);
        }
      }
    } catch (err) {
      console.error('Error saving chat tab:', err);
    }
    setTabToEdit(null);
  };

  const handleDeleteTab = async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat tab and all its messages?')) return;

    try {
      const res = await fetch(`/api/research/${researchId}/tabs/${tabId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setChatTabs((prev) => prev.filter((t) => t.id !== tabId));
        if (activeTabId === tabId) {
          setActiveTabId('main');
        }
      }
    } catch (err) {
      console.error('Error deleting chat tab:', err);
    }
  };

  if (loading && responses.length === 0) {
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
              onClick={handleClearChat}
              className="border-zinc-700 text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
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

        {/* Chat Tab Bar */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTabId('main')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
              activeTabId === 'main'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Main Chat
          </button>

          {chatTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none border cursor-pointer ${
                activeTabId === tab.id
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <span>{tab.name}</span>
              
              {/* Settings / Edit */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTabToEdit(tab);
                  setIsTabModalOpen(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700/60 rounded text-zinc-400 hover:text-white transition-opacity"
              >
                <Settings className="w-3 h-3" />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => handleDeleteTab(tab.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700/60 rounded text-zinc-400 hover:text-red-400 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Create New Tab Button */}
          <button
            onClick={() => {
              setTabToEdit(null);
              setIsTabModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/40 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Create Custom Chat Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Memory & Status Bar */}
        <div className="flex items-center gap-4 text-sm mt-4">
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
              <div 
                id={`response-card-${response.id}`}
                className={`bg-zinc-800 rounded-2xl p-6 border transition-all duration-500 ${
                  response.id === highlightedResponseId 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/[0.03] shadow-lg shadow-emerald-500/10' 
                    : 'border-zinc-700/50'
                }`}
              >
                {/* Response Content */}
                <div className="mb-4">
                  {(() => {
                    let clarificationData = null;
                    const trimmed = response.content.trim();
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                      try {
                        const parsed = JSON.parse(trimmed);
                        if (parsed.isClarification) {
                          clarificationData = parsed;
                        }
                      } catch (e) {}
                    }

                    if (clarificationData) {
                      return (
                        <ClarificationForm
                          questions={clarificationData.questions}
                          onSubmit={handleClarificationSubmit}
                        />
                      );
                    }

                    return response.expanded ? (
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
                    );
                  })()}
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
        <div ref={messagesEndRef} />
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
      {/* Chat Tab Configuration Modal */}
      <ChatTabModal
        isOpen={isTabModalOpen}
        onClose={() => {
          setIsTabModalOpen(false);
          setTabToEdit(null);
        }}
        researchId={researchId}
        tabToEdit={tabToEdit}
        onSave={handleSaveTab}
      />
    </div>
  )
}

interface ClarificationFormProps {
  questions: Array<{ id: string; question: string; choices: string[] }>;
  onSubmit: (choices: Record<string, string>) => void;
}

function ClarificationForm({ questions, onSubmit }: ClarificationFormProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const handleSelect = (questionId: string, choice: string) => {
    setSelections((prev) => ({
      ...prev,
      [questionId]: choice,
    }));
  };

  const isComplete = questions.every((q) => selections[q.id] !== undefined);

  return (
    <div className="p-5 bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-800 space-y-4 my-3">
      <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm pb-3 border-b border-zinc-800/80">
        <Brain className="w-5 h-5 animate-pulse text-emerald-500" />
        <span>Select Research Parameters</span>
      </div>
      <div className="space-y-4 pt-1">
        {questions.map((q) => (
          <div key={q.id} className="space-y-2">
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{q.question}</p>
            <div className="flex flex-wrap gap-2">
              {q.choices.map((choice) => {
                const isSelected = selections[q.id] === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleSelect(q.id, choice)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-zinc-850 border-zinc-700/85 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Button
        onClick={() => onSubmit(selections)}
        disabled={!isComplete}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black disabled:text-zinc-500 font-semibold text-xs py-2.5 rounded-xl transition-all mt-3 cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
      >
        Submit Choices & Compile Research Report →
      </Button>
    </div>
  );
}


