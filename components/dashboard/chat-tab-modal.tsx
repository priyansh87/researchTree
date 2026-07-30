'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X, Settings } from 'lucide-react';

interface ChatTabModalProps {
  isOpen: boolean;
  onClose: () => void;
  researchId: string;
  tabToEdit?: { id: string; name: string; memoryMode: string; selectedNodeIds: string[] } | null;
  onSave: (tabData: { name: string; memoryMode: string; selectedNodeIds: string[] }) => void;
}

export default function ChatTabModal({
  isOpen,
  onClose,
  researchId,
  tabToEdit,
  onSave,
}: ChatTabModalProps) {
  const [name, setName] = useState('');
  const [memoryMode, setMemoryMode] = useState('research');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (tabToEdit) {
      setName(tabToEdit.name);
      setMemoryMode(tabToEdit.memoryMode);
      setSelectedNodes(tabToEdit.selectedNodeIds || []);
    } else {
      setName('');
      setMemoryMode('research');
      setSelectedNodes([]);
    }
  }, [tabToEdit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadTopics() {
      setLoadingTopics(true);
      try {
        const res = await fetch(`/api/research/${researchId}/topics`);
        const data = await res.json();
        if (res.ok) {
          setAvailableTopics(data.topics || []);
        }
      } catch (err) {
        console.error('Failed to load research topics for tab setup:', err);
      } finally {
        setLoadingTopics(false);
      }
    }

    loadTopics();
  }, [researchId, isOpen]);

  const handleToggleNode = (nodeId: string) => {
    setSelectedNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      memoryMode,
      selectedNodeIds: memoryMode === 'custom' ? selectedNodes : [],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            {tabToEdit ? 'Configure Chat Tab' : 'Create Custom Chat Tab'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tab Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Tab Title / Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Selective GPU Chat"
              maxLength={26}
              className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Memory Scope */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Memory Path / Scope
            </label>
            <select
              value={memoryMode}
              onChange={(e) => setMemoryMode(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="research" className="bg-zinc-900 text-white">This Research Card Memory (Default)</option>
              <option value="workspace" className="bg-zinc-900 text-white">All Workspace Memory (Cross-Card)</option>
              <option value="custom" className="bg-zinc-900 text-white">Custom Topic Nodes (Selective Knowledge Paths)</option>
            </select>
            <p className="text-zinc-500 text-[11px] mt-1.5 leading-relaxed">
              {memoryMode === 'research' && 'Restricts context search only to items and memories learned within this card.'}
              {memoryMode === 'workspace' && 'Includes all memory logs, preferences, and facts learned across all research cards in this workspace.'}
              {memoryMode === 'custom' && 'Select specific topic nodes from your research knowledge map below. The agent will ignore facts from all other topics.'}
            </p>
          </div>

          {/* Selective Checklist (Custom Mode) */}
          {memoryMode === 'custom' && (
            <div className="border border-zinc-800/80 rounded-xl p-4 bg-zinc-950/20 space-y-3">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Select Active Topic Nodes
              </label>

              {loadingTopics ? (
                <div className="flex items-center justify-center py-4 gap-2 text-zinc-400 text-xs">
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                  Loading topics list...
                </div>
              ) : availableTopics.length === 0 ? (
                <p className="text-zinc-500 text-xs italic py-2">
                  No topic nodes have been discovered in this research yet. Generate research reports first!
                </p>
              ) : (
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  {availableTopics.map((topic) => {
                    const isChecked = selectedNodes.includes(topic.id);
                    return (
                      <label
                        key={topic.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleNode(topic.id)}
                          className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900 accent-emerald-500"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold">{topic.title}</span>
                          <span className="text-[10px] text-zinc-500 line-clamp-1">{topic.summary}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 bg-zinc-950/50 border-t border-zinc-800/80 flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/10"
          >
            {tabToEdit ? 'Save Changes' : 'Create Tab'}
          </Button>
        </div>
      </div>
    </div>
  );
}
