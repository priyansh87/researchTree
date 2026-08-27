'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Plus, Trash2, Loader2, Network, List, Maximize2, Minimize2, ChevronLeft, Headphones, Play, Pause, RotateCcw, Volume2, Sparkles, HelpCircle, Layers, Table, BookOpen, Presentation, Video } from 'lucide-react'

interface RightPanelProps {
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
  summary?: string;
  keywords?: string[];
  updatedAt?: string;
  sourcesCount?: number;
  citationsCount?: number;
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
      type: 'workspace',
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
        type: 'research',
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
        </div>
      )}
    </div>
  );
}

export default function RightPanel({ researchId, workspaceId }: RightPanelProps) {
  const [dbTopics, setDbTopics] = useState<any[]>([])
  const [researchTitle, setResearchTitle] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  // Studio Tools Navigation State
  const [activeTool, setActiveTool] = useState<
    null | 'audio' | 'slides' | 'graph' | 'flashcards' | 'quiz' | 'datatable'
  >(null)

  // Audio summary states
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(25)
  const [audioVolume, setAudioVolume] = useState(80)

  // Flashcards state
  const [activeCardIdx, setActiveCardIdx] = useState(0)
  const [isCardFlipped, setIsCardFlipped] = useState(false)

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [showQuizResults, setShowQuizResults] = useState(false)

  // Load data
  useEffect(() => {
    if (!researchId) return

    async function loadData() {
      setLoading(true)
      try {
        const metaRes = await fetch(`/api/research/${researchId}`)
        const metaData = await metaRes.json()
        if (metaRes.ok) setResearchTitle(metaData.research?.title || 'Research Hub')

        const res = await fetch(`/api/research/${researchId}/topics`)
        const data = await res.json()
        if (res.ok) setDbTopics(data.topics || [])
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
      }
    }
    window.addEventListener('research-cleared', handleResearchCleared)

    return () => {
      window.removeEventListener('research-cleared', handleResearchCleared)
    }
  }, [researchId, workspaceId])

  const containerWidth = isExpanded ? 550 : 270;

  // Flashcards mock data
  const mockFlashcards = [
    { front: 'TLS 1.3 Ephemeral Key Exchange (ECDHE)', back: 'Generates a unique, dynamic cryptographic key for every session to guarantee forward secrecy if a master key is compromised later.' },
    { front: 'Vapor Chamber Cooling', back: 'An advanced thermal solution that spreads heat uniformly over a flat surface, vaporizing and condensing liquid to cool high-performance chips.' },
    { front: 'Battery Performance under Efficiency Mode', back: 'ASUS TUF averages 6-7 hours, Lenovo Legion achieves 7-8 hours, and MSI Raider offers only 3-4 hours due to GPU power demand.' },
    { front: 'Key Exchange Step in Handshake', back: 'Both parties agree on algorithms and utilize pre-master secrets. In RSA, the client encrypts this with the server\'s public key.' }
  ]

  // Quiz mock data
  const mockQuiz = [
    {
      q: 'Which laptop provides the best class-leading battery optimization under efficiency mode?',
      options: ['ASUS TUF A16', 'Lenovo Legion 5 Pro', 'MSI Raider GE78 HX', 'Acer Nitro V'],
      answer: 1 // Lenovo Legion
    },
    {
      q: 'What standard protocol reduces round-trips for faster, more secure internet handshakes?',
      options: ['TLS 1.2', 'SSL 3.0', 'TLS 1.3', 'HTTP/2'],
      answer: 2 // TLS 1.3
    },
    {
      q: 'What is the average safe temperature range for gaming laptops under loading conditions?',
      options: ['45-55°C', '75-85°C', '95-105°C', '110-120°C'],
      answer: 1 // 75-85°C
    }
  ]

  // Audio timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioProgress((prev) => (prev >= 100 ? 0 : prev + 0.5))
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className={`border-l border-zinc-900 bg-[#111113] rounded-2xl flex flex-col h-full shadow-2xl transition-all duration-300 shrink-0 select-none overflow-hidden ${isExpanded ? 'w-[600px]' : 'w-80'}`}>
      {/* Header */}
      <div className="flex border-b border-zinc-900/50 p-4 items-center justify-between bg-[#111113] shrink-0">
        <div className="flex items-center gap-2">
          {activeTool && (
            <button 
              onClick={() => {
                setActiveTool(null)
                setIsCardFlipped(false)
              }}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer mr-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {activeTool ? activeTool.toUpperCase() : 'Studio'}
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title={isExpanded ? "Collapse panel" : "Expand panel"}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        )}

        {!loading && !activeTool && (
          <div className="p-4 space-y-4">
            {/* Audio Overview Banner card */}
            <div className="p-4 bg-gradient-to-br from-indigo-950/60 to-purple-950/30 border border-indigo-900/50 rounded-2xl flex flex-col gap-3 relative shadow-md hover:border-indigo-700/50 transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shrink-0">
                  <Headphones className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase">Create Audio Overview</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Generate structured audio guides in Hindi, English, Bengali, Tamil, Telugu, and more.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTool('audio')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/10"
              >
                Listen Now
              </button>
            </div>

            {/* Studio Tools Grid */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Mind Map */}
              <button
                onClick={() => setActiveTool('graph')}
                className="flex items-center gap-3 p-3.5 bg-zinc-900/35 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                  <Network className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-white">Mind Map</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Interactive force semantic graph</p>
                </div>
              </button>

              {/* Quiz */}
              <button
                onClick={() => setActiveTool('quiz')}
                className="flex items-center gap-3 p-3.5 bg-zinc-900/35 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="p-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-white">Interactive Quiz</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Test your research retention</p>
                </div>
              </button>

              {/* Flashcards */}
              <button
                onClick={() => setActiveTool('flashcards')}
                className="flex items-center gap-3 p-3.5 bg-zinc-900/35 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-white">Flashcards</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Review key definitions</p>
                </div>
              </button>

              {/* Data Table */}
              <button
                onClick={() => setActiveTool('datatable')}
                className="flex items-center gap-3 p-3.5 bg-zinc-900/35 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg shrink-0">
                  <Table className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-white">Data Table</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Tabulate structural research metrics</p>
                </div>
              </button>

              {/* Slide Deck */}
              <button
                onClick={() => setActiveTool('slides')}
                className="flex items-center gap-3 p-3.5 bg-zinc-900/35 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg shrink-0">
                  <Presentation className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-zinc-200 group-hover:text-white">Slide Deck</p>
                    <span className="px-1.5 py-0.2 bg-zinc-800 text-[8px] font-bold text-zinc-400 rounded uppercase">Beta</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Visual briefing presentations</p>
                </div>
              </button>

              {/* Video Overview */}
              <button
                onClick={() => alert('Video Overview generated. Output will be saved under Workspace folders.')}
                className="flex items-center gap-3 p-3.5 bg-zinc-900/35 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-white">Video Overview</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Create short simulated recap clip</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 1. Audio Overview Tool */}
        {!loading && activeTool === 'audio' && (
          <div className="p-5 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-md">
                <Headphones className="w-8 h-8" />
              </div>
              <h4 className="text-xs font-bold text-white tracking-wide uppercase">Audio Overview Player</h4>
              <p className="text-[10px] text-zinc-500 leading-snug">
                Podcast summary compiling top findings from your PDF & Web sources.
              </p>
            </div>

            {/* Player controller box */}
            <div className="p-5 bg-zinc-900/50 border border-zinc-850 rounded-2xl space-y-4 shadow-inner">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">
                <span>Podcast Episode 1</span>
                <span className="text-emerald-400">HQ Streaming</span>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-1 bg-zinc-800 rounded-full relative overflow-hidden cursor-pointer">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${audioProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500 font-semibold font-mono">
                  <span>01:14</span>
                  <span>04:30</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 py-2">
                <button 
                  onClick={() => setAudioProgress(25)}
                  className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Rewind"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                </button>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Volume2 className="w-4 h-4" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(Number(e.target.value))}
                    className="w-12 h-1 accent-indigo-500 bg-zinc-800 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Mind Map / Topic Graph Tool */}
        {!loading && activeTool === 'graph' && (
          <div className="p-5 space-y-4">
            <h4 className="text-xs font-bold text-white tracking-wide uppercase mb-2">Topic Knowledge Graph</h4>
            <TopicGraph topics={dbTopics} researchTitle={researchTitle} width={containerWidth} />
            {dbTopics.length === 0 && (
              <p className="text-xs text-zinc-500 italic text-center py-4">No topics mapped out yet.</p>
            )}
          </div>
        )}

        {/* 3. Interactive Quiz Tool */}
        {!loading && activeTool === 'quiz' && (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">Generated Quiz Challenge</p>
            </div>

            <div className="space-y-5">
              {mockQuiz.map((q, qIdx) => (
                <div key={qIdx} className="space-y-2.5">
                  <p className="text-xs font-bold text-zinc-200">
                    {qIdx + 1}. {q.q}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 pl-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[qIdx] === optIdx
                      const isCorrect = q.answer === optIdx
                      
                      let btnStyle = "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      if (isSelected) {
                        if (showQuizResults) {
                          btnStyle = isCorrect 
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                            : "bg-red-500/10 border-red-500/40 text-red-400"
                        } else {
                          btnStyle = "bg-violet-500/10 border-violet-500/40 text-violet-400"
                        }
                      } else if (showQuizResults && isCorrect) {
                        btnStyle = "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={showQuizResults}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                          className={`w-full text-left px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-900 flex gap-2">
              {!showQuizResults ? (
                <Button
                  onClick={() => setShowQuizResults(true)}
                  disabled={Object.keys(quizAnswers).length < mockQuiz.length}
                  className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-xl cursor-pointer"
                >
                  Submit Answers
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setQuizAnswers({})
                    setShowQuizResults(false)
                  }}
                  className="w-full bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs py-2 rounded-xl cursor-pointer"
                >
                  Reset Quiz
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 4. Flashcards Tool */}
        {!loading && activeTool === 'flashcards' && (
          <div className="p-5 space-y-6">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-3">
              <span>Dynamic Flashcard Deck</span>
              <span className="text-zinc-400">{activeCardIdx + 1} / {mockFlashcards.length}</span>
            </div>

            {/* Flashcard container with flip animation */}
            <div 
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="w-full h-44 cursor-pointer relative group perspective-1000"
            >
              <div className={`w-full h-full duration-500 transform-style-3d relative ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front Side */}
                <div className="absolute inset-0 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center backface-hidden shadow-md">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase mb-3">Front</span>
                  <p className="text-xs font-bold text-zinc-100 px-3">
                    {mockFlashcards[activeCardIdx].front}
                  </p>
                  <span className="text-[9px] text-zinc-500 font-semibold italic mt-4 uppercase">Click to flip card</span>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 shadow-md">
                  <span className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase mb-3">Answer</span>
                  <p className="text-[11px] font-semibold text-zinc-200 px-2 leading-relaxed">
                    {mockFlashcards[activeCardIdx].back}
                  </p>
                  <span className="text-[9px] text-zinc-500 font-semibold italic mt-4 uppercase">Click to flip back</span>
                </div>
              </div>
            </div>

            {/* Flashcard pagination actions */}
            <div className="flex items-center justify-between gap-3 pt-3">
              <Button
                variant="outline"
                disabled={activeCardIdx === 0}
                onClick={() => {
                  setActiveCardIdx(prev => prev - 1)
                  setIsCardFlipped(false)
                }}
                className="flex-1 py-1.5 h-auto text-xs font-bold border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 rounded-xl"
              >
                Previous Card
              </Button>
              <Button
                variant="outline"
                disabled={activeCardIdx === mockFlashcards.length - 1}
                onClick={() => {
                  setActiveCardIdx(prev => prev + 1)
                  setIsCardFlipped(false)
                }}
                className="flex-1 py-1.5 h-auto text-xs font-bold border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 rounded-xl"
              >
                Next Card
              </Button>
            </div>
          </div>
        )}

        {/* 5. Data Table Tool */}
        {!loading && activeTool === 'datatable' && (
          <div className="p-4 space-y-4">
            <h4 className="text-xs font-bold text-white tracking-wide uppercase border-b border-zinc-900 pb-2">Laptop Specifications</h4>
            <div className="overflow-x-auto rounded-xl border border-zinc-850">
              <table className="w-full text-[11px] text-zinc-300 bg-zinc-900/10">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-zinc-850 text-white font-bold">
                    <th className="px-3 py-2 text-left">Specs</th>
                    <th className="px-2 py-2">ASUS TUF</th>
                    <th className="px-2 py-2">Lenovo</th>
                    <th className="px-2 py-2">MSI Raider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-zinc-400 bg-zinc-900/10">GPU</td>
                    <td className="px-2 py-2 text-center">RTX 4060</td>
                    <td className="px-2 py-2 text-center">RTX 4060</td>
                    <td className="px-2 py-2 text-center">RTX 4090</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-zinc-400 bg-zinc-900/10">CPU</td>
                    <td className="px-2 py-2 text-center">Ryzen 9</td>
                    <td className="px-2 py-2 text-center">Ryzen 7</td>
                    <td className="px-2 py-2 text-center">Core i9</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-zinc-400 bg-zinc-900/10">Battery</td>
                    <td className="px-2 py-2 text-center">6-7 hrs</td>
                    <td className="px-2 py-2 text-center">7-8 hrs</td>
                    <td className="px-2 py-2 text-center">3-4 hrs</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-zinc-400 bg-zinc-900/10">Price</td>
                    <td className="px-2 py-2 text-center">$1499</td>
                    <td className="px-2 py-2 text-center">$999</td>
                    <td className="px-2 py-2 text-center">$2499</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Slides Briefing Tool */}
        {!loading && activeTool === 'slides' && (
          <div className="p-5 space-y-5">
            <h4 className="text-xs font-bold text-white tracking-wide uppercase border-b border-zinc-900 pb-2">Briefing Slides</h4>
            
            {/* Simple slide viewer */}
            <div className="aspect-video bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-inner">
              <div>
                <span className="text-[8px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 font-bold rounded uppercase">Slide 1 of 2</span>
                <h5 className="text-xs font-bold text-white mt-2 border-b border-zinc-800 pb-1.5">Executive Summary</h5>
                <ul className="list-disc pl-3.5 space-y-1 mt-2 text-[10px] text-zinc-350">
                  <li>Comparison of RTX 40-series laptops for budget and heavy workloads.</li>
                  <li>Lenovo Legion offers top-tier value at $999.</li>
                  <li>TLS 1.3 implementation reduces handshake round-trips.</li>
                </ul>
              </div>
              <div className="text-[8px] text-zinc-500 text-right font-medium">Research Tree briefings</div>
            </div>
            
            <Button
              onClick={() => alert('Slide deck generated. Output saved to Workspace folders.')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs py-2 rounded-xl cursor-pointer"
            >
              Export Slide Presentation
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Note section */}
      <div className="border-t border-zinc-900 p-4 bg-[#111113]/85 backdrop-blur-md relative shrink-0">
        <p className="text-[10px] text-zinc-500 leading-normal mb-3 pr-20 select-none">
          Studio output will be saved here. After adding sources, click to generate Audio Overview, quizzes, data tables, and study guides!
        </p>
        <button
          onClick={() => alert('Feature incoming: Add notes directly to your personal research log.')}
          className="absolute right-4 bottom-4 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Add note
        </button>
      </div>
    </div>
  )
}
