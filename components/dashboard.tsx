'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from './dashboard/sidebar'
import MainPanel from './dashboard/main-panel'
import RightPanel from './dashboard/right-panel'
import NewResearchModal from './new-research-modal'
import { authClient } from '@/lib/auth/client'
import { Loader2 } from 'lucide-react'

interface DashboardProps {
  onLogoClick?: () => void
  workspaceId?: string
  selectedResearchId?: string
}

export default function Dashboard({ onLogoClick, workspaceId, selectedResearchId: initialResearchId }: DashboardProps) {
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const [selectedResearchId, setSelectedResearchId] = useState(initialResearchId || '')
  const [rightPanelTab, setRightPanelTab] = useState<'tree' | 'memory' | 'related' | 'sources'>('tree')
  const [isNewResearchModalOpen, setIsNewResearchModalOpen] = useState(false)

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
        setIsNewResearchModalOpen(false)
      } else {
        alert(data.error || 'Failed to create research')
      }
    } catch (err) {
      alert('Error creating research item')
    }
  }

  if (sessionLoading || (loading && workspaceId)) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Loading workspace database...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-zinc-950 flex">
      {/* Left Sidebar */}
      <Sidebar
        selectedId={selectedResearchId}
        onSelectResearch={setSelectedResearchId}
        onNewResearchClick={() => setIsNewResearchModalOpen(true)}
        onLogoClick={onLogoClick}
        workspaceId={workspaceId}
        folders={folders}
        researchItems={researchItems}
        user={session?.user}
      />

      {/* Main Panel */}
      {selectedResearchId ? (
        <MainPanel researchId={selectedResearchId} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 border-r border-zinc-800/50 p-6 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-white">No Research Selected</h2>
            <p className="text-zinc-400 text-sm">
              Create your first research node using the "New Research" button in the sidebar to begin analyzing.
            </p>
          </div>
        </div>
      )}

      {/* Right Panel */}
      {selectedResearchId && (
        <RightPanel activeTab={rightPanelTab} onTabChange={setRightPanelTab} researchId={selectedResearchId} />
      )}

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
