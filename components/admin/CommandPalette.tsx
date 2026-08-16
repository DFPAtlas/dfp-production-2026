'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/components/motion';
import { useGlobalSearch, highlightMatch } from '@/hooks/useGlobalSearch';
import { useRecentRecords } from '@/hooks/useRecentRecords';
import { useRecentSearches } from '@/hooks/useRecentRecords';
import { getQuickCreateActions, getLucideIcon } from '@/lib/search-registry';
import type { SearchResultItem, CommandItem, QuickCreateAction } from '@/lib/search-registry';
import {
  Search, ArrowRight, CornerDownLeft, X, Clock, History, Plus, Command,
  Loader2, AlertTriangle, FolderKanban, Users, UserCircle, Target,
  FileText, Bug, MessageSquare, Sparkles, ListTodo, Shield, Phone,
  Mail, Stethoscope, UserPlus, FolderPlus, LayoutDashboard,
} from 'lucide-react';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, UserCircle, FolderKanban, Target, FileText, Bug, MessageSquare,
  Sparkles, ListTodo, Shield, Phone, Mail, Stethoscope, UserPlus, FolderPlus,
  LayoutDashboard,
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { query, results, commands, loading, partialFailures, search, clearSearch } = useGlobalSearch();
  const { records: recentRecords, addRecord } = useRecentRecords();
  const { searches: recentSearches, addSearch: addRecentSearch } = useRecentSearches();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const quickCreateActions = getQuickCreateActions();

  const groupedResults = groupByType(results);
  const allSelectableItems = buildSelectableList(inputValue, commands, groupedResults, recentRecords, quickCreateActions);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setInputValue('');
      clearSearch();
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open, clearSearch]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [inputValue]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    search(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allSelectableItems.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = allSelectableItems[selectedIndex];
      if (item) handleSelect(item);
    }
  };

  const handleSelect = useCallback((item: SelectableItem) => {
    if (item.type === 'record') {
      addRecord({
        type: item.data.type,
        id: item.data.id,
        label: item.data.label,
        route: item.data.route,
        icon: item.data.icon,
      });
      addRecentSearch(inputValue);
      router.push(item.data.route);
    } else if (item.type === 'command') {
      addRecentSearch(inputValue);
      if (item.data.route) {
        router.push(item.data.route);
      } else if (item.data.execute) {
        item.data.execute();
      }
    } else if (item.type === 'recent') {
      addRecord({
        type: item.data.type,
        id: item.data.id,
        label: item.data.label,
        route: item.data.route,
        icon: item.data.icon,
      });
      router.push(item.data.route);
    } else if (item.type === 'quickCreate') {
      router.push(item.data.route);
    }
    onClose();
  }, [router, onClose, addRecord, addRecentSearch, inputValue]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  const hasResults = results.length > 0;
  const hasCommands = commands.length > 0;
  const showRecent = !inputValue && inputValue.length === 0 && recentRecords.length > 0;
  const showQuickCreate = !inputValue && inputValue.length === 0;
  const showNoResults = inputValue.length >= 2 && !loading && !hasResults && !hasCommands;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-xl bg-[#1E293B] border border-[rgba(255,255,255,0.10)] rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, leads, projects, invoices..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <Loader2 className="w-4 h-4 text-[#06B6D4] animate-spin shrink-0" />}
          {!loading && (
            <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-[rgba(255,255,255,0.08)] text-[10px] text-slate-500 font-mono">
              <span className="text-xs">esc</span>
            </kbd>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto p-2" role="listbox">
          {partialFailures.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Some modules unavailable: {partialFailures.join(', ')}. Results may be incomplete.
            </div>
          )}

          {showRecent && (
            <div className="mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <History className="w-3 h-3" /> Recent
              </div>
              {recentRecords.slice(0, 5).map((rec, i) => {
                const isSelected = selectedIndex === i;
                return (
                  <button
                    key={`${rec.type}-${rec.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      addRecord({ type: rec.type, id: rec.id, label: rec.label, route: rec.route, icon: rec.icon });
                      router.push(rec.route);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${isSelected ? 'bg-[#06B6D4]/10 text-white' : 'text-slate-300 hover:bg-white/[0.03]'}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec.label}</p>
                      <p className="text-[10px] text-slate-500">{rec.type}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {hasResults && (
            <div className="space-y-3">
              {Object.entries(groupedResults).map(([typeKey, items]) => {
                const moduleLabel = typeKey.charAt(0).toUpperCase() + typeKey.slice(1).replace(/_/g, ' ');
                return (
                  <div key={typeKey}>
                    <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {renderIcon(items[0].icon)} {moduleLabel}
                    </div>
                    {items.map((result) => {
                      const idx = allSelectableItems.findIndex(
                        (si) => si.type === 'record' && si.data.id === result.id && si.data.type === result.type
                      );
                      const isSelected = idx === selectedIndex && idx >= 0;
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect({ type: 'record', data: result })}
                          onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${isSelected ? 'bg-[#06B6D4]/10 text-white' : 'text-slate-300 hover:bg-white/[0.03]'}`}
                        >
                          <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            {renderIcon(result.icon)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {inputValue ? renderHighlighted(result.label, inputValue) : result.label}
                            </p>
                            {(result.secondary || result.status) && (
                              <p className="text-[10px] text-slate-500 truncate">
                                {result.secondary}{result.secondary && result.status ? ' · ' : ''}
                                {result.status && <span className="capitalize">{result.status.replace(/_/g, ' ')}</span>}
                              </p>
                            )}
                          </div>
                          {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {hasCommands && (
            <div className={hasResults ? 'mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]' : ''}>
              <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <Command className="w-3 h-3" /> Commands
              </div>
              {commands.map((cmd) => {
                const idx = allSelectableItems.findIndex(
                  (si) => si.type === 'command' && si.data.id === cmd.id
                );
                const isSelected = idx === selectedIndex && idx >= 0;
                return (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect({ type: 'command', data: cmd })}
                    onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${isSelected ? 'bg-[#06B6D4]/10 text-white' : 'text-slate-300 hover:bg-white/[0.03]'}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {renderIcon(cmd.icon)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cmd.label}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{cmd.category}</p>
                    </div>
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {showQuickCreate && (
            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <Plus className="w-3 h-3" /> Quick Create
              </div>
              {quickCreateActions.map((action) => {
                const idx = allSelectableItems.findIndex(
                  (si) => si.type === 'quickCreate' && si.data.id === action.id
                );
                const isSelected = idx === selectedIndex && idx >= 0;
                return (
                  <button
                    key={action.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect({ type: 'quickCreate', data: action })}
                    onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${isSelected ? 'bg-[#06B6D4]/10 text-white' : 'text-slate-300 hover:bg-white/[0.03]'}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                      {renderIcon(action.icon)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{action.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{action.description}</p>
                    </div>
                    {isSelected && <Plus className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {showNoResults && (
            <div className="text-center py-10">
              <Search className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No results found</p>
              <p className="text-xs text-slate-500 mt-1">Try a different search term</p>
            </div>
          )}

          {!showRecent && !hasResults && !hasCommands && !showQuickCreate && !showNoResults && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">Start typing to search across all records</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[rgba(255,255,255,0.06)] text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/5 border border-[rgba(255,255,255,0.06)] font-mono">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/5 border border-[rgba(255,255,255,0.06)] font-mono">↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/5 border border-[rgba(255,255,255,0.06)] font-mono">Esc</kbd> Close</span>
          </div>
          {results.length > 0 && (
            <span className="text-slate-600">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function renderIcon(iconName: string) {
  const Comp = ICON_COMPONENTS[getLucideIcon(iconName)];
  if (Comp) return <Comp className="w-4 h-4 text-slate-400" />;
  return <Search className="w-4 h-4 text-slate-400" />;
}

function renderHighlighted(text: string, query: string) {
  const hl = highlightMatch(text, query);
  if (!hl) return <>{text}</>;
  return (
    <>
      {hl.before}
      <span className="text-[#06B6D4] font-semibold">{hl.match}</span>
      {hl.after}
    </>
  );
}

function groupByType(results: SearchResultItem[]): Record<string, SearchResultItem[]> {
  const groups: Record<string, SearchResultItem[]> = {};
  results.forEach((r) => {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  });
  return groups;
}

type SelectableItem =
  | { type: 'record'; data: SearchResultItem }
  | { type: 'command'; data: CommandItem }
  | { type: 'recent'; data: { type: string; id: string; label: string; route: string; icon: string } }
  | { type: 'quickCreate'; data: QuickCreateAction };

function buildSelectableList(
  query: string,
  commands: CommandItem[],
  groupedResults: Record<string, SearchResultItem[]>,
  recentRecords: { type: string; id: string; label: string; route: string; icon: string }[],
  quickCreateActions: QuickCreateAction[]
): SelectableItem[] {
  const items: SelectableItem[] = [];

  if (!query) {
    recentRecords.slice(0, 5).forEach((r) => items.push({ type: 'recent', data: r }));
    quickCreateActions.forEach((a) => items.push({ type: 'quickCreate', data: a }));
    return items;
  }

  Object.values(groupedResults).forEach((group) => {
    group.forEach((r) => items.push({ type: 'record', data: r }));
  });

  commands.forEach((c) => items.push({ type: 'command', data: c }));

  return items;
}