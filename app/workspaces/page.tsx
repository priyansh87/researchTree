'use client'

import { useRouter } from 'next/navigation'
import WorkspaceSelector from '@/components/workspace-selector'

export default function WorkspacesPage() {
  const router = useRouter()

  const handleSelectWorkspace = (workspaceId: string) => {
    router.push(`/dashboard/${workspaceId}`)
  }

  const handleCreateWorkspace = (workspaceName: string) => {
    // In a real app, this would save to the database
    // For now, use the workspace name as the ID
    const workspaceId = workspaceName.toLowerCase().replace(/\s+/g, '-')
    router.push(`/dashboard/${workspaceId}`)
  }

  return (
    <WorkspaceSelector
      onSelectWorkspace={handleSelectWorkspace}
      onCreateWorkspace={handleCreateWorkspace}
    />
  )
}
