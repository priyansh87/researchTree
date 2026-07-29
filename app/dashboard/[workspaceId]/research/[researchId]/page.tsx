import ResearchPageClient from './client'

interface ResearchPageProps {
  params: Promise<{
    workspaceId: string
    researchId: string
  }>
}

export default async function ResearchPage({ params }: ResearchPageProps) {
  const { workspaceId, researchId } = await params

  return <ResearchPageClient workspaceId={workspaceId} researchId={researchId} />
}
