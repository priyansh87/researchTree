'use client'

import { useRouter } from 'next/navigation'
import Dashboard from '@/components/dashboard'

interface DashboardPageClientProps {
  workspaceId: string
}

export default function DashboardPageClient({ workspaceId }: DashboardPageClientProps) {
  const router = useRouter()

  const handleLogoClick = () => {
    router.push('/')
  }

  return <Dashboard onLogoClick={handleLogoClick} workspaceId={workspaceId} />
}
