'use client'

import { useRouter } from 'next/navigation'
import Dashboard from '@/components/dashboard'

interface ResearchPageClientProps {
  workspaceId: string
  researchId: string
}

export default function ResearchPageClient({ workspaceId, researchId }: ResearchPageClientProps) {
  const router = useRouter()

  const handleLogoClick = () => {
    router.push('/')
  }

  return (
    <Dashboard
      onLogoClick={handleLogoClick}
      workspaceId={workspaceId}
      selectedResearchId={researchId}
    />
  )
}
