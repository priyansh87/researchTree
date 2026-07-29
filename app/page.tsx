'use client'

import { useRouter } from 'next/navigation'
import LandingPage from '@/components/landing-page'

export default function Home() {
  const router = useRouter()

  const handleLogin = () => {
    router.push('/workspaces')
  }

  const handleLogoClick = () => {
    router.push('/')
  }

  return <LandingPage onLogin={handleLogin} onLogoClick={handleLogoClick} />
}
