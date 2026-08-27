'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { 
  ArrowRight, 
  Brain, 
  Check, 
  ChevronDown, 
  Clock, 
  FileText, 
  GitFork, 
  Lock, 
  MessageSquare, 
  Play, 
  Search, 
  Sparkles, 
  Zap,
  Globe,
  Database,
  BookOpen,
  ArrowUpRight
} from 'lucide-react'

interface LandingPageProps {
  onLogin: () => void
  onLogoClick?: () => void
}

export default function LandingPage({ onLogin, onLogoClick }: LandingPageProps) {
  const [selectedMockNode, setSelectedMockNode] = useState('Memory')

  return (
    <div className="min-h-screen bg-[#080A0A] text-zinc-300 relative overflow-hidden font-sans selection:bg-emerald-500/25 selection:text-emerald-400">
      
      {/* Premium subtle gradient background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-emerald-500/[0.03] blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[800px] right-10 w-[600px] h-[600px] bg-emerald-500/[0.015] blur-[130px] rounded-full pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-900/60 bg-[#080A0A]/85 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="w-5.5 h-5.5 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs">
              RT
            </div>
            <span className="text-white font-bold text-sm tracking-tight">ResearchTree</span>
          </button>

          {/* Minimal Nav links */}
          <div className="hidden md:flex items-center gap-7 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            <a href="#product" className="hover:text-white transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="text-xs font-bold uppercase tracking-wider text-zinc-450 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <Button
              onClick={onLogin}
              className="px-5 py-1.5 bg-emerald-500 text-black hover:bg-emerald-450 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              Get Started →
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto mb-16">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full select-none">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">AI Research Workspace</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] max-w-2xl mx-auto">
            Turn scattered research <br />
            into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">structured knowledge.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            ResearchTree turns your research into persistent, connected trees — so ideas, sources, and discoveries stay organized long after the conversation ends.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={onLogin}
              className="px-6 py-2.5 bg-emerald-500 text-black hover:bg-emerald-450 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              Start Researching →
            </Button>
            <a
              href="#how-it-works"
              className="px-6 py-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 justify-center cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              See How It Works
            </a>
          </div>
        </div>

        {/* Real Product UI Mockup */}
        <div id="product" className="relative w-full max-w-5xl mx-auto rounded-2xl border border-zinc-800/80 bg-[#0d0f0f] shadow-[0_0_80px_rgba(16,185,129,0.03)] overflow-hidden flex h-[520px] md:h-[580px] select-none">
          {/* Sidebar */}
          <div className="w-48 md:w-56 border-r border-zinc-900 bg-[#090b0b] p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-5.5 h-5.5 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs">
                  RT
                </div>
                <span className="text-white font-bold text-xs tracking-wider uppercase">ResearchTree</span>
              </div>
              
              <button onClick={onLogin} className="w-full py-2 px-3 rounded-xl bg-emerald-500 text-black font-bold text-[10px] hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider">
                <span>+</span> New Research
              </button>
              
              <div className="space-y-5">
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">My Trees</span>
                  <div className="space-y-0.5">
                    {['AI Agents', 'Distributed Systems', 'Market Research', 'Quantum Computing'].map((t, idx) => (
                      <div key={t} className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 cursor-default transition-colors ${idx === 0 ? 'bg-zinc-900 text-emerald-400' : 'text-zinc-400 hover:text-zinc-300'}`}>
                        <span className="text-[10px]">🌿</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Favorites</span>
                  <div className="space-y-1 pl-2 text-[10px] text-zinc-500 font-semibold space-y-2">
                    <div className="hover:text-zinc-450 cursor-pointer">★ Neural NAS</div>
                    <div className="hover:text-zinc-450 cursor-pointer">★ Vector RAG</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-[9px] text-zinc-650 font-bold uppercase tracking-wider">
              Workspace v2.0
            </div>
          </div>
          
          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col bg-[#0b0d0d] overflow-hidden">
            {/* Topbar */}
            <div className="px-6 py-3 border-b border-zinc-900/60 flex items-center justify-between bg-[#0d0f0f]">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <span>Workspaces</span>
                <span>/</span>
                <span className="text-white">AI Agents</span>
              </div>
              <div className="w-40 h-6 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center px-2 text-[9px] text-zinc-500 font-semibold">
                Search nodes...
              </div>
            </div>
            
            {/* Panel Grid */}
            <div className="flex-1 flex overflow-hidden">
              {/* Tree Diagram (Left/Center) */}
              <div className="flex-1 p-6 overflow-y-auto relative flex flex-col justify-center bg-[radial-gradient(#1f29370c_1px,transparent_1px)] bg-[size:16px_16px]">
                <div className="space-y-6 max-w-sm mx-auto relative">
                  
                  {/* Root Node */}
                  <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-bold w-44 text-center mx-auto shadow-md">
                    🧠 AI Agents
                  </div>
                  
                  {/* Visual tree connections via CSS lines */}
                  <div className="flex justify-between gap-6 pt-4 relative">
                    {/* Branch Left */}
                    <div className="flex flex-col items-center space-y-2 flex-1">
                      <div className="p-2 rounded-lg border border-zinc-800 bg-[#111313] text-white text-[10px] font-bold w-24 text-center">
                        🏗️ Architecture
                      </div>
                      <div className="space-y-1.5">
                        {['Planning', 'Memory', 'Tool Use'].map(n => (
                          <button
                            key={n}
                            onClick={() => setSelectedMockNode(n)}
                            className={`px-2 py-1 rounded-md border text-[9px] font-semibold text-center w-20 transition-all ${
                              selectedMockNode === n 
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold' 
                                : 'border-zinc-900 bg-zinc-950/80 text-zinc-500 hover:text-zinc-400 hover:border-zinc-850'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Branch Right */}
                    <div className="flex flex-col items-center space-y-2 flex-1">
                      <div className="p-2 rounded-lg border border-zinc-800 bg-[#111313] text-white text-[10px] font-bold w-24 text-center">
                        🤖 Models
                      </div>
                      <div className="space-y-1.5">
                        {['GPT', 'Claude', 'Open Models'].map(n => (
                          <button
                            key={n}
                            onClick={() => setSelectedMockNode(n)}
                            className={`px-2 py-1 rounded-md border text-[9px] font-semibold text-center w-20 transition-all ${
                              selectedMockNode === n 
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold' 
                                : 'border-zinc-900 bg-zinc-950/80 text-zinc-500 hover:text-zinc-400 hover:border-zinc-850'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Context Summary / Sources Panel */}
              <div className="w-56 md:w-64 border-l border-zinc-900 bg-[#090b0b] p-4 flex flex-col justify-between overflow-y-auto shrink-0">
                <div className="space-y-4">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[8px] uppercase tracking-wider select-none">
                      Active Branch
                    </span>
                    <h4 className="text-white font-bold text-xs mt-1.5 flex items-center gap-1.5">
                      <span>{selectedMockNode}</span>
                    </h4>
                  </div>
                  
                  <div className="text-[10px] text-zinc-455 leading-relaxed font-semibold">
                    {selectedMockNode === 'Memory' && "Processes persistent contexts and vector storage indices to preserve states globally across multiple sessions, bypassing conversational limits."}
                    {selectedMockNode === 'Planning' && "Deconstructs major tasks into logical trees and sequential schedules, allowing LLM agents to review details before answering prompts."}
                    {selectedMockNode === 'Tool Use' && "Examines API hooks, CLI environments, and search drivers. Incorporates tool output data to verify accuracy of responses."}
                    {!['Memory', 'Planning', 'Tool Use'].includes(selectedMockNode) && "Analyzes open model parameters and architecture designs. Connects performance statistics to corresponding benchmark summaries."}
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Linked Sources</span>
                    <div className="p-2 rounded-xl border border-zinc-850 bg-zinc-900/20 text-[9px] text-zinc-300 font-semibold space-y-1 shadow-sm">
                      <div className="text-emerald-400 font-bold flex items-center justify-between">
                        <span>Memory Patterns paper</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </div>
                      <div className="text-zinc-500 truncate">arxiv.org/abs/2402.1293</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-zinc-900/60 flex items-center justify-between text-[9px] text-zinc-550 font-bold">
                  <span>Confidence:</span>
                  <span className="text-emerald-400">98.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Social Proof Credibility Section */}
      <section className="py-12 border-t border-zinc-900/40 bg-zinc-950/20 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-6 space-y-3">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Built for people who take research seriously
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs md:text-sm font-bold text-zinc-400/70 select-none">
            <span>Researchers</span>
            <span className="text-zinc-800">•</span>
            <span>Engineers</span>
            <span className="text-zinc-800">•</span>
            <span>Analysts</span>
            <span className="text-zinc-800">•</span>
            <span>Students</span>
            <span className="text-zinc-800">•</span>
            <span>Founders</span>
          </div>
        </div>
      </section>

      {/* "From Chat to Knowledge" Section */}
      <section id="how-it-works" className="py-20 border-t border-zinc-900/50 bg-[#080A0A] relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Stop starting your research from zero.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold">
              Conversational chatbots are great for quick answers but terrible for compiling serious knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Traditional Chat Panel */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between opacity-70 hover:opacity-85 transition-opacity">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Traditional AI Chat</span>
                
                {/* Chat bubbles representation */}
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-900/60 max-w-[85%] text-xs text-zinc-400 font-semibold self-start">
                    "Find me key research papers on quantum computing memory coherence."
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 max-w-[85%] text-xs text-zinc-400 font-semibold ml-auto">
                    "Here are 4 papers: Coherence Times (2024), Vector gates..."
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-900/60 max-w-[85%] text-xs text-zinc-400 font-semibold self-start">
                    "Explain the difference between paper 1 and paper 3."
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 max-w-[85%] text-xs text-zinc-400 font-semibold ml-auto">
                    "Paper 1 uses spin qubits, paper 3 focuses on superconducting..."
                  </div>
                  <div className="p-2.5 rounded-xl border border-red-500/10 bg-red-500/[0.02] text-[10px] font-bold text-red-400/80 text-center select-none">
                    ⚠️ Conversation becomes too long. Context lost.
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-900 text-[10px] text-zinc-500 font-semibold flex items-center justify-between">
                <span>Result:</span>
                <span className="text-red-400/80">Start over in a clean chat window</span>
              </div>
            </div>

            {/* ResearchTree Panel */}
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.01] p-6 flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.01)]">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">ResearchTree</span>
                
                {/* Visual Branch List representing clean nodes */}
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs font-bold text-white flex items-center justify-between">
                    <span>🔬 Quantum Memory Coherence</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Main Topic</span>
                  </div>
                  
                  <div className="pl-4 border-l-2 border-zinc-800 space-y-2 py-1">
                    <div className="p-2 rounded-lg border border-zinc-800 bg-[#0d0f0f] text-[10px] font-semibold text-zinc-300 flex items-center justify-between">
                      <span>⚡ Spin Qubit systems</span>
                      <span className="text-zinc-500 text-[9px] font-bold">2 Papers linked</span>
                    </div>
                    <div className="p-2 rounded-lg border border-zinc-800 bg-[#0d0f0f] text-[10px] font-semibold text-zinc-300 flex items-center justify-between">
                      <span>❄️ Superconducting architectures</span>
                      <span className="text-zinc-500 text-[9px] font-bold">4 Papers linked</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-[10px] font-bold text-emerald-400 text-center select-none">
                    🌿 Knowledge persists permanently. Explore or edit anytime.
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-900 text-[10px] text-zinc-550 font-bold flex items-center justify-between">
                <span>Result:</span>
                <span className="text-emerald-400">Structured, connected workspace</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-zinc-900/50 bg-[#080A0A] relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Platform capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              A workspace built for serious minds.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-semibold leading-relaxed">
              No filler features. Just robust tools designed to compile facts and synthesize concepts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4 hover:border-zinc-800 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm">Persistent Research</h3>
                <p className="text-xs text-zinc-450 leading-relaxed font-semibold">
                  Your research stays organized and accessible instead of disappearing into old conversations. Search past insights instantly.
                </p>
              </div>
              <div className="mt-4 p-4 rounded-xl border border-zinc-900 bg-[#0c0d0d] flex gap-2 items-center text-[10px] font-semibold text-zinc-400">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Last opened 3 hours ago: "Distributed Consensus comparison"</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4 hover:border-zinc-800 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm">Research Trees</h3>
                <p className="text-xs text-zinc-450 leading-relaxed font-semibold">
                  Break complex topics into connected branches and explore ideas naturally. Grow, prune, and link nodes intuitively.
                </p>
              </div>
              <div className="mt-4 p-3 rounded-xl border border-zinc-900 bg-[#0c0d0d] flex justify-between items-center text-[10px] font-bold text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-emerald-400 rotate-90" />
                  <span>Main Topic</span>
                </div>
                <span>→</span>
                <span className="text-emerald-400 font-semibold">Sub-branch A</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4 hover:border-zinc-800 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm">AI-Powered Exploration</h3>
                <p className="text-xs text-zinc-450 leading-relaxed font-semibold">
                  Use AI to summarize, expand, connect, and investigate research topics. Generate custom questionnaires dynamically.
                </p>
              </div>
              <div className="mt-4 p-3 rounded-xl border border-zinc-900 bg-[#0c0d0d] space-y-1.5">
                <div className="flex items-center justify-between text-[9px] text-zinc-500 font-bold">
                  <span>AI EXPLORER NODE</span>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                  "Analyzing 14 connected nodes... Generated 3 comparison branches."
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4 hover:border-zinc-800 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm">Sources That Stay Connected</h3>
                <p className="text-xs text-zinc-450 leading-relaxed font-semibold">
                  Keep references attached to the ideas they support. Highlight text to extract citations and verify facts in real time.
                </p>
              </div>
              <div className="mt-4 p-3 rounded-xl border border-zinc-900 bg-[#0c0d0d] flex items-center justify-between text-[10px] font-semibold">
                <div className="flex items-center gap-2 text-zinc-400">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF Document Citation</span>
                </div>
                <span className="text-emerald-400 font-bold">Verifiable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Workflow Section */}
      <section className="py-20 border-t border-zinc-900/50 bg-[#080A0A] relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">The workflow</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Four steps to structured clarity.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Start a topic', desc: 'Type in any subject area to instantiate a clean workspace.' },
              { num: '02', title: 'Explore with AI', desc: 'ResearchTree generates useful starting branches and connections.' },
              { num: '03', title: 'Build your tree', desc: 'Expand specific sub-areas, edit text, and attach sources.' },
              { num: '04', title: 'Keep the knowledge', desc: 'Return at any time to pick up exactly where you left off.' }
            ].map((step) => (
              <div key={step.num} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/15 space-y-3 relative">
                <div className="text-emerald-400 font-extrabold text-lg tracking-wider">
                  {step.num}
                </div>
                <h4 className="text-white font-bold text-xs">{step.title}</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Showcase Display */}
      <section className="py-20 border-t border-zinc-900/50 bg-[#080A0A] relative z-10 text-center">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Your research, finally in one place.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold">
              Explore your sources, build branches, and write synthesis reports side-by-side on a unified workspace canvas.
            </p>
          </div>

          {/* Full-width detailed layout preview mockup */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0b0d0d] shadow-2xl overflow-hidden p-3.5 select-none">
            <div className="rounded-xl border border-zinc-900 bg-[#090b0b] flex flex-col h-[340px] md:h-[400px]">
              {/* Header row mock */}
              <div className="px-4 py-2 border-b border-zinc-900 bg-[#0d0f0f] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-850"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-850"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-850"></div>
                </div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">ResearchTree Canvas Simulator</span>
                <div className="w-16 h-2 rounded bg-zinc-850"></div>
              </div>
              
              {/* Layout split view */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left panel */}
                <div className="w-1/3 border-r border-zinc-900 bg-[#0b0d0d] p-4 text-left space-y-4">
                  <span className="text-[8px] font-bold text-zinc-650 uppercase tracking-widest block">Tree Nodes</span>
                  <div className="space-y-1.5 text-[9px] font-bold text-zinc-450">
                    <div className="p-1.5 rounded bg-zinc-900/60 text-white border border-zinc-850">🌿 AI Agent Architecture</div>
                    <div className="pl-3 py-1 border-l border-zinc-850">└ Planning & Logic</div>
                    <div className="pl-3 py-1 border-l border-zinc-850 text-emerald-400">└ Memory Systems (Active)</div>
                    <div className="pl-3 py-1 border-l border-zinc-850">└ Tool Integrations</div>
                  </div>
                </div>
                {/* Center synthesis */}
                <div className="flex-1 p-4 text-left overflow-y-auto space-y-3">
                  <span className="text-[8px] font-bold text-zinc-650 uppercase tracking-widest block">AI Synthesis Report</span>
                  <h3 className="text-white font-bold text-xs">Summary on Memory Retention</h3>
                  <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">
                    Current studies prove memory-retention structures allow autonomous agents to operate without chat history degradation. By vectorizing the context logs and storing embeddings inside a RAG index, the agents dynamically recall critical facts on demand, matching human cognitive patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="py-24 border-t border-zinc-900/50 bg-[#080A0A] relative z-10 text-center">
        <div className="max-w-xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Your next research rabbit hole starts here.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-450 leading-relaxed font-semibold">
            Organize the questions. Connect the ideas. Keep the knowledge.
          </p>
          <div className="pt-2">
            <Button
              onClick={onLogin}
              className="px-8 py-3 bg-emerald-500 text-black hover:bg-emerald-450 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              Start Researching →
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="pricing" className="border-t border-zinc-900/60 bg-[#080A0A] py-16 px-6 relative z-10 text-xs text-zinc-550 font-semibold">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5.5 h-5.5 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs">
                RT
              </div>
              <span className="text-white font-bold text-xs tracking-wider uppercase">ResearchTree</span>
            </div>
            <p className="text-[10px] text-zinc-600 max-w-[200px] leading-relaxed">
              The AI-first workspace designed to turn scattered research logs into persistent, connected knowledge hierarchies.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block">Product</span>
            <div className="flex flex-col gap-2">
              <a href="#product" className="hover:text-zinc-350 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-zinc-350 transition-colors">How It Works</a>
              <span className="text-zinc-700 select-none">Pricing</span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block">Resources</span>
            <div className="flex flex-col gap-2">
              <span className="text-zinc-700 select-none">Documentation</span>
              <span className="text-zinc-700 select-none">API reference</span>
              <span className="text-zinc-700 select-none">Blog updates</span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block">Company</span>
            <div className="flex flex-col gap-2">
              <span className="text-zinc-700 select-none">About workspace</span>
              <span className="text-zinc-700 select-none">Contact Support</span>
              <span className="text-zinc-750 select-none">Privacy & Terms</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-650">
          <span>© 2026 ResearchTree Inc. All rights reserved.</span>
          <span>Designed with Linear and Perplexity aesthetic details.</span>
        </div>
      </footer>
    </div>
  )
}
