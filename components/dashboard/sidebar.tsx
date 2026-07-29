'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronDown, Plus, MoreHorizontal, Search, Settings, LogOut } from 'lucide-react'

interface SidebarProps {
  selectedId: string
  onSelectResearch: (id: string) => void
  onNewResearchClick?: () => void
  onLogoClick?: () => void
  workspaceId?: string
}

const researchFolders = [
  {
    id: 'ai',
    name: 'AI',
    icon: '🤖',
    items: [
      { id: 'gpt-5', name: 'GPT-5 Comparison', icon: '📄' },
      { id: 'claude-analysis', name: 'Claude Analysis', icon: '📄' },
      { id: 'gemini', name: 'Gemini', icon: '📄' },
    ],
  },
  {
    id: 'hardware',
    name: 'Hardware',
    icon: '⚙️',
    items: [
      { id: 'gaming-laptop', name: 'Gaming Laptop', icon: '💻' },
      { id: 'gpu-research', name: 'GPU Research', icon: '📄' },
      { id: 'battery', name: 'Battery Comparison', icon: '🔋' },
    ],
  },
  {
    id: 'career',
    name: 'Career',
    icon: '💼',
    items: [
      { id: 'resume', name: 'Resume', icon: '📄' },
      { id: 'interviews', name: 'Interviews', icon: '🎯' },
      { id: 'companies', name: 'Companies', icon: '🏢' },
    ],
  },
]

export default function Sidebar({ selectedId, onSelectResearch, onNewResearchClick, onLogoClick, workspaceId }: SidebarProps) {
  const router = useRouter()
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['hardware'])
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const handleSelectResearch = (id: string) => {
    onSelectResearch(id)
    if (workspaceId) {
      router.push(`/dashboard/${workspaceId}/research/${id}`)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId],
    )
  }

  return (
    <div className="w-80 border-r border-zinc-800/50 bg-zinc-900 flex flex-col h-screen">
      {/* User Profile */}
      <div className="p-4 border-b border-zinc-800/50">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity w-full"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">JD</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-white">John Doe</p>
            <p className="text-xs text-zinc-400">john@example.com</p>
          </div>
        </button>

        {/* Workspace Switcher */}
        <Button
          variant="outline"
          className="w-full justify-between border-zinc-700 text-zinc-100 hover:bg-zinc-800 rounded-lg text-sm"
        >
          Workspace
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search research..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* New Research Button */}
      <div className="p-4 border-b border-zinc-800/50">
        <Button
          onClick={onNewResearchClick}
          className="w-full bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4" />
          New Research
        </Button>
      </div>

      {/* Research Tree */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {researchFolders.map((folder) => (
          <div key={folder.id}>
            <button
              onClick={() => toggleFolder(folder.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-100 font-medium text-sm"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedFolders.includes(folder.id) ? '' : '-rotate-90'}`}
              />
              <span>{folder.icon}</span>
              <span>{folder.name}</span>
            </button>

            {expandedFolders.includes(folder.id) && (
              <div className="ml-6 space-y-1">
                {folder.items.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="group"
                  >
                    <button
                      onClick={() => handleSelectResearch(item.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                        selectedId === item.id
                          ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="flex-1 text-left truncate">{item.name}</span>
                      {hoveredItem === item.id && (
                        <MoreHorizontal className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-zinc-800/50 p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-300 hover:bg-zinc-800 rounded-lg text-sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-300 hover:bg-zinc-800 rounded-lg text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
