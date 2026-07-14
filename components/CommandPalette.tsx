'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, FileText, File, BookOpen, HelpCircle, Calendar, PlusCircle, X } from 'lucide-react';
import { globalSearchAction, SearchResult } from '@/app/actions/searchActions';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // Listen to Cmd/Ctrl + K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Real-time search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await globalSearchAction(query);
        setResults(searchResults);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  const quickActions = [
    { label: 'Go to Dashboard', url: '/dashboard', icon: FileText },
    { label: 'Open Study Calendar', url: '/workspace?tab=planner', icon: Calendar },
    { label: 'Create New Note', url: '/workspace?tab=notes', icon: PlusCircle },
    { label: 'Upload Document', url: '/workspace?tab=documents', icon: File },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl glassmorphism"
          >
            {/* Input field */}
            <div className="flex items-center border-b px-4 py-3">
              <Search className="mr-3 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents, notes, flashcards, quizzes..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                autoFocus
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results pane */}
            <div className="max-h-[350px] overflow-y-auto p-2">
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">
                  Searching database...
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Search Results
                  </div>
                  {results.map(res => {
                    const Icon = res.type === 'document' ? File : res.type === 'note' ? FileText : res.type === 'flashcard' ? BookOpen : HelpCircle;
                    return (
                      <button
                        key={res.id}
                        onClick={() => handleSelect(res.url)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <Icon className="mr-3 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 overflow-hidden">
                          <p className="font-medium truncate">{res.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{res.subtitle}</p>
                        </div>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                          Go to
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}

              {/* Quick Actions (only show when query is empty) */}
              {!query && (
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Quick Actions
                  </div>
                  {quickActions.map((act, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(act.url)}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    >
                      <act.icon className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                  <div className="border-t mt-2 pt-2 px-2 flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Use ↑↓ to navigate</span>
                    <span className="flex items-center gap-1">
                      Press <kbd className="border bg-muted px-1 rounded">esc</kbd> to close
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
