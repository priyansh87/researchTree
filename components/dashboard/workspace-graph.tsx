'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Network, HelpCircle, Layers } from 'lucide-react';

interface WorkspaceGraphProps {
  workspaceId: string;
  onNavigate: (researchId: string, topicTitle?: string, keywords?: string[]) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'hub' | 'research' | 'topic';
  researchId?: string;
  summary?: string;
  keywords?: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

function runWorkspaceForceLayout(nodes: GraphNode[], links: GraphLink[], width: number, height: number) {
  // Initialize positions in a circle
  nodes.forEach((node, i) => {
    if (node.x === undefined) {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = 100 + Math.random() * 50;
      node.x = width / 2 + radius * Math.cos(angle);
      node.y = height / 2 + radius * Math.sin(angle);
      node.vx = 0;
      node.vy = 0;
    }
  });

  // Run simulation iterations
  const iterations = 80;
  const linkDistance = 60;
  const chargeForce = -80;
  const linkStrength = 0.15;
  const centerGravity = 0.04;

  for (let step = 0; step < iterations; step++) {
    // 1. Link force (attraction)
    links.forEach((link) => {
      const s = nodes.find((n) => n.id === link.source);
      const t = nodes.find((n) => n.id === link.target);
      if (!s || !t) return;

      const dx = t.x! - s.x!;
      const dy = t.y! - s.y!;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (distance - linkDistance) * linkStrength;

      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      s.vx! += fx;
      s.vy! += fy;
      t.vx! -= fx;
      t.vy! -= fy;
    });

    // 2. Charge force (repulsion)
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n2.x! - n1.x!;
        const dy = n2.y! - n1.y!;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        if (distance < 220) {
          const force = (chargeForce / (distance * distance)) * 25;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          n1.vx! += fx;
          n1.vy! += fy;
          n2.vx! -= fx;
          n2.vy! -= fy;
        }
      }
    }

    // 3. Center gravity and update positions
    nodes.forEach((node) => {
      if (node.type === 'hub') {
        // Keep hub close to center
        node.x = width / 2;
        node.y = height / 2;
        return;
      }

      const centerDx = width / 2 - node.x!;
      const centerDy = height / 2 - node.y!;
      node.vx! += centerDx * centerGravity;
      node.vy! += centerDy * centerGravity;

      node.vx! *= 0.8;
      node.vy! *= 0.8;

      node.x! += node.vx!;
      node.y! += node.vy!;
    });
  }

  // Constrain to container
  nodes.forEach((node) => {
    node.x = Math.max(30, Math.min(width - 30, node.x!));
    node.y = Math.max(30, Math.min(height - 30, node.y!));
  });
}

export default function WorkspaceGraph({ workspaceId, onNavigate }: WorkspaceGraphProps) {
  const [topics, setTopics] = useState<any[]>([]);
  const [researchCards, setResearchCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const width = 800;
  const height = 500;

  useEffect(() => {
    if (!workspaceId) return;

    async function loadWorkspaceTopics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/topics`);
        const data = await res.json();
        if (res.ok) {
          setTopics(data.topics || []);
          setResearchCards(data.research || []);
        }
      } catch (err) {
        console.error('Failed to load workspace graph topics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaceTopics();
  }, [workspaceId]);

  useEffect(() => {
    const nodeList: GraphNode[] = [];
    const linkList: GraphLink[] = [];

    // 1. Central Workspace Hub Node
    nodeList.push({
      id: 'workspace-hub',
      label: 'Workspace Hub',
      type: 'hub',
      summary: 'Central hub containing all research topics in this workspace.',
    });

    // 2. Add Research Cards
    researchCards.forEach((rc) => {
      nodeList.push({
        id: `rc-${rc.id}`,
        label: rc.title,
        type: 'research',
        researchId: rc.id,
        summary: `Research Card project: ${rc.title}`,
      });
      linkList.push({ source: 'workspace-hub', target: `rc-${rc.id}` });
    });

    // 3. Add Topics mapped to Research Cards or parents
    topics.forEach((t) => {
      nodeList.push({
        id: `t-${t.id}`,
        label: t.title,
        type: 'topic',
        researchId: t.researchId,
        summary: t.summary,
        keywords: t.keywords || [],
      });

      if (t.parentId) {
        linkList.push({ source: `t-${t.parentId}`, target: `t-${t.id}` });
      } else {
        linkList.push({ source: `rc-${t.researchId}`, target: `t-${t.id}` });
      }
    });

    runWorkspaceForceLayout(nodeList, linkList, width, height);

    setNodes(nodeList);
    setLinks(linkList);
  }, [topics, researchCards]);

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
              x: Math.max(30, Math.min(width - 30, x)),
              y: Math.max(30, Math.min(height - 30, y)),
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
    if (node.type === 'research' && node.researchId) {
      onNavigate(node.researchId);
    } else if (node.type === 'topic' && node.researchId) {
      // Navigate to chat and trigger event to scroll/highlight
      onNavigate(node.researchId, node.label, node.keywords || []);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 border-r border-zinc-800/50 p-12">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 text-sm mt-3">Synthesizing workspace knowledge map...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 border-r border-zinc-800/50 p-8 select-none">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-emerald-400 animate-pulse" />
            Workspace Knowledge Map
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore concepts and projects non-linearly. Hover to inspect, click to expand connections or open chats.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 rounded-lg text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Workspace
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> Research Cards
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-zinc-500 rounded-full"></span> Topics
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex-1 min-h-[450px] relative border border-zinc-800/80 bg-zinc-950/40 rounded-2xl p-4 overflow-hidden shadow-2xl flex items-center justify-center">
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${width} ${height}`} 
          className="overflow-visible max-w-4xl max-h-[500px]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Links */}
          {links.map((link, idx) => {
            const s = nodes.find((n) => n.id === link.source);
            const t = nodes.find((n) => n.id === link.target);
            if (!s || !t) return null;

            const isHighlighted = selectedNodeId
              ? link.source === selectedNodeId || link.target === selectedNodeId
              : true;

            return (
              <line
                key={idx}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={isHighlighted ? '#10b981' : '#27272a'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={isHighlighted ? 0.7 : 0.15}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHighlighted = selectedNodeId ? connectedNodeIds.has(node.id) : true;

            let radius = 10;
            let color = '#71717a';
            if (node.type === 'hub') {
              radius = 18;
              color = '#10b981';
            } else if (node.type === 'research') {
              radius = 13;
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
                    r={radius + 8}
                    fill={color}
                    opacity={0.25}
                    className="animate-ping"
                  />
                )}
                <circle
                  r={radius}
                  fill={color}
                  opacity={isHighlighted ? 1 : 0.2}
                  stroke="#18181b"
                  strokeWidth={2}
                  className="transition-opacity duration-300 shadow-md"
                />
                <text
                  dy={radius + 14}
                  textAnchor="middle"
                  fill="#e4e4e7"
                  fontSize={10}
                  opacity={isHighlighted ? 0.95 : 0.3}
                  className="pointer-events-none font-semibold text-shadow"
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + '..' : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover inspect card */}
        {hoveredNode && (
          <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-zinc-900/95 border border-zinc-800 text-sm text-zinc-300 shadow-2xl pointer-events-none transition-all duration-200 backdrop-blur-md max-w-md mx-auto space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                hoveredNode.type === 'hub' ? 'bg-emerald-500' : hoveredNode.type === 'research' ? 'bg-indigo-500' : 'bg-zinc-400'
              }`}></span>
              <strong className="text-white text-[15px]">{hoveredNode.label}</strong>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 ml-auto bg-zinc-800 px-2 py-0.5 rounded">
                {hoveredNode.type}
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">{hoveredNode.summary || 'No summary available.'}</p>
            {hoveredNode.keywords && hoveredNode.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hoveredNode.keywords.map((kw, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700/50">
                    #{kw}
                  </span>
                ))}
              </div>
            )}
            <div className="text-[10px] text-zinc-500 italic pt-1 border-t border-zinc-800/80">
              Click node to navigate directly into this section
            </div>
          </div>
        )}

        {/* Empty state instruction */}
        {!hoveredNode && (
          <div className="absolute top-4 left-4 text-xs text-zinc-500 flex items-center gap-1.5 pointer-events-none">
            <HelpCircle className="w-4 h-4 text-zinc-600" />
            Double-click or click topic nodes to explore details in chat
          </div>
        )}
      </div>
    </div>
  );
}
