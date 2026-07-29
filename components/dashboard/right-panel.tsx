'use client'

import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface RightPanelProps {
  activeTab: 'tree' | 'memory' | 'related' | 'sources'
  onTabChange: (tab: 'tree' | 'memory' | 'related' | 'sources') => void
  researchId: string
}

const treeData = {
  'gaming-laptop': {
    name: 'Gaming Laptop',
    children: [
      { name: 'RTX 4060', count: 3 },
      { name: 'Battery', count: 2 },
      { name: 'Display', count: 4 },
      { name: 'Performance', count: 5 },
    ],
  },
}

const memoryData = [
  'Preferred format: Detailed technical comparisons',
  'Previous related: GPU Research, AI Chips',
  'Important findings: RTX 4060 vs 4070 performance gap',
  'Budget constraint: Under $2000',
]

const relatedResearch = [
  { id: 1, title: 'GPU Research', icon: '📊', studies: 12 },
  { id: 2, title: 'AI Chips', icon: '🤖', studies: 8 },
  { id: 3, title: 'Display Technologies', icon: '🖥️', studies: 6 },
  { id: 4, title: 'Battery Optimization', icon: '🔋', studies: 4 },
]

const sources = [
  {
    id: 1,
    domain: 'nvidia.com',
    title: 'NVIDIA RTX 4060 Specifications',
    trust: 98,
  },
  {
    id: 2,
    domain: 'techpowerup.com',
    title: 'GPU Database - Graphics Card Comparison',
    trust: 95,
  },
  {
    id: 3,
    domain: 'tomshardware.com',
    title: 'Best Gaming Laptops 2024',
    trust: 92,
  },
  {
    id: 4,
    domain: 'notebookcheck.net',
    title: 'Gaming Laptop Reviews',
    trust: 90,
  },
  {
    id: 5,
    domain: 'gsmarena.com',
    title: 'Laptop Specifications Database',
    trust: 88,
  },
]

export default function RightPanel({ activeTab, onTabChange, researchId }: RightPanelProps) {
  const tree = treeData[researchId as keyof typeof treeData] || treeData['gaming-laptop']

  return (
    <div className="w-80 border-l border-zinc-800/50 bg-zinc-900 flex flex-col h-screen">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800/50">
        <button
          onClick={() => onTabChange('tree')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tree'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tree
        </button>
        <button
          onClick={() => onTabChange('memory')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'memory'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Memory
        </button>
        <button
          onClick={() => onTabChange('related')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'related'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Related
        </button>
        <button
          onClick={() => onTabChange('sources')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sources'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Sources
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'tree' && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-4">{tree.name}</h3>
              <div className="space-y-2">
                {tree.children.map((child, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300 group-hover:text-white">├ {child.name}</span>
                      <span className="text-xs text-zinc-500">{child.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="p-6 space-y-3">
            {memoryData.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-zinc-800 rounded-lg border border-zinc-700/50 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'related' && (
          <div className="p-6 space-y-3">
            {relatedResearch.map((research) => (
              <button
                key={research.id}
                className="w-full text-left p-4 bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-700 hover:bg-zinc-700/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{research.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white group-hover:text-white">{research.title}</p>
                    <p className="text-xs text-zinc-400 mt-1">{research.studies} studies</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="p-6 space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-4 bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-700 hover:bg-zinc-700/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{source.domain}</p>
                    <p className="text-sm text-zinc-300 mt-1 leading-snug">{source.title}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-500 hover:text-zinc-300 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">Trust:</span>
                  <div className="h-1.5 w-16 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${source.trust}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-zinc-400">{source.trust}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
