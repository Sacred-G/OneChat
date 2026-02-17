"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Check, 
  CheckSquare,
  Square,
  Settings, 
  Loader2,
  Package,
  ChevronDown,
  ChevronUp,
  Zap,
  Info
} from 'lucide-react';
import useConnectorsStore from '@/stores/useConnectorsStore';

interface ComposioToolkit {
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  categories: string[];
  toolsCount: number;
  triggersCount: number;
}

// Normalize category from API — can be a string or { slug, name } object
function getCategoryLabel(cat: any): string {
  if (typeof cat === 'string') return cat;
  if (cat?.name) return cat.name;
  if (cat?.slug) return cat.slug;
  return String(cat);
}

export default function ConnectorManager() {
  const {
    composioSelectedToolkits,
    setComposioSelectedToolkits,
    toggleComposioToolkit,
  } = useConnectorsStore();

  const [toolkits, setToolkits] = useState<ComposioToolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSelected, setShowSelected] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [apiCategories, setApiCategories] = useState<string[]>([]);

  const fetchToolkits = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '200');
      params.set('sortBy', 'usage');

      const response = await fetch(`/api/composio/catalog?${params.toString()}`);
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch toolkits');
      }

      // Normalize toolkit categories to string arrays
      const normalized = (data.toolkits || []).map((tk: any) => ({
        ...tk,
        categories: (tk.categories || []).map(getCategoryLabel),
      }));

      if (cursor) {
        setToolkits(prev => [...prev, ...normalized]);
      } else {
        setToolkits(normalized);
      }
      setNextCursor(data.nextCursor);
      if (data.categories) {
        setApiCategories(data.categories);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Composio toolkits');
      console.error('Error fetching toolkits:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchToolkits();
  }, [fetchToolkits]);

  // Use API-provided categories, or extract from toolkits
  const categories = useMemo(() => {
    if (apiCategories.length > 0) return apiCategories;
    const catSet = new Set<string>();
    toolkits.forEach(tk => {
      tk.categories?.forEach(cat => catSet.add(cat));
    });
    return Array.from(catSet).sort();
  }, [toolkits, apiCategories]);

  // Filter toolkits by search + category + showSelected
  const filteredToolkits = useMemo(() => {
    let filtered = toolkits;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(tk =>
        tk.name.toLowerCase().includes(q) ||
        tk.slug.toLowerCase().includes(q) ||
        tk.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tk =>
        tk.categories?.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase())
      );
    }

    if (showSelected) {
      filtered = filtered.filter(tk =>
        composioSelectedToolkits.includes(tk.slug)
      );
    }

    return filtered;
  }, [toolkits, searchQuery, selectedCategory, showSelected, composioSelectedToolkits]);

  const allFilteredSelected = filteredToolkits.length > 0 &&
    filteredToolkits.every(tk => composioSelectedToolkits.includes(tk.slug));

  const someFilteredSelected = filteredToolkits.some(tk =>
    composioSelectedToolkits.includes(tk.slug)
  );

  const handleSelectAll = () => {
    const filteredSlugs = filteredToolkits.map(tk => tk.slug);
    const existing = new Set(composioSelectedToolkits);
    filteredSlugs.forEach(s => existing.add(s));
    setComposioSelectedToolkits(Array.from(existing));
  };

  const handleDeselectAll = () => {
    const filteredSlugs = new Set(filteredToolkits.map(tk => tk.slug));
    setComposioSelectedToolkits(
      composioSelectedToolkits.filter(s => !filteredSlugs.has(s))
    );
  };

  const handleSelectAllVisible = () => {
    if (allFilteredSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-stone-500">Loading Composio toolkits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-3">{error}</p>
        <button
          onClick={() => fetchToolkits()}
          className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-stone-400" />
          <h3 className="text-lg font-medium text-white">Composio Toolkits</h3>
          <span className="text-xs bg-stone-800 text-stone-200 px-2 py-0.5 rounded-full">
            {toolkits.length} available
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-emerald-500" />
          <span className="text-stone-300">
            <strong className="text-emerald-400">{composioSelectedToolkits.length}</strong> selected
          </span>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Select the toolkits you want your AI agent to access. The agent uses Composio&apos;s meta tools to discover, authenticate, and execute actions from selected toolkits at runtime — no need to load all tools into context.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search toolkits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => setShowSelected(!showSelected)}
          className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
            showSelected
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          {showSelected ? 'Show All' : 'Show Selected'}
        </button>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center justify-between py-2 px-1">
        <button
          onClick={handleSelectAllVisible}
          className="inline-flex items-center gap-2 text-sm text-stone-300 hover:text-white transition-colors"
        >
          {allFilteredSelected ? (
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          ) : someFilteredSelected ? (
            <div className="w-4 h-4 border-2 border-emerald-400 rounded bg-emerald-100 flex items-center justify-center">
              <div className="w-2 h-0.5 bg-emerald-500 rounded" />
            </div>
          ) : (
            <Square className="w-4 h-4 text-stone-400" />
          )}
          {allFilteredSelected ? 'Deselect All' : 'Select All'}
          <span className="text-stone-400">({filteredToolkits.length})</span>
        </button>
        {composioSelectedToolkits.length > 0 && (
          <button
            onClick={() => setComposioSelectedToolkits([])}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear all selections
          </button>
        )}
      </div>

      {/* Toolkit grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
        {filteredToolkits.map(tk => {
          const isSelected = composioSelectedToolkits.includes(tk.slug);
          return (
            <button
              key={tk.slug}
              onClick={() => toggleComposioToolkit(tk.slug)}
              className={`flex items-start gap-3 p-4 border rounded-lg text-left transition-all hover:shadow-sm ${
                isSelected
                  ? 'border-emerald-300 bg-emerald-50/60'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              {/* Logo or fallback */}
              <div className="shrink-0 w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden">
                {tk.logo ? (
                  <img
                    src={tk.logo}
                    alt={tk.name}
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>';
                    }}
                  />
                ) : (
                  <Package className="w-5 h-5 text-stone-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-stone-900 truncate">
                    {tk.name}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </div>
                {tk.description && (
                  <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">
                    {tk.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {tk.toolsCount > 0 && (
                    <span className="text-[10px] text-stone-400">
                      {tk.toolsCount} tools
                    </span>
                  )}
                  {tk.categories?.[0] && (
                    <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                      {tk.categories[0]}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredToolkits.length === 0 && (
        <div className="text-center py-8 text-stone-500 text-sm">
          {showSelected
            ? 'No toolkits selected yet. Toggle "Show All" to browse.'
            : 'No toolkits match your search.'}
        </div>
      )}

      {/* Load more */}
      {nextCursor && !showSelected && (
        <div className="text-center pt-2">
          <button
            onClick={() => fetchToolkits(nextCursor)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 text-sm rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Load More
          </button>
        </div>
      )}

      {/* Footer note */}
      <div className="mt-4 p-3 bg-stone-50 rounded-lg">
        <p className="text-xs text-stone-500">
          <strong>How it works:</strong> When Composio is enabled, the agent gets 5 meta tools
          (Search, Manage Connections, Execute, Workbench, Bash) scoped to your selected toolkits.
          Authentication happens on-demand when the agent needs a specific service.
        </p>
      </div>
    </div>
  );
}
