'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronDown, Plus, MoreHorizontal, Search, Settings, LogOut, FileText } from 'lucide-react'
import { authClient } from '@/lib/auth/client'

interface Folder {
  id: string
  name: string
  icon: string
}

interface ResearchItem {
  id: string
  title: string
  category: string
  folderId?: string | null
}

interface SidebarProps {
  selectedId: string
  onSelectResearch: (id: string) => void
  onNewResearchClick?: () => void
  onLogoClick?: () => void
  workspaceId?: string
  folders: Folder[]
  researchItems: ResearchItem[]
  user?: { name?: string | null; email?: string | null; image?: string | null } | null
}

export default function Sidebar({
  selectedId,
  onSelectResearch,
  onNewResearchClick,
  onLogoClick,
  workspaceId,
  folders,
  researchItems,
  user
}: SidebarProps) {
  const router = useRouter()
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['hardware'])
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/auth/sign-in')
  }

  const handleWorkspaceSwitcher = () => {
    router.push('/workspaces')
  }

  // Get user initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'JD'

  // Filter items by search query
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredItems = researchItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Root level items (no folder or folder matches nothing)
  const rootItems = filteredItems.filter((item) => !item.folderId)

  return (
    <div className="w-80 border-r border-zinc-800/50 bg-zinc-900 flex flex-col h-screen">
      {/* User Profile */}
      <div className="p-4 border-b border-zinc-800/50">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity w-full"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-zinc-400 truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </button>

        {/* Workspace Switcher */}
        <Button
          variant="outline"
          onClick={handleWorkspaceSwitcher}
          className="w-full justify-between border-zinc-700 text-zinc-100 hover:bg-zinc-800 rounded-lg text-sm cursor-pointer"
        >
          Switch Workspace
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
        {filteredFolders.map((folder) => {
          const folderItems = filteredItems.filter((i) => i.folderId === folder.id)
          return (
            <div key={folder.id}>
              <button
                onClick={() => toggleFolder(folder.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-100 font-medium text-sm"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expandedFolders.includes(folder.id) ? '' : '-rotate-90'}`}
                />
                <span>{folder.icon || '📁'}</span>
                <span className="flex-1 text-left truncate">{folder.name}</span>
              </button>

              {expandedFolders.includes(folder.id) && (
                <div className="ml-6 space-y-1">
                  {folderItems.map((item) => (
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
                        <FileText className="w-4 h-4 text-zinc-500" />
                        <span className="flex-1 text-left truncate">{item.title}</span>
                        {hoveredItem === item.id && (
                          <MoreHorizontal className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  ))}
                  {folderItems.length === 0 && (
                    <p className="text-xs text-zinc-500 py-1 pl-3 italic">Empty folder</p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Root level research items */}
        {rootItems.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/30">
            <p className="text-xs font-semibold text-zinc-500 px-3 mb-1 uppercase tracking-wider">Root Files</p>
            {rootItems.map((item) => (
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
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span className="flex-1 text-left truncate">{item.title}</span>
                  {hoveredItem === item.id && (
                    <MoreHorizontal className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-zinc-800/50 p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-300 hover:bg-zinc-800 rounded-lg text-sm cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-zinc-300 hover:bg-zinc-800 rounded-lg text-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
