'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight, Loader2 } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  description?: string
  researchCount?: number
  color?: string
  icon?: string
}

interface WorkspaceSelectorProps {
  onSelectWorkspace: (workspaceId: string) => void
  onCreateWorkspace: (workspaceName: string) => void
}

const PALETTES = [
  'from-emerald-500 to-teal-500',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
]

const ICONS = ['🌳', '💻', '💼', '🚀', '🧠', '📚']

export default function WorkspaceSelector({
  onSelectWorkspace,
  onCreateWorkspace,
}: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewWorkspaceForm, setShowNewWorkspaceForm] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const response = await fetch('/api/workspaces')
        const data = await response.json()
        if (response.ok && data.workspaces) {
          setWorkspaces(
            data.workspaces.map((ws: any, idx: number) => ({
              ...ws,
              description: ws.description || 'Collaborative workspace',
              researchCount: ws.researchCount || 0,
              color: PALETTES[idx % PALETTES.length],
              icon: ICONS[idx % ICONS.length],
            }))
          )
        } else {
          setError(data.error || 'Failed to fetch workspaces')
        }
      } catch (err) {
        setError('Error connecting to backend')
      } finally {
        setLoading(false)
      }
    }
    loadWorkspaces()
  }, [])

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setIsCreating(true)
    setError(null)
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      })
      const data = await response.json()
      if (response.ok && data.workspace) {
        const createdWorkspace = {
          ...data.workspace,
          description: newWorkspaceDesc.trim() || 'Collaborative workspace',
          researchCount: 0,
          color: PALETTES[workspaces.length % PALETTES.length],
          icon: ICONS[workspaces.length % ICONS.length],
        }
        setWorkspaces([...workspaces, createdWorkspace])
        onCreateWorkspace(createdWorkspace.id)
        setNewWorkspaceName('')
        setNewWorkspaceDesc('')
        setShowNewWorkspaceForm(false)
      } else {
        setError(data.error || 'Failed to create workspace')
      }
    } catch (err) {
      setError('Connection error occurred while creating workspace')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Workspaces</h1>
            <p className="text-zinc-400 text-lg">
              Create and organize separate research workspaces for different topics or projects
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-zinc-400 text-sm">Loading workspaces...</p>
          </div>
        ) : (
          /* Workspaces Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => onSelectWorkspace(workspace.id)}
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 h-64"
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${workspace.color} opacity-10 group-hover:opacity-20 transition-opacity`}
                />

                {/* Content */}
                <div className="relative p-6 h-full flex flex-col justify-between">
                  {/* Icon & Title */}
                  <div className="text-left">
                    <div className="text-5xl mb-3">{workspace.icon}</div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {workspace.name}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{workspace.description}</p>
                  </div>

                  {/* Stats & Arrow */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-500">
                      <span className="font-semibold text-white">{workspace.researchCount}</span> research
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Hover Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}

            {/* New Workspace Card */}
            {!showNewWorkspaceForm ? (
              <button
                onClick={() => setShowNewWorkspaceForm(true)}
                className="group relative rounded-2xl border-2 border-dashed border-zinc-700 hover:border-emerald-500 transition-all duration-300 h-64 flex items-center justify-center hover:bg-zinc-900/50"
              >
                <div className="text-center">
                  <Plus className="w-12 h-12 text-zinc-600 group-hover:text-emerald-400 mx-auto mb-3 transition-colors" />
                  <h3 className="text-lg font-semibold text-zinc-400 group-hover:text-white transition-colors">
                    New Workspace
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2">Create a new research workspace</p>
                </div>
              </button>
            ) : (
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900/50 h-64 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Workspace name"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    autoFocus
                  />
                  <textarea
                    value={newWorkspaceDesc}
                    onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowNewWorkspaceForm(false)}
                    variant="outline"
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWorkspace}
                    disabled={!newWorkspaceName.trim() || isCreating}
                    className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 text-sm"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
