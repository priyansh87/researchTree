'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Download, Zap, Brain, Send, Paperclip, ToggleRight, Loader2, Trash2, X, Plus, Settings, SlidersHorizontal, MoreVertical, ThumbsUp, ThumbsDown, ArrowUp, ChevronDown, Check } from 'lucide-react'
import MarkdownRenderer from '@/components/markdown-renderer'
import ChartRenderer from '@/components/chart-renderer'
import ChatTabModal from './chat-tab-modal'

interface MainPanelProps {
  researchId: string
}

export default function MainPanel({ researchId }: MainPanelProps) {
  const [input, setInput] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [responses, setResponses] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b')
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)

  const modelsByProvider = {
    "Groq": [
      "groq/compound",
      "groq/compound-mini"
    ],
    "Meta": [
      "meta-llama/llama-prompt-guard-2-2b",
      "meta-llama/llama-prompt-guard-2-8b"
    ],
    "OpenAI": [
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "openai/gpt-oss-safeguard-20b",
      "whisper-large-v3",
      "whisper-large-v3-turbo"
    ]
  };

  const formatModelName = (name: string) => {
    if (name.length > 25) {
      return name.substring(0, 22) + '...';
    }
    return name;
  };
  
  const [chatTabs, setChatTabs] = useState<any[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('main')
  const [isTabModalOpen, setIsTabModalOpen] = useState(false)
  const [tabToEdit, setTabToEdit] = useState<any | null>(null)
  
  const [highlightedResponseId, setHighlightedResponseId] = useState<string | null>(null)
  const [sourceCount, setSourceCount] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF documents are supported for upload and RAG indexing.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/research/${researchId}/sources/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Document "${file.name}" uploaded, parsed, and embedded successfully!`);
        // Notify both Left Pane and Composer to update sources reactively
        window.dispatchEvent(new CustomEvent('sources-updated'));
      } else {
        alert(data.error || 'Failed to upload and parse PDF.');
      }
    } catch (err) {
      console.error('Error uploading PDF:', err);
      alert('An error occurred while uploading and parsing the PDF.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  // 1. Fetch metadata, tabs and sources count on researchId change
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

        const sourcesRes = await fetch(`/api/research/${researchId}/sources`)
        const sourcesData = await sourcesRes.json()
        if (sourcesRes.ok) {
          setSourceCount((sourcesData.sources || []).length)
        }
      } catch (err) {
        console.error('Error fetching research details/tabs/sources:', err)
      }
    }

    loadResearchMetaAndTabs()
    setActiveTabId('main')

    const handleSourcesUpdated = async () => {
      try {
        const res = await fetch(`/api/research/${researchId}/sources`)
        const data = await res.json()
        if (res.ok) {
          setSourceCount((data.sources || []).length)
        }
      } catch (e) {}
    }
    window.addEventListener('sources-updated', handleSourcesUpdated)
    return () => {
      window.removeEventListener('sources-updated', handleSourcesUpdated)
    }
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

  // 3. Listen to global clear-active-chat event
  useEffect(() => {
    const handleGlobalClear = () => {
      handleClearChat()
    }
    window.addEventListener('clear-active-chat', handleGlobalClear)
    return () => {
      window.removeEventListener('clear-active-chat', handleGlobalClear)
    }
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
          model: selectedModel,
        }),
      })
      const userData = await userRes.json()
      if (userRes.ok) {
        const newResponses = [];
        if (userData.userResponse) newResponses.push(userData.userResponse);
        if (userData.response) newResponses.push(userData.response);
        setResponses((prev) => [...prev, ...newResponses]);
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
          model: selectedModel,
        }),
      })
      const agentData = await agentRes.json()
      if (agentRes.ok) {
        const newResponses = [];
        if (agentData.userResponse) newResponses.push(agentData.userResponse);
        if (agentData.response) newResponses.push(agentData.response);
        setResponses((prev) => [...prev, ...newResponses]);
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
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-zinc-500 text-xs mt-3">Syncing research history...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent h-full relative">
      {/* Sleek Chat Panel Header */}
      <div className="px-6 py-4 flex flex-col border-b border-zinc-900/50 bg-[#111113] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Chat</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Custom Model Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-850 bg-[#161618] hover:bg-zinc-800 text-[10px] font-bold text-zinc-350 hover:text-white transition-all cursor-pointer select-none"
              >
                <span>{formatModelName(selectedModel)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {isModelDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-[#0c0c0e]/95 backdrop-blur-md border border-zinc-800 rounded-2xl py-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {Object.entries(modelsByProvider).map(([provider, models]) => (
                      <div key={provider} className="mb-2">
                        <div className="px-4 py-1 text-[9px] font-bold text-zinc-650 uppercase tracking-widest border-b border-zinc-900/10 mb-1">
                          {provider}
                        </div>
                        <div className="flex flex-col">
                          {models.map((model) => (
                            <button
                              key={model}
                              onClick={() => {
                                setSelectedModel(model);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`px-4 py-1.5 text-[11px] text-left font-semibold flex items-center justify-between hover:bg-zinc-850/50 transition-colors cursor-pointer ${
                                selectedModel === model ? 'text-white bg-zinc-800/25' : 'text-zinc-450 hover:text-zinc-200'
                              }`}
                            >
                              <span>{formatModelName(model)}</span>
                              {selectedModel === model && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-zinc-500">
              <SlidersHorizontal className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <MoreVertical className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </div>

        {/* Chat Tab Bar */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTabId('main')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
              activeTabId === 'main'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Brain className="w-3 h-3" />
            Main Chat
          </button>

          {chatTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all select-none cursor-pointer ${
                activeTabId === tab.id
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
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
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-opacity"
              >
                <Settings className="w-2.5 h-2.5" />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => handleDeleteTab(tab.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* Create New Tab Button */}
          <button
            onClick={() => {
              setTabToEdit(null);
              setIsTabModalOpen(true);
            }}
            className="p-1 rounded-full border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            title="Create Custom Chat Tab"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">
        {responses.map((response: any) => (
          <div key={response.id} className="space-y-2.5">
            {response.type === 'assistant' ? (
              <div 
                id={`response-card-${response.id}`}
                className={`bg-zinc-900/35 hover:bg-zinc-900/55 border rounded-2xl p-5 transition-all duration-500 relative group flex flex-col gap-3.5 ${
                  response.id === highlightedResponseId 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-500/[0.02] shadow-lg shadow-emerald-500/5' 
                    : 'border-zinc-900 hover:border-zinc-800'
                }`}
              >
                {/* Content */}
                <div>
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
                          <h3 className="text-md font-bold text-white tracking-wide border-l-2 border-emerald-500 pl-3">
                            {response.summary}
                          </h3>
                        )}
                        <MarkdownRenderer content={response.content} />
                        {response.charts &&
                          response.charts.map((chart: any, idx: number) => (
                            <div key={idx} className="mt-4 p-4 bg-zinc-950/60 rounded-xl border border-zinc-900">
                              <ChartRenderer config={chart} />
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-zinc-200">{response.summary || 'Summary'}</h3>
                        <p className="text-xs text-zinc-500 italic">Toggle Expand below to view details and charts.</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Expand / Collapse Footer */}
                <div className="flex items-center justify-end pt-3 border-t border-zinc-900">
                  <button
                    onClick={() => toggleExpand(response.id, response.expanded)}
                    className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-800/40 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {response.expanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="ml-auto max-w-[85%] bg-zinc-800/60 border border-zinc-800 rounded-2xl p-4 shadow-sm hover:bg-zinc-800 transition-colors">
                <p className="text-zinc-200 text-sm leading-relaxed">{response.content}</p>
              </div>
            )}
          </div>
        ))}

        {isResearching && (
          <div className="bg-zinc-900/35 border border-zinc-900 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
              Research in progress...
            </div>
            <div className="space-y-2">
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3 animate-pulse"></div>
              </div>
              <div className="flex gap-2 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                <span>Planning</span>
                <span>•</span>
                <span>Searching Web</span>
                <span>•</span>
                <span>Compiling Facts</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Composer */}
      <div className="px-6 py-4 border-t border-zinc-900/50 bg-[#111113] shrink-0">
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/30 focus-within:border-zinc-700/80 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:bg-zinc-900/70 transition-all p-3.5 pb-14">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask a question or create something"
            className="w-full bg-transparent resize-none text-sm text-zinc-150 placeholder-zinc-500 focus:outline-none scrollbar-none h-12"
          />

          {/* Composer Action Toolbar */}
          <div className="absolute left-3.5 right-3.5 bottom-3.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 hover:bg-zinc-800/80 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-45"
                title={isUploading ? "Processing PDF..." : "Attach PDF source"}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              <button
                className="p-2 hover:bg-zinc-800/80 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Deep Research"
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                className="p-2 hover:bg-zinc-800/80 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Use Memory"
              >
                <Brain className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider select-none">
                {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
              </span>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded-full bg-white hover:bg-zinc-200 text-black disabled:bg-zinc-800 disabled:text-zinc-600 transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
              >
                <ArrowUp className="w-4 h-4 font-bold" />
              </button>
            </div>
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


