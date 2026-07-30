import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Plus, Trash2, Loader2, Network, List, Maximize2, Minimize2 } from 'lucide-react'

interface RightPanelProps {
  activeTab: 'tree' | 'memory' | 'related' | 'sources'
  onTabChange: (tab: 'tree' | 'memory' | 'related' | 'sources') => void
  researchId: string
  workspaceId: string
}

interface GraphNode {
  id: string;
  label: string;
  type: 'workspace' | 'research' | 'fact';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

// Simple force directed layout solver
function runForceLayout(nodes: GraphNode[], links: GraphLink[], width = 280, height = 300) {
  nodes.forEach((node) => {
    node.x = width / 2 + (Math.random() - 0.5) * 60;
    node.y = height / 2 + (Math.random() - 0.5) * 60;
    node.vx = 0;
    node.vy = 0;
  });

  const ticks = 180;
  const k = 0.08;
  const rep = 800;
  const centerGravity = 0.05;

  for (let t = 0; t < ticks; t++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x! - nodes[i].x!;
        const dy = nodes[j].y! - nodes[i].y!;
        const distSq = dx * dx + dy * dy + 0.01;
        const dist = Math.sqrt(distSq);
        if (dist < 120) {
          const force = rep / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx! -= fx;
          nodes[i].vy! -= fy;
          nodes[j].vx! += fx;
          nodes[j].vy! += fy;
        }
      }
    }

    links.forEach((link) => {
      const sourceNode = nodes.find((n) => n.id === link.source);
      const targetNode = nodes.find((n) => n.id === link.target);
      if (sourceNode && targetNode) {
        const dx = targetNode.x! - sourceNode.x!;
        const dy = targetNode.y! - sourceNode.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = k * (dist - 40);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        sourceNode.vx! += fx;
        sourceNode.vy! += fy;
        targetNode.vx! -= fx;
        targetNode.vy! -= fy;
      }
    });

    nodes.forEach((node) => {
      const centerDx = width / 2 - node.x!;
      const centerDy = height / 2 - node.y!;
      node.vx! += centerDx * centerGravity;
      node.vy! += centerDy * centerGravity;

      node.vx! *= 0.75;
      node.vy! *= 0.75;

      node.x! += node.vx!;
      node.y! += node.vy!;
    });
  }

  nodes.forEach((node) => {
    node.x = Math.max(15, Math.min(width - 15, node.x!));
    node.y = Math.max(15, Math.min(height - 15, node.y!));
  });
}

function TopicGraph({ topics, researchTitle, width = 280 }: { topics: any[]; researchTitle: string; width?: number }) {
  const height = 300;

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const nodeList: GraphNode[] = [];
    const linkList: GraphLink[] = [];

    // Add central Research Card node as root
    nodeList.push({
      id: 'research-root',
      label: researchTitle || 'Research Hub',
      type: 'workspace', // Large green circle
      summary: 'Root node for this research project.',
      keywords: [],
      updatedAt: new Date().toISOString(),
      sourcesCount: 0,
      citationsCount: 0
    });

    // Add all topic nodes
    topics.forEach((t) => {
      nodeList.push({
        id: t.id,
        label: t.title,
        type: 'research', // Medium indigo circle
        summary: t.summary,
        keywords: t.keywords || [],
        updatedAt: t.updatedAt,
        sourcesCount: t.sourcesCount || 0,
        citationsCount: t.citationsCount || 0
      });

      if (t.parentId) {
        linkList.push({ source: t.parentId, target: t.id });
      } else {
        // Connect root topics to the central research root
        linkList.push({ source: 'research-root', target: t.id });
      }
    });

    runForceLayout(nodeList, linkList, width, height);

    setNodes(nodeList);
    setLinks(linkList);
  }, [topics, researchTitle, width]);

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>([selectedNodeId]);
    links.forEach((l) => {
      if (l.source === selectedNodeId) ids.add(l.target);
      if (l.target === selectedNodeId) ids.add(l.source);
    });
    return ids;
  }, [selectedNodeId, links]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId) return;
    const svg = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - svg.left;
    const y = e.clientY - svg.top;

    setNodes((prev) =>
      prev.map((n) =>
        n.id === draggedNodeId
          ? {
              ...n,
              x: Math.max(15, Math.min(width - 15, x)),
              y: Math.max(15, Math.min(height - 15, y)),
            }
          : n
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  const handleNodeClick = (node: GraphNode) => {
    if (draggedNodeId) return;
    setSelectedNodeId(selectedNodeId === node.id ? null : node.id);
    if (node.type === 'research') {
      window.dispatchEvent(
        new CustomEvent('topic-selected', {
          detail: {
            title: node.label,
            keywords: node.keywords || [],
          },
        })
      );
    }
  };

  return (
    <div className="relative border border-zinc-800/80 bg-zinc-950/40 rounded-xl p-2 select-none overflow-hidden h-[300px]">
      <svg 
        width="100%" 
        height={height} 
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {links.map((link, idx) => {
          const s = nodes.find((n) => n.id === link.source);
          const t = nodes.find((n) => n.id === link.target);
          if (!s || !t) return null;

          const isHighlighted = selectedNodeId 
            ? (link.source === selectedNodeId || link.target === selectedNodeId)
            : true;

          return (
            <line
              key={idx}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={isHighlighted ? '#10b981' : '#27272a'}
              strokeWidth={isHighlighted ? 1.5 : 0.8}
              strokeOpacity={isHighlighted ? 0.6 : 0.15}
              className="transition-all duration-300"
            />
          );
        })}

        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isHighlighted = selectedNodeId ? connectedNodeIds.has(node.id) : true;

          let radius = 5;
          let color = '#71717a';
          if (node.type === 'workspace') {
            radius = 10;
            color = '#10b981';
          } else if (node.type === 'research') {
            radius = 7;
            color = '#6366f1';
          }

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-grab active:cursor-grabbing select-none"
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={() => handleNodeClick(node)}
            >
              {isSelected && (
                <circle
                  r={radius + 5}
                  fill={color}
                  opacity={0.3}
                  className="animate-ping"
                />
              )}
              <circle
                r={radius}
                fill={color}
                opacity={isHighlighted ? 1 : 0.25}
                stroke="#18181b"
                strokeWidth={1.5}
                className="transition-opacity duration-300"
              />
              {node.type !== 'fact' && (
                <text
                  dy={radius + 10}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize={8}
                  opacity={isHighlighted ? 0.9 : 0.2}
                  className="pointer-events-none font-medium"
                >
                  {node.label.length > 12 ? node.label.slice(0, 10) + '..' : node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoveredNode && (
        <div className="absolute bottom-2 left-2 right-2 p-3 rounded-xl bg-zinc-900/95 border border-zinc-800 text-xs text-zinc-300 shadow-2xl pointer-events-none transition-all duration-200 backdrop-blur-sm space-y-1">
          <strong className="text-emerald-400 text-[13px] block">{hoveredNode.label}</strong>
          <p className="text-zinc-400 text-[11px] leading-relaxed">{hoveredNode.summary || 'No summary available.'}</p>
          {hoveredNode.keywords && hoveredNode.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 py-1">
              {hoveredNode.keywords.map((kw: string, idx: number) => (
                <span key={idx} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] text-zinc-400 border border-zinc-700/50">
                  #{kw}
                </span>
              ))}
            </div>
          )}
          {hoveredNode.type === 'research' && (
            <div className="grid grid-cols-2 gap-x-4 pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-500">
              <span>Sources: <span className="text-zinc-300">{hoveredNode.sourcesCount}</span></span>
              <span>Citations: <span className="text-zinc-300">{hoveredNode.citationsCount}</span></span>
              <span className="col-span-2 mt-0.5">Updated: <span className="text-zinc-300">{new Date(hoveredNode.updatedAt || '').toLocaleDateString()}</span></span>
            </div>
          )}
        </div>
      )}

      {!hoveredNode && (
        <div className="absolute top-2 right-2 text-[9px] text-zinc-500 pointer-events-none">
          Click nodes to jump & filter paths
        </div>
      )}
    </div>
  );
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

export default function RightPanel({ activeTab, onTabChange, researchId, workspaceId }: RightPanelProps) {
  const tree = treeData[researchId as keyof typeof treeData] || treeData['gaming-laptop']

  const [dbTopics, setDbTopics] = useState<any[]>([])
  const [researchTitle, setResearchTitle] = useState('')
  const [memoryView, setMemoryView] = useState<'graph' | 'list'>('graph')
  const [isExpanded, setIsExpanded] = useState(false)
  const [dbSources, setDbSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const containerWidth = isExpanded ? 550 : 270;

  // Form states
  const [newMemory, setNewMemory] = useState('')
  const [showAddSource, setShowAddSource] = useState(false)
  const [newSourceDomain, setNewSourceDomain] = useState('')
  const [newSourceTitle, setNewSourceTitle] = useState('')
  const [newSourceTrust, setNewSourceTrust] = useState(90)
  const [newSourceUrl, setNewSourceUrl] = useState('')

  // Load data
  useEffect(() => {
    if (!researchId) return

    async function loadData() {
      setLoading(true)
      try {
        if (activeTab === 'memory') {
          // Fetch research metadata for title
          const metaRes = await fetch(`/api/research/${researchId}`)
          const metaData = await metaRes.json()
          if (metaRes.ok) setResearchTitle(metaData.research?.title || 'Research Hub')

          // Fetch topic graph nodes
          const res = await fetch(`/api/research/${researchId}/topics`)
          const data = await res.json()
          if (res.ok) setDbTopics(data.topics || [])
        } else if (activeTab === 'sources') {
          const res = await fetch(`/api/research/${researchId}/sources`)
          const data = await res.json()
          if (res.ok) setDbSources(data.sources || [])
        }
      } catch (err) {
        console.error('Error fetching right panel data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    const handleResearchCleared = (e: Event) => {
      const eventDetail = (e as CustomEvent).detail
      if (eventDetail?.researchId === researchId) {
        setDbTopics([])
        setDbSources([])
      }
    }
    window.addEventListener('research-cleared', handleResearchCleared)

    return () => {
      window.removeEventListener('research-cleared', handleResearchCleared)
    }
  }, [researchId, activeTab, workspaceId])

  // CRUD Actions
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemory.trim() || !researchId) return

    try {
      const res = await fetch(`/api/research/${researchId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMemory.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.memory) {
        setDbMemories((prev) => [...prev, data.memory])
        setNewMemory('')
      }
    } catch (err) {
      console.error('Error adding memory:', err)
    }
  }

  const handleDeleteMemory = async (id: string) => {
    if (!researchId) return
    try {
      const res = await fetch(`/api/research/${researchId}/memory?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDbMemories((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (err) {
      console.error('Error deleting memory:', err)
    }
  }

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSourceDomain.trim() || !newSourceTitle.trim() || !researchId) return

    try {
      const res = await fetch(`/api/research/${researchId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newSourceDomain.trim(),
          title: newSourceTitle.trim(),
          trust: Number(newSourceTrust),
          url: newSourceUrl.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.source) {
        setDbSources((prev) => [...prev, data.source])
        setNewSourceDomain('')
        setNewSourceTitle('')
        setNewSourceTrust(90)
        setNewSourceUrl('')
        setShowAddSource(false)
      }
    } catch (err) {
      console.error('Error adding source:', err)
    }
  }

  return (
    <div className={`border-l border-zinc-800/50 bg-zinc-900 flex flex-col h-screen transition-all duration-300 ${isExpanded ? 'w-[600px]' : 'w-80'}`}>
      {/* Tabs */}
      <div className="flex border-b border-zinc-800/50 items-center">
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
          Graph
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
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-3 border-b-2 border-transparent text-zinc-500 hover:text-white transition-colors ml-auto cursor-pointer"
          title={isExpanded ? "Collapse panel" : "Expand panel"}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        )}

        {!loading && activeTab === 'tree' && (
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

        {!loading && activeTab === 'memory' && (
          <div className="p-6 space-y-4">
            {/* View Selector Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {memoryView === 'graph' ? 'Semantic Graph' : 'Topic List'}
              </h4>
              <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700/50">
                <button
                  onClick={() => setMemoryView('graph')}
                  className={`p-1.5 rounded-md transition-colors ${
                    memoryView === 'graph'
                      ? 'bg-zinc-700 text-emerald-400'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Graph View"
                >
                  <Network className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMemoryView('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    memoryView === 'list'
                      ? 'bg-zinc-700 text-emerald-400'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {memoryView === 'graph' ? (
              <div className="space-y-4">
                <TopicGraph topics={dbTopics} researchTitle={researchTitle} width={containerWidth} />
                {dbTopics.length === 0 && (
                  <p className="text-xs text-zinc-500 italic text-center py-4">No research topics to visualize yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {dbTopics.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-zinc-800 rounded-lg border border-zinc-700/50 hover:border-zinc-700 transition-colors group flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-sm text-white">{item.title}</strong>
                        {item.parentId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                            Sub-topic
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{item.summary}</p>
                      {item.keywords && item.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.keywords.map((kw: string, idx: number) => (
                            <span key={idx} className="text-[10px] text-emerald-400">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {dbTopics.length === 0 && (
                    <p className="text-xs text-zinc-500 italic text-center py-4">No topics recorded yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'related' && (
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

        {!loading && activeTab === 'sources' && (
          <div className="p-6 space-y-4">
            {/* Add Source button and form */}
            {!showAddSource ? (
              <Button
                onClick={() => setShowAddSource(true)}
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs flex items-center gap-1 py-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Research Source
              </Button>
            ) : (
              <form onSubmit={handleAddSource} className="bg-zinc-850 p-3 rounded-lg border border-zinc-700 space-y-3">
                <input
                  type="text"
                  required
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  placeholder="Source Title"
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                />
                <input
                  type="text"
                  required
                  value={newSourceDomain}
                  onChange={(e) => setNewSourceDomain(e.target.value)}
                  placeholder="Domain (e.g. nvidia.com)"
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newSourceTrust}
                  onChange={(e) => setNewSourceTrust(Number(e.target.value))}
                  placeholder="Trust rating (0-100)"
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                />
                <input
                  type="url"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="URL (optional)"
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                />
                <div className="flex gap-2 text-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddSource(false)}
                    className="flex-1 py-1 h-auto text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1 h-auto">
                    Save Source
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {dbSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-700 hover:bg-zinc-700/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{source.domain}</p>
                      <p className="text-sm text-zinc-300 mt-1 leading-snug">{source.title}</p>
                    </div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-500 hover:text-zinc-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
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
              {dbSources.length === 0 && (
                <p className="text-xs text-zinc-500 italic text-center py-4">No sources recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
