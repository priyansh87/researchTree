'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Plus, Trash2, Loader2 } from 'lucide-react'

interface RightPanelProps {
  activeTab: 'tree' | 'memory' | 'related' | 'sources'
  onTabChange: (tab: 'tree' | 'memory' | 'related' | 'sources') => void
  researchId: string
}

const treeData = {
  'gaming-laptop': {
    name: 'Gaming Laptop',
    children: [
      { name: 'RTX 4060', count: 3 },
      { name: 'Battery', count: 2 },
      { name: 'Display', count: 4 },
      { name: 'Performance', count: 5 },
    ],
  },
}

const memoryData = [
  'Preferred format: Detailed technical comparisons',
  'Previous related: GPU Research, AI Chips',
  'Important findings: RTX 4060 vs 4070 performance gap',
  'Budget constraint: Under $2000',
]

const relatedResearch = [
  { id: 1, title: 'GPU Research', icon: '📊', studies: 12 },
  { id: 2, title: 'AI Chips', icon: '🤖', studies: 8 },
  { id: 3, title: 'Display Technologies', icon: '🖥️', studies: 6 },
  { id: 4, title: 'Battery Optimization', icon: '🔋', studies: 4 },
]

const sources = [
  {
    id: 1,
    domain: 'nvidia.com',
    title: 'NVIDIA RTX 4060 Specifications',
    trust: 98,
  },
  {
    id: 2,
    domain: 'techpowerup.com',
    title: 'GPU Database - Graphics Card Comparison',
    trust: 95,
  },
  {
    id: 3,
    domain: 'tomshardware.com',
    title: 'Best Gaming Laptops 2024',
    trust: 92,
  },
  {
    id: 4,
    domain: 'notebookcheck.net',
    title: 'Gaming Laptop Reviews',
    trust: 90,
  },
  {
    id: 5,
    domain: 'gsmarena.com',
    title: 'Laptop Specifications Database',
    trust: 88,
  },
]

export default function RightPanel({ activeTab, onTabChange, researchId }: RightPanelProps) {
  const tree = treeData[researchId as keyof typeof treeData] || treeData['gaming-laptop']

  const [dbMemories, setDbMemories] = useState<any[]>([])
  const [dbSources, setDbSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Form states
  const [newMemory, setNewMemory] = useState('')
  const [showAddSource, setShowAddSource] = useState(false)
  const [newSourceDomain, setNewSourceDomain] = useState('')
  const [newSourceTitle, setNewSourceTitle] = useState('')
  const [newSourceTrust, setNewSourceTrust] = useState(90)
  const [newSourceUrl, setNewSourceUrl] = useState('')

  // Load data
  useEffect(() => {
    if (!researchId) return

    async function loadData() {
      setLoading(true)
      try {
        if (activeTab === 'memory') {
          const res = await fetch(`/api/research/${researchId}/memory`)
          const data = await res.json()
          if (res.ok) setDbMemories(data.memory || [])
        } else if (activeTab === 'sources') {
          const res = await fetch(`/api/research/${researchId}/sources`)
          const data = await res.json()
          if (res.ok) setDbSources(data.sources || [])
        }
      } catch (err) {
        console.error('Error fetching right panel data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [researchId, activeTab])

  // CRUD Actions
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemory.trim() || !researchId) return

    try {
      const res = await fetch(`/api/research/${researchId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMemory.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.memory) {
        setDbMemories((prev) => [...prev, data.memory])
        setNewMemory('')
      }
    } catch (err) {
      console.error('Error adding memory:', err)
    }
  }

  const handleDeleteMemory = async (id: string) => {
    if (!researchId) return
    try {
      const res = await fetch(`/api/research/${researchId}/memory?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDbMemories((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (err) {
      console.error('Error deleting memory:', err)
    }
  }

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSourceDomain.trim() || !newSourceTitle.trim() || !researchId) return

    try {
      const res = await fetch(`/api/research/${researchId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newSourceDomain.trim(),
          title: newSourceTitle.trim(),
          trust: Number(newSourceTrust),
          url: newSourceUrl.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.source) {
        setDbSources((prev) => [...prev, data.source])
        setNewSourceDomain('')
        setNewSourceTitle('')
        setNewSourceTrust(90)
        setNewSourceUrl('')
        setShowAddSource(false)
      }
    } catch (err) {
      console.error('Error adding source:', err)
    }
  }

  return (
    <div className="w-80 border-l border-zinc-800/50 bg-zinc-900 flex flex-col h-screen">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800/50">
        <button
          onClick={() => onTabChange('tree')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tree'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tree
        </button>
        <button
          onClick={() => onTabChange('memory')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'memory'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Memory
        </button>
        <button
          onClick={() => onTabChange('related')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'related'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Related
        </button>
        <button
          onClick={() => onTabChange('sources')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sources'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Sources
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        )}

        {!loading && activeTab === 'tree' && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-4">{tree.name}</h3>
              <div className="space-y-2">
                {tree.children.map((child, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300 group-hover:text-white">├ {child.name}</span>
                      <span className="text-xs text-zinc-500">{child.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'memory' && (
          <div className="p-6 space-y-4">
            {/* Add memory form */}
            <form onSubmit={handleAddMemory} className="flex gap-2">
              <input
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Add new memory..."
                className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Button type="submit" size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 h-auto">
                <Plus className="w-4 h-4" />
              </Button>
            </form>

            <div className="space-y-3">
              {dbMemories.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-zinc-800 rounded-lg border border-zinc-700/50 hover:border-zinc-700 transition-colors group flex items-start justify-between gap-2"
                >
                  <p className="text-sm text-zinc-300 leading-relaxed flex-1">{item.content}</p>
                  <button
                    onClick={() => handleDeleteMemory(item.id)}
                    className="text-zinc-500 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {dbMemories.length === 0 && (
                <p className="text-xs text-zinc-500 italic text-center py-4">No memories recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === 'related' && (
          <div className="p-6 space-y-3">
            {relatedResearch.map((research) => (
              <button
                key={research.id}
                className="w-full text-left p-4 bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-700 hover:bg-zinc-700/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{research.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white group-hover:text-white">{research.title}</p>
                    <p className="text-xs text-zinc-400 mt-1">{research.studies} studies</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && activeTab === 'sources' && (
          <div className="p-6 space-y-4">
            {/* Add Source button and form */}
            {!showAddSource ? (
              <Button
                onClick={() => setShowAddSource(true)}
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs flex items-center gap-1 py-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Research Source
              </Button>
            ) : (
              <form onSubmit={handleAddSource} className="bg-zinc-850 p-3 rounded-lg border border-zinc-700 space-y-3">
                <input
                  type="text"
                  required
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  placeholder="Source Title"
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                />
                <input
                  type="text"
                  required
                  value={newSourceDomain}
                  onChange={(e) => setNewSourceDomain(e.target.value)}
                  placeholder="Domain (e.g. nvidia.com)"
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newSourceTrust}
                  onChange={(e) => setNewSourceTrust(Number(e.target.value))}
                  placeholder="Trust rating (0-100)"
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                />
                <input
                  type="url"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="URL (optional)"
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                />
                <div className="flex gap-2 text-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddSource(false)}
                    className="flex-1 py-1 h-auto text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1 h-auto">
                    Save Source
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {dbSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-700 hover:bg-zinc-700/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{source.domain}</p>
                      <p className="text-sm text-zinc-300 mt-1 leading-snug">{source.title}</p>
                    </div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-500 hover:text-zinc-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-500">Trust:</span>
                    <div className="h-1.5 w-16 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${source.trust}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-zinc-400">{source.trust}%</span>
                  </div>
                </div>
              ))}
              {dbSources.length === 0 && (
                <p className="text-xs text-zinc-500 italic text-center py-4">No sources recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
