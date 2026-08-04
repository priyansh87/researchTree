'use client'

import { Button } from '@/components/ui/button'
import { Mail, Search, BarChart3, Code, FileText, Folder, Lock, PlayCircle, Check, Zap } from 'lucide-react'

interface LandingPageProps {
  onLogin: () => void
  onLogoClick?: () => void
}

export default function LandingPage({ onLogin, onLogoClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Decorative corner elements */}
      <div className="absolute top-32 left-8 w-32 h-32 border border-emerald-500/20 rounded-lg opacity-40"></div>
      <div className="absolute bottom-40 right-12 w-40 h-40 border border-emerald-500/20 rounded-lg opacity-40"></div>

      {/* Decorative dotted lines */}
      <div className="absolute left-20 top-32 bottom-40 w-px border-l border-dashed border-emerald-500/30"></div>
      <div className="absolute right-20 top-32 bottom-40 w-px border-l border-dashed border-emerald-500/30"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <span className="text-black text-xs font-bold">RT</span>
            </div>
            <span className="text-white font-semibold tracking-tight">ResearchTree</span>
          </button>

          <Button
            onClick={onLogin}
            className="px-6 py-2 border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 rounded-full text-sm font-medium transition-all"
          >
            Sign In →
          </Button>
        </div>
      </nav>

      {/* Side icons */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 space-y-12 z-10">
        <div className="w-10 h-10 border border-emerald-500/30 rounded-lg flex items-center justify-center hover:border-emerald-500 transition-colors">
          <FileText className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="w-10 h-10 border border-emerald-500/30 rounded-lg flex items-center justify-center hover:border-emerald-500 transition-colors">
          <Folder className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      <div className="fixed right-8 top-1/2 -translate-y-1/2 space-y-12 z-10">
        <button className="w-10 h-10 border border-emerald-500/30 rounded-lg flex items-center justify-center hover:border-emerald-500 transition-colors">
          <Search className="w-5 h-5 text-emerald-500" />
        </button>
        <div className="w-10 h-10 border border-emerald-500/30 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      {/* Hero Section */}
      <main className="pt-24 pb-20 px-6 flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <span className="text-emerald-400 text-sm">← AI-Powered Research Workspace</span>
          </div>

          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Folder className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            <span className="text-white">Build Knowledge,</span>
            <br />
            <span className="text-emerald-400">Not Conversations</span>
          </h1>

          {/* Tagline */}
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            ResearchTree is a premium AI-first workspace where you organize research into persistent trees instead of long, forgotten conversations.
          </p>

          {/* Feature Tags */}
          <div className="flex flex-wrap gap-6 justify-center pt-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center bg-emerald-500/10">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-sm text-zinc-300">
                <span className="text-emerald-400 font-semibold">Secure & Private</span>
                <br />
                <span className="text-zinc-500 text-xs">Your data is encrypted</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center bg-emerald-500/10">
                <Folder className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-sm text-zinc-300">
                <span className="text-emerald-400 font-semibold">Organize Better</span>
                <br />
                <span className="text-zinc-500 text-xs">Research with trees</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center bg-emerald-500/10">
                <Zap className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-sm text-zinc-300">
                <span className="text-emerald-400 font-semibold">AI Supercharged</span>
                <br />
                <span className="text-zinc-500 text-xs">Smarter research, faster</span>
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              onClick={onLogin}
              className="px-8 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-full font-semibold text-base transition-all flex items-center gap-2 justify-center"
            >
              <Lock className="w-4 h-4" />
              Get Started Free
              <span>→</span>
            </Button>
            <Button
              onClick={onLogin}
              className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-white hover:border-emerald-500/50 hover:bg-zinc-800 rounded-full font-semibold text-base transition-all flex items-center gap-2 justify-center"
            >
              <PlayCircle className="w-4 h-4" />
              See How It Works
            </Button>
          </div>

          {/* Auth Section */}
          <div className="space-y-4 pt-8">
            <p className="text-sm text-zinc-500">Or sign up with</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onLogin}
                className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-white hover:border-emerald-500/50 hover:bg-zinc-800 rounded-lg flex items-center gap-2 justify-center transition-all text-sm font-medium"
              >
                <Code className="w-4 h-4" />
                Continue with GitHub
              </Button>
              <Button
                onClick={onLogin}
                className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-white hover:border-emerald-500/50 hover:bg-zinc-800 rounded-lg flex items-center gap-2 justify-center transition-all text-sm font-medium"
              >
                <Mail className="w-4 h-4" />
                Continue with Email
              </Button>
            </div>
          </div>

          {/* Social proof */}
          <div className="text-center text-sm text-zinc-500 pt-8 border-t border-zinc-800">
            <p>Join thousands of researchers, analyst & students<br />who trust ResearchTree for their most important work.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
