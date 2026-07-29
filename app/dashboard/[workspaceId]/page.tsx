import DashboardPageClient from './client'

interface DashboardPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspaceId } = await params

  return <DashboardPageClient workspaceId={workspaceId} />
}
