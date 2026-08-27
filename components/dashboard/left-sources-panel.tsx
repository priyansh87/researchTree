'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Search, FileText, Globe, Link, Check, Trash2, FolderClosed, ExternalLink, Loader2 } from 'lucide-react'

interface Source {
  id: string
  title: string
  domain: string
  trust: number
  url?: string | null
}

interface LeftSourcesPanelProps {
  researchId: string
  onToggleFiles: () => void
}

export default function LeftSourcesPanel({ researchId, onToggleFiles }: LeftSourcesPanelProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchEngine, setSearchEngine] = useState<'web' | 'fast'>('web')

  // Form states
  const [newTitle, setNewTitle] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newTrust, setNewTrust] = useState(90)

  useEffect(() => {
    if (!researchId) return
    fetchSources()
  }, [researchId])

  async function fetchSources() {
    setLoading(true)
    try {
      const res = await fetch(`/api/research/${researchId}/sources`)
      const data = await res.json()
      if (res.ok) {
        setSources(data.sources || [])
      }
    } catch (err) {
      console.error('Error fetching sources:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDomain.trim()) return

    try {
      const res = await fetch(`/api/research/${researchId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          domain: newDomain.trim(),
          url: newUrl.trim() || null,
          trust: Number(newTrust),
        }),
      })
      const data = await res.json()
      if (res.ok && data.source) {
        setSources((prev) => [...prev, data.source])
        setNewTitle('')
        setNewDomain('')
        setNewUrl('')
        setNewTrust(90)
        setShowAddForm(false)
      }
    } catch (err) {
      console.error('Error adding source:', err)
    }
  }

  const handleDeleteSource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this source?')) return
    try {
      const res = await fetch(`/api/research/${researchId}/sources?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id))
      }
    } catch (err) {
      console.error('Error deleting source:', err)
    }
  }

  // Filter sources
  const filteredSources = sources.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.domain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-85 bg-[#111113] border border-zinc-900 rounded-2xl flex flex-col overflow-hidden h-full shadow-2xl select-none shrink-0">
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between border-b border-zinc-900/50">
        <h2 className="text-md font-bold text-white flex items-center gap-2">
          <span>Sources</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
            {sources.length}
          </span>
        </h2>
        <button
          onClick={onToggleFiles}
          className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Switch to Files sidebar view"
        >
          <FolderClosed className="w-4 h-4" />
        </button>
      </div>

      {/* Sources Actions */}
      <div className="p-4 space-y-3 flex-shrink-0">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 bg-zinc-805 hover:bg-zinc-800 text-zinc-350 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add sources
          </button>
        ) : (
          <form onSubmit={handleAddSource} className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2.5">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Source Title"
              className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <input
              type="text"
              required
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="Domain (e.g. wikipedia.org)"
              className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (optional)"
              className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-1.5 h-auto text-zinc-400 text-xs border border-transparent hover:bg-zinc-800/50"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-1.5 h-auto text-xs font-bold rounded-lg cursor-pointer">
                Save
              </Button>
            </div>
          </form>
        )}

        {/* Search the Web box */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search the web for new sources"
              className="w-full pl-3 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 text-[11px] text-zinc-400 font-medium">
            <button 
              type="button"
              onClick={() => setSearchEngine('web')}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all cursor-pointer ${
                searchEngine === 'web' 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200 font-semibold' 
                  : 'bg-transparent border-transparent hover:text-zinc-350'
              }`}
            >
              <Globe className="w-3 h-3 text-zinc-400" />
              Web
            </button>
            <button 
              type="button"
              onClick={() => setSearchEngine('fast')}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all cursor-pointer ${
                searchEngine === 'fast' 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200 font-semibold' 
                  : 'bg-transparent border-transparent hover:text-zinc-350'
              }`}
            >
              ⚡ Fast research
            </button>
          </div>
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Loading sources...</p>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-zinc-500 italic">No sources added yet.</p>
          </div>
        ) : (
          filteredSources.map((source) => {
            const isPdf = source.title.toLowerCase().endsWith('.pdf') || source.domain.includes('pdf');
            return (
              <div
                key={source.id}
                className="group p-3 bg-zinc-905/35 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800/80 rounded-xl transition-all flex items-start gap-2.5 relative select-none cursor-pointer"
              >
                {/* Visual checkbox */}
                <div className="w-4 h-4 rounded border border-zinc-700 bg-zinc-950 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-emerald-500 transition-colors">
                  <Check className="w-3 h-3 text-emerald-400 font-bold" />
                </div>

                {/* Source type icon */}
                {isPdf ? (
                  <div className="w-7 h-7 rounded-lg bg-red-950/40 border border-red-900/40 flex items-center justify-center shrink-0 text-red-400 font-bold text-[9px]">
                    PDF
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-center shrink-0 text-emerald-400">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Source details */}
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-xs font-semibold text-zinc-200 leading-snug truncate group-hover:text-white">
                    {source.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                    {source.domain} • Trust {source.trust}%
                  </p>
                </div>

                {/* Action buttons */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={(e) => handleDeleteSource(source.id, e)}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded cursor-pointer"
                    title="Delete source"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
