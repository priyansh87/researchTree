'use client'

import { useRouter } from 'next/navigation'
import WorkspaceSelector from '@/components/workspace-selector'

export default function WorkspacesPage() {
  const router = useRouter()

  const handleSelectWorkspace = (workspaceId: string) => {
    router.push(`/dashboard/${workspaceId}`)
  }

  const handleCreateWorkspace = (workspaceId: string) => {
    router.push(`/dashboard/${workspaceId}`)
  }

  return (
    <WorkspaceSelector
      onSelectWorkspace={handleSelectWorkspace}
      onCreateWorkspace={handleCreateWorkspace}
    />
  )
}
