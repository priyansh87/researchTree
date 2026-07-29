'use client'

import { useState } from 'react'
import Sidebar from './dashboard/sidebar'
import MainPanel from './dashboard/main-panel'
import RightPanel from './dashboard/right-panel'
import NewResearchModal from './new-research-modal'

interface DashboardProps {
  onLogoClick?: () => void
  workspaceId?: string
  selectedResearchId?: string
}

export default function Dashboard({ onLogoClick, workspaceId, selectedResearchId: initialResearchId }: DashboardProps) {
  const [selectedResearchId, setSelectedResearchId] = useState(initialResearchId || 'gaming-laptop')
  const [rightPanelTab, setRightPanelTab] = useState<'tree' | 'memory' | 'related' | 'sources'>('tree')
  const [isNewResearchModalOpen, setIsNewResearchModalOpen] = useState(false)

  const handleCreateResearch = (research: {
    title: string
    description: string
    category: string
  }) => {
    console.log('[v0] New research created:', research)
    // In a real app, this would save to the database and update the research list
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
      />

      {/* Main Panel */}
      <MainPanel researchId={selectedResearchId} />

      {/* Right Panel */}
      <RightPanel activeTab={rightPanelTab} onTabChange={setRightPanelTab} researchId={selectedResearchId} />

      {/* New Research Modal */}
      <NewResearchModal
        isOpen={isNewResearchModalOpen}
        onClose={() => setIsNewResearchModalOpen(false)}
        onCreateResearch={handleCreateResearch}
        workspaceId="current"
      />
    </div>
  )
}
