'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './dashboard/sidebar'
import LeftSourcesPanel from './dashboard/left-sources-panel'
import MainPanel from './dashboard/main-panel'

import WorkspaceGraph from './dashboard/workspace-graph'
import NewResearchModal from './new-research-modal'
import { authClient } from '@/lib/auth/client'
import { Loader2, Trash2, Share2, Settings, Plus, Network, FolderClosed } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardProps {
  onLogoClick?: () => void
  workspaceId?: string
  selectedResearchId?: string
}

export default function Dashboard({ onLogoClick, workspaceId, selectedResearchId: initialResearchId }: DashboardProps) {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const [selectedResearchId, setSelectedResearchId] = useState(initialResearchId || '')
  const [currentView, setCurrentView] = useState<'chat' | 'graph'>('chat')
  const [isNewResearchModalOpen, setIsNewResearchModalOpen] = useState(false)
  const [leftColumnMode, setLeftColumnMode] = useState<'files' | 'sources'>('sources')

  const [folders, setFolders] = useState<any[]>([])
  const [researchItems, setResearchItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadWorkspaceData = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      // Load folders
      const fResponse = await fetch(`/api/workspaces/${workspaceId}/folders`)
      const fData = await fResponse.json()
      
      // Load research items
      const rResponse = await fetch(`/api/workspaces/${workspaceId}/research`)
      const rData = await rResponse.json()

      if (fResponse.ok && rResponse.ok) {
        setFolders(fData.folders || [])
        setResearchItems(rData.research || [])
        
        // Select first research item if none is selected
        const items = rData.research || []
        if (items.length > 0 && !selectedResearchId) {
          setSelectedResearchId(items[0].id)
          setLeftColumnMode('sources')
        }
      } else {
        setError(fData.error || rData.error || 'Failed to load workspace files')
      }
    } catch (err) {
      setError('Connection error while fetching workspace details')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, selectedResearchId])

  useEffect(() => {
    loadWorkspaceData()
  }, [workspaceId])

  // Automatically show sources when research item is set or changes
  useEffect(() => {
    if (selectedResearchId) {
      setLeftColumnMode('sources')
    }
  }, [selectedResearchId])

  const handleCreateResearch = async (research: {
    title: string
    description: string
    category: string
  }) => {
    if (!workspaceId) return
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(research),
      })
      const data = await response.json()
      if (response.ok && data.research) {
        setResearchItems(prev => [...prev, data.research])
        setSelectedResearchId(data.research.id)
        setLeftColumnMode('sources')
        setCurrentView('chat')
        setIsNewResearchModalOpen(false)
      } else {
        alert(data.error || 'Failed to create research')
      }
    } catch (err) {
      alert('Error creating research item')
    }
  }

  const handleGraphNavigate = (researchId: string, topicTitle?: string, keywords?: string[]) => {
    setSelectedResearchId(researchId)
    setLeftColumnMode('sources')
    setCurrentView('chat')

    if (topicTitle) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('topic-selected', {
            detail: {
              title: topicTitle,
              keywords: keywords || [],
            },
          })
        )
      }, 350)
    }
  }

  const handleWorkspaceSwitcher = () => {
    router.push('/workspaces')
  }

  const handleLogoClick = () => {
    if (onLogoClick) onLogoClick()
    else router.push('/')
  }

  // Get user initials
  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'JD'

  const activeResearch = researchItems.find((item) => item.id === selectedResearchId)

  if (sessionLoading || (loading && workspaceId)) {
    return (
      <div className="h-screen w-screen bg-[#070708] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Loading workspace database...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#070708] flex flex-col text-zinc-100 font-sans overflow-hidden select-none">
      {/* Top Header Navigation */}
      <header className="h-16 px-6 border-b border-zinc-900 bg-[#09090b] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div
            onClick={handleLogoClick}
            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer shadow-lg shadow-blue-500/20 hover:scale-105 hover:bg-blue-500 transition-all"
            title="Go to Landing Page"
          >
            <span className="text-white text-md font-black">⚡</span>
          </div>

          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-[280px] sm:max-w-[400px]">
              {selectedResearchId && activeResearch ? activeResearch.title : 'Research Hub'}
            </h1>
            {selectedResearchId && activeResearch && (
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Category: {activeResearch.category || 'General'}
              </span>
            )}
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5">
          {selectedResearchId && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('clear-active-chat'))
                }}
                className="h-9 px-3 border-zinc-800 hover:border-red-950 text-zinc-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat
              </Button>
              <Button
                variant="outline"
                className="h-9 px-3 border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white hover:bg-zinc-800/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
              <Button
                variant="outline"
                className="h-9 px-3 border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white hover:bg-zinc-800/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Button>
            </>
          )}

          {/* Workspace Switcher & User profile avatar */}
          <div className="h-6 w-px bg-zinc-800/80 mx-1.5" />
          <button 
            onClick={handleWorkspaceSwitcher}
            className="flex items-center gap-2.5 hover:bg-zinc-900/60 px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-zinc-800/50"
            title="Switch Workspace"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
              {initials}
            </div>
            <span className="text-xs text-zinc-300 font-semibold hidden md:inline">
              Workspaces
            </span>
          </button>
        </div>
      </header>

      {/* Main Grid / Columns Container */}
      <div className="flex-1 p-4 pt-2 gap-4 flex bg-[#070708] overflow-hidden min-h-0">
        {/* Left Column: toggleable between 'files' (sidebar file tree) and 'sources' */}
        {selectedResearchId && leftColumnMode === 'sources' ? (
          <LeftSourcesPanel 
            researchId={selectedResearchId}
            onToggleFiles={() => setLeftColumnMode('files')}
          />
        ) : (
          <Sidebar
            selectedId={selectedResearchId}
            onSelectResearch={(id) => {
              setSelectedResearchId(id)
              setLeftColumnMode('sources')
            }}
            onNewResearchClick={() => setIsNewResearchModalOpen(true)}
            onLogoClick={handleLogoClick}
            workspaceId={workspaceId}
            folders={folders}
            researchItems={researchItems}
            user={session?.user}
            currentView={currentView}
            onSelectView={setCurrentView}
          />
        )}

        {/* Center Column: Main Chat Panel or Workspace Graph */}
        <div className="flex-1 flex flex-col bg-[#111113] border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 min-w-0 h-full">
          {currentView === 'graph' ? (
            <WorkspaceGraph 
              workspaceId={workspaceId || 'current'} 
              onNavigate={handleGraphNavigate} 
            />
          ) : selectedResearchId ? (
            <MainPanel researchId={selectedResearchId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-4">
                <h2 className="text-xl font-bold text-white">No Research Selected</h2>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Select a research file or folder on the left, or create a new research item, to begin chatting.
                </p>
                <Button
                  onClick={() => setIsNewResearchModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Create Research
                </Button>
              </div>
            </div>
          )}
        </div>


      </div>

      {/* New Research Modal */}
      <NewResearchModal
        isOpen={isNewResearchModalOpen}
        onClose={() => setIsNewResearchModalOpen(false)}
        onCreateResearch={handleCreateResearch}
        workspaceId={workspaceId || 'current'}
      />
    </div>
  )
}

