'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from '@/components/landing-page'
import { authClient } from '@/lib/auth/client'

export default function Home() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session) {
      router.push('/workspaces')
    }
  }, [session, isPending, router])

  const handleLogin = () => {
    router.push('/auth/sign-in')
  }

  const handleLogoClick = () => {
    router.push('/')
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <LandingPage onLogin={handleLogin} onLogoClick={handleLogoClick} />
}

